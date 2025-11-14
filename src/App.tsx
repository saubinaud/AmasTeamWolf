import { useState, lazy, Suspense, useEffect } from 'react';
import { HomePage } from './components/HomePage';
import { TiendaPage } from './components/TiendaPage';
import { RegistroTresMesesPage } from './components/RegistroTresMesesPage';
import { RegistroMensualPage } from './components/RegistroMensualPage';
import { RegistroLeadershipPage } from './components/RegistroLeadershipPage';
import { GraduacionPage } from './components/GraduacionPage';
import { LandingConversion } from './components/LandingConversion';
import { HeaderMain } from './components/HeaderMain';
import { HeroLeadershipFinal } from './components/HeroLeadershipFinal';
import { NetworkStatusIndicator } from './components/NetworkStatusIndicator';
import { Toaster } from './components/ui/sonner';
import { CartDrawerHome, CartItem } from './components/CartDrawerHome';
import { PopupPago } from './components/PopupPago';
import { LeadershipProgramCard } from './components/LeadershipProgramCard';
import { FooterMain } from './components/FooterMain';
import { SEO, seoConfigs } from './components/SEO';
import { BreadcrumbSEO, breadcrumbConfigs } from './components/BreadcrumbSEO';

// Lazy load de componentes pesados
const LeadershipTimeline = lazy(() => import('./components/LeadershipTimeline'));
const ImplementsSection = lazy(() => import('./components/ImplementsSection'));

