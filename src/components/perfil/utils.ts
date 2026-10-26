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

// Cinturones: colores, progresión y dibujo salen de hooks/useCinturones (API).

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
