import { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { ProductDetailDialog } from './ProductDetailDialog';
import { OptimizedImage } from './OptimizedImage';
import { toast } from 'sonner';
import { HeaderMain } from './HeaderMain';
import { FooterMain } from './FooterMain';
import { NetworkStatusIndicator } from './NetworkStatusIndicator';
import { useLayoutContext } from '../layouts/MainLayout';
import { useCatalogoPublico } from '../hooks/useCatalogoPublico';
import { productosTienda, categoriaTienda, tituloWeb, soles, type ItemCatalogo } from '../utils/catalogo';
import { enlaceWhatsApp } from '../config/contacto';

interface TiendaPageProps {
  onNavigate: (page: string) => void;
}

/**
 * Tienda: productos, precios, fotos, categorías y orden salen del catálogo del
 * API (Space ▸ Catálogo ▸ En la web). El carrito es el de toda la web.
 */
export function TiendaPage({ onNavigate }: TiendaPageProps) {
  const { onCartClick, cartItemsCount, onAddToCart } = useLayoutContext();
  const { items, estado } = useCatalogoPublico();
  const productos = useMemo(() => productosTienda(items), [items]);

  const [selectedProduct, setSelectedProduct] = useState<ItemCatalogo | null>(null);
  const [activeCategory, setActiveCategory] = useState('Todos');

  // Scroll to top when component mounts
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const categories = ['Todos', ...Array.from(new Set(productos.map(categoriaTienda)))];
  const filteredProducts = activeCategory === 'Todos'
    ? productos
    : productos.filter((p) => categoriaTienda(p) === activeCategory);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Advanced Gradient Background - igual que el home */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(circle at 20% 50%, rgba(250, 123, 33, 0.15) 0%, transparent 50%)'
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(circle at 80% 50%, rgba(252, 169, 41, 0.2) 0%, transparent 60%)'
          }}
        />
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px'
          }}
        />
      </div>

      <div className="relative z-10">
        <HeaderMain
          onNavigate={onNavigate}
          onOpenMatricula={() => {}}
          onCartClick={onCartClick}
          cartItemsCount={cartItemsCount}
          currentPage="tienda"
        />
      
        <NetworkStatusIndicator />

        {/* Hero Section */}
        <section className="pt-24 sm:pt-28 pb-12 sm:pb-16 relative overflow-hidden">

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          {/* Back Button */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-white/70 hover:text-[#FCA929] transition-colors mb-8 group animate-fade-in-up"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Volver al inicio</span>
          </button>

          <div
            className="text-center mb-12 animate-fade-in-up"
          >
            <h1
              className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl xl:text-6xl mb-4 px-4"
              style={{
                background: 'linear-gradient(135deg, #FA7B21 0%, #FCA929 50%, #FA7B21 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Tienda JMA
            </h1>
            <p className="text-white/70 text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-4">
              Todo el equipamiento profesional para tu entrenamiento
            </p>
          </div>

          {/* Categories Filter */}
          <div
            className="flex flex-wrap justify-center gap-2 mb-12 animate-fade-in-up"
          >
            {categories.map((category) => (
              <Button
                key={category}
                onClick={() => setActiveCategory(category)}
                variant={activeCategory === category ? 'default' : 'outline'}
                className={`text-sm active:scale-95 ${
                  activeCategory === category
                    ? 'bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white border-transparent'
                    : 'border-white/20 text-white/70 hover:text-white hover:border-[#FA7B21]/30 bg-transparent'
                }`}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Products Grid */}
          {estado === 'cargando' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              {[0, 1, 2, 3, 4].map((i) => <div key={i} className="aspect-[3/4] rounded-lg bg-white/5 animate-pulse" />)}
            </div>
          ) : productos.length === 0 ? (
            <div className="max-w-xl mx-auto text-center bg-zinc-900/70 border border-white/10 rounded-xl p-6 sm:p-8">
              <p className="text-white/80 text-sm sm:text-base mb-5">Escríbenos y te contamos qué hay disponible y sus precios.</p>
              <a
                href={enlaceWhatsApp('Hola, quiero comprar en la tienda')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full sm:w-auto bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white px-8 py-4 rounded-lg"
              >
                Consultar por WhatsApp
              </a>
            </div>
          ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="cursor-pointer group hover:-translate-y-2 hover:scale-[1.02] transition-transform duration-300"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="bg-zinc-900 rounded-lg overflow-hidden border border-white/10 hover:border-[#FA7B21]/50 transition-colors duration-300 h-full flex flex-col">
                  <div className="relative aspect-square bg-zinc-800 overflow-hidden">
                    {product.web?.imagenes?.[0] && (
                      <OptimizedImage
                        src={product.web.imagenes[0]}
                        alt={tituloWeb(product)}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        aspectRatio="1/1"
                        objectFit="cover"
                      />
                    )}
                    {product.web?.etiqueta && (
                      <div className="absolute top-2 right-2 bg-[#FA7B21] text-white text-xs px-2 py-1 rounded-full select-none pointer-events-none">
                        {product.web.etiqueta}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                      <span className="text-white text-sm flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Ver detalles
                      </span>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 flex-1 flex flex-col">
                    <p className="text-[#FCA929] text-xs mb-1">{categoriaTienda(product)}</p>
                    <h3 className="text-white text-sm sm:text-base mb-2 line-clamp-2 flex-1">
                      {tituloWeb(product)}
                    </h3>
                    <p className="flex flex-wrap items-baseline gap-x-2">
                      {product.web?.precio_referencia != null && (
                        <span className="text-white/40 line-through text-sm">{soles(product.web.precio_referencia)}</span>
                      )}
                      <span className="text-[#FA7B21] text-lg sm:text-xl">{soles(product.precio)}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </section>

      <FooterMain 
        onNavigate={onNavigate}
        onOpenMatricula={() => {}}
      />

      {/* Product Detail Dialog */}
      <ProductDetailDialog
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(item) => {
          onAddToCart(item);
          toast.success(`${item.nombre} añadido al carrito`);
        }}
      />
      </div>
    </div>
  );
}