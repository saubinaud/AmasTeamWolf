import { useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import {
  LayoutDashboard, GraduationCap, Users, CalendarCheck,
  Settings, LogOut, ExternalLink, ClipboardList, UserPlus,
  PanelLeftOpen, PanelLeftClose,
} from 'lucide-react';
import type { SpacePage, SpaceUser } from './SpaceApp';

interface Props {
  user: SpaceUser;
  currentPage: SpacePage;
  onNavigate: (page: SpacePage) => void;
  onLogout: () => void;
  onExit: () => void;
  children: ReactNode;
}

const NAV: { page: SpacePage; label: string; icon: typeof LayoutDashboard }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'graduaciones', label: 'Graduaciones', icon: GraduationCap },
  { page: 'alumnos', label: 'Alumnos', icon: Users },
  { page: 'inscripciones', label: 'Inscripciones', icon: ClipboardList },
  { page: 'asistencia', label: 'Asistencia', icon: CalendarCheck },
  { page: 'leads', label: 'Leads', icon: UserPlus },
  { page: 'config', label: 'Configuracion', icon: Settings },
];

const TITLES: Record<SpacePage, string> = {
  dashboard: 'Dashboard', graduaciones: 'Graduaciones', alumnos: 'Alumnos',
  inscripciones: 'Inscripciones', asistencia: 'Asistencia', leads: 'Leads', config: 'Configuracion',
};

export function SpaceLayout({ user, currentPage, onNavigate, onLogout, onExit, children }: Props) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Open sidebar by default on desktop
  useEffect(() => {
    if (!isMobile) setOpen(true);
    else setOpen(false);
  }, [isMobile]);

  const initials = useMemo(
    () => user.nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase(),
    [user.nombre],
  );

  const go = useCallback((page: SpacePage) => {
    onNavigate(page);
    if (isMobile) setOpen(false);
  }, [onNavigate, isMobile]);

  const close = useCallback(() => setOpen(false), []);

  // Sidebar content (shared between mobile overlay and desktop push)
  const sidebarContent = (
    <div className="w-60 h-full flex flex-col bg-zinc-900">
      {/* Brand */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-[#FA7B21] flex items-center justify-center shrink-0">
            <span className="text-[10px] font-black text-white">S</span>
          </div>
          <span className="text-white font-semibold text-sm">SPACE</span>
        </div>
        <button onClick={close} className="p-1.5 text-white/30 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors" aria-label="Cerrar menu">
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ page, label, icon: Icon }) => {
          const active = currentPage === page;
          return (
            <button key={page} onClick={() => go(page)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-colors ${
                active ? 'bg-zinc-800 text-white font-medium' : 'text-white/50 hover:text-white hover:bg-zinc-800/50'
              }`}>
              <Icon size={16} className={active ? 'text-[#FA7B21]' : 'text-white/30'} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* User + actions */}
      <div className="px-2 py-3 border-t border-zinc-800 shrink-0">
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
            <span className="text-white/50 text-[10px] font-medium">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">{user.nombre}</p>
            <p className="text-white/30 text-[10px] truncate">{user.email}</p>
          </div>
        </div>
        <button onClick={() => { close(); onExit(); }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white hover:bg-zinc-800/50 transition-colors">
          <ExternalLink size={14} /> Salir al sitio
        </button>
        <button onClick={() => { close(); onLogout(); }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-red-400/40 hover:text-red-400 hover:bg-red-500/5 transition-colors">
          <LogOut size={14} /> Cerrar sesion
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-dvh flex bg-zinc-950 overflow-hidden">

      {/* MOBILE: Overlay sidebar */}
      {isMobile && open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="shrink-0 shadow-2xl shadow-black/50">
            {sidebarContent}
          </div>
          <div className="flex-1 bg-black/50" onClick={close} />
        </div>
      )}

      {/* DESKTOP: Push sidebar */}
      {!isMobile && (
        <aside className={`h-dvh border-r border-zinc-800 shrink-0 transition-[width] duration-200 ease-out overflow-hidden ${
          open ? 'w-60' : 'w-0'
        }`}>
          {sidebarContent}
        </aside>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center gap-3 px-4 border-b border-zinc-800 shrink-0">
          {(!open || isMobile) && (
            <button onClick={() => setOpen(true)} className="p-1.5 text-white/30 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors" aria-label="Abrir menu">
              <PanelLeftOpen size={18} />
            </button>
          )}
          <h1 className="text-white font-semibold text-[15px]">{TITLES[currentPage]}</h1>
          <div className="ml-auto flex items-center gap-2.5">
            <span className="text-white/30 text-sm hidden md:block">{user.nombre}</span>
            <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center">
              <span className="text-white/50 text-[10px] font-medium">{initials}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
          <div className="p-4 md:p-5 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
