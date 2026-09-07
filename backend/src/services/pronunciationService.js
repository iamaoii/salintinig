/**
 * SalinTinig — Pronunciation Content Service
 *
 * Single access layer for all pronunciation challenge DB operations.
 * The activity and controller never query pronunciation tables directly —
 * all reads/writes go through this service.
 *
 * Content pool model:
 *   content_status = 'validated' → available to students
 *   content_status = 'pending'   → awaiting review (hidden from students)
 *   content_status = 'inactive'  → disabled (hidden from students)
 *
 * Source values:
 *   'system'               → seeded by the SalinTinig seed scripts
 *   'dictionary_api'       → imported via an external dictionary API
 *   'educational_material' → imported from DepEd / Phil-IRI materials
 *   'admin'                → manually added by an authorized admin
 *   'imported_dataset'     → bulk-imported from an external dataset
 */

const db = require('../config/db.js');
const { synthesizeTextToAudio } = require('./ttsService.js');

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT POOL — ITEM RETRIEVAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a session's worth of validated pronunciation items for a student.
 *
 * Prioritizes words the student has NOT recently attempted.
 * Falls back to the full validated pool if the student has practiced most of it.
 *
 * @param {string} language  'fil' (Filipino) or 'eng' (English)
 * @param {number} limit     Number of items to return (default: 10)
 * @param {string|null} studentId  Student UUID — used to deprioritize recent attempts
 * @param {string|null} difficulty Optional difficulty tier: 'easy', 'medium', 'hard'
 * @returns {Promise<object[]>}
 */
async function getSessionItems(language = 'fil', limit = 10, studentId = null, difficulty = null) {
  const raw = (language || 'fil').toLowerCase();
  const lang = (raw.startsWith('en')) ? 'en' : 'fil';
  const safeLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 50);
  const diff = difficulty && ['easy', 'medium', 'hard'].includes(difficulty.toLowerCase())
    ? difficulty.toLowerCase()
    : null;

  let itemsList = [];

  // Try to exclude recently attempted items (last 24h) for variety
  if (studentId) {
    const query = `
      SELECT
         pi.item_id AS "itemId",
         pi.word,
         pi.translation,
         pi.definition,
         pi.example_sentence AS "exampleSentence",
         pi.syllables,
         pi.audio_url AS "audioUrl",
         pi.syllable_audio_urls AS "syllableAudioUrls",
         pi.language,
         pi.difficulty,
         pi.source
       FROM vocabulary_bank pi
       WHERE pi.language = $1
         AND pi.is_active = true
         AND pi.content_status = 'validated'
         ${diff ? 'AND pi.difficulty = $4' : ''}
         AND NOT EXISTS (
           SELECT 1
           FROM pronunciation_attempts pa,
                jsonb_array_elements(pa.items_detail) elem
           WHERE pa.student_id = $2
             AND pa.created_at > NOW() - INTERVAL '24 hours'
             AND elem->>'itemId' = pi.item_id::text
         )
       ORDER BY RANDOM()
       LIMIT $3`;
    const params = diff ? [lang, studentId, safeLimit, diff] : [lang, studentId, safeLimit];
    const { rows: fresh } = await db.query(query, params);

    // If we got enough fresh items, return them
    if (fresh.length >= Math.min(safeLimit, 5)) {
      itemsList = fresh;
    }
  }

  // Fallback: return any validated items matching criteria
  if (itemsList.length === 0) {
    const fallbackQuery = `
      SELECT
         pi.item_id AS "itemId",
         pi.word,
         pi.translation,
         pi.definition,
         pi.example_sentence AS "exampleSentence",
         pi.syllables,
         pi.audio_url AS "audioUrl",
         pi.syllable_audio_urls AS "syllableAudioUrls",
         pi.language,
         pi.difficulty,
         pi.source
       FROM vocabulary_bank pi
       WHERE pi.language = $1
         AND pi.is_active = true
         AND pi.content_status = 'validated'
         ${diff ? 'AND pi.difficulty = $3' : ''}
       ORDER BY RANDOM()
       LIMIT $2`;
    const fallbackParams = diff ? [lang, safeLimit, diff] : [lang, safeLimit];
    const { rows } = await db.query(fallbackQuery, fallbackParams);
    itemsList = rows;
  }

  // Second fallback: if a specific difficulty didn't have enough words, relax difficulty filter
  if (itemsList.length === 0 && diff) {
    const { rows } = await db.query(
      `SELECT
         pi.item_id AS "itemId",
         pi.word,
         pi.translation,
         pi.definition,
         pi.example_sentence AS "exampleSentence",
         pi.syllables,
         pi.audio_url AS "audioUrl",
         pi.syllable_audio_urls AS "syllableAudioUrls",
         pi.language,
         pi.difficulty,
         pi.source
       FROM vocabulary_bank pi
       WHERE pi.language = $1
         AND pi.is_active = true
         AND pi.content_status = 'validated'
       ORDER BY RANDOM()
       LIMIT $2`,
      [lang, safeLimit]
    );
    itemsList = rows;
  }

  // Background proactive pre-warm: ensure syllable audios exist in DB so mobile gets zero-delay playback
  Promise.all(
    itemsList.map(async (item) => {
      if (!item.syllableAudioUrls || !Array.isArray(item.syllableAudioUrls) || item.syllableAudioUrls.length === 0) {
        try {
          const generated = await getOrGenerateSyllableAudios(item.itemId, item.syllables, item.language);
          item.syllableAudioUrls = generated;
        } catch (_) {}
      }
    })
  ).catch(() => {});

  return itemsList;
}

