import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { OptimizedImage } from './OptimizedImage';
import { toast } from 'sonner';
import { TALLAS, soles, tituloWeb, type ItemCatalogo } from '../utils/catalogo';
import type { ItemCarrito } from '../hooks/useCarrito';

interface ProductDetailDialogProps {
  /** Producto del catálogo (precio, fotos, descripción y colores vienen del API) */
  product: ItemCatalogo | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (item: Omit<ItemCarrito, 'cantidad'>) => void;
}

export function ProductDetailDialog({ product, isOpen, onClose, onAddToCart }: ProductDetailDialogProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [color, setColor] = useState('');
  const [talla, setTalla] = useState('');

  // Al cambiar de producto: primera foto y primer color
  useEffect(() => {
    setSelectedImageIndex(0);
    setColor(product?.web?.colores?.[0] ?? '');
    setTalla('');
  }, [product?.id, product?.web?.colores]);

  if (!product) return null;

  const w = product.web;
  const images = w?.imagenes?.length ? w.imagenes : [];
  const currentImage = images[selectedImageIndex] ?? '';
  const nombre = tituloWeb(product);
  const descripcion = w?.descripcion || product.descripcion;
  const colores = w?.colores ?? [];
  const antes = w?.precio_referencia ?? null;

  const agregar = () => {
    if (product.usa_talla && !talla) { toast.error('Elige la talla'); return; }
    onAddToCart?.({
      item_id: product.id,
      nombre,
      imagen: images[0] ?? null,
      variante: [talla, colores.length > 1 ? color : ''].filter(Boolean).join(' · '),
    });
    onClose();
  };

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
        <DialogTitle className="sr-only">{nombre}</DialogTitle>
        <DialogDescription className="sr-only">
          {descripcion || `Detalles del producto ${nombre}`}
        </DialogDescription>
        
        <DialogClose className="absolute right-3 top-3 sm:right-4 sm:top-4 z-50 rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors">
          <X className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </DialogClose>

        {/* Grid de dos columnas forzado */}
      <div className="grid grid-cols-1 md:grid-cols-2 w-[90vw] max-w-[1100px] h-auto md:h-[80vh] bg-[#1a1a1a] rounded-2xl shadow-2xl mx-auto my-auto overflow-hidden">
          {/* Columna 1: Imagen del producto */}
          <div className="relative bg-[#222222] p-8 lg:p-14 flex flex-col items-center justify-center">
            <div className="relative w-full flex items-center justify-center flex-1 bg-zinc-800/30 rounded-xl min-h-[300px] sm:min-h-[400px]">
              <OptimizedImage
                src={currentImage}
                alt={nombre}
                priority={true}
                className="max-w-full max-h-[500px] rounded-xl"
                aspectRatio="1/1"
                objectFit="contain"
              />
            </div>

            {/* Carrusel de thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
                {images.map((img: string, index: number) => (
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
                      alt={`${nombre} - imagen ${index + 1}`}
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
                {nombre}
              </h2>

              {descripcion && (
                <div className="space-y-4 sm:space-y-5 mb-6 sm:mb-8 md:mb-10">
                  <p className="text-white/80 text-sm sm:text-base md:text-lg leading-relaxed whitespace-pre-line">
                    {descripcion}
                  </p>
                </div>
              )}

              {/* Colores disponibles */}
              {colores.length > 0 && (
                <div className="mb-6 sm:mb-8 md:mb-10">
                  <p
                    className="text-white mb-3 sm:mb-4 text-sm sm:text-base md:text-lg"
                    style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
                  >
                    Colores:
                  </p>
                  <div className="flex flex-wrap gap-3 sm:gap-4">
                    {colores.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setColor(c)}
                        aria-label={`Color ${c}`}
                        aria-pressed={color === c}
                        className={`w-11 h-11 md:w-12 md:h-12 rounded-full border-2 transition-colors ${color === c && colores.length > 1 ? 'border-[#FA7B21] ring-2 ring-[#FA7B21]/40' : 'border-white/20 hover:border-white/40'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {product.usa_talla && (
                <div className="mb-6 sm:mb-8 md:mb-10">
                  <p
                    className="text-white mb-3 sm:mb-4 text-sm sm:text-base md:text-lg"
                    style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
                  >
                    Talla:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TALLAS.map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setTalla(t)}
                        aria-pressed={talla === t}
                        className={`min-w-[44px] min-h-[44px] px-3 rounded-lg border text-sm transition-colors ${talla === t ? 'border-[#FA7B21] bg-[#FA7B21]/20 text-white' : 'border-white/20 text-white/80 hover:border-white/40'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Precio y botón */}
            <div className="mt-auto pt-4 sm:pt-5 border-t border-white/10">
              <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
                <span className="text-white/60 text-sm sm:text-base md:text-lg">Precio:</span>
                <span className="flex flex-wrap items-baseline justify-end gap-x-3">
                  {antes != null && <span className="text-white/40 line-through text-lg sm:text-xl">{soles(antes)}</span>}
                  <span
                    className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
                    style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
                  >
                    {soles(product.precio)}
                  </span>
                </span>
              </div>

              <Button
                onClick={agregar}
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