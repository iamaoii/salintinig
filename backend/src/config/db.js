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
      max: 15, // Concurrent connections for production burst
      idleTimeoutMillis: 30000, // Keep idle connections open for 30s
      connectionTimeoutMillis: 5000, // Fast fail to retry connection acquisition
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000, // Ping TCP every 10s to prevent router/cloud drop
    });

    poolInstance.on('error', (err, client) => {
      console.error('PostgreSQL Pool Connection Warning:', err.message);
      if (client) {
        try {
          client.release(true);
        } catch (_) {}
      }
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

// Resilient query wrapper with automatic 1-step retry for stale idle connections
async function queryWithRetry(text, params, retries = 1) {
  try {
    return await getPool().query(text, params);
  } catch (err) {
    const isConnErr =
      err.message?.includes('Connection terminated') ||
      err.message?.includes('timeout') ||
      err.code === 'ECONNRESET' ||
      err.code === '57P01';

    if (isConnErr && retries > 0) {
      console.warn('⚠️ Stale database connection detected. Retrying query with new connection...');
      await new Promise((r) => setTimeout(r, 200));
      return await getPool().query(text, params);
    }
    throw err;
  }
}

module.exports = {
  query: queryWithRetry,
  get pool() {
    return getPool();
  },
};

