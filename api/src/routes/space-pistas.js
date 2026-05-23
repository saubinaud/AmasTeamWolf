const { Router } = require('express');
const { query, queryOne } = require('../db');

const router = Router();

// GET /:torneoId — list pistas for a tournament
router.get('/:torneoId', async (req, res) => {
  try {
    const { torneoId } = req.params;
    const rows = await query(`
      SELECT p.*, COUNT(c.id) AS total_combates
      FROM torneo_pistas p
      LEFT JOIN torneo_combates c ON c.pista_id = p.id
      WHERE p.torneo_id = $1 AND p.activa = true
      GROUP BY p.id ORDER BY p.numero
    `, [torneoId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /pistas/:torneoId error:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// POST /:torneoId — create pista
router.post('/:torneoId', async (req, res) => {
  try {
    const { torneoId } = req.params;
    const { numero, nombre } = req.body;
    if (!numero) {
      return res.status(400).json({ success: false, error: 'El numero es requerido' });
    }

    const row = await queryOne(`
      INSERT INTO torneo_pistas (torneo_id, numero, nombre)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [torneoId, numero, nombre || null]);

    res.status(201).json({ success: true, data: row });
  } catch (err) {
    console.error('POST /pistas/:torneoId error:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// DELETE /:pistaId — delete pista (hard delete, cascade deletes combates)
router.delete('/:pistaId', async (req, res) => {
  try {
    const { pistaId } = req.params;
    const row = await queryOne(
      'DELETE FROM torneo_pistas WHERE id = $1 RETURNING *',
      [pistaId]
    );
    if (!row) {
      return res.status(404).json({ success: false, error: 'Pista no encontrada' });
    }
    res.json({ success: true, data: row });
  } catch (err) {
    console.error('DELETE /pistas/:pistaId error:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// GET /:torneoId/combates — list all combates for a tournament
router.get('/:torneoId/combates', async (req, res) => {
  try {
    const { torneoId } = req.params;
    const rows = await query(`
      SELECT c.*,
        a1.nombre_alumno AS alumno1_nombre,
        a2.nombre_alumno AS alumno2_nombre,
        ag.nombre_alumno AS ganador_nombre,
        m.nombre AS modalidad_nombre,
        p.numero AS pista_numero
      FROM torneo_combates c
      LEFT JOIN alumnos a1 ON a1.id = c.alumno1_id
      LEFT JOIN alumnos a2 ON a2.id = c.alumno2_id
      LEFT JOIN alumnos ag ON ag.id = c.ganador_id
      LEFT JOIN torneo_modalidades m ON m.id = c.modalidad_id
      LEFT JOIN torneo_pistas p ON p.id = c.pista_id
      WHERE c.torneo_id = $1
      ORDER BY p.numero, c.hora
    `, [torneoId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /pistas/:torneoId/combates error:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// POST /combates — create combate
router.post('/combates', async (req, res) => {
  try {
    const { torneo_id, pista_id, modalidad_id, hora, alumno1_id, alumno2_id } = req.body;
    if (!torneo_id || !pista_id || !alumno1_id || !alumno2_id) {
      return res.status(400).json({ success: false, error: 'torneo_id, pista_id, alumno1_id y alumno2_id son requeridos' });
    }
    if (alumno1_id === alumno2_id) {
      return res.status(400).json({ success: false, error: 'alumno1_id y alumno2_id no pueden ser iguales' });
    }

    const row = await queryOne(`
      INSERT INTO torneo_combates (torneo_id, pista_id, modalidad_id, hora, alumno1_id, alumno2_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [torneo_id, pista_id, modalidad_id || null, hora || null, alumno1_id, alumno2_id]);

    // Fetch with joined names
    const combate = await queryOne(`
      SELECT c.*,
        a1.nombre_alumno AS alumno1_nombre,
        a2.nombre_alumno AS alumno2_nombre
      FROM torneo_combates c
      LEFT JOIN alumnos a1 ON a1.id = c.alumno1_id
      LEFT JOIN alumnos a2 ON a2.id = c.alumno2_id
      WHERE c.id = $1
    `, [row.id]);

    res.status(201).json({ success: true, data: combate });
  } catch (err) {
    console.error('POST /pistas/combates error:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// PUT /combates/:id — update combate
router.put('/combates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, ganador_id, puntaje_alumno1, puntaje_alumno2, observaciones, hora, modalidad_id } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (estado !== undefined) { fields.push(`estado = $${idx++}`); values.push(estado); }
    if (ganador_id !== undefined) { fields.push(`ganador_id = $${idx++}`); values.push(ganador_id); }
    if (puntaje_alumno1 !== undefined) { fields.push(`puntaje_alumno1 = $${idx++}`); values.push(puntaje_alumno1); }
    if (puntaje_alumno2 !== undefined) { fields.push(`puntaje_alumno2 = $${idx++}`); values.push(puntaje_alumno2); }
    if (observaciones !== undefined) { fields.push(`observaciones = $${idx++}`); values.push(observaciones); }
    if (hora !== undefined) { fields.push(`hora = $${idx++}`); values.push(hora); }
    if (modalidad_id !== undefined) { fields.push(`modalidad_id = $${idx++}`); values.push(modalidad_id); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'No hay campos para actualizar' });
    }

    values.push(id);
    const row = await queryOne(`
      UPDATE torneo_combates
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `, values);

    if (!row) {
      return res.status(404).json({ success: false, error: 'Combate no encontrado' });
    }
    res.json({ success: true, data: row });
  } catch (err) {
    console.error('PUT /pistas/combates/:id error:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// DELETE /combates/:id — delete combate
router.delete('/combates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const row = await queryOne(
      'DELETE FROM torneo_combates WHERE id = $1 RETURNING *',
      [id]
    );
    if (!row) {
      return res.status(404).json({ success: false, error: 'Combate no encontrado' });
    }
    res.json({ success: true, data: row });
  } catch (err) {
    console.error('DELETE /pistas/combates/:id error:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

module.exports = router;
