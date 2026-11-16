import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HeaderMain } from './HeaderMain';
import { HeroHome } from './HeroHome';
import { ProgramasSection } from './ProgramasSection';
import { TiendaSection } from './TiendaSection';
import { NosotrosSection } from './NosotrosSection';
import { FooterMain } from './FooterMain';
import { useLayoutContext } from '../layouts/MainLayout';
import { NetworkStatusIndicator } from './NetworkStatusIndicator';
import { BannerOmYoga } from './omYoga/BannerOmYoga';
import { ui } from '../styles/marca';

interface HomePageProps {
  onNavigate: (page: string, sectionId?: string) => void;
}

/** Monta la sección cuando se acerca a la pantalla (o de inmediato si `ya`). */
function LazySection({ children, ya = false }: { children: React.ReactNode; ya?: boolean }) {
  const [visible, setVisible] = useState(ya);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ya) { setVisible(true); return; }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ya]);

  return <div ref={ref}>{visible ? children : <div style={{ minHeight: 200 }} />}</div>;
}

export function HomePage({ onNavigate }: HomePageProps) {
  // Carrito y pago: los de toda la web (MainLayout)
  const { onAddToCart, onCartClick, cartItemsCount, onOpenMatricula } = useLayoutContext();
  const [params] = useSearchParams();
  const seccion = params.get('section');

  // Con ?section=programas|tienda|nosotros (enlaces del menú) baja a esa sección; si no, arriba
  useEffect(() => {
    if (!seccion) { window.scrollTo(0, 0); return; }
    let intentos = 0;
    let ajuste: ReturnType<typeof setTimeout> | undefined;
    const t = setInterval(() => {
      const el = document.getElementById(seccion);
      if (el || ++intentos > 40) {
        clearInterval(t);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Las secciones de arriba cargan datos y crecen: se corrige la posición al final
        ajuste = setTimeout(() => {
          const top = document.getElementById(seccion)?.getBoundingClientRect().top ?? 0;
          if (Math.abs(top) > 120) document.getElementById(seccion)?.scrollIntoView({ block: 'start' });
        }, 1200);
      }
    }, 100);
    return () => { clearInterval(t); if (ajuste) clearTimeout(ajuste); };
  }, [seccion]);

  const abrirMatricula = useCallback((codigo = 'full') => onOpenMatricula(codigo), [onOpenMatricula]);

  return (
    <div className={`relative overflow-hidden ${ui.pagina}`}>
      {/* Un solo resplandor cálido de fondo */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-[#FA7B21]/15 blur-3xl" />
      </div>

      <div className="relative z-10">
        <HeaderMain
          onNavigate={onNavigate}
          onOpenMatricula={() => abrirMatricula('full')}
          onCartClick={onCartClick}
          cartItemsCount={cartItemsCount}
          currentPage="home"
        />
        <NetworkStatusIndicator />

        <HeroHome onNavigate={onNavigate} />
        <BannerOmYoga />

        <LazySection ya={!!seccion}>
          <ProgramasSection onOpenMatricula={abrirMatricula} />
        </LazySection>
        <LazySection ya={!!seccion}>
          <TiendaSection onAddToCart={onAddToCart} onNavigate={onNavigate} />
        </LazySection>
        <LazySection ya={!!seccion}>
          <NosotrosSection />
        </LazySection>

        <FooterMain onNavigate={onNavigate} onOpenMatricula={() => abrirMatricula('full')} />
      </div>
    </div>
  );
}
