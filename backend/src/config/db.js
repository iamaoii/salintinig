require('dotenv').config();
const { Pool } = require('pg');

let poolInstance = null;

function getPool() {
  if (!poolInstance) {
    const connStr = process.env.DATABASE_URL;
    poolInstance = new Pool({
      connectionString: connStr,
      ssl: connStr ? { rejectUnauthorized: false } : false,
    });

    poolInstance.on('connect', () => {
      console.log('✅ PostgreSQL database connected successfully');
    });

    poolInstance.on('error', (err) => {
      console.error('PostgreSQL Pool Error:', err.message);
    });
  }
  return poolInstance;
}

// Set to true to temporarily disable audit logging during testing
const DISABLE_AUDIT_LOGS = true;

module.exports = {
  query: (text, params) => {
    if (DISABLE_AUDIT_LOGS && typeof text === 'string' && text.includes('INSERT INTO audit_logs')) {
      return Promise.resolve({ rows: [], rowCount: 0 });
    }
    return getPool().query(text, params);
  },
  get pool() {
    return getPool();
  },
};
