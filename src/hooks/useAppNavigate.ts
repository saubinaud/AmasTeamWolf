import { useNavigate } from 'react-router-dom';

const PAGE_TO_PATH: Record<string, string> = {
  home: '/',
  leadership: '/leadership',
  'registro-3-meses': '/registro-3-meses',
  'registro-6-meses': '/registro-6-meses',
  'registro-mensual': '/registro-mensual',
  'registro-leadership': '/registro-leadership',
  tienda: '/tienda',
  graduacion: '/graduacion',
  'clase-prueba': '/clase-prueba',
  'inicio-sesion': '/inicio-sesion',
  perfil: '/perfil',
  renovacion: '/renovacion',
  'renovacion-navidad': '/renovacion-navidad',
  'registro-actividad-navidad': '/navidad',
  'registro-showroom': '/registro-showroom',
  torneo: '/torneo',
  'om-yoga': '/om-yoga',
  asistencia: '/asistencia',
  'asistencia-panel': '/asistencia/panel',
  'consulta-asistencia': '/consulta-asistencia',
  terminos: '/terminos',
  reclamaciones: '/reclamaciones',
  'vincular-cuenta': '/vincular-cuenta',
  space: '/space',
};

/** URL real de una página (y sección): la usan los <a href> del menú y el pie. */
export function rutaDe(page: string, sectionId?: string) {
  const path = PAGE_TO_PATH[page] || `/${page}`;
  return sectionId ? `${path}?section=${sectionId}` : path;
}

/**
 * Clic en un enlace interno: con Ctrl/Cmd, clic central o Mayús deja que el
 * navegador abra otra pestaña; si no, navega dentro de la web sin recargar.
 */
export function clicInterno(e: { preventDefault(): void; button?: number; metaKey?: boolean; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean }, navegar: () => void) {
  if (e.button !== undefined && e.button !== 0) return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  navegar();
}

export function useAppNavigate() {
  const navigate = useNavigate();
  return (page: string, sectionId?: string) => navigate(rutaDe(page, sectionId));
}
