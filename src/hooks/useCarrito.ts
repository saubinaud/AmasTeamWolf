// Carrito de la tienda: un solo estado para toda la web (lo usa MainLayout y lo
// reparte por el contexto). Guarda solo qué se pidió (id del catálogo, cantidad
// y variante); el precio y el total los devuelve POST /api/config/cotizar.
import { useCallback, useEffect, useState } from 'react';
import type { LineaPedido } from '../utils/catalogo';

export interface ItemCarrito {
  /** id en catalogo_items */
  item_id: number;
  nombre: string;
  imagen: string | null;
  /** Talla y/o color elegidos ("" si no aplica) */
  variante: string;
  cantidad: number;
}

// Clave nueva: el carrito viejo ('amasCart') guardaba precios escritos a mano
const CLAVE = 'amasCarrito';

function leer(): ItemCarrito[] {
  try {
    localStorage.removeItem('amasCart');
    const l = JSON.parse(localStorage.getItem(CLAVE) || '[]');
    return Array.isArray(l) ? l.filter((x) => Number.isInteger(x?.item_id) && x.item_id > 0 && x.cantidad > 0) : [];
  } catch {
    return [];
  }
}

const mismo = (a: ItemCarrito, id: number, variante: string) => a.item_id === id && a.variante === variante;

export function useCarrito() {
  const [items, setItems] = useState<ItemCarrito[]>(leer);

  useEffect(() => {
    try { localStorage.setItem(CLAVE, JSON.stringify(items)); } catch { /* modo privado */ }
  }, [items]);

  const agregar = useCallback((nuevo: Omit<ItemCarrito, 'cantidad'>, cantidad = 1) => {
    setItems((prev) => (prev.some((x) => mismo(x, nuevo.item_id, nuevo.variante))
      ? prev.map((x) => (mismo(x, nuevo.item_id, nuevo.variante) ? { ...x, cantidad: Math.min(10, x.cantidad + cantidad) } : x))
      : [...prev, { ...nuevo, cantidad: Math.min(10, cantidad) }]));
  }, []);

  const cambiarCantidad = useCallback((id: number, variante: string, cantidad: number) => {
    setItems((prev) => prev.map((x) => (mismo(x, id, variante) ? { ...x, cantidad: Math.min(10, Math.max(1, cantidad)) } : x)));
  }, []);

  const quitar = useCallback((id: number, variante: string) => {
    setItems((prev) => prev.filter((x) => !mismo(x, id, variante)));
  }, []);

  const vaciar = useCallback(() => setItems([]), []);

  return { items, agregar, cambiarCantidad, quitar, vaciar, cuenta: items.reduce((s, x) => s + x.cantidad, 0) };
}

/** Líneas del carrito para cotizar (la variante va como talla: el servidor la guarda tal cual). */
export function lineasCarrito(items: ItemCarrito[]): LineaPedido[] {
  return items.map((x) => ({ item_id: x.item_id, cantidad: x.cantidad, talla: x.variante || undefined }));
}
