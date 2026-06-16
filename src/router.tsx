import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout, { useLayoutContext } from './layouts/MainLayout';

// Loading component for page transitions
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

// Error boundary for lazy loading
class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-white text-lg mb-2">Error al cargar la página</p>
            <p className="text-white/50 text-sm mb-6">Revisa tu conexión a internet</p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              className="px-6 py-3 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white font-semibold rounded-xl active:scale-95 transition-all"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy page imports
const HomePage = lazy(() => import('./components/HomePage').then(m => ({ default: m.HomePage })));
const HeaderMain = lazy(() => import('./components/HeaderMain').then(m => ({ default: m.HeaderMain })));
const FooterMain = lazy(() => import('./components/FooterMain').then(m => ({ default: m.FooterMain })));
const LandingConversion = lazy(() => import('./components/landing').then(m => ({ default: m.LandingConversion })));
const InicioSesionPage = lazy(() => import('./components/InicioSesionPage').then(m => ({ default: m.InicioSesionPage })));
const AuthGuard = lazy(() => import('./components/AuthGuard').then(m => ({ default: m.AuthGuard })));
const HeroLeadershipFinal = lazy(() => import('./components/HeroLeadershipFinal').then(m => ({ default: m.HeroLeadershipFinal })));
const LeadershipProgramCard = lazy(() => import('./components/LeadershipProgramCard').then(m => ({ default: m.LeadershipProgramCard })));
const NetworkStatusIndicator = lazy(() => import('./components/NetworkStatusIndicator').then(m => ({ default: m.NetworkStatusIndicator })));
const SEO = lazy(() => import('./components/SEO').then(m => ({ default: m.SEO })));
const LeadershipTimeline = lazy(() => import('./components/LeadershipTimeline'));
const ImplementsSection = lazy(() => import('./components/ImplementsSection'));

const TiendaPage = lazy(() => import('./components/TiendaPage').then(m => ({ default: m.TiendaPage })));
const RegistroTresMesesPage = lazy(() => import('./components/RegistroTresMesesPage').then(m => ({ default: m.RegistroTresMesesPage })));
const RegistroSeisMesesPage = lazy(() => import('./components/RegistroSeisMesesPage').then(m => ({ default: m.RegistroSeisMesesPage })));
const RegistroMensualPage = lazy(() => import('./components/RegistroMensualPage').then(m => ({ default: m.RegistroMensualPage })));
const RegistroLeadershipPage = lazy(() => import('./components/RegistroLeadershipPage').then(m => ({ default: m.RegistroLeadershipPage })));
const GraduacionPage = lazy(() => import('./components/GraduacionPage').then(m => ({ default: m.GraduacionPage })));
const PerfilPage = lazy(() => import('./components/perfil').then(m => ({ default: m.PerfilPage })));
const RenovacionNavidadPage = lazy(() => import('./components/RenovacionNavidadPage').then(m => ({ default: m.RenovacionNavidadPage })));
const RegistroActividadNavidadPage = lazy(() => import('./components/RegistroActividadNavidadPage').then(m => ({ default: m.RegistroActividadNavidadPage })));
const RegistroShowroomPage = lazy(() => import('./components/RegistroShowroomPage').then(m => ({ default: m.RegistroShowroomPage })));
const RenovacionPage = lazy(() => import('./pages/RenovacionPage').then(m => ({ default: m.RenovacionPage })));
const TerminosCondicionesPage = lazy(() => import('./components/TerminosCondicionesPage').then(m => ({ default: m.TerminosCondicionesPage })));
const TorneoPage = lazy(() => import('./components/TorneoPage').then(m => ({ default: m.TorneoPage })));
const AsistenciaPage = lazy(() => import('./components/AsistenciaPage').then(m => ({ default: m.AsistenciaPage })));
const AsistenciaPanelPage = lazy(() => import('./components/AsistenciaPanelPage').then(m => ({ default: m.AsistenciaPanelPage })));
const ConsultaAsistenciaPage = lazy(() => import('./components/ConsultaAsistenciaPage').then(m => ({ default: m.ConsultaAsistenciaPage })));
const MarcadorPage = lazy(() => import('./components/MarcadorPage').then(m => ({ default: m.MarcadorPage })));
const RutaGuerrero = lazy(() => import('./components/aula').then(m => ({ default: m.RutaGuerrero })));
const FormularioPublicoPage = lazy(() => import('./components/FormularioPublicoPage'));

