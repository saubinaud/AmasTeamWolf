const { Router } = require('express');
const { query, pool } = require('../db');

const router = Router();

// GET /api/graduacion — Lista de graduaciones
router.get('/', async (_req, res) => {
  try {
    // Buscar tabla de graduaciones si existe, sino retornar desde inscripciones
    const rows = await query(`
      SELECT DISTINCT
        a.nombre_alumno,
        split_part(a.nombre_alumno, ' ', 1) AS "NOMBRE",
        CASE
          WHEN array_length(string_to_array(a.nombre_alumno, ' '), 1) > 1
          THEN split_part(a.nombre_alumno, ' ', array_length(string_to_array(a.nombre_alumno, ' '), 1))
          ELSE ''
        END AS "APELLIDO",
        i.fecha_fin AS "date",
        to_char(i.fecha_fin, 'DD " de " TMMonth " de " YYYY') AS "FECHA"
      FROM alumnos a
      JOIN inscripciones i ON i.alumno_id = a.id
      WHERE i.estado = 'Activo'
        AND i.fecha_fin IS NOT NULL
        AND i.fecha_fin >= CURRENT_DATE
      ORDER BY i.fecha_fin ASC
    `);

    res.json(rows);
  } catch (err) {
    console.error('Error obteniendo graduaciones:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// POST /api/graduacion/correccion — Enviar corrección de graduación
router.post('/correccion', async (req, res) => {
  try {
    const { nombre, apellido, comentario } = req.body;

    // Guardar en leads como feedback
    await pool.query(
      `INSERT INTO leads (nombre_apoderado, nombre_alumno, estado, plataforma, campana)
       VALUES ($1, $2, 'Corrección Graduación', 'Web', $3)`,
      [`${nombre} ${apellido}`, `${nombre} ${apellido}`, comentario || '']
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error en corrección:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

module.exports = router;
