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
              i.frecuencia_semanal,
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

// NOTA: POST /api/space/inscripciones y /renovar fueron eliminados.
// Las páginas Inscribir/Renovar de Space ahora usan los endpoints públicos
// /api/matricula y /api/renovacion, que manejan contrato firmado + email.

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
      'codigo_promocional', 'tipo_cliente', 'frecuencia_semanal',
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

// POST /api/space/inscripciones/:id/pago — Register a manual payment
router.post('/:id/pago', async (req, res) => {
  try {
    const { monto, metodo_pago, observaciones } = req.body;

    if (!monto || isNaN(Number(monto)) || Number(monto) <= 0) {
      return res.status(400).json({ success: false, error: 'Monto inválido', code: 'PAGO_INVALID_MONTO' });
    }
    if (!metodo_pago) {
      return res.status(400).json({ success: false, error: 'Método de pago requerido', code: 'PAGO_NO_METODO' });
    }

    const inscripcion = await queryOne('SELECT * FROM inscripciones WHERE id = $1', [req.params.id]);
    if (!inscripcion) {
      return res.status(404).json({ success: false, error: 'Inscripción no encontrada', code: 'INSC_NOT_FOUND' });
    }

    const montoNum = Number(monto);

    // Insert pago
    const pago = await queryOne(
      `INSERT INTO pagos (inscripcion_id, monto, fecha, tipo, metodo_pago, observaciones)
       VALUES ($1, $2, NOW(), 'Pago manual', $3, $4)
       RETURNING *`,
      [req.params.id, montoNum, metodo_pago, observaciones || null]
    );

    // Update precio_pagado
    const nuevoPagado = parseFloat(inscripcion.precio_pagado || 0) + montoNum;
    const precioPrograma = parseFloat(inscripcion.precio_programa || 0);
    const nuevoEstadoPago = nuevoPagado >= precioPrograma ? 'Pagado' : 'Parcial';

    const updatedInscripcion = await queryOne(
      `UPDATE inscripciones SET precio_pagado = $1, estado_pago = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [nuevoPagado, nuevoEstadoPago, req.params.id]
    );

    return res.json({
      success: true,
      data: {
        pago,
        inscripcion: updatedInscripcion,
      },
    });
  } catch (err) {
    console.error('Error registrando pago:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'PAGO_CREATE_ERROR' });
  }
});

module.exports = router;
