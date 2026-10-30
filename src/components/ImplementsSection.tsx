import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { FadeIn } from './FadeIn';
import { useCatalogoPublico } from '../hooks/useCatalogoPublico';
import { programaPorCodigo, soles, tituloWeb, type ItemCatalogo } from '../utils/catalogo';

/** Implementos que trae Leadership: los del catálogo, con su precio y su foto de la tienda. */
export function ImplementsSection() {
  const { items } = useCatalogoPublico();
  const programa = programaPorCodigo(items, 'leadership');
  const implementos = (programa?.incluye ?? [])
    .map((id) => items.find((i) => i.id === id))
    .filter((i): i is ItemCatalogo => !!i);

  if (implementos.length === 0) return null;

  return (
    <section id="implementos" className="py-12 sm:py-16 md:py-20 bg-black">
      <div className="container mx-auto px-4">
        <FadeIn className="text-center mb-8 sm:mb-12">
          <h2 className="text-white mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl">Implementos del Programa {programa ? tituloWeb(programa) : 'Leadership Wolf'}</h2>
          <p className="text-white/70 text-base sm:text-lg md:text-xl max-w-3xl mx-auto px-4">
            Equipamiento específico con características técnicas precisas
          </p>
        </FadeIn>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 max-w-7xl mx-auto">
          {implementos.map((implement, index) => (
            <FadeIn
              key={implement.id}
              delay={index * 50}
              className="w-full"
            >
              <Card className="bg-[#222222] border border-white/5 overflow-hidden h-full hover:border-[#FA7B21]/40 transition-[border-color,transform,box-shadow] duration-300 shadow-lg hover:shadow-[#FA7B21]/10 hover:-translate-y-2.5 hover:scale-[1.03]">
                <div className="aspect-square overflow-hidden relative bg-zinc-800">
                  {implement.web?.imagenes?.[0] && (
                    <img
                      src={implement.web.imagenes[0]}
                      alt={tituloWeb(implement)}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-400 hover:scale-110"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#222222] via-transparent to-transparent opacity-60" />
                </div>
                <CardContent className="p-3 sm:p-4 space-y-2">
                  <h3 className="text-white text-xs sm:text-sm md:text-base line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem]">{tituloWeb(implement)}</h3>
                  <div className="pt-1">
                    <Badge variant="outline" className="border-[#FA7B21]/60 text-[#FCA929] text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1">
                      {soles(implement.precio)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ImplementsSection;
