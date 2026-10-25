// ========== RESPALDO DE PROGRAMAS Y PRECIOS ==========
// La fuente única es el catálogo del API (GET /api/config/catalogo) y el total
// lo calcula POST /api/config/cotizar. Estos valores SOLO se usan si el API no
// responde, para que la página no quede vacía: se muestran como referenciales
// y el formulario no deja enviar sin una cotización del servidor.
// Ver utils/catalogo.ts → catalogoRespaldo().

/** Clases por programa (respaldo) */
export const PROGRAMA_CLASES: Record<string, number> = {
  "1mes": 8,
  "full": 24,
  "6meses": 48,
  "12meses_sin": 96,
  "12meses_con": 96
};

/** Precios base por programa en soles (respaldo) */
export const PRECIOS_BASE: Record<string, number> = {
  "1mes": 330,
  "full": 869,
  "6meses": 1699,
  "12meses_sin": 2999,
  "12meses_con": 3699
};

/** Nombres de programas (respaldo; los reales vienen del catálogo) */
export const NOMBRES_PROGRAMA: Record<string, string> = {
  "1mes": "1 Mes",
  "full": "3 Meses Full",
  "6meses": "6 Meses",
  "12meses_sin": "12 Meses Full (Sin Implementos)",
  "12meses_con": "WOLF ELITE 365"
};

/** Polo, paquetes de polos y uniforme (respaldo) */
export const RESPALDO_ROPA: { tipo: 'ropa' | 'paquete'; codigo: string | null; nombre: string; categoria: string; precio: number }[] = [
  { tipo: 'ropa', codigo: null, nombre: 'Polo Team Wolf', categoria: 'polo', precio: 60 },
  { tipo: 'paquete', codigo: 'pack-2-polos', nombre: '2 Polos', categoria: 'polo', precio: 110 },
  { tipo: 'paquete', codigo: 'pack-3-polos', nombre: '3 Polos', categoria: 'polo', precio: 150 },
  { tipo: 'ropa', codigo: null, nombre: 'Uniforme Completo', categoria: 'uniforme', precio: 220 },
];
