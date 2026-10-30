import { Badge } from './ui/badge';
import { Check } from 'lucide-react';
import { useCatalogoPublico } from '../hooks/useCatalogoPublico';
import { programaPorCodigo, soles, tituloWeb, type ItemCatalogo } from '../utils/catalogo';

interface LeadershipProgramCardProps {
  onEnrollClick: () => void;
}

/**
 * Tarjeta de Leadership Wolf: precio, implementos que trae (los del catálogo),
 * beneficios, tachado, sello y aviso salen del API (Space ▸ Catálogo ▸ En la web).
 */
export function LeadershipProgramCard({ onEnrollClick }: LeadershipProgramCardProps) {
  const { items, estado } = useCatalogoPublico();
  const programa = programaPorCodigo(items, 'leadership');
  const w = programa?.web;
  const implementos = (programa?.incluye ?? [])
    .map((id) => items.find((i) => i.id === id))
    .filter((i): i is ItemCatalogo => !!i);
  // Implementos del catálogo + lo que se escribe en Space, repartidos en dos columnas
  const lineas = [...implementos.map((i) => tituloWeb(i)), ...(w?.beneficios ?? [])];
  const mitad = Math.ceil(lineas.length / 2);
  const antes = w?.precio_referencia ?? null;

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
            {w?.sello && (
              <div className="flex justify-center mb-6">
                <Badge
                  className="bg-[#FA7B21] hover:bg-[#FA7B21] text-white px-6 py-2 uppercase tracking-wider shadow-lg pointer-events-none select-none"
                >
                  {w.sello}
                </Badge>
              </div>
            )}

            {/* Title */}
            <div className="text-center mb-6">
              <h2 className="text-white mb-3 text-2xl sm:text-3xl md:text-4xl uppercase">
                {programa ? tituloWeb(programa) : 'Leadership Wolf'}
              </h2>
              {w?.texto && <p className="text-white/70 text-sm sm:text-base">{w.texto}</p>}
            </div>

            {/* Lo que incluye */}
            {lineas.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mb-8">
                {[lineas.slice(0, mitad), lineas.slice(mitad)].map((col, c) => (
                  <div key={c} className="space-y-3">
                    {col.map((t) => (
                      <div key={t} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-[#FA7B21] flex-shrink-0" />
                        <span className="text-white/90 text-sm sm:text-base">{t}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Price */}
            <div className="bg-gradient-to-br from-black/60 to-zinc-900/60 rounded-xl p-6 sm:p-8 mb-6 border border-white/5">
              {programa ? (
                <>
                  <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 mb-3">
                    {antes != null && (
                      <span className="text-white/40 line-through text-base sm:text-lg">{soles(antes)}</span>
                    )}
                    <span className="text-white text-4xl sm:text-5xl md:text-6xl">{soles(programa.precio)}</span>
                  </div>
                  {(antes != null || w?.nota_precio) && (
                    <p className="text-center text-[#FCA929] text-sm sm:text-base mb-4">
                      {[antes != null ? `Ahorra ${soles(antes - programa.precio)}` : null, w?.nota_precio].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <div className="text-center">
                    <p className="text-white/50 text-xs sm:text-sm">
                      * El precio se ajusta según los implementos que ya poseas
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-center text-white/70 text-base">
                  {estado === 'cargando' ? 'Cargando precio…' : 'Precio: consultar por WhatsApp'}
                </p>
              )}
            </div>

            {/* Aviso (Space ▸ Catálogo ▸ En la web) */}
            {w?.aviso_texto && (
              <div
                className="rounded-lg p-4 mb-6 text-center"
                style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  borderColor: 'rgba(34, 197, 94, 0.3)',
                  borderWidth: '1px'
                }}
              >
                {w.aviso_titulo && <p className="text-sm sm:text-base font-semibold mb-1" style={{ color: 'rgb(34, 197, 94)' }}>{w.aviso_titulo}</p>}
                <p className="text-sm sm:text-base" style={{ color: 'rgb(34, 197, 94)' }}>
                  {w.aviso_texto}
                </p>
              </div>
            )}

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
