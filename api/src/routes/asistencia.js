const { Router } = require('express');
const { query } = require('../db');
const { AlumnoService, AsistenciaService } = require('../services');

const router = Router();

function handleError(res, err) {
  if (err.statusHint) return res.status(err.statusHint).json({ success: false, error: err.message, code: err.code, ...(err.extra || {}) });
  console.error(err);
  res.status(500).json({ success: false, error: 'Error del servidor' });
}

// POST /api/asistencia — Registrar asistencia via QR
// Body: { dni_alumno, token_qr, turno }
router.post('/', async (req, res) => {
  try {
    const { dni_alumno, token_qr, turno } = req.body;

    if (!dni_alumno || !token_qr) {
      return res.status(400).json({ success: false, error: 'DNI y token QR son requeridos' });
    }

    const dniNorm = AlumnoService.normalizeDni(dni_alumno);

    // Resolver DNI: puede ser del alumno O del apoderado
    const alumno = await AlumnoService.buscarPorDni(dniNorm);

    if (!alumno) {
      return res.status(404).json({ success: false, error: 'Alumno no encontrado con ese DNI' });
    }

    // Registrar via service (handles turno resolution, duplicate check, membresia, etc.)
    const resultado = await AsistenciaService.registrar(alumno.id, {
      turno: turno || undefined,
      tokenQr: token_qr,
      metodo: 'qr',
    });

    const now = new Date();
    return res.json({
      success: true,
      alumno: resultado.alumno,
      programa: resultado.programa,
      fecha: now.toISOString().split('T')[0],
      hora: now.toTimeString().slice(0, 5),
      turno: resultado.clase_detectada,
      clase_detectada: resultado.clase_detectada,
      clases_restantes: resultado.clases_restantes,
      membresia_vencida: resultado.membresia_vencida,
    });
  } catch (err) {
    if (err.code === 'DUPLICATE') {
      return res.status(409).json({
        success: false,
        error: 'Asistencia ya registrada hoy',
        alumno: err.extra?.alumno,
        turno: err.extra?.clase_detectada,
      });
    }
    handleError(res, err);
  }
});

// GET /api/asistencia/hoy — Asistencias del día con datos del alumno
// Query opcional: ?token=UUID — filtra por sesión QR específica
router.get('/hoy', async (req, res) => {
  try {
    const { token } = req.query;
    const rows = await AsistenciaService.getHoy({ token });
    res.json(rows);
  } catch (err) {
    handleError(res, err);
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
    res.status(500).json({ success: false, error: 'Error del servidor' });
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
    res.status(500).json({ success: false, error: 'Error del servidor' });
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
    res.status(500).json({ success: false, error: 'Error del servidor' });
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
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// POST /api/asistencia/por-nombre — Registrar asistencia por alumno_id
// Body: { alumno_id, token?, turno? }
router.post('/por-nombre', async (req, res) => {
  try {
    const { alumno_id, token, turno } = req.body;

    if (!alumno_id) {
      return res.status(400).json({ success: false, error: 'alumno_id es requerido' });
    }

    const resultado = await AsistenciaService.registrar(alumno_id, {
      turno: turno || undefined,
      tokenQr: token || undefined,
      metodo: token ? 'qr' : 'manual',
    });

    const now = new Date();
    return res.json({
      success: true,
      alumno: resultado.alumno,
      programa: resultado.programa,
      fecha: now.toISOString().split('T')[0],
      hora: now.toTimeString().slice(0, 5),
      turno: resultado.clase_detectada,
      clase_detectada: resultado.clase_detectada,
      clases_restantes: resultado.clases_restantes,
      membresia_vencida: resultado.membresia_vencida,
    });
  } catch (err) {
    if (err.code === 'DUPLICATE') {
      return res.status(409).json({
        success: false,
        error: 'Asistencia ya registrada hoy',
        alumno: err.extra?.alumno,
        turno: err.extra?.clase_detectada,
      });
    }
    handleError(res, err);
  }
});

// GET /api/asistencia/horarios-hoy — Today's schedule (public, no auth needed)
router.get('/horarios-hoy', async (_req, res) => {
  try {
    const dow = new Date().getDay(); // 0=Sun, 1=Mon...
    const rows = await query(
      `SELECT hora_inicio, hora_fin, nombre_clase, edad_min_meses, edad_max_meses
       FROM horarios
       WHERE activo = true AND dia_semana = $1
       ORDER BY hora_inicio`,
      [dow]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching horarios-hoy:', err);
    res.json({ success: true, data: [] });
  }
});

// ── Búsqueda pública de alumnos (para asistencia por nombre) ──
// Solo devuelve nombre, DNI y categoría — sin datos sensibles
router.get('/buscar-alumno', async (req, res) => {
  try {
    const { q } = req.query;
    const rows = await AlumnoService.buscar(q, { limit: 8, soloActivos: true });
    res.json(rows);
  } catch (err) {
    console.error('Error buscando alumno:', err);
    res.json([]);
  }
});

// GET /api/asistencia/alumnos-activos — Lista ligera de alumnos activos (público, para búsqueda client-side)
router.get('/alumnos-activos', async (_req, res) => {
  try {
    const rows = await AlumnoService.listarActivos();
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error listando alumnos activos:', err);
    res.json({ success: true, data: [] });
  }
});

module.exports = router;
