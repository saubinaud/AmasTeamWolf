import { Badge } from './ui/badge';
import { Check } from 'lucide-react';
import { programImplements, TOTAL_PROGRAM_PRICE } from '../data/implements';

interface LeadershipProgramCardProps {
  onEnrollClick: () => void;
}

export function LeadershipProgramCard({ onEnrollClick }: LeadershipProgramCardProps) {
  const precioOriginal = 1964;
  const precioConDescuento = 1499;
  const ahorro = precioOriginal - precioConDescuento;

  // Todos los implementos del programa (excepto membresía)
  const implementosPrograma = programImplements.filter(impl => impl.id !== 'membership');

  return (
    <section id="programa" className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-black via-zinc-950 to-black">
      <div className="container mx-auto px-4 max-w-4xl">
        <div 
          className="bg-gradient-to-br from-[#2B1A1F] via-[#1F1418] to-black border-2 rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl shadow-[#FA7B21]/20 relative overflow-hidden"
          style={{
            borderColor: 'rgba(250, 123, 33, 0.3)'
          }}
        >
          {/* Background gradient accents */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#FA7B21]/5 via-transparent to-[#FCA929]/5 pointer-events-none" />
          
          <div className="relative z-10">
            {/* Badge */}
            <div className="flex justify-center mb-6">
              <Badge 
                className="bg-[#FA7B21] hover:bg-[#FA7B21] text-white px-6 py-2 uppercase tracking-wider shadow-lg pointer-events-none select-none"
              >
                Programa Especial
              </Badge>
            </div>

            {/* Title */}
            <div className="text-center mb-6">
              <h2 className="text-white mb-3 text-2xl sm:text-3xl md:text-4xl">
                LEADERSHIP WOLF
              </h2>
              <p className="text-white/70 text-sm sm:text-base">
                El programa más completo de formación en artes marciales y liderazgo
              </p>
            </div>

            {/* Implementos Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {/* Columna izquierda */}
              <div className="space-y-3">
                {implementosPrograma.slice(0, 3).map((implement) => (
                  <div key={implement.id} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-[#FA7B21] flex-shrink-0" />
                    <span className="text-white/90 text-sm sm:text-base">
                      {implement.icon} {implement.name}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-[#FA7B21] flex-shrink-0" />
                  <span className="text-white/90 text-sm sm:text-base">
                    🏅 Parche Leadership
                  </span>
                </div>
              </div>

              {/* Columna derecha */}
              <div className="space-y-3">
                {implementosPrograma.slice(3, 5).map((implement) => (
                  <div key={implement.id} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-[#FA7B21] flex-shrink-0" />
                    <span className="text-white/90 text-sm sm:text-base">
                      {implement.icon} {implement.name}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-[#FA7B21] flex-shrink-0" />
                  <span className="text-white/90 text-sm sm:text-base">
                    🌟 Membresía Leadership
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-[#FA7B21] flex-shrink-0" />
                  <span className="text-white/90 text-sm sm:text-base">
                    ∞ Acceso indefinido al programa
                  </span>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-br from-black/60 to-zinc-900/60 rounded-xl p-6 sm:p-8 mb-6 border border-white/5">
              <div className="flex items-baseline justify-center gap-3 mb-3">
                <span className="text-white/40 line-through text-base sm:text-lg">
                  S/ {precioOriginal}
                </span>
                <span className="text-white text-4xl sm:text-5xl md:text-6xl">
                  S/ {precioConDescuento}
                </span>
              </div>
              <p className="text-center text-[#FCA929] text-sm sm:text-base mb-4">
                Ahorra S/ {ahorro} - Precio de lanzamiento
              </p>
              
              {/* Nota sobre ajuste de precio */}
              <div className="text-center">
                <p className="text-white/50 text-xs sm:text-sm">
                  * El precio se ajusta según los implementos que ya poseas
                </p>
              </div>
            </div>

            {/* Nota verde - Válido para alumnos activos */}
            <div 
              className="rounded-lg p-4 mb-6 text-center"
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderColor: 'rgba(34, 197, 94, 0.3)',
                borderWidth: '1px'
              }}
            >
              <p className="text-sm sm:text-base" style={{ color: 'rgb(34, 197, 94)' }}>
                Válido para alumnos activos en el programa tradicional "Basic Program"
              </p>
            </div>

            {/* CTA Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEnrollClick();
              }}
              className="w-full bg-[#FA7B21] hover:bg-[#F36A15] text-white py-6 sm:py-7 text-base sm:text-lg rounded-lg text-center shadow-2xl shadow-[#FA7B21]/40 hover:shadow-[#FA7B21]/60 transition-all duration-300 active:scale-95"
              style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              Inscribirme al Programa Leadership
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
