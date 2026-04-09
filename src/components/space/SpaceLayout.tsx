import { useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  ClipboardList,
  CalendarCheck,
  UserPlus,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

type SpacePage = 'dashboard' | 'graduaciones' | 'alumnos' | 'inscripciones' | 'asistencia' | 'leads' | 'config';

interface SpaceUser {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'profesor';
}

interface SpaceLayoutProps {
  user: SpaceUser;
  currentPage: SpacePage;
  onNavigate: (page: SpacePage) => void;
  onLogout: () => void;
  onExit: () => void;
  children: ReactNode;
}

const navItems: { page: SpacePage; label: string; icon: typeof LayoutDashboard }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'graduaciones', label: 'Graduaciones', icon: GraduationCap },
  { page: 'alumnos', label: 'Alumnos', icon: Users },
  { page: 'inscripciones', label: 'Inscripciones', icon: ClipboardList },
  { page: 'asistencia', label: 'Asistencia', icon: CalendarCheck },
  { page: 'leads', label: 'Leads', icon: UserPlus },
];

const pageTitles: Record<SpacePage, string> = {
  dashboard: 'Dashboard',
  graduaciones: 'Graduaciones',
  alumnos: 'Alumnos',
  inscripciones: 'Inscripciones',
  asistencia: 'Asistencia',
  leads: 'Leads',
  config: 'Configuracion',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

export function SpaceLayout({ user, currentPage, onNavigate, onLogout, onExit, children }: SpaceLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => formatTime(new Date()));

  // Update clock every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(formatTime(new Date()));
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleNav = useCallback((page: SpacePage) => {
    onNavigate(page);
    setMobileOpen(false);
  }, [onNavigate]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const openMobile = useCallback(() => setMobileOpen(true), []);

  const initials = useMemo(() => getInitials(user.nombre), [user.nombre]);

  return (
    <div className="h-dvh bg-zinc-950 flex overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static z-50 h-dvh bg-zinc-900/95 backdrop-blur-xl border-r border-white/5
          transition-transform duration-200 ease-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          w-60 lg:w-60 md:w-16 lg:w-60
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#FA7B21] to-[#FCA929] flex items-center justify-center shrink-0 shadow-lg shadow-[#FA7B21]/10">
              <span className="text-sm font-black text-white">S</span>
            </div>
            <span className="text-white font-bold text-sm md:hidden lg:block">SPACE</span>
          </div>
          {/* Mobile close */}
          <button onClick={closeMobile} className="ml-auto md:hidden text-white/50 hover:text-white transition-colors duration-150">
            <X size={20} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ page, label, icon: Icon }) => {
            const active = currentPage === page;
            return (
              <button
                key={page}
                onClick={() => handleNav(page)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150
                  ${active
                    ? 'bg-[#FA7B21]/10 text-[#FA7B21] border-l-2 border-[#FA7B21]'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                  }
                `}
                title={label}
              >
                <Icon size={20} className="shrink-0" />
                <span className="md:hidden lg:block">{label}</span>
              </button>
            );
          })}

          <div className="my-3 border-t border-white/5" />

          {/* Config */}
          <button
            onClick={() => handleNav('config')}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150
              ${currentPage === 'config'
                ? 'bg-[#FA7B21]/10 text-[#FA7B21] border-l-2 border-[#FA7B21]'
                : 'text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
              }
            `}
            title="Configuracion"
          >
            <Settings size={20} className="shrink-0" />
            <span className="md:hidden lg:block">Configuracion</span>
          </button>
        </nav>

        {/* Bottom actions */}
        <div className="p-2 border-t border-white/5 space-y-0.5 shrink-0">
          <button
            onClick={onExit}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors duration-150"
            title="Salir al sitio"
          >
            <ExternalLink size={20} className="shrink-0" />
            <span className="md:hidden lg:block">Salir al sitio</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition-colors duration-150"
            title="Cerrar sesion"
          >
            <LogOut size={20} className="shrink-0" />
            <span className="md:hidden lg:block">Cerrar sesion</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header bar */}
        <header className="h-16 bg-zinc-900/50 backdrop-blur border-b border-white/5 flex items-center px-4 gap-4 shrink-0">
          {/* Mobile hamburger */}
          <button onClick={openMobile} className="md:hidden text-white/60 hover:text-white transition-colors duration-150">
            <Menu size={22} />
          </button>

          <h1 className="text-white font-semibold text-lg">{pageTitles[currentPage]}</h1>

          <div className="ml-auto flex items-center gap-4">
            <span className="text-white/30 text-sm font-mono hidden sm:block">{currentTime}</span>
            <span className="text-white/50 text-sm hidden sm:block">{user.nombre}</span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FA7B21] to-[#FCA929] flex items-center justify-center shadow-md shadow-[#FA7B21]/10">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
