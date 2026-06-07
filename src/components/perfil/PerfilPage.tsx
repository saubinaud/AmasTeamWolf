import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import {
  XCircle, AlertTriangle, Zap,
  Home, Calendar, CreditCard, MessageCircle, Award,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../ui/utils';
import { AccountLinkingStep } from '../AccountLinkingStep';
import { HeaderMain } from '../HeaderMain';
import { PerfilHeader } from './PerfilHeader';
import { DashboardTab } from './tabs/DashboardTab';
import { AsistenciaTab } from './tabs/AsistenciaTab';
import { PlanTab } from './tabs/PlanTab';
import { GraduacionTab } from './tabs/GraduacionTab';
import { MensajesTab } from './tabs/MensajesTab';

interface PerfilPageProps {
  onNavigate: (page: string) => void;
}

// Hook to detect mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

type Section = 'home' | 'calendar' | 'plan' | 'messages' | 'graduacion';

export function PerfilPage({ onNavigate }: PerfilPageProps) {
  const { user, logout, refreshUserData } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('home');
  const isMobile = useIsMobile();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUserData();
    toast.success('Actualizado');
    setIsRefreshing(false);
  };

  const handleLogout = () => {
    logout();
    onNavigate('home');
  };

  // ── Derived state ──
  const diasRestantes = (() => {
    if (!user?.matricula?.fechaFin) return 0;
    const fin = new Date(user.matricula.fechaFin);
    return Math.ceil((fin.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  })();

  const diasVencido = diasRestantes < 0 ? Math.abs(diasRestantes) : 0;
  const estaVencido = diasRestantes < 0;
  const estaPorVencer = diasRestantes >= 0 && diasRestantes <= (isMobile ? 7 : 15);
  const bloqueadoPorVencimiento = diasVencido > 30;
  const isPagado = user?.pagos?.estadoPago?.toLowerCase().includes('pagado');
  const hasLinkedProfile = user && user.estudiante && user.estudiante.nombre;

  // ── Guard: not linked ──
  if (!hasLinkedProfile) {
    return (
      <AccountLinkingStep
        onComplete={async () => {
          await refreshUserData();
        }}
        onLogout={handleLogout}
      />
    );
  }

  // ── Guard: blocked by 30+ days expired ──
  if (bloqueadoPorVencimiento) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Membresia Vencida</h1>
          <p className="text-zinc-500 mb-8 text-sm">Tu plan vencio hace mas de 30 dias.</p>
          <Button
            onClick={() => onNavigate('planes')}
            className="w-full h-14 bg-red-500 hover:bg-red-400 text-white font-semibold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Zap className="w-5 h-5 mr-2" /> Renovar Ahora
          </Button>
          <button onClick={handleLogout} className="mt-4 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            Cerrar sesion
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'home', icon: Home, label: 'Inicio' },
    { id: 'calendar', icon: Calendar, label: 'Asistencias' },
    { id: 'plan', icon: CreditCard, label: isMobile ? 'Membresia' : 'Plan' },
    { id: 'graduacion', icon: Award, label: 'Graduacion' },
    { id: 'messages', icon: MessageCircle, label: 'Mensajes' },
  ];

  // ── Tab content ──
  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return (
          <DashboardTab
            user={user}
            isMobile={isMobile}
            onNavigate={onNavigate}
            onSectionChange={(s) => setActiveSection(s as Section)}
            onRefresh={handleRefresh}
          />
        );
      case 'calendar':
        return <AsistenciaTab user={user} isMobile={isMobile} />;
      case 'plan':
        return <PlanTab user={user} isMobile={isMobile} onNavigate={onNavigate} onRefresh={handleRefresh} />;
      case 'graduacion':
        return <GraduacionTab user={user} isMobile={isMobile} />;
      case 'messages':
        return <MensajesTab user={user} isMobile={isMobile} onRefresh={handleRefresh} />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Header for navigation */}
      <HeaderMain
        onNavigate={onNavigate}
        onOpenMatricula={() => onNavigate('planes')}
        onCartClick={() => { }}
        cartItemsCount={0}
        currentPage="perfil"
      />

      {/* Background */}
      {isMobile ? (
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#FA7B21]/[0.03] rounded-full blur-[150px]" />
        </div>
      ) : (
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[#0f0f0f]" />
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 120% 60% at 50% 100%, rgba(250, 123, 33, 0.15) 0%, rgba(252, 169, 41, 0.08) 30%, transparent 70%)'
            }}
          />
        </div>
      )}

      {/* Main content */}
      <div
        className={cn(
          "relative z-10 mx-auto transition-opacity duration-500",
          isMobile ? "max-w-md px-5 pb-28" : "max-w-7xl px-5 md:px-8 pt-24 pb-12",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        style={isMobile ? { paddingTop: '65px' } : undefined}
      >
        {/* Expiration Banner */}
        {(estaVencido || estaPorVencer) && (
          isMobile ? (
            <div
              className={cn(
                "mt-4 p-4 rounded-2xl flex items-center gap-3 animate-fade-in-up",
                estaVencido ? "bg-red-500/10 border border-red-500/20" : "bg-amber-500/10 border border-amber-500/20"
              )}
            >
              <AlertTriangle className={cn("w-5 h-5 flex-shrink-0", estaVencido ? "text-red-400" : "text-amber-400")} />
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", estaVencido ? "text-red-300" : "text-amber-300")}>
                  {estaVencido ? `Vencido hace ${diasVencido} dias` : `${user?.matricula?.clasesRestantes ?? diasRestantes} clases restantes`}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => onNavigate('planes')}
                className={cn("h-9 px-4 text-xs rounded-xl font-medium", estaVencido ? "bg-red-500 hover:bg-red-400" : "bg-amber-500 hover:bg-amber-400 text-black")}
              >
                Renovar
              </Button>
            </div>
          ) : (
            <div className={cn(
              "mb-8 p-4 rounded-2xl flex items-center justify-between",
              estaVencido
                ? "bg-red-500/10 border border-red-500/30"
                : "bg-amber-500/10 border border-amber-500/30"
            )}>
              <div className="flex items-center gap-4">
                <AlertTriangle className={cn("w-6 h-6", estaVencido ? "text-red-400" : "text-amber-400")} />
                <div>
                  <p className={cn("font-semibold", estaVencido ? "text-red-300" : "text-amber-300")}>
                    {estaVencido ? `Programa vencido hace ${diasVencido} dias` : `Solo quedan ${diasRestantes} dias`}
                  </p>
                  <p className="text-white/60 text-sm">Renueva ahora para continuar entrenando</p>
                </div>
              </div>
              <Button
                onClick={() => onNavigate('renovacion')}
                className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white shadow-lg shadow-[#FA7B21]/30"
              >
                Renovar ahora
              </Button>
            </div>
          )
        )}

        {/* Header (avatar + name + actions) */}
        <PerfilHeader
          user={user}
          onRefresh={handleRefresh}
          onLogout={handleLogout}
          isRefreshing={isRefreshing}
          isPagado={!!isPagado}
          isMobile={isMobile}
        />

        {/* Desktop Navigation Tabs */}
        {!isMobile && (
          <div className="flex items-center gap-2 mb-8 p-1.5 bg-zinc-900/50 rounded-2xl border border-white/5 w-fit">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as Section)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                  activeSection === item.id
                    ? "bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white shadow-lg shadow-[#FA7B21]/30"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {renderContent()}
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="bg-black/90 border-t border-white/5">
            <div className="mx-auto max-w-md px-4">
              <div className="flex items-center justify-around py-2">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id as Section)}
                    className={cn(
                      "relative flex flex-col items-center gap-1 py-2 px-5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95",
                      activeSection === item.id ? "text-[#FA7B21]" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <item.icon className="w-6 h-6" />
                    <span className="text-[10px] font-medium">{item.label}</span>
                    {activeSection === item.id && (
                      <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FA7B21]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
