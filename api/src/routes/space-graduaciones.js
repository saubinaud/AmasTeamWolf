const { Router } = require('express');
const { query, queryOne, pool } = require('../db');

const router = Router();

// Allowed sort columns to prevent SQL injection
const ALLOWED_SORT_COLUMNS = [
  'fecha_graduacion', 'nombre_alumno', 'apellido_alumno',
  'rango', 'turno', 'estado', 'created_at',
];
const BULK_REQUIRED_FIELDS = ['nombre_alumno', 'apellido_alumno', 'rango', 'horario', 'turno', 'fecha_graduacion'];

// GET /api/space/graduaciones/stats — Quick counts
router.get('/stats', async (_req, res) => {
  try {
    const [programadas, completadas, canceladas] = await Promise.all([
      queryOne("SELECT COUNT(*) AS total FROM graduaciones WHERE estado = 'programada'"),
      queryOne("SELECT COUNT(*) AS total FROM graduaciones WHERE estado = 'completada'"),
      queryOne("SELECT COUNT(*) AS total FROM graduaciones WHERE estado = 'cancelada'"),
    ]);

    return res.json({
      success: true,
      stats: {
        programadas: parseInt(programadas.total, 10),
        completadas: parseInt(completadas.total, 10),
        canceladas: parseInt(canceladas.total, 10),
      },
    });
  } catch (err) {
    console.error('Error obteniendo stats de graduaciones:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'GRAD_STATS_ERROR' });
  }
});

// GET /api/space/graduaciones/correcciones — List corrections
router.get('/correcciones', async (req, res) => {
  try {
    const estado = req.query.estado || 'pendiente';

    const rows = await query(
      `SELECT gc.*, g.nombre_alumno, g.apellido_alumno, g.rango, g.fecha_graduacion
       FROM graduacion_correcciones gc
       JOIN graduaciones g ON g.id = gc.graduacion_id
       WHERE gc.estado = $1
       ORDER BY gc.created_at DESC
       LIMIT 100`,
      [estado]
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error obteniendo correcciones:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'GRAD_CORRECCIONES_ERROR' });
  }
});

// GET /api/space/graduaciones/alumnos/buscar — Search students for autocomplete
router.get('/alumnos/buscar', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, data: [] });
    }

    const searchTerm = q.trim();
    const rows = await query(
      `SELECT id,
              nombre_alumno AS nombre,
              '' AS apellido,
              dni_alumno AS dni
       FROM alumnos
       WHERE nombre_alumno ILIKE $1
          OR REPLACE(REPLACE(REPLACE(dni_alumno, ' ', ''), '-', ''), '.', '') ILIKE $2
          OR REPLACE(REPLACE(REPLACE(dni_apoderado, ' ', ''), '-', ''), '.', '') ILIKE $2
       ORDER BY nombre_alumno ASC
       LIMIT 10`,
      [`%${searchTerm}%`, `%${String(searchTerm).replace(/[\s\-\.]/g, '')}%`]
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error buscando alumnos:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'GRAD_SEARCH_ERROR' });
  }
});

