import { Clock, Users, Heart, Award } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

export function TrustSignalsSection() {
  return (
    <section className="relative py-16 md:py-32 px-4 bg-black">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {[
            { icon: <Clock className="w-8 h-8 md:w-12 md:h-12" />, num: '20', label: 'años formando alumnos' },
            { icon: <Users className="w-8 h-8 md:w-12 md:h-12" />, num: '+300', label: 'familias satisfechas' },
            { icon: <Heart className="w-8 h-8 md:w-12 md:h-12" />, num: '12', label: 'alumnos máx/grupo' },
            { icon: <Award className="w-8 h-8 md:w-12 md:h-12" />, num: '✓', label: 'Certificación internacional' }
          ].map((stat, i) => (
            <ScrollReveal key={i} delay={i * 100}>
              <div className="text-center group">
                <div className="relative inline-block mb-3 md:mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
                  <div className="relative text-[#FA7B21] group-hover:scale-110 transition-transform duration-300">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-[#FA7B21] to-[#FCA929] bg-clip-text text-transparent mb-2">
                  {stat.num}
                </div>
                <p className="text-white/70 text-xs sm:text-sm md:text-base leading-tight px-1">{stat.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
