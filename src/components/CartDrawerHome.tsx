import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from './ui/sheet';
import { Button } from './ui/button';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { OptimizedImage } from './OptimizedImage';
import { ScrollArea } from './ui/scroll-area';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  variant: string;
  quantity: number;
}

interface CartDrawerHomeProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, variant: string, quantity: number) => void;
  onRemoveItem: (id: string, variant: string) => void;
  onCheckout: (total: number, items: CartItem[]) => void;
}

export function CartDrawerHome({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}: CartDrawerHomeProps) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    if (items.length === 0) return;
    onCheckout(total, items);
    onClose();
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
              <button className="text-white/60 hover:text-white transition-colors">
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
            <p className="text-white/60 text-sm mb-6">
              Añade productos de nuestra tienda para comenzar
            </p>
            <Button
              onClick={onClose}
              className="bg-transparent border border-[#FA7B21]/30 text-white hover:bg-[#FA7B21]/10"
            >
              Continuar comprando
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={`${item.id}-${item.variant}`}
                    className="bg-zinc-800/50 rounded-lg p-4 border border-white/10 hover:border-[#FA7B21]/30 transition-all"
                  >
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                        <OptimizedImage
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          aspectRatio="1/1"
                          objectFit="cover"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <h4 className="text-white text-sm sm:text-base line-clamp-1">
                              {item.name}
                            </h4>
                            <p className="text-white/60 text-xs">
                              Variante: {item.variant}
                            </p>
                          </div>
                          <button
                            onClick={() => onRemoveItem(item.id, item.variant)}
                            className="text-white/60 hover:text-red-400 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              onClick={() => onUpdateQuantity(item.id, item.variant, Math.max(1, item.quantity - 1))}
                              className="h-7 w-7 bg-transparent border border-white/20 text-white hover:bg-white/10"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-white text-sm w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              size="icon"
                              onClick={() => onUpdateQuantity(item.id, item.variant, item.quantity + 1)}
                              className="h-7 w-7 bg-transparent border border-white/20 text-white hover:bg-white/10"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          <span className="text-[#FA7B21] text-base sm:text-lg">
                            S/ {item.price * item.quantity}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t border-white/10 px-6 py-4 space-y-4 bg-zinc-900/95 backdrop-blur-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-white/70 text-sm">
                  <span>Subtotal:</span>
                  <span>S/ {total}</span>
                </div>
                <div className="flex items-center justify-between text-white text-lg sm:text-xl pt-2 border-t border-white/10">
                  <span>Total:</span>
                  <span className="text-[#FA7B21] text-2xl">S/ {total}</span>
                </div>
              </div>
              
              <Button
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white py-6 text-base shadow-lg shadow-[#FA7B21]/30 hover:shadow-[#FA7B21]/50 transition-all duration-300"
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
