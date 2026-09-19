/**
 * SalinTinig — Super Admin Seed Script
 *
 * Creates the initial super admin account and applies any required
 * database migrations (idempotent — safe to run multiple times).
 *
 * Usage: node src/scripts/seed_super_admin.js
 */
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set. Please configure your .env file.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('🔄 Connected to database. Running Super Admin seed...\n');

    // 1. Ensure super_admin role support (add to enum if needed)
    console.log('👤 Ensuring role column supports super_admin...');
    try {
      await client.query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin'`);
    } catch (e) {
      // May not be an enum type — that's fine
    }

    // 2. Ensure reading_materials.status column exists
    console.log('📚 Ensuring reading_materials.status column exists...');
    await client.query(`
      ALTER TABLE reading_materials ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    `);
    await client.query(`
      ALTER TABLE reading_materials ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    `);

    // 3. Ensure schools.status column exists
    console.log('🏫 Ensuring schools.status and schools.updated_at columns exist...');
    await client.query(`
      ALTER TABLE schools ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    `);
    await client.query(`
      ALTER TABLE schools ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    `);

    // 4. Ensure phil_iri_passages.prev_status column exists
    console.log('📖 Ensuring phil_iri_passages.prev_status column exists...');
    await client.query(`
      ALTER TABLE phil_iri_passages ADD COLUMN IF NOT EXISTS prev_status TEXT DEFAULT 'published'
    `);
    await client.query(`
      ALTER TABLE phil_iri_passages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    `);

    // 5. Ensure users.reset_code columns exist
    console.log('🔐 Ensuring users reset code columns exist...');
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code TEXT
    `);
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_expires_at TIMESTAMPTZ
    `);
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    `);

    // 6. Create or update the super admin account
    const SUPER_ADMIN_EMAIL = 'superadmin@gmail.com';
    const SUPER_ADMIN_PASSWORD = 'SuperAdmin123!';

    console.log(`\n🛡️  Creating Super Admin account: ${SUPER_ADMIN_EMAIL}`);
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(SUPER_ADMIN_PASSWORD, salt);

    const { rows } = await client.query(`
      INSERT INTO users (email, password_hash, role, status, must_change_password, school_id)
      VALUES ($1, $2, 'super_admin', 'active', false, NULL)
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'super_admin',
        status = 'active',
        must_change_password = false
      RETURNING user_id, email, role
    `, [SUPER_ADMIN_EMAIL, passwordHash]);

    console.log('\n✅ Super Admin seed complete!\n');
    console.log('─────────────────────────────────────────');
    console.log('  Login Credentials');
    console.log('─────────────────────────────────────────');
    console.log(`  Email    : ${SUPER_ADMIN_EMAIL}`);
    console.log(`  Password : ${SUPER_ADMIN_PASSWORD}`);
    console.log(`  User ID  : ${rows[0]?.user_id}`);
    console.log('─────────────────────────────────────────\n');

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(() => process.exit(1));
