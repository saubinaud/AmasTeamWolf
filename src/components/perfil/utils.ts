import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { API_BASE } from '../../config/api';

// ── Date formatting ──
// 'YYYY-MM-DD' se lee como fecha local (new Date('2026-11-16') sería medianoche UTC:
// en Lima, el día anterior).
export function formatDate(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return "";
  try {
    const date = typeof dateStr === "string"
      ? (/^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? new Date(`${dateStr}T12:00:00`) : new Date(dateStr))
      : dateStr;
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

// ── API ──
export function getApiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

/** fetch al API con la sesión de la familia; devuelve el JSON (o {}) y el status. */
export async function pedirApi<T = any>(path: string, init: { method?: string; body?: unknown } = {}): Promise<{ ok: boolean; status: number; data: T }> {
  const token = localStorage.getItem('amasToken');
  const res = await fetch(getApiUrl(path), {
    method: init.method || 'GET',
    headers: {
      ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data: data as T };
}

// ── Plan: lo que dice el API (v_plan_alumno), sin recalcular en el navegador ──
export interface EstadoPlanVista {
  /** 'Vigente' | 'Por vencer' | 'Vencido' | 'Congelado' | 'Por empezar' | 'Sin fecha' | 'Sin plan' */
  etiqueta: string;
  tono: 'ok' | 'aviso' | 'vencido' | 'congelado' | 'neutro';
  vencido: boolean;
  porVencer: boolean;
  /** Días que faltan para el fin (null si el plan no tiene fecha de fin) */
  diasParaVencer: number | null;
  /** Días desde que venció (null si no venció) */
  diasDesdeVencimiento: number | null;
  sinPlan: boolean;
}

export function estadoDelPlan(user: any): EstadoPlanVista {
  const m = user?.matricula;
  const etiqueta: string = m?.estadoPlan || 'Sin plan';
  const vencido = etiqueta === 'Vencido';
  const porVencer = etiqueta === 'Por vencer';
  return {
    etiqueta,
    tono: vencido ? 'vencido' : porVencer ? 'aviso' : etiqueta === 'Congelado' ? 'congelado' : etiqueta === 'Vigente' ? 'ok' : 'neutro',
    vencido,
    porVencer,
    diasParaVencer: typeof m?.diasParaVencer === 'number' ? m.diasParaVencer : null,
    diasDesdeVencimiento: typeof m?.diasDesdeVencimiento === 'number' ? m.diasDesdeVencimiento : null,
    sinPlan: !m?.estadoPlan,
  };
}

/** Asistió o llegó tarde: las dos cuentan como clase tomada (v_plan_alumno). */
export const cuentaComoClase = (estado: string | undefined) => estado === 'asistio' || estado === 'tardanza';

/** Días de la semana (0 = domingo, como Postgres) */
export const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Cinturones: colores, progresión y dibujo salen de hooks/useCinturones (API).

// Darken a hex color
export function darkenHex(hex: string, amount: number) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  const f = 1 - amount;
  return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
}

// ── Belt SVG Display component ──
let beltIdCounter = 0;

export function useBeltId() {
  const [uid] = useState(() => `belt-${++beltIdCounter}`);
  return uid;
}

/** "Lun y Mié · 16:00–17:00 · Little Wolf" (una línea del horario del alumno) */
export function textoLineaHorario(l: { dias: number[]; horaInicio: string; horaFin: string | null; clase: string | null }): string {
  const dias = l.dias.map((d) => DIAS_SEMANA[d]?.slice(0, 3)).filter(Boolean);
  const listaDias = dias.length > 1 ? `${dias.slice(0, -1).join(', ')} y ${dias[dias.length - 1]}` : dias[0] || '';
  const horas = l.horaFin ? `${l.horaInicio}–${l.horaFin}` : l.horaInicio;
  return [listaDias, horas, l.clase].filter(Boolean).join(' · ');
}
