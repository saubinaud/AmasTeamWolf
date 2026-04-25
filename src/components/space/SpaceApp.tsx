import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../../config/api';
import { SpaceLogin } from './SpaceLogin';
import { SpaceLayout } from './SpaceLayout';
import { SpaceDashboard } from './SpaceDashboard';
import { SpaceGraduaciones } from './SpaceGraduaciones';
import { SpaceAlumnos } from './SpaceAlumnos';
import { SpaceInscripciones } from './SpaceInscripciones';
import { SpaceInscribir } from './SpaceInscribir';
import { SpaceRenovar } from './SpaceRenovar';
import { SpaceAsistencia } from './SpaceAsistencia';
import { SpaceAsistenciaHistorica } from './SpaceAsistenciaHistorica';
import { SpaceLeads } from './SpaceLeads';
import { SpaceConfig } from './SpaceConfig';
import { SpaceMensajes } from './SpaceMensajes';
import { SpaceCompras } from './SpaceCompras';
import { AsistenciaPanelPage } from '../AsistenciaPanelPage';
import { SpaceProfesores } from './SpaceProfesores';
import { SpaceClasesPrueba } from './SpaceClasesPrueba';
import { SpaceAsistenciaProfesores } from './SpaceAsistenciaProfesores';
import { SpaceTorneos } from './SpaceTorneos';

export type SpacePage =
  | 'dashboard'
  | 'graduaciones'
  | 'alumnos'
  | 'inscripciones'
  | 'inscribir'
  | 'renovar'
  | 'asistencia'
  | 'tomar-asistencia'
  | 'asistencia-historica'
  | 'leads'
  | 'mensajes'
  | 'compras'
  | 'profesores'
  | 'asistencia-profesores'
  | 'clases-prueba'
  | 'torneos'
  | 'config';

export type Academia = 'amas' | 'dk';

export const ACADEMIA_LABELS: Record<Academia, string> = {
  amas: 'AMAS Team Wolf',
  dk: 'Dragon Knight',
};

export interface SpaceUser {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'profesor';
  permisos?: SpacePage[]; // NULL/undefined = admin con acceso total
  academias?: Academia[]; // academias a las que tiene acceso
}

function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-stone-900 text-2xl font-bold mb-2">{title}</h2>
        <p className="text-stone-400">{description}</p>
      </div>
    </div>
  );
}

export type SpaceTheme = 'dark' | 'light';

export function SpaceApp({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('space_token'));
  const [user, setUser] = useState<SpaceUser | null>(null);
  const [currentPage, setCurrentPage] = useState<SpacePage>('dashboard');
  const [loading, setLoading] = useState(true);
  const theme: SpaceTheme = 'light';
  const [academia, setAcademia] = useState<Academia>(
    () => (localStorage.getItem('space_academia') as Academia | null) ?? 'amas',
  );

  // Persist academia selection + inject X-Academia header on all Space API calls
  useEffect(() => {
    localStorage.setItem('space_academia', academia);

    const originalFetch = window.fetch;
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : String(input));
      if (url.includes('/api/space/') || url.includes('/api/asistencia') || url.includes('/api/matricula')) {
        const headers = new Headers(init?.headers);
        if (!headers.has('X-Academia')) {
          headers.set('X-Academia', academia);
        }
        init = { ...init, headers };
      }
      return originalFetch.call(window, input, init);
    } as typeof fetch;
    return () => { window.fetch = originalFetch; };
  }, [academia]);

  // Reset to dashboard when switching academia
  const handleSwitchAcademia = useCallback((a: Academia) => {
    setAcademia(a);
    setCurrentPage('dashboard');
  }, []);

  // Inject NODUM light-theme CSS custom properties on mount
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent', '#e8590c');
    root.style.setProperty('--accent-hover', '#c2410c');
    root.style.setProperty('--accent-light', '#fff7ed');
    root.style.setProperty('--success', '#0f766e');
    return () => {
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-hover');
      root.style.removeProperty('--accent-light');
      root.style.removeProperty('--success');
    };
  }, []);

  const toggleTheme = useCallback(() => {
    // noop — always light theme
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('space_token');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`${API_BASE}/space/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (!r.ok && r.status >= 500) throw new Error('Server error');
        return r.json();
      })
      .then(d => { if (d.success) setUser(d.usuario); else handleLogout(); })
      .catch(() => handleLogout())
      .finally(() => setLoading(false));
  }, [token, handleLogout]);

  const handleLogin = useCallback((newToken: string, usuario: SpaceUser) => {
    localStorage.setItem('space_token', newToken);
    setToken(newToken);
    setUser(usuario);
  }, []);

  const handleNavigate = useCallback((page: SpacePage) => {
    // Bloquear navegación a páginas sin permiso
    if (user && user.rol !== 'admin' && Array.isArray(user.permisos) && page !== 'dashboard') {
      if (!user.permisos.includes(page)) {
        setCurrentPage('dashboard');
        return;
      }
    }
    setCurrentPage(page);
  }, [user]);
  const handleExit = useCallback(() => onNavigate('home'), [onNavigate]);

  if (loading) {
    return (
      <div className="space-app h-dvh bg-[#f7f7f7] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#e8590c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !token) return <div className="space-app"><SpaceLogin onLogin={handleLogin} /></div>;

  return (
    <div className="space-app contents">
    <SpaceLayout
      user={user}
      currentPage={currentPage}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      onExit={handleExit}
      theme={theme}
      onToggleTheme={toggleTheme}
      academia={academia}
      onSwitchAcademia={handleSwitchAcademia}
    >
      {currentPage === 'dashboard' && <SpaceDashboard token={token} userName={user.nombre} onNavigate={handleNavigate} />}
      {currentPage === 'graduaciones' && <SpaceGraduaciones token={token} />}
      {currentPage === 'alumnos' && <SpaceAlumnos token={token} />}
      {currentPage === 'inscripciones' && <SpaceInscripciones token={token} />}
      {currentPage === 'inscribir' && <SpaceInscribir token={token} onGoToInscritos={() => handleNavigate('inscripciones')} />}
      {currentPage === 'renovar' && <SpaceRenovar token={token} onGoToInscritos={() => handleNavigate('inscripciones')} />}
      {currentPage === 'asistencia' && <SpaceAsistencia token={token} />}
      {currentPage === 'tomar-asistencia' && (
        <AsistenciaPanelPage onNavigate={() => handleNavigate('asistencia')} skipAuth embedMode />
      )}
      {currentPage === 'asistencia-historica' && <SpaceAsistenciaHistorica token={token} />}
      {currentPage === 'leads' && <SpaceLeads token={token} />}
      {currentPage === 'mensajes' && <SpaceMensajes token={token} />}
      {currentPage === 'compras' && <SpaceCompras token={token} />}
      {currentPage === 'profesores' && <SpaceProfesores token={token} />}
      {currentPage === 'asistencia-profesores' && <SpaceAsistenciaProfesores token={token} />}
      {currentPage === 'clases-prueba' && <SpaceClasesPrueba token={token} />}
      {currentPage === 'torneos' && <SpaceTorneos token={token} />}
      {currentPage === 'config' && <SpaceConfig token={token} />}
    </SpaceLayout>
    </div>
  );
}
