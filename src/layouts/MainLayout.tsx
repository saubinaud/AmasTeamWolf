import { useState, lazy, Suspense } from 'react';
import { Outlet, useOutletContext, ScrollRestoration } from 'react-router-dom';
import { Toaster } from '../components/ui/sonner';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { useCarrito, type ItemCarrito } from '../hooks/useCarrito';
import { enlaceWhatsApp } from '../config/contacto';

const CartDrawerHome = lazy(() => import('../components/CartDrawerHome').then(m => ({ default: m.CartDrawerHome })));
const PopupPago = lazy(() => import('../components/PopupPago').then(m => ({ default: m.PopupPago })));

export interface LayoutContext {
  onNavigate: (page: string, sectionId?: string) => void;
  /** Código del programa del catálogo; sin código, Leadership */
  onOpenMatricula: (codigo?: string) => void;
  onCartClick: () => void;
  cartItemsCount: number;
  onAddToCart: (item: Omit<ItemCarrito, 'cantidad'>, cantidad?: number) => void;
  onRegistrationSuccess: (total: number) => void;
  isPagoOpen: boolean;
  setIsPagoOpen: (open: boolean) => void;
  totalAmount: number;
}

export function useLayoutContext() {
  return useOutletContext<LayoutContext>();
}

/** Página de matrícula de cada programa; los demás se atienden por WhatsApp. */
const PAGINA_MATRICULA: Record<string, string> = {
  full: 'registro-3-meses',
  '6meses': 'registro-6-meses',
  '1mes': 'registro-mensual',
  leadership: 'registro-leadership',
};

export default function MainLayout() {
  const appNavigate = useAppNavigate();
  const carrito = useCarrito();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPagoOpen, setIsPagoOpen] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [pagoTienda, setPagoTienda] = useState(false);

  const handleNavigate = (page: string, sectionId?: string) => {
    appNavigate(page, sectionId);
  };

  const handleEnrollProgram = (codigo?: string) => {
    // Algunos botones pasan el evento del clic: eso cuenta como "sin código"
    const pagina = PAGINA_MATRICULA[typeof codigo === 'string' && codigo ? codigo : 'leadership'];
    if (pagina) handleNavigate(pagina);
    else window.open(enlaceWhatsApp('Hola, quiero matricular a mi hijo'), '_blank', 'noopener');
  };

  const handleCheckout = (total: number) => {
    setTotalAmount(total);
    setPagoTienda(true);
    setIsCartOpen(false);
    setTimeout(() => setIsPagoOpen(true), 150);
  };

  const handleRegistrationSuccess = (total: number) => {
    setTotalAmount(total);
    setPagoTienda(false);
    setIsPagoOpen(true);
  };

  const context: LayoutContext = {
    onNavigate: handleNavigate,
    onOpenMatricula: handleEnrollProgram,
    onCartClick: () => setIsCartOpen(true),
    cartItemsCount: carrito.cuenta,
    onAddToCart: carrito.agregar,
    onRegistrationSuccess: handleRegistrationSuccess,
    isPagoOpen,
    setIsPagoOpen,
    totalAmount,
  };

  return (
    <>
      <Outlet context={context} />

      <Suspense fallback={null}>
        <CartDrawerHome
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={carrito.items}
          onUpdateQuantity={carrito.cambiarCantidad}
          onRemoveItem={carrito.quitar}
          onCheckout={handleCheckout}
        />
      </Suspense>

      <Suspense fallback={null}>
        <PopupPago
          isOpen={isPagoOpen}
          onClose={() => setIsPagoOpen(false)}
          totalAmount={totalAmount}
          cartItems={pagoTienda ? carrito.items : undefined}
          onPedidoRegistrado={carrito.vaciar}
        />
      </Suspense>

      <Toaster theme="dark" position="bottom-right" />
      <ScrollRestoration />
    </>
  );
}
