const { Router } = require('express');
const { query, queryOne } = require('../db');

const router = Router();

// GET /api/space/alumnos/stats — Quick counts by estado
router.get('/stats', async (_req, res) => {
  try {
    const [activos, inactivos, congelados] = await Promise.all([
      queryOne("SELECT COUNT(*) AS total FROM alumnos WHERE estado = 'activo'"),
      queryOne("SELECT COUNT(*) AS total FROM alumnos WHERE estado = 'inactivo'"),
      queryOne("SELECT COUNT(*) AS total FROM alumnos WHERE estado = 'congelado'"),
    ]);

    return res.json({
      success: true,
      stats: {
        activos: parseInt(activos.total, 10),
        inactivos: parseInt(inactivos.total, 10),
        congelados: parseInt(congelados.total, 10),
      },
    });
  } catch (err) {
    console.error('Error obteniendo stats de alumnos:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'ALUM_STATS_ERROR' });
  }
});

// GET /api/space/alumnos — List alumnos paginated with search & filter
router.get('/', async (req, res) => {
  try {
    const { search, estado } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (estado) {
      conditions.push(`a.estado = $${paramIndex++}`);
      params.push(estado);
    }
    if (search) {
      conditions.push(`(a.nombre_alumno ILIKE $${paramIndex} OR a.dni ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await queryOne(
      `SELECT COUNT(*) AS total FROM alumnos a ${where}`,
      params
    );
    const total = parseInt(countResult.total, 10);
    const totalPages = Math.ceil(total / limit);

    const rows = await query(
      `SELECT a.*
       FROM alumnos a
       ${where}
       ORDER BY a.created_at DESC
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
    console.error('Error listando alumnos:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'ALUM_LIST_ERROR' });
  }
});

// GET /api/space/alumnos/:id — Full detail with apoderado, inscripciones, asistencias
router.get('/:id', async (req, res) => {
  try {
    const alumno = await queryOne('SELECT * FROM alumnos WHERE id = $1', [req.params.id]);

    if (!alumno) {
      return res.status(404).json({ success: false, error: 'Alumno no encontrado', code: 'ALUM_NOT_FOUND' });
    }

    const [inscripciones, asistencias] = await Promise.all([
      query('SELECT * FROM inscripciones WHERE alumno_id = $1 ORDER BY created_at DESC', [req.params.id]),
      query(
        `SELECT * FROM asistencias
         WHERE alumno_id = $1 AND fecha >= CURRENT_DATE - INTERVAL '30 days'
         ORDER BY fecha DESC`,
        [req.params.id]
      ),
    ]);

    // Apoderado data is in the same alumnos table
    const apoderado = {
      nombre: alumno.nombre_apoderado,
      dni: alumno.dni_apoderado,
      correo: alumno.correo,
      telefono: alumno.telefono,
      direccion: alumno.direccion,
    };

    return res.json({
      success: true,
      data: {
        alumno,
        apoderado,
        inscripciones,
        asistencias,
      },
    });
  } catch (err) {
    console.error('Error obteniendo alumno:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'ALUM_GET_ERROR' });
  }
});

// PUT /api/space/alumnos/:id — Update alumno fields
router.put('/:id', async (req, res) => {
  try {
    const allowedFields = [
      'nombre_alumno', 'dni', 'fecha_nacimiento', 'telefono', 'email',
      'direccion', 'estado', 'sede_id', 'observaciones',
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
      return res.status(400).json({ success: false, error: 'No hay campos para actualizar', code: 'ALUM_NO_FIELDS' });
    }

    updates.push('updated_at = NOW()');
    params.push(req.params.id);

    const row = await queryOne(
      `UPDATE alumnos SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (!row) {
      return res.status(404).json({ success: false, error: 'Alumno no encontrado', code: 'ALUM_NOT_FOUND' });
    }

    return res.json({ success: true, data: row });
  } catch (err) {
    console.error('Error actualizando alumno:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'ALUM_UPDATE_ERROR' });
  }
});

module.exports = router;
