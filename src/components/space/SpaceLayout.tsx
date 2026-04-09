import { useState, useCallback, useMemo, ReactNode } from 'react';
import {
  LayoutDashboard, GraduationCap, Users, CalendarCheck,
  Settings, LogOut, ExternalLink, ClipboardList, UserPlus,
  Menu, ChevronLeft,
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

const NAV_ITEMS: { page: SpacePage; label: string; icon: typeof LayoutDashboard }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'graduaciones', label: 'Graduaciones', icon: GraduationCap },
  { page: 'alumnos', label: 'Alumnos', icon: Users },
  { page: 'inscripciones', label: 'Inscripciones', icon: ClipboardList },
  { page: 'asistencia', label: 'Asistencia', icon: CalendarCheck },
  { page: 'leads', label: 'Leads', icon: UserPlus },
  { page: 'config', label: 'Configuracion', icon: Settings },
];

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export function SpaceLayout({ user, currentPage, onNavigate, onLogout, onExit, children }: SpaceLayoutProps) {
  const [open, setOpen] = useState(false);
  const initials = useMemo(() => getInitials(user.nombre), [user.nombre]);

  const nav = useCallback((page: SpacePage) => {
    onNavigate(page);
    setOpen(false);
  }, [onNavigate]);

  return (
    <div className="h-dvh flex bg-zinc-950">
      {/* Overlay — cierra sidebar al tocar fuera */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-dvh z-50 w-64 bg-zinc-900 flex flex-col transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header sidebar */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-800">
          <span className="text-white font-bold tracking-widest text-sm">SPACE</span>
          <button onClick={() => setOpen(false)} className="p-1.5 text-white/40 hover:text-white transition-colors rounded-lg hover:bg-zinc-800">
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ page, label, icon: Icon }) => {
            const active = currentPage === page;
            return (
              <button
                key={page}
                onClick={() => nav(page)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-zinc-800 text-white font-medium'
                    : 'text-white/50 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <Icon size={18} className={active ? 'text-[#FA7B21]' : 'text-white/40'} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-3 border-t border-zinc-800 space-y-1">
          <button onClick={() => { setOpen(false); onExit(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-white hover:bg-zinc-800/60 transition-colors">
            <ExternalLink size={18} /> Salir al sitio
          </button>
          <button onClick={() => { setOpen(false); onLogout(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400/50 hover:text-red-400 hover:bg-red-500/5 transition-colors">
            <LogOut size={18} /> Cerrar sesion
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 flex items-center px-4 border-b border-zinc-800 shrink-0 gap-3">
          <button onClick={() => setOpen(true)}
            className="p-2 -ml-2 text-white/50 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
            <Menu size={20} />
          </button>
          <h1 className="text-white font-semibold">{PAGE_TITLES[currentPage]}</h1>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-white/30 text-sm hidden sm:block">{user.nombre}</span>
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
              <span className="text-white/60 text-xs font-medium">{initials}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
