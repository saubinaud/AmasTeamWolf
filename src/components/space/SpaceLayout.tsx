import { useState, useCallback, useMemo, ReactNode } from 'react';
import {
  LayoutDashboard, GraduationCap, Users, CalendarCheck,
  Settings, LogOut, ExternalLink, MoreHorizontal, ClipboardList, UserPlus, X,
} from 'lucide-react';
import type { SpacePage, SpaceUser } from './SpaceApp';

interface SpaceLayoutProps {
  user: SpaceUser;
  currentPage: SpacePage;
  onNavigate: (page: SpacePage) => void;
  onLogout: () => void;
  onExit: () => void;
  children: ReactNode;
}

const PAGE_TITLES: Record<SpacePage, string> = {
  dashboard: 'Dashboard',
  graduaciones: 'Graduaciones',
  alumnos: 'Alumnos',
  inscripciones: 'Inscripciones',
  asistencia: 'Asistencia',
  leads: 'Leads',
  config: 'Configuracion',
};

const SIDEBAR_NAV: { page: SpacePage; label: string; icon: typeof LayoutDashboard }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'graduaciones', label: 'Graduaciones', icon: GraduationCap },
  { page: 'alumnos', label: 'Alumnos', icon: Users },
  { page: 'inscripciones', label: 'Inscripciones', icon: ClipboardList },
  { page: 'asistencia', label: 'Asistencia', icon: CalendarCheck },
  { page: 'leads', label: 'Leads', icon: UserPlus },
  { page: 'config', label: 'Configuracion', icon: Settings },
];

const BOTTOM_TABS: { page: SpacePage; label: string; icon: typeof LayoutDashboard }[] = [
  { page: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { page: 'graduaciones', label: 'Graduaciones', icon: GraduationCap },
  { page: 'alumnos', label: 'Alumnos', icon: Users },
  { page: 'asistencia', label: 'Asistencia', icon: CalendarCheck },
];

const MORE_ITEMS: { page: SpacePage; label: string; icon: typeof LayoutDashboard }[] = [
  { page: 'inscripciones', label: 'Inscripciones', icon: ClipboardList },
  { page: 'leads', label: 'Leads', icon: UserPlus },
  { page: 'config', label: 'Configuracion', icon: Settings },
];

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export function SpaceLayout({ user, currentPage, onNavigate, onLogout, onExit, children }: SpaceLayoutProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const initials = useMemo(() => getInitials(user.nombre), [user.nombre]);

  const handleNav = useCallback((page: SpacePage) => {
    onNavigate(page);
    setMoreOpen(false);
  }, [onNavigate]);

  const toggleMore = useCallback(() => setMoreOpen(prev => !prev), []);
  const closeMore = useCallback(() => setMoreOpen(false), []);

  return (
    <div className="h-dvh bg-zinc-950 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[200px] bg-zinc-900 shrink-0">
        <div className="h-14 flex items-center px-4">
          <span className="text-white font-bold text-sm tracking-widest">SPACE</span>
        </div>

        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {SIDEBAR_NAV.map(({ page, label, icon: Icon }) => {
            const active = currentPage === page;
            return (
              <button
                key={page}
                onClick={() => handleNav(page)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-zinc-800 text-white border-l-2 border-[#FA7B21] -ml-px'
                    : 'text-white/50 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-2 space-y-0.5">
          <button
            onClick={onExit}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-zinc-800/50 transition-colors"
          >
            <ExternalLink size={18} className="shrink-0" />
            <span>Salir</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-zinc-800/50 transition-colors"
          >
            <LogOut size={18} className="shrink-0" />
            <span>Cerrar sesion</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-zinc-950 border-b border-zinc-800 flex items-center px-4 gap-3 shrink-0">
          <h1 className="text-white font-semibold">{PAGE_TITLES[currentPage]}</h1>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-white/40 text-sm hidden sm:block">{user.nombre}</span>
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
              <span className="text-white text-xs font-medium">{initials}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 lg:p-6 pb-20 lg:pb-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 flex items-center justify-around z-40 pb-[env(safe-area-inset-bottom)]">
        {BOTTOM_TABS.map(({ page, label, icon: Icon }) => {
          const active = currentPage === page;
          return (
            <button
              key={page}
              onClick={() => handleNav(page)}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 min-w-0 ${
                active ? 'text-[#FA7B21]' : 'text-white/40'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] leading-tight truncate">{label}</span>
            </button>
          );
        })}
        <button
          onClick={toggleMore}
          className={`flex flex-col items-center gap-0.5 py-2 px-3 min-w-0 ${
            moreOpen ? 'text-[#FA7B21]' : 'text-white/40'
          }`}
        >
          <MoreHorizontal size={20} />
          <span className="text-[10px] leading-tight">Mas</span>
        </button>
      </nav>

      {/* "More" sheet overlay (mobile) */}
      {moreOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={closeMore} />
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 rounded-t-2xl z-50 pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <span className="text-white font-semibold text-sm">Mas opciones</span>
              <button onClick={closeMore} className="text-white/40 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
            <div className="px-3 pb-4 space-y-0.5">
              {MORE_ITEMS.map(({ page, label, icon: Icon }) => (
                <button
                  key={page}
                  onClick={() => handleNav(page)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${
                    currentPage === page ? 'text-[#FA7B21] bg-zinc-800' : 'text-white/60 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span>{label}</span>
                </button>
              ))}
              <div className="my-2 border-t border-zinc-800" />
              <button
                onClick={() => { closeMore(); onExit(); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-white/60 hover:text-white hover:bg-zinc-800/50 transition-colors"
              >
                <ExternalLink size={18} className="shrink-0" />
                <span>Salir</span>
              </button>
              <button
                onClick={() => { closeMore(); onLogout(); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-white/60 hover:text-white hover:bg-zinc-800/50 transition-colors"
              >
                <LogOut size={18} className="shrink-0" />
                <span>Cerrar sesion</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
