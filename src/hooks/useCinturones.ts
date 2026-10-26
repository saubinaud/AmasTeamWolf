// Cinturones del API (GET /api/config/cinturones?todos=1): orden de la
// progresión y cómo se dibuja cada uno. Se configuran en Space ▸ Ajustes ▸
// Cinturones. Si el API no responde, se usa el respaldo de
// shared/constants/cinturones.ts.
import { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../config/api';
import { BELT_ORDER, dibujoRespaldo, type DibujoCinturon } from '../shared/constants/cinturones';

export interface CinturonPublico extends DibujoCinturon {
  id: number;
  nombre: string;
  orden: number;
  etapa: 'infantil' | 'colores' | 'dan';
  activo: boolean;
}

// Una sola petición por visita, compartida entre componentes
let pendiente: Promise<CinturonPublico[]> | null = null;
let cache: CinturonPublico[] | null = null;

function pedirCinturones(): Promise<CinturonPublico[]> {
  if (!pendiente) {
    pendiente = fetch(`${API_BASE}/config/cinturones?todos=1`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { data: CinturonPublico[] }) => {
        if (!Array.isArray(j.data) || j.data.length === 0) throw new Error('sin cinturones');
        cache = j.data;
        return j.data;
      })
      .catch((e) => {
        pendiente = null; // que la próxima visita lo intente de nuevo
        throw e;
      });
  }
  return pendiente;
}

/** RESPALDO: la lista histórica, dibujada desde el nombre. */
const respaldo = (): CinturonPublico[] => BELT_ORDER.map((nombre, i) => ({
  id: -(i + 1), nombre, orden: i + 1, activo: true,
  etapa: i < 20 ? 'infantil' : nombre.startsWith('Negro') ? 'dan' : 'colores',
  ...dibujoRespaldo(nombre),
}));

/** Color que representa al cinturón en un punto o un borde: la tira si hay, si no la base. */
export const colorDe = (d: DibujoCinturon) => (d.grosor_tira !== 'ninguna' && d.color_tira) || d.color_base;

export function useCinturones() {
  const [todos, setTodos] = useState<CinturonPublico[]>(() => cache ?? respaldo());
  const [estado, setEstado] = useState<'cargando' | 'ok' | 'respaldo'>(cache ? 'ok' : 'cargando');

  useEffect(() => {
    if (cache) return;
    let vigente = true;
    pedirCinturones()
      .then((data) => { if (vigente) { setTodos(data); setEstado('ok'); } })
      .catch(() => { if (vigente) setEstado('respaldo'); });
    return () => { vigente = false; };
  }, []);

  return useMemo(() => {
    const porNombre = new Map(todos.map((c) => [c.nombre, c]));
    const activos = todos.filter((c) => c.activo).sort((a, b) => a.orden - b.orden);
    const dibujo = (nombre: string | null | undefined): DibujoCinturon =>
      porNombre.get(nombre || 'Blanco') ?? dibujoRespaldo(nombre || 'Blanco');
    const color = (nombre: string | null | undefined) => colorDe(dibujo(nombre));
    /** El que sigue en la progresión (solo activos), o null si es el último. */
    const siguiente = (nombre: string) => {
      const i = activos.findIndex((c) => c.nombre === nombre);
      const s = i >= 0 ? activos[i + 1] : undefined;
      return s ? { name: s.nombre, color: colorDe(s) } : null;
    };
    /** Avance en la progresión, de 0 a 100. */
    const progreso = (nombre: string) => {
      const i = activos.findIndex((c) => c.nombre === nombre);
      return i >= 0 && activos.length > 1 ? Math.round((i / (activos.length - 1)) * 100) : 0;
    };
    return { cinturones: activos, estado, dibujo, color, siguiente, progreso };
  }, [todos, estado]);
}
