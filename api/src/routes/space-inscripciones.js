const { Router } = require('express');
const { query, queryOne, pool } = require('../db');

const router = Router();

// GET /api/space/inscripciones/vencimientos — Expiring within 7 days
router.get('/vencimientos', async (_req, res) => {
  try {
    const rows = await query(
      `SELECT i.*, a.nombre_alumno
       FROM inscripciones i
       JOIN alumnos a ON a.id = i.alumno_id
       WHERE i.estado = 'Activo'
         AND i.fecha_fin BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
       ORDER BY i.fecha_fin ASC`
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error obteniendo vencimientos:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'INSC_VENC_ERROR' });
  }
});

// GET /api/space/inscripciones — List inscripciones paginated with filters
router.get('/', async (req, res) => {
  try {
    const { programa, estado_pago, activa } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

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

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await queryOne(
      `SELECT COUNT(*) AS total FROM inscripciones i ${where}`,
      params
    );
    const total = parseInt(countResult.total, 10);
    const totalPages = Math.ceil(total / limit);

    const rows = await query(
      `SELECT i.id, i.alumno_id,
              a.nombre_alumno AS alumno_nombre,
              i.programa, i.fecha_inicio, i.fecha_fin,
              i.clases_totales, i.turno,
              LOWER(i.estado_pago) AS estado_pago,
              i.precio_programa, i.precio_pagado,
              (i.estado = 'Activo') AS activa,
              i.created_at
       FROM inscripciones i
       JOIN alumnos a ON a.id = i.alumno_id
       ${where}
       ORDER BY i.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    return res.json({
      success: true,
      data: rows,
      total,
      page,
      totalPages,
    });
  } catch (err) {
    console.error('Error listando inscripciones:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'INSC_LIST_ERROR' });
  }
});

// POST /api/space/inscripciones — Registrar nueva matrícula desde Space
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const d = req.body || {};

    if (!d.dni_alumno || !d.nombre_alumno || !d.programa) {
      client.release();
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: dni_alumno, nombre_alumno, programa',
        code: 'INSC_REQ_FIELDS',
      });
    }

    await client.query('BEGIN');

    // 1. Buscar o crear alumno
    let alumnoRow = await client
      .query('SELECT id FROM alumnos WHERE dni_alumno = $1', [d.dni_alumno])
      .then((r) => r.rows[0]);

    if (!alumnoRow) {
      const ins = await client.query(
        `INSERT INTO alumnos (nombre_alumno, dni_alumno, fecha_nacimiento, categoria,
         nombre_apoderado, dni_apoderado, correo, telefono, direccion, estado)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'activo')
         RETURNING id`,
        [
          d.nombre_alumno,
          d.dni_alumno,
          d.fecha_nacimiento || null,
          d.categoria || null,
          d.nombre_apoderado || null,
          d.dni_apoderado || null,
          d.correo || null,
          d.telefono || null,
          d.direccion || null,
        ]
      );
      alumnoRow = ins.rows[0];
    } else {
      await client.query(
        `UPDATE alumnos
         SET nombre_alumno = COALESCE($1, nombre_alumno),
             fecha_nacimiento = COALESCE($2, fecha_nacimiento),
             categoria = COALESCE($3, categoria),
             nombre_apoderado = COALESCE($4, nombre_apoderado),
             dni_apoderado = COALESCE($5, dni_apoderado),
             correo = COALESCE($6, correo),
             telefono = COALESCE($7, telefono),
             direccion = COALESCE($8, direccion),
             estado = 'activo',
             updated_at = NOW()
         WHERE id = $9`,
        [
          d.nombre_alumno || null,
          d.fecha_nacimiento || null,
          d.categoria || null,
          d.nombre_apoderado || null,
          d.dni_apoderado || null,
          d.correo || null,
          d.telefono || null,
          d.direccion || null,
          alumnoRow.id,
        ]
      );
    }

    // 2. Crear inscripción
    const inscIns = await client.query(
      `INSERT INTO inscripciones (
         alumno_id, programa, fecha_inscripcion, fecha_inicio, fecha_fin,
         clases_totales, turno, dias_tentativos,
         precio_programa, precio_pagado, descuento, codigo_promocional,
         tipo_cliente, estado, estado_pago
       ) VALUES ($1,$2,CURRENT_DATE,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'Activo',$13)
       RETURNING *`,
      [
        alumnoRow.id,
        d.programa,
        d.fecha_inicio || null,
        d.fecha_fin || null,
        d.clases_totales || 0,
        d.turno || null,
        d.dias_tentativos || null,
        d.precio_programa || 0,
        d.precio_pagado || 0,
        d.descuento || 0,
        d.codigo_promocional || null,
        d.tipo_cliente || 'Nuevo/Primer registro',
        d.estado_pago || 'Pendiente',
      ]
    );

    await client.query('COMMIT');

    return res.json({
      success: true,
      data: {
        alumno_id: alumnoRow.id,
        inscripcion: inscIns.rows[0],
      },
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error creando inscripción Space:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'INSC_CREATE_ERROR' });
  } finally {
    client.release();
  }
});

// POST /api/space/inscripciones/renovar — Renovar programa de un alumno existente
router.post('/renovar', async (req, res) => {
  const client = await pool.connect();
  try {
    const d = req.body || {};

    if (!d.alumno_id && !d.dni_alumno) {
      client.release();
      return res.status(400).json({
        success: false,
        error: 'Se requiere alumno_id o dni_alumno',
        code: 'INSC_REQ_ALUMNO',
      });
    }
    if (!d.programa) {
      client.release();
      return res.status(400).json({ success: false, error: 'programa es requerido', code: 'INSC_REQ_PROGRAMA' });
    }

    await client.query('BEGIN');

    const alumnoRow = d.alumno_id
      ? await client.query('SELECT id FROM alumnos WHERE id = $1', [d.alumno_id]).then((r) => r.rows[0])
      : await client.query('SELECT id FROM alumnos WHERE dni_alumno = $1', [d.dni_alumno]).then((r) => r.rows[0]);

    if (!alumnoRow) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Alumno no encontrado', code: 'INSC_ALUMNO_NF' });
    }

    // Marcar inscripciones activas previas como Vencido
    await client.query(
      `UPDATE inscripciones SET estado = 'Vencido', updated_at = NOW()
       WHERE alumno_id = $1 AND estado = 'Activo'`,
      [alumnoRow.id]
    );

    // Crear nueva inscripción (renovación)
    const inscIns = await client.query(
      `INSERT INTO inscripciones (
         alumno_id, programa, fecha_inscripcion, fecha_inicio, fecha_fin,
         clases_totales, turno, dias_tentativos,
         precio_programa, precio_pagado, descuento, codigo_promocional,
         tipo_cliente, estado, estado_pago
       ) VALUES ($1,$2,CURRENT_DATE,$3,$4,$5,$6,$7,$8,$9,$10,$11,'Renovación','Activo',$12)
       RETURNING *`,
      [
        alumnoRow.id,
        d.programa,
        d.fecha_inicio || null,
        d.fecha_fin || null,
        d.clases_totales || 0,
        d.turno || null,
        d.dias_tentativos || null,
        d.precio_programa || 0,
        d.precio_pagado || 0,
        d.descuento || 0,
        d.codigo_promocional || null,
        d.estado_pago || 'Pendiente',
      ]
    );

    await client.query('COMMIT');

    return res.json({
      success: true,
      data: {
        alumno_id: alumnoRow.id,
        inscripcion: inscIns.rows[0],
      },
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error renovando inscripción Space:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'INSC_RENEW_ERROR' });
  } finally {
    client.release();
  }
});

// GET /api/space/inscripciones/:id — Full detail with alumno, pagos, contratos
router.get('/:id', async (req, res) => {
  try {
    const inscripcion = await queryOne('SELECT * FROM inscripciones WHERE id = $1', [req.params.id]);

    if (!inscripcion) {
      return res.status(404).json({ success: false, error: 'Inscripcion no encontrada', code: 'INSC_NOT_FOUND' });
    }

    const [alumno, pagos, contratos] = await Promise.all([
      queryOne('SELECT * FROM alumnos WHERE id = $1', [inscripcion.alumno_id]),
      query('SELECT * FROM pagos WHERE inscripcion_id = $1 ORDER BY created_at DESC', [req.params.id]),
      query('SELECT * FROM contratos WHERE inscripcion_id = $1 ORDER BY created_at DESC', [req.params.id]),
    ]);

    return res.json({
      success: true,
      data: {
        inscripcion,
        alumno: alumno || null,
        pagos,
        contratos,
      },
    });
  } catch (err) {
    console.error('Error obteniendo inscripcion:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'INSC_GET_ERROR' });
  }
});

// PUT /api/space/inscripciones/:id — Update inscripcion fields
router.put('/:id', async (req, res) => {
  try {
    const allowedFields = [
      'programa', 'estado_pago', 'estado', 'fecha_inicio', 'fecha_fin',
      'clases_totales', 'turno', 'dias_tentativos',
      'precio_programa', 'precio_pagado', 'descuento',
      'codigo_promocional', 'tipo_cliente',
    ];

    const updates = [];
    const params = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`);
        params.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No hay campos para actualizar', code: 'INSC_NO_FIELDS' });
    }

    updates.push('updated_at = NOW()');
    params.push(req.params.id);

    const row = await queryOne(
      `UPDATE inscripciones SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (!row) {
      return res.status(404).json({ success: false, error: 'Inscripcion no encontrada', code: 'INSC_NOT_FOUND' });
    }

    return res.json({ success: true, data: row });
  } catch (err) {
    console.error('Error actualizando inscripcion:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'INSC_UPDATE_ERROR' });
  }
});

module.exports = router;
