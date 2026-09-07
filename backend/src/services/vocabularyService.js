/**
 * SalinTinig — Vocabulary Matching Service
 *
 * Single access layer for Vocabulary Matching activity DB operations.
 * Uses the unified `vocabulary_bank` table for word pairs and records
 * student attempts in `vocabulary_attempts`.
 */

const db = require('../config/db');

/**
 * Fetch a session's worth of vocabulary word pairs for a student.
 * Normalizes English and Filipino words from the unified `vocabulary_bank`.
 *
 * @param {string} difficulty  'easy', 'medium', or 'hard' (default: 'medium')
 * @param {number} limit       Number of pairs to return (default: 5)
 * @param {string|null} studentId Optional student UUID for attempt deprioritization
 * @returns {Promise<Array<{itemId: string, englishWord: string, filipinoWord: string, difficulty: string, audioUrl: string|null}>>}
 */
async function getSessionPairs(difficulty = 'medium', limit = 5, studentId = null) {
  const diff = ['easy', 'medium', 'hard'].includes(String(difficulty).toLowerCase())
    ? String(difficulty).toLowerCase()
    : 'medium';

  const safeLimit = Math.min(Math.max(parseInt(limit) || 5, 1), 20);

  // 1. Fetch random candidates matching requested difficulty
  let candidates = [];
  try {
    const candidateLimit = safeLimit * 4;
    const query = `
      SELECT
        item_id,
        word,
        translation,
        language,
        difficulty,
        audio_url
      FROM vocabulary_bank
      WHERE is_active = true
        AND content_status = 'validated'
        AND difficulty = $1
        AND translation IS NOT NULL
        AND TRIM(translation) != ''
        AND LOWER(TRIM(word)) != LOWER(TRIM(translation))
      ORDER BY RANDOM()
      LIMIT $2
    `;
    const result = await db.query(query, [diff, candidateLimit]);
    candidates = result.rows || [];
  } catch (e) {
    console.warn('[vocabularyService.getSessionPairs] Candidate query error:', e.message);
  }

  // 2. Fallback: if not enough in this difficulty, pull from any difficulty
  if (candidates.length < safeLimit) {
    try {
      const fallbackQuery = `
        SELECT
          item_id,
          word,
          translation,
          language,
          difficulty,
          audio_url
        FROM vocabulary_bank
        WHERE is_active = true
          AND content_status = 'validated'
          AND translation IS NOT NULL
          AND TRIM(translation) != ''
          AND LOWER(TRIM(word)) != LOWER(TRIM(translation))
        ORDER BY RANDOM()
        LIMIT $1
      `;
      const fallbackResult = await db.query(fallbackQuery, [safeLimit * 3]);
      candidates = candidates.concat(fallbackResult.rows || []);
    } catch (e) {
      console.warn('[vocabularyService.getSessionPairs] Fallback error:', e.message);
    }
  }

  // 3. Strict Deduplication: ensure English words and Filipino words are unique in this session
  const seenEnglish = new Set();
  const seenFilipino = new Set();
  const selectedPairs = [];

  for (const row of candidates) {
    const isEn = String(row.language || '').toLowerCase().startsWith('en');
    const englishWord = (isEn ? row.word : row.translation).trim();
    const filipinoWord = (isEn ? row.translation : row.word).trim();

    const enKey = englishWord.toLowerCase();
    const filKey = filipinoWord.toLowerCase();

    // Skip if English or Filipino word already included in this session, or if identical
    if (enKey === filKey || seenEnglish.has(enKey) || seenFilipino.has(filKey)) {
      continue;
    }

    seenEnglish.add(enKey);
    seenFilipino.add(filKey);

    selectedPairs.push({
      itemId: row.item_id,
      englishWord,
      filipinoWord,
      difficulty: row.difficulty || diff,
      audioUrl: row.audio_url || null,
    });

    if (selectedPairs.length >= safeLimit) {
      break;
    }
  }

  return selectedPairs;
}

/**
 * Record a student's vocabulary matching attempt, award XP, and check badge criteria.
 *
 * @param {object} params
 * @param {string} params.studentId
 * @param {string|null} params.sessionId
 * @param {string} params.difficulty
 * @param {number} params.totalPairs
 * @param {number} params.mistakesCount
 * @param {number} params.score
 * @param {number} params.xpEarned
 * @returns {Promise<{attemptId: string, xpEarned: number, newBadgeUnlocked: boolean}>}
 */
