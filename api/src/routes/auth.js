const { Router } = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { query, queryOne, pool } = require('../db');
const { authMiddleware, signToken } = require('../middleware/auth');
const { enviarNotificacion } = require('../notifuse');

const router = Router();

// Rate limiting simple por DNI (en memoria)
const loginAttempts = new Map();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 min

function checkRateLimit(dni) {
  const now = Date.now();
  const key = `login:${dni}`;
  const record = loginAttempts.get(key);
  if (!record || now - record.start > RATE_LIMIT_WINDOW) {
    loginAttempts.set(key, { start: now, count: 1 });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) return false;
  record.count++;
  return true;
}

// Helper: cargar perfil completo de un alumno (reutiliza lógica de perfil.js)
async function cargarPerfil(alumnoId) {
  const perfil = await queryOne(`
    SELECT
      a.id AS alumno_id,
      a.nombre_alumno,
      a.dni_alumno,
      a.tipo_documento,
      a.fecha_nacimiento,
      a.categoria,
      a.nombre_apoderado,
      a.dni_apoderado,
      a.correo AS apoderado_correo,
      a.telefono AS apoderado_telefono,
      a.direccion,
      a.estado,
      i.id AS inscripcion_id,
      i.programa,
      i.fecha_inscripcion,
      i.fecha_inicio,
      i.fecha_fin,
      i.clases_totales,
      i.estado AS estado_inscripcion,
      i.estado_pago,
      i.precio_programa,
      i.precio_pagado,
      i.descuento,
      i.dias_tentativos,
      i.turno
    FROM alumnos a
    LEFT JOIN inscripciones i ON i.alumno_id = a.id AND i.estado = 'Activo'
    WHERE a.id = $1
    ORDER BY i.fecha_inscripcion DESC
    LIMIT 1
  `, [alumnoId]);

  if (!perfil) return null;

  // Tallas (última registrada)
  const talla = await queryOne(
    'SELECT talla_uniforme, talla_polo FROM tallas WHERE alumno_id = $1 ORDER BY id DESC LIMIT 1',
    [alumnoId]
  );

  // TODAS las asistencias (no solo 20)
  const asistencias = await query(
    'SELECT fecha, hora, turno, asistio FROM asistencias WHERE alumno_id = $1 ORDER BY fecha DESC, hora DESC',
    [alumnoId]
  );

  // Clases asistidas en el período de la inscripción activa
  let clases_asistidas = 0;
  if (perfil.fecha_inicio && perfil.fecha_fin) {
    const conteo = await queryOne(
      'SELECT COUNT(*) AS total FROM asistencias WHERE alumno_id = $1 AND fecha >= $2 AND fecha <= $3',
      [alumnoId, perfil.fecha_inicio, perfil.fecha_fin]
    );
    clases_asistidas = parseInt(conteo?.total || '0');
  }

  const clases_totales = parseInt(perfil.clases_totales || '0');

  // Congelamientos
  const congelaciones = await query(
    'SELECT fecha_inicio, fecha_fin, dias, motivo, estado FROM congelamientos WHERE alumno_id = $1 ORDER BY fecha_inicio DESC',
    [alumnoId]
  );

  // Cinturón actual
  const cinturonActual = await queryOne(
    'SELECT cinturon_actual FROM alumnos WHERE id = $1',
    [alumnoId]
  );

  // Historial de cinturones
  const historial_cinturones = await query(
    'SELECT cinturon, fecha_obtencion, observaciones FROM historial_cinturones WHERE alumno_id = $1 ORDER BY fecha_obtencion ASC',
    [alumnoId]
  );

  // Próxima graduación programada
  const proxima_graduacion = await queryOne(`
    SELECT fecha_graduacion, horario, turno, rango, cinturon_desde, cinturon_hasta, estado
    FROM graduaciones
    WHERE alumno_id = $1 AND estado IN ('programada', 'confirmada') AND fecha_graduacion >= CURRENT_DATE
    ORDER BY fecha_graduacion ASC LIMIT 1
  `, [alumnoId]);

  // Mensajes para este alumno (difusión + programa + individual)
  let mensajes = [];
  try {
    mensajes = await query(`
      SELECT m.id, m.tipo, m.asunto, m.contenido, m.created_at AS fecha,
             (ml.id IS NOT NULL) AS leido
      FROM mensajes m
      LEFT JOIN mensajes_leidos ml ON ml.mensaje_id = m.id AND ml.alumno_id = $1
      WHERE m.tipo = 'difusion'
         OR (m.tipo = 'programa' AND m.programa_destino = $2)
         OR (m.tipo = 'individual' AND m.alumno_destino_id = $1)
      ORDER BY m.created_at DESC
      LIMIT 20
    `, [alumnoId, perfil.programa || '']);
  } catch (_) { /* table may not exist yet */ }

  return {
    ...perfil,
    talla_uniforme: talla?.talla_uniforme || null,
    talla_polo: talla?.talla_polo || null,
    apoderado_nombre: perfil.nombre_apoderado,
    alumno_nombre: perfil.nombre_alumno,
    alumno_dni: perfil.dni_alumno,
    clases_totales,
    clases_asistidas,
    clases_restantes: Math.max(0, clases_totales - clases_asistidas),
    cinturon_actual: cinturonActual?.cinturon_actual || 'Blanco',
    historial_cinturones,
    proxima_graduacion,
    asistencias,
    congelaciones,
    mensajes,
  };
}

