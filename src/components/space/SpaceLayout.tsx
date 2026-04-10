import { useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import {
  LayoutDashboard, GraduationCap, Users, CalendarCheck,
  Settings, LogOut, ExternalLink, ClipboardList, UserPlus,
  PanelLeftOpen, X,
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
  { page: 'alumnos', label: 'Alumnos', icon: Users },
  { page: 'inscripciones', label: 'Inscripciones', icon: ClipboardList },
  { page: 'graduaciones', label: 'Graduaciones', icon: GraduationCap },
  { page: 'asistencia', label: 'Asistencia', icon: CalendarCheck },
  { page: 'leads', label: 'Leads', icon: UserPlus },
  { page: 'config', label: 'Ajustes', icon: Settings },
];

const TITLES: Record<SpacePage, string> = {
  dashboard: 'Dashboard', graduaciones: 'Graduaciones', alumnos: 'Alumnos',
  inscripciones: 'Inscripciones', asistencia: 'Asistencia', leads: 'Leads', config: 'Ajustes',
};

export function SpaceLayout({ user, currentPage, onNavigate, onLogout, onExit, children }: Props) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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

  const sidebarContent = (
    <div className="w-64 h-full flex flex-col bg-zinc-950 border-r border-zinc-700">
      {/* Brand */}
      <div className="h-16 flex items-center justify-between px-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FA7B21] to-[#FCA929] flex items-center justify-center shrink-0 shadow-lg shadow-[#FA7B21]/20">
            <span className="text-[11px] font-black text-white">S</span>
          </div>
          <div>
            <span className="text-white font-bold text-sm tracking-wide">SPACE</span>
            <span className="text-white/20 text-[10px] block -mt-0.5">Admin Panel</span>
          </div>
        </div>
        {isMobile && (
          <button onClick={close} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all" aria-label="Cerrar">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        {NAV.map(({ page, label, icon: Icon }) => {
          const active = currentPage === page;
          return (
            <button
              key={page}
              onClick={() => go(page)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200 ${
                active
                  ? 'bg-[#FA7B21]/10 text-white font-medium border border-[#FA7B21]/15'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 border border-transparent'
              }`}
            >
              <Icon size={16} className={active ? 'text-[#FA7B21]' : 'text-zinc-600'} />
              {label}
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FA7B21]" />}
            </button>
          );
        })}
      </nav>

      {/* User + actions */}
      <div className="px-3 py-4 border-t border-zinc-700 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-2 bg-zinc-900 rounded-xl border border-zinc-700">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FA7B21]/20 to-[#FCA929]/10 flex items-center justify-center shrink-0 border border-[#FA7B21]/15">
            <span className="text-[#FA7B21] text-[11px] font-bold">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">{user.nombre}</p>
            <p className="text-zinc-600 text-[10px] truncate">{user.rol === 'admin' ? 'Administrador' : 'Profesor'}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => { close(); onExit(); }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[11px] text-zinc-500 hover:text-zinc-400 hover:bg-zinc-800 transition-all"
          >
            <ExternalLink size={12} /> Sitio
          </button>
          <button
            onClick={() => { close(); onLogout(); }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[11px] text-red-400/40 hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            <LogOut size={12} /> Salir
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-dvh flex bg-zinc-950 overflow-hidden">

      {/* MOBILE: Overlay */}
      {isMobile && open && (
        <div className="fixed inset-0 z-[90] flex">
          <div className="shrink-0 shadow-2xl shadow-black/80">
            {sidebarContent}
          </div>
          <div className="flex-1 bg-black/80" onClick={close} />
        </div>
      )}

      {/* DESKTOP: Push sidebar */}
      {!isMobile && (
        <aside className={`h-dvh shrink-0 transition-[width] duration-300 ease-out overflow-hidden ${
          open ? 'w-64' : 'w-0'
        }`}>
          {sidebarContent}
        </aside>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center gap-3 px-4 sm:px-5 border-b border-zinc-700 shrink-0 bg-zinc-950">
          {(!open || isMobile) && (
            <button
              onClick={() => setOpen(true)}
              className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
              aria-label="Menu"
            >
              <PanelLeftOpen size={18} />
            </button>
          )}
          <h1 className="text-white font-semibold text-[15px]">{TITLES[currentPage]}</h1>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
          <div className="p-4 md:p-5 lg:p-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
