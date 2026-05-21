const { query, queryOne } = require('../db');
const { NotFoundError } = require('./errors');

/**
 * Obtiene inscripción activa de un alumno.
 * Si strict=false y no hay activa, devuelve la más reciente.
 */
async function getActiva(alumnoId, { strict = false } = {}) {
  let inscripcion = await queryOne(`
    SELECT * FROM inscripciones
    WHERE alumno_id = $1 AND estado = 'Activo'
    ORDER BY fecha_inicio DESC
    LIMIT 1
  `, [alumnoId]);

  if (!inscripcion && !strict) {
    inscripcion = await queryOne(`
      SELECT * FROM inscripciones
      WHERE alumno_id = $1
      ORDER BY fecha_inicio DESC
      LIMIT 1
    `, [alumnoId]);
  }

  return inscripcion || null;
}

/**
 * Obtiene inscripción por ID con alumno, pagos y contratos.
 * Lanza NotFoundError si no existe.
 */
async function getById(id) {
  const inscripcion = await queryOne('SELECT * FROM inscripciones WHERE id = $1', [id]);
  if (!inscripcion) throw new NotFoundError('Inscripción no encontrada');

  const [alumno, pagos, contratos] = await Promise.all([
    queryOne('SELECT * FROM alumnos WHERE id = $1', [inscripcion.alumno_id]),
    query('SELECT * FROM pagos WHERE inscripcion_id = $1 ORDER BY created_at DESC', [id]),
    query('SELECT * FROM contratos WHERE inscripcion_id = $1 ORDER BY created_at DESC', [id]),
  ]);

  return {
    inscripcion,
    alumno: alumno || null,
    pagos,
    contratos,
  };
}

/**
 * Lista inscripciones paginadas con filtros y sort.
 * Replica la lógica exacta de space-inscripciones.js GET /
 */
async function listar(filters = {}) {
  const { programa, estado_pago, activa, vence_en, search, sort, order } = filters;
  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 20));
  const offset = (page - 1) * limit;

  // Safe sort columns
  const ALLOWED_SORT = ['created_at', 'fecha_inicio', 'fecha_fin', 'programa', 'clases_totales'];
  const sortCol = ALLOWED_SORT.includes(sort) ? `i.${sort}` : 'i.created_at';
  const sortDir = order === 'asc' ? 'ASC' : 'DESC';

  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (search) {
    const normalized = String(search).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const words = normalized.split(/\s+/).filter(w => w.length >= 2);
    if (words.length > 0) {
      const nameConditions = words.map((_, i) => `a.nombre_alumno_norm LIKE '%' || $${paramIndex + i} || '%'`).join(' AND ');
      conditions.push(`(${nameConditions} OR a.dni_alumno LIKE '%' || $${paramIndex + words.length} || '%')`);
      params.push(...words, normalized.replace(/\s+/g, ''));
      paramIndex += words.length + 1;
    }
  }

  if (programa) {
    conditions.push(`i.programa = $${paramIndex++}`);
    params.push(programa);
  }
  if (estado_pago) {
    conditions.push(`LOWER(i.estado_pago) = $${paramIndex++}`);
    params.push(estado_pago.toLowerCase());
  }
  if (activa !== undefined && activa !== '') {
    conditions.push(`i.estado = $${paramIndex++}`);
    params.push(activa === 'si' || activa === 'true' ? 'Activo' : 'Vencido');
  }
  if (vence_en && !isNaN(parseInt(vence_en, 10))) {
    const dias = parseInt(vence_en, 10);
    conditions.push(`i.estado = 'Activo' AND i.fecha_fin IS NOT NULL AND i.fecha_fin BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${dias} days'`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await queryOne(
    `SELECT COUNT(*) AS total FROM inscripciones i JOIN alumnos a ON a.id = i.alumno_id ${where}`,
    params
  );
  const total = parseInt(countResult.total, 10);
  const totalPages = Math.ceil(total / limit);

  const rows = await query(
    `SELECT i.id, i.alumno_id,
            a.nombre_alumno AS alumno_nombre,
            i.programa, i.fecha_inicio, i.fecha_fin,
            i.clases_totales, i.turno, i.dias_tentativos,
            i.frecuencia_semanal,
            LOWER(i.estado_pago) AS estado_pago,
            i.precio_programa, i.precio_pagado,
            (i.estado = 'Activo') AS activa,
            a.fecha_nacimiento,
            i.created_at
     FROM inscripciones i
     JOIN alumnos a ON a.id = i.alumno_id
     ${where}
     ORDER BY ${sortCol} ${sortDir}
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, limit, offset]
  );

  return { data: rows, total, page, totalPages };
}

module.exports = {
  getActiva,
  getById,
  listar,
};
