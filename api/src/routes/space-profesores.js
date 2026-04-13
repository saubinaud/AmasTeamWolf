const { Router } = require('express');
const { query, queryOne } = require('../db');

const router = Router();

// ---------------------------------------------------------------------------
// CRUD Profesores
// ---------------------------------------------------------------------------

// GET / — list all professors
router.get('/', async (_req, res) => {
  try {
    const rows = await query(`
      SELECT p.id, p.nombre, p.dni, p.telefono, p.email,
             p.contacto_emergencia, p.activo, p.created_at,
             (SELECT MAX(ap.fecha) FROM asistencias_profesores ap WHERE ap.profesor_id = p.id) AS ultima_asistencia
      FROM profesores p
      ORDER BY p.activo DESC, p.nombre ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /space/profesores error:', err);
    res.status(500).json({ success: false, error: 'Error al obtener profesores' });
  }
});

// GET /stats — KPIs
router.get('/stats', async (_req, res) => {
  try {
    const totalRow = await queryOne(`SELECT COUNT(*) AS total FROM profesores WHERE activo = true`);
    const mesRow = await queryOne(`
      SELECT COUNT(*) AS asistencias_mes
      FROM asistencias_profesores
      WHERE fecha >= date_trunc('month', CURRENT_DATE)
    `);
    // Attendance rate: asistencias this month / (active profs * weekdays elapsed this month)
    const activosCount = parseInt(totalRow?.total || '0', 10);
    const asistenciasMes = parseInt(mesRow?.asistencias_mes || '0', 10);

    // Count weekdays from start of month to today
    const diasRow = await queryOne(`
      SELECT COUNT(*) AS dias
      FROM generate_series(date_trunc('month', CURRENT_DATE)::date, CURRENT_DATE, '1 day') d
      WHERE EXTRACT(DOW FROM d) NOT IN (0, 6)
    `);
    const diasHabiles = parseInt(diasRow?.dias || '1', 10);
    const esperados = activosCount * diasHabiles;
    const tasa = esperados > 0 ? Math.round((asistenciasMes / esperados) * 100) : 0;

    res.json({
      success: true,
      data: {
        total_activos: activosCount,
        asistencias_mes: asistenciasMes,
        tasa_asistencia: tasa,
      },
    });
  } catch (err) {
    console.error('GET /space/profesores/stats error:', err);
    res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
  }
});

// POST / — create professor
router.post('/', async (req, res) => {
  try {
    const { nombre, dni, telefono, email, contacto_emergencia } = req.body;
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ success: false, error: 'El nombre es requerido' });
    }
    if (dni) {
      const existing = await queryOne('SELECT id FROM profesores WHERE dni = $1', [dni]);
      if (existing) {
        return res.status(400).json({ success: false, error: 'Ya existe un profesor con ese DNI' });
      }
    }
    const row = await queryOne(
      `INSERT INTO profesores (nombre, dni, telefono, email, contacto_emergencia)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nombre.trim(), dni?.trim() || null, telefono?.trim() || null, email?.trim() || null, contacto_emergencia?.trim() || null]
    );
    res.json({ success: true, data: row });
  } catch (err) {
    console.error('POST /space/profesores error:', err);
    res.status(500).json({ success: false, error: 'Error al crear profesor' });
  }
});

// PUT /:id — update professor
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, dni, telefono, email, contacto_emergencia } = req.body;
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ success: false, error: 'El nombre es requerido' });
    }
    if (dni) {
      const existing = await queryOne('SELECT id FROM profesores WHERE dni = $1 AND id != $2', [dni, id]);
      if (existing) {
        return res.status(400).json({ success: false, error: 'Ya existe otro profesor con ese DNI' });
      }
    }
    const row = await queryOne(
      `UPDATE profesores
       SET nombre = $1, dni = $2, telefono = $3, email = $4, contacto_emergencia = $5
       WHERE id = $6
       RETURNING *`,
      [nombre.trim(), dni?.trim() || null, telefono?.trim() || null, email?.trim() || null, contacto_emergencia?.trim() || null, id]
    );
    if (!row) return res.status(404).json({ success: false, error: 'Profesor no encontrado' });
    res.json({ success: true, data: row });
  } catch (err) {
    console.error('PUT /space/profesores/:id error:', err);
    res.status(500).json({ success: false, error: 'Error al actualizar profesor' });
  }
});

// DELETE /:id — soft delete (activo=false)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const row = await queryOne(
      `UPDATE profesores SET activo = false WHERE id = $1 RETURNING id, nombre`,
      [id]
    );
    if (!row) return res.status(404).json({ success: false, error: 'Profesor no encontrado' });
    res.json({ success: true, data: row });
  } catch (err) {
    console.error('DELETE /space/profesores/:id error:', err);
    res.status(500).json({ success: false, error: 'Error al desactivar profesor' });
  }
});

// ---------------------------------------------------------------------------
// Asistencia Profesores
// ---------------------------------------------------------------------------

