// Catálogo público y cotización: lo que los formularios de matrícula,
// renovación y Leadership leen del API. Ningún precio ni código promocional
// vive aquí; el total siempre lo devuelve POST /api/config/cotizar.
import { PRECIOS_BASE, PROGRAMA_CLASES, NOMBRES_PROGRAMA, RESPALDO_ROPA } from '../shared/constants/programas';

export interface ItemCatalogo {
  id: number;
  tipo: 'programa' | 'implemento' | 'ropa' | 'paquete';
  codigo: string | null;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  precio: number;
  clases: number | null;
  meses: number | null;
  usa_talla: boolean;
  en_inscripcion: boolean;
  en_renovacion: boolean;
  es_adicional: boolean;
  componentes: { item_id: number; cantidad: number }[];
  orden?: number;
  /** Programa adicional: ids de los implementos que trae */
  incluye?: number[];
  /** Programa cuyo uniforme se cobra aparte */
  sin_uniforme?: boolean;
}

export type LineaPedido = { item_id: number; cantidad?: number; talla?: string } | { codigo: string; cantidad?: number };

export interface PedidoCotizacion {
  lineas: LineaPedido[];
  codigo?: string;
  ya_tiene?: number[];
}

export interface LineaCotizada {
  item_id: number;
  codigo: string | null;
  nombre: string;
  tipo: string;
  categoria: string | null;
  clases: number | null;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  descuento: number;
  total: number;
}

export interface Cotizacion {
  ok: boolean;
  errores: string[];
  lineas: LineaCotizada[];
  subtotal: number;
  descuento_promocion: number;
  descuento_manual: number;
  descuento: number;
  total: number;
  clases_extra: number;
  regalos: { item_id: number; nombre: string; categoria: string | null; cantidad: number; valor: number }[];
  desbloquea: string[];
  promocion: { codigo: string | null; nombre: string | null; aplicada: boolean; motivo: string | null };
  implementos_ya_tiene?: { item_id: number; nombre: string; precio: number }[];
}

export type CantidadPolos = '0' | '1' | '2' | '3';
export type Flujo = 'en_inscripcion' | 'en_renovacion' | 'es_adicional';

export const TALLAS = ['2', '4', '6', '8', '10', '12', '14', 'S', 'M', 'L', 'XL'];

/** "S/ 869" o "S/ 815.50": sin decimales cuando son cero. */
export function soles(n: number | null | undefined): string {
  const v = Number(n) || 0;
  return `S/ ${Number.isInteger(v) ? v.toLocaleString('es-PE') : v.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Programas activos para un flujo, más los que desbloquea un código. */
export function programasOfrecidos(items: ItemCatalogo[], flujo: Flujo, desbloqueados: string[] = []) {
  return items
    .filter((i) => i.tipo === 'programa' && i.codigo && (i[flujo] || desbloqueados.includes(i.codigo)))
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
}

export function programaPorCodigo(items: ItemCatalogo[], codigo: string) {
  return items.find((i) => i.tipo === 'programa' && i.codigo === codigo) ?? null;
}

/** Polo suelto, paquetes de 2 y 3 polos y uniforme, tal como estén en el catálogo. */
export function piezasRopa(items: ItemCatalogo[]) {
  const polo = items.find((i) => i.tipo === 'ropa' && i.categoria === 'polo' && i.precio > 0) ?? null;
  const pack2 = items.find((i) => i.codigo === 'pack-2-polos') ?? null;
  const pack3 = items.find((i) => i.codigo === 'pack-3-polos') ?? null;
  const uniforme = items.find((i) => i.tipo === 'ropa' && i.categoria === 'uniforme' && i.precio > 0) ?? null;
  return { polo, pack2, pack3, uniforme };
}
export type PiezasRopa = ReturnType<typeof piezasRopa>;

export function itemPolos(cantidad: CantidadPolos, ropa: PiezasRopa): ItemCatalogo | null {
  return cantidad === '1' ? ropa.polo : cantidad === '2' ? ropa.pack2 : cantidad === '3' ? ropa.pack3 : null;
}

/**
 * Pedido de una matrícula o renovación: programa, polos y uniforme aparte.
 * Es exactamente lo que se cotiza y lo que se manda al guardar (el servidor
 * vuelve a cotizar estas mismas líneas).
 */
export function lineasMatricula(programa: ItemCatalogo, polos: CantidadPolos, conUniforme: boolean, ropa: PiezasRopa): LineaPedido[] {
  const lineas: LineaPedido[] = [{ item_id: programa.id }];
  const p = itemPolos(polos, ropa);
  if (p) lineas.push({ item_id: p.id });
  if (programa.sin_uniforme && conUniforme && ropa.uniforme) lineas.push({ item_id: ropa.uniforme.id });
  return lineas;
}

// ─── Respaldo ────────────────────────────────────────────────────────────────
// SOLO si GET /api/config/catalogo falla: precios históricos para que la página
// no quede vacía. Se muestran como referenciales y no se puede enviar hasta que
// el API cotice (ids negativos = no existen en el catálogo real).
export function catalogoRespaldo(): ItemCatalogo[] {
  const base = { descripcion: null, categoria: null, meses: null, usa_talla: false, componentes: [] };
  const programas: ItemCatalogo[] = Object.keys(PRECIOS_BASE).map((codigo, i) => ({
    ...base,
    id: -(i + 1),
    tipo: 'programa',
    codigo,
    nombre: NOMBRES_PROGRAMA[codigo],
    precio: PRECIOS_BASE[codigo],
    clases: PROGRAMA_CLASES[codigo],
    en_inscripcion: ['1mes', 'full', '6meses'].includes(codigo),
    en_renovacion: codigo !== '1mes',
    es_adicional: false,
    sin_uniforme: codigo === '1mes',
    orden: i,
  }));
  const ropa: ItemCatalogo[] = RESPALDO_ROPA.map((r, i) => ({
    ...base,
    id: -(100 + i),
    tipo: r.tipo,
    codigo: r.codigo,
    nombre: r.nombre,
    categoria: r.categoria,
    precio: r.precio,
    clases: null,
    en_inscripcion: false,
    en_renovacion: false,
    es_adicional: false,
  }));
  return [...programas, ...ropa];
}
