const { getPool } = require('../db');

/**
 * Middleware: lee header X-Academia y asigna el pool correcto a req.
 *
 * Uso en rutas Space:
 *   app.use('/api/space', academiaSwitch, spaceAuth, ...)
 *
 * Todas las rutas que usen req.academiaPool tendrán la BD correcta.
 * Si no viene header, default = 'amas'.
 */
function academiaSwitch(req, _res, next) {
  const header = req.headers['x-academia'] || 'amas';
  const academia = header === 'dk' ? 'dk' : 'amas';

  req.academia = academia;
  req.academiaPool = getPool(academia);

  next();
}

module.exports = { academiaSwitch };