/**
 * Fetch a single pronunciation item by its ID.
 *
 * @param {string} itemId  UUID of the pronunciation item
 * @returns {Promise<object|null>}
 */
async function getItemById(itemId) {
  const { rows } = await db.query(
    `SELECT
       item_id AS "itemId",
       word, translation, definition,
       example_sentence AS "exampleSentence",
       syllables, audio_url AS "audioUrl",
       language, difficulty, content_status AS "contentStatus", source
     FROM vocabulary_bank
     WHERE item_id = $1
     LIMIT 1`,
    [itemId]
  );
  return rows[0] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// REFERENCE AUDIO (Cache-first TTS)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the reference audio URL for a pronunciation item.
 * Cache-first: if audio_url is already stored, returns it immediately.
 * Otherwise generates via Edge-TTS, saves the URL to the DB, then returns it.
 *
 * @param {string} itemId    UUID of the pronunciation item
 * @param {string} word      Target word text
 * @param {string} language  'fil' or 'en'
 * @returns {Promise<string|null>}  Cloudinary audio URL or null on failure
 */
async function getOrGenerateAudio(itemId, word, language) {
  // 1. Return cached URL if it already exists
  const { rows: existing } = await db.query(
    `SELECT audio_url FROM vocabulary_bank WHERE item_id = $1 LIMIT 1`,
    [itemId]
  );
  if (existing[0]?.audio_url) return existing[0].audio_url;

  // 2. Generate via Edge-TTS into language-specific Cloudinary words folder
  try {
    const langKey = (language || 'fil').toLowerCase().startsWith('en') ? 'en' : 'fil';
    const wordFolder = langKey === 'en' ? 'salintinig/pronunciation/words/eng' : 'salintinig/pronunciation/words/fil';
    const result = await synthesizeTextToAudio(word, langKey, '0%', null, wordFolder);
    const audioUrl = result?.audioUrl || null;



    if (audioUrl) {
      // 3. Persist to DB so future requests use the cache
      await db.query(
        `UPDATE vocabulary_bank SET audio_url = $1, updated_at = NOW() WHERE item_id = $2`,
        [audioUrl, itemId]
      );
    }

    return audioUrl;
  } catch (err) {
    console.error(`[pronunciationService] TTS failed for "${word}":`, err.message);
    return null;
  }
}

/**
 * Returns an array of syllable audio objects: [{ syllable: "Ba", audioUrl: "https://..." }]
 * Cache-first: if syllable_audio_urls is populated in DB, returns it.
 * Otherwise synthesizes each syllable into salintinig/pronunciation/syllables,
 * persists the array to the DB, and returns it.
 */
async function getOrGenerateSyllableAudios(itemId, syllables, language) {
  if (!syllables || !Array.isArray(syllables) || syllables.length === 0) return [];

  // 1. Check DB cache
  const { rows } = await db.query(
    `SELECT syllable_audio_urls FROM vocabulary_bank WHERE item_id = $1 LIMIT 1`,
    [itemId]
  );
  const cached = rows[0]?.syllable_audio_urls;
  if (Array.isArray(cached) && cached.length === syllables.length && cached.every(s => s && s.audioUrl)) {
    return cached;
  }

  // 2. Generate missing syllable audio via Edge-TTS (or reuse existing syllable audio across items for the SAME language)
  const langKey = (language || 'fil').toLowerCase().startsWith('en') ? 'en' : 'fil';
  const langFolder = langKey === 'en' ? 'salintinig/pronunciation/syllables/eng' : 'salintinig/pronunciation/syllables/fil';
  const resultList = [];

  for (const syl of syllables) {
    try {
      // Check if this exact syllable (for the SAME language group) already exists in another item's syllable_audio_urls
      const existingSylRes = await db.query(
        `SELECT elem->>'audioUrl' as audio_url
         FROM vocabulary_bank,
              jsonb_array_elements(syllable_audio_urls) as elem
         WHERE (
           CASE 
             WHEN LOWER(language) IN ('en', 'eng') THEN 'en' 
             ELSE 'fil' 
           END
         ) = $1
           AND LOWER(elem->>'syllable') = LOWER($2)
           AND elem->>'audioUrl' IS NOT NULL
         LIMIT 1`,
        [langKey, syl]
      );

      let audioUrl = existingSylRes.rows[0]?.audio_url;

      if (!audioUrl) {
        // Synthesize new audio if not found into language-specific Cloudinary folder
        const res = await synthesizeTextToAudio(syl, langKey, '-12%', null, langFolder);
        audioUrl = res?.audioUrl || null;
      } else {
        console.log(`♻️ [Syllable Reuse] Reusing existing ${langKey.toUpperCase()} audio for syllable "${syl}": ${audioUrl}`);
      }

      resultList.push({
        syllable: syl,
        audioUrl: audioUrl,
      });
    } catch (e) {
      console.warn(`[pronunciationService] Failed to get/synthesize syllable "${syl}":`, e.message);
      resultList.push({ syllable: syl, audioUrl: null });
    }
  }

  // 3. Persist to DB
  try {
    await db.query(
      `UPDATE vocabulary_bank SET syllable_audio_urls = $1, updated_at = NOW() WHERE item_id = $2`,
      [JSON.stringify(resultList), itemId]
    );
  } catch (dbErr) {
    console.warn('[pronunciationService] Could not cache syllable_audio_urls in DB:', dbErr.message);
  }

  return resultList;
}


// ─────────────────────────────────────────────────────────────────────────────
// ATTEMPTS — STUDENT PRACTICE RECORDING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Record a student's pronunciation attempt (hybrid session or single-item) and award badges/XP.
 *
 * @param {object|string} param1  Student UUID (string) or session params object
 * @returns {Promise<{attemptId: string, xpEarned: number, newBadgeUnlocked: boolean}>}
 */
async function logAttempt(
  studentIdOrParams,
  itemId = null,
  score = 0,
  xpEarned = 0,
  sessionId = null,
  isPassed = false
) {
  let params = {};
  if (typeof studentIdOrParams === 'object' && studentIdOrParams !== null) {
    params = studentIdOrParams;
  } else {
    params = {
      studentId: studentIdOrParams,
      itemId,
      score,
      xpEarned,
      sessionId,
      isPassed,
    };
  }

  const {
    studentId,
    sessionId: sId = null,
    language = 'fil',
    difficulty = 'medium',
    totalWords = 5,
    mistakesCount = 0,
    score: attemptScore = 0,
    xpEarned: earnedXp = 0,
    itemsDetail = [],
    itemId: legacyItemId = null,
    isPassed: legacyPassed = false,
  } = params;

  let attemptId = null;
  let newBadgeUnlocked = false;

  try {
    let resolvedStudentId = studentId;
    if (studentId) {
      try {
        const stdCheck = await db.query(
          'SELECT student_id FROM students WHERE student_id::text = $1 OR user_id::text = $1 LIMIT 1',
          [studentId]
        );
        if (stdCheck.rows && stdCheck.rows.length > 0) {
          resolvedStudentId = stdCheck.rows[0].student_id;
        } else {
          const fallbackStd = await db.query('SELECT student_id FROM students LIMIT 1');
          if (fallbackStd.rows && fallbackStd.rows.length > 0) {
            resolvedStudentId = fallbackStd.rows[0].student_id;
          }
        }
      } catch (_) {}
    }

    if (!resolvedStudentId) {
      throw new Error('Valid student ID is required.');
    }

    // 1. Check for existing session attempt to prevent duplicates
    let existingAttempt = null;
    if (sId) {
      const { rows } = await db.query(
        `SELECT attempt_id, score, xp_earned, mistakes_count 
         FROM pronunciation_attempts 
         WHERE student_id = $1 AND session_id = $2 
         LIMIT 1`,
        [resolvedStudentId, sId]
      );
      if (rows && rows.length > 0) {
        existingAttempt = rows[0];
      }
    }

    const jsonItemsDetail = JSON.stringify(itemsDetail || []);

    if (existingAttempt) {
      const bestScore = Math.max(Number(existingAttempt.score) || 0, Number(attemptScore) || 0);
      const bestXp = Math.max(Number(existingAttempt.xp_earned) || 0, Number(earnedXp) || 0);

      const { rows } = await db.query(
        `UPDATE pronunciation_attempts
         SET score = $1,
             xp_earned = $2,
             mistakes_count = $3,
             difficulty = $4,
             language = $5,
             items_detail = $6,
             created_at = CURRENT_TIMESTAMP
         WHERE attempt_id = $7
         RETURNING attempt_id AS "attemptId"`,
        [
          bestScore,
          bestXp,
          mistakesCount,
          difficulty,
          language,
          jsonItemsDetail,
          existingAttempt.attempt_id,
        ]
      );
      attemptId = rows[0]?.attemptId || existingAttempt.attempt_id;
    } else {
      const { rows } = await db.query(
        `INSERT INTO pronunciation_attempts (
           student_id, session_id, language, difficulty, mistakes_count,
           score, xp_earned, items_detail, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
         RETURNING attempt_id AS "attemptId"`,
        [
          resolvedStudentId,
          sId,
          language,
          difficulty,
          mistakesCount,
          attemptScore,
          earnedXp,
          jsonItemsDetail,
        ]
      );
      attemptId = rows[0]?.attemptId;
    }

    // 2. Badge Check: "Sounds right!"
    // Criteria: student completed practice words accurately
    try {
      const passedItemsCount = Array.isArray(itemsDetail)
        ? itemsDetail.filter((it) => it.isPassed || (it.accuracyScore && it.accuracyScore >= 80)).length
        : (attemptScore >= 80 ? 1 : 0);

      if (passedItemsCount >= 3 || attemptScore >= 80) {
        const srBadge = await db.query(
          `SELECT badge_id FROM badges 
           WHERE LOWER(badge_name) LIKE '%sounds right%' 
              OR criteria_type = 'pronun_score' 
           LIMIT 1`
        );
        if (srBadge.rows && srBadge.rows.length > 0) {
          const srInsert = await db.query(
            `INSERT INTO student_badges (student_id, badge_id, earned_at)
             VALUES ($1, $2, CURRENT_TIMESTAMP)
             ON CONFLICT DO NOTHING
             RETURNING student_badge_id`,
            [resolvedStudentId, srBadge.rows[0].badge_id]
          );
          if (srInsert.rows && srInsert.rows.length > 0) {
            newBadgeUnlocked = true;
          }
        }
      }
    } catch (bErr) {
      console.warn('[pronunciationService.logAttempt] Sounds right badge notice:', bErr.message);
    }

    // 3. Badge Check: "First step"
    // "Complete your very first practice activity."
    try {
      const { rows: pCount } = await db.query(
        'SELECT COUNT(*) as count FROM pronunciation_attempts WHERE student_id = $1',
        [resolvedStudentId]
      );
      const { rows: vCount } = await db.query(
        'SELECT COUNT(*) as count FROM vocabulary_attempts WHERE student_id = $1',
        [resolvedStudentId]
      );
      const { rows: sCount } = await db.query(
        'SELECT COUNT(*) as count FROM sentence_attempts WHERE student_id = $1',
        [resolvedStudentId]
      );
      const totalActivities =
        (parseInt(pCount[0]?.count) || 0) +
        (parseInt(vCount[0]?.count) || 0) +
        (parseInt(sCount[0]?.count) || 0);

      if (totalActivities <= 1) {
        const fsBadge = await db.query(
          `SELECT badge_id FROM badges 
           WHERE LOWER(badge_name) LIKE '%first step%' 
              OR criteria_type = 'activity_count'
           LIMIT 1`
        );
        if (fsBadge.rows && fsBadge.rows.length > 0) {
          const fsInsert = await db.query(
            `INSERT INTO student_badges (student_id, badge_id, earned_at)
             VALUES ($1, $2, CURRENT_TIMESTAMP)
             ON CONFLICT DO NOTHING
             RETURNING student_badge_id`,
            [resolvedStudentId, fsBadge.rows[0].badge_id]
          );
          if (fsInsert.rows && fsInsert.rows.length > 0) {
            newBadgeUnlocked = true;
          }
        }
      }
    } catch (fsErr) {
      console.warn('[pronunciationService.logAttempt] First step badge notice:', fsErr.message);
    }

    return {
      attemptId,
      xpEarned: earnedXp,
      newBadgeUnlocked,
    };
  } catch (err) {
    console.warn('[pronunciationService.logAttempt] Notice:', err.message);
    const { rows } = await db.query(
      `INSERT INTO pronunciation_attempts (student_id, score, xp_earned)
       VALUES ($1, $2, $3)
       RETURNING attempt_id AS "attemptId", xp_earned AS "xpEarned"`,
      [params.studentId || resolvedStudentId, attemptScore, earnedXp]
    );
    return {
      attemptId: rows[0]?.attemptId,
      xpEarned: rows[0]?.xpEarned || earnedXp,
      newBadgeUnlocked: false,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT POOL MANAGEMENT (Admin/System use)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Insert a new pronunciation item from any content source.
 * Enforces duplicate prevention (word + language must be unique).
 *
 * @param {object} item
 * @param {string} item.word
 * @param {string} item.translation
 * @param {string} item.definition
 * @param {string} [item.exampleSentence]
 * @param {string[]} item.syllables
 * @param {string} item.language           'tl' or 'en'
 * @param {string} [item.source]           Content origin identifier
 * @param {string} [item.contentStatus]    'pending' | 'validated' (default: 'pending' for external sources)
 * @returns {Promise<object>}  The inserted row
 */
async function insertItem(item) {
  const {
    word, translation, definition, exampleSentence = null,
    syllables, language = 'fil',
    source = 'admin',
    contentStatus = 'pending',
  } = item;

  const rawLang = (language || 'fil').toLowerCase();
  const lang = (rawLang.startsWith('en')) ? 'en' : 'fil';

  // Duplicate prevention

  const existing = await db.query(
    `SELECT item_id FROM vocabulary_bank WHERE LOWER(word) = LOWER($1) AND language = $2 LIMIT 1`,
    [word, lang]
  );
  if (existing.rows.length > 0) {
    throw new Error(`Duplicate: "${word}" (${lang}) already exists in the content pool.`);
  }

  const { rows } = await db.query(
    `INSERT INTO vocabulary_bank
       (word, translation, definition, example_sentence, syllables, language, source, content_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING item_id AS "itemId", word, language, content_status AS "contentStatus"`,
    [word, translation, definition, exampleSentence, JSON.stringify(syllables), lang, source, contentStatus]
  );
  return rows[0];
}

/**
 * Update the content_status of an item (validate, deactivate, etc.)
 *
 * @param {string} itemId
 * @param {string} status  'pending' | 'validated' | 'inactive'
 * @returns {Promise<object>}
 */
async function setContentStatus(itemId, status) {
  const allowed = ['pending', 'validated', 'inactive'];
  if (!allowed.includes(status)) throw new Error(`Invalid content_status: "${status}". Must be one of: ${allowed.join(', ')}`);

  const { rows } = await db.query(
    `UPDATE vocabulary_bank
     SET content_status = $1, updated_at = NOW()
     WHERE item_id = $2
     RETURNING item_id AS "itemId", word, content_status AS "contentStatus"`,
    [status, itemId]
  );
  return rows[0] || null;
}

module.exports = {
  getSessionItems,
  getItemById,
  getOrGenerateAudio,
  getOrGenerateSyllableAudios,
  logAttempt,
  insertItem,
  setContentStatus,
};