// GET /api/space/graduaciones — List graduations with filters, pagination, sorting
router.get('/', async (req, res) => {
  try {
    const { fecha, turno, estado, search, sort, order } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const conditions = ["g.estado != 'cancelada'"];
    const params = [];
    let paramIndex = 1;

    if (fecha) {
      conditions.push(`g.fecha_graduacion = $${paramIndex++}`);
      params.push(fecha);
    }
    if (turno) {
      conditions.push(`g.turno = $${paramIndex++}`);
      params.push(turno);
    }
    if (estado) {
      conditions.push(`g.estado = $${paramIndex++}`);
      params.push(estado);
    }
    if (search) {
      conditions.push(`(g.nombre_alumno ILIKE $${paramIndex} OR g.apellido_alumno ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Safe sorting: whitelist column names
    const sortColumn = ALLOWED_SORT_COLUMNS.includes(sort) ? `g.${sort}` : 'g.fecha_graduacion';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

    // Count total for pagination
    const countResult = await queryOne(
      `SELECT COUNT(*) AS total FROM graduaciones g ${where}`,
      params
    );
    const total = parseInt(countResult.total, 10);
    const totalPages = Math.ceil(total / limit);

    // Fetch page
    const rows = await query(
      `SELECT g.*
       FROM graduaciones g
       ${where}
       ORDER BY ${sortColumn} ${sortOrder}
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
    console.error('Error listando graduaciones:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'GRAD_LIST_ERROR' });
  }
});

// GET /api/space/graduaciones/:id — Single graduation detail
router.get('/:id', async (req, res) => {
  try {
    const row = await queryOne('SELECT * FROM graduaciones WHERE id = $1', [req.params.id]);

    if (!row) {
      return res.status(404).json({ success: false, error: 'Graduación no encontrada', code: 'GRAD_NOT_FOUND' });
    }

    return res.json({ success: true, data: row });
  } catch (err) {
    console.error('Error obteniendo graduación:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'GRAD_GET_ERROR' });
  }
});

// POST /api/space/graduaciones — Create graduation
router.post('/', async (req, res) => {
  try {
    const {
      nombre_alumno, apellido_alumno, rango, horario, turno,
      fecha_graduacion, alumno_id, inscripcion_id, sede_id, observaciones,
    } = req.body;

    if (!nombre_alumno || !apellido_alumno || !rango || !horario || !turno || !fecha_graduacion) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: nombre_alumno, apellido_alumno, rango, horario, turno, fecha_graduacion',
        code: 'GRAD_MISSING_FIELDS',
      });
    }

    const row = await queryOne(
      `INSERT INTO graduaciones
        (nombre_alumno, apellido_alumno, rango, horario, turno, fecha_graduacion,
         alumno_id, inscripcion_id, sede_id, observaciones, estado, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'programada', $11)
       RETURNING *`,
      [
        nombre_alumno, apellido_alumno, rango, horario, turno, fecha_graduacion,
        alumno_id || null, inscripcion_id || null, sede_id || null,
        observaciones || null, req.spaceUser.id,
      ]
    );

    return res.json({ success: true, data: row });
  } catch (err) {
    console.error('Error creando graduación:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'GRAD_CREATE_ERROR' });
  }
});

// POST /api/space/graduaciones/bulk — Create multiple graduations
router.post('/bulk', async (req, res) => {
  const client = await pool.connect();
  try {
    const { graduaciones } = req.body;

    if (!Array.isArray(graduaciones) || graduaciones.length === 0) {
      return res.status(400).json({ success: false, error: 'Se requiere un array de graduaciones', code: 'GRAD_BULK_EMPTY' });
    }

    // Validate each record has required fields before inserting
    const errors = [];
    graduaciones.forEach((g, index) => {
      const missing = BULK_REQUIRED_FIELDS.filter(f => !g[f]);
      if (missing.length > 0) {
        errors.push({ index, missing });
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Registros con campos faltantes',
        code: 'GRAD_BULK_VALIDATION',
        details: errors,
      });
    }

    await client.query('BEGIN');

    for (const g of graduaciones) {
      await client.query(
        `INSERT INTO graduaciones
          (nombre_alumno, apellido_alumno, rango, horario, turno, fecha_graduacion,
           alumno_id, inscripcion_id, sede_id, observaciones, estado, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'programada', $11)`,
        [
          g.nombre_alumno, g.apellido_alumno, g.rango, g.horario, g.turno, g.fecha_graduacion,
          g.alumno_id || null, g.inscripcion_id || null, g.sede_id || null,
          g.observaciones || null, req.spaceUser.id,
        ]
      );
    }

    await client.query('COMMIT');
    return res.json({ success: true, count: graduaciones.length });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en bulk insert de graduaciones:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'GRAD_BULK_ERROR' });
  } finally {
    client.release();
  }
});

