const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'pallium_amas-db',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'amas_database',
  user: process.env.DB_USER || 'amas_user',
  password: process.env.DB_PASS || 'Aubinaud2',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Error inesperado en pool PostgreSQL:', err);
});

// Helper: ejecuta query y retorna rows
async function query(text, params) {
  const result = await pool.query(text, params);
  return result.rows;
}

// Helper: ejecuta query y retorna primera fila o null
async function queryOne(text, params) {
  const rows = await query(text, params);
  return rows[0] || null;
}

module.exports = { pool, query, queryOne };
