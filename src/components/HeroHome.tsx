import { Button } from './ui/button';
import { ChevronDown, Sparkles } from 'lucide-react';

interface HeroHomeProps {
  onOpenMatricula: () => void;
}

export function HeroHome({ onOpenMatricula }: HeroHomeProps) {
  const scrollToProgramas = () => {
    const element = document.getElementById('programas');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Advanced Gradient Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black" />
        
        {/* Static gradient overlays - sin animaciones */}
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

        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(252, 169, 41, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(252, 169, 41, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#431C28]/30 border border-[#FA7B21]/30 rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#FCA929]" />
            <span className="text-[#FCA929] text-xs sm:text-sm uppercase tracking-wider">Academia AMAS Team Wolf</span>
          </div>

          {/* Main Title */}
          <div className="mb-6 sm:mb-8 md:mb-10">
            <div className="relative inline-block mb-4">
              <h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl relative z-10 px-4"
                style={{
                  background: 'linear-gradient(135deg, #FA7B21 0%, #FCA929 25%, #FDCB6E 50%, #FCA929 75%, #FA7B21 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Formamos líderes
              </h1>
            </div>
            <h1 
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-4 px-4"
              style={{
                background: 'linear-gradient(to right, #fef2f2, #ffffff, #fef2f2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              desde pequeños
            </h1>
          </div>
          
          <p className="text-white/80 text-base sm:text-lg md:text-xl lg:text-2xl mb-8 sm:mb-10 md:mb-12 max-w-4xl mx-auto leading-relaxed px-4">
            Descubre el programa ideal para tu hijo y empieza hoy. Disciplina, respeto y crecimiento personal a través del taekwondo.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
            <Button
              type="button"
              onClick={scrollToProgramas}
              size="lg"
              data-umami-event="Click Ver Programas"
              data-umami-event-ubicacion="hero"
              className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white px-6 sm:px-10 py-5 sm:py-7 text-base sm:text-lg w-full sm:w-auto shadow-2xl shadow-[#FA7B21]/30 hover:shadow-[#FA7B21]/50 transition-all duration-300 relative overflow-hidden group active:scale-95"
              style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <span className="relative z-10 pointer-events-none">Ver programas</span>
            </Button>
            
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenMatricula();
              }}
              size="lg"
              data-umami-event="Click Matricular Ahora"
              data-umami-event-ubicacion="hero"
              className="bg-transparent border border-[#FA7B21]/30 text-white hover:bg-[#FA7B21]/10 hover:border-[#FA7B21]/50 px-6 sm:px-10 py-5 sm:py-7 text-base sm:text-lg w-full sm:w-auto transition-all duration-300 backdrop-blur-sm active:scale-95"
              style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              Matricular ahora
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 pointer-events-none select-none">
        <div className="flex flex-col items-center gap-2">
          <span className="text-white/40 text-xs sm:text-sm">Desliza para explorar</span>
          <ChevronDown className="text-[#FCA929]/60 h-5 w-5 sm:h-6 sm:w-6 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
