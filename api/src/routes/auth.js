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
      a.fecha_nacimiento,
      a.categoria,
      a.nombre_apoderado,
      a.dni_apoderado,
      a.correo AS apoderado_correo,
      a.telefono AS apoderado_telefono,
      a.direccion,
      a.estado,
      i.programa,
      i.fecha_inicio,
      i.fecha_fin,
      i.estado AS estado_inscripcion,
      i.estado_pago,
      i.precio_programa,
      i.precio_pagado,
      i.descuento,
      i.dias_tentativos,
      i.turno,
      t.talla_uniforme,
      t.talla_polo
    FROM alumnos a
    LEFT JOIN inscripciones i ON i.alumno_id = a.id AND i.estado = 'Activo'
    LEFT JOIN tallas t ON t.alumno_id = a.id
    WHERE a.id = $1
    ORDER BY i.fecha_inscripcion DESC
    LIMIT 1
  `, [alumnoId]);

  if (!perfil) return null;

  const asistencias = await query(`
    SELECT fecha, hora, turno, asistio
    FROM asistencias WHERE alumno_id = $1
    ORDER BY fecha DESC, hora DESC LIMIT 20
  `, [alumnoId]);

  return {
    ...perfil,
    apoderado_nombre: perfil.nombre_apoderado,
    alumno_nombre: perfil.nombre_alumno,
    alumno_dni: perfil.dni_alumno,
    asistencias,
    congelaciones: [],
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

    // Buscar alumno por DNI del apoderado
    const alumno = await queryOne(
      'SELECT id, password_hash, nombre_apoderado, correo FROM alumnos WHERE dni_apoderado = $1 LIMIT 1',
      [dni]
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

    const alumno = await queryOne(
      'SELECT id, correo, nombre_apoderado FROM alumnos WHERE dni_apoderado = $1 LIMIT 1',
      [dni]
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

    const alumno = await queryOne(
      'SELECT id FROM alumnos WHERE dni_apoderado = $1 LIMIT 1',
      [dni]
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

// POST /api/auth/crear-password — Crear contraseña y auto-login
router.post('/crear-password', async (req, res) => {
  try {
    const { dni, code, password } = req.body;
    if (!dni || !code || !password) {
      return res.status(400).json({ error: 'DNI, código y contraseña requeridos' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const alumno = await queryOne(
      'SELECT id FROM alumnos WHERE dni_apoderado = $1 LIMIT 1',
      [dni]
    );
    if (!alumno) return res.status(404).json({ error: 'DNI no registrado' });

    // Verificar código
    const vc = await queryOne(
      'SELECT id FROM verification_codes WHERE alumno_id = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()',
      [alumno.id, code]
    );
    if (!vc) {
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    // Hash y guardar contraseña
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE alumnos SET password_hash = $1 WHERE id = $2', [hash, alumno.id]);

    // Marcar código como usado
    await pool.query('UPDATE verification_codes SET used = TRUE WHERE id = $1', [vc.id]);

    // Auto-login
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

module.exports = router;
