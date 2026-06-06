// ========== CINTURONES ==========

/** Orden de cinturones de menor a mayor rango */
export const BELT_ORDER = [
  'Blanco',
  'Blanco-Amarillo',
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
  'Negro',
] as const;

/** Tipo para cinturones válidos */
export type Belt = typeof BELT_ORDER[number];
