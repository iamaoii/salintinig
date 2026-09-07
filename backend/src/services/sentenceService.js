/**
 * SalinTinig — Sentence Arrangement Service
 *
 * Single access layer for Sentence Arrangement activity DB operations and sentence bank.
 * Provides curated DepEd-aligned sentences in Filipino and English across Easy, Medium, Hard tiers,
 * records student attempts in `sentence_attempts`, and awards badges.
 */

const db = require('../config/db');

// ─────────────────────────────────────────────────────────────────────────────
// CURATED DEEP DEPED-ALIGNED SENTENCE REPOSITORY (Filipino & English)
// ─────────────────────────────────────────────────────────────────────────────
const SENTENCE_REPOSITORY = {
  fil: {
    easy: [
      { text: 'Mabait si nanay.', translation: 'Mother is kind.' },
      { text: 'Masaya ang bata.', translation: 'The child is happy.' },
      { text: 'Pula ang mansanas.', translation: 'The apple is red.' },
      { text: 'Mabilis ang aso.', translation: 'The dog is fast.' },
      { text: 'Uminom ng tubig.', translation: 'Drink some water.' },
      { text: 'Malinis ang bahay.', translation: 'The house is clean.' },
      { text: 'Kumakain ang pusa.', translation: 'The cat is eating.' },
      { text: 'Matamis ang saging.', translation: 'The banana is sweet.' },
    ],
    medium: [
      { text: 'Naglalaro kami sa bakuran.', translation: 'We play in the yard.' },
      { text: 'Kumakain si kuya ng prutas.', translation: 'Older brother eats sweet fruit.' },
      { text: 'Malinis ang aming silid.', translation: 'Our classroom is very clean.' },
      { text: 'Nagbabasa ako ng bagong aklat.', translation: 'I read a new book.' },
      { text: 'Mataas ang berdeng puno.', translation: 'The green tree is tall.' },
      { text: 'Nagtanim si lolo ng mais.', translation: 'Grandfather planted fresh corn.' },
      { text: 'Masayang nag-aaral ang mga bata.', translation: 'The children study happily.' },
    ],
    hard: [
      { text: 'Masipag mag-aral ang mga mag-aaral.', translation: 'The students study very hard.' },
      { text: 'Tumutulong ako sa aking mga magulang.', translation: 'I help my own parents.' },
      { text: 'Mahalaga ang pagtatanim ng mga halaman.', translation: 'Planting green plants is very important.' },
      { text: 'Laging magsabi ng totoo sa lahat.', translation: 'Always tell truth to everyone.' },
      { text: 'Masayang sumayaw ang maliit na bata.', translation: 'The little child danced happily.' },
      { text: 'Igalang natin ang ating mga guro.', translation: 'Let us respect our kind teachers.' },
    ],
  },
  en: {
    easy: [
      { text: 'Mother is kind.', translation: 'Mabait si nanay.' },
      { text: 'The child is happy.', translation: 'Masaya ang bata.' },
      { text: 'The apple is red.', translation: 'Pula ang mansanas.' },
      { text: 'The dog is fast.', translation: 'Mabilis ang aso.' },
      { text: 'Drink some water.', translation: 'Uminom ng tubig.' },
      { text: 'The house is clean.', translation: 'Malinis ang bahay.' },
      { text: 'The cat is eating.', translation: 'Kumakain ang pusa.' },
      { text: 'The banana is sweet.', translation: 'Matamis ang saging.' },
    ],
    medium: [
      { text: 'We play in the yard.', translation: 'Naglalaro kami sa bakuran.' },
      { text: 'Older brother eats sweet fruit.', translation: 'Kumakain si kuya ng prutas.' },
      { text: 'Our classroom is very clean.', translation: 'Malinis ang aming silid.' },
      { text: 'I read a new book.', translation: 'Nagbabasa ako ng bagong aklat.' },
      { text: 'The green tree is tall.', translation: 'Mataas ang berdeng puno.' },
      { text: 'Grandfather planted fresh corn.', translation: 'Nagtanim si lolo ng mais.' },
      { text: 'The children study happily.', translation: 'Masayang nag-aaral ang mga bata.' },
    ],
    hard: [
      { text: 'The students study very hard.', translation: 'Masipag mag-aral ang mga mag-aaral.' },
      { text: 'I help my own parents.', translation: 'Tumutulong ako sa aking mga magulang.' },
      { text: 'Planting green plants is very important.', translation: 'Mahalaga ang pagtatanim ng mga halaman.' },
      { text: 'Always tell truth to everyone.', translation: 'Laging magsabi ng totoo sa lahat.' },
      { text: 'The little child danced happily.', translation: 'Masayang sumayaw ang maliit na bata.' },
      { text: 'Let us respect our kind teachers.', translation: 'Igalang natin ang ating mga guro.' },
    ],
  },
};

