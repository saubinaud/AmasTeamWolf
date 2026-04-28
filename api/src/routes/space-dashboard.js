const express = require('express');
const { queryOne, query } = require('../db');

const router = express.Router();

// GET /stats — basic stats (always current, no date filter)
router.get('/stats', async (_req, res) => {
  try {
    const [alumnos, leadsNuevos, inscripcionesPorVencer, ultimasAsistencias] = await Promise.all([
      queryOne("SELECT COUNT(*) AS total FROM alumnos WHERE LOWER(estado) = 'activo'"),
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
    ]);

    return res.json({
      success: true,
      stats: {
        alumnosActivos: parseInt(alumnos.total, 10),
        leadsNuevos: parseInt(leadsNuevos.total, 10),
        inscripcionesPorVencer: parseInt(inscripcionesPorVencer.total, 10),
        ultimasAsistencias: ultimasAsistencias || [],
      },
    });
  } catch (err) {
    console.error('Error obteniendo stats:', err);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// GET /analytics — all analytics data for a date range
router.get('/analytics', async (req, res) => {
  try {
    const desde = req.query.desde || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const hasta = req.query.hasta || new Date().toISOString().slice(0, 10);
    // Add 1 day to hasta for inclusive range (BETWEEN uses <=)
    const hastaInclusive = `${hasta}T23:59:59`;

    const [
      resumen,
      inscDiarias,
      ventasMensuales,
      porPrograma,
      porTipoCliente,
      porHora,
      topImpl,
      alumnosLtv,
    ] = await Promise.all([
      // 1. Resumen del rango
      queryOne(
        `SELECT COUNT(*)::int AS total, COALESCE(SUM(precio_pagado), 0)::numeric AS ingresos
         FROM inscripciones WHERE created_at BETWEEN $1 AND $2`,
        [desde, hastaInclusive]
      ),

      // 2. Inscripciones diarias
      query(
        `SELECT created_at::date AS dia, COUNT(*)::int AS total,
                COALESCE(SUM(precio_pagado), 0)::numeric AS ingresos
         FROM inscripciones WHERE created_at BETWEEN $1 AND $2
         GROUP BY created_at::date ORDER BY dia`,
        [desde, hastaInclusive]
      ),

      // 3. Ventas mensuales (últimos 6 meses, siempre)
      query(
        `SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS mes,
           COUNT(*) FILTER (WHERE COALESCE(tipo_cliente,'') != 'Renovación')::int AS nuevos,
           COUNT(*) FILTER (WHERE tipo_cliente = 'Renovación')::int AS renovaciones,
           COALESCE(SUM(precio_pagado) FILTER (WHERE COALESCE(tipo_cliente,'') != 'Renovación'), 0)::numeric AS ingresos_nuevos,
           COALESCE(SUM(precio_pagado) FILTER (WHERE tipo_cliente = 'Renovación'), 0)::numeric AS ingresos_renovaciones
         FROM inscripciones
         WHERE created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
         GROUP BY date_trunc('month', created_at)
         ORDER BY mes`
      ),

      // 4. Por programa
      query(
        `SELECT programa, COUNT(*)::int AS total
         FROM inscripciones WHERE created_at BETWEEN $1 AND $2
         GROUP BY programa ORDER BY total DESC LIMIT 8`,
        [desde, hastaInclusive]
      ),

      // 5. Por tipo cliente
      query(
        `SELECT COALESCE(tipo_cliente, 'Sin tipo') AS tipo, COUNT(*)::int AS total,
                COALESCE(SUM(precio_pagado), 0)::numeric AS ingresos
         FROM inscripciones WHERE created_at BETWEEN $1 AND $2
         GROUP BY tipo_cliente ORDER BY total DESC`,
        [desde, hastaInclusive]
      ),

      // 6. Por hora de inscripción
      query(
        `SELECT EXTRACT(HOUR FROM created_at)::int AS hora, COUNT(*)::int AS total
         FROM inscripciones WHERE created_at BETWEEN $1 AND $2
         GROUP BY hora ORDER BY hora`,
        [desde, hastaInclusive]
      ),

      // 7. Top implementos
      query(
        `SELECT tipo, COUNT(*)::int AS total
         FROM implementos WHERE origen = 'compra' AND created_at BETWEEN $1 AND $2
         GROUP BY tipo ORDER BY total DESC LIMIT 8`,
        [desde, hastaInclusive]
      ).catch(() => []),

      // 8. Alumnos LTV (top 10 by total paid, no date filter)
      query(
        `SELECT a.id, a.nombre_alumno AS nombre, LOWER(a.estado) AS estado,
           MIN(i.created_at)::date AS primera_inscripcion,
           COUNT(i.id)::int AS inscripciones_count,
           COALESCE(SUM(i.precio_pagado), 0)::numeric AS total_pagado
         FROM alumnos a
         JOIN inscripciones i ON i.alumno_id = a.id
         GROUP BY a.id, a.nombre_alumno, a.estado
         ORDER BY total_pagado DESC
         LIMIT 10`
      ),
    ]);

    return res.json({
      success: true,
      data: {
        inscripcionesMes: resumen?.total || 0,
        ingresosMes: Number(resumen?.ingresos || 0),
        inscripcionesDiarias: inscDiarias || [],
        ventasMensuales: ventasMensuales || [],
        porPrograma: porPrograma || [],
        porTipoCliente: porTipoCliente || [],
        porHora: porHora || [],
        topImplementos: topImpl || [],
        alumnosAntiguos: alumnosLtv || [],
      },
    });
  } catch (err) {
    console.error('Error analytics:', err);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

module.exports = router;
