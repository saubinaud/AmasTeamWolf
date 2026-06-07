import { MessageCircle, CalendarCheck, Users, Heart, Target } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

interface ProcesoSectionProps {
  onOpenTrialModal: () => void;
}

const steps = [
  { num: 1, icon: <CalendarCheck className="w-5 h-5 md:w-6 md:h-6" />, title: 'AGENDAS', desc: 'Clase de prueba individual', price: 'Inversión: S/40' },
  { num: 2, icon: <Users className="w-5 h-5 md:w-6 md:h-6" />, title: 'VIENES', desc: 'Conoces instalaciones y profesoras', price: 'Sin compromiso' },
  { num: 3, icon: <Heart className="w-5 h-5 md:w-6 md:h-6" />, title: 'DECIDES', desc: 'Evalúas si AMAS es para tu familia', price: 'Sin presión' },
  { num: 4, icon: <Target className="w-5 h-5 md:w-6 md:h-6" />, title: 'TE INSCRIBES', desc: 'Los S/40 se descuentan al 100%', price: '¡Clase GRATIS!' }
];

export function ProcesoSection({ onOpenTrialModal }: ProcesoSectionProps) {
  return (
    <section className="relative py-16 md:py-32 px-4 bg-gradient-to-b from-black via-[#0D0D0D] to-black overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <ScrollReveal>
          <div className="text-center mb-12 md:mb-20">
            <span className="inline-block bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white px-4 py-2 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-bold mb-4 md:mb-6">
              Proceso simple
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-6xl text-white mb-4 md:mb-6 font-bold px-2">
              ¿Cómo <span className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] bg-clip-text text-transparent">funciona</span>?
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-12 md:mb-16 relative">
          {/* Linea conectora - solo desktop */}
          <div className="hidden md:block absolute top-12 md:top-16 left-0 right-0 h-1 bg-gradient-to-r from-[#FA7B21] via-[#FCA929] to-[#FA7B21] opacity-20" style={{ width: '80%', margin: '0 auto' }} />

          {steps.map((step, i) => (
            <ScrollReveal key={i} delay={i * 100}>
              <div className="text-center relative z-10">
                <div className="relative inline-block mb-4 md:mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] blur-2xl opacity-50 animate-pulse" />
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl md:rounded-3xl bg-gradient-to-br from-[#FA7B21] to-[#FCA929] flex flex-col items-center justify-center text-white shadow-2xl transform hover:scale-110 hover:rotate-3 transition-all duration-300">
                    <div className="text-3xl md:text-4xl font-bold mb-1">{step.num}</div>
                    <div className="text-white/80">{step.icon}</div>
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl text-white font-bold mb-2 md:mb-3">{step.title}</h3>
                <p className="text-white/70 leading-relaxed mb-2 text-sm md:text-base">{step.desc}</p>
                <p className="text-[#FA7B21] font-semibold text-sm md:text-base">{step.price}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={400}>
          <div className="text-center">
            <button
              onClick={onOpenTrialModal}
              className="group relative px-8 py-5 md:px-16 md:py-8 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white text-lg md:text-2xl font-bold rounded-full overflow-hidden transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-[#FA7B21]/50 w-full sm:w-auto"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#FCA929] to-[#FA7B21] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 flex items-center justify-center gap-2 md:gap-3">
                <MessageCircle className="w-6 h-6 md:w-8 md:h-8" />
                <span className="whitespace-nowrap text-base md:text-2xl">Agendar mi clase de prueba ahora</span>
              </span>
            </button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
