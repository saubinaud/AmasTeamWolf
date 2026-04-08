const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { queryOne } = require('../db');
const { spaceAuth, JWT_SECRET } = require('../middleware/spaceAuth');

const router = express.Router();

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email y contraseña son requeridos' });
    }

    const usuario = await queryOne(
      'SELECT * FROM space_usuarios WHERE email = $1 AND activo = true',
      [email]
    );

    if (!usuario) {
      return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
    }

    const passwordValid = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
    }

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
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
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
