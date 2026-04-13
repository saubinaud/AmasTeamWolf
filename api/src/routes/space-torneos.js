const { Router } = require('express');
const { query, queryOne } = require('../db');

const router = Router();

// GET / — list active tournaments
router.get('/', async (req, res) => {
  try {
    const rows = await query(`
      SELECT tc.*,
             (SELECT COUNT(*) FROM torneo_selecciones ts WHERE ts.torneo_id = tc.id) AS total_selecciones
      FROM torneos_config tc
      WHERE tc.activo = TRUE
      ORDER BY tc.fecha DESC NULLS LAST, tc.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /torneos error:', err);
    res.status(500).json({ success: false, error: 'Error al obtener torneos' });
  }
});

// GET /stats — counts
router.get('/stats', async (req, res) => {
  try {
    const stats = await queryOne(`
      SELECT
        (SELECT COUNT(*) FROM torneos_config WHERE activo = TRUE) AS torneos_activos,
        (SELECT COUNT(*) FROM torneo_selecciones ts JOIN torneos_config tc ON tc.id = ts.torneo_id WHERE tc.activo = TRUE) AS total_selecciones,
        (SELECT COUNT(*) FROM torneo_selecciones ts JOIN torneos_config tc ON tc.id = ts.torneo_id WHERE tc.activo = TRUE AND ts.estado = 'confirmado') AS confirmados,
        (SELECT COUNT(*) FROM torneo_selecciones ts JOIN torneos_config tc ON tc.id = ts.torneo_id WHERE tc.activo = TRUE AND ts.estado_pago = 'Pendiente') AS pago_pendiente
    `);
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error('GET /torneos/stats error:', err);
    res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
  }
});

// POST / — create tournament
router.post('/', async (req, res) => {
  try {
    const { nombre, tipo, fecha, lugar, precio } = req.body;
    if (!nombre) {
      return res.status(400).json({ success: false, error: 'El nombre es requerido' });
    }
    const tiposValidos = ['regional', 'nacional', 'interescuelas', 'panamericano', 'mundial'];
    const tipoFinal = tiposValidos.includes(tipo) ? tipo : 'regional';

    const row = await queryOne(`
      INSERT INTO torneos_config (nombre, tipo, fecha, lugar, precio)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [nombre, tipoFinal, fecha || null, lugar || null, precio || 0]);
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    console.error('POST /torneos error:', err);
    res.status(500).json({ success: false, error: 'Error al crear torneo' });
  }
});

// PUT /:id — update tournament
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, tipo, fecha, lugar, precio } = req.body;

    const existing = await queryOne('SELECT id FROM torneos_config WHERE id = $1', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Torneo no encontrado' });
    }

    const tiposValidos = ['regional', 'nacional', 'interescuelas', 'panamericano', 'mundial'];
    const tipoFinal = tipo && tiposValidos.includes(tipo) ? tipo : undefined;

    const row = await queryOne(`
      UPDATE torneos_config
      SET nombre = COALESCE($1, nombre),
          tipo   = COALESCE($2, tipo),
          fecha  = COALESCE($3, fecha),
          lugar  = COALESCE($4, lugar),
          precio = COALESCE($5, precio)
      WHERE id = $6
      RETURNING *
    `, [nombre || null, tipoFinal || null, fecha || null, lugar || null, precio !== undefined ? precio : null, id]);
    res.json({ success: true, data: row });
  } catch (err) {
    console.error('PUT /torneos/:id error:', err);
    res.status(500).json({ success: false, error: 'Error al actualizar torneo' });
  }
});

// DELETE /:id — soft delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const row = await queryOne(
      'UPDATE torneos_config SET activo = FALSE WHERE id = $1 RETURNING id, nombre',
      [id]
    );
    if (!row) {
      return res.status(404).json({ success: false, error: 'Torneo no encontrado' });
    }
    res.json({ success: true, data: row });
  } catch (err) {
    console.error('DELETE /torneos/:id error:', err);
    res.status(500).json({ success: false, error: 'Error al eliminar torneo' });
  }
});

