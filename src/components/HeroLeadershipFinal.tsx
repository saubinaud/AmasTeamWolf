import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ChevronDown, Info, Sparkles } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { useDataSaver } from '../hooks/useNetworkStatus';

export function HeroLeadershipFinal() {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [_isMobile, setIsMobile] = useState(false);
  const isDataSaver = useDataSaver();
  const shouldDisableHeavyAnimations = isDataSaver;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scrollToRoadmap = () => {
    const element = document.getElementById('roadmap');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Advanced Gradient Background */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black" />

        {/* Animated gradient overlays */}
        {!shouldDisableHeavyAnimations ? (
          <>
            <div
              className="absolute inset-0 opacity-30 hero-pulse-slow"
              style={{
                background: 'radial-gradient(circle at 20% 50%, rgba(250, 123, 33, 0.15) 0%, transparent 50%)'
              }}
            />

            <div
              className="absolute inset-0 opacity-20 hero-pulse-slower"
              style={{
                background: 'radial-gradient(circle at 80% 50%, rgba(252, 169, 41, 0.2) 0%, transparent 60%)'
              }}
            />
          </>
        ) : (
          <>
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
          </>
        )}

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
        <div className="max-w-6xl mx-auto text-center animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#431C28]/30 border border-[#FA7B21]/30 rounded-full px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#FCA929]" />
            <span className="text-[#FCA929] text-xs sm:text-sm uppercase tracking-wider">Programa Avanzado</span>
          </div>

          {/* Main Title */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h1
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl mb-1 sm:mb-2 md:mb-4 px-4"
              style={{
                background: 'linear-gradient(to right, #fef2f2, #ffffff, #fef2f2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              PROGRAMA
            </h1>
            <div className="relative inline-block">
              <h1
                className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl relative z-10 px-4 ${!shouldDisableHeavyAnimations ? 'hero-gradient-text' : ''}`}
                style={{
                  background: 'linear-gradient(135deg, #FA7B21 0%, #FCA929 25%, #FDCB6E 50%, #FCA929 75%, #FA7B21 100%)',
                  backgroundSize: shouldDisableHeavyAnimations ? '100% 100%' : '200% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                LEADERSHIP
              </h1>
              {/* Glow effect */}
              {!shouldDisableHeavyAnimations && (
                <div
                  className="absolute inset-0 blur-2xl opacity-50 hero-pulse-slow"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(252, 169, 41, 0.4) 0%, transparent 70%)'
                  }}
                />
              )}
            </div>
          </div>

          <h2 className="text-white/90 text-base sm:text-lg md:text-xl lg:text-2xl mb-4 sm:mb-6 md:mb-8 px-4 max-w-4xl mx-auto">
            Dale a tu Hijo las Herramientas para Destacar
          </h2>

          <p className="text-white/70 text-xs sm:text-sm md:text-base lg:text-lg mb-6 sm:mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
            Porque los niños comprometidos merecen un programa a su altura.
            Equipamiento específico, entrenamiento especializado y un desarrollo curricular
            avanzado que fortalece su carácter, disciplina y autoestima.
          </p>

          {/* Collapsible Info */}
          <div className="max-w-4xl mx-auto mb-6 sm:mb-8 md:mb-12 px-4">
            <Collapsible open={isInfoOpen} onOpenChange={setIsInfoOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  className="w-full bg-zinc-900/60 border border-[#FA7B21]/30 text-white hover:bg-zinc-900/80 hover:border-[#FA7B21]/50 transition-all duration-300 py-5 sm:py-6 group hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Info className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-[#FCA929]" />
                  <span className="text-sm sm:text-base">¿Qué es el Programa Leadership?</span>
                  <div
                    className="ml-auto transition-transform duration-300"
                    style={{ transform: isInfoOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-[#FCA929]" />
                  </div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="overflow-hidden">
                  <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/60 border border-[#FA7B21]/20 rounded-xl p-6 sm:p-8 mt-4 shadow-2xl">
                    <div className="space-y-5 text-left">
                      <div>
                        <h3 className="text-white mb-3 text-base sm:text-lg">Programa Integral de Desarrollo Marcial Avanzado</h3>
                        <p className="text-white/70 text-sm sm:text-base leading-relaxed">
                          Diseñado para estudiantes que desean profundizar en las artes marciales con un
                          <strong className="text-white"> desarrollo curricular más avanzado</strong>. A través del
                          uso de implementos específicos con características técnicas precisas, tu hijo accederá a
                          un nivel de entrenamiento superior.
                        </p>
                      </div>

                      <div className="bg-[#431C28]/20 border border-[#FA7B21]/20 rounded-lg p-4">
                        <h4 className="text-[#FCA929] mb-3 text-sm sm:text-base">Implementos Específicos del Programa:</h4>
                        <ul className="space-y-2 text-white/70 text-xs sm:text-sm">
                          <li className="flex items-start gap-2">
                            <span className="text-[#FCA929] mt-0.5">•</span>
                            <span><strong className="text-white">Guantes</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-[#FCA929] mt-0.5">•</span>
                            <span><strong className="text-white">Zapatos</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-[#FCA929] mt-0.5">•</span>
                            <span><strong className="text-white">Bo Staff</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-[#FCA929] mt-0.5">•</span>
                            <span><strong className="text-white">Combat Weapon</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-[#FCA929] mt-0.5">•</span>
                            <span><strong className="text-white">Nunchaku</strong></span>
                          </li>
                        </ul>
                      </div>

                      <p className="text-white/90 text-sm sm:text-base bg-gradient-to-r from-[#431C28]/30 to-transparent p-4 rounded-lg border-l-4 border-[#FA7B21]">
                        <strong>No reemplaza su programa actual, lo eleva.</strong> Mientras continúa asistiendo
                        a sus clases habituales, desarrolla habilidades avanzadas con equipamiento especializado.
                      </p>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div>
            <Button
              size="lg"
              onClick={scrollToRoadmap}
              className="bg-gradient-to-r from-[#FA7B21] to-[#F36A15] hover:from-[#F36A15] hover:to-[#E65C0F] text-white px-5 sm:px-8 md:px-10 py-4 sm:py-5 md:py-7 text-xs sm:text-sm md:text-base lg:text-lg shadow-2xl shadow-[#FA7B21]/30 hover:shadow-[#FA7B21]/50 transition-all duration-300 relative overflow-hidden group hover:scale-105 active:scale-95"
            >
              <span className="relative z-10">Descubre el Camino Leadership</span>
              {!shouldDisableHeavyAnimations && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent hero-shimmer" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 hero-bounce">
        <div className="flex flex-col items-center gap-2">
          <span className="text-white/40 text-xs sm:text-sm">Desliza para explorar</span>
          <ChevronDown className="text-[#FCA929]/60 h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>
    </section>
  );
}
