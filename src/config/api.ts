// URL base del API backend de AMAS
const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_BASE = isDev
  ? '/api'
  : 'https://amas-api.s6hx3x.easypanel.host/api';

/**
 * Helper: fetch con header X-Academia para Space multi-tenant.
 * Uso: spaceFetch('/space/alumnos', token, academia)
 */
export function spaceFetch(
  path: string,
  token: string,
  academia: string = 'amas',
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'X-Academia': academia,
    ...(options.headers as Record<string, string> || {}),
  };
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}
