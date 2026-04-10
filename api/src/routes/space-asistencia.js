const { Router } = require('express');
const { query, queryOne, pool } = require('../db');

const router = Router();

// Valores válidos para asistio (VARCHAR)
const ASISTIO_VALIDOS = ['Sí', 'No', 'Tardanza'];
// Clases válidas (el campo 'turno' en asistencias guarda el nombre de la clase/programa)
const CLASES_VALIDAS = ['Súper Baby Wolf', 'Baby Wolf', 'Little Wolf', 'Junior Wolf', 'Adolescentes Wolf'];

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

// GET /api/space/asistencia/hoy — Today's attendance (or date range with pagination)
router.get('/hoy', async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    let where = 'WHERE a.fecha = CURRENT_DATE';
    let params = [];
    if (desde && hasta) {
      where = 'WHERE a.fecha >= $1 AND a.fecha <= $2';
      params = [desde, hasta];
    }

    const countResult = await queryOne(`SELECT COUNT(*) AS total FROM asistencias a ${where}`, params);
    const total = parseInt(countResult.total, 10);

    const rows = await query(
      `SELECT a.id, a.fecha, a.hora::text, a.turno, a.asistio, a.observaciones,
              al.nombre_alumno, al.dni_alumno,
              i.programa
       FROM asistencias a
       LEFT JOIN alumnos al ON al.id = a.alumno_id
       LEFT JOIN inscripciones i ON i.id = a.inscripcion_id
       ${where}
       ORDER BY a.fecha DESC, a.hora DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return res.json({ success: true, data: rows, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Error obteniendo asistencia:', err);
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
              COUNT(*) FILTER (WHERE asistio = 'Sí') AS presentes
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
                COUNT(*) FILTER (WHERE asistio = 'Sí') AS presentes,
                COUNT(*) FILTER (WHERE asistio = 'No') AS ausentes
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
        return `${r.fecha},${r.hora || ''},${r.turno || ''},${r.asistio || 'No'},"${nombre}",${r.dni_alumno || ''},${r.programa || ''},"${obs}"`;
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
                COUNT(*) FILTER (WHERE asistio = 'Sí') AS presentes
         FROM asistencias
         WHERE fecha >= CURRENT_DATE - INTERVAL '28 days'
           AND fecha <= CURRENT_DATE
         GROUP BY to_char(fecha, 'Day'), EXTRACT(DOW FROM fecha)
         ORDER BY dia_num ASC`
      ),
      query(
        `SELECT turno,
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE asistio = 'Sí') AS presentes
         FROM asistencias
         WHERE fecha >= CURRENT_DATE - INTERVAL '28 days'
           AND fecha <= CURRENT_DATE
         GROUP BY turno
         ORDER BY turno ASC`
      ),
      query(
        `SELECT COALESCE(i.programa, 'Sin programa') AS programa,
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE a.asistio = 'Sí') AS presentes
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

// POST /api/space/asistencia/historica — Registrar UNA asistencia pasada
// Body: { alumno_id, fecha, turno?, asistio?, observaciones? }
router.post('/historica', async (req, res) => {
  try {
    const { alumno_id, fecha, turno, asistio, observaciones } = req.body || {};

    if (!alumno_id || !fecha) {
      return res.status(400).json({
        success: false,
        error: 'alumno_id y fecha son requeridos',
        code: 'ASIST_HIST_REQ',
      });
    }

    // Validar alumno existe
    const alumno = await queryOne('SELECT id FROM alumnos WHERE id = $1', [alumno_id]);
    if (!alumno) {
      return res.status(404).json({ success: false, error: 'Alumno no encontrado', code: 'ASIST_HIST_ALUMNO_NF' });
    }

    const asistioFinal = ASISTIO_VALIDOS.includes(asistio) ? asistio : 'Sí';
    // turno = nombre de la clase. Acepta cualquier string no vacío; si no viene, null
    const turnoFinal = (typeof turno === 'string' && turno.trim()) ? turno.trim() : null;

    // Dedup: si ya existe asistencia mismo alumno + misma fecha, rechazar
    const existe = await queryOne(
      'SELECT id FROM asistencias WHERE alumno_id = $1 AND fecha = $2',
      [alumno_id, fecha]
    );
    if (existe) {
      return res.status(409).json({
        success: false,
        error: `Ya existe una asistencia para este alumno en la fecha ${fecha}`,
        code: 'ASIST_HIST_DUP',
        existing_id: existe.id,
      });
    }

    // Buscar inscripción activa del alumno para vincular
    const insc = await queryOne(
      `SELECT id FROM inscripciones
       WHERE alumno_id = $1
         AND estado = 'Activo'
         AND (fecha_inicio IS NULL OR fecha_inicio <= $2)
         AND (fecha_fin IS NULL OR fecha_fin >= $2)
       ORDER BY fecha_inicio DESC LIMIT 1`,
      [alumno_id, fecha]
    );
    const inscripcionId = insc ? insc.id : null;

    const row = await queryOne(
      `INSERT INTO asistencias (alumno_id, inscripcion_id, fecha, turno, asistio, observaciones, metodo_registro)
       VALUES ($1, $2, $3, $4, $5, $6, 'manual_admin')
       RETURNING id, alumno_id, fecha, turno, asistio, observaciones, metodo_registro, created_at`,
      [alumno_id, inscripcionId, fecha, turnoFinal, asistioFinal, observaciones || null]
    );

    return res.json({ success: true, data: row });
  } catch (err) {
    console.error('Error registrando asistencia histórica:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'ASIST_HIST_ERROR' });
  }
});

// POST /api/space/asistencia/historica/batch — Registrar MÚLTIPLES asistencias
// Body: { alumno_id, fechas: [{ fecha, turno?, asistio?, observaciones? }] }
router.post('/historica/batch', async (req, res) => {
  const client = await pool.connect();
  try {
    const { alumno_id, fechas } = req.body || {};

    if (!alumno_id || !Array.isArray(fechas) || fechas.length === 0) {
      client.release();
      return res.status(400).json({
        success: false,
        error: 'alumno_id y fechas (array) son requeridos',
        code: 'ASIST_BATCH_REQ',
      });
    }

    if (fechas.length > 500) {
      client.release();
      return res.status(400).json({
        success: false,
        error: 'Máximo 500 asistencias por batch',
        code: 'ASIST_BATCH_LIMIT',
      });
    }

    // Validar alumno existe
    const alumnoCheck = await client.query('SELECT id FROM alumnos WHERE id = $1', [alumno_id]);
    if (alumnoCheck.rows.length === 0) {
      client.release();
      return res.status(404).json({ success: false, error: 'Alumno no encontrado', code: 'ASIST_BATCH_ALUMNO_NF' });
    }

    // Fechas ya existentes del alumno para dedup
    const existentes = await client.query(
      'SELECT fecha FROM asistencias WHERE alumno_id = $1',
      [alumno_id]
    );
    const setExistentes = new Set(existentes.rows.map(r => r.fecha.toISOString().slice(0, 10)));

    // Inscripciones del alumno (para vincular cada fecha)
    const inscAll = await client.query(
      `SELECT id, fecha_inicio, fecha_fin FROM inscripciones
       WHERE alumno_id = $1 AND estado = 'Activo'
       ORDER BY fecha_inicio DESC`,
      [alumno_id]
    );

    function inscripcionPara(fecha) {
      for (const i of inscAll.rows) {
        const inicio = i.fecha_inicio ? i.fecha_inicio.toISOString().slice(0, 10) : null;
        const fin = i.fecha_fin ? i.fecha_fin.toISOString().slice(0, 10) : null;
        if ((!inicio || inicio <= fecha) && (!fin || fin >= fecha)) return i.id;
      }
      return inscAll.rows[0]?.id || null;
    }

    await client.query('BEGIN');

    let insertadas = 0;
    let skipped = 0;
    const insertadasFechas = [];
    const skippedFechas = [];

    for (const item of fechas) {
      const fecha = typeof item === 'string' ? item : item.fecha;
      if (!fecha) continue;

      if (setExistentes.has(fecha)) {
        skipped++;
        skippedFechas.push(fecha);
        continue;
      }

      const turno = (typeof item.turno === 'string' && item.turno.trim()) ? item.turno.trim() : null;
      const asistio = ASISTIO_VALIDOS.includes(item.asistio) ? item.asistio : 'Sí';
      const obs = item.observaciones || null;

      await client.query(
        `INSERT INTO asistencias (alumno_id, inscripcion_id, fecha, turno, asistio, observaciones, metodo_registro)
         VALUES ($1, $2, $3, $4, $5, $6, 'manual_admin')`,
        [alumno_id, inscripcionPara(fecha), fecha, turno, asistio, obs]
      );
      insertadas++;
      insertadasFechas.push(fecha);
      setExistentes.add(fecha); // evitar duplicados dentro del mismo batch
    }

    await client.query('COMMIT');

    return res.json({
      success: true,
      data: {
        alumno_id,
        insertadas,
        skipped_duplicadas: skipped,
        fechas_insertadas: insertadasFechas,
        fechas_skipped: skippedFechas,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error en batch asistencia histórica:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor', code: 'ASIST_BATCH_ERROR' });
  } finally {
    client.release();
  }
});

module.exports = router;
