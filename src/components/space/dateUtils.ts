// ============================================================================
// Date utilities — SIEMPRE usar America/Lima (GMT-5)
// ============================================================================
//
// REGLA CRÍTICA: La academia está en Lima, Perú. Todas las fechas y horas
// que se muestran al usuario DEBEN renderizarse en la zona horaria de Lima,
// independientemente del navegador del cliente o del servidor.
//
// El servidor PostgreSQL ya está en America/Lima y el contenedor Node también
// (TZ=America/Lima). Pero cuando el backend serializa un timestamp a JSON,
// lo hace como ISO UTC (ej. "2026-04-09T22:32:57.804Z" para las 17:32 Lima).
//
// Si el frontend hace `new Date(iso).toLocaleDateString('es-PE')`, el
// resultado depende de la zona horaria del NAVEGADOR. Esto rompe cuando
// alguien usa el panel desde una VPN o un equipo mal configurado.
//
// SIEMPRE usar estos helpers en vez de `toLocaleDateString/toLocaleTimeString`
// directamente. Todos fuerzan `timeZone: 'America/Lima'`.
// ============================================================================

export const LIMA_TZ = 'America/Lima';
const LOCALE = 'es-PE';

/** Formato corto: "09 abr 2026" */
export function formatFecha(iso: string | Date | undefined | null): string {
  if (!iso) return '—';
  try {
    const d = iso instanceof Date ? iso : new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString(LOCALE, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: LIMA_TZ,
    });
  } catch {
    return String(iso);
  }
}

/** Formato más corto: "09 abr" */
export function formatFechaCorta(iso: string | Date | undefined | null): string {
  if (!iso) return '—';
  try {
    const d = iso instanceof Date ? iso : new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString(LOCALE, {
      day: '2-digit',
      month: 'short',
      timeZone: LIMA_TZ,
    });
  } catch {
    return String(iso);
  }
}

/** Formato largo: "jueves 9 de abril de 2026" */
export function formatFechaLarga(iso: string | Date | undefined | null): string {
  if (!iso) return '—';
  try {
    const d = iso instanceof Date ? iso : new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString(LOCALE, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: LIMA_TZ,
    });
  } catch {
    return String(iso);
  }
}

/** Formato hora: "17:32" (24h) */
export function formatHora(hora: string | Date | undefined | null): string {
  if (!hora) return '—';
  try {
    if (typeof hora === 'string') {
      // Si es un timestamp ISO o similar
      if (hora.includes('T') || hora.includes('Z')) {
        return new Date(hora).toLocaleTimeString(LOCALE, {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: LIMA_TZ,
        });
      }
      // Si es solo "HH:MM:SS" o "HH:MM:SS.microseconds"
      const match = hora.match(/^(\d{1,2}):(\d{2})/);
      if (match) return `${match[1].padStart(2, '0')}:${match[2]}`;
      return hora;
    }
    return hora.toLocaleTimeString(LOCALE, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: LIMA_TZ,
    });
  } catch {
    return String(hora);
  }
}

/** Formato fecha + hora: "09 abr 2026, 17:32" */
export function formatFechaHora(iso: string | Date | undefined | null): string {
  if (!iso) return '—';
  try {
    const d = iso instanceof Date ? iso : new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleString(LOCALE, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: LIMA_TZ,
    });
  } catch {
    return String(iso);
  }
}

/** "hace 2 horas" estilo relative time en Lima TZ */
export function formatRelativo(iso: string | Date | undefined | null): string {
  if (!iso) return '—';
  try {
    const d = iso instanceof Date ? iso : new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    const now = Date.now();
    const diff = now - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'hace un momento';
    if (mins < 60) return `hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs} h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `hace ${days} d`;
    return formatFecha(d);
  } catch {
    return String(iso);
  }
}

/** Devuelve el "hoy" en Lima como ISO date string (YYYY-MM-DD) */
export function hoyLima(): string {
  const now = new Date();
  // Convertir a Lima usando toLocaleDateString con formato sv-SE (= ISO)
  return now.toLocaleDateString('sv-SE', { timeZone: LIMA_TZ });
}

/** Nombre del día en español (Lima) */
export function diaSemana(iso: string | Date | undefined | null): string {
  if (!iso) return '—';
  try {
    const d = iso instanceof Date ? iso : new Date(iso);
    return d.toLocaleDateString(LOCALE, { weekday: 'long', timeZone: LIMA_TZ });
  } catch {
    return String(iso);
  }
}
