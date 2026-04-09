import { useState, useCallback, useMemo, ReactNode } from 'react';
import {
  LayoutDashboard, GraduationCap, Users, CalendarCheck,
  Settings, LogOut, ExternalLink, MoreHorizontal, ClipboardList, UserPlus, X,
} from 'lucide-react';
import type { SpacePage, SpaceUser } from './SpaceApp';

// ── Props ──

interface SpaceLayoutProps {
  user: SpaceUser;
  currentPage: SpacePage;
  onNavigate: (page: SpacePage) => void;
  onLogout: () => void;
  onExit: () => void;
  children: ReactNode;
}

// ── Constants ──

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

// Mobile: 4 main tabs + "Más"
const TABS: { page: SpacePage; label: string; icon: typeof LayoutDashboard }[] = [
  { page: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { page: 'graduaciones', label: 'Grad.', icon: GraduationCap },
  { page: 'alumnos', label: 'Alumnos', icon: Users },
  { page: 'asistencia', label: 'Asist.', icon: CalendarCheck },
];

const MORE_PAGES: { page: SpacePage; label: string; icon: typeof LayoutDashboard }[] = [
  { page: 'inscripciones', label: 'Inscripciones', icon: ClipboardList },
  { page: 'leads', label: 'Leads', icon: UserPlus },
  { page: 'config', label: 'Configuracion', icon: Settings },
];

// ── Helpers ──

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

// ── Component ──

export function SpaceLayout({ user, currentPage, onNavigate, onLogout, onExit, children }: SpaceLayoutProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const initials = useMemo(() => getInitials(user.nombre), [user.nombre]);

  const nav = useCallback((page: SpacePage) => {
    onNavigate(page);
    setMoreOpen(false);
  }, [onNavigate]);

  return (
    <div className="h-dvh flex bg-zinc-950">

      {/* ═══ DESKTOP SIDEBAR (lg+) ═══ */}
      <aside className="hidden lg:flex flex-col w-52 bg-zinc-900 border-r border-zinc-800/50 shrink-0">
        {/* Brand */}
        <div className="h-14 flex items-center px-5">
          <span className="text-white/90 font-bold text-sm tracking-[0.2em]">SPACE</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-px overflow-y-auto">
          {SIDEBAR_NAV.map(({ page, label, icon: Icon }) => {
            const active = currentPage === page;
            return (
              <button
                key={page}
                onClick={() => nav(page)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                  active
                    ? 'bg-zinc-800 text-white'
                    : 'text-white/40 hover:text-white/70 hover:bg-zinc-800/40'
                }`}
              >
                <Icon size={16} className={active ? 'text-[#FA7B21]' : ''} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-3 border-t border-zinc-800/50 space-y-px">
          <button onClick={onExit}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-white/40 hover:text-white/70 hover:bg-zinc-800/40 transition-colors">
            <ExternalLink size={16} /> Salir
          </button>
          <button onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-white/40 hover:text-white/70 hover:bg-zinc-800/40 transition-colors">
            <LogOut size={16} /> Cerrar sesion
          </button>
        </div>
      </aside>

      {/* ═══ MAIN AREA ═══ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-zinc-800/50 shrink-0">
          <h1 className="text-white font-semibold text-[15px]">{PAGE_TITLES[currentPage]}</h1>
          <div className="flex items-center gap-3">
            <span className="text-white/30 text-sm hidden sm:block">{user.nombre}</span>
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white/60 text-xs font-medium">
              {initials}
            </div>
          </div>
        </header>

        {/* Content — scrollable */}
        <main className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
          <div className="p-4 lg:p-6 pb-24 lg:pb-6">
            {children}
          </div>
        </main>
      </div>

      {/* ═══ MOBILE BOTTOM TABS (< lg) ═══ */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-50">
        {/* "More" overlay + sheet */}
        {moreOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
            <div className="relative z-50 bg-zinc-900 border-t border-zinc-800 rounded-t-xl mx-2 mb-1 shadow-2xl shadow-black/50">
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <span className="text-white/70 text-xs font-medium uppercase tracking-wider">Más opciones</span>
                <button onClick={() => setMoreOpen(false)} className="p-1 text-white/30 hover:text-white/60">
                  <X size={16} />
                </button>
              </div>
              <div className="px-2 pb-3 space-y-px">
                {MORE_PAGES.map(({ page, label, icon: Icon }) => (
                  <button key={page} onClick={() => nav(page)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${
                      currentPage === page ? 'text-[#FA7B21] bg-zinc-800' : 'text-white/50 hover:text-white hover:bg-zinc-800/50'
                    }`}>
                    <Icon size={16} /> {label}
                  </button>
                ))}
                <div className="my-1.5 border-t border-zinc-800" />
                <button onClick={() => { setMoreOpen(false); onExit(); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-white/50 hover:text-white hover:bg-zinc-800/50 transition-colors">
                  <ExternalLink size={16} /> Salir al sitio
                </button>
                <button onClick={() => { setMoreOpen(false); onLogout(); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-colors">
                  <LogOut size={16} /> Cerrar sesion
                </button>
              </div>
            </div>
          </>
        )}

        {/* Tab bar */}
        <nav className="bg-zinc-900 border-t border-zinc-800 flex items-stretch"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {TABS.map(({ page, label, icon: Icon }) => {
            const active = currentPage === page;
            return (
              <button key={page} onClick={() => nav(page)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 min-h-[52px] transition-colors ${
                  active ? 'text-[#FA7B21]' : 'text-white/30'
                }`}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </button>
            );
          })}
          <button onClick={() => setMoreOpen(v => !v)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 min-h-[52px] transition-colors ${
              moreOpen ? 'text-[#FA7B21]' : 'text-white/30'
            }`}>
            <MoreHorizontal size={20} strokeWidth={moreOpen ? 2.5 : 1.5} />
            <span className="text-[10px] font-medium leading-none">Más</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
