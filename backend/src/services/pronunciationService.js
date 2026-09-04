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
       FROM pronunciation_items pi
       WHERE pi.language = $1
         AND pi.is_active = true
         AND pi.content_status = 'validated'
         ${diff ? 'AND pi.difficulty = $4' : ''}
         AND pi.item_id NOT IN (
           SELECT pa.item_id
           FROM pronunciation_attempts pa
           WHERE pa.student_id = $2
             AND pa.created_at > NOW() - INTERVAL '24 hours'
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
       FROM pronunciation_items pi
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
       FROM pronunciation_items pi
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
     FROM pronunciation_items
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
    `SELECT audio_url FROM pronunciation_items WHERE item_id = $1 LIMIT 1`,
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
        `UPDATE pronunciation_items SET audio_url = $1, updated_at = NOW() WHERE item_id = $2`,
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
    `SELECT syllable_audio_urls FROM pronunciation_items WHERE item_id = $1 LIMIT 1`,
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
         FROM pronunciation_items,
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
      `UPDATE pronunciation_items SET syllable_audio_urls = $1, updated_at = NOW() WHERE item_id = $2`,
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
 * Record a student's pronunciation attempt and return updated XP.
 *
 * @param {string} studentId  Student UUID
 * @param {string} itemId        Pronunciation item UUID
 * @param {number} score         Accuracy score 0–100
 * @param {number} xpEarned      XP awarded for this attempt
 * @param {string|null} sessionId Unique session identifier
 * @param {boolean} isPassed     Whether this attempt passed the benchmark
 * @returns {Promise<{attemptId: string, xpEarned: number, attemptsCount: number}>}
 */
async function logAttempt(studentId, itemId, score, xpEarned = 0, sessionId = null, isPassed = false) {
  try {
    let existingAttempt = null;

    if (sessionId) {
      // Look for an existing attempt row for this item in the same session
      const { rows } = await db.query(
        `SELECT attempt_id, score, xp_earned, attempts_count, is_passed
         FROM pronunciation_attempts
         WHERE student_id = $1 AND item_id = $2 AND session_id = $3
         LIMIT 1`,
        [studentId, itemId, sessionId]
      );
      if (rows && rows.length > 0) {
        existingAttempt = rows[0];
      }
    } else {
      // Fallback if no sessionId: check if attempted on this item within the last 30 minutes
      const { rows } = await db.query(
        `SELECT attempt_id, score, xp_earned, attempts_count, is_passed
         FROM pronunciation_attempts
         WHERE student_id = $1 AND item_id = $2 AND created_at > NOW() - INTERVAL '30 minutes'
         ORDER BY created_at DESC
         LIMIT 1`,
        [studentId, itemId]
      );
      if (rows && rows.length > 0) {
        existingAttempt = rows[0];
      }
    }

    if (existingAttempt) {
      // Override/update the existing attempt: increment attempt counter, keep highest score and XP
      const newAttemptsCount = (existingAttempt.attempts_count || 1) + 1;
      const bestScore = Math.max(existingAttempt.score || 0, score);
      const bestXp = Math.max(existingAttempt.xp_earned || 0, xpEarned);
      const passedStatus = Boolean(existingAttempt.is_passed || isPassed);

      const { rows } = await db.query(
        `UPDATE pronunciation_attempts
         SET score = $1,
             xp_earned = $2,
             attempts_count = $3,
             is_passed = $4,
             created_at = NOW()
         WHERE attempt_id = $5
         RETURNING attempt_id AS "attemptId", xp_earned AS "xpEarned", attempts_count AS "attemptsCount"`,
        [bestScore, bestXp, newAttemptsCount, passedStatus, existingAttempt.attempt_id]
      );
      return rows[0];
    } else {
      // First attempt for this item in this session: INSERT
      const { rows } = await db.query(
        `INSERT INTO pronunciation_attempts (student_id, item_id, score, xp_earned, session_id, attempts_count, is_passed)
         VALUES ($1, $2, $3, $4, $5, 1, $6)
         RETURNING attempt_id AS "attemptId", xp_earned AS "xpEarned", attempts_count AS "attemptsCount"`,
        [studentId, itemId, score, xpEarned, sessionId, Boolean(isPassed)]
      );
      return rows[0];
    }
  } catch (err) {
    console.warn('[pronunciationService.logAttempt] Notice:', err.message);
    // Graceful fallback for legacy database schemas
    const { rows } = await db.query(
      `INSERT INTO pronunciation_attempts (student_id, item_id, score, xp_earned)
       VALUES ($1, $2, $3, $4)
       RETURNING attempt_id AS "attemptId", xp_earned AS "xpEarned"`,
      [studentId, itemId, score, xpEarned]
    );
    return rows[0];
  }
}

/**
 * Get a student's practice history for a specific item.
 *
 * @param {string} studentId
 * @param {string} itemId
 * @returns {Promise<object[]>}
 */
async function getAttemptHistory(studentId, itemId) {
  const { rows } = await db.query(
    `SELECT
       attempt_id AS "attemptId",
       score,
       xp_earned AS "xpEarned",
       created_at AS "createdAt"
     FROM pronunciation_attempts
     WHERE student_id = $1 AND item_id = $2
     ORDER BY created_at DESC
     LIMIT 10`,
    [studentId, itemId]
  );
  return rows;
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
    `SELECT item_id FROM pronunciation_items WHERE LOWER(word) = LOWER($1) AND language = $2 LIMIT 1`,
    [word, lang]
  );
  if (existing.rows.length > 0) {
    throw new Error(`Duplicate: "${word}" (${lang}) already exists in the content pool.`);
  }

  const { rows } = await db.query(
    `INSERT INTO pronunciation_items
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
    `UPDATE pronunciation_items
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
  getAttemptHistory,
  insertItem,
  setContentStatus,
};

