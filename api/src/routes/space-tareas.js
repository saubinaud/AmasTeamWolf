const { Router } = require('express');
const { query, queryOne } = require('../db');

const router = Router();

// ─── FIXED ROUTES FIRST (before parametric /:id) ───

// PUT /reorder — bulk update estado + orden
router.put('/reorder', async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'items es requerido y debe ser un array' });
    }

    for (const item of items) {
      await query(`
        UPDATE space_tareas SET estado = $1, orden = $2, updated_at = NOW() WHERE id = $3
      `, [item.estado, item.orden, item.id]);
    }

    res.json({ success: true, data: { updated: items.length } });
  } catch (err) {
    console.error('PUT /tareas/reorder error:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// ─── STANDARD ROUTES ───

// GET / — list all tasks with optional filters
router.get('/', async (req, res) => {
  try {
    const { estado, prioridad } = req.query;
    const conditions = [];
    const values = [];
    let idx = 1;

    if (estado) { conditions.push(`estado = $${idx++}`); values.push(estado); }
    if (prioridad) { conditions.push(`prioridad = $${idx++}`); values.push(prioridad); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = await query(`
      SELECT * FROM space_tareas
      ${where}
      ORDER BY
        CASE estado WHEN 'pendiente' THEN 0 WHEN 'en_progreso' THEN 1 ELSE 2 END,
        orden ASC, created_at DESC
    `, values);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /tareas error:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// POST / — create task
router.post('/', async (req, res) => {
  try {
    const { titulo, descripcion, prioridad, fecha_limite } = req.body;
    if (!titulo) {
      return res.status(400).json({ success: false, error: 'El titulo es requerido' });
    }

    const row = await queryOne(`
      INSERT INTO space_tareas (titulo, descripcion, prioridad, fecha_limite, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [titulo, descripcion || null, prioridad || 'media', fecha_limite || null, null]);

    res.status(201).json({ success: true, data: row });
  } catch (err) {
    console.error('POST /tareas error:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// PUT /:id — update task
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, estado, prioridad, fecha_limite, orden } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (titulo !== undefined) { fields.push(`titulo = $${idx++}`); values.push(titulo); }
    if (descripcion !== undefined) { fields.push(`descripcion = $${idx++}`); values.push(descripcion); }
    if (estado !== undefined) { fields.push(`estado = $${idx++}`); values.push(estado); }
    if (prioridad !== undefined) { fields.push(`prioridad = $${idx++}`); values.push(prioridad); }
    if (fecha_limite !== undefined) { fields.push(`fecha_limite = $${idx++}`); values.push(fecha_limite); }
    if (orden !== undefined) { fields.push(`orden = $${idx++}`); values.push(orden); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'No hay campos para actualizar' });
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);
    const row = await queryOne(`
      UPDATE space_tareas SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *
    `, values);

    if (!row) return res.status(404).json({ success: false, error: 'Tarea no encontrada' });
    res.json({ success: true, data: row });
  } catch (err) {
    console.error('PUT /tareas/:id error:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// DELETE /:id — delete task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const row = await queryOne('DELETE FROM space_tareas WHERE id = $1 RETURNING *', [id]);
    if (!row) return res.status(404).json({ success: false, error: 'Tarea no encontrada' });
    res.json({ success: true, data: row });
  } catch (err) {
    console.error('DELETE /tareas/:id error:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

module.exports = router;
