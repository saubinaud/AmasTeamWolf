// Acceso a los paneles con PIN (asistencia, marcador) y a la consulta del padrón.
// El PIN lo comprueba el API (POST /api/panel/acceso) y devuelve un token corto
// que se guarda en esta pestaña y viaja en cada pedido. El PIN ya no está en el
// código de la web: este repositorio es público.
import { API_BASE } from '../config/api';

export type Panel = 'asistencia' | 'marcador' | 'padron';

const clave = (panel: Panel) => `amas_panel_token_${panel}`;

export function tokenPanel(panel: Panel): string | null {
  try { return sessionStorage.getItem(clave(panel)); } catch { return null; }
}

export function guardarTokenPanel(panel: Panel, token: string) {
  try { sessionStorage.setItem(clave(panel), token); } catch { /* modo privado */ }
}

export function olvidarTokenPanel(panel: Panel) {
  try { sessionStorage.removeItem(clave(panel)); } catch { /* modo privado */ }
}

/** Pide el token con el PIN. Devuelve el token o el mensaje de error del API. */
export async function entrarConPin(panel: 'asistencia' | 'marcador', pin: string): Promise<{ token?: string; error?: string }> {
  try {
    const r = await fetch(`${API_BASE}/panel/acceso`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ panel, pin }),
    });
    const d = await r.json().catch(() => null);
    if (r.ok && d?.data?.token) {
      guardarTokenPanel(panel, d.data.token);
      return { token: d.data.token };
    }
    return { error: d?.error || 'PIN incorrecto' };
  } catch {
    return { error: 'Error de conexión' };
  }
}

/**
 * fetch con el token del panel. Si el API responde 401 (token vencido o
 * ausente), lo olvida y avisa con `alVencer` para volver a pedir el PIN.
 */
export async function fetchPanel(panel: Panel, url: string, init: RequestInit = {}, alVencer?: () => void): Promise<Response> {
  const t = tokenPanel(panel);
  const headers: Record<string, string> = { ...(init.headers as Record<string, string> || {}) };
  if (t) headers.Authorization = `Bearer ${t}`;
  const r = await fetch(url, { ...init, headers });
  if (r.status === 401) {
    olvidarTokenPanel(panel);
    alVencer?.();
  }
  return r;
}
