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
      a.codigo_referido,
      a.saldo_bonos,
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

  // Auto-generate referral code if missing
  if (!perfil.codigo_referido) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code;
    for (let attempts = 0; attempts < 5; attempts++) {
      code = 'AMAS-' + Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      try {
        await pool.query('UPDATE alumnos SET codigo_referido = $1 WHERE id = $2', [code, alumnoId]);
        perfil.codigo_referido = code;
        break;
      } catch (e) {
        if (attempts === 4) console.error('Could not generate unique referral code:', e);
      }
    }
  }

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

  // Referidos (students this user referred)
  let referidos_lista = [];
  try {
    referidos_lista = await query(
      `SELECT a.nombre_alumno, r.created_at, r.canjeado
       FROM referidos r JOIN alumnos a ON a.id = r.referido_id
       WHERE r.referidor_id = $1 ORDER BY r.created_at DESC`,
      [alumnoId]
    );
  } catch (_) { /* table may not exist yet */ }

  // Pagos de la inscripción activa (F4)
  let pagos_historial = [];
  let pagos_total = 0;
  if (perfil.inscripcion_id) {
    pagos_historial = await query(
      `SELECT p.id, p.monto, p.fecha, p.tipo, p.metodo_pago, p.observaciones, p.created_at
       FROM pagos p
       WHERE p.inscripcion_id = $1
       ORDER BY p.fecha DESC, p.created_at DESC`,
      [perfil.inscripcion_id]
    );
    const sumaResult = await queryOne(
      'SELECT COALESCE(SUM(monto), 0) AS total FROM pagos WHERE inscripcion_id = $1',
      [perfil.inscripcion_id]
    );
    pagos_total = parseFloat(sumaResult?.total || '0');
  }

  // F9.2 — Program eligibility checks
  const BELT_ORDER = [
    'Blanco', 'Blanco-Amarillo', 'Amarillo', 'Amarillo Camuflado',
    'Naranja', 'Naranja Camuflado', 'Verde', 'Verde Camuflado',
    'Azul', 'Azul Camuflado', 'Rojo', 'Rojo Camuflado', 'Negro',
  ];
  const totalAsistenciasAll = await queryOne(
    "SELECT COUNT(*) AS total FROM asistencias WHERE alumno_id = $1 AND asistio = 'Sí'",
    [alumnoId]
  );
  const asistenciasCount = parseInt(totalAsistenciasAll?.total || '0');
  const elegible_leadership = asistenciasCount >= 8;

  const cinturon = cinturonActual?.cinturon_actual || 'Blanco';
  const beltIndex = BELT_ORDER.indexOf(cinturon);
  const amarilloCamuIndex = BELT_ORDER.indexOf('Amarillo Camuflado');
  let edadAnios = 0;
  if (perfil.fecha_nacimiento) {
    const nacimiento = new Date(perfil.fecha_nacimiento);
    const hoy = new Date();
    edadAnios = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edadAnios--;
  }
  const elegible_fighter = asistenciasCount >= 24 && beltIndex >= amarilloCamuIndex && edadAnios >= 3;

  // Torneos donde el alumno está seleccionado
  let torneos_list = [];
  try {
    torneos_list = await query(`
      SELECT ts.id, ts.modalidad, ts.estado, ts.estado_pago,
             tc.nombre AS torneo_nombre, tc.tipo, tc.fecha, tc.lugar, tc.precio
      FROM torneo_selecciones ts
      JOIN torneos_config tc ON tc.id = ts.torneo_id
      WHERE ts.alumno_id = $1 AND tc.activo = TRUE
      ORDER BY tc.fecha DESC
    `, [alumnoId]);
  } catch (_) { /* table may not exist yet */ }

  // Implementos del alumno
  let implementos_list = [];
  try {
    implementos_list = await query(
      `SELECT id, categoria, tipo, talla, precio, fecha_adquisicion, observaciones
       FROM implementos WHERE alumno_id = $1
       ORDER BY created_at DESC`,
      [alumnoId]
    );
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
    progreso_porcentaje: clases_totales > 0 ? Math.min(Math.round((clases_asistidas / clases_totales) * 100), 100) : 0,
    cinturon_actual: cinturonActual?.cinturon_actual || 'Blanco',
    historial_cinturones,
    proxima_graduacion,
    asistencias,
    congelaciones,
    mensajes,
    codigo_referido: perfil.codigo_referido || null,
    saldo_bonos: Number(perfil.saldo_bonos) || 0,
    referidos: referidos_lista,
    pagos_historial,
    pagos_total,
    elegible_leadership,
    elegible_fighter,
    torneos: torneos_list,
    implementos: implementos_list,
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
       WHERE dni_apoderado_norm = $1
          OR dni_alumno_norm = $1
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
       WHERE dni_apoderado_norm = $1
          OR dni_alumno_norm = $1
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
       WHERE dni_apoderado_norm = $1
          OR dni_alumno_norm = $1
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
       WHERE dni_apoderado_norm = $1
          OR dni_alumno_norm = $1
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

// PUT /api/auth/perfil — Editar info del apoderado
router.put('/perfil', authMiddleware, async (req, res) => {
  try {
    const { nombre_apoderado, dni_apoderado, correo, telefono, direccion } = req.body;
    const alumnoId = req.user.alumno_id;

    const sets = [];
    const values = [];
    let idx = 1;

    if (nombre_apoderado !== undefined) { sets.push(`nombre_apoderado = $${idx++}`); values.push(nombre_apoderado); }
    if (dni_apoderado !== undefined) { sets.push(`dni_apoderado = $${idx++}`); values.push(dni_apoderado); }
    if (correo !== undefined) { sets.push(`correo = $${idx++}`); values.push(correo); }
    if (telefono !== undefined) { sets.push(`telefono = $${idx++}`); values.push(telefono); }
    if (direccion !== undefined) { sets.push(`direccion = $${idx++}`); values.push(direccion); }

    if (sets.length === 0) {
      return res.status(400).json({ error: 'No hay datos para actualizar' });
    }

    values.push(alumnoId);
    await pool.query(
      `UPDATE alumnos SET ${sets.join(', ')} WHERE id = $${idx}`,
      values
    );

    const perfil = await cargarPerfil(alumnoId);
    res.json({ success: true, perfil });
  } catch (err) {
    console.error('Error actualizando perfil:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
