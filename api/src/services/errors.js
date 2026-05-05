class AppError extends Error {
  constructor(message, code, statusHint = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusHint = statusHint;
  }
}
class NotFoundError extends AppError {
  constructor(message = 'No encontrado', code = 'NOT_FOUND') { super(message, code, 404); }
}
class ValidationError extends AppError {
  constructor(message = 'Datos inválidos', code = 'VALIDATION_ERROR') { super(message, code, 400); }
}
class DuplicateError extends AppError {
  constructor(message = 'Registro duplicado', code = 'DUPLICATE', extra = {}) {
    super(message, code, 409);
    this.extra = extra;
  }
}
module.exports = { AppError, NotFoundError, ValidationError, DuplicateError };
