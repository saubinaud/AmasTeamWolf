import { Check, Shield, Zap, TrendingUp } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

interface MetodologiaSectionProps {
  onOpenTrialModal: () => void;
}

export function MetodologiaSection({ onOpenTrialModal }: MetodologiaSectionProps) {
  return (
    <section className="relative py-16 md:py-32 px-4 bg-gradient-to-b from-black via-[#0D0D0D] to-black overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(#FA7B21 1px, transparent 1px), linear-gradient(90deg, #FA7B21 1px, transparent 1px)',
        backgroundSize: '100px 100px'
      }} />

      <div className="max-w-7xl mx-auto relative z-10">
        <ScrollReveal>
          <div className="text-center mb-12 md:mb-20">
            <span className="inline-block bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white px-4 py-2 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-bold mb-4 md:mb-6">
              Nuestra metodología única
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-6xl text-white mb-4 md:mb-6 font-bold px-2">
              Así <span className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] bg-clip-text text-transparent">transformamos</span> a tu hijo
            </h2>
            <p className="text-base md:text-xl text-white/60 max-w-3xl mx-auto px-2">
              Un sistema probado durante 20 años que combina artes marciales con formación de carácter
            </p>
          </div>
        </ScrollReveal>

        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 mb-12 md:mb-20">
          {/* Paso 1 - DISCIPLINA */}
          <ScrollReveal delay={100}>
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#FA7B21]/30 to-[#FCA929]/30 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl md:rounded-3xl p-6 md:p-10 hover:border-[#FA7B21]/50 transition-all duration-500">
                <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#FA7B21] to-[#FCA929] flex items-center justify-center text-white text-2xl md:text-3xl font-bold shadow-2xl">
                      1
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl md:text-3xl text-white font-bold mb-3 md:mb-4 flex items-center gap-2 md:gap-3">
                      <Shield className="w-6 h-6 md:w-8 md:h-8 text-[#FA7B21]" />
                      DISCIPLINA
                    </h3>
                    <p className="text-white/80 text-base md:text-lg leading-relaxed mb-4">
                      Aprende a seguir instrucciones desde el primer día. Sin gritos, con respeto.
                    </p>
                    <ul className="space-y-2 md:space-y-3">
                      <li className="flex items-start gap-2 md:gap-3 text-white/70 text-sm md:text-base">
                        <Check className="w-4 h-4 md:w-5 md:h-5 text-[#FA7B21] flex-shrink-0 mt-1" />
                        <span>Rutinas estructuradas adaptadas a cada edad</span>
                      </li>
                      <li className="flex items-start gap-2 md:gap-3 text-white/70 text-sm md:text-base">
                        <Check className="w-4 h-4 md:w-5 md:h-5 text-[#FA7B21] flex-shrink-0 mt-1" />
                        <span>Refuerzo positivo constante</span>
                      </li>
                      <li className="flex items-start gap-2 md:gap-3 text-white/70 text-sm md:text-base">
                        <Check className="w-4 h-4 md:w-5 md:h-5 text-[#FA7B21] flex-shrink-0 mt-1" />
                        <span>Límites claros con amor y paciencia</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Paso 2 - CONFIANZA */}
          <ScrollReveal delay={200}>
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#FA7B21]/30 to-[#FCA929]/30 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl md:rounded-3xl p-6 md:p-10 hover:border-[#FA7B21]/50 transition-all duration-500">
                <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#FA7B21] to-[#FCA929] flex items-center justify-center text-white text-2xl md:text-3xl font-bold shadow-2xl">
                      2
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl md:text-3xl text-white font-bold mb-3 md:mb-4 flex items-center gap-2 md:gap-3">
                      <Zap className="w-6 h-6 md:w-8 md:h-8 text-[#FA7B21]" />
                      CONFIANZA
                    </h3>
                    <p className="text-white/80 text-base md:text-lg leading-relaxed mb-4">
                      Descubre que SÍ puede hacer cosas difíciles. Gana seguridad en sí mismo.
                    </p>
                    <ul className="space-y-2 md:space-y-3">
                      <li className="flex items-start gap-2 md:gap-3 text-white/70 text-sm md:text-base">
                        <Check className="w-4 h-4 md:w-5 md:h-5 text-[#FA7B21] flex-shrink-0 mt-1" />
                        <span>Retos progresivos según su nivel</span>
                      </li>
                      <li className="flex items-start gap-2 md:gap-3 text-white/70 text-sm md:text-base">
                        <Check className="w-4 h-4 md:w-5 md:h-5 text-[#FA7B21] flex-shrink-0 mt-1" />
                        <span>Celebración de cada logro</span>
                      </li>
                      <li className="flex items-start gap-2 md:gap-3 text-white/70 text-sm md:text-base">
                        <Check className="w-4 h-4 md:w-5 md:h-5 text-[#FA7B21] flex-shrink-0 mt-1" />
                        <span>Ambiente seguro para equivocarse y aprender</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Paso 3 - LIDERAZGO */}
          <ScrollReveal delay={300}>
            <div className="relative group lg:col-span-2">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#FA7B21]/30 to-[#FCA929]/30 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl md:rounded-3xl p-6 md:p-10 hover:border-[#FA7B21]/50 transition-all duration-500">
                <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#FA7B21] to-[#FCA929] flex items-center justify-center text-white text-2xl md:text-3xl font-bold shadow-2xl">
                      3
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl md:text-3xl text-white font-bold mb-3 md:mb-4 flex items-center gap-2 md:gap-3">
                      <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-[#FA7B21]" />
                      LIDERAZGO
                    </h3>
                    <p className="text-white/80 text-base md:text-lg leading-relaxed mb-4 md:mb-6">
                      Se convierte en ejemplo para otros. En casa, en el cole, en la vida.
                    </p>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                      <div className="flex items-start gap-2 md:gap-3">
                        <Check className="w-4 h-4 md:w-5 md:h-5 text-[#FA7B21] flex-shrink-0 mt-1" />
                        <span className="text-white/70 text-sm md:text-base">Responsabilidad y autonomía</span>
                      </div>
                      <div className="flex items-start gap-2 md:gap-3">
                        <Check className="w-4 h-4 md:w-5 md:h-5 text-[#FA7B21] flex-shrink-0 mt-1" />
                        <span className="text-white/70 text-sm md:text-base">Trabajo en equipo y empatía</span>
                      </div>
                      <div className="flex items-start gap-2 md:gap-3">
                        <Check className="w-4 h-4 md:w-5 md:h-5 text-[#FA7B21] flex-shrink-0 mt-1" />
                        <span className="text-white/70 text-sm md:text-base">Mentoría entre compañeros</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Destacado */}
        <ScrollReveal delay={400}>
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] rounded-2xl md:rounded-3xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-gradient-to-r from-[#FA7B21] to-[#FCA929] p-6 md:p-12 rounded-2xl md:rounded-3xl text-center">
              <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white font-bold leading-relaxed px-2">
                No es solo taekwondo. Es <span className="underline decoration-wavy decoration-white/50">formación de carácter</span> para toda la vida.
              </p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={500}>
          <div className="text-center mt-8 md:mt-12">
            <button
              onClick={onOpenTrialModal}
              className="group relative px-8 py-4 md:px-12 md:py-6 bg-white text-black text-base md:text-xl font-bold rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-white/20 w-full sm:w-auto"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 group-hover:text-white transition-colors duration-300">
                Quiero esto para mi hijo
              </span>
            </button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
