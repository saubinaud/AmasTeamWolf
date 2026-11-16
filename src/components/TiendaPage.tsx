import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { ProductDetailDialog } from './ProductDetailDialog';
import { TarjetaProducto } from './TarjetaProducto';
import { EnlaceInterno } from './EnlaceInterno';
import { toast } from 'sonner';
import { HeaderMain } from './HeaderMain';
import { FooterMain } from './FooterMain';
import { NetworkStatusIndicator } from './NetworkStatusIndicator';
import { useLayoutContext } from '../layouts/MainLayout';
import { useCatalogoPublico } from '../hooks/useCatalogoPublico';
import { productosTienda, categoriaTienda, type ItemCatalogo } from '../utils/catalogo';
import type { ItemCarrito } from '../hooks/useCarrito';
import { enlaceWhatsApp } from '../config/contacto';
import { ui, claseOpcion } from '../styles/marca';

interface TiendaPageProps {
  onNavigate: (page: string, sectionId?: string) => void;
}

/**
 * Tienda: productos, precios, fotos, categorías y orden salen del catálogo del
 * API (Space ▸ Catálogo ▸ En la web). El carrito es el de toda la web.
 */
export function TiendaPage({ onNavigate }: TiendaPageProps) {
  const { onCartClick, cartItemsCount, onAddToCart, onOpenMatricula } = useLayoutContext();
  const { items, estado } = useCatalogoPublico();
  const productos = useMemo(() => productosTienda(items), [items]);

  const [seleccionado, setSeleccionado] = useState<ItemCatalogo | null>(null);
  const [categoria, setCategoria] = useState('Todos');

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const categorias = ['Todos', ...Array.from(new Set(productos.map(categoriaTienda)))];
  const filtrados = categoria === 'Todos' ? productos : productos.filter((p) => categoriaTienda(p) === categoria);

  const agregar = (item: Omit<ItemCarrito, 'cantidad'>) => {
    onAddToCart(item);
    toast.success(`${item.nombre} añadido al carrito`);
  };

  return (
    <div className={ui.pagina}>
      <HeaderMain
        onNavigate={onNavigate}
        onOpenMatricula={() => onOpenMatricula()}
        onCartClick={onCartClick}
        cartItemsCount={cartItemsCount}
        currentPage="tienda"
      />
      <NetworkStatusIndicator />

      <main className="container mx-auto px-4 pt-24 pb-20 sm:pt-28">
        <EnlaceInterno page="home" onNavigate={onNavigate} className={`${ui.btnGhost} -ml-2 mb-6`}>
          <ArrowLeft className="h-5 w-5" /> Inicio
        </EnlaceInterno>

        <div className="mb-8 max-w-2xl">
          <p className={ui.antetitulo}>Tienda</p>
          <h1 className={`mt-4 ${ui.h2}`}>Uniformes e implementos</h1>
          <p className={`mt-3 ${ui.bajada}`}>Agrega lo que necesites y paga al final desde el carrito.</p>
        </div>

        {categorias.length > 2 && (
          <div className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Categorías">
            {categorias.map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={categoria === c}
                onClick={() => setCategoria(c)}
                className={`${claseOpcion(categoria === c)} shrink-0`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {estado === 'cargando' ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
            {[0, 1, 2, 3, 4].map((i) => <div key={i} className={`aspect-[3/4] ${ui.esqueleto}`} />)}
          </div>
        ) : productos.length === 0 ? (
          <div className={`mx-auto max-w-md text-center ${ui.card} ${ui.cardPad}`}>
            <p className="mb-6 text-white/70">Escríbenos y te contamos qué hay disponible y sus precios.</p>
            <a href={enlaceWhatsApp('Hola, quiero comprar en la tienda')} target="_blank" rel="noopener noreferrer" className={ui.btnPrimary}>
              <MessageCircle className="h-5 w-5" /> Consultar por WhatsApp
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
            {filtrados.map((p) => (
              <TarjetaProducto key={p.id} producto={p} conCategoria onVer={() => setSeleccionado(p)} onAgregar={agregar} />
            ))}
          </div>
        )}
      </main>

      <FooterMain onNavigate={onNavigate} onOpenMatricula={() => onOpenMatricula()} />

      <ProductDetailDialog
        product={seleccionado}
        isOpen={!!seleccionado}
        onClose={() => setSeleccionado(null)}
        onAddToCart={agregar}
      />
    </div>
  );
}
