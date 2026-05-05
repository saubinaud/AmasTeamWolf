import { useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import {
  LayoutDashboard, GraduationCap, Users, CalendarCheck,
  Settings, LogOut, ExternalLink, ClipboardList, UserPlus, RefreshCw,
  PanelLeftOpen, X, MessageSquare, ShoppingBag, Sparkles,
  ChevronRight, FileSignature, BarChart3, QrCode, History, UserCheck, Trophy, Bell, Gift,
} from 'lucide-react';
import type { SpacePage, SpaceUser, SpaceTheme, Academia } from './SpaceApp';
import { ACADEMIA_LABELS } from './SpaceApp';
import { API_BASE } from '../../config/api';

interface Props {
  user: SpaceUser;
  currentPage: SpacePage;
  onNavigate: (page: SpacePage) => void;
  onLogout: () => void;
  onExit: () => void;
  children: ReactNode;
  theme: SpaceTheme;
  onToggleTheme: () => void;
  academia: Academia;
  onSwitchAcademia: (a: Academia) => void;
  token: string;
}

// Dashboard siempre accesible. Si permisos es null (admin) todo visible.
// Si es array, solo las páginas en el array (más dashboard que es default).
function puedeVer(user: SpaceUser, page: SpacePage): boolean {
  if (page === 'dashboard') return true;
  if (user.permisos === null || user.permisos === undefined) return true; // admin
  return user.permisos.includes(page);
}

type IconType = typeof LayoutDashboard;

interface NavItem {
  page: SpacePage;
  label: string;
  icon: IconType;
}

interface NavGroup {
  key: string;
  label: string;
  icon: IconType;
  children: NavItem[];
}

type NavEntry = NavItem | NavGroup;

function isGroup(e: NavEntry): e is NavGroup {
  return (e as NavGroup).children !== undefined;
}

const NAV: NavEntry[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'alumnos', label: 'Alumnos', icon: Users },
  {
    key: 'inscripciones-group',
    label: 'Inscripciones',
    icon: FileSignature,
    children: [
      { page: 'inscripciones', label: 'Inscritos', icon: ClipboardList },
      { page: 'inscribir', label: 'Inscribir', icon: Sparkles },
      { page: 'renovar', label: 'Renovar', icon: RefreshCw },
    ],
  },
  { page: 'graduaciones', label: 'Graduaciones', icon: GraduationCap },
  {
    key: 'asistencia-group',
    label: 'Asistencia',
    icon: CalendarCheck,
    children: [
      { page: 'asistencia', label: 'Reportes', icon: BarChart3 },
      { page: 'tomar-asistencia', label: 'Tomar asistencia', icon: QrCode },
      { page: 'asistencia-historica', label: 'Registrar pasadas', icon: History },
      { page: 'asistencia-profesores', label: 'Asistencia profesores', icon: UserCheck },
    ],
  },
  { page: 'leads', label: 'Leads', icon: UserPlus },
  { page: 'compras', label: 'Compras', icon: ShoppingBag },
  { page: 'profesores', label: 'Profesores', icon: UserCheck },
  { page: 'clases-prueba', label: 'Clases prueba', icon: Sparkles },
  { page: 'referidos', label: 'Referidos', icon: Gift },
  { page: 'torneos', label: 'Torneos', icon: Trophy },
  { page: 'mensajes', label: 'Mensajes', icon: MessageSquare },
  { page: 'config', label: 'Ajustes', icon: Settings },
];

const TITLES: Record<SpacePage, string> = {
  dashboard: 'Dashboard', graduaciones: 'Graduaciones', alumnos: 'Alumnos',
  inscripciones: 'Inscritos', inscribir: 'Inscribir', renovar: 'Renovar',
  asistencia: 'Asistencia — Reportes',
  'tomar-asistencia': 'Asistencia — Tomar asistencia',
  'asistencia-historica': 'Asistencia — Registrar pasadas',
  'asistencia-profesores': 'Asistencia — Profesores',
  leads: 'Leads',
  compras: 'Compras', profesores: 'Profesores', 'clases-prueba': 'Clases de prueba', referidos: 'Referidos', torneos: 'Torneos', mensajes: 'Mensajes', config: 'Ajustes',
};

