// ========== SHARED CONSTANTS ==========
// Re-exports centralizados de todas las constantes compartidas

// Feriados y utilidades de fechas
export {
  FERIADOS_FIJOS_PERU,
  FERIADOS_MOVILES,
  esFeriado,
  esCierreVacacionalAMAS,
  isDiaHabil,
} from './feriados';
export type { FeriadoFijo, FeriadoMovil } from './feriados';

// Programas y precios: solo en el catálogo del API (utils/catalogo.ts).

// Los códigos promocionales viven en el API (tabla promociones): se validan cotizando.

// Cinturones
export {
  BELT_ORDER,
} from './cinturones';
export type { Belt } from './cinturones';

// Clases
export {
  CLASES_VALIDAS,
} from './clases';
export type { ClaseValida } from './clases';
