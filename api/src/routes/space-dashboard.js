const express = require('express');
const { queryOne, query } = require('../db');

const router = express.Router();

// GET /stats
router.get('/stats', async (_req, res) => {
  try {
    const [
      alumnos,
      inscripciones,
      asistenciasHoy,
      leadsNuevos,
      inscripcionesPorVencer,
      ultimasAsistencias,
      ultimoLogin,
    ] = await Promise.all([
      queryOne("SELECT COUNT(*) AS total FROM alumnos WHERE estado IN ('activo', 'Activo')"),
      queryOne("SELECT COUNT(*) AS total FROM inscripciones WHERE estado = 'Activo'"),
      queryOne('SELECT COUNT(*) AS total FROM asistencias WHERE fecha = CURRENT_DATE'),
      queryOne("SELECT COUNT(*) AS total FROM leads WHERE estado = 'Nuevo'"),
      queryOne(
        `SELECT COUNT(*) AS total FROM inscripciones
         WHERE estado = 'Activo'
           AND fecha_fin BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'`
      ),
      query(
        `SELECT a.id, a.fecha, a.hora, al.nombre_alumno
         FROM asistencias a
         LEFT JOIN alumnos al ON al.id = a.alumno_id
         ORDER BY a.fecha DESC, a.hora DESC
         LIMIT 5`
      ),
      queryOne(
        `SELECT nombre, email, ultimo_login
         FROM space_usuarios
         WHERE ultimo_login IS NOT NULL
         ORDER BY ultimo_login DESC
         LIMIT 1`
      ),
    ]);

    return res.json({
      success: true,
      stats: {
        alumnosActivos: parseInt(alumnos.total, 10),
        inscripcionesActivas: parseInt(inscripciones.total, 10),
        asistenciasHoy: parseInt(asistenciasHoy.total, 10),
        leadsNuevos: parseInt(leadsNuevos.total, 10),
        inscripcionesPorVencer: parseInt(inscripcionesPorVencer.total, 10),
        ultimasAsistencias: ultimasAsistencias || [],
        ultimoLogin: ultimoLogin || null,
      },
    });
  } catch (err) {
    console.error('Error obteniendo stats:', err);
    return res.status(500).json({ success: false, error: 'Error interno del servidor', code: 'DASHBOARD_STATS_ERROR' });
  }
});

module.exports = router;
