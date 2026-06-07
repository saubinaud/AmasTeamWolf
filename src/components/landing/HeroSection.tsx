import { MessageCircle, ArrowRight } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

interface HeroSectionProps {
  onOpenTrialModal: () => void;
  onScrollToSection: (id: string) => void;
}

export function HeroSection({ onOpenTrialModal, onScrollToSection }: HeroSectionProps) {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 md:pt-0"
      style={{
        backgroundImage: `url('https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1920/v1763124726/Academia_Medalla_Photo_copy_desesj.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'scroll'
      }}
    >
      {/* Overlay con degradado */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-black" />

      {/* Patron de puntos */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'radial-gradient(circle, #FA7B21 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />

      {/* Badge flotante mejorado - responsive */}
      <div className="absolute top-20 right-2 md:top-32 md:right-8 z-20 max-w-[45%] md:max-w-none">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] blur-xl opacity-70 animate-pulse" />
          <div className="relative bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white px-3 py-2 md:px-6 md:py-3 rounded-full text-xs md:text-sm font-bold shadow-2xl border-2 border-white/20 whitespace-nowrap">
            🔥 Últimos 15 cupos
          </div>
        </div>
      </div>

      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto py-12 md:py-0">
        <ScrollReveal>
          <div className="mb-4 md:mb-6">
            <span className="inline-block bg-white/10 border border-white/20 text-white px-4 py-2 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-semibold">
              20 años transformando vidas
            </span>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-white mb-4 md:mb-6 leading-tight font-bold px-2">
            ¿Tu hijo es <span className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] bg-clip-text text-transparent">tímido</span> o le cuesta{' '}
            <span className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] bg-clip-text text-transparent">seguir reglas</span>?
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="text-lg sm:text-xl md:text-3xl text-white/90 mb-8 md:mb-12 max-w-4xl mx-auto leading-relaxed px-2">
            Transformamos niños <strong className="text-[#FA7B21]">inseguros</strong> en{' '}
            <strong className="text-[#FA7B21]">líderes seguros</strong>.
            <br className="hidden sm:block" />
            <span className="text-base sm:text-lg md:text-xl text-white/70 block mt-2">Sin gritos. Sin presión. Resultados visibles en 2 meses.</span>
          </p>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center mb-8 md:mb-12 px-2">
            <button
              onClick={onOpenTrialModal}
              className="group relative px-8 py-4 md:px-12 md:py-6 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white text-base md:text-xl font-bold rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#FA7B21]/50 w-full sm:w-auto"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#FCA929] to-[#FA7B21] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 flex items-center justify-center gap-2 md:gap-3">
                <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
                <span className="whitespace-nowrap">Agendar clase de prueba</span>
              </span>
            </button>

            <button
              onClick={() => onScrollToSection('problemas')}
              className="text-white/80 hover:text-white flex items-center gap-2 text-base md:text-lg transition-all duration-300 group"
            >
              <span>Ver cómo funciona</span>
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-2 transition-transform duration-300" />
            </button>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={400}>
          <div className="grid grid-cols-3 gap-3 sm:gap-6 md:gap-8 max-w-3xl mx-auto px-2">
            {[
              { num: '+300', label: 'Familias felices' },
              { num: '20', label: 'Años de experiencia' },
              { num: '12', label: 'Alumnos máx/grupo' }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl sm:text-3xl md:text-5xl font-bold bg-gradient-to-r from-[#FA7B21] to-[#FCA929] bg-clip-text text-transparent mb-1 md:mb-2">
                  {stat.num}
                </div>
                <div className="text-white/70 text-xs sm:text-sm md:text-base leading-tight">{stat.label}</div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>

      {/* Indicador de scroll - solo desktop */}
      <div className="hidden md:block absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-8 h-12 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
