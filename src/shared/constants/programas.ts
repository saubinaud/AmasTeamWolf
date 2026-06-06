// ========== PROGRAMAS Y PRECIOS ==========

/** Clases por programa */
export const PROGRAMA_CLASES: Record<string, number> = {
  "1mes": 8,
  "full": 24,
  "6meses": 48,
  "12meses_sin": 96,
  "12meses_con": 96
};

/** Precios base por programa (en soles) */
export const PRECIOS_BASE: Record<string, number> = {
  "1mes": 330,
  "full": 869,
  "6meses": 1699,
  "12meses_sin": 2999,
  "12meses_con": 3699
};

/** Nombres de programas para mostrar en UI */
export const NOMBRES_PROGRAMA: Record<string, string> = {
  "1mes": "1 Mes",
  "full": "3 Meses Full (2 veces x semana)",
  "6meses": "6 Meses Full (2 veces x semana)",
  "12meses_sin": "12 Meses Full (Sin Implementos)",
  "12meses_con": "WOLF ELITE 365"
};
