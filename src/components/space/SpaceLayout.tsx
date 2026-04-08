import { useState, ReactNode } from 'react';
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

export function SpaceLayout({ user, currentPage, onNavigate, onLogout, onExit, children }: SpaceLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (page: SpacePage) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  return (
    <div className="h-dvh bg-zinc-950 flex overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
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
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#FA7B21] to-[#FCA929] flex items-center justify-center shrink-0">
              <span className="text-sm font-black text-white">S</span>
            </div>
            <span className="text-white font-bold text-sm md:hidden lg:block">SPACE</span>
          </div>
          {/* Mobile close */}
          <button onClick={() => setMobileOpen(false)} className="ml-auto md:hidden text-white/50 hover:text-white">
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
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
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
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
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
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            title="Salir al sitio"
          >
            <ExternalLink size={20} className="shrink-0" />
            <span className="md:hidden lg:block">Salir al sitio</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition-colors"
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
          <button onClick={() => setMobileOpen(true)} className="md:hidden text-white/60 hover:text-white">
            <Menu size={22} />
          </button>

          <h1 className="text-white font-semibold text-lg">{pageTitles[currentPage]}</h1>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-white/50 text-sm hidden sm:block">{user.nombre}</span>
            <div className="w-9 h-9 rounded-full bg-[#FA7B21]/20 border border-[#FA7B21]/30 flex items-center justify-center">
              <span className="text-[#FA7B21] text-xs font-bold">{getInitials(user.nombre)}</span>
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
