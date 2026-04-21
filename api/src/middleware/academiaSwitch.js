const { academiaStore } = require('../db');

/**
 * Middleware: lee header X-Academia y establece el contexto de academia.
 *
 * Usa AsyncLocalStorage para que query()/queryOne() del db.js
 * automáticamente usen el pool correcto — sin modificar los route handlers.
 *
 * Si no viene header, default = 'amas'.
 */
function academiaSwitch(req, res, next) {
  const header = req.headers['x-academia'] || 'amas';
  const academia = header === 'dk' ? 'dk' : 'amas';

  req.academia = academia;

  // Auth routes always use AMAS pool (space_usuarios is only in AMAS DB)
  const isAuthRoute = req.path.startsWith('/auth');
  const effectiveAcademia = isAuthRoute ? 'amas' : academia;

  // Run the rest of the request inside the AsyncLocalStorage context
  academiaStore.run({ academia: effectiveAcademia }, () => {
    next();
  });
}

module.exports = { academiaSwitch };
