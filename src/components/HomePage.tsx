import { useState, useEffect, useCallback } from 'react';
import { HeaderMain } from './HeaderMain';
import { HeroHome } from './HeroHome';
import { ProgramasSection } from './ProgramasSection';
import { TiendaSection } from './TiendaSection';
import { Implement } from '../data/implements';
import { NosotrosSection } from './NosotrosSection';
import { FooterMain } from './FooterMain';
import { PopupPago } from './PopupPago';
import { CartDrawerHome, CartItem } from './CartDrawerHome';
import { NetworkStatusIndicator } from './NetworkStatusIndicator';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [isPagoOpen, setIsPagoOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);

  // Scroll to top when component mounts
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

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

  const handleOpenMatricula = useCallback((programa: 'full' | '1mes' | '6meses' = 'full') => {
    // Navegar a la página de registro correspondiente
    if (programa === 'full') {
      onNavigate('registro-3-meses');
    } else if (programa === '6meses') {
      onNavigate('registro-6-meses');
    } else {
      onNavigate('registro-mensual');
    }
  }, [onNavigate]);



  const handleAddToCart = useCallback((product: Implement, variant: string, quantity: number) => {
    const existingItemIndex = cartItems.findIndex(
      item => item.id === product.id && item.variant === variant
    );

    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      const newCart = [...cartItems];
      newCart[existingItemIndex].quantity += quantity;
      setCartItems(newCart);
    } else {
      // Add new item
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        variant: variant,
        quantity: quantity
      };
      setCartItems([...cartItems, newItem]);
    }
  }, [cartItems]);

  const handleUpdateQuantity = useCallback((id: string, variant: string, quantity: number) => {
    const newCart = cartItems.map(item =>
      item.id === id && item.variant === variant
        ? { ...item, quantity }
        : item
    );
    setCartItems(newCart);
  }, [cartItems]);

  const handleRemoveItem = useCallback((id: string, variant: string) => {
    setCartItems(prev => prev.filter(item => !(item.id === id && item.variant === variant)));
  }, []);

  const handleCheckout = useCallback((total: number, items: CartItem[]) => {
    setTotalAmount(total);
    setCheckoutItems(items);
    setIsCartOpen(false);
    setTimeout(() => {
      setIsPagoOpen(true);
    }, 150);
  }, []);

  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Advanced Gradient Background - igual que el hero */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black" />
        
        {/* Animated gradient overlays */}
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
        
        {/* Grid pattern overlay */}
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

      {/* Contenido con z-index superior */}
      <div className="relative z-10">
        <HeaderMain 
          onNavigate={onNavigate}
          onOpenMatricula={() => handleOpenMatricula('full')}
          onCartClick={() => setIsCartOpen(true)}
          cartItemsCount={cartItemsCount}
        />
        
        <NetworkStatusIndicator />
        
        <HeroHome onOpenMatricula={() => handleOpenMatricula('full')} />
        
        <ProgramasSection onOpenMatricula={handleOpenMatricula} />
        
        <TiendaSection onAddToCart={handleAddToCart} onNavigate={onNavigate} />
        
        <NosotrosSection />
        
        <FooterMain 
          onNavigate={onNavigate}
          onOpenMatricula={() => handleOpenMatricula('full')}
        />
      </div>

      {/* Modals */}
      <PopupPago
        isOpen={isPagoOpen}
        onClose={() => {
          setIsPagoOpen(false);
          // Limpiar el carrito después de proceder al pago
          if (checkoutItems.length > 0) {
            setCartItems([]);
            setCheckoutItems([]);
          }
        }}
        totalAmount={totalAmount}
        cartItems={checkoutItems}
      />

      <CartDrawerHome
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />
    </div>
  );
}