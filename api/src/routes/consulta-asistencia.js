const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { query, queryOne } = require('../db');
const { AlumnoService, InscripcionService } = require('../services');

const router = Router();

function handleError(res, err) {
  if (err.statusHint) return res.status(err.statusHint).json({ success: false, error: err.message, code: err.code, ...(err.extra || {}) });
  console.error(err);
  res.status(500).json({ success: false, error: 'Error del servidor' });
}

// Rate limit específico: 30 req/min por IP
const consultaLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiadas consultas, intenta en un minuto' },
});

// GET / — Consulta pública de asistencias por DNI
router.get('/', consultaLimiter, async (req, res) => {
  try {
    const { dni } = req.query;

    if (!dni || typeof dni !== 'string') {
      return res.status(400).json({ success: false, error: 'DNI es requerido' });
    }

    // Normalizar DNI: quitar espacios, guiones y puntos
    const dniNorm = dni.replace(/[\s\-.]/g, '').trim();

    if (!dniNorm || dniNorm.length < 4) {
      return res.status(400).json({ success: false, error: 'DNI inválido' });
    }

    // 1. Buscar alumno con DNI normalizado (alumno O apoderado) — unified query
    const alumno = await AlumnoService.buscarPorDni(dniNorm, { soloActivos: true });

    if (!alumno) {
      return res.json({ success: false, error: 'DNI no encontrado. Puedes usar el DNI del alumno o del apoderado.' });
    }

    // 2. Buscar inscripción activa
    const inscripcion = await InscripcionService.getActiva(alumno.id, { strict: true });

    let programa = null;
    let clasesTotales = 0;
    let clasesAsistidas = 0;
    let clasesRestantes = 0;
    let estadoInscripcion = 'sin inscripción';

    if (inscripcion) {
      programa = inscripcion.programa;
      clasesTotales = inscripcion.clases_totales || 0;
      estadoInscripcion = 'activo';

      // 3. Contar asistencias dentro del periodo de inscripción
      const countResult = await queryOne(`
        SELECT COUNT(*) AS total
        FROM asistencias
        WHERE alumno_id = $1
          AND asistio = 'Sí'
          AND fecha >= $2
          AND fecha <= $3
      `, [alumno.id, inscripcion.fecha_inicio, inscripcion.fecha_fin]);

      clasesAsistidas = parseInt(countResult.total, 10) || 0;
      clasesRestantes = Math.max(0, clasesTotales - clasesAsistidas);
    }

    // 4. Últimas 50 asistencias para mostrar
    const asistencias = await query(`
      SELECT fecha, turno, asistio
      FROM asistencias
      WHERE alumno_id = $1
      ORDER BY fecha DESC, hora DESC
      LIMIT 50
    `, [alumno.id]);

    res.json({
      success: true,
      data: {
        nombre_alumno: alumno.nombre_alumno,
        cinturon_actual: alumno.cinturon_actual || 'Blanco',
        programa,
        clases_totales: clasesTotales,
        clases_asistidas: clasesAsistidas,
        clases_restantes: clasesRestantes,
        estado: estadoInscripcion,
        asistencias: asistencias.map(a => ({
          fecha: a.fecha,
          turno: a.turno,
          asistio: a.asistio,
        })),
      },
    });
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;
