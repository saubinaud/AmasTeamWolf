const jwt = require('jsonwebtoken');
const { queryOne } = require('../db');

const JWT_SECRET = process.env.SPACE_JWT_SECRET || 'amas-space-secret-2026';

async function spaceAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const usuario = await queryOne(
      'SELECT id, nombre, email, rol FROM space_usuarios WHERE id = $1 AND activo = true',
      [decoded.id]
    );

    if (!usuario) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }

    req.spaceUser = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    };

    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.spaceUser || req.spaceUser.rol !== 'admin') {
    return res.status(403).json({ success: false, error: 'Acceso denegado: se requiere rol admin' });
  }
  next();
}

module.exports = { spaceAuth, requireAdmin, JWT_SECRET };
