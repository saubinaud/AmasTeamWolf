import { useState, useCallback, useMemo, type ReactNode } from 'react';
import {
  LayoutDashboard, GraduationCap, Users, CalendarCheck,
  Settings, LogOut, ExternalLink, ClipboardList, UserPlus,
  Menu, X,
} from 'lucide-react';
import type { SpacePage, SpaceUser } from './SpaceApp';
import { cx } from './tokens';

// ── Types ──

interface Props {
  user: SpaceUser;
  currentPage: SpacePage;
  onNavigate: (page: SpacePage) => void;
  onLogout: () => void;
  onExit: () => void;
  children: ReactNode;
}

// ── Data ──

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

// ── Component ──

export function SpaceLayout({ user, currentPage, onNavigate, onLogout, onExit, children }: Props) {
  const [open, setOpen] = useState(false);

  const initials = useMemo(
    () => user.nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase(),
    [user.nombre],
  );

  const go = useCallback((page: SpacePage) => {
    onNavigate(page);
    setOpen(false);
  }, [onNavigate]);

  const close = useCallback(() => setOpen(false), []);

  return (
    <div className="h-dvh flex flex-col bg-zinc-950">

      {/* ── Header ── */}
      <header className="h-14 shrink-0 flex items-center gap-3 px-4 lg:px-6 border-b border-zinc-800">
        <button
          onClick={() => setOpen(true)}
          className={cx.btnIcon}
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>

        <h1 className="text-white font-semibold text-[15px]">{TITLES[currentPage]}</h1>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-white/30 text-sm hidden sm:block">{user.nombre}</span>
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white/50 text-xs font-medium">
            {initials}
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
        <div className="p-4 sm:p-5 lg:p-6">
          {children}
        </div>
      </main>

      {/* ── Sidebar Overlay ── */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={close} />
      )}

      {/* ── Sidebar Drawer ── */}
      <nav
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-zinc-900 flex flex-col shadow-2xl shadow-black/30 transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menu principal"
      >
        {/* Sidebar header */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-[#FA7B21] flex items-center justify-center">
              <span className="text-[10px] font-black text-white">S</span>
            </div>
            <span className="text-white font-semibold text-sm">SPACE</span>
          </div>
          <button onClick={close} className={cx.btnIcon} aria-label="Cerrar menu">
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto py-2 px-3">
          {NAV.map(({ page, label, icon: Icon }) => {
            const active = currentPage === page;
            return (
              <button
                key={page}
                onClick={() => go(page)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 mb-0.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-zinc-800 text-white font-medium'
                    : 'text-white/50 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <Icon size={18} className={active ? 'text-[#FA7B21]' : 'text-white/30'} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Sidebar footer */}
        <div className="px-3 py-3 border-t border-zinc-800 shrink-0">
          {/* User info */}
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white/50 text-xs font-medium shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.nombre}</p>
              <p className="text-white/30 text-xs truncate">{user.email}</p>
            </div>
          </div>

          <button onClick={() => { close(); onExit(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-white hover:bg-zinc-800/50 transition-colors">
            <ExternalLink size={16} /> Salir al sitio
          </button>
          <button onClick={() => { close(); onLogout(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400/50 hover:text-red-400 hover:bg-red-500/5 transition-colors">
            <LogOut size={16} /> Cerrar sesion
          </button>
        </div>
      </nav>
    </div>
  );
}
