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
      queryOne("SELECT COUNT(*) AS total FROM alumnos WHERE LOWER(estado) = 'activo'"),
      queryOne("SELECT COUNT(*) AS total FROM inscripciones WHERE estado = 'Activo'"),
      queryOne('SELECT COUNT(*) AS total FROM asistencias WHERE fecha = CURRENT_DATE'),
      queryOne("SELECT COUNT(*) AS total FROM leads WHERE estado = 'Nuevo'"),
      queryOne(
        `SELECT COUNT(*) AS total FROM inscripciones
         WHERE estado = 'Activo'
           AND fecha_fin BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'`
      ),
      query(
        `SELECT a.id, a.fecha, a.hora::text, a.turno, al.nombre_alumno
         FROM asistencias a
         LEFT JOIN alumnos al ON al.id = a.alumno_id
         WHERE a.fecha = CURRENT_DATE
         ORDER BY a.hora DESC
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

// GET /heatmap — attendance heatmap last 30 days
router.get('/heatmap', async (_req, res) => {
  try {
    const rows = await query(
      `SELECT
        EXTRACT(DOW FROM fecha)::int AS dia_semana,
        turno AS clase,
        COUNT(*)::int AS total
      FROM asistencias
      WHERE fecha >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY EXTRACT(DOW FROM fecha), turno
      ORDER BY dia_semana, total DESC`
    );
    return res.json({ success: true, heatmap: rows || [] });
  } catch (err) {
    console.error('Error obteniendo heatmap:', err);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// GET /inscripciones-trend — monthly inscriptions last 6 months
router.get('/inscripciones-trend', async (_req, res) => {
  try {
    const rows = await query(
      `SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS mes,
              COUNT(*)::int AS total
       FROM inscripciones
       WHERE created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
       GROUP BY date_trunc('month', created_at)
       ORDER BY date_trunc('month', created_at)`
    );
    return res.json({ success: true, data: rows || [] });
  } catch (err) {
    console.error('Error inscripciones-trend:', err);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// GET /inscripciones-diarias — daily inscriptions current + previous month
router.get('/inscripciones-diarias', async (_req, res) => {
  try {
    const rows = await query(
      `SELECT fecha_inicio::date AS dia, COUNT(*)::int AS total
       FROM inscripciones
       WHERE fecha_inicio >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
         AND fecha_inicio < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
       GROUP BY fecha_inicio::date
       ORDER BY dia`
    );
    return res.json({ success: true, data: rows || [] });
  } catch (err) {
    console.error('Error inscripciones-diarias:', err);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// GET /top-implementos — top 8 most sold items
router.get('/top-implementos', async (_req, res) => {
  try {
    const rows = await query(
      `SELECT tipo, COUNT(*)::int AS total
       FROM implementos
       WHERE origen = 'compra'
       GROUP BY tipo
       ORDER BY total DESC
       LIMIT 8`
    );
    return res.json({ success: true, data: rows || [] });
  } catch (err) {
    console.error('Error top-implementos:', err);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

module.exports = router;
