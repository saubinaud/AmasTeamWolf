import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from './ui/sheet';
import { Button } from './ui/button';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { OptimizedImage } from './OptimizedImage';
import { ScrollArea } from './ui/scroll-area';
import { useMemo } from 'react';
import { useCotizacion } from '../hooks/useCatalogoPublico';
import { lineasCarrito, type ItemCarrito } from '../hooks/useCarrito';
import { soles } from '../utils/catalogo';

interface CartDrawerHomeProps {
  isOpen: boolean;
  onClose: () => void;
  items: ItemCarrito[];
  onUpdateQuantity: (itemId: number, variante: string, cantidad: number) => void;
  onRemoveItem: (itemId: number, variante: string) => void;
  /** Total del servidor (cotización al día) */
  onCheckout: (total: number) => void;
}

/** "M · #000000" → texto y muestras de color. */
export function Variante({ texto }: { texto: string }) {
  if (!texto) return null;
  const partes = texto.split(' · ');
  return (
    <span className="inline-flex items-center gap-1.5 text-white/70 text-xs">
      {partes.map((p) => (/^#[0-9A-Fa-f]{6}$/.test(p)
        ? <span key={p} className="inline-block w-3.5 h-3.5 rounded-full border border-white/30" style={{ backgroundColor: p }} title={p} />
        : <span key={p}>Talla {p}</span>))}
    </span>
  );
}

export function CartDrawerHome({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}: CartDrawerHomeProps) {
  // El total lo calcula el servidor con los precios del catálogo
  const pedido = useMemo(() => (isOpen && items.length ? { lineas: lineasCarrito(items) } : null), [isOpen, items]);
  const { cotizacion, alDia, cargando, error } = useCotizacion(pedido);
  const listo = alDia && !!cotizacion?.ok;
  const total = listo ? cotizacion!.total : null;

  const handleCheckout = () => {
    if (items.length === 0 || total == null) return;
    onCheckout(total);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg bg-zinc-900 border-l-2 border-[#FA7B21]/30 p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-white text-xl sm:text-2xl flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-[#FA7B21]" />
              Carrito de Compras
            </SheetTitle>
            <SheetClose asChild>
              <button className="text-white/60 hover:text-white transition-colors duration-200">
                <X className="w-6 h-6" />
              </button>
            </SheetClose>
          </div>
          <SheetDescription className="text-white/60 text-sm">
            {items.length > 0 
              ? `${items.length} ${items.length === 1 ? 'producto' : 'productos'} en tu carrito` 
              : 'Añade productos a tu carrito de compras'}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <ShoppingBag className="w-16 h-16 text-white/20 mb-4" />
            <h3 className="text-white text-lg mb-2">Tu carrito está vacío</h3>
            <p className="text-white/70 text-sm mb-6">
              Añade productos de nuestra tienda para comenzar
            </p>
            <Button
              onClick={onClose}
              className="bg-transparent border border-[#FA7B21]/30 text-white hover:bg-[#FA7B21]/10 active:scale-95"
            >
              Continuar comprando
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div
                    key={`${item.item_id}-${item.variante}`}
                    className="bg-zinc-800/50 rounded-lg p-4 border border-white/10 hover:border-[#FA7B21]/30 transition-all duration-200"
                  >
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                        <OptimizedImage
                          src={item.imagen ?? ''}
                          alt={item.nombre}
                          className="w-full h-full object-cover"
                          aspectRatio="1/1"
                          objectFit="cover"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <h4 className="text-white text-sm sm:text-base line-clamp-1">
                              {item.nombre}
                            </h4>
                            <Variante texto={item.variante} />
                          </div>
                          <button
                            onClick={() => onRemoveItem(item.item_id, item.variante)}
                            className="p-2 text-white/60 hover:text-red-400 transition-colors duration-200 flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              disabled={item.cantidad <= 1}
                              onClick={() => onUpdateQuantity(item.item_id, item.variante, item.cantidad - 1)}
                              className="h-10 w-10 bg-transparent border border-white/20 text-white hover:bg-white/10 active:scale-95"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-white text-sm w-8 text-center">
                              {item.cantidad}
                            </span>
                            <Button
                              size="icon"
                              disabled={item.cantidad >= 10}
                              onClick={() => onUpdateQuantity(item.item_id, item.variante, item.cantidad + 1)}
                              className="h-10 w-10 bg-transparent border border-white/20 text-white hover:bg-white/10 active:scale-95"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          <span className="text-[#FA7B21] text-base sm:text-lg">
                            {listo && cotizacion!.lineas[idx] ? soles(cotizacion!.lineas[idx].total) : '…'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t border-white/10 px-6 py-4 space-y-4 bg-zinc-900/95">
              <div className="space-y-2">
                {cotizacion && alDia && !cotizacion.ok && (
                  <p className="text-amber-300 text-sm">{cotizacion.errores[0] ?? 'Un producto ya no está disponible'}. Quítalo para seguir.</p>
                )}
                {error && !cotizacion && <p className="text-amber-300 text-sm">No pudimos calcular el total. Reintentando…</p>}
                <div className="flex items-center justify-between text-white text-lg sm:text-xl pt-2 border-t border-white/10">
                  <span>Total:</span>
                  <span className={`text-[#FA7B21] text-2xl transition-opacity ${cargando ? 'opacity-50' : ''}`}>{total != null ? soles(total) : '…'}</span>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={total == null}
                className="w-full bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white py-6 text-base shadow-lg shadow-[#FA7B21]/30 hover:shadow-[#FA7B21]/50 transition-all duration-300 active:scale-95"
              >
                Proceder al pago
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}