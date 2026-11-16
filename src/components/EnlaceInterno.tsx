import type { ReactNode } from 'react';
import { rutaDe, clicInterno } from '../hooks/useAppNavigate';

interface EnlaceInternoProps {
  page: string;
  section?: string;
  onNavigate: (page: string, sectionId?: string) => void;
  /** Se llama antes de navegar (p. ej. cerrar el menú) */
  alNavegar?: () => void;
  className?: string;
  children: ReactNode;
  'aria-current'?: 'page' | undefined;
  'data-umami-event'?: string;
  'data-umami-event-ubicacion'?: string;
}

/**
 * Enlace con URL real (se puede abrir en otra pestaña y Google lo sigue) que,
 * con un clic normal, navega dentro de la web sin recargar.
 */
export function EnlaceInterno({ page, section, onNavigate, alNavegar, className, children, ...resto }: EnlaceInternoProps) {
  return (
    <a
      href={rutaDe(page, section)}
      onClick={(e) => clicInterno(e, () => { alNavegar?.(); onNavigate(page, section); })}
      className={className}
      {...resto}
    >
      {children}
    </a>
  );
}
