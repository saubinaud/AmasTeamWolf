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

// Programas y precios
export {
  PROGRAMA_CLASES,
  PRECIOS_BASE,
  NOMBRES_PROGRAMA,
} from './programas';

// Códigos promocionales
export {
  CODIGOS_PROMOCIONALES,
} from './promociones';
export type { CodigoPromocional, TipoPromocion } from './promociones';

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
