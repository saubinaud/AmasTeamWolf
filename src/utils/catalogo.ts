// Catálogo público y cotización: lo que los formularios de matrícula,
// renovación y Leadership leen del API. Ningún precio ni código promocional
// vive aquí; el total siempre lo devuelve POST /api/config/cotizar.
//
// Lo que se muestra (título, beneficios, tachado, cintas, fotos, orden) también
// sale del API: el bloque `web` de cada ítem, editado en Space ▸ Catálogo ▸ En la web.

/** Presentación de un ítem en la web (sin precio: el precio es `ItemCatalogo.precio`). */
export interface WebItem {
  /** Programa: sale en la portada. Producto: sale en la tienda */
  visible: boolean;
  /** Programa: tarjeta resaltada. Producto: sale también en la portada */
  destacado: boolean;
  orden: number;
  titulo: string | null;
  texto: string | null;
  descripcion: string | null;
  beneficios: string[];
  /** Precio tachado; el API solo lo manda si es mayor que el precio real */
  precio_referencia: number | null;
  etiqueta: string | null;
  sello: string | null;
  nota_precio: string | null;
  aviso_titulo: string | null;
  aviso_texto: string | null;
  renovacion_texto: string | null;
  renovacion_etiqueta: string | null;
  renovacion_beneficios: string[];
  imagenes: string[];
  /** Las mismas fotos a 600 px (WebP) para tarjetas; las de afuera vienen igual */
  imagenes_tarjeta?: string[];
  colores: string[];
  categoria_tienda: string | null;
}

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
  /** Presentación en la web; null = no tiene (no sale en portada ni tienda) */
  web?: WebItem | null;
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

// ─── Presentación en la web ─────────────────────────────────────────────────

const ordenWeb = (a: ItemCatalogo, b: ItemCatalogo) =>
  (a.web?.orden ?? 0) - (b.web?.orden ?? 0) || (a.orden ?? 0) - (b.orden ?? 0) || a.nombre.localeCompare(b.nombre);

/** Título comercial o, si no tiene, el nombre del catálogo. */
export const tituloWeb = (i: ItemCatalogo) => i.web?.titulo || i.nombre;

/** Programas de la portada: visibles en la web, sin los adicionales (Leadership tiene su página). */
export function programasPortada(items: ItemCatalogo[]) {
  return items.filter((i) => i.tipo === 'programa' && !i.es_adicional && i.web?.visible).sort(ordenWeb);
}

/** Productos de la tienda (implementos, ropa y paquetes visibles en la web), en su orden. */
export function productosTienda(items: ItemCatalogo[]) {
  return items.filter((i) => i.tipo !== 'programa' && i.web?.visible && i.precio > 0).sort(ordenWeb);
}

/** Categoría con la que se agrupa un producto en la tienda. */
export const categoriaTienda = (i: ItemCatalogo) => i.web?.categoria_tienda || 'Otros';

/** La foto de la tarjeta: la versión de 600 px si el API la manda, si no la grande. */
export const fotoTarjeta = (w: { imagenes?: string[]; imagenes_tarjeta?: string[] } | null | undefined): string | undefined =>
  w?.imagenes_tarjeta?.[0] || w?.imagenes?.[0];
