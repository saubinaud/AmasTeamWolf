const { Router } = require('express');
const { query, queryOne, pool } = require('../db');
const { emailTorneo } = require('../notifuse');

const router = Router();

// GET /api/torneo/consultar?dni=12345678 — Consultar alumno por DNI (completo)
router.get('/consultar', async (req, res) => {
  try {
    const { dni } = req.query;

    if (!dni || typeof dni !== 'string') {
      return res.status(400).json({ success: false, error: 'dni es requerido' });
    }

    // Query completa: datos del alumno + inscripción activa + categoría
    const rows = await query(`
      SELECT
        a.id,
        a.nombre_alumno,
        a.nombre_apoderado,
        a.correo,
        a.dni_alumno,
        a.categoria,
        a.telefono,
        a.fecha_nacimiento,
        i.programa,
        i.estado AS estado_inscripcion,
        i.fecha_inicio,
        i.fecha_fin
      FROM alumnos a
      LEFT JOIN inscripciones i ON i.alumno_id = a.id AND i.estado = 'Activo'
      WHERE REPLACE(REPLACE(REPLACE(a.dni_alumno, ' ', ''), '-', ''), '.', '') = $1
    `, [String(dni).replace(/[\s\-\.]/g, '').trim()]);

    if (rows.length === 0) {
      return res.json({ encontrado: false });
    }

    res.json(rows);
  } catch (err) {
    console.error('Error consultando alumno torneo:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// POST /api/torneo — Registrar inscripción a torneo
router.post('/', async (req, res) => {
  try {
    const d = req.body;

    // Guardar inscripción en leads
    await pool.query(
      `INSERT INTO leads (nombre_apoderado, nombre_alumno, telefono, correo,
       estado, plataforma, campana, campana_id)
       VALUES ($1, $2, '', $3, 'Inscripción Torneo', 'Web', $4, $5)`,
      [
        d.apoderado,
        d.alumno,
        d.email || '',
        d.fecha_torneo || 'Torneo',
        JSON.stringify({
          dni: d.dni,
          modalidades: d.modalidades,
          total: d.total,
          comprobante: d.comprobante ? 'Adjunto' : 'Sin comprobante',
          fecha_registro: d.fecha_registro,
        }),
      ]
    );

    // Enviar email de confirmación (no bloquea la respuesta)
    if (d.email) {
      emailTorneo(d).catch(err => console.error('Error enviando email torneo:', err));
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error en inscripción torneo:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

module.exports = router;
