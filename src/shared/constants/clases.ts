// ========== CLASES ==========

/** Categorías de clases válidas en AMAS */
export const CLASES_VALIDAS = [
  'Super Baby Wolf',
  'Baby Wolf',
  'Little Wolf',
  'Junior Wolf',
  'Adolescentes Wolf'
] as const;

/** Tipo para clases válidas */
export type ClaseValida = typeof CLASES_VALIDAS[number];