// GET /:id/selecciones — list selections for a tournament
router.get('/:id/selecciones', async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query(`
      SELECT ts.id, ts.torneo_id, ts.alumno_id, ts.modalidad, ts.estado,
             ts.estado_pago, ts.observaciones, ts.created_at,
             a.nombre_alumno, a.dni_alumno, a.categoria
      FROM torneo_selecciones ts
      JOIN alumnos a ON a.id = ts.alumno_id
      WHERE ts.torneo_id = $1
      ORDER BY a.nombre_alumno ASC
    `, [id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /torneos/:id/selecciones error:', err);
    res.status(500).json({ success: false, error: 'Error al obtener selecciones' });
  }
});

// POST /:id/seleccionar — select a student for a tournament
router.post('/:id/seleccionar', async (req, res) => {
  try {
    const { id } = req.params;
    const { alumno_id, modalidad, observaciones } = req.body;
    if (!alumno_id) {
      return res.status(400).json({ success: false, error: 'alumno_id es requerido' });
    }

    // Verify tournament exists and is active
    const torneo = await queryOne('SELECT id FROM torneos_config WHERE id = $1 AND activo = TRUE', [id]);
    if (!torneo) {
      return res.status(404).json({ success: false, error: 'Torneo no encontrado o inactivo' });
    }

    // Verify student exists
    const alumno = await queryOne('SELECT id FROM alumnos WHERE id = $1', [alumno_id]);
    if (!alumno) {
      return res.status(404).json({ success: false, error: 'Alumno no encontrado' });
    }

    const row = await queryOne(`
      INSERT INTO torneo_selecciones (torneo_id, alumno_id, modalidad, observaciones, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [id, alumno_id, modalidad || null, observaciones || null, req.user?.id || null]);
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: 'Este alumno ya está seleccionado para este torneo' });
    }
    console.error('POST /torneos/:id/seleccionar error:', err);
    res.status(500).json({ success: false, error: 'Error al seleccionar alumno' });
  }
});

// PUT /selecciones/:id — update selection
router.put('/selecciones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, estado_pago, modalidad, observaciones } = req.body;

    const estadosValidos = ['seleccionado', 'confirmado', 'descartado'];
    const estadoFinal = estado && estadosValidos.includes(estado) ? estado : undefined;
    const pagoValidos = ['Pendiente', 'Pagado', 'Parcial'];
    const pagoFinal = estado_pago && pagoValidos.includes(estado_pago) ? estado_pago : undefined;

    const row = await queryOne(`
      UPDATE torneo_selecciones
      SET estado       = COALESCE($1, estado),
          estado_pago  = COALESCE($2, estado_pago),
          modalidad    = COALESCE($3, modalidad),
          observaciones = COALESCE($4, observaciones)
      WHERE id = $5
      RETURNING *
    `, [estadoFinal || null, pagoFinal || null, modalidad || null, observaciones !== undefined ? observaciones : null, id]);

    if (!row) {
      return res.status(404).json({ success: false, error: 'Selección no encontrada' });
    }
    res.json({ success: true, data: row });
  } catch (err) {
    console.error('PUT /selecciones/:id error:', err);
    res.status(500).json({ success: false, error: 'Error al actualizar selección' });
  }
});

// DELETE /selecciones/:id — remove selection
router.delete('/selecciones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const row = await queryOne(
      'DELETE FROM torneo_selecciones WHERE id = $1 RETURNING id, torneo_id, alumno_id',
      [id]
    );
    if (!row) {
      return res.status(404).json({ success: false, error: 'Selección no encontrada' });
    }
    res.json({ success: true, data: row });
  } catch (err) {
    console.error('DELETE /selecciones/:id error:', err);
    res.status(500).json({ success: false, error: 'Error al eliminar selección' });
  }
});

module.exports = router;