// SEO configs
import { seoConfigs } from './components/SEO';

// Loading section (inline sections within leadership page)
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

// --- Route wrapper components ---
// These components use the layout context to pass props to page components
// without modifying the page components themselves.

function HomeRoute() {
  const { onNavigate } = useLayoutContext();
  return (
    <LazyErrorBoundary>
      <Suspense fallback={<LoadingPage />}>
        <SEO {...seoConfigs.home} />
        <HomePage onNavigate={onNavigate} />
      </Suspense>
    </LazyErrorBoundary>
  );
}

function LeadershipRoute() {
  const { onNavigate, onOpenMatricula, onCartClick, cartItemsCount } = useLayoutContext();
  return (
    <div className="min-h-screen relative overflow-hidden">
      <SEO {...seoConfigs.leadership} />
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black" />
        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 20% 50%, rgba(250, 123, 33, 0.15) 0%, transparent 50%)' }} />
        <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 80% 50%, rgba(252, 169, 41, 0.2) 0%, transparent 60%)' }} />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`, backgroundSize: '100px 100px' }} />
      </div>
      <div className="relative z-10">
        <LazyErrorBoundary>
          <Suspense fallback={<LoadingPage />}>
            <HeaderMain
              onNavigate={onNavigate}
              onOpenMatricula={onOpenMatricula}
              onCartClick={onCartClick}
              cartItemsCount={cartItemsCount}
              currentPage="leadership"
            />
            <NetworkStatusIndicator />
            <HeroLeadershipFinal />
            <Suspense fallback={<LoadingSection />}>
              <LeadershipTimeline />
            </Suspense>
            <Suspense fallback={<LoadingSection />}>
              <ImplementsSection />
            </Suspense>
            <LeadershipProgramCard onEnrollClick={onOpenMatricula} />
            <FooterMain onNavigate={onNavigate} onOpenMatricula={onOpenMatricula} />
          </Suspense>
        </LazyErrorBoundary>
      </div>
    </div>
  );
}

function TiendaRoute() {
  const { onNavigate } = useLayoutContext();
  return (
    <LazyErrorBoundary><Suspense fallback={<LoadingPage />}>
      <SEO {...seoConfigs.tienda} />
      <TiendaPage onNavigate={onNavigate} />
    </Suspense></LazyErrorBoundary>
  );
}

function RegistroTresMesesRoute() {
  const { onNavigate, onRegistrationSuccess } = useLayoutContext();
  return (
    <LazyErrorBoundary><Suspense fallback={<LoadingPage />}>
      <SEO title="Matrícula Programa 3 Meses - AMAS Team Wolf" description="Matricúlate en el Programa Full de 3 meses de AMAS Team Wolf." keywords="matrícula taekwondo, inscripción artes marciales Lima" url="https://amasteamwolf.com/registro-3-meses" />
      <RegistroTresMesesPage onNavigateHome={() => onNavigate('home')} onSuccess={onRegistrationSuccess} />
    </Suspense></LazyErrorBoundary>
  );
}

function RegistroSeisMesesRoute() {
  const { onNavigate, onRegistrationSuccess } = useLayoutContext();
  return (
    <LazyErrorBoundary><Suspense fallback={<LoadingPage />}>
      <SEO title="Matrícula Programa 6 Meses - AMAS Team Wolf" description="Matricúlate en el Programa de 6 meses de AMAS Team Wolf." keywords="matrícula taekwondo, programa 6 meses AMAS" url="https://amasteamwolf.com/registro-6-meses" />
      <RegistroSeisMesesPage onNavigateHome={() => onNavigate('home')} onSuccess={onRegistrationSuccess} />
    </Suspense></LazyErrorBoundary>
  );
}

