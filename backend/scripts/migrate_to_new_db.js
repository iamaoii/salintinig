/**
 * =============================================================================
 * SalinTinig — Database Migration Script
 * Migrates ALL data from OLD Supabase project → NEW Supabase project
 *
 * Usage:
 *   1. Ensure backend/.env has DATABASE_URL set to your OLD/source database.
 *   2. Ensure NEW_DB_URL below is set to your NEW/target database.
 *   3. Run: node backend/scripts/migrate_to_new_db.js
 * =============================================================================
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Pool } = require('pg');

// ─── OLD DB (source) ─────────────────────────────────────────────────────────
// Reads from backend/.env DATABASE_URL
const OLD_DB_URL = process.env.DATABASE_URL;

// ─── NEW DB (destination) ─────────────────────────────────────────────────────
// Original Supabase Project Connection String (Transaction Pooler, port 6543)
const NEW_DB_URL = 'YOUR_DB_URL';

// ─── TABLES in FK-safe insertion order ───────────────────────────────────────
// Order matters! Parent tables must come before child tables.
const TABLES_IN_ORDER = [
  'schools',
  'users',
  'password_reset_tokens',
  'school_years',
  'teachers',
  'classes',
  'faculty_in_charge',
  'students',
  'parents',
  'student_parents',
  'student_grade_history',
  'reading_materials',
  'phil_iri_passages',
  'phil_iri_questions',
  'phil_iri_question_choices',
  'phil_iri_adaptive_sessions',
  'assessments',
  'assessment_attempts',
  'oral_reading_results',
  'silent_reading_results',
  'listening_reading_results',
  'assessment_answers',
  'teacher_feedback',
  'gst_form_submissions',
  'phil_iri_form4_submissions',
  'badges',
  'student_progress',
  'student_story_progress',
  'story_attempts',
  'student_reading_profiles',
  'notifications',
  'audit_logs',
  'account_requests',
  'vocabulary_bank',
  'pronunciation_attempts',
  'vocabulary_attempts',
  'sentence_attempts',
  'sentence_bank',
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function logSuccess(msg) {
  console.log(`\x1b[32m✓ ${msg}\x1b[0m`);
}

function logError(msg) {
  console.error(`\x1b[31m✗ ${msg}\x1b[0m`);
}

function logInfo(msg) {
  console.log(`\x1b[36mℹ ${msg}\x1b[0m`);
}

/**
 * Escapes a single value for safe PostgreSQL insertion
 */
function escapeValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return val;
  if (val instanceof Date) return `'${val.toISOString()}'`;

  // JSONB / objects / arrays
  if (typeof val === 'object') {
    const json = JSON.stringify(val).replace(/'/g, "''");
    return `'${json}'`;
  }

  // Strings — escape single quotes
  const escaped = String(val).replace(/'/g, "''");
  return `'${escaped}'`;
}

// ─── TABLE-SPECIFIC ROW TRANSFORMS ──────────────────────────────────────────
const ROW_TRANSFORMS = {};

/**
 * Ensures table and all columns exist on destination database by copying schema definition from source
 */
async function ensureTableExistsOnDest(sourcePool, destPool, tableName) {
  // Query column definitions from source
  const colRes = await sourcePool.query(`
    SELECT column_name, data_type, udt_name, is_nullable, column_default, character_maximum_length
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position;
  `, [tableName]);

  if (colRes.rows.length === 0) return;

  const colDefs = colRes.rows.map(col => {
    let typeStr = col.udt_name === 'uuid' ? 'UUID' : 
                  col.udt_name === 'jsonb' ? 'JSONB' :
                  col.udt_name === 'timestamptz' ? 'TIMESTAMP WITH TIME ZONE' :
                  col.udt_name === 'timestamp' ? 'TIMESTAMP' :
                  col.udt_name === 'bool' ? 'BOOLEAN' :
                  col.udt_name === 'int4' ? 'INT' :
                  col.udt_name === 'int8' ? 'BIGINT' :
                  col.udt_name === 'float8' ? 'DOUBLE PRECISION' :
                  col.data_type === 'USER-DEFINED' ? col.udt_name :
                  col.data_type;

    if (col.character_maximum_length && (col.data_type.includes('char') || col.data_type.includes('varchar'))) {
      typeStr += `(${col.character_maximum_length})`;
    }

    let colLine = `"${col.column_name}" ${typeStr}`;
    if (col.column_default) {
      colLine += ` DEFAULT ${col.column_default}`;
    }
    return colLine;
  });

  const createTableSql = `
    CREATE TABLE IF NOT EXISTS "${tableName}" (
      ${colDefs.join(',\n  ')}
    );
  `;

  await destPool.query(createTableSql);

  // Also add missing columns if table existed but was missing new columns
  for (const col of colRes.rows) {
    let typeStr = col.udt_name === 'uuid' ? 'UUID' : 
                  col.udt_name === 'jsonb' ? 'JSONB' :
                  col.udt_name === 'timestamptz' ? 'TIMESTAMP WITH TIME ZONE' :
                  col.udt_name === 'timestamp' ? 'TIMESTAMP' :
                  col.udt_name === 'bool' ? 'BOOLEAN' :
                  col.udt_name === 'int4' ? 'INT' :
                  col.udt_name === 'int8' ? 'BIGINT' :
                  col.udt_name === 'float8' ? 'DOUBLE PRECISION' :
                  col.data_type === 'USER-DEFINED' ? col.udt_name :
                  col.data_type;

    if (col.character_maximum_length && (col.data_type.includes('char') || col.data_type.includes('varchar'))) {
      typeStr += `(${col.character_maximum_length})`;
    }

    const alterSql = `
      ALTER TABLE "${tableName}" 
      ADD COLUMN IF NOT EXISTS "${col.column_name}" ${typeStr};
    `;
    try {
      await destPool.query(alterSql);
    } catch (e) {
      // ignore
    }
  }
}

/**
 * Migrates a single table from source → destination
 */
async function migrateTable(sourcePool, destPool, tableName) {
  // Ensure destination table exists
  await ensureTableExistsOnDest(sourcePool, destPool, tableName);

  // Fetch all rows from source
  const result = await sourcePool.query(`SELECT * FROM "${tableName}" ORDER BY 1`);
  let rows = result.rows;

  if (rows.length === 0) {
    return 0;
  }

  // Apply row transforms if defined
  if (ROW_TRANSFORMS[tableName]) {
    rows = rows.map((r) => ROW_TRANSFORMS[tableName](r));
  }

  // Build columns list from first row keys
  const cols = Object.keys(rows[0]);
  const colNamesQuoted = cols.map((c) => `"${c}"`).join(', ');

  // Insert in batches of 200 rows
  const BATCH_SIZE = 200;
  let insertedCount = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const valueTuples = batch.map((row) => {
      const vals = cols.map((c) => escapeValue(row[c]));
      return `(${vals.join(', ')})`;
    });

    const insertSql = `
      INSERT INTO "${tableName}" (${colNamesQuoted})
      VALUES ${valueTuples.join(',\n')}
      ON CONFLICT DO NOTHING;
    `;

    await destPool.query(insertSql);
    insertedCount += batch.length;
  }

  return insertedCount;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n========================================');
  console.log('  SalinTinig Database Migration Script  ');
  console.log('========================================\n');

  // Validate config
  if (!OLD_DB_URL) {
    logError('OLD_DB_URL is missing. Make sure backend/.env has DATABASE_URL set.');
    process.exit(1);
  }

  if (NEW_DB_URL === 'PASTE_YOUR_NEW_DATABASE_URL_HERE') {
    logError('Please set NEW_DB_URL in this script before running.');
    logError('Edit scripts/migrate_to_new_db.js and paste your new Supabase connection string.');
    process.exit(1);
  }

  if (OLD_DB_URL === NEW_DB_URL) {
    logError('OLD_DB_URL and NEW_DB_URL are the same! Please check your config.');
    process.exit(1);
  }

  // Create connection pools
  const sourcePool = new Pool({
    connectionString: OLD_DB_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
  });

  const destPool = new Pool({
    connectionString: NEW_DB_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
  });

  // Test connections
  log('Testing connections...');
  try {
    await sourcePool.query('SELECT 1');
    logSuccess('Connected to OLD database (source)');
  } catch (err) {
    logError(`Failed to connect to OLD database: ${err.message}`);
    process.exit(1);
  }

  try {
    await destPool.query('SELECT 1');
    logSuccess('Connected to NEW database (destination)');
  } catch (err) {
    logError(`Failed to connect to NEW database: ${err.message}`);
    process.exit(1);
  }

  // Ensure PostgreSQL views exist on destination
  log('Ensuring PostgreSQL views exist on destination...');
  try {
    await destPool.query(`
      CREATE OR REPLACE VIEW reading_profiles AS
      SELECT 
          s.student_id,

          -- Filipino 3-Modality Breakdown
          (SELECT profile_level FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'fil' AND srp.assessment_type = 'oral' ORDER BY srp.updated_at DESC LIMIT 1) AS fil_oral_profile_label,
          (SELECT accuracy_rate FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'fil' AND srp.assessment_type = 'oral' ORDER BY srp.updated_at DESC LIMIT 1) AS fil_oral_accuracy_rate,
          (SELECT comprehension_rate FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'fil' AND srp.assessment_type = 'oral' ORDER BY srp.updated_at DESC LIMIT 1) AS fil_oral_comprehension_rate,
          (SELECT speed_wpm FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'fil' AND srp.assessment_type = 'oral' ORDER BY srp.updated_at DESC LIMIT 1) AS fil_oral_speed_wpm,

          (SELECT profile_level FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'fil' AND srp.assessment_type = 'listening' ORDER BY srp.updated_at DESC LIMIT 1) AS fil_listening_profile_label,
          (SELECT comprehension_rate FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'fil' AND srp.assessment_type = 'listening' ORDER BY srp.updated_at DESC LIMIT 1) AS fil_listening_comprehension_rate,

          (SELECT profile_level FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'fil' AND srp.assessment_type = 'silent' ORDER BY srp.updated_at DESC LIMIT 1) AS fil_silent_profile_label,
          (SELECT comprehension_rate FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'fil' AND srp.assessment_type = 'silent' ORDER BY srp.updated_at DESC LIMIT 1) AS fil_silent_comprehension_rate,
          (SELECT speed_wpm FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'fil' AND srp.assessment_type = 'silent' ORDER BY srp.updated_at DESC LIMIT 1) AS fil_silent_speed_wpm,

          -- English 3-Modality Breakdown
          (SELECT profile_level FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'en' AND srp.assessment_type = 'oral' ORDER BY srp.updated_at DESC LIMIT 1) AS eng_oral_profile_label,
          (SELECT accuracy_rate FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'en' AND srp.assessment_type = 'oral' ORDER BY srp.updated_at DESC LIMIT 1) AS eng_oral_accuracy_rate,
          (SELECT comprehension_rate FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'en' AND srp.assessment_type = 'oral' ORDER BY srp.updated_at DESC LIMIT 1) AS eng_oral_comprehension_rate,
          (SELECT speed_wpm FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'en' AND srp.assessment_type = 'oral' ORDER BY srp.updated_at DESC LIMIT 1) AS eng_oral_speed_wpm,

          (SELECT profile_level FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'en' AND srp.assessment_type = 'listening' ORDER BY srp.updated_at DESC LIMIT 1) AS eng_listening_profile_label,
          (SELECT comprehension_rate FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'en' AND srp.assessment_type = 'listening' ORDER BY srp.updated_at DESC LIMIT 1) AS eng_listening_comprehension_rate,

          (SELECT profile_level FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'en' AND srp.assessment_type = 'silent' ORDER BY srp.updated_at DESC LIMIT 1) AS eng_silent_profile_label,
          (SELECT comprehension_rate FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'en' AND srp.assessment_type = 'silent' ORDER BY srp.updated_at DESC LIMIT 1) AS eng_silent_comprehension_rate,
          (SELECT speed_wpm FROM student_reading_profiles srp WHERE srp.student_id = s.student_id AND srp.language = 'en' AND srp.assessment_type = 'silent' ORDER BY srp.updated_at DESC LIMIT 1) AS eng_silent_speed_wpm
      FROM students s;
    `);
    logSuccess('Destination views created successfully.');
  } catch (viewErr) {
    logInfo(`View creation notice: ${viewErr.message}`);
  }

  // Disable FK checks on destination temporarily
  log('\nStarting migration...\n');
  await destPool.query('SET session_replication_role = replica;');

  const summary = [];
  let totalRows = 0;
  let failedTables = [];

  for (const tableName of TABLES_IN_ORDER) {
    try {
      process.stdout.write(`  Migrating: ${tableName.padEnd(40)}`);
      const count = await migrateTable(sourcePool, destPool, tableName);
      process.stdout.write(`\x1b[32m${count} rows ✓\x1b[0m\n`);
      summary.push({ table: tableName, rows: count, status: 'OK' });
      totalRows += count;
    } catch (err) {
      process.stdout.write(`\x1b[31mFAILED ✗\x1b[0m\n`);
      logError(`  Error in ${tableName}: ${err.message}`);
      summary.push({ table: tableName, rows: 0, status: `FAILED: ${err.message}` });
      failedTables.push(tableName);
    }
  }

  // Re-enable FK checks
  await destPool.query('SET session_replication_role = DEFAULT;');

  // Print summary
  console.log('\n========================================');
  console.log('            MIGRATION SUMMARY           ');
  console.log('========================================');
  console.log(`Total rows migrated: ${totalRows}`);
  console.log(`Tables succeeded:    ${summary.filter((s) => s.status === 'OK').length}/${TABLES_IN_ORDER.length}`);

  if (failedTables.length > 0) {
    console.log(`\n\x1b[31mFailed tables (${failedTables.length}):\x1b[0m`);
    failedTables.forEach((t) => console.log(`  - ${t}`));
    console.log('\nTip: Failed tables may be empty or have schema differences. Check manually.');
  } else {
    console.log('\n\x1b[32mAll tables migrated successfully! 🎉\x1b[0m');
  }

  console.log('\nNext steps:');
  console.log('  1. Update backend/.env     → DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  console.log('  2. Update mobile/.env      → SUPABASE_URL, SUPABASE_ANON_KEY');
  console.log('  3. Update frontend/.env    → VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  console.log('  4. Restart your backend server\n');

  await sourcePool.end();
  await destPool.end();
}

main().catch((err) => {
  logError(`Unexpected error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
