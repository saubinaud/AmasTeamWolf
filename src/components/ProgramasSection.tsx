import { memo, useState } from 'react';
import { Check, ChevronDown, Gift, MessageCircle } from 'lucide-react';
import { useCatalogoPublico } from '../hooks/useCatalogoPublico';
import { programasPortada, tituloWeb, soles, type ItemCatalogo } from '../utils/catalogo';
import { enlaceWhatsApp } from '../config/contacto';
import { ui } from '../styles/marca';

interface ProgramasSectionProps {
  /** Código del programa en el catálogo ('full', '6meses', '1mes'…) */
  onOpenMatricula: (codigo: string) => void;
}

/** Beneficios visibles antes de "Ver todos". */
const VISIBLES = 5;

/**
 * Programas de la portada. Todo sale del catálogo del API: cuáles salen, en qué
 * orden, precio, título, beneficios, tachado, cinta, sello y aviso
 * (Space ▸ Catálogo ▸ En la web). Si el API no responde no se inventan precios:
 * se ofrece WhatsApp.
 */
export const ProgramasSection = memo(function ProgramasSection({ onOpenMatricula }: ProgramasSectionProps) {
  const { items, estado } = useCatalogoPublico();
  const programas = programasPortada(items);

  return (
    <section id="programas" className={`${ui.seccion} scroll-mt-20`}>
      <div className={ui.cabeceraSeccion}>
        <p className={ui.antetitulo}>Programas</p>
        <h2 className={`mt-4 ${ui.h2}`}>Elige el programa de tu hijo</h2>
        <p className={`mt-4 ${ui.bajada}`}>Todos incluyen clases en la academia de San Borja y seguimiento de su avance.</p>
      </div>

      {estado === 'cargando' ? (
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className={`h-[520px] ${ui.esqueleto}`} />)}
        </div>
      ) : programas.length === 0 ? (
        <div className={`mx-auto max-w-md text-center ${ui.card} ${ui.cardPad}`}>
          <p className="mb-6 text-white/70">Escríbenos y te contamos los programas, horarios y precios vigentes.</p>
          <a href={enlaceWhatsApp('Hola, quiero información de los programas')} target="_blank" rel="noopener noreferrer" className={ui.btnPrimary}>
            <MessageCircle className="h-5 w-5" /> Consultar por WhatsApp
          </a>
        </div>
      ) : (
        <div className="mx-auto grid max-w-6xl items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
          {programas.map((p, i) => (
            <TarjetaPrograma
              key={p.id}
              programa={p}
              // La última tarjeta suelta en dos columnas se centra
              suelta={programas.length % 2 === 1 && i === programas.length - 1}
              onElegir={() => onOpenMatricula(p.codigo ?? '')}
            />
          ))}
        </div>
      )}
    </section>
  );
});

function TarjetaPrograma({ programa: p, suelta, onElegir }: { programa: ItemCatalogo; suelta: boolean; onElegir: () => void }) {
  const w = p.web;
  const destacado = !!w?.destacado;
  const antes = w?.precio_referencia ?? null;
  const beneficios = w?.beneficios ?? [];
  const [todos, setTodos] = useState(false);
  const visibles = todos ? beneficios : beneficios.slice(0, VISIBLES);
  const ocultos = beneficios.length - VISIBLES;
  const titulo = tituloWeb(p);

  return (
    <article
      className={`relative flex flex-col ${destacado ? ui.cardDestacada : ui.card} ${ui.cardPad} ${
        suelta ? 'md:col-span-2 md:mx-auto md:w-full md:max-w-md lg:col-span-1 lg:max-w-none' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {w?.sello && <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/45">{w.sello}</p>}
          <h3 className="mt-1.5 text-2xl font-semibold leading-snug text-white">{titulo}</h3>
        </div>
        {w?.etiqueta && <span className={`${ui.cinta} shrink-0`}>{w.etiqueta}</span>}
      </div>
      {w?.texto && <p className="mt-2 text-white/60">{w.texto}</p>}

      {/* Precio arriba */}
      <div className="mt-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-5xl font-bold tracking-tight text-white tabular-nums">{soles(p.precio)}</span>
          {antes != null && <span className="text-lg text-white/40 line-through tabular-nums">{soles(antes)}</span>}
        </div>
        {(antes != null || w?.nota_precio) && (
          <p className="mt-2 text-sm text-white/50">
            {antes != null && <span className="font-semibold text-[#FCA929]">Ahorras {soles(antes - p.precio)}</span>}
            {antes != null && w?.nota_precio && ' · '}
            {w?.nota_precio}
          </p>
        )}
      </div>

      {(w?.aviso_titulo || w?.aviso_texto) && (
        <p className="mt-5 flex items-start gap-2.5 rounded-xl bg-[#FA7B21]/10 px-3.5 py-3 text-sm text-white/85">
          <Gift className="mt-0.5 h-4 w-4 shrink-0 text-[#FCA929]" />
          <span>
            {w?.aviso_titulo && <strong className="font-semibold text-white">{w.aviso_titulo}. </strong>}
            {w?.aviso_texto}
          </span>
        </p>
      )}

      {beneficios.length > 0 && (
        <div className="mt-6 border-t border-white/[0.07] pt-6">
          <ul className="space-y-3">
            {visibles.map((b) => (
              <li key={b} className="flex items-start gap-3 text-white/80">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#FCA929]" strokeWidth={2} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          {ocultos > 0 && (
            <button type="button" onClick={() => setTodos((v) => !v)} aria-expanded={todos} className={`mt-2 ${ui.btnGhost}`}>
              {todos ? 'Ver menos' : `Ver los ${beneficios.length} beneficios`}
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${todos ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      )}

      <div className="mt-auto pt-8">
      <button
        type="button"
        onClick={onElegir}
        data-umami-event="Click Matricularme"
        data-umami-event-programa={titulo}
        data-umami-event-valor={String(p.precio)}
        className={`w-full ${destacado ? ui.btnPrimary : ui.btnSecondary}`}
      >
        Matricularme
      </button>
      </div>
    </article>
  );
}