function RegistroMensualRoute() {
  const { onNavigate, onRegistrationSuccess } = useLayoutContext();
  return (
    <LazyErrorBoundary><Suspense fallback={<LoadingPage />}>
      <SEO title="Matrícula Programa Mensual - AMAS Team Wolf" description="Matricúlate en el Programa Mensual de AMAS Team Wolf." keywords="matrícula mensual taekwondo" url="https://amasteamwolf.com/registro-mensual" />
      <RegistroMensualPage onNavigateHome={() => onNavigate('home')} onSuccess={onRegistrationSuccess} />
    </Suspense></LazyErrorBoundary>
  );
}

function RegistroLeadershipRoute() {
  const { onNavigate, onRegistrationSuccess } = useLayoutContext();
  return (
    <LazyErrorBoundary><Suspense fallback={<LoadingPage />}>
      <SEO title="Matrícula Leadership Wolf - AMAS Team Wolf" description="Inscríbete en el programa Leadership Wolf." keywords="matrícula leadership wolf" url="https://amasteamwolf.com/registro-leadership" />
      <RegistroLeadershipPage onNavigateHome={() => onNavigate('home')} onSuccess={onRegistrationSuccess} />
    </Suspense></LazyErrorBoundary>
  );
}

function GraduacionRoute() {
  const { onNavigate } = useLayoutContext();
  return (
    <LazyErrorBoundary><Suspense fallback={<LoadingPage />}>
      <SEO {...seoConfigs.graduacion} />
      <GraduacionPage onNavigate={onNavigate} />
    </Suspense></LazyErrorBoundary>
  );
}

function ClasePruebaRoute() {
  const { onNavigate, onOpenMatricula, onCartClick, cartItemsCount } = useLayoutContext();
  return (
    <LazyErrorBoundary><Suspense fallback={<LoadingPage />}>
      <SEO {...seoConfigs.clasePrueba} />
      <LandingConversion onNavigate={onNavigate} onOpenMatricula={onOpenMatricula} onCartClick={onCartClick} cartItemsCount={cartItemsCount} />
    </Suspense></LazyErrorBoundary>
  );
}

function InicioSesionRoute() {
  const { onNavigate } = useLayoutContext();
  return (
    <LazyErrorBoundary><Suspense fallback={<LoadingPage />}>
      <AuthGuard onNavigate={onNavigate} redirectIfAuth={true}>
        <>
          <SEO title="Iniciar Sesión - AMAS Team Wolf" description="Acceso para familias de AMAS Team Wolf." keywords="login amas" url="https://amasteamwolf.com/inicio-sesion" />
          <InicioSesionPage onNavigate={onNavigate} />
        </>
      </AuthGuard>
    </Suspense></LazyErrorBoundary>
  );
}

function PerfilRoute() {
  const { onNavigate } = useLayoutContext();
  return (
    <LazyErrorBoundary><Suspense fallback={<LoadingPage />}>
      <AuthGuard onNavigate={onNavigate} requireAuth={true}>
        <LazyErrorBoundary><Suspense fallback={<LoadingPage />}>
          <SEO title="Mi Perfil - AMAS Team Wolf" description="Panel de familia AMAS Team Wolf." keywords="perfil amas" url="https://amasteamwolf.com/perfil" />
          <PerfilPage onNavigate={onNavigate} />
        </Suspense></LazyErrorBoundary>
      </AuthGuard>
    </Suspense></LazyErrorBoundary>
  );
}

function RenovacionNavidadRoute() {
  const { onNavigate, onOpenMatricula, onCartClick, cartItemsCount } = useLayoutContext();
  return (
    <LazyErrorBoundary><Suspense fallback={<LoadingPage />}>
      <SEO title="Renovación Navidad - AMAS Team Wolf" description="Renueva tu membresía anticipadamente." keywords="renovación navidad" url="https://amasteamwolf.com/renovacion-navidad" />
      <RenovacionNavidadPage onNavigate={onNavigate} onOpenMatricula={onOpenMatricula} onCartClick={onCartClick} cartItemsCount={cartItemsCount} />
    </Suspense></LazyErrorBoundary>
  );
}

