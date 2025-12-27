import { useState } from 'react';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';
import { ProductDetailDialog } from './ProductDetailDialog';
import { OptimizedImage } from './OptimizedImage';
import { toast } from 'sonner';
import { featuredStoreProducts, Implement } from '../data/implements';

interface TiendaSectionProps {
  onAddToCart: (product: Implement, variant: string, quantity: number) => void;
  onNavigate: (page: string) => void;
}

export function TiendaSection({ onAddToCart, onNavigate }: TiendaSectionProps) {
  const [selectedProduct, setSelectedProduct] = useState<Implement | null>(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleOpenProduct = (product: Implement) => {
    setSelectedProduct(product);
    const firstColor = product.colors?.[0] || '';
    setSelectedColor(firstColor);
    setQuantity(1);
  };

  const handleAddToCart = (product: Implement) => {
    const variant = selectedColor || 'Único';
    onAddToCart(product, variant, 1);
    toast.success(`${product.name} añadido al carrito`);
  };

  return (
    <section id="tienda" className="py-12 sm:py-16 md:py-20 lg:py-24 bg-black relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(252, 169, 41, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(252, 169, 41, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <h2 
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-3 sm:mb-4 px-4"
            style={{
              background: 'linear-gradient(135deg, #FA7B21 0%, #FCA929 50%, #FA7B21 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Tienda AMAS
          </h2>
          <p className="text-white/70 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4">
            Equípate con lo mejor. Productos de calidad para tu entrenamiento.
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {featuredStoreProducts.map((product, index) => (
            <div
              key={index}
              onClick={() => handleOpenProduct(product)}
              className="bg-zinc-900/50 border border-white/10 rounded-xl p-3 sm:p-4 hover:border-[#FA7B21]/50 transition-all duration-300 cursor-pointer group"
            >
              <div className="aspect-square bg-zinc-800/50 rounded-lg mb-3 sm:mb-4 overflow-hidden relative group-hover:bg-zinc-800/70 transition-colors">
                <OptimizedImage
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                {product.isNew && (
                  <div className="absolute top-2 right-2 bg-[#FA7B21] text-white text-xs px-2 py-1 rounded-full select-none pointer-events-none">
                    Nuevo
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-white text-sm sm:text-base mb-2">{product.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-[#FCA929] text-base sm:text-lg">S/ {product.price}</span>
                  {product.colors && product.colors.length > 0 && (
                    <div className="flex gap-1">
                      {product.colors.slice(0, 3).map((color, idx) => (
                        <div
                          key={idx}
                          className="w-4 h-4 rounded-full border border-white/20"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button
            onClick={() => onNavigate('tienda')}
            size="lg"
            data-umami-event="Click Ver Tienda"
            data-umami-event-ubicacion="home"
            className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white px-8 sm:px-12 py-5 sm:py-6 text-sm sm:text-base shadow-2xl shadow-[#FA7B21]/30 hover:shadow-[#FA7B21]/50 transition-all duration-300 group active:scale-95"
            style={{
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <span className="pointer-events-none">Ver toda la tienda</span>
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform pointer-events-none" />
          </Button>
        </div>
      </div>

      {/* Product Detail Dialog */}
      {selectedProduct && (
        <ProductDetailDialog
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={() => {
            handleAddToCart(selectedProduct);
            setSelectedProduct(null);
          }}
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
          quantity={quantity}
          onQuantityChange={setQuantity}
        />
      )}
    </section>
  );
}
