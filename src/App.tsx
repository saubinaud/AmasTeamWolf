import { useState, lazy, Suspense, useEffect } from 'react';
import { HomePage } from './components/HomePage';
import { LandingConversion } from './components/LandingConversion';
import { InicioSesionPage } from './components/InicioSesionPage';
import { LogtoCallback } from './components/LogtoCallback';
import { AuthGuard } from './components/AuthGuard';

import { HeaderMain } from './components/HeaderMain';
import { HeroLeadershipFinal } from './components/HeroLeadershipFinal';
import { NetworkStatusIndicator } from './components/NetworkStatusIndicator';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { CartDrawerHome, CartItem } from './components/CartDrawerHome';
import { PopupPago } from './components/PopupPago';
import { LeadershipProgramCard } from './components/LeadershipProgramCard';
import { FooterMain } from './components/FooterMain';
import { SEO, seoConfigs } from './components/SEO';
import { BreadcrumbSEO, breadcrumbConfigs } from './components/BreadcrumbSEO';

// Lazy load de componentes pesados (secciones de la landing de leadership)
const LeadershipTimeline = lazy(() => import('./components/LeadershipTimeline'));
const ImplementsSection = lazy(() => import('./components/ImplementsSection'));

// Lazy load de paginas - se cargan bajo demanda para reducir el bundle inicial
const TiendaPage = lazy(() => import('./components/TiendaPage').then(m => ({ default: m.TiendaPage })));
const RegistroTresMesesPage = lazy(() => import('./components/RegistroTresMesesPage').then(m => ({ default: m.RegistroTresMesesPage })));
const RegistroSeisMesesPage = lazy(() => import('./components/RegistroSeisMesesPage').then(m => ({ default: m.RegistroSeisMesesPage })));
const RegistroMensualPage = lazy(() => import('./components/RegistroMensualPage').then(m => ({ default: m.RegistroMensualPage })));
const RegistroLeadershipPage = lazy(() => import('./components/RegistroLeadershipPage').then(m => ({ default: m.RegistroLeadershipPage })));
const GraduacionPage = lazy(() => import('./components/GraduacionPage').then(m => ({ default: m.GraduacionPage })));
const PerfilPage = lazy(() => import('./components/PerfilPage').then(m => ({ default: m.PerfilPage })));
const RenovacionNavidadPage = lazy(() => import('./components/RenovacionNavidadPage').then(m => ({ default: m.RenovacionNavidadPage })));
const RegistroActividadNavidadPage = lazy(() => import('./components/RegistroActividadNavidadPage').then(m => ({ default: m.RegistroActividadNavidadPage })));
const RegistroShowroomPage = lazy(() => import('./components/RegistroShowroomPage').then(m => ({ default: m.RegistroShowroomPage })));
const RenovacionPage = lazy(() => import('./pages/RenovacionPage').then(m => ({ default: m.RenovacionPage })));
const TerminosCondicionesPage = lazy(() => import('./components/TerminosCondicionesPage').then(m => ({ default: m.TerminosCondicionesPage })));
const VincularCuentaPage = lazy(() => import('./components/VincularCuentaPage').then(m => ({ default: m.VincularCuentaPage })));
const TorneoPage = lazy(() => import('./components/TorneoPage').then(m => ({ default: m.TorneoPage })));
const AsistenciaPage = lazy(() => import('./components/AsistenciaPage').then(m => ({ default: m.AsistenciaPage })));
const AsistenciaPanelPage = lazy(() => import('./components/AsistenciaPanelPage').then(m => ({ default: m.AsistenciaPanelPage })));

// Componente de carga para secciones inline
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

