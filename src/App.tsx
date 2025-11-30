import { useState, lazy, Suspense, useEffect } from 'react';
import { HomePage } from './components/HomePage';
import { TiendaPage } from './components/TiendaPage';
import { RegistroTresMesesPage } from './components/RegistroTresMesesPage';
import { RegistroMensualPage } from './components/RegistroMensualPage';
import { RegistroLeadershipPage } from './components/RegistroLeadershipPage';
import { GraduacionPage } from './components/GraduacionPage';
import { LandingConversion } from './components/LandingConversion';
import { InicioSesionPage } from './components/InicioSesionPage';
import { PerfilPage } from './components/PerfilPage';
import { RenovacionNavidadPage } from './components/RenovacionNavidadPage';
import { RegistroActividadNavidadPage } from './components/RegistroActividadNavidadPage';

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
  const [currentPage, setCurrentPage] = useState<'home' | 'leadership' | 'tienda' | 'registro-3-meses' | 'registro-mensual' | 'registro-leadership' | 'graduacion' | 'clase-prueba' | 'inicio-sesion' | 'perfil' | 'renovacion-navidad' | 'registro-actividad-navidad'>('home');
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPagoOpen, setIsPagoOpen] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);

  // --- NUEVA FUNCIÓN: SCROLL ROBUSTO (POLLING) ---
  // Busca el elemento repetidamente hasta que aparece (máx 2.5 seg)
  const robustScrollToSection = (sectionId: string) => {
    let intentos = 0;
    const maxIntentos = 25; // 25 * 100ms = 2.5 segundos

    const buscar = () => {
      const element = document.getElementById(sectionId);
      if (element) {
        // Offset para el header fijo (aprox 80px)
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      } else if (intentos < maxIntentos) {
        intentos++;
        setTimeout(buscar, 100); // Reintentar en 100ms
      }
    };
    
    // Iniciar búsqueda
    buscar();
  };
  // ------------------------------------------------

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
      // Check for redirect from 404.html
      const urlParams = new URLSearchParams(window.location.search);
      const redirectPath = urlParams.get('redirect') || sessionStorage.getItem('redirectPath');
      // Detectar sección en URL (ej: ?section=tienda)
      const sectionParam = urlParams.get('section');

      if (redirectPath) {
        sessionStorage.removeItem('redirectPath');
        window.history.replaceState({}, '', redirectPath);
      }

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
      } else if (path === '/clase-prueba') {
        setCurrentPage('clase-prueba');
      } else if (path === '/inicio-sesion') {
        setCurrentPage('inicio-sesion');
      } else if (path === '/perfil') {
        setCurrentPage('perfil');
      } else if (path === '/renovacion-navidad' || path === '/renueva-diciembre') {
        setCurrentPage('renovacion-navidad');
      } else if (path === '/navidad' || path === '/evento-navidad') {
        setCurrentPage('registro-actividad-navidad');
      } else {
        setCurrentPage('home');
        // Si estamos en home y hay sección, activar scroll robusto
        if (sectionParam) {
           setTimeout(() => robustScrollToSection(sectionParam), 100);
        }
      }
    };

    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Scroll to top whenever page changes
  useEffect(() => {
    // MODIFICADO: Solo hacer scroll top si NO hay una sección específica en la URL
    // Esto evita que el "scroll top" cancele el "scroll a sección"
    const urlParams = new URLSearchParams(window.location.search);
    const sectionParam = urlParams.get('section');

    if (!sectionParam) {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [currentPage]);

  // MODIFICADO: Acepta sectionId opcional
  const handleNavigate = (page: string, sectionId?: string) => {
    // 1. Actualizar estado de página
    setCurrentPage(page as any);
    
    // 2. Construir path y query params
    let path = '/';
    if (page === 'home') {
      path = '/';
    } else if (page === 'registro-actividad-navidad') {
      path = '/navidad';
    } else {
      path = `/${page}`;
    }
    
    // Si hay sección, agregarla a la URL (ej: /?section=tienda)
    if (sectionId) {
      path += `?section=${sectionId}`;
    } else {
      // Si no hay sección, forzar scroll arriba inmediatamente
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    
    window.history.pushState({}, '', path);

    // 3. Ejecutar scroll inteligente si hay sección
    if (sectionId) {
      robustScrollToSection(sectionId);
    }
  };

  const handleEnrollProgram = () => {
    handleNavigate('registro-leadership');
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

  // --- RENDERS ---

  if (currentPage === 'home') {
    return (
      <>
        <SEO {...seoConfigs.home} />
        {/* Pasamos handleNavigate tal cual, ahora acepta (page, sectionId) */}
        <HomePage onNavigate={handleNavigate} />
        <Toaster theme="dark" position="bottom-right" />
      </>
    );
  }

  if (currentPage === 'tienda') {
    return (
      <>
        <SEO {...seoConfigs.tienda} />
        <TiendaPage onNavigate={handleNavigate} />
        <Toaster theme="dark" position="bottom-right" />
      </>
    );
  }

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
        <PopupPago
          isOpen={isPagoOpen}
          onClose={() => {
            setIsPagoOpen(false);
            handleNavigate('home');
          }}
          totalAmount={totalAmount}
          cartItems={[]}
        />
      </>
    );
  }

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
        <PopupPago
          isOpen={isPagoOpen}
          onClose={() => {
            setIsPagoOpen(false);
            handleNavigate('home');
          }}
          totalAmount={totalAmount}
          cartItems={[]}
        />
      </>
    );
  }

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
        <PopupPago
          isOpen={isPagoOpen}
          onClose={() => {
            setIsPagoOpen(false);
            handleNavigate('home');
          }}
          totalAmount={totalAmount}
          cartItems={[]}
        />
      </>
    );
  }

  if (currentPage === 'graduacion') {
    return (
      <>
        <SEO {...seoConfigs.graduacion} />
        <GraduacionPage onNavigate={handleNavigate} />
        <Toaster theme="dark" position="bottom-right" />
      </>
    );
  }

  if (currentPage === 'clase-prueba') {
    return (
      <>
        <SEO {...seoConfigs.clasePrueba} />
        <LandingConversion onNavigate={handleNavigate} />
        <Toaster theme="dark" position="bottom-right" />
      </>
    );
  }

  if (currentPage === 'inicio-sesion') {
    return (
      <>
        <SEO
          title="Iniciar Sesión - AMAS Team Wolf"
          description="Acceso para familias de AMAS Team Wolf. Revisa tus clases, pagos y más."
          keywords="login amas, acceso familias, portal estudiantes"
          url="https://amasteamwolf.com/inicio-sesion"
        />
        <InicioSesionPage onNavigate={handleNavigate} />
        <Toaster theme="dark" position="bottom-right" />
      </>
    );
  }

  if (currentPage === 'perfil') {
    return (
      <>
        <SEO
          title="Mi Perfil - AMAS Team Wolf"
          description="Panel de familia AMAS Team Wolf. Consulta tus clases, pagos, matrícula y notificaciones."
          keywords="perfil amas, panel familias, mis clases"
          url="https://amasteamwolf.com/perfil"
        />
        <PerfilPage onNavigate={handleNavigate} />
        <Toaster theme="dark" position="bottom-right" />
      </>
    );
  }

  if (currentPage === 'renovacion-navidad') {
    return (
      <>
        <SEO
          title="Renovación Navidad - AMAS Team Wolf"
          description="Renueva tu membresía anticipadamente y recibe beneficios exclusivos de temporada navideña. Días extras y promociones especiales para familias AMAS."
          keywords="renovación navidad, renovación anticipada, promoción navideña AMAS, beneficios navidad taekwondo"
          url="https://amasteamwolf.com/renovacion-navidad"
        />
        <RenovacionNavidadPage onNavigate={handleNavigate} />
        <Toaster theme="dark" position="bottom-right" />
      </>
    );
  }

  if (currentPage === 'registro-actividad-navidad') {
    return (
      <>
        <SEO
          title="Gran Clausura Navideña - AMAS Team Wolf"
          description="Celebra con nosotros el cierre del año. Confirma tu asistencia y participa en el intercambio de regalos."
          keywords="navidad amas team wolf, clausura taekwondo, fiesta navidad academia"
          url="https://amasteamwolf.com/navidad"
          image="https://res.cloudinary.com/dkoocok3j/image/upload/v1763124726/Academia_Medalla_Photo_copy_desesj.jpg"
        />
        <RegistroActividadNavidadPage onNavigate={handleNavigate} />
        <Toaster theme="dark" position="bottom-right" />
      </>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SEO {...seoConfigs.leadership} />
      
      {/* Background Gradients */}
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

        <LeadershipProgramCard onEnrollClick={handleEnrollProgram} />

        <FooterMain
          onNavigate={handleNavigate}
          onOpenMatricula={handleEnrollProgram}
        />

        <CartDrawerHome
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onCheckout={handleCheckout}
        />

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
      </div>

      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}

export default App;
