import React, { useEffect, useRef, memo } from 'react';

/**
 * Entrada suave al aparecer. El contenido siempre está visible: si no hay
 * IntersectionObserver, si el usuario pide menos movimiento o si ya estaba en
 * pantalla al cargar, no se anima. Solo cuando el bloque entra desde abajo se
 * reproduce una animación corta (opacidad y desplazamiento, 350 ms) con la
 * Web Animations API, sin clases que lo dejen oculto.
 */
export const ScrollReveal = memo(({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined' || typeof el.animate !== 'function') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    // Lo que ya se ve al cargar no se anima
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        el.animate(
          [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }],
          { duration: 350, delay: Math.min(delay, 150), easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'backwards' }
        );
      },
      // Arranca un poco antes de que el bloque asome
      { rootMargin: '0px 0px 60px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return <div ref={ref}>{children}</div>;
});

ScrollReveal.displayName = 'ScrollReveal';