// Componente de carga para paginas completas
function LoadingPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 border-4 border-[#FA7B21] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white/60 text-sm font-medium">Cargando...</p>
      </div>
    </div>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'leadership' | 'tienda' | 'registro-3-meses' | 'registro-6-meses' | 'registro-mensual' | 'registro-leadership' | 'graduacion' | 'clase-prueba' | 'inicio-sesion' | 'perfil' | 'renovacion-navidad' | 'registro-actividad-navidad' | 'registro-showroom' | 'renovacion' | 'callback' | 'terminos' | 'vincular-cuenta' | 'torneo' | 'asistencia' | 'asistencia-panel'>('home');

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPagoOpen, setIsPagoOpen] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);

  // --- FUNCIÓN: SCROLL ROBUSTO (POLLING) ---
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
      } else if (path === '/registro-6-meses') {
        setCurrentPage('registro-6-meses');
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
      } else if (path === '/showroom' || path === '/registro-showroom') {
        setCurrentPage('registro-showroom');
      } else if (path === '/renovacion' || path === '/renovar') {
        setCurrentPage('renovacion');
      } else if (path === '/callback') {
        setCurrentPage('callback');
      } else if (path === '/terminos' || path === '/terminos-condiciones') {
        setCurrentPage('terminos');
      } else if (path === '/vincular-cuenta' || path === '/vincular') {
        setCurrentPage('vincular-cuenta');
      } else if (path === '/torneo') {
        setCurrentPage('torneo');
      } else if (path === '/asistencia/panel' || path === '/asistencia/profesora') {
        setCurrentPage('asistencia-panel');
      } else if (path === '/asistencia') {
        setCurrentPage('asistencia');
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
    // Solo hacer scroll top si NO hay una sección específica en la URL
    // Esto evita que el "scroll top" cancele el "scroll a sección"
    const urlParams = new URLSearchParams(window.location.search);
    const sectionParam = urlParams.get('section');

    if (!sectionParam) {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [currentPage]);

  // Acepta sectionId opcional
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
      <Suspense fallback={<LoadingPage />}>
        <SEO {...seoConfigs.tienda} />
        <TiendaPage onNavigate={handleNavigate} />
        <Toaster theme="dark" position="bottom-right" />
      </Suspense>
    );
  }

  if (currentPage === 'registro-3-meses') {
    return (
      <Suspense fallback={<LoadingPage />}>
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
      </Suspense>
    );
  }

  if (currentPage === 'registro-6-meses') {
    return (
      <Suspense fallback={<LoadingPage />}>
        <SEO
          title="Matrícula Programa 6 Meses - AMAS Team Wolf"
          description="Matricúlate en el Programa de 6 meses de AMAS Team Wolf. Incluye uniforme, 2 graduaciones, seguimiento personalizado y más. ¡Inscripción abierta!"
          keywords="matrícula taekwondo, inscripción artes marciales Lima, programa 6 meses AMAS, registro taekwondo niños, programa semestral"
          url="https://amasteamwolf.com/registro-6-meses"
        />
        <RegistroSeisMesesPage
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
      </Suspense>
    );
  }

  if (currentPage === 'registro-mensual') {
    return (
      <Suspense fallback={<LoadingPage />}>
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
      </Suspense>
    );
  }

  if (currentPage === 'registro-leadership') {
    return (
      <Suspense fallback={<LoadingPage />}>
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
      </Suspense>
    );
  }

  if (currentPage === 'graduacion') {
    return (
      <Suspense fallback={<LoadingPage />}>
        <SEO {...seoConfigs.graduacion} />
        <GraduacionPage onNavigate={handleNavigate} />
        <Toaster theme="dark" position="bottom-right" />
      </Suspense>
    );
  }

  if (currentPage === 'clase-prueba') {
    return (
      <>
        <SEO {...seoConfigs.clasePrueba} />
        <LandingConversion
          onNavigate={handleNavigate}
          onOpenMatricula={handleEnrollProgram}
          onCartClick={() => setIsCartOpen(true)}
          cartItemsCount={cartItemsCount}
        />
        <Toaster theme="dark" position="bottom-right" />
      </>
    );
  }

  // Logto OAuth Callback page
  if (currentPage === 'callback') {
    return (
      <LogtoCallback
        onNavigate={handleNavigate}
        onLoadProfile={async (authId, email) => {
          // Profile loading is handled in AuthContext
          // Profile loading is handled in AuthContext
        }}
      />
    );
  }

  if (currentPage === 'terminos') {
    return (
      <Suspense fallback={<LoadingPage />}>
        <SEO
          title="Términos y Condiciones - AMAS Team Wolf"
          description="Términos y condiciones de uso del sitio web de la Academia de Artes Marciales AMAS."
          keywords="terminos condiciones, politica privacidad, academia amas"
          url="https://amasteamwolf.com/terminos"
        />
        <TerminosCondicionesPage onNavigate={handleNavigate} />
        <Toaster theme="dark" position="bottom-right" />
      </Suspense>
    );
  }

  if (currentPage === 'vincular-cuenta') {
    return (
      <Suspense fallback={<LoadingPage />}>
        <SEO
          title="Vincular Cuenta - AMAS Team Wolf"
          description="Vincula tu cuenta con tu perfil de alumno en AMAS Team Wolf."
          keywords="vincular cuenta, conectar perfil, amas team wolf"
          url="https://amasteamwolf.com/vincular-cuenta"
        />
        <VincularCuentaPage onNavigate={handleNavigate} />
        <Toaster theme="dark" position="bottom-right" />
      </Suspense>
    );
  }

  if (currentPage === 'torneo') {
    return (
      <Suspense fallback={<LoadingPage />}>
        <SEO
          title="Torneo de Taekwondo - Inscripción | AMAS Team Wolf"
          description="Inscribe a tu hijo en el próximo torneo de taekwondo AMAS Team Wolf. Registro rápido, múltiples modalidades y una experiencia que recordarán siempre."
          keywords="torneo taekwondo Lima, inscripción torneo artes marciales, competencia taekwondo niños, torneo AMAS Team Wolf"
          url="https://amasteamwolf.com/torneo"
        />
        <TorneoPage
          onNavigate={handleNavigate}
          onOpenMatricula={handleEnrollProgram}
          onCartClick={() => setIsCartOpen(true)}
          cartItemsCount={cartItemsCount}
        />
        <Toaster theme="dark" position="bottom-right" />
      </Suspense>
    );
  }

  if (currentPage === 'asistencia-panel') {
    return (
      <Suspense fallback={<LoadingPage />}>
        <SEO
          title="Panel de Asistencia - AMAS Team Wolf"
          description="Panel de control de asistencias para profesoras."
          keywords="panel asistencia amas"
          url="https://amasteamwolf.com/asistencia/panel"
        />
        <AsistenciaPanelPage onNavigate={handleNavigate} />
        <Toaster theme="dark" position="bottom-right" />
      </Suspense>
    );
  }

  if (currentPage === 'asistencia') {
    return (
      <Suspense fallback={<LoadingPage />}>
        <SEO
          title="Registro de Asistencia - AMAS Team Wolf"
          description="Registra tu asistencia escaneando el código QR en la sede."
          keywords="asistencia amas, registro asistencia taekwondo, QR asistencia"
          url="https://amasteamwolf.com/asistencia"
        />
        <AsistenciaPage onNavigate={handleNavigate} />
        <Toaster theme="dark" position="bottom-right" />
      </Suspense>
    );
  }

  if (currentPage === 'inicio-sesion') {
    return (
      <AuthGuard onNavigate={handleNavigate} redirectIfAuth={true}>
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
      </AuthGuard>
    );
  }

  if (currentPage === 'perfil') {
    return (
      <AuthGuard onNavigate={handleNavigate} requireAuth={true}>
        <Suspense fallback={<LoadingPage />}>
          <SEO
            title="Mi Perfil - AMAS Team Wolf"
            description="Panel de familia AMAS Team Wolf. Consulta tus clases, pagos, matrícula y notificaciones."
            keywords="perfil amas, panel familias, mis clases"
            url="https://amasteamwolf.com/perfil"
          />
          <PerfilPage onNavigate={handleNavigate} />
          <Toaster theme="dark" position="bottom-right" />
        </Suspense>
      </AuthGuard>
    );
  }

  if (currentPage === 'renovacion-navidad') {
    return (
      <Suspense fallback={<LoadingPage />}>
        <SEO
          title="Renovación Navidad - AMAS Team Wolf"
          description="Renueva tu membresía anticipadamente y recibe beneficios exclusivos de temporada navideña. Días extras y promociones especiales para familias AMAS."
          keywords="renovación navidad, renovación anticipada, promoción navideña AMAS, beneficios navidad taekwondo"
          url="https://amasteamwolf.com/renovacion-navidad"
        />
        <RenovacionNavidadPage
          onNavigate={handleNavigate}
          onOpenMatricula={handleEnrollProgram}
          onCartClick={() => setIsCartOpen(true)}
          cartItemsCount={cartItemsCount}
        />
        <Toaster theme="dark" position="bottom-right" />
      </Suspense>
    );
  }

  if (currentPage === 'renovacion') {
    return (
      <Suspense fallback={<LoadingPage />}>
        <SEO
          title="Renovación de Membresía - AMAS Team Wolf"
          description="Renueva tu membresía de AMAS Team Wolf. Elige entre programas de 1, 3 o 6 meses. Continúa tu entrenamiento sin interrupciones."
          keywords="renovación membresía, renovar inscripción taekwondo, renovación AMAS, continuar programa artes marciales"
          url="https://amasteamwolf.com/renovacion"
        />
        <RenovacionPage
          onNavigateHome={() => handleNavigate('home')}
          onNavigate={handleNavigate}
          onOpenMatricula={handleEnrollProgram}
          onCartClick={() => setIsCartOpen(true)}
          cartItemsCount={cartItemsCount}
          onSuccess={() => {
            toast.success('¡Renovación exitosa!');
            handleNavigate('home');
          }}
        />
        <Toaster theme="dark" position="bottom-right" />
      </Suspense>
    );
  }

  if (currentPage === 'registro-actividad-navidad') {
    return (
      <Suspense fallback={<LoadingPage />}>
        <SEO
          title="Gran Clausura Navideña - AMAS Team Wolf"
          description="Celebra con nosotros el cierre del año. Confirma tu asistencia y participa en el intercambio de regalos."
          keywords="navidad amas team wolf, clausura taekwondo, fiesta navidad academia"
          url="https://amasteamwolf.com/navidad"
          image="https://res.cloudinary.com/dkoocok3j/image/upload/v1763124726/Academia_Medalla_Photo_copy_desesj.jpg"
        />

        {/* MODIFICADO: Pasamos todas las props y añadimos los componentes de carrito/pago */}
        <RegistroActividadNavidadPage
          onNavigate={handleNavigate}
          onOpenMatricula={handleEnrollProgram}
          onCartClick={() => setIsCartOpen(true)}
          cartItemsCount={cartItemsCount}
        />

        <Toaster theme="dark" position="bottom-right" />

        {/* Componentes para que funcione el header en esta página */}
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
      </Suspense>
    );
  }

  if (currentPage === 'registro-showroom') {
    return (
      <Suspense fallback={<LoadingPage />}>
        <SEO
          title="Showroom AMAS Team Wolf - Conoce Nuestras Instalaciones"
          description="Regístrate para asistir al Showroom de AMAS Team Wolf. Conoce nuestras instalaciones, profesoras y programa de formación integral."
          keywords="showroom amas team wolf, visita instalaciones taekwondo, conocer academia artes marciales, showroom San Borja"
          url="https://amasteamwolf.com/showroom"
          image="https://res.cloudinary.com/dkoocok3j/image/upload/v1763124726/Academia_Medalla_Photo_copy_desesj.jpg"
        />

        <RegistroShowroomPage
          onNavigate={handleNavigate}
          onOpenMatricula={handleEnrollProgram}
          onCartClick={() => setIsCartOpen(true)}
          cartItemsCount={cartItemsCount}
        />

        <Toaster theme="dark" position="bottom-right" />

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
      </Suspense>
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
