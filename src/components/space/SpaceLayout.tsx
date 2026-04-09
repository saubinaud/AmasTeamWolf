import { useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import {
  LayoutDashboard, GraduationCap, Users, ClipboardList,
  CalendarCheck, UserPlus, Settings, ExternalLink, LogOut, Menu, X,
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
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export function SpaceLayout({ user, currentPage, onNavigate, onLogout, onExit, children }: SpaceLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }));
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  const handleNav = useCallback((page: SpacePage) => {
    onNavigate(page);
    setSidebarOpen(false);
  }, [onNavigate]);

  const initials = useMemo(() => getInitials(user.nombre), [user.nombre]);

  const renderNavItem = (page: SpacePage, label: string, Icon: typeof LayoutDashboard) => {
    const active = currentPage === page;
    return (
      <button
        key={page}
        onClick={() => handleNav(page)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
          active
            ? 'bg-[#FA7B21]/10 text-[#FA7B21]'
            : 'text-white/50 hover:text-white hover:bg-white/5'
        }`}
      >
        <Icon size={18} className="shrink-0" />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="h-dvh bg-zinc-950 flex">
      {/* Overlay — mobile only */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-zinc-900 border-r border-white/10
        transform transition-transform duration-200 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:static lg:translate-x-0 lg:w-56
        flex flex-col
      `}>
        {/* Logo + close */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FA7B21] flex items-center justify-center shrink-0">
              <span className="text-xs font-black text-white">S</span>
            </div>
            <span className="text-white font-bold text-sm">SPACE</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/40 hover:text-white p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ page, label, icon }) => renderNavItem(page, label, icon))}

          <div className="my-3 border-t border-white/10" />

          {renderNavItem('config', 'Configuracion', Settings)}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-white/10 space-y-0.5 shrink-0">
          <button
            onClick={onExit}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ExternalLink size={18} className="shrink-0" />
            <span>Salir al sitio</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} className="shrink-0" />
            <span>Cerrar sesion</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-zinc-900/50 border-b border-white/10 flex items-center px-4 gap-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-white/50 hover:text-white p-1.5 -ml-1"
          >
            <Menu size={20} />
          </button>

          <h1 className="text-white font-semibold">{pageTitles[currentPage]}</h1>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-white/30 text-xs font-mono hidden sm:block">{time}</span>
            <span className="text-white/40 text-sm hidden sm:block">{user.nombre}</span>
            <div className="w-8 h-8 rounded-full bg-[#FA7B21] flex items-center justify-center">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
          </div>
        </header>

        {/* Content — scrollable */}
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
