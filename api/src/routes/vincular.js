const { Router } = require('express');
const { query, queryOne, pool } = require('../db');

const router = Router();

// POST /api/vincular — Buscar o vincular cuenta
// Body: { action: "buscar"|"vincular", ... }
router.post('/', async (req, res) => {
  try {
    const { action } = req.body;

    if (action === 'buscar') {
      const { dni_alumno, dni_padre } = req.body;

      if (!dni_alumno && !dni_padre) {
        return res.status(400).json({ success: false, error: 'Ingresa al menos un DNI' });
      }

      let result;
      if (dni_alumno) {
        const dniNorm = String(dni_alumno).replace(/[\s\-\.]/g, '').trim();
        result = await queryOne(`
          SELECT a.id, a.id AS apoderado_id, a.nombre_alumno AS alumno_nombre,
                 a.nombre_apoderado AS apoderado_nombre, i.programa
          FROM alumnos a
          LEFT JOIN inscripciones i ON i.alumno_id = a.id AND i.estado = 'Activo'
          WHERE a.dni_alumno_norm = $1
          LIMIT 1
        `, [dniNorm]);
      } else {
        const dniNorm = String(dni_padre).replace(/[\s\-\.]/g, '').trim();
        result = await queryOne(`
          SELECT a.id, a.id AS apoderado_id, a.nombre_alumno AS alumno_nombre,
                 a.nombre_apoderado AS apoderado_nombre, i.programa
          FROM alumnos a
          LEFT JOIN inscripciones i ON i.alumno_id = a.id AND i.estado = 'Activo'
          WHERE a.dni_apoderado_norm = $1
          LIMIT 1
        `, [dniNorm]);
      }

      if (!result) {
        return res.json({});
      }

      return res.json(result);
    }

    if (action === 'vincular') {
      const { auth_id, email, apoderado_id } = req.body;

      if (!auth_id || !apoderado_id) {
        return res.status(400).json({ success: false, error: 'auth_id y apoderado_id requeridos' });
      }

      await pool.query(
        `UPDATE alumnos SET auth_id = $1, correo = COALESCE($2, correo) WHERE id = $3`,
        [auth_id, email || null, apoderado_id]
      );

      return res.json({ success: true });
    }

    res.status(400).json({ success: false, error: 'Action inválida' });
  } catch (err) {
    console.error('Error en vincular:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

module.exports = router;
