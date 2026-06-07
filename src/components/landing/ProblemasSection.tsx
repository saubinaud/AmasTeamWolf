import { ScrollReveal } from './ScrollReveal';

export function ProblemasSection() {
  return (
    <section id="problemas" className="relative py-16 md:py-32 px-4 bg-gradient-to-b from-black via-[#0A0A0A] to-black overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FA7B21]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FCA929]/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto relative z-10">
        <ScrollReveal>
          <div className="text-center mb-12 md:mb-20">
            <span className="inline-block bg-white/5 border border-white/10 text-white/70 px-4 py-2 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-semibold mb-4 md:mb-6">
              Situaciones reales de padres
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-6xl text-white mb-4 md:mb-6 font-bold px-2">
              ¿Te suena <span className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] bg-clip-text text-transparent">familiar</span>?
            </h2>
            <p className="text-base md:text-xl text-white/60 max-w-2xl mx-auto px-2">
              Estos son los problemas que resolvemos todos los días
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {[
            {
              emoji: '😔',
              title: 'Niño tímido',
              desc: 'Se esconde detrás de ti, no habla en el cole, tiene miedo a todo',
              gradient: 'from-blue-500/20 to-purple-500/20'
            },
            {
              emoji: '😤',
              title: 'No obedece',
              desc: 'Tienes que repetirle las cosas 10 veces, hace berrinches, no sigue reglas',
              gradient: 'from-red-500/20 to-orange-500/20'
            },
            {
              emoji: '😰',
              title: 'Baja confianza',
              desc: 'No cree en sí mismo, dice "no puedo", se rinde fácil',
              gradient: 'from-yellow-500/20 to-red-500/20'
            }
          ].map((item, i) => (
            <ScrollReveal key={i} delay={i * 100}>
              <div className="group relative h-full">
                {/* Glow effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative h-full bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8 hover:border-[#FA7B21]/50 transition-all duration-500 hover:transform hover:scale-105">
                  <div className="text-5xl md:text-7xl mb-4 md:mb-6">{item.emoji}</div>
                  <h3 className="text-xl md:text-2xl text-white font-bold mb-3 md:mb-4">{item.title}</h3>
                  <p className="text-white/70 leading-relaxed text-base md:text-lg">
                    {item.desc}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={300}>
          <div className="text-center mt-12 md:mt-16">
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed px-2">
              Si tu hijo tiene <strong className="text-[#FA7B21]">alguno</strong> de estos comportamientos,{' '}
              <strong className="text-[#FA7B21]">AMAS puede ayudarte</strong>.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
