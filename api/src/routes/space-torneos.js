const { Router } = require('express');
const { query, queryOne, pool } = require('../db');
const { AlumnoService, InscripcionService } = require('../services');

const router = Router();

const DEFAULT_MODALIDADES = [
  { nombre: 'Fórmula', icono: 'Zap', implementos_requeridos: [] },
  { nombre: 'Fórmula con armas', icono: 'Swords', implementos_requeridos: ['arma'] },
  { nombre: 'Presentación Combat Weapons', icono: 'Target', implementos_requeridos: ['arma', 'protector'] },
  { nombre: 'Combat Weapons Simple', icono: 'Shield', implementos_requeridos: ['arma'] },
  { nombre: 'Rompimiento de madera', icono: 'Hammer', implementos_requeridos: [] },
  { nombre: 'Fórmula creativa', icono: 'Wand2', implementos_requeridos: [] },
  { nombre: 'Fórmula creativa con armas', icono: 'Axe', implementos_requeridos: ['arma'] },
];

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

// POST / — create tournament + auto-create default modalidades
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { nombre, tipo, fecha, lugar, descripcion, precio_entrada, precios_modalidades, descuentos_programa } = req.body;
    if (!nombre) {
      return res.status(400).json({ success: false, error: 'El nombre es requerido' });
    }
    const tiposValidos = ['regional', 'nacional', 'interescuelas', 'panamericano', 'mundial'];
    const tipoFinal = tiposValidos.includes(tipo) ? tipo : 'regional';

    await client.query('BEGIN');

    const { rows: [torneo] } = await client.query(`
      INSERT INTO torneos_config (nombre, tipo, fecha, lugar, descripcion, precio_entrada, precios_modalidades, descuentos_programa)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [nombre, tipoFinal, fecha || null, lugar || null, descripcion || null,
        precio_entrada || 25,
        JSON.stringify(precios_modalidades || [{ desde: 1, hasta: 1, precio: 80 }, { desde: 2, hasta: 2, precio: 150 }, { desde: 3, hasta: 99, precio: 200 }]),
        JSON.stringify(descuentos_programa || [{ programa: 'leadership', label: 'Leadership Wolf', porcentaje: 20 }, { programa: 'fighter', label: 'Fighter Wolf', porcentaje: 30 }]),
    ]);

    // Auto-create default modalidades
    for (let i = 0; i < DEFAULT_MODALIDADES.length; i++) {
      const m = DEFAULT_MODALIDADES[i];
      await client.query(`
        INSERT INTO torneo_modalidades (torneo_id, nombre, icono, implementos_requeridos, activo, orden)
        VALUES ($1, $2, $3, $4, TRUE, $5)
      `, [torneo.id, m.nombre, m.icono, m.implementos_requeridos, i + 1]);
    }

    await client.query('COMMIT');

    // Fetch created modalidades to return
    const modalidades = await query(
      'SELECT * FROM torneo_modalidades WHERE torneo_id = $1 ORDER BY orden',
      [torneo.id]
    );

    res.status(201).json({ success: true, data: { ...torneo, modalidades } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /torneos error:', err);
    res.status(500).json({ success: false, error: 'Error al crear torneo' });
  } finally {
    client.release();
  }
});

// PUT /:id — update tournament
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, tipo, fecha, lugar, descripcion, precio_entrada, precios_modalidades, descuentos_programa } = req.body;

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
          descripcion = COALESCE($5, descripcion),
          precio_entrada = COALESCE($6, precio_entrada),
          precios_modalidades = COALESCE($7, precios_modalidades),
          descuentos_programa = COALESCE($8, descuentos_programa)
      WHERE id = $9
      RETURNING *
    `, [nombre || null, tipoFinal || null, fecha || null, lugar || null,
        descripcion !== undefined ? descripcion : null,
        precio_entrada !== undefined ? precio_entrada : null,
        precios_modalidades ? JSON.stringify(precios_modalidades) : null,
        descuentos_programa ? JSON.stringify(descuentos_programa) : null,
        id]);
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

// GET /:id/modalidades — list modalidades for a torneo
router.get('/:id/modalidades', async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query(`
      SELECT * FROM torneo_modalidades
      WHERE torneo_id = $1
      ORDER BY orden ASC, id ASC
    `, [id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /torneos/:id/modalidades error:', err);
    res.status(500).json({ success: false, error: 'Error al obtener modalidades' });
  }
});

// PUT /modalidades/:id — toggle activo / change order for a modalidad
router.put('/modalidades/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { activo, orden } = req.body;

    const existing = await queryOne('SELECT * FROM torneo_modalidades WHERE id = $1', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Modalidad no encontrada' });
    }

    const row = await queryOne(`
      UPDATE torneo_modalidades
      SET activo = COALESCE($1, activo),
          orden  = COALESCE($2, orden)
      WHERE id = $3
      RETURNING *
    `, [activo !== undefined ? activo : null, orden !== undefined ? orden : null, id]);

    res.json({ success: true, data: row });
  } catch (err) {
    console.error('PUT /modalidades/:id error:', err);
    res.status(500).json({ success: false, error: 'Error al actualizar modalidad' });
  }
});

// GET /:id/selecciones — list selections with new fields
router.get('/:id/selecciones', async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query(`
      SELECT ts.id, ts.torneo_id, ts.alumno_id, ts.modalidad,
             ts.modalidades, ts.estado, ts.estado_pago,
             ts.precio_total, ts.descuento, ts.descuento_tipo,
             ts.implementos_faltantes,
             ts.observaciones, ts.created_at,
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
