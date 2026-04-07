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

function detectarTurno() {
  const hora = new Date().getHours();
  if (hora >= 6 && hora < 13) return 'Mañana';
  if (hora >= 13 && hora < 20) return 'Tarde';
  return 'General';
}

module.exports = router;