// POST /api/auth/login — Login con DNI + contraseña
router.post('/login', async (req, res) => {
  try {
    const { dni, password } = req.body;
    if (!dni) return res.status(400).json({ error: 'DNI requerido' });

    if (!checkRateLimit(dni)) {
      return res.status(429).json({ error: 'Demasiados intentos. Espera 15 minutos.' });
    }

    // Buscar alumno por DNI (normalizado: sin espacios, guiones, puntos)
    const dniNorm = String(dni).replace(/[\s\-\.]/g, '').trim();
    const alumno = await queryOne(
      `SELECT id, password_hash, nombre_apoderado, correo FROM alumnos
       WHERE REPLACE(REPLACE(dni_apoderado, ' ', ''), '-', '') = $1
          OR REPLACE(REPLACE(dni_alumno, ' ', ''), '-', '') = $1
       LIMIT 1`,
      [dniNorm]
    );

    if (!alumno) {
      return res.status(404).json({ error: 'DNI no registrado en la academia' });
    }

    // Si no tiene contraseña → necesita crearla
    if (!alumno.password_hash) {
      return res.json({ success: false, needsPassword: true, hasEmail: !!alumno.correo });
    }

    if (!password) return res.status(400).json({ error: 'Contraseña requerida' });

    const valid = await bcrypt.compare(password, alumno.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = signToken(alumno.id, dni);
    const perfil = await cargarPerfil(alumno.id);

    res.json({ success: true, token, perfil });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/auth/solicitar-codigo — Enviar código de verificación por email
router.post('/solicitar-codigo', async (req, res) => {
  try {
    const { dni } = req.body;
    if (!dni) return res.status(400).json({ error: 'DNI requerido' });

    const dniNorm = String(dni).replace(/[\s\-\.]/g, '').trim();
    const alumno = await queryOne(
      `SELECT id, correo, nombre_apoderado FROM alumnos
       WHERE REPLACE(REPLACE(dni_apoderado, ' ', ''), '-', '') = $1
          OR REPLACE(REPLACE(dni_alumno, ' ', ''), '-', '') = $1
       LIMIT 1`,
      [dniNorm]
    );

    if (!alumno) {
      return res.status(404).json({ error: 'DNI no registrado' });
    }

    if (!alumno.correo) {
      return res.status(400).json({ error: 'No hay correo registrado. Contacta a la academia por WhatsApp.' });
    }

    // Generar código de 6 dígitos
    const code = String(crypto.randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    // Invalidar códigos anteriores
    await pool.query(
      'UPDATE verification_codes SET used = TRUE WHERE alumno_id = $1 AND used = FALSE',
      [alumno.id]
    );

    // Guardar código nuevo
    await pool.query(
      'INSERT INTO verification_codes (alumno_id, code, expires_at) VALUES ($1, $2, $3)',
      [alumno.id, code, expiresAt]
    );

    // Enviar por email via Notifuse
    const emailSent = await enviarNotificacion('codigo_verificacion', alumno.correo, alumno.nombre_apoderado || 'Familia', {
      codigo: code,
      nombrePadre: alumno.nombre_apoderado || 'Familia AMAS',
    });

    // Log para debug (fallback si Notifuse falla)
    if (!emailSent) {
      console.log(`[AUTH] Código para DNI ${dni}: ${code} (email falló, enviar por WhatsApp)`);
    }

    // Enmascarar email para el frontend
    const parts = alumno.correo.split('@');
    const masked = parts[0].slice(0, 2) + '***@' + parts[1];

    res.json({ success: true, emailHint: masked });
  } catch (err) {
    console.error('Error solicitando código:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/auth/verificar-codigo — Validar código ingresado
router.post('/verificar-codigo', async (req, res) => {
  try {
    const { dni, code } = req.body;
    if (!dni || !code) return res.status(400).json({ error: 'DNI y código requeridos' });

    const dniNorm = String(dni).replace(/[\s\-\.]/g, '').trim();
    const alumno = await queryOne(
      `SELECT id FROM alumnos
       WHERE REPLACE(REPLACE(dni_apoderado, ' ', ''), '-', '') = $1
          OR REPLACE(REPLACE(dni_alumno, ' ', ''), '-', '') = $1
       LIMIT 1`,
      [dniNorm]
    );
    if (!alumno) return res.status(404).json({ error: 'DNI no registrado' });

    const vc = await queryOne(
      'SELECT id FROM verification_codes WHERE alumno_id = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()',
      [alumno.id, code]
    );

    if (!vc) {
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error verificando código:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/auth/crear-password — Crear contraseña (solo si no tiene una) y auto-login
router.post('/crear-password', async (req, res) => {
  try {
    const { dni, password } = req.body;
    if (!dni || !password) {
      return res.status(400).json({ error: 'DNI y contraseña requeridos' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    if (!checkRateLimit(dni)) {
      return res.status(429).json({ error: 'Demasiados intentos. Espera 15 minutos.' });
    }

    const dniNorm = String(dni).replace(/[\s\-\.]/g, '').trim();
    const alumno = await queryOne(
      `SELECT id, password_hash FROM alumnos
       WHERE REPLACE(REPLACE(dni_apoderado, ' ', ''), '-', '') = $1
          OR REPLACE(REPLACE(dni_alumno, ' ', ''), '-', '') = $1
       LIMIT 1`,
      [dniNorm]
    );
    if (!alumno) return res.status(404).json({ error: 'DNI no registrado' });

    // Solo permite crear si NO tiene contraseña aún
    if (alumno.password_hash) {
      return res.status(400).json({ error: 'Ya tienes contraseña. Usa el login normal.' });
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE alumnos SET password_hash = $1 WHERE id = $2', [hash, alumno.id]);

    const token = signToken(alumno.id, dni);
    const perfil = await cargarPerfil(alumno.id);

    console.log(`[AUTH] Contraseña creada para DNI ${dni}, alumno_id=${alumno.id}`);

    res.json({ success: true, token, perfil });
  } catch (err) {
    console.error('Error creando contraseña:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/auth/me — Perfil del usuario autenticado
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const perfil = await cargarPerfil(req.user.alumno_id);
    if (!perfil) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }
    res.json(perfil);
  } catch (err) {
    console.error('Error en /me:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/auth/congelar — Solicitar congelamiento de membresía
router.post('/congelar', authMiddleware, async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, dias, motivo } = req.body;
    if (!fecha_inicio || !fecha_fin || !dias) {
      return res.status(400).json({ error: 'Fechas y días requeridos' });
    }

    // Verificar que no tenga un congelamiento activo
    const activo = await queryOne(
      "SELECT id FROM congelamientos WHERE alumno_id = $1 AND estado = 'activo'",
      [req.user.alumno_id]
    );
    if (activo) {
      return res.status(400).json({ error: 'Ya tienes un congelamiento activo' });
    }

    await pool.query(
      'INSERT INTO congelamientos (alumno_id, fecha_inicio, fecha_fin, dias, motivo, estado) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.alumno_id, fecha_inicio, fecha_fin, dias, motivo || 'Solicitud del apoderado', 'activo']
    );

    console.log(`[AUTH] Congelamiento creado: alumno_id=${req.user.alumno_id}, ${fecha_inicio} → ${fecha_fin}, ${dias} días`);
    res.json({ success: true });
  } catch (err) {
    console.error('Error congelando:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/auth/mensajes/:id/leido — Marcar mensaje como leído
router.post('/mensajes/:id/leido', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO mensajes_leidos (mensaje_id, alumno_id) VALUES ($1, $2) ON CONFLICT (mensaje_id, alumno_id) DO NOTHING',
      [req.params.id, req.user.alumno_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error marcando mensaje leído:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
