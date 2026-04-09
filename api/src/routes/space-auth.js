const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { queryOne } = require('../db');
const { spaceAuth, JWT_SECRET } = require('../middleware/spaceAuth');

const router = express.Router();

// Login attempt rate limiting (in-memory, per email)
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkLoginRateLimit(email) {
  const key = email.toLowerCase();
  const attempts = loginAttempts.get(key);
  if (!attempts) return null;
  if (attempts.count >= MAX_LOGIN_ATTEMPTS && Date.now() - attempts.firstAttempt < LOGIN_WINDOW_MS) {
    return 'Demasiados intentos. Espera 15 minutos.';
  }
  // Window expired, reset
  if (Date.now() - attempts.firstAttempt >= LOGIN_WINDOW_MS) {
    loginAttempts.delete(key);
  }
  return null;
}

function recordLoginFailure(email) {
  const key = email.toLowerCase();
  const attempts = loginAttempts.get(key) || { count: 0, firstAttempt: Date.now() };
  attempts.count += 1;
  loginAttempts.set(key, attempts);
}

function resetLoginAttempts(email) {
  loginAttempts.delete(email.toLowerCase());
}

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email y contraseña son requeridos', code: 'LOGIN_MISSING_FIELDS' });
    }

    // Rate limit check
    const rateLimitError = checkLoginRateLimit(email);
    if (rateLimitError) {
      console.warn(`[SPACE-AUTH] Login rate limited: ${email} at ${new Date().toISOString()}`);
      return res.status(429).json({ success: false, error: rateLimitError, code: 'LOGIN_RATE_LIMITED' });
    }

    const usuario = await queryOne(
      'SELECT * FROM space_usuarios WHERE email = $1 AND activo = true',
      [email]
    );

    if (!usuario) {
      recordLoginFailure(email);
      console.warn(`[SPACE-AUTH] Login failed (user not found): ${email} at ${new Date().toISOString()}`);
      return res.status(401).json({ success: false, error: 'Credenciales incorrectas', code: 'LOGIN_INVALID' });
    }

    const passwordValid = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValid) {
      recordLoginFailure(email);
      console.warn(`[SPACE-AUTH] Login failed (bad password): ${email} at ${new Date().toISOString()}`);
      return res.status(401).json({ success: false, error: 'Credenciales incorrectas', code: 'LOGIN_INVALID' });
    }

    // Success: reset rate limit counter
    resetLoginAttempts(email);

    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update ultimo_login (fire and forget)
    queryOne(
      'UPDATE space_usuarios SET ultimo_login = NOW() WHERE id = $1',
      [usuario.id]
    ).catch(() => {});

    console.log(`[SPACE-AUTH] Login success: ${email} (id=${usuario.id}) at ${new Date().toISOString()}`);

    return res.json({
      success: true,
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({ success: false, error: 'Error interno del servidor', code: 'LOGIN_SERVER_ERROR' });
  }
});

// POST /logout
router.post('/logout', (_req, res) => {
  return res.json({ success: true, message: 'Sesión cerrada' });
});

// GET /me
router.get('/me', spaceAuth, (req, res) => {
  return res.json({ success: true, usuario: req.spaceUser });
});

module.exports = router;
