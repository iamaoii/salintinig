const db = require('../config/db.js');

function formatYmdDate(val) {
  if (!val) return null;
  if (typeof val === 'string') {
    return val.split('T')[0].split(' ')[0];
  }
  if (val instanceof Date) {
    const timeZone = process.env.APP_TIMEZONE || 'Asia/Manila';
    const options = { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' };
    const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(val);
    const y = parts.find((p) => p.type === 'year')?.value;
    const m = parts.find((p) => p.type === 'month')?.value;
    const d = parts.find((p) => p.type === 'day')?.value;
    if (y && m && d) return `${y}-${m}-${d}`;
  }
  return String(val).split('T')[0].split(' ')[0];
}

/**
 * Ensures earned_badges JSONB column exists on student_progress table.
 */
async function initBadgeColumn() {
  try {
    await db.query(`
      ALTER TABLE student_progress 
      ADD COLUMN IF NOT EXISTS earned_badges JSONB DEFAULT '[]'::jsonb;
    `);
  } catch (err) {
    console.warn('[BadgeService] Notice init column:', err.message);
  }
}
initBadgeColumn();

/**
 * Helper to safely insert earned badge record into student_progress.earned_badges JSONB array.
 */
async function awardBadge(studentId, badgeNamePattern) {
  if (!studentId) return null;
  try {
    const bRes = await db.query(
      `SELECT badge_id, badge_name, description, icon_path 
       FROM badges 
       WHERE LOWER(badge_name) ILIKE $1 OR criteria_type ILIKE $1 
       LIMIT 1`,
      [`%${badgeNamePattern}%`]
    );

    if (!bRes.rows || bRes.rows.length === 0) return null;
    const badge = bRes.rows[0];

    // Ensure student_progress record exists for this student
    const checkRes = await db.query(
      `SELECT progress_id, earned_badges FROM student_progress WHERE student_id = $1 LIMIT 1`,
      [studentId]
    );

    let currentBadges = [];
    if (checkRes.rows.length === 0) {
      await db.query(
        `INSERT INTO student_progress (student_id, earned_badges)
         VALUES ($1, '[]'::jsonb)`,
        [studentId]
      );
    } else if (checkRes.rows[0].earned_badges) {
      const eb = checkRes.rows[0].earned_badges;
      currentBadges = Array.isArray(eb)
        ? eb
        : typeof eb === 'string'
        ? JSON.parse(eb)
        : [];
    }

    const alreadyEarned = currentBadges.some(
      (b) => b.id === badge.badge_id || b.badge_id === badge.badge_id
    );

    if (!alreadyEarned) {
      const nowIso = new Date().toISOString();
      const badgeRecord = {
        id: badge.badge_id,
        badge_id: badge.badge_id,
        badgeName: badge.badge_name,
        description: badge.description,
        iconPath: badge.icon_path,
        earnedAt: nowIso,
      };

      currentBadges.push(badgeRecord);

      await db.query(
        `UPDATE student_progress 
         SET earned_badges = $1::jsonb, updated_at = CURRENT_TIMESTAMP 
         WHERE student_id = $2`,
        [JSON.stringify(currentBadges), studentId]
      );

      console.log(`[BadgeService] Awarded badge "${badge.badge_name}" to student ID: ${studentId} (saved in JSONB)`);
      return badgeRecord;
    }
  } catch (err) {
    console.warn('[BadgeService.awardBadge] Notice:', err.message);
  }
  return null;
}

/**
 * Evaluates streak-based badges ("6? 7!", "10 Streak Master!", "20 Streak Master!")
 */
async function checkStreakBadges(studentId, streakCount) {
  const newlyUnlocked = [];
  if (!studentId || streakCount <= 0) return newlyUnlocked;

  if (streakCount >= 7) {
    const b = await awardBadge(studentId, '6? 7!');
    if (b) newlyUnlocked.push(b);
  }
  if (streakCount >= 10) {
    const b = await awardBadge(studentId, '10 Streak Master!');
    if (b) newlyUnlocked.push(b);
  }
  if (streakCount >= 20) {
    const b = await awardBadge(studentId, '20 Streak Master!');
    if (b) newlyUnlocked.push(b);
  }

  return newlyUnlocked;
}

/**
 * Evaluates practice activity badges (First step, I'm a star!, Sounds right!, Sentence builder, Triple Crowned)
 */
async function checkActivityBadges(studentId, activityType, resultData = {}) {
  const newlyUnlocked = [];
  if (!studentId) return newlyUnlocked;

  try {
    // 1. "First step": Complete your very first practice activity
    const fsBadge = await awardBadge(studentId, 'First step');
    if (fsBadge) newlyUnlocked.push(fsBadge);

    // 2. Activity specific checks
    if (activityType === 'vocabulary') {
      // "I'm a star!": Get a perfect score on a vocabulary matching activity
      const score = Number(resultData.score || 0);
      const mistakes = Number(resultData.mistakesCount || 0);
      if (score === 100 || mistakes === 0) {
        const b = await awardBadge(studentId, "I'm a star!");
        if (b) newlyUnlocked.push(b);
      }
    } else if (activityType === 'pronunciation') {
      // "Sounds right!": Get 3 out of 3 correct on a pronunciation challenge
      const correctCount = Number(resultData.score || resultData.correctCount || 0);
      if (correctCount >= 3) {
        const b = await awardBadge(studentId, 'Sounds right!');
        if (b) newlyUnlocked.push(b);
      }
    } else if (activityType === 'sentence') {
      // "Sentence builder": Finish a sentence building activity without retries
      const mistakes = Number(resultData.mistakesCount || resultData.retriesUsed || 0);
      if (mistakes === 0) {
        const b = await awardBadge(studentId, 'Sentence builder');
        if (b) newlyUnlocked.push(b);
      }
    }

    // 3. "Triple Crowned": Complete all 3 class activities in 1 day
    const todayStr = formatYmdDate(new Date());
    const [vRes, pRes, sRes] = await Promise.all([
      db.query(`SELECT 1 FROM vocabulary_attempts WHERE student_id = $1 AND DATE(created_at AT TIME ZONE 'Asia/Manila') = $2 LIMIT 1`, [studentId, todayStr]),
      db.query(`SELECT 1 FROM pronunciation_attempts WHERE student_id = $1 AND DATE(created_at AT TIME ZONE 'Asia/Manila') = $2 LIMIT 1`, [studentId, todayStr]),
      db.query(`SELECT 1 FROM sentence_attempts WHERE student_id = $1 AND DATE(created_at AT TIME ZONE 'Asia/Manila') = $2 LIMIT 1`, [studentId, todayStr]),
    ]);

    if (vRes.rows.length > 0 && pRes.rows.length > 0 && sRes.rows.length > 0) {
      const tcBadge = await awardBadge(studentId, 'Triple Crowned');
      if (tcBadge) newlyUnlocked.push(tcBadge);
    }
  } catch (err) {
    console.warn('[BadgeService.checkActivityBadges] Notice:', err.message);
  }

  return newlyUnlocked;
}

/**
 * Evaluates reading badges (Night owl, The best of both worlds!, First step)
 */
async function checkReadingBadges(studentId, options = {}) {
  const newlyUnlocked = [];
  if (!studentId) return newlyUnlocked;

  try {
    // 1. "First step": Complete your very first activity
    const fsBadge = await awardBadge(studentId, 'First step');
    if (fsBadge) newlyUnlocked.push(fsBadge);

    // 2. "Night owl": Read a story using dark mode
    if (options.isDarkMode === true) {
      const noBadge = await awardBadge(studentId, 'Night owl');
      if (noBadge) newlyUnlocked.push(noBadge);
    }

    // 3. "The best of both worlds!": Read 1 fil book and 1 eng book (Story + Quiz completed)
    const { rows: storyRows } = await db.query(
      `SELECT DISTINCT LOWER(rm.language) as lang
       FROM student_story_progress ssp
       JOIN reading_materials rm ON ssp.material_id = rm.material_id
       WHERE ssp.student_id = $1 AND ssp.status = 'completed' AND ssp.quiz_score IS NOT NULL`,
      [studentId]
    );

    const languages = storyRows.map(r => r.lang);
    const hasFil = languages.some(l => l && (l.includes('fil') || l.includes('tagalog')));
    const hasEng = languages.some(l => l && (l.includes('eng') || l.includes('english') || l.startsWith('en')));

    if (hasFil && hasEng) {
      const bwBadge = await awardBadge(studentId, 'The best of both worlds!');
      if (bwBadge) newlyUnlocked.push(bwBadge);
    }
  } catch (err) {
    console.warn('[BadgeService.checkReadingBadges] Notice:', err.message);
  }

  return newlyUnlocked;
}

/**
 * Returns all 10 badges with dynamic progress and unlock status for a student.
 */
async function getStudentBadgesProgress(studentId) {
  try {
    const { rows: allBadges } = await db.query(
      `SELECT badge_id, badge_name, description, icon_path, criteria_type, criteria_value 
       FROM badges 
       ORDER BY created_at ASC`
    );

    const earnedMap = new Map();

    // Read earned badges from JSONB column on student_progress
    const pRes = await db.query(
      `SELECT earned_badges, current_streak, longest_streak FROM student_progress WHERE student_id = $1 LIMIT 1`,
      [studentId]
    );

    if (pRes.rows?.[0]?.earned_badges) {
      const badgesArr = Array.isArray(pRes.rows[0].earned_badges)
        ? pRes.rows[0].earned_badges
        : typeof pRes.rows[0].earned_badges === 'string'
        ? JSON.parse(pRes.rows[0].earned_badges)
        : [];
      badgesArr.forEach((b) => {
        const id = b.id || b.badge_id;
        if (id) earnedMap.set(id, b.earnedAt || b.earned_at || new Date().toISOString());
      });
    }

    // Dual fallback to student_badges table if present
    try {
      const { rows: earnedRows } = await db.query(
        `SELECT badge_id, earned_at FROM student_badges WHERE student_id = $1`,
        [studentId]
      );
      earnedRows.forEach((r) => {
        if (!earnedMap.has(r.badge_id)) {
          earnedMap.set(r.badge_id, r.earned_at);
        }
      });
    } catch (_) {}

    // Fetch student progress metrics for locked badge progress calculation
    const [vRes, pronRes, sRes, storyLangsRes] = await Promise.all([
      db.query(`SELECT MAX(score) as max_score FROM vocabulary_attempts WHERE student_id = $1`, [studentId]),
      db.query(`SELECT MAX(score) as max_score FROM pronunciation_attempts WHERE student_id = $1`, [studentId]),
      db.query(`SELECT COUNT(*) as count FROM sentence_attempts WHERE student_id = $1 AND mistakes_count = 0`, [studentId]),
      db.query(`SELECT DISTINCT LOWER(rm.language) as lang FROM student_story_progress ssp JOIN reading_materials rm ON ssp.material_id = rm.material_id WHERE ssp.student_id = $1 AND ssp.status = 'completed' AND ssp.quiz_score IS NOT NULL`, [studentId]),
    ]);

    const todayStr = formatYmdDate(new Date());
    const [vToday, pToday, sToday] = await Promise.all([
      db.query(`SELECT 1 FROM vocabulary_attempts WHERE student_id = $1 AND DATE(created_at AT TIME ZONE 'Asia/Manila') = $2 LIMIT 1`, [studentId, todayStr]),
      db.query(`SELECT 1 FROM pronunciation_attempts WHERE student_id = $1 AND DATE(created_at AT TIME ZONE 'Asia/Manila') = $2 LIMIT 1`, [studentId, todayStr]),
      db.query(`SELECT 1 FROM sentence_attempts WHERE student_id = $1 AND DATE(created_at AT TIME ZONE 'Asia/Manila') = $2 LIMIT 1`, [studentId, todayStr]),
    ]);

    const currentStreak = pRes.rows[0]?.current_streak || 0;
    const maxPronScore = Number(pronRes.rows[0]?.max_score || 0);

    const readLangs = storyLangsRes.rows.map(r => r.lang || '');
    const hasFil = readLangs.some(l => l.includes('fil') || l.includes('tagalog'));
    const hasEng = readLangs.some(l => l.includes('eng') || l.includes('english') || l.startsWith('en'));
    const bilingualProgress = (hasFil ? 1 : 0) + (hasEng ? 1 : 0);

    const todayTripleCount = (vToday.rows.length > 0 ? 1 : 0) +
                             (pToday.rows.length > 0 ? 1 : 0) +
                             (sToday.rows.length > 0 ? 1 : 0);

    const badgesData = await Promise.all(
      allBadges.map(async (b) => {
        let isUnlocked = earnedMap.has(b.badge_id);
        let earnedAt = earnedMap.get(b.badge_id) || null;
        let currentProgress = 0;
        let maxProgress = parseInt(b.criteria_value) || 1;
        let category = 'Milestone';

        const name = b.badge_name.toLowerCase();

        if (name.includes('first step')) {
          category = 'Milestone';
          maxProgress = 1;
          currentProgress = isUnlocked ? 1 : 0;
        } else if (name.includes("i'm a star")) {
          category = 'Vocabulary';
          maxProgress = 1;
          currentProgress = isUnlocked ? 1 : 0;
        } else if (name.includes('sounds right')) {
          category = 'Pronunciation';
          maxProgress = 3;
          currentProgress = isUnlocked ? 3 : Math.min(maxPronScore, 3);
        } else if (name.includes('sentence builder')) {
          category = 'Grammar';
          maxProgress = 1;
          currentProgress = isUnlocked ? 1 : 0;
        } else if (name.includes('night owl')) {
          category = 'Exploration';
          maxProgress = 1;
          currentProgress = isUnlocked ? 1 : 0;
        } else if (name.includes('6? 7!')) {
          category = 'Streak';
          maxProgress = 7;
          currentProgress = isUnlocked ? 7 : Math.min(currentStreak, 7);
        } else if (name.includes('both worlds')) {
          category = 'Reading';
          maxProgress = 2;
          currentProgress = isUnlocked ? 2 : bilingualProgress;
        } else if (name.includes('10 streak')) {
          category = 'Streak';
          maxProgress = 10;
          currentProgress = isUnlocked ? 10 : Math.min(currentStreak, 10);
        } else if (name.includes('20 streak')) {
          category = 'Streak';
          maxProgress = 20;
          currentProgress = isUnlocked ? 20 : Math.min(currentStreak, 20);
        } else if (name.includes('triple crowned')) {
          category = 'Daily Quest';
          maxProgress = 3;
          currentProgress = isUnlocked ? 3 : todayTripleCount;
        }

        // Auto-heal / Auto-award if criteria met (e.g. currentProgress >= maxProgress)
        if (!isUnlocked && currentProgress >= maxProgress) {
          const awarded = await awardBadge(studentId, b.badge_name);
          if (awarded) {
            isUnlocked = true;
            earnedAt = awarded.earnedAt || new Date().toISOString();
          }
        }

        return {
          id: b.badge_id,
          title: b.badge_name,
          description: b.description,
          badgeAsset: b.icon_path,
          category,
          currentProgress,
          maxProgress,
          isUnlocked,
          earnedAt,
        };
      })
    );

    return badgesData;
  } catch (err) {
    console.error('[BadgeService.getStudentBadgesProgress] Error:', err.message);
    return [];
  }
}

module.exports = {
  awardBadge,
  checkStreakBadges,
  checkActivityBadges,
  checkReadingBadges,
  getStudentBadgesProgress,
};
