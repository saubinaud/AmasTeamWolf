const { query, queryOne } = require('../db');
const { DuplicateError, NotFoundError } = require('./errors');
const AlumnoService = require('./AlumnoService');
const InscripcionService = require('./InscripcionService');

// ── Helpers moved from asistencia.js ──

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

/**
 * Resuelve el turno del alumno.
 * Prioridad: inscripcion.turno > programa > categoria > edad > 'General'
 */
function resolverTurno(alumno, inscripcion) {
  if (inscripcion?.turno) return inscripcion.turno;
  if (inscripcion?.programa) {
    const mapped = mapearCategoria(inscripcion.programa);
    if (mapped) return mapped;
  }
  if (alumno?.categoria) {
    const mapped = mapearCategoria(alumno.categoria);
    if (mapped) return mapped;
  }
  const fromEdad = detectarClase(alumno?.fecha_nacimiento);
  return fromEdad || 'General';
}

/**
 * Verifica si el alumno ya registró asistencia hoy para el turno dado.
 */
async function yaRegistroHoy(alumnoId, turno) {
  const row = await queryOne(`
    SELECT id FROM asistencias
    WHERE alumno_id = $1 AND fecha = CURRENT_DATE AND turno = $2
  `, [alumnoId, turno]);
  return !!row;
}

/**
 * Registra asistencia para un alumno.
 * @param {number} alumnoId
 * @param {object} opts - { turno, tokenQr, metodo, sedeId }
 * @returns {{ success, alumno, clase_detectada, asistencia }}
 */
async function registrar(alumnoId, { turno, tokenQr, metodo = 'manual', sedeId = 1 } = {}) {
  // 1. Get alumno
  const alumno = await AlumnoService.getById(alumnoId);

  // 2. Get inscription (with fallback)
  const inscripcion = await InscripcionService.getActiva(alumnoId, { strict: false });

  // 3. Resolve turno
  const turnoFinal = turno || resolverTurno(alumno, inscripcion);

  // 4. Check duplicate
  if (await yaRegistroHoy(alumnoId, turnoFinal)) {
    throw new DuplicateError(
      `${alumno.nombre_alumno} ya tiene asistencia registrada hoy para ${turnoFinal}`,
      'DUPLICATE',
      { alumno: alumno.nombre_alumno, clase_detectada: turnoFinal }
    );
  }

  // 5. Resolve QR session if token provided
  let qrSesionId = null;
  if (tokenQr) {
    const sesion = await queryOne(
      'SELECT id, programa FROM qr_sesiones WHERE token = $1',
      [tokenQr]
    );
    if (sesion) {
      qrSesionId = sesion.id;
    }
  }

  // 6. INSERT into asistencias
  const asistencia = await queryOne(`
    INSERT INTO asistencias (alumno_id, inscripcion_id, sede_id, fecha, hora, turno, asistio, metodo_registro, qr_sesion_id)
    VALUES ($1, $2, $3, CURRENT_DATE, NOW()::time, $4, 'Sí', $5, $6)
    RETURNING *
  `, [
    alumnoId,
    inscripcion?.id || null,
    sedeId,
    turnoFinal,
    metodo,
    qrSesionId,
  ]);

  // 7. Return result
  return {
    success: true,
    alumno: alumno.nombre_alumno,
    clase_detectada: turnoFinal,
    asistencia,
  };
}

/**
 * Obtiene asistencias de hoy, opcionalmente filtradas por token QR.
 */
async function getHoy({ token } = {}) {
  if (token) {
    return query(`
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
  }

  // Sin token: todas las del día
  try {
    return await query('SELECT * FROM v_asistencia_hoy ORDER BY hora DESC');
  } catch (_viewErr) {
    return query(`
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

module.exports = {
  CATEGORIA_MAP,
  mapearCategoria,
  detectarClase,
  resolverTurno,
  yaRegistroHoy,
  registrar,
  getHoy,
};
