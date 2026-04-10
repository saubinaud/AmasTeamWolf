const { Router } = require('express');
const { query, queryOne } = require('../db');

const router = Router();

// GET /api/space/asistencia/stats — Quick counts: hoy, semana, alumnos unicos hoy
router.get('/stats', async (_req, res) => {
  try {
    const [hoy, semana, alumnosHoy] = await Promise.all([
      queryOne('SELECT COUNT(*) AS total FROM asistencias WHERE fecha = CURRENT_DATE'),
      queryOne(
        `SELECT COUNT(*) AS total FROM asistencias
         WHERE fecha >= date_trunc('week', CURRENT_DATE)
           AND fecha <= CURRENT_DATE`
      ),
      queryOne(
        'SELECT COUNT(DISTINCT alumno_id) AS total FROM asistencias WHERE fecha = CURRENT_DATE'
      ),
    ]);

    return res.json({
      success: true,
      stats: {
        asistenciasHoy: parseInt(hoy.total, 10),
        asistenciasSemana: parseInt(semana.total, 10),
        alumnosUnicosHoy: parseInt(alumnosHoy.total, 10),
      },
    });
  } catch (err) {
    console.error('Error obteniendo stats de asistencia:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'ASIST_STATS_ERROR' });
  }
});

// GET /api/space/asistencia/hoy — Today's attendance with alumno info
router.get('/hoy', async (_req, res) => {
  try {
    const rows = await query(
      `SELECT a.id, a.fecha, a.hora::text, a.turno, a.asistio, a.observaciones,
              al.nombre_alumno, al.dni_alumno,
              i.programa
       FROM asistencias a
       LEFT JOIN alumnos al ON al.id = a.alumno_id
       LEFT JOIN inscripciones i ON i.id = a.inscripcion_id
       WHERE a.fecha = CURRENT_DATE
       ORDER BY a.hora DESC`
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error obteniendo asistencia de hoy:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'ASIST_HOY_ERROR' });
  }
});

// GET /api/space/asistencia/por-fecha?desde=YYYY-MM-DD&hasta=YYYY-MM-DD — Daily summary by date range
router.get('/por-fecha', async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    if (!desde || !hasta) {
      return res.status(400).json({ success: false, error: 'Parámetros desde y hasta son requeridos' });
    }

    const rows = await query(
      `SELECT fecha,
              COUNT(*) AS total,
              COUNT(*) FILTER (WHERE asistio = true) AS presentes
       FROM asistencias
       WHERE fecha >= $1 AND fecha <= $2
       GROUP BY fecha
       ORDER BY fecha ASC`,
      [desde, hasta]
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error obteniendo asistencia por fecha:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'ASIST_FECHA_ERROR' });
  }
});

// GET /api/space/asistencia/por-alumno/:alumnoId — All attendance for a student + monthly summary
router.get('/por-alumno/:alumnoId', async (req, res) => {
  try {
    const { alumnoId } = req.params;

    const [alumno, registros, resumenMensual] = await Promise.all([
      queryOne(
        'SELECT id, nombre_alumno, dni_alumno, estado FROM alumnos WHERE id = $1',
        [alumnoId]
      ),
      query(
        `SELECT a.id, a.fecha, a.hora::text, a.turno, a.asistio, a.observaciones,
                i.programa
         FROM asistencias a
         LEFT JOIN inscripciones i ON i.id = a.inscripcion_id
         WHERE a.alumno_id = $1
         ORDER BY a.fecha DESC, a.hora DESC`,
        [alumnoId]
      ),
      query(
        `SELECT to_char(fecha, 'YYYY-MM') AS mes,
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE asistio = true) AS presentes,
                COUNT(*) FILTER (WHERE asistio = false) AS ausentes
         FROM asistencias
         WHERE alumno_id = $1
         GROUP BY to_char(fecha, 'YYYY-MM')
         ORDER BY mes DESC`,
        [alumnoId]
      ),
    ]);

    if (!alumno) {
      return res.status(404).json({ success: false, error: 'Alumno no encontrado' });
    }

    return res.json({
      success: true,
      data: {
        alumno,
        registros,
        resumenMensual,
      },
    });
  } catch (err) {
    console.error('Error obteniendo asistencia por alumno:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'ASIST_ALUMNO_ERROR' });
  }
});

// GET /api/space/asistencia/exportar?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&formato=csv — CSV export
router.get('/exportar', async (req, res) => {
  try {
    const { desde, hasta, formato } = req.query;

    if (!desde || !hasta) {
      return res.status(400).json({ success: false, error: 'Parámetros desde y hasta son requeridos' });
    }

    const rows = await query(
      `SELECT a.fecha, a.hora::text, a.turno, a.asistio, a.observaciones,
              al.nombre_alumno, al.dni_alumno,
              i.programa
       FROM asistencias a
       LEFT JOIN alumnos al ON al.id = a.alumno_id
       LEFT JOIN inscripciones i ON i.id = a.inscripcion_id
       WHERE a.fecha >= $1 AND a.fecha <= $2
       ORDER BY a.fecha ASC, a.hora ASC`,
      [desde, hasta]
    );

    if (formato === 'csv') {
      const header = 'Fecha,Hora,Turno,Asistio,Nombre,DNI,Programa,Observaciones';
      const csvRows = rows.map((r) => {
        const obs = (r.observaciones || '').replace(/"/g, '""');
        const nombre = (r.nombre_alumno || '').replace(/"/g, '""');
        return `${r.fecha},${r.hora || ''},${r.turno || ''},${r.asistio ? 'Si' : 'No'},"${nombre}",${r.dni_alumno || ''},${r.programa || ''},"${obs}"`;
      });
      const csv = [header, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="asistencia_${desde}_${hasta}.csv"`);
      return res.send(csv);
    }

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error exportando asistencia:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'ASIST_EXPORT_ERROR' });
  }
});

// GET /api/space/asistencia/resumen-semanal — Weekly summary: by day, turno, programa (last 4 weeks)
router.get('/resumen-semanal', async (_req, res) => {
  try {
    const [porDia, porTurno, porPrograma] = await Promise.all([
      query(
        `SELECT to_char(fecha, 'Day') AS dia,
                EXTRACT(DOW FROM fecha)::int AS dia_num,
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE asistio = true) AS presentes
         FROM asistencias
         WHERE fecha >= CURRENT_DATE - INTERVAL '28 days'
           AND fecha <= CURRENT_DATE
         GROUP BY to_char(fecha, 'Day'), EXTRACT(DOW FROM fecha)
         ORDER BY dia_num ASC`
      ),
      query(
        `SELECT turno,
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE asistio = true) AS presentes
         FROM asistencias
         WHERE fecha >= CURRENT_DATE - INTERVAL '28 days'
           AND fecha <= CURRENT_DATE
         GROUP BY turno
         ORDER BY turno ASC`
      ),
      query(
        `SELECT COALESCE(i.programa, 'Sin programa') AS programa,
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE a.asistio = true) AS presentes
         FROM asistencias a
         LEFT JOIN inscripciones i ON i.id = a.inscripcion_id
         WHERE a.fecha >= CURRENT_DATE - INTERVAL '28 days'
           AND a.fecha <= CURRENT_DATE
         GROUP BY i.programa
         ORDER BY total DESC`
      ),
    ]);

    return res.json({
      success: true,
      data: {
        porDia,
        porTurno,
        porPrograma,
      },
    });
  } catch (err) {
    console.error('Error obteniendo resumen semanal:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'ASIST_RESUMEN_ERROR' });
  }
});

module.exports = router;
