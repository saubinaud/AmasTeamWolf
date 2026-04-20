const { Pool } = require('pg');

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

// ── Pools ──
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

// Helper: ejecuta query y retorna rows
async function query(text, params, academia) {
  const p = academia ? getPool(academia) : pool;
  const result = await p.query(text, params);
  return result.rows;
}

// Helper: ejecuta query y retorna primera fila o null
async function queryOne(text, params, academia) {
  const rows = await query(text, params, academia);
  return rows[0] || null;
}

module.exports = { pool, pools, getPool, query, queryOne, ACADEMIAS };
