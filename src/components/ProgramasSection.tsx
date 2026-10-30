import { memo } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Check, Star } from 'lucide-react';
import { useCatalogoPublico } from '../hooks/useCatalogoPublico';
import { programasPortada, tituloWeb, soles, type ItemCatalogo } from '../utils/catalogo';
import { enlaceWhatsApp } from '../config/contacto';

interface ProgramasSectionProps {
  /** Código del programa en el catálogo ('full', '6meses', '1mes'…) */
  onOpenMatricula: (codigo: string) => void;
}

/**
 * Programas de la portada. Todo sale del catálogo del API: cuáles salen, en qué
 * orden, precio, título, beneficios, tachado, cinta, sello y recuadro de oferta
 * (Space ▸ Catálogo ▸ En la web). Si el API no responde no se inventan precios:
 * se ofrece WhatsApp.
 */
export const ProgramasSection = memo(function ProgramasSection({ onOpenMatricula }: ProgramasSectionProps) {
  const { items, estado } = useCatalogoPublico();
  const programas = programasPortada(items);

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
          <div className="inline-flex items-center gap-2 bg-[#431C28]/30 border border-[#FA7B21]/30 rounded-full px-6 py-2 mb-6">
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

        {estado === 'cargando' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-7 lg:gap-8 md:max-w-3xl lg:max-w-7xl mx-auto">
            {[0, 1, 2].map((i) => <div key={i} className="h-[560px] rounded-xl bg-white/5 animate-pulse" />)}
          </div>
        ) : programas.length === 0 ? (
          <div className="max-w-xl mx-auto text-center bg-zinc-900/70 border border-white/10 rounded-xl p-6 sm:p-8">
            <p className="text-white/80 text-sm sm:text-base mb-5">
              Escríbenos y te contamos los programas, horarios y precios vigentes.
            </p>
            <a
              href={enlaceWhatsApp('Hola, quiero información de los programas')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full sm:w-auto bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white px-8 py-4 rounded-lg text-sm sm:text-base"
            >
              Consultar por WhatsApp
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-7 lg:gap-8 md:max-w-3xl lg:max-w-7xl mx-auto">
            {programas.map((p, i) => (
              <TarjetaPrograma
                key={p.id}
                programa={p}
                // La última tarjeta suelta en dos columnas se centra, como antes
                suelta={programas.length % 2 === 1 && i === programas.length - 1}
                onElegir={() => onOpenMatricula(p.codigo ?? '')}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
});

type Estilo = 'destacada' | 'recomendada' | 'sencilla';

const ESTILOS: Record<Estilo, { card: string; brillo: string; cinta: string; sello: string; precio: string; boton: string }> = {
  destacada: {
    card: 'bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-black border-2 border-[#FA7B21] hover:shadow-2xl hover:shadow-[#FA7B21]/30',
    brillo: 'from-[#FA7B21]/0 via-[#FA7B21]/10 to-[#FA7B21]/0',
    cinta: 'from-[#FA7B21] to-[#FCA929]',
    sello: 'bg-gradient-to-r from-[#FA7B21]/30 to-[#FCA929]/30 text-[#FCA929] border border-[#FA7B21]/50 shadow-lg',
    precio: 'from-black/50 to-zinc-900/50 border-white/5',
    boton: 'bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white shadow-2xl shadow-[#FA7B21]/40 hover:shadow-[#FA7B21]/60',
  },
  recomendada: {
    card: 'bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-900/90 border-2 border-[#FCA929]/50 hover:shadow-2xl hover:shadow-[#FCA929]/30',
    brillo: 'from-[#FCA929]/0 via-[#FCA929]/10 to-[#FCA929]/0',
    cinta: 'from-[#FCA929] to-[#FA7B21]',
    sello: 'bg-gradient-to-r from-[#FCA929]/30 to-[#FA7B21]/30 text-[#FCA929] border border-[#FCA929]/50 shadow-lg',
    precio: 'from-black/50 to-zinc-900/50 border-white/5',
    boton: 'bg-gradient-to-r from-[#FCA929] to-[#FA7B21] hover:from-[#FA7B21] hover:to-[#F36A15] text-white shadow-2xl shadow-[#FCA929]/40 hover:shadow-[#FCA929]/60',
  },
  sencilla: {
    card: 'bg-gradient-to-br from-zinc-900/70 via-zinc-900/60 to-zinc-900/70 border border-white/20 hover:border-[#FA7B21]/50 hover:shadow-xl hover:shadow-[#FA7B21]/10',
    brillo: 'from-[#FCA929]/0 via-[#FCA929]/5 to-[#FCA929]/0',
    cinta: 'from-[#FA7B21] to-[#FCA929]',
    sello: 'bg-gradient-to-r from-white/15 to-white/10 text-white/90 border border-white/30',
    precio: 'from-black/40 to-zinc-900/40 border-white/10',
    boton: 'bg-transparent border-2 border-[#FA7B21]/40 text-white hover:bg-[#FA7B21]/15 hover:border-[#FA7B21]/60',
  },
};

function TarjetaPrograma({ programa: p, suelta, onElegir }: { programa: ItemCatalogo; suelta: boolean; onElegir: () => void }) {
  const w = p.web;
  const estilo: Estilo = w?.destacado ? 'destacada' : w?.etiqueta ? 'recomendada' : 'sencilla';
  const e = ESTILOS[estilo];
  const antes = w?.precio_referencia ?? null;
  const beneficios = w?.beneficios ?? [];

  return (
    <div className={`flex ${suelta ? 'sm:col-span-2 sm:max-w-md sm:mx-auto lg:col-span-1 lg:max-w-none' : ''}`}>
      <Card className={`relative w-full overflow-hidden transition-shadow duration-500 group flex flex-col ${e.card}`}>
        <div className={`absolute inset-0 bg-gradient-to-r ${e.brillo} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

        {w?.etiqueta && (
          <div className={`absolute top-0 right-0 bg-gradient-to-r ${e.cinta} text-white px-5 py-2.5 text-xs sm:text-sm flex items-center gap-2 rounded-bl-xl shadow-lg z-10 pointer-events-none select-none`}>
            <Star className="w-4 h-4 fill-current" />
            {w.etiqueta}
          </div>
        )}

        <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-[#FA7B21]/20 to-transparent rounded-br-full pointer-events-none" />

        <CardContent className="p-5 sm:p-6 md:p-7 lg:p-8 relative flex-1 flex flex-col">
          <div className="mb-6">
            {w?.sello && (
              <Badge className={`${e.sello} mb-4 text-xs px-3 py-1 uppercase pointer-events-none select-none`}>
                {estilo !== 'sencilla' && '⭐ '}{w.sello}
              </Badge>
            )}
            <h3 className={`text-white mb-3 text-xl sm:text-2xl md:text-3xl flex items-center gap-3 ${w?.etiqueta && !w?.sello ? 'pr-28' : ''}`}>
              <span className="text-3xl sm:text-4xl">🥋</span>
              <span>{tituloWeb(p)}</span>
            </h3>
            {w?.texto && <p className="text-white/80 text-sm sm:text-base leading-relaxed">{w.texto}</p>}
          </div>

          {beneficios.length > 0 && (
            <div className={`mb-6 ${beneficios.length > 7 ? 'space-y-2 max-h-[300px] overflow-y-auto' : 'space-y-3'}`}>
              {beneficios.map((b, i) => (
                <div key={i} className={`flex items-start gap-3 ${estilo === 'sencilla' ? 'p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-300' : ''}`}>
                  <Check className="h-5 w-5 text-[#FCA929] flex-shrink-0 mt-0.5" />
                  <span className="text-white/90 text-sm sm:text-base">{b}</span>
                </div>
              ))}
            </div>
          )}

          {(w?.aviso_titulo || w?.aviso_texto) && (
            <div className="bg-gradient-to-r from-[#FA7B21]/15 to-[#FCA929]/15 border border-[#FA7B21]/40 rounded-xl p-5 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-[#FA7B21]/20 rounded-full flex items-center justify-center pointer-events-none select-none">
                  <span className="text-xl">✨</span>
                </div>
                <div>
                  {w.aviso_titulo && <p className="text-[#FCA929] text-sm sm:text-base mb-1">{w.aviso_titulo}</p>}
                  {w.aviso_texto && <p className="text-white/90 text-xs sm:text-sm">{w.aviso_texto}</p>}
                </div>
              </div>
            </div>
          )}

          <div className="mt-auto">
            <div className={`bg-gradient-to-br ${e.precio} rounded-xl p-5 sm:p-7 mb-6 border`}>
              <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 mb-2">
                {antes != null && (
                  <span className="text-white/40 line-through text-base sm:text-lg">{soles(antes)}</span>
                )}
                <span className="text-white text-3xl sm:text-4xl md:text-5xl">{soles(p.precio)}</span>
              </div>
              {antes != null && (
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#FA7B21]/30" />
                  <p className="text-center text-[#FCA929] text-sm sm:text-base px-3 py-1 bg-[#FA7B21]/10 rounded-full">
                    Ahorra {soles(antes - p.precio)}
                  </p>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#FA7B21]/30" />
                </div>
              )}
              {w?.nota_precio && <p className="text-center text-white/60 text-xs">{w.nota_precio}</p>}
            </div>

            <button
              type="button"
              onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); onElegir(); }}
              data-umami-event="Click Matricularme"
              data-umami-event-programa={tituloWeb(p)}
              data-umami-event-valor={String(p.precio)}
              className={`w-full py-6 sm:py-7 text-sm sm:text-base transition-colors duration-200 rounded-lg active:scale-[0.98] ${e.boton}`}
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              <span className="flex items-center justify-center gap-2">
                Matricularme ahora
                <span>→</span>
              </span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
