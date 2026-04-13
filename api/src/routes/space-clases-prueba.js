const { Router } = require('express');
const { query, queryOne } = require('../db');

const router = Router();

// GET /api/space/clases-prueba/stats — KPIs del mes actual
router.get('/stats', async (_req, res) => {
  try {
    const [totalMes, asistieron, inscritos] = await Promise.all([
      queryOne(`
        SELECT COUNT(*) AS total
        FROM clases_prueba
        WHERE fecha >= date_trunc('month', CURRENT_DATE)
      `),
      queryOne(`
        SELECT COUNT(*) AS total
        FROM clases_prueba
        WHERE fecha >= date_trunc('month', CURRENT_DATE)
          AND estado = 'asistio'
      `),
      queryOne(`
        SELECT COUNT(*) AS total
        FROM clases_prueba
        WHERE fecha >= date_trunc('month', CURRENT_DATE)
          AND resultado = 'inscrito'
      `),
    ]);

    const t = parseInt(totalMes.total) || 0;
    const a = parseInt(asistieron.total) || 0;
    const i = parseInt(inscritos.total) || 0;
    const tasa = t > 0 ? Math.round((i / t) * 100) : 0;

    return res.json({
      success: true,
      data: {
        total_mes: t,
        asistieron: a,
        inscritos: i,
        tasa_conversion: tasa,
      },
    });
  } catch (err) {
    console.error('Error stats clases prueba:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// GET /api/space/clases-prueba/embudo — Conversion funnel
router.get('/embudo', async (_req, res) => {
  try {
    const rows = await query(`
      SELECT
        COUNT(*) FILTER (WHERE estado = 'por_asistir') AS por_asistir,
        COUNT(*) FILTER (WHERE estado = 'asistio') AS asistio,
        COUNT(*) FILTER (WHERE estado = 'no_asistio') AS no_asistio,
        COUNT(*) FILTER (WHERE resultado = 'inscrito') AS inscrito,
        COUNT(*) FILTER (WHERE resultado = 'en_confirmacion') AS en_confirmacion,
        COUNT(*) FILTER (WHERE resultado = 'separacion') AS separacion,
        COUNT(*) FILTER (WHERE resultado = 'no_interesado') AS no_interesado
      FROM clases_prueba
    `);

    const r = rows[0] || {};
    return res.json({
      success: true,
      data: {
        por_asistir: parseInt(r.por_asistir) || 0,
        asistio: parseInt(r.asistio) || 0,
        no_asistio: parseInt(r.no_asistio) || 0,
        inscrito: parseInt(r.inscrito) || 0,
        en_confirmacion: parseInt(r.en_confirmacion) || 0,
        separacion: parseInt(r.separacion) || 0,
        no_interesado: parseInt(r.no_interesado) || 0,
      },
    });
  } catch (err) {
    console.error('Error embudo clases prueba:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// GET /api/space/clases-prueba/resumen-diario — Count per day (last 30 days)
router.get('/resumen-diario', async (_req, res) => {
  try {
    const rows = await query(`
      SELECT fecha, COUNT(*) AS total
      FROM clases_prueba
      WHERE fecha >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY fecha
      ORDER BY fecha ASC
    `);

    return res.json({
      success: true,
      data: rows.map(r => ({
        fecha: r.fecha,
        total: parseInt(r.total) || 0,
      })),
    });
  } catch (err) {
    console.error('Error resumen diario clases prueba:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// GET /api/space/clases-prueba — List paginated with filters
router.get('/', async (req, res) => {
  try {
    const { estado, fecha_desde, fecha_hasta, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let idx = 1;

    if (estado) {
      conditions.push(`estado = $${idx++}`);
      params.push(estado);
    }
    if (fecha_desde) {
      conditions.push(`fecha >= $${idx++}`);
      params.push(fecha_desde);
    }
    if (fecha_hasta) {
      conditions.push(`fecha <= $${idx++}`);
      params.push(fecha_hasta);
    }
    if (search) {
      conditions.push(`(nombre_prospecto ILIKE $${idx} OR telefono ILIKE $${idx})`);
      params.push(`%${String(search).trim()}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countResult, rows] = await Promise.all([
      queryOne(`SELECT COUNT(*) AS total FROM clases_prueba ${where}`, params),
      query(
        `SELECT * FROM clases_prueba ${where} ORDER BY fecha DESC, created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
        [...params, limit, offset]
      ),
    ]);

    const total = parseInt(countResult.total) || 0;

    return res.json({
      success: true,
      data: rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Error listando clases prueba:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// POST /api/space/clases-prueba — Create
router.post('/', async (req, res) => {
  try {
    const { nombre_prospecto, telefono, email, fecha, hora, profesora } = req.body;

    if (!nombre_prospecto || !fecha) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: nombre_prospecto, fecha',
      });
    }

    const createdBy = req.spaceUser?.id || null;

    const row = await queryOne(
      `INSERT INTO clases_prueba (nombre_prospecto, telefono, email, fecha, hora, profesora, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [nombre_prospecto, telefono || null, email || null, fecha, hora || null, profesora || null, createdBy]
    );

    return res.json({ success: true, data: row });
  } catch (err) {
    console.error('Error creando clase prueba:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// PUT /api/space/clases-prueba/:id — Update estado/resultado/observaciones
router.put('/:id', async (req, res) => {
  try {
    const allowedFields = [
      'nombre_prospecto', 'telefono', 'email', 'fecha', 'hora',
      'profesora', 'estado', 'resultado', 'observaciones', 'alumno_inscrito_id',
    ];

    const updates = [];
    const params = [];
    let idx = 1;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${idx++}`);
        params.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No hay campos para actualizar' });
    }

    params.push(req.params.id);

    const row = await queryOne(
      `UPDATE clases_prueba SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (!row) {
      return res.status(404).json({ success: false, error: 'Clase de prueba no encontrada' });
    }

    return res.json({ success: true, data: row });
  } catch (err) {
    console.error('Error actualizando clase prueba:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

module.exports = router;
