const { Router } = require('express');
const { query, queryOne, pool } = require('../db');

const router = Router();

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
    return res.status(500).json({ success: false, error: 'Error del servidor' });
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
       ORDER BY gc.created_at DESC`,
      [estado]
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error obteniendo correcciones:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
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
      `SELECT id, nombre_alumno AS nombre, dni
       FROM alumnos
       WHERE nombre_alumno ILIKE $1 OR dni LIKE $2
       LIMIT 10`,
      [`%${searchTerm}%`, `${searchTerm}%`]
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error buscando alumnos:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// GET /api/space/graduaciones — List graduations with filters
router.get('/', async (req, res) => {
  try {
    const { fecha, turno, estado, search } = req.query;
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

    const rows = await query(
      `SELECT g.*
       FROM graduaciones g
       ${where}
       ORDER BY g.fecha_graduacion DESC`,
      params
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error listando graduaciones:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// GET /api/space/graduaciones/:id — Single graduation detail
router.get('/:id', async (req, res) => {
  try {
    const row = await queryOne('SELECT * FROM graduaciones WHERE id = $1', [req.params.id]);

    if (!row) {
      return res.status(404).json({ success: false, error: 'Graduación no encontrada' });
    }

    return res.json({ success: true, data: row });
  } catch (err) {
    console.error('Error obteniendo graduación:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
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
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// POST /api/space/graduaciones/bulk — Create multiple graduations
router.post('/bulk', async (req, res) => {
  const client = await pool.connect();
  try {
    const { graduaciones } = req.body;

    if (!Array.isArray(graduaciones) || graduaciones.length === 0) {
      return res.status(400).json({ success: false, error: 'Se requiere un array de graduaciones' });
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
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  } finally {
    client.release();
  }
});

// PUT /api/space/graduaciones/correcciones/:id — Resolve correction
router.put('/correcciones/:id', async (req, res) => {
  try {
    const { estado } = req.body;

    if (!estado || !['resuelta', 'rechazada'].includes(estado)) {
      return res.status(400).json({ success: false, error: 'Estado debe ser "resuelta" o "rechazada"' });
    }

    const row = await queryOne(
      `UPDATE graduacion_correcciones
       SET estado = $1, resuelta_por = $2
       WHERE id = $3
       RETURNING *`,
      [estado, req.spaceUser.id, req.params.id]
    );

    if (!row) {
      return res.status(404).json({ success: false, error: 'Corrección no encontrada' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Error actualizando corrección:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
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
      return res.status(400).json({ success: false, error: 'No hay campos para actualizar' });
    }

    updates.push(`updated_at = NOW()`);
    params.push(req.params.id);

    const row = await queryOne(
      `UPDATE graduaciones SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (!row) {
      return res.status(404).json({ success: false, error: 'Graduación no encontrada' });
    }

    return res.json({ success: true, data: row });
  } catch (err) {
    console.error('Error actualizando graduación:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
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
      return res.status(404).json({ success: false, error: 'Graduación no encontrada' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Error eliminando graduación:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

module.exports = router;
