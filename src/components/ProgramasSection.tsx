import { memo } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Check, Star } from 'lucide-react';

interface ProgramasSectionProps {
  onOpenMatricula: (programa: 'full' | '1mes') => void;
}

export const ProgramasSection = memo(function ProgramasSection({ onOpenMatricula }: ProgramasSectionProps) {
  // Variables editables
  const precioFull = 869;
  const precioAnteriorFull = 1199;
  const precio1Mes = 330;
  const fechaValidez = '30/10/25';

  const beneficiosFull = [
    'Uniforme completo',
    'Graduación y nuevo cinturón',
    'Certificado oficial',
    'Ceremonia',
    'Asistencia rotativa (Lunes a Sábado)',
    'Congelamiento',
    'Cartilla de deberes y seguimiento'
  ];

  const beneficios1Mes = [
    '1 mes de clases',
    'Seguimiento personalizado con cartilla de deberes'
  ];

  return (
    <section id="programas" className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-b from-black via-zinc-950 to-black relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(252, 169, 41, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(252, 169, 41, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Glowing orbs */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-[#FA7B21]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#FCA929]/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-[#431C28]/30 border border-[#FA7B21]/30 rounded-full px-6 py-2 mb-6 backdrop-blur-sm">
            <div className="w-2 h-2 bg-[#FCA929] rounded-full" />
            <span className="text-[#FCA929] text-xs sm:text-sm uppercase tracking-wider">Programas Disponibles</span>
          </div>
          <h2 
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-3 sm:mb-4 px-4"
            style={{
              background: 'linear-gradient(135deg, #FA7B21 0%, #FCA929 50%, #FA7B21 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Nuestros Programas
          </h2>
          <p className="text-white/70 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4">
            Elige el programa que mejor se adapte a las necesidades de tu hijo
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {/* Programa Full - Destacado */}
          <div className="md:col-span-2 lg:col-span-1">
            <Card className="relative bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-black border-2 border-[#FA7B21] overflow-hidden hover:shadow-2xl hover:shadow-[#FA7B21]/30 transition-shadow duration-500 group">
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#FA7B21]/0 via-[#FA7B21]/10 to-[#FA7B21]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              {/* Badge "Más popular" */}
              <div className="absolute top-0 right-0 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white px-5 py-2.5 text-xs sm:text-sm flex items-center gap-2 rounded-bl-xl shadow-lg z-10 pointer-events-none select-none">
                <Star className="w-4 h-4 fill-current" />
                Más vendido
              </div>

              {/* Corner accent */}
              <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-[#FA7B21]/20 to-transparent rounded-br-full pointer-events-none" />

              <CardContent className="p-6 sm:p-8 md:p-10 relative">
                <div className="mb-6">
                  <Badge className="bg-gradient-to-r from-[#FA7B21]/30 to-[#FCA929]/30 text-[#FCA929] border border-[#FA7B21]/50 mb-4 text-xs px-3 py-1 shadow-lg pointer-events-none select-none">
                    ⭐ PROGRAMA DESTACADO
                  </Badge>
                  <h3 className="text-white mb-3 text-xl sm:text-2xl md:text-3xl flex items-center gap-3">
                    <span className="text-3xl sm:text-4xl">🥋</span>
                    <span>Programa Full - 3 Meses</span>
                  </h3>
                  <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                    La mejor opción para el desarrollo integral de tu hijo
                  </p>
                </div>

                {/* Beneficios */}
                <div className="space-y-3 mb-6">
                  {beneficiosFull.map((beneficio, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3"
                    >
                      <Check className="h-5 w-5 text-[#FCA929] flex-shrink-0 mt-0.5" />
                      <span className="text-white/90 text-sm sm:text-base">{beneficio}</span>
                    </div>
                  ))}
                </div>

                {/* Oferta especial */}
                <div className="bg-gradient-to-r from-[#FA7B21]/15 to-[#FCA929]/15 border border-[#FA7B21]/40 rounded-xl p-5 mb-6 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-[#FA7B21]/20 rounded-full flex items-center justify-center pointer-events-none select-none">
                      <span className="text-xl">✨</span>
                    </div>
                    <div>
                      <p className="text-[#FCA929] text-sm sm:text-base mb-1">
                        Cupos exclusivos
                      </p>
                      <p className="text-white/90 text-xs sm:text-sm">
                        Medio mes gratis añadido al programa Full
                      </p>
                    </div>
                  </div>
                </div>

                {/* Precio */}
                <div className="bg-gradient-to-br from-black/50 to-zinc-900/50 rounded-xl p-5 sm:p-7 mb-6 border border-white/5 backdrop-blur-sm">
                  <div className="flex items-baseline justify-center gap-3 mb-3">
                    <span className="text-white/40 line-through text-base sm:text-lg">
                      S/ <span id="precioAnteriorFull">{precioAnteriorFull}</span>
                    </span>
                    <span className="text-white text-3xl sm:text-4xl md:text-5xl bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
                      S/ <span id="precioFull">{precioFull}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#FA7B21]/30" />
                    <p className="text-center text-[#FCA929] text-sm sm:text-base px-3 py-1 bg-[#FA7B21]/10 rounded-full">
                      Ahorra S/ {precioAnteriorFull - precioFull}
                    </p>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#FA7B21]/30" />
                  </div>
                  <p className="text-center text-white/60 text-xs flex items-center justify-center gap-2">
                    <span className="text-base">📅</span>
                    Validez hasta agotar stock de uniformes
                  </p>
                </div>

                {/* Botón */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenMatricula('full');
                  }}
                  className="w-full bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white py-6 sm:py-7 text-sm sm:text-base shadow-2xl shadow-[#FA7B21]/40 hover:shadow-[#FA7B21]/60 transition-colors duration-200 rounded-lg active:scale-[0.98]"
                  style={{
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    Matricularme ahora
                    <span>→</span>
                  </span>
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Programa 1 Mes */}
          <div className="md:col-span-2 lg:col-span-1">
            <Card className="bg-gradient-to-br from-zinc-900/70 via-zinc-900/60 to-zinc-900/70 border border-white/20 hover:border-[#FA7B21]/50 transition-all duration-500 h-full backdrop-blur-sm group hover:shadow-xl hover:shadow-[#FA7B21]/10">
              {/* Subtle glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#FCA929]/0 via-[#FCA929]/5 to-[#FCA929]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg pointer-events-none" />
              
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#FCA929]/10 to-transparent rounded-tr-lg pointer-events-none" />
              
              <CardContent className="p-6 sm:p-8 md:p-10 relative">
                <div className="mb-6">
                  <Badge className="bg-gradient-to-r from-white/15 to-white/10 text-white/90 border border-white/30 mb-4 text-xs px-3 py-1 pointer-events-none select-none">
                    PROGRAMA TRADICIONAL
                  </Badge>
                  <h3 className="text-white mb-3 text-xl sm:text-2xl md:text-3xl flex items-center gap-3">
                    <span className="text-3xl sm:text-4xl">🥋</span>
                    <span>Programa 1 Mes</span>
                  </h3>
                  <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                    Ideal para comenzar con enfoque
                  </p>
                </div>

                {/* Beneficios */}
                <div className="space-y-3 mb-8">
                  {beneficios1Mes.map((beneficio, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-300"
                    >
                      <Check className="h-5 w-5 text-[#FCA929] flex-shrink-0 mt-0.5" />
                      <span className="text-white/90 text-sm sm:text-base">{beneficio}</span>
                    </div>
                  ))}
                </div>

                {/* Precio */}
                <div className="bg-gradient-to-br from-black/40 to-zinc-900/40 rounded-xl p-5 sm:p-7 mb-6 border border-white/10 backdrop-blur-sm">
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-white text-3xl sm:text-4xl md:text-5xl bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
                      S/ {precio1Mes}
                    </span>
                  </div>
                  <p className="text-center text-white/60 text-xs">
                    Pago mensual flexible
                  </p>
                </div>

                {/* Botón */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenMatricula('1mes');
                  }}
                  className="w-full bg-transparent border-2 border-[#FA7B21]/40 text-white hover:bg-[#FA7B21]/15 hover:border-[#FA7B21]/60 py-6 sm:py-7 text-sm sm:text-base transition-colors duration-200 backdrop-blur-sm rounded-lg active:scale-[0.98]"
                  style={{
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    Matricularme ahora
                    <span>→</span>
                  </span>
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
});