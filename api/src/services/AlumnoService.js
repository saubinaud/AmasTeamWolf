const { query, queryOne } = require('../db');
const { NotFoundError } = require('./errors');

function normalizeDni(val) {
  return String(val).replace(/[\s\-\.]/g, '').trim().toUpperCase();
}

function normalizeNombre(val) {
  return String(val).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/**
 * Busca alumno por DNI (alumno O apoderado) en una sola query.
 * Ordena por match exacto en dni_alumno_norm primero.
 */
async function buscarPorDni(dni, { soloActivos = false } = {}) {
  const dniNorm = normalizeDni(dni);
  const activoCondition = soloActivos ? `AND LOWER(a.estado) = 'activo'` : '';

  const alumno = await queryOne(`
    SELECT a.*
    FROM alumnos a
    WHERE (a.dni_alumno_norm = $1 OR a.dni_apoderado_norm = $1)
      ${activoCondition}
    ORDER BY CASE WHEN a.dni_alumno_norm = $1 THEN 0 ELSE 1 END
    LIMIT 1
  `, [dniNorm]);

  return alumno || null;
}

/**
 * Búsqueda unificada: split en palabras, cada una debe matchear nombre_alumno_norm via LIKE.
 * También matchea campos DNI.
 */
async function buscar(q, { limit = 8, soloActivos = false } = {}) {
  if (!q || q.length < 2) return [];

  const normalized = normalizeNombre(q);
  const words = normalized.split(/\s+/).filter(w => w.length >= 2);

  if (words.length === 0) return [];

  const nameConditions = words.map((_, i) => `nombre_alumno_norm LIKE '%' || $${i + 1} || '%'`).join(' AND ');
  const dniParam = words.length + 1;
  const limitParam = words.length + 2;
  const params = [...words, normalized, limit];

  const activoCondition = soloActivos ? `LOWER(a.estado) = 'activo' AND` : '';

  const rows = await query(`
    SELECT a.id, a.nombre_alumno, a.dni_alumno, a.categoria
    FROM alumnos a
    WHERE ${activoCondition}
      (
        (${nameConditions})
        OR dni_alumno LIKE '%' || $${dniParam} || '%'
        OR dni_apoderado LIKE '%' || $${dniParam} || '%'
      )
    ORDER BY nombre_alumno
    LIMIT $${limitParam}
  `, params);

  return rows;
}

/**
 * Obtiene alumno por ID. Lanza NotFoundError si no existe.
 */
async function getById(id) {
  const alumno = await queryOne('SELECT * FROM alumnos WHERE id = $1', [id]);
  if (!alumno) throw new NotFoundError('Alumno no encontrado');
  return alumno;
}

/**
 * Lista ligera de alumnos activos para cache client-side.
 */
async function listarActivos() {
  return query(`
    SELECT a.id, a.nombre_alumno, a.dni_alumno, a.categoria
    FROM alumnos a
    WHERE LOWER(a.estado) = 'activo'
    ORDER BY a.nombre_alumno
  `);
}

module.exports = {
  normalizeDni,
  normalizeNombre,
  buscarPorDni,
  buscar,
  getById,
  listarActivos,
};
