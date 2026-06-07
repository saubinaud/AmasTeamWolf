import { MessageCircle } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

interface CTAFinalSectionProps {
  onOpenTrialModal: () => void;
}

export function CTAFinalSection({ onOpenTrialModal }: CTAFinalSectionProps) {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url('https://res.cloudinary.com/dkoocok3j/image/upload/q_80.w_1920/v1763124726/Academia_Medalla_Photo_copy_desesj.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#FA7B21]/80 via-[#FCA929]/70 to-[#FA7B21]/80" />

      {/* Animated circles */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <ScrollReveal>
          <h1 className="text-5xl md:text-7xl text-white mb-8 leading-tight font-bold">
            ¿Listo para <span className="underline decoration-wavy decoration-white/50">transformar</span> a tu hijo?
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <p className="text-2xl md:text-3xl text-white/95 mb-12 font-semibold">
            Únete a las +300 familias que ya confían en AMAS
          </p>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="flex flex-wrap gap-4 justify-center mb-16">
            {[
              { icon: '🔥', text: 'Últimos 15 cupos del mes' },
              { icon: '⏰', text: 'Medio mes GRATIS en Programa Full' },
              { icon: '📋', text: 'Válido hasta agotar stock de uniformes' }
            ].map((badge, i) => (
              <div key={i} className="bg-white/20 border-2 border-white/40 px-6 py-3 rounded-full text-white font-bold shadow-2xl hover:bg-white/30 transition-all duration-300 hover:scale-105">
                <span className="mr-2">{badge.icon}</span>
                {badge.text}
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <button
            onClick={onOpenTrialModal}
            className="group relative px-20 py-10 bg-white text-black text-3xl font-bold rounded-full overflow-hidden transition-all duration-300 hover:scale-110 shadow-2xl hover:shadow-white/50 mb-8"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-black to-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10 group-hover:text-white transition-colors duration-300 flex items-center justify-center gap-4">
              <MessageCircle className="w-10 h-10" />
              Agendar clase de prueba AHORA
            </span>
          </button>
        </ScrollReveal>

        <ScrollReveal delay={400}>
          <div className="bg-black/30 border border-white/30 inline-block px-8 py-4 rounded-full">
            <p className="text-white/90 text-lg">
              <span className="font-bold">📞 Respondemos en menos de 1 hora</span>
              <br />
              <span className="text-sm">Lun-Vie 9am-8pm | Sáb 9am-1pm</span>
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
