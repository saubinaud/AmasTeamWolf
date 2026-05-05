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
  asistencia: '/asistencia',
  'asistencia-panel': '/asistencia/panel',
  'consulta-asistencia': '/consulta-asistencia',
  terminos: '/terminos',
  'vincular-cuenta': '/vincular-cuenta',
  space: '/space',
};

export function useAppNavigate() {
  const navigate = useNavigate();
  return (page: string, sectionId?: string) => {
    const path = PAGE_TO_PATH[page] || `/${page}`;
    if (sectionId) {
      navigate(`${path}?section=${sectionId}`);
    } else {
      navigate(path);
    }
  };
}