/**
 * Splits a sentence string into word tokens for arrangement.
 * Removes trailing periods/punctuation to keep tiles clean and accessible for early readers.
 */
function tokenizeSentence(sentence) {
  const cleaned = sentence.trim().replace(/[.,!?;:]+$/, '');
  return cleaned.split(/\s+/);
}

/**
 * Deterministic or randomized shuffle helper
 */
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  // Ensure the scrambled version is not already identical to the correct order if length > 1
  if (copy.length > 1 && copy.every((val, idx) => val === arr[idx])) {
    const temp = copy[0];
    copy[0] = copy[1];
    copy[1] = temp;
  }
  return copy;
}

/**
 * Fetch a session's worth of sentences for student practice.
 *
 * @param {string} language   'fil' | 'en' (default: 'fil')
 * @param {string} difficulty 'easy' | 'medium' | 'hard' (default: 'medium')
 * @param {number} limit      Number of sentences (default: 5)
 */
async function getSessionSentences(language = 'fil', difficulty = 'medium', limit = 5) {
  const lang = (language || 'fil').toLowerCase().startsWith('en') ? 'en' : 'fil';
  const diff = ['easy', 'medium', 'hard'].includes(String(difficulty).toLowerCase())
    ? String(difficulty).toLowerCase()
    : 'medium';

  const safeLimit = Math.min(Math.max(parseInt(limit) || 5, 1), 10);
  let selectedItems = [];

  // 1. Try querying from PostgreSQL sentence_bank
  try {
    const res = await db.query(
      `SELECT sentence_id, difficulty, text_fil, text_eng
       FROM sentence_bank
       WHERE difficulty = $1
       ORDER BY RANDOM()
       LIMIT $2`,
      [diff, safeLimit]
    );

    if (res.rows && res.rows.length > 0) {
      selectedItems = res.rows.map((row) => ({
        sentenceId: row.sentence_id,
        textFil: row.text_fil,
        textEng: row.text_eng,
      }));
    }
  } catch (dbErr) {
    console.warn('[sentenceService] sentence_bank DB query warning, falling back to memory pool:', dbErr.message);
  }

  // 2. Fallback to in-memory SENTENCE_REPOSITORY if DB returned fewer than requested
  if (selectedItems.length < safeLimit) {
    const langPool = SENTENCE_REPOSITORY[lang] || SENTENCE_REPOSITORY.fil;
    const pool = langPool[diff] || langPool.medium;
    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);

    for (const memItem of shuffledPool) {
      if (selectedItems.length >= safeLimit) break;
      const textFil = lang === 'en' ? memItem.translation : memItem.text;
      const textEng = lang === 'en' ? memItem.text : memItem.translation;
      const alreadyIncluded = selectedItems.some((s) => s.textFil.toLowerCase() === textFil.toLowerCase());
      if (!alreadyIncluded) {
        selectedItems.push({
          sentenceId: `sent_${diff}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          textFil,
          textEng,
        });
      }
    }
  }

  return selectedItems.map((item, index) => {
    // Cross-language translation setup:
    // When student selects 'fil' (English → Filipino):
    //   Prompt is in English (textEng), Student builds Filipino sentence (textFil).
    // When student selects 'en' (Filipino → English):
    //   Prompt is in Filipino (textFil), Student builds English sentence (textEng).
    const targetText = lang === 'fil' ? item.textFil : item.textEng;
    const promptText = lang === 'fil' ? item.textEng : item.textFil;
    const targetLang = lang;
    const promptLang = lang === 'fil' ? 'en' : 'fil';

    const targetTokens = tokenizeSentence(targetText);
    return {
      sentenceId: item.sentenceId || `sent_${lang}_${diff}_${index + 1}_${Date.now()}`,
      promptText: promptText,
      promptLanguage: promptLang,
      targetText: targetText,
      targetLanguage: targetLang,
      fullText: targetText,
      translation: promptText,
      language: lang,
      difficulty: diff,
      correctWords: targetTokens,
      scrambledWords: shuffleArray(targetTokens),
    };
  });
}

/**
 * Records a completed Sentence Arrangement attempt.
 * Checks and awards badges:
 *  - "Sentence builder": Finish activity without hitting retry / try again (mistakesCount === 0)
 *  - "First step": First practice activity completed
 */
async function logAttempt({
  studentId,
  sessionId = null,
  language = 'fil',
  difficulty = 'medium',
  totalSentences = 5,
  mistakesCount = 0,
  score = 100,
  xpEarned = 0,
  itemsDetail = [],
}) {
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

    // 1. Check for existing attempt in this session
    let existingAttempt = null;
    if (sessionId) {
      const existRes = await db.query(
        `SELECT attempt_id, score, xp_earned 
         FROM sentence_attempts 
         WHERE student_id = $1 AND session_id = $2 
         LIMIT 1`,
        [resolvedStudentId, sessionId]
      );
      if (existRes.rows && existRes.rows.length > 0) {
        existingAttempt = existRes.rows[0];
      }
    }

    const jsonItemsDetail = JSON.stringify(itemsDetail || []);

    if (existingAttempt) {
      const bestScore = Math.max(Number(existingAttempt.score) || 0, Number(score) || 0);
      const bestXp = Math.max(Number(existingAttempt.xp_earned) || 0, Number(xpEarned) || 0);

      const { rows } = await db.query(
        `UPDATE sentence_attempts
         SET score = $1,
             xp_earned = $2,
             mistakes_count = $3,
             difficulty = $4,
             language = $5,
             items_detail = $6,
             created_at = CURRENT_TIMESTAMP
         WHERE attempt_id = $7
         RETURNING attempt_id`,
        [bestScore, bestXp, mistakesCount, difficulty, language, jsonItemsDetail, existingAttempt.attempt_id]
      );
      attemptId = rows[0]?.attempt_id || existingAttempt.attempt_id;
    } else {
      const { rows } = await db.query(
        `INSERT INTO sentence_attempts (
           student_id, session_id, language, difficulty, mistakes_count, score, xp_earned, items_detail, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
         RETURNING attempt_id`,
        [resolvedStudentId, sessionId, language, difficulty, mistakesCount, score, xpEarned, jsonItemsDetail]
      );
      if (rows && rows.length > 0) {
        attemptId = rows[0].attempt_id;
      }
    }

    // 2. Badge Check: "Sentence builder"
    // "Finish a sentence building activity without hitting retrying or hitting try again."
    if (Number(mistakesCount) === 0) {
      try {
        const badgeRes = await db.query(
          `SELECT badge_id FROM badges 
           WHERE LOWER(badge_name) LIKE '%sentence builder%' 
              OR criteria_type = 'sentence_first_try'
           LIMIT 1`
        );

        if (badgeRes.rows && badgeRes.rows.length > 0) {
          const badgeId = badgeRes.rows[0].badge_id;
          const insertBadge = await db.query(
            `INSERT INTO student_badges (student_id, badge_id, earned_at)
             VALUES ($1, $2, CURRENT_TIMESTAMP)
             ON CONFLICT DO NOTHING
             RETURNING student_badge_id`,
            [resolvedStudentId, badgeId]
          );

          if (insertBadge.rows && insertBadge.rows.length > 0) {
            newBadgeUnlocked = true;
          }
        }
      } catch (bErr) {
        console.warn('[sentenceService.logAttempt] Badge check notice:', bErr.message);
      }
    }

    // 3. Badge Check: "First step"
    // "Complete your very first practice activity."
    try {
      const { rows: pCount } = await db.query('SELECT COUNT(*) as count FROM pronunciation_attempts WHERE student_id = $1', [resolvedStudentId]);
      const { rows: vCount } = await db.query('SELECT COUNT(*) as count FROM vocabulary_attempts WHERE student_id = $1', [resolvedStudentId]);
      const { rows: sCount } = await db.query('SELECT COUNT(*) as count FROM sentence_attempts WHERE student_id = $1', [resolvedStudentId]);

      const totalActivities = (parseInt(pCount[0]?.count) || 0) + (parseInt(vCount[0]?.count) || 0) + (parseInt(sCount[0]?.count) || 0);

      if (totalActivities <= 1) {
        const fsBadgeRes = await db.query(
          `SELECT badge_id FROM badges 
           WHERE LOWER(badge_name) LIKE '%first step%' 
              OR criteria_type = 'activity_count'
           LIMIT 1`
        );
        if (fsBadgeRes.rows && fsBadgeRes.rows.length > 0) {
          const fsInsert = await db.query(
            `INSERT INTO student_badges (student_id, badge_id, earned_at)
             VALUES ($1, $2, CURRENT_TIMESTAMP)
             ON CONFLICT DO NOTHING
             RETURNING student_badge_id`,
            [resolvedStudentId, fsBadgeRes.rows[0].badge_id]
          );
          if (fsInsert.rows && fsInsert.rows.length > 0) {
            newBadgeUnlocked = true;
          }
        }
      }
    } catch (fsErr) {
      console.warn('[sentenceService.logAttempt] First step badge notice:', fsErr.message);
    }
  } catch (err) {
    console.error('[sentenceService.logAttempt] Error:', err.message);
    throw err;
  }

  return {
    attemptId,
    xpEarned,
    newBadgeUnlocked,
  };
}

module.exports = {
  getSessionSentences,
  logAttempt,
};