function RegistroActividadNavidadRoute() {
  const { onNavigate, onOpenMatricula, onCartClick, cartItemsCount } = useLayoutContext();
  return (
    <LazyErrorBoundary><Suspense fallback={<LoadingPage />}>
      <SEO title="Gran Clausura Navideña - AMAS Team Wolf" description="Celebra con nosotros el cierre del año." keywords="navidad amas team wolf" url="https://amasteamwolf.com/navidad" image="https://res.cloudinary.com/dkoocok3j/image/upload/v1763124726/Academia_Medalla_Photo_copy_desesj.jpg" />
      <RegistroActividadNavidadPage onNavigate={onNavigate} onOpenMatricula={onOpenMatricula} onCartClick={onCartClick} cartItemsCount={cartItemsCount} />
    </Suspense></LazyErrorBoundary>
  );
}

function RegistroShowroomRoute() {
  const { onNavigate, onOpenMatricula, onCartClick, cartItemsCount } = useLayoutContext();
  return (
    <LazyErrorBoundary><Suspense fallback={<LoadingPage />}>
      <SEO title="Showroom AMAS Team Wolf" description="Regístrate para asistir al Showroom de AMAS Team Wolf." keywords="showroom amas team wolf" url="https://amasteamwolf.com/showroom" image="https://res.cloudinary.com/dkoocok3j/image/upload/v1763124726/Academia_Medalla_Photo_copy_desesj.jpg" />
      <RegistroShowroomPage onNavigate={onNavigate} onOpenMatricula={onOpenMatricula} onCartClick={onCartClick} cartItemsCount={cartItemsCount} />
    </Suspense></LazyErrorBoundary>
  );
}

function RenovacionRoute() {
  const { onNavigate, onOpenMatricula, onCartClick, cartItemsCount } = useLayoutContext();
  return (
    <LazyErrorBoundary><Suspense fallback={<LoadingPage />}>
      <SEO title="Renovación de Membresía - AMAS Team Wolf" description="Renueva tu membresía de AMAS Team Wolf." keywords="renovación membresía" url="https://amasteamwolf.com/renovacion" />
      <RenovacionPage
        onNavigateHome={() => onNavigate('home')}
        onNavigate={onNavigate}
        onOpenMatricula={onOpenMatricula}
        onCartClick={onCartClick}
        cartItemsCount={cartItemsCount}
        onSuccess={() => {
          onNavigate('home');
        }}
      />
    </Suspense></LazyErrorBoundary>
  );
}

function TerminosRoute() {
  const { onNavigate } = useLayoutContext();
  return (
    <LazyErrorBoundary><Suspense fallback={<LoadingPage />}>
      <SEO title="Términos y Condiciones - AMAS Team Wolf" description="Términos y condiciones de uso." keywords="terminos condiciones" url="https://amasteamwolf.com/terminos" />
      <TerminosCondicionesPage onNavigate={onNavigate} />
    </Suspense></LazyErrorBoundary>
  );
}

function TorneoRoute() {
  const { onNavigate, onOpenMatricula, onCartClick, cartItemsCount } = useLayoutContext();
  return (
    <LazyErrorBoundary><Suspense fallback={<LoadingPage />}>
      <SEO title="Torneo de Taekwondo - AMAS Team Wolf" description="Inscribe a tu hijo en el próximo torneo de taekwondo." keywords="torneo taekwondo Lima" url="https://amasteamwolf.com/torneo" />
      <TorneoPage onNavigate={onNavigate} onOpenMatricula={onOpenMatricula} onCartClick={onCartClick} cartItemsCount={cartItemsCount} />
    </Suspense></LazyErrorBoundary>
  );
}

function AsistenciaRoute() {
  const { onNavigate } = useLayoutContext();
  return (
    <LazyErrorBoundary><Suspense fallback={<LoadingPage />}>
      <SEO title="Registro de Asistencia - AMAS Team Wolf" description="Registra tu asistencia escaneando el código QR." keywords="asistencia amas" url="https://amasteamwolf.com/asistencia" />
      <AsistenciaPage onNavigate={onNavigate} />
    </Suspense></LazyErrorBoundary>
  );
}

function AsistenciaPanelRoute() {
  const { onNavigate } = useLayoutContext();
  return (
    <LazyErrorBoundary><Suspense fallback={<LoadingPage />}>
      <SEO title="Panel de Asistencia - AMAS Team Wolf" description="Panel de control de asistencias para profesoras." keywords="panel asistencia amas" url="https://amasteamwolf.com/asistencia/panel" />
      <AsistenciaPanelPage onNavigate={onNavigate} />
    </Suspense></LazyErrorBoundary>
  );
}

