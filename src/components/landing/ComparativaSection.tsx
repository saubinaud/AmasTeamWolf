import { Check, X } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

const rows = [
  { label: 'Tamaño de grupos', others: '20-30 niños', amas: 'Máximo 12 alumnos' },
  { label: 'Enfoque', others: 'Solo técnica', amas: 'Técnica + Valores + Liderazgo' },
  { label: 'Instructoras', others: 'Variables', amas: 'Certificadas internacionalmente' },
  { label: 'Seguimiento', others: 'No personalizado', amas: 'Cartilla individual de progreso' },
  { label: 'Graduación', others: 'Costo adicional', amas: 'Incluida en el programa' },
  { label: 'Experiencia', others: '2-5 años', amas: '20 años transformando vidas' }
];

export function ComparativaSection() {
  return (
    <section className="relative py-16 md:py-32 px-4 bg-gradient-to-b from-black via-[#0A0A0A] to-black overflow-hidden">
      <div className="max-w-5xl mx-auto relative z-10">
        <ScrollReveal>
          <div className="text-center mb-12 md:mb-20">
            <span className="inline-block bg-white/5 border border-white/10 text-white/70 px-4 py-2 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-semibold mb-4 md:mb-6">
              La diferencia AMAS
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-6xl text-white mb-4 md:mb-6 font-bold px-2">
              ¿Por qué elegir <span className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] bg-clip-text text-transparent">AMAS</span>?
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl md:rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929]">
                    <th className="px-3 py-3 md:px-6 md:py-6 text-left text-white text-sm md:text-lg"></th>
                    <th className="px-3 py-3 md:px-6 md:py-6 text-center text-white/80 text-sm md:text-lg whitespace-nowrap">Otras academias</th>
                    <th className="px-3 py-3 md:px-6 md:py-6 text-center text-white text-sm md:text-lg font-bold whitespace-nowrap">AMAS Team Wolf</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b border-white/10 hover:bg-white/5 transition-colors duration-300">
                      <td className="px-3 py-4 md:px-6 md:py-5 font-semibold text-white text-sm md:text-lg whitespace-nowrap">{row.label}</td>
                      <td className="px-3 py-4 md:px-6 md:py-5 text-center text-white/60">
                        <div className="flex items-center justify-center gap-1 md:gap-2">
                          <X className="w-4 h-4 md:w-5 md:h-5 text-red-400 flex-shrink-0" />
                          <span className="text-xs md:text-base">{row.others}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 md:px-6 md:py-5 text-center text-white">
                        <div className="flex items-center justify-center gap-1 md:gap-2 font-semibold">
                          <Check className="w-4 h-4 md:w-5 md:h-5 text-[#25D366] flex-shrink-0" />
                          <span className="text-xs md:text-base">{row.amas}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-center text-white/40 text-xs py-3 md:hidden">← Desliza para ver más →</p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