// POST /asistencia — register attendance by DNI
router.post('/asistencia', async (req, res) => {
  try {
    const { dni } = req.body;
    if (!dni || !dni.trim()) {
      return res.status(400).json({ success: false, error: 'DNI es requerido' });
    }
    const profesor = await queryOne(
      'SELECT id, nombre FROM profesores WHERE dni = $1 AND activo = true',
      [dni.trim()]
    );
    if (!profesor) {
      return res.status(404).json({ success: false, error: 'No se encontró un profesor activo con ese DNI' });
    }
    // Insert or conflict (already registered today)
    const existing = await queryOne(
      'SELECT id FROM asistencias_profesores WHERE profesor_id = $1 AND fecha = CURRENT_DATE',
      [profesor.id]
    );
    if (existing) {
      return res.json({
        success: true,
        data: { profesor: profesor.nombre, fecha: new Date().toISOString(), ya_registrado: true },
        message: `${profesor.nombre} ya tiene asistencia registrada hoy`,
      });
    }
    await queryOne(
      `INSERT INTO asistencias_profesores (profesor_id, fecha, hora_entrada)
       VALUES ($1, CURRENT_DATE, CURRENT_TIME)
       RETURNING *`,
      [profesor.id]
    );
    res.json({
      success: true,
      data: { profesor: profesor.nombre, fecha: new Date().toISOString(), ya_registrado: false },
      message: `Asistencia registrada para ${profesor.nombre}`,
    });
  } catch (err) {
    console.error('POST /space/profesores/asistencia error:', err);
    res.status(500).json({ success: false, error: 'Error al registrar asistencia' });
  }
});

// GET /asistencia/resumen/:id — monthly summary
router.get('/asistencia/resumen/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Get last 6 months of data
    const rows = await query(`
      SELECT
        to_char(fecha, 'YYYY-MM') AS mes,
        COUNT(*) AS dias_asistidos
      FROM asistencias_profesores
      WHERE profesor_id = $1
        AND fecha >= (CURRENT_DATE - INTERVAL '6 months')
      GROUP BY to_char(fecha, 'YYYY-MM')
      ORDER BY mes DESC
    `, [id]);

    // For each month, calculate expected weekdays
    const resumen = [];
    for (const row of rows) {
      const [year, month] = row.mes.split('-').map(Number);
      const esperadosRow = await queryOne(`
        SELECT COUNT(*) AS dias
        FROM generate_series(
          make_date($1, $2, 1),
          LEAST(make_date($1, $2, 1) + INTERVAL '1 month' - INTERVAL '1 day', CURRENT_DATE)::date,
          '1 day'
        ) d
        WHERE EXTRACT(DOW FROM d) NOT IN (0, 6)
      `, [year, month]);
      const diasEsperados = parseInt(esperadosRow?.dias || '1', 10);
      const diasAsistidos = parseInt(row.dias_asistidos, 10);
      resumen.push({
        mes: row.mes,
        dias_asistidos: diasAsistidos,
        dias_esperados: diasEsperados,
        porcentaje: diasEsperados > 0 ? Math.round((diasAsistidos / diasEsperados) * 100) : 0,
      });
    }

    res.json({ success: true, data: resumen });
  } catch (err) {
    console.error('GET /space/profesores/asistencia/resumen/:id error:', err);
    res.status(500).json({ success: false, error: 'Error al obtener resumen' });
  }
});

// GET /asistencia/detalle/:id — daily attendance for a date range (calendar view)
router.get('/asistencia/detalle/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { desde, hasta } = req.query;
    if (!desde || !hasta) {
      return res.status(400).json({ success: false, error: 'Parámetros desde y hasta son requeridos' });
    }
    const rows = await query(`
      SELECT d::date AS fecha,
             CASE WHEN ap.id IS NOT NULL THEN true ELSE false END AS asistio
      FROM generate_series($2::date, $3::date, '1 day') d
      LEFT JOIN asistencias_profesores ap
        ON ap.profesor_id = $1 AND ap.fecha = d::date
      ORDER BY d
    `, [id, desde, hasta]);
    // Normalize fecha to YYYY-MM-DD string
    const data = (rows || []).map((r) => ({
      fecha: r.fecha instanceof Date
        ? r.fecha.toISOString().slice(0, 10)
        : String(r.fecha).slice(0, 10),
      asistio: r.asistio,
    }));
    res.json({ success: true, data });
  } catch (err) {
    console.error('GET /space/profesores/asistencia/detalle/:id error:', err);
    res.status(500).json({ success: false, error: 'Error al obtener detalle de asistencia' });
  }
});

// GET /asistencia/hoy — who attended today
router.get('/asistencia/hoy', async (_req, res) => {
  try {
    const rows = await query(`
      SELECT p.id, p.nombre, p.dni, ap.hora_entrada
      FROM asistencias_profesores ap
      JOIN profesores p ON p.id = ap.profesor_id
      WHERE ap.fecha = CURRENT_DATE
      ORDER BY ap.hora_entrada ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /space/profesores/asistencia/hoy error:', err);
    res.status(500).json({ success: false, error: 'Error al obtener asistencia de hoy' });
  }
});

module.exports = router;
