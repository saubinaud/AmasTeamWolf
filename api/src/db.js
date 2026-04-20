const { Pool } = require('pg');
const { AsyncLocalStorage } = require('node:async_hooks');

// ── AsyncLocalStorage for per-request academia context ──
// This allows query()/queryOne() to automatically use the correct pool
// without modifying any route handler code.
const academiaStore = new AsyncLocalStorage();

// ── Academias registradas ──
const ACADEMIAS = {
  amas: {
    host: process.env.DB_HOST || 'pallium_amas-db',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'amas_database',
    user: process.env.DB_USER || 'amas_user',
    password: process.env.DB_PASS || '',
  },
  dk: {
    host: process.env.DK_DB_HOST || 'pallium_dragonknight_db',
    port: parseInt(process.env.DK_DB_PORT || '5432'),
    database: process.env.DK_DB_NAME || 'dragonknight_database',
    user: process.env.DK_DB_USER || 'dk_user',
    password: process.env.DK_DB_PASS || process.env.DB_PASS || '',
  },
};

const POOL_CONFIG = {
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 30000,
};

// ── Pools (lazy-initialized) ──
const pools = {};

function getPool(academia = 'amas') {
  const key = academia === 'dk' ? 'dk' : 'amas';
  if (!pools[key]) {
    pools[key] = new Pool({ ...ACADEMIAS[key], ...POOL_CONFIG });
    pools[key].on('error', (err) => {
      console.error(`Error en pool PostgreSQL [${key}]:`, err);
    });
  }
  return pools[key];
}

// Default pool (AMAS) — backward compatible
const pool = getPool('amas');

// ── Active pool: resolves from AsyncLocalStorage context or defaults to AMAS ──
function activePool() {
  const store = academiaStore.getStore();
  return store?.academia ? getPool(store.academia) : pool;
}

// Helper: ejecuta query y retorna rows (uses context-aware pool)
async function query(text, params) {
  const result = await activePool().query(text, params);
  return result.rows;
}

// Helper: ejecuta query y retorna primera fila o null
async function queryOne(text, params) {
  const rows = await query(text, params);
  return rows[0] || null;
}

module.exports = { pool, pools, getPool, query, queryOne, ACADEMIAS, academiaStore };