async function logAttempt({
  studentId,
  sessionId = null,
  difficulty = 'medium',
  totalPairs = 5,
  mistakesCount = 0,
  score = 100,
  xpEarned = 0,
  itemsDetail = [],
}) {
  let attemptId = null;
  let newBadgeUnlocked = false;

  try {
    // Resolve studentId if needed
    let resolvedStudentId = studentId;
    try {
      const stdCheck = await db.query(
        'SELECT student_id FROM students WHERE student_id = $1 LIMIT 1',
        [studentId]
      );
      if (!stdCheck.rows || stdCheck.rows.length === 0) {
        const fallbackStd = await db.query('SELECT student_id FROM students LIMIT 1');
        if (fallbackStd.rows && fallbackStd.rows.length > 0) {
          resolvedStudentId = fallbackStd.rows[0].student_id;
        }
      }
    } catch (_) {}

    // 1. Check for existing attempt in this session to prevent duplicate rows
    let existingAttempt = null;
    if (sessionId) {
      const existRes = await db.query(
        `SELECT attempt_id, score, xp_earned 
         FROM vocabulary_attempts 
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
      // Retain best score and best XP if repeated
      const bestScore = Math.max(Number(existingAttempt.score) || 0, Number(score) || 0);
      const bestXp = Math.max(Number(existingAttempt.xp_earned) || 0, Number(xpEarned) || 0);

      const { rows } = await db.query(
        `UPDATE vocabulary_attempts
         SET score = $1,
             xp_earned = $2,
             mistakes_count = $3,
             difficulty = $4,
             items_detail = $5,
             created_at = CURRENT_TIMESTAMP
         WHERE attempt_id = $6
         RETURNING attempt_id`,
        [bestScore, bestXp, mistakesCount, difficulty, jsonItemsDetail, existingAttempt.attempt_id]
      );
      attemptId = rows[0]?.attempt_id || existingAttempt.attempt_id;
    } else {
      // Insert new attempt
      const { rows } = await db.query(
        `INSERT INTO vocabulary_attempts (
           student_id, session_id, difficulty, mistakes_count, score, xp_earned, items_detail, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
         RETURNING attempt_id`,
        [resolvedStudentId, sessionId, difficulty, mistakesCount, score, xpEarned, jsonItemsDetail]
      );
      if (rows && rows.length > 0) {
        attemptId = rows[0].attempt_id;
      }
    }

    // 2. Check for "I'm a star!" badge: "Get a perfect score on a vocabulary matching activity"
    if (Number(score) >= 100) {
      try {
        const badgeRes = await db.query(
          `SELECT badge_id FROM badges 
           WHERE LOWER(badge_name) LIKE '%i''m a star%' 
              OR LOWER(description) LIKE '%vocabulary matching%'
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
        console.warn('[vocabularyService.logAttempt] Badge check notice:', bErr.message);
      }
    }

    // 3. Check for "First step" badge: "Complete your very first practice activity"
    try {
      const { rows: priorVocab } = await db.query(
        'SELECT COUNT(*) as count FROM vocabulary_attempts WHERE student_id = $1',
        [resolvedStudentId]
      );
      const { rows: priorPronun } = await db.query(
        'SELECT COUNT(*) as count FROM pronunciation_attempts WHERE student_id = $1',
        [resolvedStudentId]
      );
      const totalActivities = (parseInt(priorVocab[0]?.count) || 0) + (parseInt(priorPronun[0]?.count) || 0);

      if (totalActivities <= 1) {
        const fsBadgeRes = await db.query(
          `SELECT badge_id FROM badges 
           WHERE LOWER(badge_name) LIKE '%first step%' 
              OR LOWER(description) LIKE '%very first practice%'
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
      console.warn('[vocabularyService.logAttempt] First step badge notice:', fsErr.message);
    }
  } catch (err) {
    console.error('[vocabularyService.logAttempt] Error:', err.message);
    throw err;
  }

  return {
    attemptId,
    xpEarned,
    newBadgeUnlocked,
  };
}

module.exports = {
  getSessionPairs,
  logAttempt,
};
