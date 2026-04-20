const jwt = require('jsonwebtoken');
const { queryOne } = require('../db');

const JWT_SECRET = process.env.SPACE_JWT_SECRET || 'amas-space-secret-2026';

// In-memory user cache to avoid DB hit on every authenticated request
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function clearUserCache(userId) {
  if (userId) {
    userCache.delete(userId);
  } else {
    userCache.clear();
  }
}

async function spaceAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No autorizado', code: 'AUTH_NO_TOKEN' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check cache first
    const cached = userCache.get(decoded.id);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      req.spaceUser = cached.user;
      return next();
    }

    // Verify user is still active in DB (include academias_acceso)
    const usuario = await queryOne(
      'SELECT id, nombre, email, rol, academias_acceso FROM space_usuarios WHERE id = $1 AND activo = true',
      [decoded.id]
    );

    if (!usuario) {
      userCache.delete(decoded.id);
      return res.status(401).json({ success: false, error: 'No autorizado', code: 'AUTH_USER_INACTIVE' });
    }

    const user = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      academias: usuario.academias_acceso || ['amas'],
    };

    // Cache the user lookup
    userCache.set(usuario.id, { user, timestamp: Date.now() });

    req.spaceUser = user;
    next();
  } catch (err) {
    const code = err.name === 'TokenExpiredError' ? 'AUTH_TOKEN_EXPIRED' : 'AUTH_INVALID_TOKEN';
    return res.status(401).json({ success: false, error: 'No autorizado', code });
  }
}

function requireAdmin(req, res, next) {
  if (!req.spaceUser || req.spaceUser.rol !== 'admin') {
    return res.status(403).json({ success: false, error: 'Acceso denegado: se requiere rol admin', code: 'AUTH_ADMIN_REQUIRED' });
  }
  next();
}

// Request logging middleware for /api/space/* routes
function spaceRequestLogger(req, res, next) {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = req.spaceUser ? req.spaceUser.id : 'anon';
    const status = res.statusCode;
    const academia = req.academia || 'amas';
    console.log(`[SPACE] ${method} ${originalUrl} | user=${userId} | ${academia} | ${status} | ${duration}ms`);
  });

  next();
}

module.exports = { spaceAuth, requireAdmin, JWT_SECRET, clearUserCache, spaceRequestLogger };
