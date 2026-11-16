import { Plus, SlidersHorizontal } from 'lucide-react';
import { OptimizedImage } from './OptimizedImage';
import { tituloWeb, soles, fotoTarjeta, categoriaTienda, type ItemCatalogo } from '../utils/catalogo';
import type { ItemCarrito } from '../hooks/useCarrito';
import { ui } from '../styles/marca';

interface TarjetaProductoProps {
  producto: ItemCatalogo;
  /** Abre la ficha (fotos, descripción, talla y color) */
  onVer: () => void;
  onAgregar: (item: Omit<ItemCarrito, 'cantidad'>) => void;
  conCategoria?: boolean;
}

/** Pide talla o color antes de agregar: entonces el botón abre la ficha. */
export const necesitaElegir = (p: ItemCatalogo) => p.usa_talla || (p.web?.colores?.length ?? 0) > 1;

/**
 * Tarjeta de la tienda con su botón de agregar a la vista. Si el producto pide
 * talla o color, el botón abre la ficha para elegirlos.
 */
export function TarjetaProducto({ producto: p, onVer, onAgregar, conCategoria = false }: TarjetaProductoProps) {
  const w = p.web;
  const titulo = tituloWeb(p);
  const elegir = necesitaElegir(p);

  const agregar = () => {
    if (elegir) return onVer();
    onAgregar({ item_id: p.id, nombre: titulo, imagen: w?.imagenes?.[0] ?? null, variante: '' });
  };

  return (
    <article className={`group flex h-full flex-col overflow-hidden ${ui.cardChica}`}>
      <button type="button" onClick={onVer} className="relative block aspect-square w-full overflow-hidden bg-zinc-900" aria-label={`Ver ${titulo}`}>
        {w?.imagenes?.[0] && (
          <OptimizedImage
            src={fotoTarjeta(w) ?? w.imagenes[0]}
            alt={titulo}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        )}
        {w?.etiqueta && <span className={`${ui.cinta} absolute right-2 top-2`}>{w.etiqueta}</span>}
      </button>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {conCategoria && <p className="mb-1 text-xs text-white/45">{categoriaTienda(p)}</p>}
        <button type="button" onClick={onVer} className="text-left">
          <h3 className="line-clamp-2 text-sm font-medium text-white sm:text-base">{titulo}</h3>
        </button>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-semibold text-white tabular-nums">{soles(p.precio)}</span>
          {w?.precio_referencia != null && <span className="text-sm text-white/40 line-through">{soles(w.precio_referencia)}</span>}
        </div>
        {(w?.colores?.length ?? 0) > 1 && (
          <div className="mt-2 flex gap-1" aria-label={`${w!.colores.length} colores`}>
            {w!.colores.slice(0, 4).map((c) => (
              <span key={c} className="h-3.5 w-3.5 rounded-full border border-white/20" style={{ backgroundColor: c }} />
            ))}
          </div>
        )}

        <div className="mt-auto pt-3">
          <button type="button" onClick={agregar} className={`${ui.btnCompacto} w-full`} data-umami-event="Click Agregar" data-umami-event-producto={titulo}>
            {elegir ? <SlidersHorizontal className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {elegir ? (p.usa_talla ? 'Elegir talla' : 'Elegir color') : 'Agregar'}
          </button>
        </div>
      </div>
    </article>
  );
}
