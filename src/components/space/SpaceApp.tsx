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
  | 'config';

export interface SpaceUser {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'profesor';
  permisos?: SpacePage[]; // NULL/undefined = admin con acceso total
}

function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-white text-2xl font-bold mb-2">{title}</h2>
        <p className="text-white/50">{description}</p>
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
  const [theme, setTheme] = useState<SpaceTheme>(
    () => (localStorage.getItem('space_theme') as SpaceTheme | null) ?? 'dark',
  );

  // Aplicar clase al body para que modales (React Portal) también la hereden.
  // Al desmontar Space (salir al sitio) limpiar la clase para no afectar al site público.
  useEffect(() => {
    const body = document.body;
    if (theme === 'light') {
      body.classList.add('space-light');
    } else {
      body.classList.remove('space-light');
    }
    localStorage.setItem('space_theme', theme);
    return () => {
      body.classList.remove('space-light');
    };
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('space_token');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`${API_BASE}/space/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
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
      <div className="h-dvh bg-zinc-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#FA7B21] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !token) return <SpaceLogin onLogin={handleLogin} />;

  return (
    <SpaceLayout
      user={user}
      currentPage={currentPage}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      onExit={handleExit}
      theme={theme}
      onToggleTheme={toggleTheme}
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
      {currentPage === 'config' && <SpaceConfig token={token} />}
    </SpaceLayout>
  );
}
