const { Router } = require('express');
const { query, queryOne } = require('../db');

const router = Router();

// ── Helper: detectar clase por edad ──
function detectarClase(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  const edadMeses = Math.floor((hoy - nacimiento) / (1000 * 60 * 60 * 24 * 30.44));
  const edadAnios = Math.floor(edadMeses / 12);

  if (edadMeses >= 11 && edadMeses <= 26) return 'Súper Baby Wolf';
  if (edadMeses >= 27 && edadMeses <= 48) return 'Baby Wolf';
  if (edadMeses >= 49 && edadMeses <= 71) return 'Little Wolf';
  if (edadAnios >= 6 && edadAnios <= 11) return 'Junior Wolf';
  if (edadAnios >= 12 && edadAnios <= 17) return 'Adolescentes Wolf';
  return 'Adolescentes Wolf'; // default for adults
}

// ── Helper: mapear categoria a nombre de clase ──
const CATEGORIA_MAP = {
  'baby wolf': 'Baby Wolf',
  'baby': 'Baby Wolf',
  'littel': 'Little Wolf',
  'little': 'Little Wolf',
  'little wolf': 'Little Wolf',
  'juniors': 'Junior Wolf',
  'junior': 'Junior Wolf',
  'junior wolf': 'Junior Wolf',
  'adolescentes': 'Adolescentes Wolf',
  'adolescentes wolf': 'Adolescentes Wolf',
  'súper baby wolf': 'Súper Baby Wolf',
  'super baby wolf': 'Súper Baby Wolf',
  'súper baby': 'Súper Baby Wolf',
  'super baby': 'Súper Baby Wolf',
};

function mapearCategoria(categoria) {
  if (!categoria) return null;
  return CATEGORIA_MAP[categoria.toLowerCase().trim()] || null;
}

// ── Helper: detectar turno del alumno para QR diario ──
async function detectarTurnoDiario(dniAlumno) {
  // 1. Buscar turno desde inscripcion activa
  const inscripcion = await queryOne(`
    SELECT i.turno, i.programa
    FROM inscripciones i
    JOIN alumnos a ON a.id = i.alumno_id
    WHERE a.dni_alumno = $1 AND i.estado = 'activa'
    ORDER BY i.fecha_inicio DESC
    LIMIT 1
  `, [dniAlumno]);

  if (inscripcion && inscripcion.turno) {
    return inscripcion.turno;
  }
  if (inscripcion && inscripcion.programa) {
    const mapped = mapearCategoria(inscripcion.programa);
    if (mapped) return mapped;
  }

  // 2. Buscar por categoria del alumno
  const alumno = await queryOne(`
    SELECT categoria, fecha_nacimiento
    FROM alumnos
    WHERE dni_alumno = $1
  `, [dniAlumno]);

  if (alumno) {
    const fromCategoria = mapearCategoria(alumno.categoria);
    if (fromCategoria) return fromCategoria;

    // 3. Inferir por edad
    const fromEdad = detectarClase(alumno.fecha_nacimiento);
    if (fromEdad) return fromEdad;
  }

  return 'General';
}

// POST /api/asistencia — Registrar asistencia via QR
// Body: { dni_alumno, token_qr, turno }
router.post('/', async (req, res) => {
  try {
    const { dni_alumno, token_qr, turno } = req.body;

    if (!dni_alumno || !token_qr) {
      return res.status(400).json({ success: false, error: 'DNI y token QR son requeridos' });
    }

    // Verificar si es QR diario para auto-detectar turno
    let turnoFinal = turno || detectarTurno();
    let esDiario = false;

    try {
      const sesion = await queryOne(
        'SELECT programa FROM qr_sesiones WHERE token = $1',
        [token_qr]
      );
      if (sesion && sesion.programa === 'diario') {
        esDiario = true;
        turnoFinal = await detectarTurnoDiario(dni_alumno);
      }
    } catch (_err) {
      // Si falla la consulta, continuar con turno normal
    }

    const result = await queryOne(
      'SELECT registrar_asistencia($1, $2, $3) AS resultado',
      [dni_alumno, token_qr, turnoFinal]
    );

    const data = typeof result.resultado === 'string'
      ? JSON.parse(result.resultado)
      : result.resultado;

    // Si es QR diario, agregar info de clase detectada
    if (esDiario && data && (Array.isArray(data) ? data[0] : data)) {
      const entry = Array.isArray(data) ? data[0] : data;
      entry.clase_detectada = turnoFinal;
    }

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
    res.status(500).json({ success: false, error: 'Error del servidor' });
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

function detectarTurno() {
  const hora = new Date().getHours();
  if (hora >= 6 && hora < 13) return 'Mañana';
  if (hora >= 13 && hora < 20) return 'Tarde';
  return 'General';
}

module.exports = router;
