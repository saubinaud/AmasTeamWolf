import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ProductDetailDialog } from './ProductDetailDialog';
import { TarjetaProducto } from './TarjetaProducto';
import { EnlaceInterno } from './EnlaceInterno';
import { toast } from 'sonner';
import { useCatalogoPublico } from '../hooks/useCatalogoPublico';
import { productosTienda, type ItemCatalogo } from '../utils/catalogo';
import type { ItemCarrito } from '../hooks/useCarrito';
import { ui } from '../styles/marca';

interface TiendaSectionProps {
  onAddToCart: (item: Omit<ItemCarrito, 'cantidad'>) => void;
  onNavigate: (page: string, sectionId?: string) => void;
}

/** Tienda en la portada: los productos marcados "También en la portada" en Space ▸ Catálogo ▸ En la web. */
export function TiendaSection({ onAddToCart, onNavigate }: TiendaSectionProps) {
  const { items } = useCatalogoPublico();
  const destacados = useMemo(() => productosTienda(items).filter((p) => p.web?.destacado), [items]);
  const [seleccionado, setSeleccionado] = useState<ItemCatalogo | null>(null);

  if (destacados.length === 0) return null;

  const agregar = (item: Omit<ItemCarrito, 'cantidad'>) => {
    onAddToCart(item);
    toast.success(`${item.nombre} añadido al carrito`);
  };

  return (
    <section id="tienda" className={`${ui.seccion} scroll-mt-20`}>
      <div className="mx-auto mb-8 flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:mb-10">
        <div>
          <p className={ui.antetitulo}>Tienda</p>
          <h2 className={`mt-4 ${ui.h2}`}>Uniformes e implementos</h2>
          <p className={`mt-3 ${ui.bajada}`}>Lo que usan los alumnos en clase.</p>
        </div>
        <EnlaceInterno page="tienda" onNavigate={onNavigate} className={`${ui.btnGhost} self-start sm:self-auto`} data-umami-event="Click Ver Tienda" data-umami-event-ubicacion="home">
          Ver toda la tienda <ArrowRight className="h-4 w-4" />
        </EnlaceInterno>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {destacados.map((p) => (
          <TarjetaProducto key={p.id} producto={p} onVer={() => setSeleccionado(p)} onAgregar={agregar} />
        ))}
      </div>

      <ProductDetailDialog
        product={seleccionado}
        isOpen={!!seleccionado}
        onClose={() => setSeleccionado(null)}
        onAddToCart={agregar}
      />
    </section>
  );
}