// PATCH /api/space/graduaciones/:id/estado — Quick status change
router.patch('/:id/estado', async (req, res) => {
  try {
    const { estado } = req.body;
    const validEstados = ['programada', 'completada', 'cancelada'];

    if (!estado || !validEstados.includes(estado)) {
      return res.status(400).json({
        success: false,
        error: `Estado debe ser uno de: ${validEstados.join(', ')}`,
        code: 'GRAD_INVALID_STATUS',
      });
    }

    const row = await queryOne(
      `UPDATE graduaciones
       SET estado = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, estado, nombre_alumno, apellido_alumno`,
      [estado, req.params.id]
    );

    if (!row) {
      return res.status(404).json({ success: false, error: 'Graduación no encontrada', code: 'GRAD_NOT_FOUND' });
    }

    return res.json({ success: true, data: row });
  } catch (err) {
    console.error('Error cambiando estado de graduación:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'GRAD_PATCH_ERROR' });
  }
});

// PUT /api/space/graduaciones/correcciones/:id — Resolve correction
router.put('/correcciones/:id', async (req, res) => {
  try {
    const { estado } = req.body;

    if (!estado || !['resuelta', 'rechazada'].includes(estado)) {
      return res.status(400).json({ success: false, error: 'Estado debe ser "resuelta" o "rechazada"', code: 'GRAD_CORR_INVALID_STATUS' });
    }

    const row = await queryOne(
      `UPDATE graduacion_correcciones
       SET estado = $1, resuelta_por = $2
       WHERE id = $3
       RETURNING *`,
      [estado, req.spaceUser.id, req.params.id]
    );

    if (!row) {
      return res.status(404).json({ success: false, error: 'Corrección no encontrada', code: 'GRAD_CORR_NOT_FOUND' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Error actualizando corrección:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'GRAD_CORR_ERROR' });
  }
});

// PUT /api/space/graduaciones/:id — Update graduation
router.put('/:id', async (req, res) => {
  try {
    const allowedFields = [
      'nombre_alumno', 'apellido_alumno', 'rango', 'horario', 'turno',
      'fecha_graduacion', 'alumno_id', 'inscripcion_id', 'sede_id',
      'estado', 'observaciones',
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
      return res.status(400).json({ success: false, error: 'No hay campos para actualizar', code: 'GRAD_NO_FIELDS' });
    }

    updates.push(`updated_at = NOW()`);
    params.push(req.params.id);

    const row = await queryOne(
      `UPDATE graduaciones SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (!row) {
      return res.status(404).json({ success: false, error: 'Graduación no encontrada', code: 'GRAD_NOT_FOUND' });
    }

    return res.json({ success: true, data: row });
  } catch (err) {
    console.error('Error actualizando graduación:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'GRAD_UPDATE_ERROR' });
  }
});

// DELETE /api/space/graduaciones/:id — Soft delete
router.delete('/:id', async (req, res) => {
  try {
    const row = await queryOne(
      `UPDATE graduaciones SET estado = 'cancelada', updated_at = NOW() WHERE id = $1 RETURNING id`,
      [req.params.id]
    );

    if (!row) {
      return res.status(404).json({ success: false, error: 'Graduación no encontrada', code: 'GRAD_NOT_FOUND' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Error eliminando graduación:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'GRAD_DELETE_ERROR' });
  }
});

// ===== CINTURONES =====

// Orden oficial de cinturones
const CINTURONES_ORDEN = [
  'Blanco', 'Blanco-Amarillo', 'Amarillo', 'Amarillo-Verde',
  'Verde', 'Verde-Azul', 'Azul', 'Azul-Rojo',
  'Rojo', 'Rojo-Negro', 'Negro 1 Dan', 'Negro 2 Dan', 'Negro 3 Dan'
];

// GET /api/space/graduaciones/cinturones — Orden oficial de cinturones
router.get('/cinturones', (_req, res) => {
  res.json({ success: true, data: CINTURONES_ORDEN });
});

// GET /api/space/graduaciones/cinturones/distribucion — Distribución de cinturones en la academia
router.get('/cinturones/distribucion', async (_req, res) => {
  try {
    const rows = await query(`
      SELECT cinturon_actual, COUNT(*) AS total
      FROM alumnos WHERE estado = 'Activo'
      GROUP BY cinturon_actual ORDER BY total DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error distribución cinturones:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// GET /api/space/graduaciones/historial/:alumnoId — Historial de cinturones de un alumno
router.get('/historial/:alumnoId', async (req, res) => {
  try {
    const rows = await query(
      'SELECT cinturon, fecha_obtencion, observaciones FROM historial_cinturones WHERE alumno_id = $1 ORDER BY fecha_obtencion ASC',
      [req.params.alumnoId]
    );
    const actual = await queryOne('SELECT cinturon_actual FROM alumnos WHERE id = $1', [req.params.alumnoId]);
    res.json({ success: true, cinturon_actual: actual?.cinturon_actual || 'Blanco', historial: rows });
  } catch (err) {
    console.error('Error historial cinturones:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// PUT /api/space/graduaciones/:id/aprobar — Aprobar graduación y ascender cinturón
router.put('/:id/aprobar', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { cinturon_hasta } = req.body; // Puede override el cinturón

    await client.query('BEGIN');

    const grad = await client.query(
      'SELECT alumno_id, cinturon_desde, cinturon_hasta, nombre_alumno FROM graduaciones WHERE id = $1',
      [id]
    ).then(r => r.rows[0]);

    if (!grad) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Graduación no encontrada' });
    }

    const nuevoCinturon = cinturon_hasta || grad.cinturon_hasta;

    // 1. Marcar graduación como aprobada
    await client.query(
      "UPDATE graduaciones SET aprobado = TRUE, estado = 'completada', cinturon_hasta = $1, updated_at = NOW() WHERE id = $2",
      [nuevoCinturon, id]
    );

    // 2. Actualizar cinturón actual del alumno
    if (nuevoCinturon && grad.alumno_id) {
      await client.query('UPDATE alumnos SET cinturon_actual = $1 WHERE id = $2', [nuevoCinturon, grad.alumno_id]);
    }

    // 3. Registrar en historial
    if (nuevoCinturon && grad.alumno_id) {
      await client.query(
        'INSERT INTO historial_cinturones (alumno_id, cinturon, fecha_obtencion, graduacion_id) VALUES ($1, $2, CURRENT_DATE, $3)',
        [grad.alumno_id, nuevoCinturon, id]
      );
    }

    await client.query('COMMIT');

    console.log(`[GRAD] Aprobada: ${grad.nombre_alumno}, ${grad.cinturon_desde} → ${nuevoCinturon}`);
    res.json({ success: true, nuevo_cinturon: nuevoCinturon });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error aprobando graduación:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  } finally {
    client.release();
  }
});

module.exports = router;
