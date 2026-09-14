require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/config/db.js');

async function resetAllStreaks() {
  try {
    console.log('🔄 Resetting student streaks in database...');
    
    // Clear streak counts and last activity date in student_progress table
    const result = await db.query(
      `UPDATE student_progress 
       SET current_streak = 0, longest_streak = 0, last_activity_date = NULL, updated_at = CURRENT_TIMESTAMP`
    );

    console.log(`✅ Successfully reset ${result.rowCount} student progress streak records in DB.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error resetting streaks in DB:', err.message);
    process.exit(1);
  }
}

resetAllStreaks();
