const express = require('express');
const { queryOne } = require('../db');

const router = express.Router();

// GET /stats
router.get('/stats', async (_req, res) => {
  try {
    const [alumnos, inscripciones, asistenciasHoy, leadsNuevos] = await Promise.all([
      queryOne("SELECT COUNT(*) AS total FROM alumnos WHERE estado = 'activo'"),
      queryOne('SELECT COUNT(*) AS total FROM inscripciones WHERE activa = true'),
      queryOne('SELECT COUNT(*) AS total FROM asistencias WHERE fecha = CURRENT_DATE'),
      queryOne("SELECT COUNT(*) AS total FROM leads WHERE estado = 'Nuevo'"),
    ]);

    return res.json({
      success: true,
      stats: {
        alumnos: parseInt(alumnos.total, 10),
        inscripciones: parseInt(inscripciones.total, 10),
        asistenciasHoy: parseInt(asistenciasHoy.total, 10),
        leadsNuevos: parseInt(leadsNuevos.total, 10),
      },
    });
  } catch (err) {
    console.error('Error obteniendo stats:', err);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

module.exports = router;
