const db = require('../config/db.js');
const badgeService = require('../services/badgeService.js');
const vocabularyService = require('../services/vocabularyService.js');
const pronunciationService = require('../services/pronunciationService.js');
const sentenceService = require('../services/sentenceService.js');

async function testAllBadges() {
  console.log('--------------------------------------------------');
  console.log('  SALINTINIG — AUTOMATED ALL-BADGES SYSTEM TEST');
  console.log('--------------------------------------------------\n');

  try {
    // 1. Get or create a dummy test student
    let studentId = null;
    const sRes = await db.query(`SELECT student_id FROM students LIMIT 1`);
    if (sRes.rows && sRes.rows.length > 0) {
      studentId = sRes.rows[0].student_id;
    } else {
      console.error('❌ No student found in database to run badge test.');
      process.exit(1);
    }

    console.log(`👤 Running badge test for Student ID: ${studentId}\n`);

    // Reset student_progress earned_badges for clean test
    await db.query(
      `UPDATE student_progress SET earned_badges = '[]'::jsonb WHERE student_id = $1`,
      [studentId]
    );

    // TEST 1: Vocabulary matching attempt (Testing "First step" & "I'm a star!")
    console.log('🧪 [Test 1] Testing Vocabulary Matching attempt (Score: 100%, Mistakes: 0)...');
    const vRes = await vocabularyService.logAttempt({
      studentId,
      sessionId: `test_v_${Date.now()}`,
      difficulty: 'medium',
      totalPairs: 5,
      mistakesCount: 0,
      score: 100,
      xpEarned: 50,
      itemsDetail: [],
    });
    console.log(`   Unlocked Badges:`, vRes.newlyUnlockedBadges.map(b => b.badgeName));

    // TEST 2: Pronunciation Challenge attempt (Testing "Sounds right!")
    console.log('🧪 [Test 2] Testing Pronunciation Challenge attempt (3/3 correct)...');
    const pRes = await pronunciationService.logAttempt({
      studentId,
      sessionId: `test_p_${Date.now()}`,
      language: 'fil',
      difficulty: 'medium',
      totalWords: 3,
      mistakesCount: 0,
      score: 100,
      xpEarned: 50,
      itemsDetail: [{ isPassed: true }, { isPassed: true }, { isPassed: true }],
    });
    console.log(`   Unlocked Badges:`, pRes.newlyUnlockedBadges.map(b => b.badgeName));

    // TEST 3: Sentence Building attempt (Testing "Sentence builder" & "Triple Crowned")
    console.log('🧪 [Test 3] Testing Sentence Building attempt (0 mistakes, completing 3rd activity type today)...');
    const sentRes = await sentenceService.logAttempt({
      studentId,
      sessionId: `test_s_${Date.now()}`,
      language: 'fil',
      difficulty: 'medium',
      totalSentences: 5,
      mistakesCount: 0,
      score: 100,
      xpEarned: 50,
      itemsDetail: [],
    });
    console.log(`   Unlocked Badges:`, sentRes.newlyUnlockedBadges.map(b => b.badgeName));

    // TEST 4: Reading Badges (Testing "Night owl" & "The best of both worlds!")
    console.log('🧪 [Test 4] Testing Story completion in Dark Mode (Bilingual)...');
    let mFilId = (await db.query(`SELECT material_id FROM reading_materials WHERE LOWER(language) LIKE '%fil%' LIMIT 1`)).rows[0]?.material_id;
    let mEngId = (await db.query(`SELECT material_id FROM reading_materials WHERE LOWER(language) LIKE '%eng%' LIMIT 1`)).rows[0]?.material_id;

    if (!mFilId) {
      const insFil = await db.query(`INSERT INTO reading_materials (title, language, content_text) VALUES ('Test Fil Book', 'fil', 'Sample story') ON CONFLICT (title) DO UPDATE SET language = 'fil' RETURNING material_id`);
      mFilId = insFil.rows[0]?.material_id;
    }
    if (!mEngId) {
      const insEng = await db.query(`INSERT INTO reading_materials (title, language, content_text) VALUES ('Test Eng Book', 'en', 'Sample story') ON CONFLICT (title) DO UPDATE SET language = 'en' RETURNING material_id`);
      mEngId = insEng.rows[0]?.material_id;
    }

    await db.query(
      `INSERT INTO student_story_progress (student_id, material_id, status, quiz_score) 
       VALUES ($1, $2, 'completed', 100), ($1, $3, 'completed', 100) 
       ON CONFLICT (student_id, material_id) DO UPDATE SET status = 'completed', quiz_score = 100`,
      [studentId, mFilId, mEngId]
    );

    const rRes = await badgeService.checkReadingBadges(studentId, { isDarkMode: true });
    console.log(`   Unlocked Badges:`, rRes.map(b => b.badgeName));

    // TEST 5: Streak Badges (Testing "6? 7!", "10 Streak Master!", "20 Streak Master!")
    console.log('🧪 [Test 5] Testing Streak Badges (Simulating 20-day streak)...');
    const stRes = await badgeService.checkStreakBadges(studentId, 20);
    console.log(`   Unlocked Badges:`, stRes.map(b => b.badgeName));

    // SUMMARY: Fetch final progress for all 10 badges
    console.log('\n--------------------------------------------------');
    console.log('  FINAL BADGES SUMMARY (JSONB Storage)');
    console.log('--------------------------------------------------');
    const finalBadges = await badgeService.getStudentBadgesProgress(studentId);

    let unlockedCount = 0;
    finalBadges.forEach((badge, index) => {
      const status = badge.isUnlocked ? '✅ UNLOCKED' : '🔒 LOCKED';
      if (badge.isUnlocked) unlockedCount++;
      console.log(
        `${index + 1}. [${status}] ${badge.title.padEnd(28)} Progress: ${badge.currentProgress}/${badge.maxProgress}`
      );
    });

    console.log('\n--------------------------------------------------');
    console.log(`🎉 TEST COMPLETED SUCCESSFULLY! (${unlockedCount}/${finalBadges.length} Badges Unlocked)`);
    console.log('--------------------------------------------------');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
  } finally {
    process.exit(0);
  }
}

testAllBadges();
