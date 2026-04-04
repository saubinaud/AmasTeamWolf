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
        return res.json({ error: 'Ingresa al menos un DNI' });
      }

      let result;
      if (dni_alumno) {
        result = await queryOne(`
          SELECT a.id, a.id AS apoderado_id, a.nombre_alumno AS alumno_nombre,
                 a.nombre_apoderado AS apoderado_nombre, i.programa
          FROM alumnos a
          LEFT JOIN inscripciones i ON i.alumno_id = a.id AND i.estado = 'Activo'
          WHERE a.dni_alumno = $1
          LIMIT 1
        `, [dni_alumno]);
      } else {
        result = await queryOne(`
          SELECT a.id, a.id AS apoderado_id, a.nombre_alumno AS alumno_nombre,
                 a.nombre_apoderado AS apoderado_nombre, i.programa
          FROM alumnos a
          LEFT JOIN inscripciones i ON i.alumno_id = a.id AND i.estado = 'Activo'
          WHERE a.dni_apoderado = $1
          LIMIT 1
        `, [dni_padre]);
      }

      if (!result) {
        return res.json({});
      }

      return res.json(result);
    }

    if (action === 'vincular') {
      const { auth_id, email, apoderado_id } = req.body;

      if (!auth_id || !apoderado_id) {
        return res.status(400).json({ error: 'auth_id y apoderado_id requeridos' });
      }

      await pool.query(
        `UPDATE alumnos SET auth_id = $1, correo = COALESCE($2, correo) WHERE id = $3`,
        [auth_id, email || null, apoderado_id]
      );

      return res.json({ success: true });
    }

    res.status(400).json({ error: 'Action inválida' });
  } catch (err) {
    console.error('Error en vincular:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
