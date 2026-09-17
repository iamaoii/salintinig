require('dotenv').config();
const { Pool } = require('pg');

let poolInstance = null;
let isConnectedLogged = false;

function getPool() {
  if (!poolInstance) {
    const connStr = process.env.DATABASE_URL;
    poolInstance = new Pool({
      connectionString: connStr,
      ssl: connStr ? { rejectUnauthorized: false } : false,
    });

    poolInstance.on('error', (err) => {
      console.error('PostgreSQL Pool Error:', err.message);
    });

    if (!isConnectedLogged) {
      isConnectedLogged = true;
      poolInstance.query('SELECT 1', (err) => {
        if (!err) {
          console.log('✅ PostgreSQL database connected successfully');
        } else {
          console.error('❌ Failed to connect to PostgreSQL database:', err.message);
        }
      });
    }
  }
  return poolInstance;
}

module.exports = {
  query: (text, params) => getPool().query(text, params),
  get pool() {
    return getPool();
  },
};
