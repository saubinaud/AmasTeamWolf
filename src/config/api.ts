// URL base del API backend de AMAS
const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_BASE = isDev
  ? '/api'
  : 'https://amas-api.s6hx3x.easypanel.host/api';
