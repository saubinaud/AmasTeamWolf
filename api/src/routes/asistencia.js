const { Router } = require('express');
const { query, queryOne } = require('../db');

const router = Router();

// POST /api/asistencia — Registrar asistencia via QR
// Body: { dni_alumno, token_qr, turno }
router.post('/', async (req, res) => {
  try {
    const { dni_alumno, token_qr, turno } = req.body;

    if (!dni_alumno || !token_qr) {
      return res.json({ success: false, error: 'DNI y token QR son requeridos' });
    }

    const turnoFinal = turno || detectarTurno();

    const result = await queryOne(
      'SELECT registrar_asistencia($1, $2, $3) AS resultado',
      [dni_alumno, token_qr, turnoFinal]
    );

    const data = typeof result.resultado === 'string'
      ? JSON.parse(result.resultado)
      : result.resultado;

    res.json(data);
  } catch (err) {
    console.error('Error registrando asistencia:', err);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// GET /api/asistencia/hoy — Asistencias del día con datos del alumno
// Query opcional: ?token=UUID — filtra por sesión QR específica
router.get('/hoy', async (req, res) => {
  try {
    const { token } = req.query;
    let rows;

    if (token) {
      // Filtrar por sesión QR específica
      rows = await query(`
        SELECT
          a.nombre_alumno,
          ast.hora::text AS hora,
          ast.turno,
          ast.asistio,
          i.programa
        FROM asistencias ast
        JOIN alumnos a ON a.id = ast.alumno_id
        LEFT JOIN inscripciones i ON i.id = ast.inscripcion_id
        JOIN qr_sesiones qs ON qs.id = ast.qr_sesion_id
        WHERE ast.fecha = CURRENT_DATE AND qs.token = $1
        ORDER BY ast.hora DESC
      `, [token]);
    } else {
      // Todas las del día
      try {
        rows = await query('SELECT * FROM v_asistencia_hoy ORDER BY hora DESC');
      } catch (_viewErr) {
        rows = await query(`
          SELECT
            a.nombre_alumno,
            ast.hora::text AS hora,
            ast.turno,
            ast.asistio,
            i.programa
          FROM asistencias ast
          JOIN alumnos a ON a.id = ast.alumno_id
          LEFT JOIN inscripciones i ON i.id = ast.inscripcion_id
          WHERE ast.fecha = CURRENT_DATE
          ORDER BY ast.hora DESC
        `);
      }
    }
    res.json(rows);
  } catch (err) {
    console.error('Error obteniendo asistencias de hoy:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/asistencia/mensual/:alumnoId — Resumen mensual por alumno
router.get('/mensual/:alumnoId', async (req, res) => {
  try {
    const { alumnoId } = req.params;
    let rows;
    try {
      rows = await query(
        'SELECT * FROM v_asistencia_mensual WHERE alumno_id = $1 ORDER BY mes DESC',
        [alumnoId]
      );
    } catch (_viewErr) {
      rows = await query(`
        SELECT
          DATE_TRUNC('month', fecha) AS mes,
          COUNT(*) AS total_asistencias,
          COUNT(*) FILTER (WHERE asistio = 'Sí') AS presentes
        FROM asistencias
        WHERE alumno_id = $1
        GROUP BY DATE_TRUNC('month', fecha)
        ORDER BY mes DESC
      `, [alumnoId]);
    }
    res.json(rows);
  } catch (err) {
    console.error('Error obteniendo asistencia mensual:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/asistencia/resumen-dia — Resumen de asistencias agrupadas por sesión QR
router.get('/resumen-dia', async (_req, res) => {
  try {
    const rows = await query(`
      SELECT
        qs.hora_clase,
        qs.programa,
        qs.token,
        COUNT(ast.id) AS presentes
      FROM qr_sesiones qs
      LEFT JOIN asistencias ast ON ast.qr_sesion_id = qs.id AND ast.fecha = CURRENT_DATE
      WHERE qs.fecha = CURRENT_DATE AND qs.activa = true
      GROUP BY qs.id, qs.hora_clase, qs.programa, qs.token
      ORDER BY qs.hora_apertura ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error resumen día:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/asistencia/exportar — Exportar asistencias del día en CSV
// Query: ?fecha=YYYY-MM-DD (default: hoy)
router.get('/exportar', async (req, res) => {
  try {
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];
    const rows = await query(`
      SELECT
        a.nombre_alumno,
        a.dni_alumno,
        i.programa,
        ast.hora::text AS hora,
        ast.turno,
        ast.asistio,
        s.nombre AS sede,
        qs.hora_clase,
        qs.programa AS clase_qr
      FROM asistencias ast
      JOIN alumnos a ON a.id = ast.alumno_id
      LEFT JOIN inscripciones i ON i.id = ast.inscripcion_id
      LEFT JOIN sedes s ON s.id = ast.sede_id
      LEFT JOIN qr_sesiones qs ON qs.id = ast.qr_sesion_id
      WHERE ast.fecha = $1
      ORDER BY ast.hora ASC
    `, [fecha]);

    // Generar CSV
    const headers = ['Alumno', 'DNI', 'Programa', 'Hora', 'Turno', 'Asistió', 'Sede', 'Clase'];
    const csvRows = [headers.join(',')];
    for (const r of rows) {
      csvRows.push([
        `"${(r.nombre_alumno || '').replace(/"/g, '""')}"`,
        r.dni_alumno || '',
        `"${(r.programa || r.clase_qr || '').replace(/"/g, '""')}"`,
        r.hora || '',
        `"${(r.turno || '').replace(/"/g, '""')}"`,
        r.asistio || '',
        `"${(r.sede || '').replace(/"/g, '""')}"`,
        r.hora_clase || '',
      ].join(','));
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=asistencia_${fecha}.csv`);
    res.send('\uFEFF' + csvRows.join('\n'));
  } catch (err) {
    console.error('Error exportando asistencia:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/asistencia/dashboard — Estadísticas mensuales para dashboard
// Query: ?mes=YYYY-MM (default: mes actual)
router.get('/dashboard', async (req, res) => {
  try {
    const mes = req.query.mes || new Date().toISOString().slice(0, 7);
    // Calcular último día del mes correctamente
    const [anio, mesNum] = mes.split('-').map(Number);
    const inicio = `${mes}-01`;
    const ultimoDia = new Date(anio, mesNum, 0).getDate();
    const fin = `${mes}-${String(ultimoDia).padStart(2, '0')}`;

    // Ejecutar todas las queries en paralelo
    const [porDia, porPrograma, porDiaSemana, topAlumnos, totales] = await Promise.all([
      query(`
        SELECT fecha, COUNT(*) AS total
        FROM asistencias
        WHERE fecha BETWEEN $1 AND $2 AND asistio = 'Sí'
        GROUP BY fecha ORDER BY fecha
      `, [inicio, fin]),
      query(`
        SELECT COALESCE(i.programa, ast.turno, 'Sin programa') AS programa, COUNT(*) AS total
        FROM asistencias ast
        LEFT JOIN inscripciones i ON i.id = ast.inscripcion_id
        WHERE ast.fecha BETWEEN $1 AND $2 AND ast.asistio = 'Sí'
        GROUP BY COALESCE(i.programa, ast.turno, 'Sin programa') ORDER BY total DESC
      `, [inicio, fin]),
      query(`
        SELECT EXTRACT(DOW FROM fecha)::int AS dia, COUNT(*) AS total
        FROM asistencias
        WHERE fecha BETWEEN $1 AND $2 AND asistio = 'Sí'
        GROUP BY dia ORDER BY dia
      `, [inicio, fin]),
      query(`
        SELECT a.nombre_alumno, COUNT(*) AS total
        FROM asistencias ast
        JOIN alumnos a ON a.id = ast.alumno_id
        WHERE ast.fecha BETWEEN $1 AND $2 AND ast.asistio = 'Sí'
        GROUP BY a.id, a.nombre_alumno
        ORDER BY total DESC LIMIT 10
      `, [inicio, fin]),
      query(`
        SELECT
          COUNT(*) AS total_asistencias,
          COUNT(DISTINCT alumno_id) AS alumnos_unicos,
          COUNT(DISTINCT fecha) AS dias_con_clase
        FROM asistencias
        WHERE fecha BETWEEN $1 AND $2 AND asistio = 'Sí'
      `, [inicio, fin]),
    ]);

    res.json({
      mes,
      totales: totales[0] || { total_asistencias: 0, alumnos_unicos: 0, dias_con_clase: 0 },
      porDia,
      porPrograma,
      porDiaSemana,
      topAlumnos,
    });
  } catch (err) {
    console.error('Error dashboard:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

function detectarTurno() {
  const hora = new Date().getHours();
  if (hora >= 6 && hora < 13) return 'Mañana';
  if (hora >= 13 && hora < 20) return 'Tarde';
  return 'General';
}

module.exports = router;
