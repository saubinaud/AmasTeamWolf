// ========== CINTURONES ==========

/**
 * Orden de cinturones de menor a mayor rango.
 * Fuente de verdad: tabla `cinturones` en BD (33 rangos). Debe coincidir con
 * BELT_PROGRESSION en src/components/perfil/utils.ts.
 */
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

/** Tipo para cinturones válidos */
export type Belt = typeof BELT_ORDER[number];
