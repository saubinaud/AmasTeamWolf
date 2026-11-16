import { Check, Info } from 'lucide-react';
import { useCatalogoPublico } from '../hooks/useCatalogoPublico';
import { programaPorCodigo, soles, tituloWeb, type ItemCatalogo } from '../utils/catalogo';
import { ui } from '../styles/marca';

/** Leadership Wolf según el catálogo: precio, tachado, implementos que trae y beneficios. */
export function useLeadership() {
  const { items, estado } = useCatalogoPublico();
  const programa = programaPorCodigo(items, 'leadership');
  const implementos = (programa?.incluye ?? [])
    .map((id) => items.find((i) => i.id === id))
    .filter((i): i is ItemCatalogo => !!i);
  return {
    programa,
    estado,
    w: programa?.web ?? null,
    titulo: programa ? tituloWeb(programa) : 'Leadership Wolf',
    antes: programa?.web?.precio_referencia ?? null,
    lineas: [...implementos.map((i) => tituloWeb(i)), ...(programa?.web?.beneficios ?? [])],
  };
}

/** Precio de Leadership (del catálogo) con su tachado, nota y aviso. */
export function PrecioLeadership({ grande = false }: { grande?: boolean }) {
  const { programa, estado, w, antes } = useLeadership();
  if (!programa) {
    return <p className="text-white/70">{estado === 'cargando' ? 'Cargando precio…' : 'Precio: consúltalo por WhatsApp'}</p>;
  }
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className={`${grande ? 'text-5xl sm:text-6xl' : 'text-5xl'} font-bold tracking-tight text-white tabular-nums`}>{soles(programa.precio)}</span>
        {antes != null && <span className="text-lg text-white/40 line-through tabular-nums">{soles(antes)}</span>}
      </div>
      {(antes != null || w?.nota_precio) && (
        <p className="mt-2 text-sm text-white/55">
          {antes != null && <span className="font-semibold text-[#FCA929]">Ahorras {soles(antes - programa.precio)}</span>}
          {antes != null && w?.nota_precio && ' · '}
          {w?.nota_precio}
        </p>
      )}
      <p className="mt-1 text-sm text-white/45">El precio se ajusta según los implementos que ya tenga.</p>
      {w?.aviso_texto && (
        <p className="mt-4 flex items-start gap-2.5 rounded-xl bg-white/[0.05] px-3.5 py-3 text-sm text-white/80">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#FCA929]" />
          <span>{w.aviso_titulo && <strong className="font-semibold text-white">{w.aviso_titulo}. </strong>}{w.aviso_texto}</span>
        </p>
      )}
    </div>
  );
}

interface LeadershipProgramCardProps {
  onEnrollClick: () => void;
}

/**
 * Tarjeta de cierre de Leadership Wolf: lo que incluye, precio y botón.
 * Todo sale del API (Space ▸ Catálogo ▸ En la web).
 */
export function LeadershipProgramCard({ onEnrollClick }: LeadershipProgramCardProps) {
  const { w, titulo, lineas } = useLeadership();

  return (
    <section id="programa" className={ui.seccion}>
      <div className={`mx-auto max-w-3xl ${ui.cardDestacada} ${ui.cardPad}`}>
        {w?.sello && <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/45">{w.sello}</p>}
        <h2 className={`mt-1.5 ${ui.h2}`}>{titulo}</h2>
        {w?.texto && <p className="mt-2 text-white/60">{w.texto}</p>}

        <div className="mt-6"><PrecioLeadership /></div>

        {lineas.length > 0 && (
          <ul className="mt-6 grid gap-3 border-t border-white/[0.07] pt-6 sm:grid-cols-2">
            {lineas.map((t) => (
              <li key={t} className="flex items-start gap-3 text-white/80">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#FCA929]" strokeWidth={2} /> {t}
              </li>
            ))}
          </ul>
        )}

        <button type="button" onClick={onEnrollClick} className={`mt-8 w-full ${ui.btnPrimary}`}>
          Inscribirme a Leadership
        </button>
      </div>
    </section>
  );
}
