/**
 * =============================================================================
 * SalinTinig — Database Migration Script
 * Migrates ALL data from OLD Supabase project → NEW Supabase project
 *
 * Usage:
 *   1. Fill in NEW_DB_URL below with your new Supabase connection string
 *   2. Run: node scripts/migrate_to_new_db.js
 * =============================================================================
 */

require('dotenv').config();
const { Pool } = require('pg');

// ─── OLD DB (source) ─────────────────────────────────────────────────────────
// Reads from your current .env DATABASE_URL
const OLD_DB_URL = process.env.DATABASE_URL;

// ─── NEW DB (destination) ─────────────────────────────────────────────────────
// TODO: Paste your NEW Supabase connection string here (Transaction Pooler, port 6543)
// Format: postgresql://postgres.[NEW-PROJECT-REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
const NEW_DB_URL = 'postgresql://postgres.[NEW-PROJECT-REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

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
// Applied before insertion to fix schema differences between old and new DB.
const ROW_TRANSFORMS = {
  // Add any future row transforms here if needed
};

/**
 * Migrates a single table from source → destination
 */
async function migrateTable(sourcePool, destPool, tableName) {
  // Fetch all rows from source
  const result = await sourcePool.query(`SELECT * FROM "${tableName}" ORDER BY 1`);
  let rows = result.rows;

  if (rows.length === 0) {
    logInfo(`  ${tableName}: 0 rows (skipped)`);
    return 0;
  }

  // Apply table-specific transforms if defined
  if (ROW_TRANSFORMS[tableName]) {
    rows = rows.map(ROW_TRANSFORMS[tableName]);
  }

  const columns = Object.keys(rows[0]);
  const columnList = columns.map((c) => `"${c}"`).join(', ');

  // Insert in batches of 100 to avoid hitting statement size limits
  const BATCH_SIZE = 100;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const valueRows = batch.map((row) => {
      const vals = columns.map((col) => escapeValue(row[col]));
      return `(${vals.join(', ')})`;
    });

    const sql = `
      INSERT INTO "${tableName}" (${columnList})
      VALUES ${valueRows.join(',\n')}
      ON CONFLICT DO NOTHING;
    `;

    await destPool.query(sql);
    inserted += batch.length;
  }

  return inserted;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n========================================');
  console.log('  SalinTinig Database Migration Script  ');
  console.log('========================================\n');

  // Validate config
  if (!OLD_DB_URL) {
    logError('OLD_DB_URL is missing. Make sure your .env has DATABASE_URL set.');
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
