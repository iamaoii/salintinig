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

module.exports = {
  query: (text, params) => getPool().query(text, params),
  get pool() {
    return getPool();
  },
};
