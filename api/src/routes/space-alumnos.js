const { Router } = require('express');
const { query, queryOne, pool } = require('../db');

const router = Router();

// GET /api/space/alumnos/stats
router.get('/stats', async (_req, res) => {
  try {
    const row = await queryOne(`
      SELECT
        COUNT(*) FILTER (WHERE LOWER(estado) = 'activo') AS activos,
        COUNT(*) FILTER (WHERE LOWER(estado) = 'inactivo') AS inactivos,
        COUNT(*) FILTER (WHERE LOWER(estado) = 'congelado') AS congelados,
        COUNT(*) AS total
      FROM alumnos
    `);
    return res.json({
      success: true,
      stats: {
        activos: parseInt(row.activos),
        inactivos: parseInt(row.inactivos),
        congelados: parseInt(row.congelados),
        total: parseInt(row.total),
      },
    });
  } catch (err) {
    console.error('Error stats alumnos:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// GET /api/space/alumnos — Lista enriquecida con programa, clases, asistencias
router.get('/', async (req, res) => {
  try {
    const { search, estado } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let idx = 1;

    if (estado) {
      conditions.push(`LOWER(a.estado) = $${idx++}`);
      params.push(estado.toLowerCase());
    }
    if (search) {
      conditions.push(`(a.nombre_alumno ILIKE $${idx} OR a.dni_alumno ILIKE $${idx} OR a.dni_apoderado ILIKE $${idx} OR a.nombre_apoderado ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Single optimized query: count + data
    const [countResult, rows] = await Promise.all([
      queryOne(`SELECT COUNT(*) AS total FROM alumnos a ${where}`, params),
      query(`
        SELECT
          a.id,
          a.nombre_alumno AS nombre,
          a.dni_alumno AS dni,
          a.dni_apoderado,
          a.nombre_apoderado,
          a.categoria,
          a.cinturon_actual,
          LOWER(a.estado) AS estado,
          a.telefono,
          a.correo,
          i.programa,
          i.clases_totales,
          i.fecha_fin,
          COALESCE(ast.asistidas, 0) AS clases_asistidas,
          CASE WHEN i.clases_totales > 0 THEN GREATEST(i.clases_totales - COALESCE(ast.asistidas, 0), 0) ELSE 0 END AS clases_restantes
        FROM alumnos a
        LEFT JOIN LATERAL (
          SELECT id, programa, clases_totales, fecha_inicio, fecha_fin
          FROM inscripciones WHERE alumno_id = a.id AND estado = 'Activo'
          ORDER BY fecha_inscripcion DESC LIMIT 1
        ) i ON true
        LEFT JOIN LATERAL (
          SELECT COUNT(*) AS asistidas
          FROM asistencias WHERE alumno_id = a.id
            AND CASE WHEN i.fecha_inicio IS NOT NULL THEN fecha >= i.fecha_inicio AND fecha <= i.fecha_fin ELSE FALSE END
        ) ast ON true
        ${where}
        ORDER BY a.nombre_alumno ASC
        LIMIT $${idx++} OFFSET $${idx++}
      `, [...params, limit, offset]),
    ]);

    return res.json({
      success: true,
      data: rows,
      total: parseInt(countResult.total),
      page,
      totalPages: Math.ceil(parseInt(countResult.total) / limit),
    });
  } catch (err) {
    console.error('Error listando alumnos:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// GET /api/space/alumnos/:id — Detalle completo enriquecido
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    // Parallel queries for speed
    const [alumno, inscripciones, asistenciasRecientes, totalAsistencias] = await Promise.all([
      queryOne('SELECT * FROM alumnos WHERE id = $1', [id]),
      query(`
        SELECT id, programa, fecha_inscripcion, fecha_inicio, fecha_fin,
               clases_totales, turno, dias_tentativos,
               precio_programa, precio_pagado, descuento,
               estado, estado_pago
        FROM inscripciones WHERE alumno_id = $1
        ORDER BY fecha_inscripcion DESC
      `, [id]),
      query(`
        SELECT fecha, hora::text, turno, asistio
        FROM asistencias WHERE alumno_id = $1
        ORDER BY fecha DESC, hora DESC LIMIT 30
      `, [id]),
      queryOne('SELECT COUNT(*) AS total FROM asistencias WHERE alumno_id = $1', [id]),
    ]);

    if (!alumno) {
      return res.status(404).json({ success: false, error: 'Alumno no encontrado' });
    }

    // Find active inscription and calculate classes
    const activa = inscripciones.find(i => i.estado === 'Activo');
    let clases_asistidas = 0;
    if (activa) {
      const conteo = await queryOne(
        'SELECT COUNT(*) AS total FROM asistencias WHERE alumno_id = $1 AND fecha >= $2 AND fecha <= $3',
        [id, activa.fecha_inicio, activa.fecha_fin]
      );
      clases_asistidas = parseInt(conteo?.total || '0');
    }

    return res.json({
      success: true,
      data: {
        id: alumno.id,
        nombre: alumno.nombre_alumno,
        dni: alumno.dni_alumno,
        dni_apoderado: alumno.dni_apoderado,
        fecha_nacimiento: alumno.fecha_nacimiento,
        categoria: alumno.categoria,
        estado: (alumno.estado || '').toLowerCase(),
        cinturon_actual: alumno.cinturon_actual || 'Blanco',
        nombre_apoderado: alumno.nombre_apoderado,
        telefono_apoderado: alumno.telefono,
        correo_apoderado: alumno.correo,
        direccion: alumno.direccion,
        // Inscripción activa + plan
        programa_activo: activa?.programa || null,
        clases_totales: activa ? parseInt(activa.clases_totales) : 0,
        clases_asistidas,
        clases_restantes: activa ? Math.max(0, parseInt(activa.clases_totales) - clases_asistidas) : 0,
        fecha_fin_plan: activa?.fecha_fin || null,
        estado_pago: activa?.estado_pago || null,
        turno: activa?.turno || null,
        dias: activa?.dias_tentativos || null,
        // Todas las inscripciones
        inscripciones: inscripciones.map(i => ({
          id: i.id,
          programa: i.programa,
          fecha_inicio: i.fecha_inicio,
          fecha_fin: i.fecha_fin,
          estado_pago: i.estado_pago,
          activa: i.estado === 'Activo',
          clases_totales: parseInt(i.clases_totales) || 0,
        })),
        // Asistencias
        asistencias_total: parseInt(totalAsistencias?.total || '0'),
        asistencias_recientes: asistenciasRecientes,
      },
    });
  } catch (err) {
    console.error('Error obteniendo alumno:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// PUT /api/space/alumnos/:id
router.put('/:id', async (req, res) => {
  try {
    const fieldMap = {
      nombre_alumno: 'nombre_alumno',
      dni_alumno: 'dni_alumno',
      fecha_nacimiento: 'fecha_nacimiento',
      categoria: 'categoria',
      estado: 'estado',
      nombre_apoderado: 'nombre_apoderado',
      telefono: 'telefono',
      correo: 'correo',
      direccion: 'direccion',
    };

    const updates = [];
    const params = [];
    let idx = 1;

    for (const [bodyField, dbField] of Object.entries(fieldMap)) {
      if (req.body[bodyField] !== undefined) {
        updates.push(`${dbField} = $${idx++}`);
        params.push(req.body[bodyField]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No hay campos para actualizar' });
    }

    updates.push('updated_at = NOW()');
    params.push(req.params.id);

    const row = await queryOne(
      `UPDATE alumnos SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (!row) return res.status(404).json({ success: false, error: 'Alumno no encontrado' });
    return res.json({ success: true, data: row });
  } catch (err) {
    console.error('Error actualizando alumno:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

module.exports = router;
