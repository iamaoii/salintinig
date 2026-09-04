const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const officialBadges = [
  {
    badge_name: 'First step',
    description: 'Complete your very first practice activity.',
    icon_path: 'assets/badges/first_step_badge.webp',
    criteria_type: 'activity_count',
    criteria_value: '1'
  },
  {
    badge_name: "I'm a star!",
    description: 'Get a perfect score on a vocabulary matching activity.',
    icon_path: 'assets/badges/im_a_star_badge.webp',
    criteria_type: 'vocab_score',
    criteria_value: '100'
  },
  {
    badge_name: 'Sounds right!',
    description: 'Get 3 out of 3 correct on a pronunciation challenge.',
    icon_path: 'assets/badges/sounds_right_badge.webp',
    criteria_type: 'pronun_score',
    criteria_value: '3'
  },
  {
    badge_name: 'Sentence builder',
    description: 'Finish a sentence building activity without hitting retrying or hitting try again.',
    icon_path: 'assets/badges/sentence_builder_badge.webp',
    criteria_type: 'sentence_first_try',
    criteria_value: '1'
  },
  {
    badge_name: 'Night owl',
    description: 'Read a story using dark mode.',
    icon_path: 'assets/badges/night_owl_badge.webp',
    criteria_type: 'theme_dark_mode',
    criteria_value: '1'
  },
  {
    badge_name: '6? 7!',
    description: 'Reach a 7 day streak.',
    icon_path: 'assets/badges/six_seven_badge.webp',
    criteria_type: 'streak',
    criteria_value: '7'
  },
  {
    badge_name: 'The best of both worlds!',
    description: 'Read one fil book and one eng book from the bookshelf.',
    icon_path: 'assets/badges/both_worlds_badge.webp',
    criteria_type: 'bilingual_reading',
    criteria_value: '2'
  },
  {
    badge_name: '10 Streak Master!',
    description: 'Reach a 10 day streak.',
    icon_path: 'assets/badges/ten_day_streak_badge.webp',
    criteria_type: 'streak',
    criteria_value: '10'
  },
  {
    badge_name: '20 Streak Master!',
    description: 'Reach a 20 day streak.',
    icon_path: 'assets/badges/twenty_day_streak_badge.webp',
    criteria_type: 'streak',
    criteria_value: '20'
  },
  {
    badge_name: 'Triple Crowned',
    description: 'Complete all 3 class activities (pronun, vocab, and sent building) in 1 day.',
    icon_path: 'assets/badges/triple_crowned_badge.webp',
    criteria_type: 'daily_triple_activity',
    criteria_value: '1'
  }
];

async function seedBadges() {
  try {
    await pool.query('DELETE FROM badges');
    console.log('Cleared existing prototype badges.');

    for (const b of officialBadges) {
      const q = 'INSERT INTO badges (badge_name, description, icon_path, criteria_type, criteria_value) VALUES ($1, $2, $3, $4, $5)';
      await pool.query(q, [b.badge_name, b.description, b.icon_path, b.criteria_type, b.criteria_value]);
      console.log('Inserted:', b.badge_name);
    }

    const { rows } = await pool.query('SELECT badge_name, icon_path, criteria_type, criteria_value FROM badges ORDER BY created_at ASC');
    console.log('\n--- Badges in DB (Total: ' + rows.length + ') ---');
    console.table(rows);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding badges:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedBadges();
