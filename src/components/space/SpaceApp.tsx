import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../../config/api';
import { SpaceLogin } from './SpaceLogin';
import { SpaceLayout } from './SpaceLayout';
import { SpaceDashboard } from './SpaceDashboard';
import { SpaceGraduaciones } from './SpaceGraduaciones';
import { SpaceAlumnos } from './SpaceAlumnos';
import { SpaceInscripciones } from './SpaceInscripciones';
import { SpaceAsistencia } from './SpaceAsistencia';
import { SpaceLeads } from './SpaceLeads';
import { SpaceConfig } from './SpaceConfig';
import { SpaceMensajes } from './SpaceMensajes';

export type SpacePage = 'dashboard' | 'graduaciones' | 'alumnos' | 'inscripciones' | 'asistencia' | 'leads' | 'mensajes' | 'config';

export interface SpaceUser {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'profesor';
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

export function SpaceApp({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('space_token'));
  const [user, setUser] = useState<SpaceUser | null>(null);
  const [currentPage, setCurrentPage] = useState<SpacePage>('dashboard');
  const [loading, setLoading] = useState(true);

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

  const handleNavigate = useCallback((page: SpacePage) => setCurrentPage(page), []);
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
    <SpaceLayout user={user} currentPage={currentPage} onNavigate={handleNavigate} onLogout={handleLogout} onExit={handleExit}>
      {currentPage === 'dashboard' && <SpaceDashboard token={token} userName={user.nombre} onNavigate={handleNavigate} />}
      {currentPage === 'graduaciones' && <SpaceGraduaciones token={token} />}
      {currentPage === 'alumnos' && <SpaceAlumnos token={token} />}
      {currentPage === 'inscripciones' && <SpaceInscripciones token={token} />}
      {currentPage === 'asistencia' && <SpaceAsistencia token={token} />}
      {currentPage === 'leads' && <SpaceLeads token={token} />}
      {currentPage === 'mensajes' && <SpaceMensajes token={token} />}
      {currentPage === 'config' && <SpaceConfig token={token} />}
    </SpaceLayout>
  );
}