// Componente de carga
function LoadingSection() {
  return (
    <div className="py-20 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#FA7B21] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white/50 text-sm">Cargando...</p>
      </div>
    </div>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'leadership' | 'tienda' | 'registro-3-meses' | 'registro-mensual' | 'registro-leadership' | 'graduacion' | 'conversion'>('home');
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

  // Handle URL routing on mount and popstate
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/leadership') {
        setCurrentPage('leadership');
      } else if (path === '/tienda') {
        setCurrentPage('tienda');
      } else if (path === '/registro-3-meses') {
        setCurrentPage('registro-3-meses');
      } else if (path === '/registro-mensual') {
        setCurrentPage('registro-mensual');
      } else if (path === '/registro-leadership') {
        setCurrentPage('registro-leadership');
      } else if (path === '/graduacion') {
        setCurrentPage('graduacion');
      } else if (path === '/conversion') {
        setCurrentPage('conversion');
      } else {
        setCurrentPage('home');
      }
    };

    // Initial load
    handlePopState();

    // Listen for browser back/forward
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Scroll to top whenever page changes
  useEffect(() => {
    // Triple capa de seguridad para asegurar scroll to top
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [currentPage]);

  const handleNavigate = (page: string) => {
    // Scroll inmediato ANTES de cambiar la página
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    setCurrentPage(page as 'home' | 'leadership' | 'tienda' | 'registro-3-meses' | 'registro-mensual' | 'registro-leadership' | 'graduacion' | 'conversion');
    // Update URL
    const path = page === 'home' ? '/' : `/${page}`;
    window.history.pushState({}, '', path);
  };

  const handleEnrollProgram = () => {
    // Navegar a la página de registro de Leadership
    handleNavigate('registro-leadership');
  };



  const handleAddToCart = (product: any, variant: string = 'default', quantity: number = 1) => {
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

  // Render Home Page
  if (currentPage === 'home') {
    return (
      <>
        <SEO {...seoConfigs.home} />
        <HomePage onNavigate={handleNavigate} />
        <Toaster theme="dark" position="bottom-right" />
      </>
    );
  }

  // Render Tienda Page
  if (currentPage === 'tienda') {
    return (
      <>
        <SEO {...seoConfigs.tienda} />
        <TiendaPage onNavigate={handleNavigate} />
        <Toaster theme="dark" position="bottom-right" />
      </>
    );
  }

  // Render Registro 3 Meses Page
  if (currentPage === 'registro-3-meses') {
    return (
      <>
        <SEO 
          title="Matrícula Programa 3 Meses - AMAS Team Wolf"
          description="Matricúlate en el Programa Full de 3 meses de AMAS Team Wolf. Incluye uniforme, graduación y certificado oficial. ¡Inscripción abierta!"
          keywords="matrícula taekwondo, inscripción artes marciales Lima, programa 3 meses AMAS, registro taekwondo niños"
          url="https://amasteamwolf.com/registro-3-meses"
        />
        <RegistroTresMesesPage 
          onNavigateHome={() => handleNavigate('home')}
          onSuccess={handleRegistrationSuccess}
        />
        <Toaster theme="dark" position="bottom-right" />
        
        {/* Popup de Pago */}
        <PopupPago
          isOpen={isPagoOpen}
          onClose={() => {
            setIsPagoOpen(false);
            // Navegar al home después de cerrar el popup de pago
            handleNavigate('home');
          }}
          totalAmount={totalAmount}
          cartItems={[]}
        />
      </>
    );
  }

  // Render Registro Mensual Page
  if (currentPage === 'registro-mensual') {
    return (
      <>
        <SEO 
          title="Matrícula Programa Mensual - AMAS Team Wolf"
          description="Matricúlate en el Programa Mensual de AMAS Team Wolf. Ideal para comenzar con flexibilidad. ¡Inscripción abierta!"
          keywords="matrícula mensual taekwondo, programa 1 mes artes marciales, inscripción flexible AMAS"
          url="https://amasteamwolf.com/registro-mensual"
        />
        <RegistroMensualPage 
          onNavigateHome={() => handleNavigate('home')}
          onSuccess={handleRegistrationSuccess}
        />
        <Toaster theme="dark" position="bottom-right" />
        
        {/* Popup de Pago */}
        <PopupPago
          isOpen={isPagoOpen}
          onClose={() => {
            setIsPagoOpen(false);
            // Navegar al home después de cerrar el popup de pago
            handleNavigate('home');
          }}
          totalAmount={totalAmount}
          cartItems={[]}
        />
      </>
    );
  }

  // Render Registro Leadership Page
  if (currentPage === 'registro-leadership') {
    return (
      <>
        <SEO 
          title="Matrícula Leadership Wolf - AMAS Team Wolf"
          description="Inscríbete en el programa Leadership Wolf. Formación integral en liderazgo y artes marciales. Incluye 12 hitos de desarrollo personal."
          keywords="matrícula leadership wolf, inscripción programa liderazgo, leadership AMAS Team Wolf"
          url="https://amasteamwolf.com/registro-leadership"
        />
        <RegistroLeadershipPage 
          onNavigateHome={() => handleNavigate('home')}
          onSuccess={handleRegistrationSuccess}
        />
        <Toaster theme="dark" position="bottom-right" />
        
        {/* Popup de Pago */}
        <PopupPago
          isOpen={isPagoOpen}
          onClose={() => {
            setIsPagoOpen(false);
            // Navegar al home después de cerrar el popup de pago
            handleNavigate('home');
          }}
          totalAmount={totalAmount}
          cartItems={[]}
        />
      </>
    );
  }

  // Render Graduacion Page
  if (currentPage === 'graduacion') {
    return (
      <>
        <SEO {...seoConfigs.graduacion} />
        <GraduacionPage onNavigate={handleNavigate} />
        <Toaster theme="dark" position="bottom-right" />
      </>
    );
  }

  // Render Conversion Page
  if (currentPage === 'conversion') {
    return (
      <>
        <SEO {...seoConfigs.conversion} />
        <LandingConversion onNavigate={handleNavigate} />
        <Toaster theme="dark" position="bottom-right" />
      </>
    );
  }

  // Render Leadership Page
  return (
    <div className="min-h-screen relative overflow-hidden">
      <SEO {...seoConfigs.leadership} />
      {/* Advanced Gradient Background - igual que el home */}
      <div className="fixed inset-0 z-0 pointer-events-none">
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
          onNavigate={handleNavigate}
          onOpenMatricula={handleEnrollProgram}
          onCartClick={() => setIsCartOpen(true)}
          cartItemsCount={cartItemsCount}
        />
        
        <NetworkStatusIndicator />
        
        <HeroLeadershipFinal />
        
        <Suspense fallback={<LoadingSection />}>
          <LeadershipTimeline />
        </Suspense>
        
        <Suspense fallback={<LoadingSection />}>
          <ImplementsSection />
        </Suspense>

        {/* Program Enrollment Card */}
        <LeadershipProgramCard onEnrollClick={handleEnrollProgram} />
        
        <FooterMain 
          onNavigate={handleNavigate}
          onOpenMatricula={handleEnrollProgram}
        />

        {/* Cart Drawer */}
        <CartDrawerHome
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onCheckout={handleCheckout}
        />

        {/* Popup de Pago */}
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
      </div>

      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}

export default App;