const { Router } = require('express');
const { pool, query } = require('../db');

const router = Router();

// POST /api/leads — Crear lead genérico (showroom, evento navidad, etc.)
router.post('/', async (req, res) => {
  try {
    const d = req.body;

    await pool.query(
      `INSERT INTO leads (nombre_apoderado, nombre_alumno, telefono, correo,
       estado, plataforma, campana, campana_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        d.nombre_padre || d.nombre_apoderado || '',
        d.nombre_alumno || '',
        d.telefono || '',
        d.email || d.correo || '',
        d.estado || 'Nuevo',
        d.plataforma || d.source || 'Web',
        d.campana || d.tipo || '',
        d.campana_id || d.metadata ? JSON.stringify(d.metadata) : null,
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error creando lead:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// POST /api/leads/showroom — Registro showroom
router.post('/showroom', async (req, res) => {
  try {
    const d = req.body;

    await pool.query(
      `INSERT INTO leads (nombre_apoderado, nombre_alumno, correo,
       estado, plataforma, campana)
       VALUES ($1, $2, $3, 'Showroom', $4, $5)`,
      [d.nombre_padre, d.nombre_alumno, d.email || '',
       d.source || 'Web', d.horario || '']
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error en registro showroom:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// POST /api/leads/evento-navidad — Registro evento navidad
router.post('/evento-navidad', async (req, res) => {
  try {
    const d = req.body;

    await pool.query(
      `INSERT INTO leads (nombre_apoderado, nombre_alumno, correo,
       estado, plataforma, campana, campana_id)
       VALUES ($1, $2, $3, $4, $5, 'Evento Navidad', $6)`,
      [d.nombre_padre, d.nombre_alumno, d.email || '',
       d.asistencia === 'confirmado' ? 'Confirmado' : 'No asistirá',
       d.source || 'Web',
       JSON.stringify({ deseo_1: d.deseo_1, deseo_2: d.deseo_2, deseo_3: d.deseo_3 })]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error en evento navidad:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

module.exports = router;
