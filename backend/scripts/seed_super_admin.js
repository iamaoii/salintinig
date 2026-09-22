/**
 * seed_super_admin.js
 * -------------------
 * Seeds the first Super Admin user (superadmin@gmail.com) and runs the
 * passages status column migration needed for the Super Admin phase.
 *
 * Usage: node seed_super_admin.js
 * Requires: DATABASE_URL in .env
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    console.log('🌱 Running Super Admin seed script...\n');

    // 1. Add status column to phil_iri_passages if not present
    await client.query(`
      ALTER TABLE phil_iri_passages ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
    `);
    console.log('✅ phil_iri_passages.status column ensured.');

    // 2. Ensure reading_materials has status = 'active' as default
    await client.query(`
      ALTER TABLE reading_materials ALTER COLUMN status SET DEFAULT 'active';
    `).catch(() => {
      console.log('   reading_materials.status already configured.');
    });

    // 3. Upsert the Super Admin user (no school_id, role = 'super_admin')
    const result = await client.query(`
      INSERT INTO users (school_id, email, password_hash, role, status, must_change_password)
      VALUES (NULL, 'superadmin@gmail.com', 'password', 'super_admin', 'active', false)
      ON CONFLICT (email) DO UPDATE SET
        role = 'super_admin',
        status = 'active',
        must_change_password = false
      RETURNING user_id, email, role;
    `);

    const saUser = result.rows[0];
    console.log(`✅ Super Admin seeded: ${saUser.email} (user_id: ${saUser.user_id})`);
    console.log('   Email:    superadmin@gmail.com');
    console.log('   Password: password');
    console.log('   Role:     super_admin\n');

    console.log('🎉 Super Admin seed complete!');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
