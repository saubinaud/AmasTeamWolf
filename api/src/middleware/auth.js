const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'amas-wolf-secret-change-in-production';

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { alumno_id: payload.alumno_id, dni: payload.dni };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sesión expirada' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function signToken(alumno_id, dni) {
  return jwt.sign({ alumno_id, dni }, JWT_SECRET, { expiresIn: '12h' });
}

module.exports = { authMiddleware, signToken, JWT_SECRET };
