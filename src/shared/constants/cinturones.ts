// ========== CINTURONES ==========
//
// La fuente es el API: GET /api/config/cinturones (Space ▸ Ajustes ▸ Cinturones),
// leída con hooks/useCinturones.ts. Lo de este archivo es SOLO RESPALDO: lo que
// se pinta si el API no responde, y los nombres de las imágenes de
// public/cinturones/ (NodoClase), que se dibujaron con este orden.

/** RESPALDO: orden histórico de los 33 cinturones (de menor a mayor). */
export const BELT_ORDER = [
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

/** Tipo para cinturones del respaldo */
export type Belt = typeof BELT_ORDER[number];

/** Lo que hace falta para dibujar un cinturón (mismas columnas que el API). */
export interface DibujoCinturon {
  color_base: string;
  base_camuflada: boolean;
  color_tira: string | null;
  color_tira_2: string | null;
  grosor_tira: 'ninguna' | 'delgada' | 'gruesa';
  tira_camuflada: boolean;
  grados: number;
}

// RESPALDO: paleta con la que se rellenó la tabla (migración 015 del API)
const PALETA_RESPALDO: Record<string, string> = {
  blanco: '#FFFFFF', amarillo: '#EAB308', amarilla: '#EAB308', naranja: '#F97316',
  verde: '#22C55E', azul: '#3B82F6', rojo: '#EF4444', roja: '#EF4444', negro: '#1C1917',
  violeta: '#8B5CF6', 'marrón': '#8B6914', marron: '#8B6914', dorada: '#D4AF37', camuflada: '#4A7C59',
};

/** RESPALDO: dibujo deducido del nombre, solo si el API no respondió. */
export function dibujoRespaldo(nombre: string): DibujoCinturon {
  const n = (nombre || 'Blanco').toLowerCase().trim();
  const d: DibujoCinturon = {
    color_base: '#FFFFFF', base_camuflada: false, color_tira: null, color_tira_2: null,
    grosor_tira: 'ninguna', tira_camuflada: false, grados: 0,
  };
  const dan = n.match(/^negro\s+(\d+)\s+dan$/);
  if (dan) return { ...d, color_base: PALETA_RESPALDO.negro, grados: +dan[1] };
  const camo = n.match(/^(\S+)\s+camuflado$/);
  if (camo) return { ...d, color_base: PALETA_RESPALDO[camo[1]] ?? '#FFFFFF', base_camuflada: true };
  const tira = n.match(/^blanco\s+con\s+tira\s+(.+?)(?:\s+(delgada|gruesa))?$/);
  if (tira) {
    const [c1, c2] = tira[1].trim().split(/\s+/);
    return {
      ...d,
      color_tira: PALETA_RESPALDO[c1] ?? '#D4AF37',
      color_tira_2: c2 ? PALETA_RESPALDO[c2] ?? null : null,
      grosor_tira: (tira[2] as 'delgada' | 'gruesa') ?? 'delgada',
      tira_camuflada: c1 === 'camuflada',
    };
  }
  return { ...d, color_base: PALETA_RESPALDO[n] ?? '#FFFFFF' };
}
