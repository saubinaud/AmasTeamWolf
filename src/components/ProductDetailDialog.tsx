import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { OptimizedImage } from './OptimizedImage';

interface ProductDetailDialogProps {
  product: any | null; // Can be Implement or StoreProduct
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: any) => void;
}

export function ProductDetailDialog({ product, isOpen, onClose, onAddToCart }: ProductDetailDialogProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Reset selected image when product changes
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [product?.id]);
  
  if (!product) return null;

  // Obtener array de imágenes directamente del producto
  const images = product.images || [product.image];
  const currentImage = images[selectedImageIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
          showCloseButton={false}
          className="
            fixed inset-0 z-50 flex justify-center bg-transparent overflow-y-auto 
            p-4 border-none
            !top-0 !left-0 !translate-x-0 !translate-y-0
            w-screen h-screen
            sm:!max-w-none md:!max-w-none lg:!max-w-none
          "
          style={{ transform: 'none' }}
      >
        <DialogTitle className="sr-only">{product.name}</DialogTitle>
        <DialogDescription className="sr-only">
          {product.longDescription || product.description || `Detalles del producto ${product.name}`}
        </DialogDescription>
        
        <DialogClose className="absolute right-3 top-3 sm:right-4 sm:top-4 z-50 rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors backdrop-blur-sm">
          <X className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </DialogClose>

        {/* Grid de dos columnas forzado */}
      <div className="grid grid-cols-1 md:grid-cols-2 w-[90vw] max-w-[1100px] h-auto md:h-[80vh] bg-[#1a1a1a] rounded-2xl shadow-2xl mx-auto my-auto overflow-hidden">
          {/* Columna 1: Imagen del producto */}
          <div className="relative bg-[#222222] p-8 lg:p-14 flex flex-col items-center justify-center">
            <div className="relative w-full flex items-center justify-center flex-1 bg-zinc-800/30 rounded-xl min-h-[300px] sm:min-h-[400px]">
              <OptimizedImage
                src={currentImage}
                alt={product.name}
                priority={true}
                className="max-w-full max-h-[500px] rounded-xl"
                aspectRatio="1/1"
                objectFit="contain"
              />
            </div>

            {/* Carrusel de thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-[#FA7B21] scale-105'
                        : 'border-white/20 hover:border-white/40'
                    } bg-[#1a1a1a]`}
                  >
                    <OptimizedImage
                      src={img}
                      alt={`${product.name} - imagen ${index + 1}`}
                      className="w-full h-full"
                      aspectRatio="1/1"
                      objectFit="cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detalles del producto */}
          <div className="bg-[#1a1a1a] p-6 sm:p-8 md:p-10 lg:p-14 flex flex-col h-full overflow-y-auto">
            <div className="flex-1">
              <h2
                className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-4 sm:mb-5 md:mb-6 lg:mb-8 leading-tight"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
              >
                {product.name}
              </h2>

              <div className="space-y-4 sm:space-y-5 mb-6 sm:mb-8 md:mb-10">
                {product.longDescription ? (
                  <p className="text-white/80 text-sm sm:text-base md:text-lg leading-relaxed">
                    {product.longDescription}
                  </p>
                ) : product.description ? (
                  <p className="text-white/80 text-sm sm:text-base md:text-lg leading-relaxed">
                    {product.description}
                  </p>
                ) : (
                  <p className="text-white/80 text-sm sm:text-base md:text-lg leading-relaxed">
                    Implemento de alta calidad para el programa Leadership Wolf.
                  </p>
                )}
              </div>

              {/* Colores disponibles */}
              {product.colors && product.colors.length > 0 && (
                <div className="mb-6 sm:mb-8 md:mb-10">
                  <p
                    className="text-white mb-3 sm:mb-4 text-sm sm:text-base md:text-lg"
                    style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
                  >
                    Colores:
                  </p>
                  <div className="flex gap-3 sm:gap-4">
                    {product.colors.map((color) => (
                      <div
                        key={color}
                        className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full border-2 border-white/20 hover:border-white/40 transition-colors cursor-pointer"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Especificaciones técnicas */}
              {product.description && product.longDescription && (
                <div className="bg-white/5 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 mb-6 sm:mb-8 md:mb-10">
                  <p className="text-white/70 text-sm sm:text-base">
                    <strong className="text-white/90">Especificaciones:</strong> {product.description}
                  </p>
                </div>
              )}
            </div>

            {/* Precio y botón */}
            <div className="mt-auto pt-4 sm:pt-5 border-t border-white/10">
              <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
                <span className="text-white/60 text-sm sm:text-base md:text-lg">Precio:</span>
                <span
                  className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
                >
                  S/{product.price}
                </span>
              </div>

              <Button
                onClick={() => {
                  onAddToCart?.(product);
                  onClose();
                }}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-4 sm:py-5 md:py-6 text-base sm:text-lg md:text-xl rounded-full transition-transform active:scale-95"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
              >
                Añadir al carrito
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}