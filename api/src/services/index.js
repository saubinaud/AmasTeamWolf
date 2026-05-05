const AlumnoService = require('./AlumnoService');
const InscripcionService = require('./InscripcionService');
const AsistenciaService = require('./AsistenciaService');
const errors = require('./errors');

module.exports = {
  AlumnoService,
  InscripcionService,
  AsistenciaService,
  ...errors,
};
