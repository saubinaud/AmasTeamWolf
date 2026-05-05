import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Outlet, useOutletContext, ScrollRestoration } from 'react-router-dom';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';
import type { CartItem } from '../components/CartDrawerHome';
import { useAppNavigate } from '../hooks/useAppNavigate';

const CartDrawerHome = lazy(() => import('../components/CartDrawerHome').then(m => ({ default: m.CartDrawerHome })));
const PopupPago = lazy(() => import('../components/PopupPago').then(m => ({ default: m.PopupPago })));

export interface LayoutContext {
  onNavigate: (page: string, sectionId?: string) => void;
  onOpenMatricula: (programa?: 'full' | '1mes' | '6meses') => void;
  onCartClick: () => void;
  cartItemsCount: number;
  onAddToCart: (product: any, variant?: string, quantity?: number) => void;
  onRegistrationSuccess: (total: number) => void;
  isPagoOpen: boolean;
  setIsPagoOpen: (open: boolean) => void;
  totalAmount: number;
  checkoutItems: CartItem[];
  cartItems: CartItem[];
}

export function useLayoutContext() {
  return useOutletContext<LayoutContext>();
}

export default function MainLayout() {
  const appNavigate = useAppNavigate();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPagoOpen, setIsPagoOpen] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('amasCart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('amasCart', JSON.stringify(cartItems));
  }, [cartItems]);

  const handleNavigate = (page: string, sectionId?: string) => {
    appNavigate(page, sectionId);
  };

  const handleEnrollProgram = (programa?: 'full' | '1mes' | '6meses') => {
    if (programa === 'full') {
      handleNavigate('registro-3-meses');
    } else if (programa === '6meses') {
      handleNavigate('registro-6-meses');
    } else if (programa === '1mes') {
      handleNavigate('registro-mensual');
    } else {
      handleNavigate('registro-leadership');
    }
  };

  const handleAddToCart = (product: any, variant: string = 'default', quantity: number = 1) => {
    const existingItemIndex = cartItems.findIndex(
      item => item.id === product.id && item.variant === variant
    );

    if (existingItemIndex >= 0) {
      const newCart = [...cartItems];
      newCart[existingItemIndex].quantity += quantity;
      setCartItems(newCart);
    } else {
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image || product.images?.[0],
        variant: variant,
        quantity: quantity
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const handleUpdateQuantity = (id: string, variant: string, quantity: number) => {
    const newCart = cartItems.map(item =>
      item.id === id && item.variant === variant
        ? { ...item, quantity }
        : item
    );
    setCartItems(newCart);
  };

  const handleRemoveItem = (id: string, variant: string) => {
    setCartItems(cartItems.filter(item => !(item.id === id && item.variant === variant)));
  };

  const handleCheckout = (total: number, items: CartItem[]) => {
    setTotalAmount(total);
    setCheckoutItems(items);
    setIsPagoOpen(true);
  };

  const handleRegistrationSuccess = (total: number) => {
    setTotalAmount(total);
    setIsPagoOpen(true);
  };

  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const context: LayoutContext = {
    onNavigate: handleNavigate,
    onOpenMatricula: handleEnrollProgram,
    onCartClick: () => setIsCartOpen(true),
    cartItemsCount,
    onAddToCart: handleAddToCart,
    onRegistrationSuccess: handleRegistrationSuccess,
    isPagoOpen,
    setIsPagoOpen,
    totalAmount,
    checkoutItems,
    cartItems,
  };

  return (
    <>
      <Outlet context={context} />

      <Suspense fallback={null}>
        <CartDrawerHome
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onCheckout={handleCheckout}
        />
      </Suspense>

      <Suspense fallback={null}>
        <PopupPago
          isOpen={isPagoOpen}
          onClose={() => {
            setIsPagoOpen(false);
            if (checkoutItems.length > 0) {
              setCartItems([]);
              setCheckoutItems([]);
            }
          }}
          totalAmount={totalAmount}
          cartItems={checkoutItems}
        />
      </Suspense>

      <Toaster theme="dark" position="bottom-right" />
      <ScrollRestoration />
    </>
  );
}
