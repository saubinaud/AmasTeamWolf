import { useState, memo } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from './ui/dialog';
import { X, QrCode, Building2, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  variant: string;
  quantity: number;
}

interface PopupPagoProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  cartItems?: CartItem[];
  customerEmail?: string;
}

export const PopupPago = memo(function PopupPago({ isOpen, onClose, totalAmount, cartItems = [], customerEmail = '' }: PopupPagoProps) {
  const [selectedMethod, setSelectedMethod] = useState<'yape' | 'transfer' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProceedPayment = async () => {
    if (!selectedMethod) {
      toast.error('Por favor seleccione un método de pago');
      return;
    }

    setIsSubmitting(true);

    try {
      // Si hay productos en el carrito, enviar al webhook de implementos
      if (cartItems.length > 0) {
        const payload = {
          metodoPago: selectedMethod === 'yape' ? 'Yape' : 'Transferencia Bancaria',
          productos: cartItems.map(item => ({
            id: item.id,
            nombre: item.name,
            precio: item.price,
            variante: item.variant,
            cantidad: item.quantity,
            subtotal: item.price * item.quantity
          })),
          total: totalAmount,
          email: customerEmail || 'no-proporcionado@email.com',
          fechaPedido: new Date().toISOString(),
          estado: 'Pendiente de pago'
        };

        const response = await fetch('https://pallium-n8n.s6hx3x.easypanel.host/webhook/implementos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error('Error al procesar el pedido');
        }
        
        toast.success('¡Pedido registrado! Se ha enviado un correo con los detalles. Los productos serán entregados una vez confirmado el pago.');
      } else {
        // Si viene desde matrícula, solo mostrar éxito
        toast.success('Información de pago confirmada. Por favor realice su pago y envíe el comprobante al WhatsApp indicado.');
      }
      
      onClose();
      setSelectedMethod(null);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Hubo un error al procesar el pedido. Por favor intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        showCloseButton={false}
        className="bg-zinc-900 border-2 border-[#FA7B21]/30 w-[calc(100%-1rem)] sm:w-full max-w-[95vw] sm:max-w-2xl p-4 sm:p-6"
        style={{
          maxHeight: '90vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          overscrollBehavior: 'contain'
        }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogDescription className="sr-only">
          Selecciona tu método de pago preferido para completar tu compra
        </DialogDescription>
        <div className="flex items-start justify-between mb-6">
          <div>
            <DialogTitle className="text-white text-2xl sm:text-3xl mb-2">
              Medios de pago
            </DialogTitle>
            <DialogDescription className="text-white/70 text-base sm:text-lg">
              Total a pagar: <span className="text-[#FCA929] text-xl sm:text-2xl">S/ {totalAmount}</span>
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <button 
              className="text-white/60 hover:text-white transition-colors"
              style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <X className="w-6 h-6" />
            </button>
          </DialogClose>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          {/* Yape */}
          <button
            onClick={() => setSelectedMethod(selectedMethod === 'yape' ? null : 'yape')}
            className={`p-4 sm:p-6 rounded-lg border-2 transition-all duration-300 text-left ${
              selectedMethod === 'yape'
                ? 'border-[#FA7B21] bg-[#FA7B21]/10'
                : 'border-white/20 hover:border-white/40 bg-zinc-800/50'
            }`}
            style={{
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <QrCode className="w-8 h-8 text-[#FCA929]" />
              <h3 className="text-white text-lg sm:text-xl">Yape / Plin</h3>
            </div>
            <p className="text-white/70 text-sm mb-4">
              Realice su pago vía Yape
            </p>
            {selectedMethod === 'yape' && (
              <div className="mt-4 bg-gradient-to-br from-zinc-800 to-zinc-900 p-6 rounded-lg border border-[#FA7B21]/30">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FA7B21]/20 rounded-full mb-2">
                    <QrCode className="w-8 h-8 text-[#FCA929]" />
                  </div>
                  <p className="text-white/90 text-base">
                    Realice su pago a:
                  </p>
                  <div className="bg-black/30 rounded-lg p-4 border border-white/10">
                    <p className="text-white text-lg mb-1">Nombre: David</p>
                    <p className="text-[#FCA929] text-2xl font-mono">#####</p>
                  </div>
                  <p className="text-white/60 text-sm mt-4">
                    💡 Puede usar Yape
                  </p>
                </div>
              </div>
            )}
          </button>

          {/* Transferencia */}
          <button
            onClick={() => setSelectedMethod(selectedMethod === 'transfer' ? null : 'transfer')}
            className={`p-4 sm:p-6 rounded-lg border-2 transition-all duration-300 text-left ${
              selectedMethod === 'transfer'
                ? 'border-[#FA7B21] bg-[#FA7B21]/10'
                : 'border-white/20 hover:border-white/40 bg-zinc-800/50'
            }`}
            style={{
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <Building2 className="w-8 h-8 text-[#FCA929]" />
              <h3 className="text-white text-lg sm:text-xl">Transferencia</h3>
            </div>
            <p className="text-white/70 text-sm mb-4">
              Transfiera a la siguiente cuenta
            </p>
            {selectedMethod === 'transfer' && (
              <div className="mt-4 space-y-3 text-sm">
                {/* INTERBANK */}
                <div className="bg-zinc-800 p-3 rounded border-l-4 border-green-500">
                  <p className="text-green-400 mb-2">🟢 INTERBANK</p>
                  <div className="space-y-1">
                    <p className="text-white/80">Nombre: <span className="text-white">Jimena</span></p>
                    <p className="text-white/80">Soles: <span className="text-white font-mono">8983331662706</span></p>
                  </div>
                </div>

                {/* BCP */}
                <div className="bg-zinc-800 p-3 rounded border-l-4 border-blue-500">
                  <p className="text-blue-400 mb-2">🔵 BCP</p>
                  <div className="space-y-1">
                    <p className="text-white/80">Nombre: <span className="text-white">David</span></p>
                    <p className="text-white/80">Soles: <span className="text-white font-mono">19300358353071</span></p>
                  </div>
                </div>

                {/* BBVA */}
                <div className="bg-zinc-800 p-3 rounded border-l-4 border-gray-400">
                  <p className="text-gray-300 mb-2">⚪️ BBVA</p>
                  <div className="space-y-1">
                    <p className="text-white/80">Nombre: <span className="text-white">Jimena</span></p>
                    <p className="text-white/80">Soles: <span className="text-white font-mono">0011-0814-0220041447</span></p>
                  </div>
                </div>
              </div>
            )}
          </button>
        </div>

        <div className="mt-4 sm:mt-6 bg-[#FA7B21]/10 border border-[#FA7B21]/30 rounded-lg p-3 sm:p-4">
          <p className="text-white/80 text-xs sm:text-sm">
            📸 Después de realizar el pago, por favor envíe su comprobante al WhatsApp: 
            <a href="https://wa.me/‪51989717412‬" className="text-[#FCA929] hover:underline ml-1">
              ‪+51 989 717 412‬
            </a>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 bg-transparent border border-white/30 text-white hover:bg-white/10 active:scale-95"
            style={{
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleProceedPayment}
            disabled={!selectedMethod || isSubmitting}
            className="flex-1 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            style={{
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              'Proceder al pago'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
