import { useState, useEffect, useCallback, useRef } from 'react';
import { HeaderMain } from './HeaderMain';
import { HeroHome } from './HeroHome';
import { ProgramasSection } from './ProgramasSection';
import { TiendaSection } from './TiendaSection';
import { NosotrosSection } from './NosotrosSection';
import { FooterMain } from './FooterMain';
import { useLayoutContext } from '../layouts/MainLayout';
import { NetworkStatusIndicator } from './NetworkStatusIndicator';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

function LazySection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : <div style={{ minHeight: 200 }} />}
    </div>
  );
}

export function HomePage({ onNavigate }: HomePageProps) {
  // Carrito y pago: los de toda la web (MainLayout)
  const { onAddToCart, onCartClick, cartItemsCount, onOpenMatricula } = useLayoutContext();

  // Scroll to top when component mounts
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const handleOpenMatricula = useCallback((codigo = 'full') => onOpenMatricula(codigo), [onOpenMatricula]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Advanced Gradient Background - igual que el hero */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black" />
        
        {/* Animated gradient overlays */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(circle at 20% 50%, rgba(250, 123, 33, 0.15) 0%, transparent 50%)'
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(circle at 80% 50%, rgba(252, 169, 41, 0.2) 0%, transparent 60%)'
          }}
        />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px'
          }}
        />
      </div>

      {/* Contenido con z-index superior */}
      <div className="relative z-10">
        <HeaderMain
          onNavigate={onNavigate}
          onOpenMatricula={() => handleOpenMatricula('full')}
          onCartClick={onCartClick}
          cartItemsCount={cartItemsCount}
          currentPage="home"
        />
        
        <NetworkStatusIndicator />
        
        <HeroHome onOpenMatricula={() => handleOpenMatricula('full')} />
        
        <LazySection>
          <ProgramasSection onOpenMatricula={handleOpenMatricula} />
        </LazySection>

        <LazySection>
          <TiendaSection onAddToCart={onAddToCart} onNavigate={onNavigate} />
        </LazySection>

        <LazySection>
          <NosotrosSection />
        </LazySection>
        
        <FooterMain 
          onNavigate={onNavigate}
          onOpenMatricula={() => handleOpenMatricula('full')}
        />
      </div>

    </div>
  );
}
