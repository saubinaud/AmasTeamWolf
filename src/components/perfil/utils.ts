import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';

// ── Date formatting ──
export function formatDate(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return "";
  try {
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) return String(dateStr);
    return format(date, "dd MMM yyyy", { locale: es });
  } catch {
    return String(dateStr);
  }
}

// ── Title Case ──
export function toTitleCase(str: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/(?:^|\s)\S/g, (match) => match.toUpperCase());
}

// ── Iniciales ──
export function getIniciales(nombre: string) {
  return nombre?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
}

// ── API URL helper ──
export function getApiUrl(path: string): string {
  return (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? `/api${path}`
    : `https://amas-api.s6hx3x.easypanel.host/api${path}`;
}

// ── Belt color resolver — works with all 27 belt names from DB ──
export const BELT_COLORS: Record<string, string> = new Proxy({} as Record<string, string>, {
  get(_target, prop: string) {
    const n = (prop || '').toLowerCase();
    if (n.includes('negro')) return '#1C1917';
    if (n.includes('rojo') && !n.includes('tira')) return '#EF4444';
    if (n.includes('azul') && !n.includes('tira')) return '#3B82F6';
    if (n.includes('verde') && !n.includes('tira')) return '#22C55E';
    if (n.includes('naranja') && !n.includes('tira')) return '#F97316';
    if (n.includes('amarill') && !n.includes('tira')) return '#EAB308';
    if (n.includes('roja') || n.includes('rojo')) return '#EF4444';
    if (n.includes('azul')) return '#3B82F6';
    if (n.includes('verde')) return '#22C55E';
    if (n.includes('naranja')) return '#F97316';
    if (n.includes('amarill')) return '#EAB308';
    if (n.includes('morada') || n.includes('violeta')) return '#8B5CF6';
    if (n.includes('marrón') || n.includes('marron')) return '#8B6914';
    if (n.includes('camuflad')) return '#4A7C59';
    if (n.includes('dorada')) return '#D4AF37';
    return '#FFFFFF';
  },
});

// ── Belt progression (official) ──
export const BELT_PROGRESSION = [
  'Blanco',
  'Blanco con tira dorada',
  'Blanco con tira naranja delgada',
  'Blanco con tira naranja gruesa',
  'Blanco con tira amarilla delgada',
  'Blanco con tira amarilla gruesa',
  'Blanco con tira camuflada delgada',
  'Blanco con tira camuflada gruesa',
  'Blanco con tira verde delgada',
  'Blanco con tira verde gruesa',
  'Blanco con tira violeta delgada',
  'Blanco con tira violeta gruesa',
  'Blanco con tira azul delgada',
  'Blanco con tira azul gruesa',
  'Blanco con tira marrón delgada',
  'Blanco con tira marrón gruesa',
  'Blanco con tira rojo delgada',
  'Blanco con tira roja gruesa',
  'Blanco con tira rojo negro delgada',
  'Blanco con tira rojo negro gruesa',
  'Amarillo',
  'Amarillo Camuflado',
  'Naranja',
  'Naranja Camuflado',
  'Verde',
  'Verde Camuflado',
  'Azul',
  'Azul Camuflado',
  'Rojo',
  'Rojo Camuflado',
  'Negro 1 Dan',
  'Negro 2 Dan',
  'Negro 3 Dan',
] as const;

// ── Belt display parser & colors ──
const STRIPE_COLORS: Record<string, string> = {
  dorada: '#D4AF37', naranja: '#F97316', amarilla: '#EAB308',
  verde: '#22C55E', violeta: '#8B5CF6', azul: '#3B82F6',
  'marrón': '#8B6914', rojo: '#EF4444', roja: '#EF4444',
};
const FULL_COLORS: Record<string, string> = {
  amarillo: '#EAB308', naranja: '#F97316', verde: '#22C55E',
  azul: '#3B82F6', rojo: '#EF4444', negro: '#1C1917',
};

export function parseBeltDisplay(name: string) {
  const n = (name || 'Blanco').toLowerCase().trim();

  // Negro X Dan
  const dan = n.match(/^negro\s+(\d+)\s+dan$/);
  if (dan) return { base: '#1C1917', stripe: null, thick: null as string | null, camo: false, dan: +dan[1], white: false };

  // Full camuflado (Amarillo Camuflado, etc.)
  const fc = n.match(/^(\w+)\s+camuflado$/);
  if (fc) return { base: FULL_COLORS[fc[1]] || '#EAB308', stripe: null, thick: null as string | null, camo: true, dan: 0, white: false };

  // Full color
  if (FULL_COLORS[n]) return { base: FULL_COLORS[n], stripe: null, thick: null as string | null, camo: false, dan: 0, white: false };

  // Blanco con tira {color(s)} {delgada|gruesa}
  const sm = n.match(/^blanco\s+con\s+tira\s+(.+)\s+(delgada|gruesa)$/);
  const smNoThick = !sm ? n.match(/^blanco\s+con\s+tira\s+(.+)$/) : null;
  const colorStr = sm?.[1] || smNoThick?.[1] || null;
  const thickness = sm?.[2] || 'medium';
  if (colorStr) {
    const c = colorStr.trim();
    if (c === 'camuflada') return { base: '#FFFFFF', stripe: null, thick: thickness, camo: true, dan: 0, white: true };
    // "rojo negro" → bicolor stripe (red left + black right)
    if (c === 'rojo negro') return { base: '#FFFFFF', stripe: '#EF4444', thick: thickness, camo: false, dan: 0, white: true, bicolor: '#1C1917' };
    return { base: '#FFFFFF', stripe: STRIPE_COLORS[c] || '#D4AF37', thick: thickness, camo: false, dan: 0, white: true };
  }

  return { base: '#FFFFFF', stripe: null, thick: null as string | null, camo: false, dan: 0, white: true };
}

export function getBeltColor(name: string): string {
  const b = parseBeltDisplay(name);
  return b.stripe || b.base;
}

export function getNextBelt(current: string): { name: string; color: string } | null {
  const idx = BELT_PROGRESSION.indexOf(current as any);
  if (idx === -1 || idx >= BELT_PROGRESSION.length - 1) return null;
  const next = BELT_PROGRESSION[idx + 1];
  return { name: next, color: getBeltColor(next) };
}

// Darken a hex color
export function darkenHex(hex: string, amount: number) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  const f = 1 - amount;
  return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
}

// ── Spanish date parser (for graduation) ──
export function parseSpanishDate(dateStr: string): Date | null {
  const months: { [key: string]: number } = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
  };

  try {
    const parts = dateStr.trim().toLowerCase().split(' ');
    if (parts.length < 2) return null;

    const day = parseInt(parts[0]);
    const monthStr = parts[1];
    const month = months[monthStr];

    if (isNaN(day) || month === undefined) return null;

    const now = new Date();
    let year = now.getFullYear();
    let date = new Date(year, month, day);

    if (date.getTime() < now.getTime() - 30 * 24 * 60 * 60 * 1000) {
      date.setFullYear(year + 1);
    }
    return date;
  } catch (e) {
    console.error("Error parsing date:", dateStr, e);
    return null;
  }
}

// ── Belt SVG Display component ──
let beltIdCounter = 0;

export function useBeltId() {
  const [uid] = useState(() => `belt-${++beltIdCounter}`);
  return uid;
}