function ConsultaAsistenciaRoute() {
  const { onNavigate } = useLayoutContext();
  return (
    <LazyErrorBoundary><Suspense fallback={<LoadingPage />}>
      <SEO title="Consulta de Asistencia - AMAS Team Wolf" description="Consulta el registro de asistencias de tu hijo." keywords="consulta asistencia" url="https://amasteamwolf.com/consulta-asistencia" />
      <ConsultaAsistenciaPage onNavigate={onNavigate} />
    </Suspense></LazyErrorBoundary>
  );
}

function MarcadorRoute() {
  const { onNavigate } = useLayoutContext();
  return (
    <LazyErrorBoundary><Suspense fallback={<LoadingPage />}>
      <MarcadorPage onNavigate={onNavigate} />
    </Suspense></LazyErrorBoundary>
  );
}

function ClasesRoute() {
  return (
    <LazyErrorBoundary><Suspense fallback={<LoadingPage />}>
      <RutaGuerrero />
    </Suspense></LazyErrorBoundary>
  );
}

function FormularioRoute() {
  return (
    <LazyErrorBoundary><Suspense fallback={<LoadingPage />}>
      <FormularioPublicoPage />
    </Suspense></LazyErrorBoundary>
  );
}

// Redirect /space to the standalone Space app
function SpaceRedirect() {
  React.useEffect(() => {
    window.location.href = 'https://space.amasteamwolf.com';
  }, []);
  return <LoadingPage />;
}

// --- Router definition ---
export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <HomeRoute /> },
      { path: '/leadership', element: <LeadershipRoute /> },
      { path: '/tienda', element: <TiendaRoute /> },
      { path: '/registro-3-meses', element: <RegistroTresMesesRoute /> },
      { path: '/registro-6-meses', element: <RegistroSeisMesesRoute /> },
      { path: '/registro-mensual', element: <RegistroMensualRoute /> },
      { path: '/registro-leadership', element: <RegistroLeadershipRoute /> },
      { path: '/graduacion', element: <GraduacionRoute /> },
      { path: '/clase-prueba', element: <ClasePruebaRoute /> },
      { path: '/inicio-sesion', element: <InicioSesionRoute /> },
      { path: '/perfil', element: <PerfilRoute /> },
      { path: '/renovacion-navidad', element: <RenovacionNavidadRoute /> },
      { path: '/navidad', element: <RegistroActividadNavidadRoute /> },
      { path: '/registro-showroom', element: <RegistroShowroomRoute /> },
      { path: '/renovacion', element: <RenovacionRoute /> },
      { path: '/terminos', element: <TerminosRoute /> },
      { path: '/torneo', element: <TorneoRoute /> },
      { path: '/asistencia', element: <AsistenciaRoute /> },
      { path: '/asistencia/panel', element: <AsistenciaPanelRoute /> },
      { path: '/asistencia/profesora', element: <AsistenciaPanelRoute /> },
      { path: '/consulta-asistencia', element: <ConsultaAsistenciaRoute /> },
      { path: '/marcador', element: <MarcadorRoute /> },
      { path: '/clases', element: <ClasesRoute /> },
      { path: '/clases/:rutaId', element: <ClasesRoute /> },
      { path: '/clases/:rutaId/:claseId', element: <ClasesRoute /> },
      { path: '/formulario/:slug', element: <FormularioRoute /> },
      { path: '/space/*', element: <SpaceRedirect /> },
      // Redirect aliases
      { path: '/renovar', element: <Navigate to="/renovacion" replace /> },
      { path: '/renueva-diciembre', element: <Navigate to="/renovacion-navidad" replace /> },
      { path: '/evento-navidad', element: <Navigate to="/navidad" replace /> },
      { path: '/showroom', element: <Navigate to="/registro-showroom" replace /> },
      { path: '/terminos-condiciones', element: <Navigate to="/terminos" replace /> },
      { path: '/vincular-cuenta', element: <Navigate to="/inicio-sesion" replace /> },
      { path: '/vincular', element: <Navigate to="/inicio-sesion" replace /> },
      { path: '/callback', element: <Navigate to="/" replace /> },
      // Catch-all: redirect to home
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
