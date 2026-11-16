import { timelineMilestones } from '../data/timeline';
import { Check, Shield, Crosshair, Users, Star, Sparkles, Briefcase, Medal, Swords, GraduationCap, Layers, ScrollText, Trophy } from 'lucide-react';
import { ui } from '../styles/marca';
import { FadeIn } from './FadeIn';

// Ícono de cada hito
const stageIcons = [Shield, Crosshair, Users, Star, Sparkles, Briefcase, Medal, Swords, GraduationCap, Layers, ScrollText, Trophy];

/** "FUNDAMENTOS DEL LOBO" → "Fundamentos del lobo" */
const frase = (t: string) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();

export function LeadershipTimeline() {
  return (
    <section id="timeline" className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-b from-black via-zinc-950 to-black relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(250,123,33,0.15),transparent_50%)]" />
      </div>

      <div className="container mx-auto px-4">
        <FadeIn className="text-center mb-8 sm:mb-12 md:mb-16">
        <p className={ui.antetitulo}>El recorrido</p>
        <h2 className={`mt-4 ${ui.h2}`}>El camino Leadership en 12 hitos</h2>
        <p className={`mt-4 max-w-3xl mx-auto ${ui.bajada}`}>
          Un viaje estructurado donde cada hito prepara el siguiente
        </p>
        </FadeIn>

        {/* Timeline vertical */}
        <div className="max-w-5xl mx-auto relative">
          {/* Línea vertical - Desktop centro, Mobile centro también */}
          <div className="absolute left-[22px] md:left-1/2 top-0 bottom-0 w-0.5 md:w-1 bg-gradient-to-b from-[#FA7B21] via-[#FCA929] to-[#FA7B21] md:transform md:-translate-x-1/2" />

          {/* Etapas */}
          <div className="space-y-4 md:space-y-14 max-w-md md:max-w-none mx-auto">
            {timelineMilestones.map((milestone, index) => {
              const isEven = index % 2 === 0;

              return (
                <FadeIn
                  key={milestone.month}
                  delay={index * 50}
                  direction={isEven ? 'up' : 'up'}
                  className={`relative flex items-center ${
                    isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                  } flex-col md:gap-8`}
                >
                  {/* Card - Padding reducido pero texto legible */}
                  <div className={`w-full md:w-[calc(50%-2rem)] ${isEven ? 'md:text-right' : 'md:text-left'} text-left pl-12 md:pl-0`}>
                    <div className="bg-zinc-900/60 border border-[#FA7B21]/30 rounded-lg md:rounded-2xl px-3 py-3 md:p-8 hover:border-[#FA7B21]/50 transition-colors duration-300 group relative overflow-hidden">
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#FA7B21]/5 to-[#FCA929]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className={`relative flex ${isEven ? 'md:flex-row-reverse' : 'md:flex-row'} flex-row md:flex-row items-start gap-3 md:gap-4`}>
                        {/* Icon */}
                        <div className="flex h-10 w-10 md:h-14 md:w-14 flex-shrink-0 items-center justify-center rounded-xl bg-[#FA7B21]/15">
                          {(() => { const Icono = stageIcons[index] ?? Star; return <Icono className="h-5 w-5 md:h-7 md:w-7 text-[#FCA929]" strokeWidth={1.75} />; })()}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Badge */}
                          <div className="inline-block px-2 py-0.5 md:px-3 md:py-1 bg-[#FA7B21] rounded-full text-white text-[10px] md:text-xs mb-2 md:mb-3">
                            Hito {milestone.month}
                          </div>

                          {/* Title */}
                          <h3 className="text-white text-sm md:text-2xl lg:text-3xl mb-1 md:mb-2 leading-snug md:leading-normal">
                            {frase(milestone.title)}
                          </h3>

                          {/* Description */}
                          <p className="text-[#FCA929] italic text-xs md:text-base mb-2 md:mb-4 leading-snug">
                            "{milestone.description}"
                          </p>

                          {/* Achievements - Todos visibles */}
                          <div className="space-y-1 md:space-y-2">
                            {milestone.achievements.map((achievement, i) => (
                              <div key={i} className="flex items-start gap-1.5 md:gap-2">
                                <div className="w-3.5 h-3.5 md:w-5 md:h-5 rounded-full bg-[#FA7B21]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Check className="w-2 h-2 md:w-3 md:h-3 text-[#FCA929]" />
                                </div>
                                <span className="text-white/80 text-xs md:text-base leading-snug md:leading-normal">
                                  {achievement}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Círculo central con checkmark - Desktop */}
                  <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-[#FA7B21] to-[#E65C0F] items-center justify-center border-4 border-black shadow-lg z-10">
                    <Check className="w-7 h-7 lg:w-8 lg:h-8 text-white" strokeWidth={3} />
                  </div>

                  {/* Círculo móvil - Centrado en la línea */}
                  <div className="md:hidden absolute left-[22px] top-4 transform -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-[#FA7B21] to-[#E65C0F] flex items-center justify-center border-2 border-black shadow-md z-10">
                    <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>

                  {/* Spacer para el lado vacío en desktop */}
                  <div className="hidden md:block w-[calc(50%-2rem)]" />
                </FadeIn>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}

export default LeadershipTimeline;
