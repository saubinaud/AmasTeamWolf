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
       WHERE nombre_alumno_norm ILIKE $1
          OR nombre_apoderado_norm ILIKE $1
          OR dni_alumno_norm ILIKE $1
          OR dni_apoderado_norm ILIKE $1
       ORDER BY nombre_alumno ASC
       LIMIT 10`,
      [`%${String(searchTerm).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\s\-\.]/g, '')}%`]
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
      const normalizedSearch = `%${String(search).replace(/[\s\-\.]/g, '')}%`;
      conditions.push(`(g.nombre_alumno ILIKE $${paramIndex} OR g.apellido_alumno ILIKE $${paramIndex})`);
      params.push(normalizedSearch);
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
      `SELECT g.*, c.nombre AS cinturon_nombre, c.orden AS cinturon_orden
       FROM graduaciones g
       LEFT JOIN cinturones c ON c.id = g.cinturon_id
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

// ===== CINTURONES =====

// GET /api/space/graduaciones/cinturones — Catálogo completo de cinturones (desde tabla)
router.get('/cinturones', async (_req, res) => {
  try {
    const rows = await query('SELECT id, nombre, orden FROM cinturones WHERE activo = true ORDER BY orden ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error obteniendo cinturones:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// GET /api/space/graduaciones/cinturones/distribucion — Distribución de cinturones en la academia
router.get('/cinturones/distribucion', async (_req, res) => {
  try {
    const rows = await query(`
      SELECT COALESCE(c.nombre, a.cinturon_actual, 'Blanco') AS cinturon, COUNT(*) AS total
      FROM alumnos a
      LEFT JOIN cinturones c ON c.id = a.cinturon_actual_id
      WHERE a.estado = 'Activo'
      GROUP BY COALESCE(c.nombre, a.cinturon_actual, 'Blanco')
      ORDER BY total DESC
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
      `SELECT h.cinturon, h.cinturon_id, h.fecha_obtencion, h.observaciones, c.orden
       FROM historial_cinturones h
       LEFT JOIN cinturones c ON c.id = h.cinturon_id
       WHERE h.alumno_id = $1
       ORDER BY h.fecha_obtencion ASC`,
      [req.params.alumnoId]
    );
    const actual = await queryOne(
      `SELECT a.cinturon_actual, a.cinturon_actual_id, c.nombre AS cinturon_nombre, c.orden
       FROM alumnos a
       LEFT JOIN cinturones c ON c.id = a.cinturon_actual_id
       WHERE a.id = $1`,
      [req.params.alumnoId]
    );
    res.json({
      success: true,
      cinturon_actual: actual?.cinturon_actual || 'Blanco',
      cinturon_actual_id: actual?.cinturon_actual_id || null,
      historial: rows,
    });
  } catch (err) {
    console.error('Error historial cinturones:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
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

    // Resolve cinturon_id from rango name
    const cinturonRow = await queryOne('SELECT id FROM cinturones WHERE nombre = $1', [rango]);
    const cinturon_id = cinturonRow?.id || null;

    const row = await queryOne(
      `INSERT INTO graduaciones
        (nombre_alumno, apellido_alumno, rango, horario, turno, fecha_graduacion,
         alumno_id, inscripcion_id, sede_id, observaciones, cinturon_id, estado, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'programada', $12)
       RETURNING *`,
      [
        nombre_alumno, apellido_alumno, rango, horario, turno, fecha_graduacion,
        alumno_id || null, inscripcion_id || null, sede_id || null,
        observaciones || null, cinturon_id, req.spaceUser.id,
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

    // Pre-load cinturones for fast lookup
    const cinturonRows = await client.query('SELECT id, nombre FROM cinturones').then(r => r.rows);
    const cinturonMap = new Map(cinturonRows.map(c => [c.nombre, c.id]));

    for (const g of graduaciones) {
      const cinturon_id = cinturonMap.get(g.rango) || null;
      await client.query(
        `INSERT INTO graduaciones
          (nombre_alumno, apellido_alumno, rango, horario, turno, fecha_graduacion,
           alumno_id, inscripcion_id, sede_id, observaciones, cinturon_id, estado, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'programada', $12)`,
        [
          g.nombre_alumno, g.apellido_alumno, g.rango, g.horario, g.turno, g.fecha_graduacion,
          g.alumno_id || null, g.inscripcion_id || null, g.sede_id || null,
          g.observaciones || null, cinturon_id, req.spaceUser.id,
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

// (cinturones and historial routes moved above /:id to avoid route conflict)

// PUT /api/space/graduaciones/:id/aprobar — Aprobar graduación y ascender cinturón
router.put('/:id/aprobar', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { cinturon_hasta } = req.body; // Puede override el cinturón

    await client.query('BEGIN');

    const grad = await client.query(
      'SELECT alumno_id, cinturon_desde, cinturon_hasta, rango, cinturon_id, nombre_alumno FROM graduaciones WHERE id = $1',
      [id]
    ).then(r => r.rows[0]);

    if (!grad) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Graduación no encontrada' });
    }

    // Determine the new belt: explicit override > cinturon_hasta > rango
    const nuevoCinturon = cinturon_hasta || grad.cinturon_hasta || grad.rango;

    // Resolve cinturon_id from the name
    let cinturonId = grad.cinturon_id;
    if (nuevoCinturon && !cinturonId) {
      const cRow = await client.query('SELECT id FROM cinturones WHERE nombre = $1', [nuevoCinturon]).then(r => r.rows[0]);
      if (cRow) cinturonId = cRow.id;
    }

    // 1. Marcar graduación como aprobada
    await client.query(
      "UPDATE graduaciones SET aprobado = TRUE, estado = 'completada', cinturon_hasta = $1, cinturon_id = $2, updated_at = NOW() WHERE id = $3",
      [nuevoCinturon, cinturonId || null, id]
    );

    // 2. Actualizar cinturón actual del alumno (VARCHAR + ID)
    if (nuevoCinturon && grad.alumno_id) {
      await client.query(
        'UPDATE alumnos SET cinturon_actual = $1, cinturon_actual_id = $2 WHERE id = $3',
        [nuevoCinturon, cinturonId || null, grad.alumno_id]
      );
    }

    // 3. Registrar en historial (VARCHAR + ID)
    if (nuevoCinturon && grad.alumno_id) {
      await client.query(
        'INSERT INTO historial_cinturones (alumno_id, cinturon, cinturon_id, fecha_obtencion, graduacion_id) VALUES ($1, $2, $3, CURRENT_DATE, $4)',
        [grad.alumno_id, nuevoCinturon, cinturonId || null, id]
      );
    }

    await client.query('COMMIT');

    console.log(`[GRAD] Aprobada: ${grad.nombre_alumno}, ${grad.cinturon_desde || 'Blanco'} → ${nuevoCinturon}`);
    res.json({ success: true, nuevo_cinturon: nuevoCinturon, cinturon_id: cinturonId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error aprobando graduación:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  } finally {
    client.release();
  }
});

// ===== CARGA MASIVA DE GRADUACIONES (F9.1) =====

// Belt order for eligibility checks
const BELT_ORDER = [
  'Blanco', 'Blanco-Amarillo', 'Amarillo', 'Amarillo Camuflado',
  'Naranja', 'Naranja Camuflado', 'Verde', 'Verde Camuflado',
  'Azul', 'Azul Camuflado', 'Rojo', 'Rojo Camuflado', 'Negro',
];

// POST /api/space/graduaciones/batch — Batch graduation processing
router.post('/batch', async (req, res) => {
  const client = await pool.connect();
  try {
    const { graduaciones } = req.body;

    if (!Array.isArray(graduaciones) || graduaciones.length === 0) {
      return res.status(400).json({ success: false, error: 'Se requiere un array de graduaciones', code: 'GRAD_BATCH_EMPTY' });
    }

    if (graduaciones.length > 100) {
      return res.status(400).json({ success: false, error: 'Maximo 100 graduaciones por lote', code: 'GRAD_BATCH_LIMIT' });
    }

    await client.query('BEGIN');

    const results = [];
    const errors = [];

    for (let i = 0; i < graduaciones.length; i++) {
      const g = graduaciones[i];
      try {
        if (!g.alumno_id || !g.cinturon_nuevo || !g.fecha_examen) {
          errors.push({ index: i, error: 'Campos requeridos: alumno_id, cinturon_nuevo, fecha_examen' });
          continue;
        }

        // Get current belt for the student
        const alumno = await client.query(
          'SELECT id, nombre_alumno, cinturon_actual FROM alumnos WHERE id = $1',
          [g.alumno_id]
        ).then(r => r.rows[0]);

        if (!alumno) {
          errors.push({ index: i, error: `Alumno ${g.alumno_id} no encontrado` });
          continue;
        }

        const cinturonAnterior = g.cinturon_anterior || alumno.cinturon_actual || 'Blanco';

        // 1. INSERT into graduaciones
        const gradRow = await client.query(
          `INSERT INTO graduaciones
            (nombre_alumno, apellido_alumno, rango, cinturon_desde, cinturon_hasta,
             horario, turno, fecha_graduacion, alumno_id, observaciones,
             estado, aprobado, created_by)
           VALUES ($1, '', $2, $3, $4, $5, $6, $7, $8, $9, 'completada', TRUE, $10)
           RETURNING id`,
          [
            alumno.nombre_alumno,
            g.cinturon_nuevo,
            cinturonAnterior,
            g.cinturon_nuevo,
            g.horario || '',
            g.turno || 'primer',
            g.fecha_examen,
            g.alumno_id,
            g.observaciones || null,
            req.spaceUser.id,
          ]
        ).then(r => r.rows[0]);

        // 2. UPDATE alumnos SET cinturon_actual
        await client.query(
          'UPDATE alumnos SET cinturon_actual = $1 WHERE id = $2',
          [g.cinturon_nuevo, g.alumno_id]
        );

        // 3. INSERT into historial_cinturones
        await client.query(
          'INSERT INTO historial_cinturones (alumno_id, cinturon, fecha_obtencion, graduacion_id) VALUES ($1, $2, $3, $4)',
          [g.alumno_id, g.cinturon_nuevo, g.fecha_examen, gradRow.id]
        );

        results.push({ index: i, alumno_id: g.alumno_id, nombre: alumno.nombre_alumno, graduacion_id: gradRow.id });
      } catch (rowErr) {
        errors.push({ index: i, error: rowErr.message });
      }
    }

    if (errors.length > 0 && results.length === 0) {
      // All failed — rollback
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Todas las graduaciones fallaron', errors });
    }

    await client.query('COMMIT');

    return res.json({
      success: true,
      processed: results.length,
      errors: errors.length > 0 ? errors : undefined,
      results,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en batch de graduaciones:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'GRAD_BATCH_ERROR' });
  } finally {
    client.release();
  }
});

module.exports = router;
