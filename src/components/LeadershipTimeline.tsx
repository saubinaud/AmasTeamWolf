import { motion } from 'motion/react';
import { timelineMilestones } from '../data/timeline';
import { Check } from 'lucide-react';

// Iconos para cada etapa
const stageIcons = [
  '🐺', // 1 - Fundamentos del Lobo
  '🎯', // 2 - Precisión con Propósito
  '👥', // 3 - Trabajo en Equipo
  '⭐', // 4 - Liderazgo en Acción
  '✨', // 5 - Estilo Personal
  '📦', // 6 - Mentalidad Profesional
  '🏅', // 7 - Demostración de Maestría
  '⚔️', // 8 - Combate Avanzado
  '🎓', // 9 - Liderazgo del Lobo
  '🛡️', // 10 - Armas Múltiples
  '📜', // 11 - Filosofía del Guerrero
  '🏆', // 12 - Ascenso del Lobo
];

export function LeadershipTimeline() {
  return (
    <section id="timeline" className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-b from-black via-zinc-950 to-black relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(250,123,33,0.15),transparent_50%)]" />
      </div>

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8 sm:mb-12 md:mb-16"
        >
        <h2 className="text-white mb-3 sm:mb-4">🏆 EL CAMINO LEADERSHIP en 12 Hitos</h2>
        <p className="text-white/70 text-base sm:text-lg md:text-xl max-w-3xl mx-auto">
          Un viaje estructurado donde cada hito prepara el siguiente
        </p>
        </motion.div>

        {/* Timeline vertical */}
        <div className="max-w-5xl mx-auto relative">
          {/* Línea vertical - Desktop centro, Mobile centro también */}
          <div className="absolute left-[22px] md:left-1/2 top-0 bottom-0 w-0.5 md:w-1 bg-gradient-to-b from-[#FA7B21] via-[#FCA929] to-[#FA7B21] md:transform md:-translate-x-1/2" />

          {/* Etapas */}
          <div className="space-y-4 md:space-y-14 max-w-md md:max-w-none mx-auto">
            {timelineMilestones.map((milestone, index) => {
              const isEven = index % 2 === 0;
              
              return (
                <motion.div
                  key={milestone.month}
                  initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className={`relative flex items-center ${
                    isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                  } flex-col md:gap-8`}
                >
                  {/* Card - Padding reducido pero texto legible */}
                  <div className={`w-full md:w-[calc(50%-2rem)] ${isEven ? 'md:text-right' : 'md:text-left'} text-left pl-12 md:pl-0`}>
                    <div className="bg-zinc-900/60 backdrop-blur border border-[#FA7B21]/30 rounded-lg md:rounded-2xl px-3 py-3 md:p-8 hover:border-[#FA7B21]/50 transition-all duration-300 group relative overflow-hidden">
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#FA7B21]/5 to-[#FCA929]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className={`relative flex ${isEven ? 'md:flex-row-reverse' : 'md:flex-row'} flex-row md:flex-row items-start gap-3 md:gap-4`}>
                        {/* Icon */}
                        <div className="text-3xl md:text-5xl flex-shrink-0">
                          {stageIcons[index]}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          {/* Badge */}
                          <div className="inline-block px-2 py-0.5 md:px-3 md:py-1 bg-[#FA7B21] rounded-full text-white text-[10px] md:text-xs mb-2 md:mb-3">
                            HITO {milestone.month}
                          </div>
                          
                          {/* Title */}
                          <h3 className="text-white text-sm md:text-2xl lg:text-3xl mb-1 md:mb-2 leading-snug md:leading-normal">
                            {milestone.title}
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
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CTA final */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mt-8 sm:mt-12 md:mt-16 text-center"
        >
          <div className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] rounded-full text-white">
            <span className="text-sm sm:text-base md:text-lg lg:text-xl">🏆 12 hitos de transformación completa</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default LeadershipTimeline;