export function SpaceLayout({ user, currentPage, onNavigate, onLogout, onExit, children, theme, onToggleTheme, academia, onSwitchAcademia, token }: Props) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [notifCount, setNotifCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifItems, setNotifItems] = useState<Array<{ type: string; label: string; count: number; page: SpacePage }>>([]);
  const notifRef = useRef<HTMLDivElement>(null);

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

  // Auto-expand grupo que contiene la página activa
  useEffect(() => {
    for (const entry of NAV) {
      if (isGroup(entry) && entry.children.some((c) => c.page === currentPage)) {
        setExpandedGroups((prev) => (prev[entry.key] ? prev : { ...prev, [entry.key]: true }));
      }
    }
  }, [currentPage]);

  // Fetch notification counts
  const fetchNotifications = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [corr, stats, venc] = await Promise.all([
        fetch(`${API_BASE}/space/graduaciones/correcciones?estado=pendiente`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`${API_BASE}/space/dashboard/stats`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`${API_BASE}/space/inscripciones/vencimientos`, { headers }).then(r => r.ok ? r.json() : null),
      ]);

      const items: Array<{ type: string; label: string; count: number; page: SpacePage }> = [];

      // Correcciones de graduación
      const corrCount = Array.isArray(corr?.data) ? corr.data.length : 0;
      if (corrCount > 0) items.push({ type: 'correcciones', label: `${corrCount} corrección${corrCount !== 1 ? 'es' : ''} de graduación`, count: corrCount, page: 'graduaciones' });

      // Leads nuevos
      const leadsNew = stats?.stats?.leadsNuevos ?? 0;
      if (leadsNew > 0) items.push({ type: 'leads', label: `${leadsNew} lead${leadsNew !== 1 ? 's' : ''} nuevo${leadsNew !== 1 ? 's' : ''}`, count: leadsNew, page: 'leads' });

      // Inscripciones por vencer (próximos 7 días)
      const vencCount = Array.isArray(venc?.data) ? venc.data.length : (venc?.vencimientos?.length ?? 0);
      if (vencCount > 0) items.push({ type: 'vencimientos', label: `${vencCount} inscripción${vencCount !== 1 ? 'es' : ''} por vencer`, count: vencCount, page: 'inscripciones' });

      setNotifItems(items);
      setNotifCount(items.reduce((sum, i) => sum + i.count, 0));
    } catch { /* silent */ }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // every 60s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close notif dropdown on outside click
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  const toggleGroup = useCallback((key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

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
    <div className="w-64 h-full flex flex-col bg-white border-r border-stone-100">
      {/* Brand */}
      <div className="h-16 flex items-center justify-between px-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#e8590c] to-[#c2410c] flex items-center justify-center shrink-0">
            <span className="text-[11px] font-black text-white">S</span>
          </div>
          <div>
            <span className="text-stone-900 font-bold text-sm tracking-wide">SPACE</span>
            <span className="text-stone-300 text-[10px] block -mt-0.5">Admin Panel</span>
          </div>
        </div>
        {isMobile && (
          <button onClick={close} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-xl transition-all" aria-label="Cerrar">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        {NAV.map((entry) => {
          // Filtro por permisos
          if (isGroup(entry)) {
            const visibles = entry.children.filter((c) => puedeVer(user, c.page));
            if (visibles.length === 0) return null;
            entry = { ...entry, children: visibles };
          } else if (!puedeVer(user, entry.page)) {
            return null;
          }

          if (!isGroup(entry)) {
            const { page, label, icon: Icon } = entry;
            const active = currentPage === page;
            return (
              <button
                key={page}
                onClick={() => go(page)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200 ${
                  active
                    ? 'bg-orange-50 text-stone-900 font-medium border border-stone-200'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50 border border-transparent'
                }`}
              >
                <Icon size={16} className={active ? 'text-[var(--accent)]' : 'text-stone-400'} />
                {label}
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />}
              </button>
            );
          }

          // Grupo desplegable
          const Icon = entry.icon;
          const containsActive = entry.children.some((c) => c.page === currentPage);
          const expanded = expandedGroups[entry.key] ?? containsActive;
          return (
            <div key={entry.key}>
              <button
                onClick={() => toggleGroup(entry.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200 ${
                  containsActive
                    ? 'bg-orange-50 text-stone-900 font-medium border border-stone-200'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50 border border-transparent'
                }`}
                aria-expanded={expanded}
              >
                <Icon size={16} className={containsActive ? 'text-[var(--accent)]' : 'text-stone-400'} />
                {entry.label}
                <ChevronRight
                  size={14}
                  className={`ml-auto transition-transform duration-200 ${
                    expanded ? 'rotate-90' : ''
                  } ${containsActive ? 'text-[var(--accent)]' : 'text-stone-400'}`}
                />
              </button>

              {expanded && (
                <div className="mt-1 ml-3 pl-3 border-l border-stone-200 space-y-1">
                  {entry.children.map((child) => {
                    const ChildIcon = child.icon;
                    const childActive = currentPage === child.page;
                    return (
                      <button
                        key={child.page}
                        onClick={() => go(child.page)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[12px] transition-all duration-200 ${
                          childActive
                            ? 'bg-orange-50 text-stone-900 font-medium border border-stone-200'
                            : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50 border border-transparent'
                        }`}
                      >
                        <ChildIcon size={14} className={childActive ? 'text-[var(--accent)]' : 'text-stone-400'} />
                        {child.label}
                        {childActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User + actions */}
      <div className="px-3 py-4 border-t border-stone-100 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-2 bg-stone-50 rounded-xl border border-stone-200">
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 border border-orange-200">
            <span className="text-[var(--accent)] text-[11px] font-bold">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-stone-900 text-xs font-medium truncate">{user.nombre}</p>
            <p className="text-stone-400 text-[10px] truncate">{user.rol === 'admin' ? 'Administrador' : 'Profesor'}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => { close(); onExit(); }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[11px] text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-all"
          >
            <ExternalLink size={12} /> Sitio
          </button>
          <button
            onClick={() => { close(); onLogout(); }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[11px] text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
          >
            <LogOut size={12} /> Salir
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-dvh flex bg-[#f7f7f7] overflow-hidden">

      {/* MOBILE: Overlay */}
      {isMobile && open && (
        <div className="fixed inset-0 z-[90] flex">
          <div className="shrink-0 shadow-2xl">
            {sidebarContent}
          </div>
          <div className="flex-1 bg-black/30" onClick={close} />
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
        <header className="h-14 flex items-center gap-3 px-4 sm:px-5 border-b border-stone-200 shrink-0 bg-white">
          {(!open || isMobile) && (
            <button
              onClick={() => setOpen(true)}
              className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-xl transition-all"
              aria-label="Menu"
            >
              <PanelLeftOpen size={18} />
            </button>
          )}
          <h1 className="text-stone-900 font-semibold text-[15px]">{TITLES[currentPage]}</h1>
          <div className="ml-auto flex items-center gap-2">
            {/* Notifications bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(prev => !prev)}
                className="relative p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-xl transition-all"
                aria-label="Notificaciones"
              >
                <Bell size={18} />
                {notifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full">
                    {notifCount > 99 ? '99+' : notifCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-stone-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-stone-100">
                    <p className="text-stone-900 text-sm font-medium">Notificaciones</p>
                  </div>
                  {notifItems.length === 0 ? (
                    <div className="px-4 py-6 text-center text-stone-400 text-sm">
                      Sin notificaciones pendientes
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto">
                      {notifItems.map(item => {
                        const iconMap: Record<string, { bg: string; icon: typeof Bell }> = {
                          correcciones: { bg: 'bg-amber-50', icon: GraduationCap },
                          leads: { bg: 'bg-blue-50', icon: UserPlus },
                          vencimientos: { bg: 'bg-rose-50', icon: CalendarCheck },
                        };
                        const style = iconMap[item.type] || { bg: 'bg-orange-50', icon: Bell };
                        const ItemIcon = style.icon;
                        return (
                          <button
                            key={item.type}
                            onClick={() => { onNavigate(item.page); setNotifOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 transition-colors border-b border-stone-50 last:border-0"
                          >
                            <div className={`w-8 h-8 rounded-full ${style.bg} flex items-center justify-center shrink-0`}>
                              <ItemIcon size={14} className="text-[var(--accent)]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-stone-900 text-xs font-medium">{item.label}</p>
                              <p className="text-stone-400 text-[10px]">Toca para ver</p>
                            </div>
                            <span className="shrink-0 w-5 h-5 flex items-center justify-center bg-red-100 text-red-600 text-[10px] font-bold rounded-full">
                              {item.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Academia switcher */}
            {user.academias && user.academias.length > 1 && (
              <div className="flex items-center bg-stone-100 rounded-lg p-1 gap-1">
                {user.academias.map((a) => (
                  <button
                    key={a}
                    onClick={() => onSwitchAcademia(a)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      academia === a
                        ? 'bg-[var(--accent)] text-white shadow-sm'
                        : 'text-stone-400 hover:text-stone-700 hover:bg-stone-50'
                    }`}
                    title={ACADEMIA_LABELS[a]}
                  >
                    <span>{a === 'amas' ? '🐺' : '🐉'}</span>
                    {a === 'amas' ? 'Wolf' : 'Dragon'}
                  </button>
                ))}
              </div>
            )}
          </div>
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
