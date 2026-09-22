/**
 * clear_phil_iri_passages.js
 * --------------------------
 * Deletes all Phil-IRI passages (and cascaded questions/choices) from the database.
 *
 * Usage: node scripts/clear_phil_iri_passages.js
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function clearPassages() {
  const client = await pool.connect();
  try {
    console.log('🗑️  Deleting all Phil-IRI passages from Supabase database...');
    
    // TRUNCATE or DELETE FROM phil_iri_passages CASCADE
    const result = await client.query('DELETE FROM phil_iri_passages RETURNING passage_id');
    
    console.log(`✅ Successfully deleted ${result.rowCount} Phil-IRI passage(s) from Supabase!`);
  } catch (err) {
    console.error('❌ Error deleting Phil-IRI passages:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

clearPassages();
