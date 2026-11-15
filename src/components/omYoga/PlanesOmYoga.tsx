import { Check, Clock, MessageCircle } from 'lucide-react';
import { useCatalogoPublico } from '../../hooks/useCatalogoPublico';
import { programaPorCodigo, soles, type ItemCatalogo } from '../../utils/catalogo';
import { enlaceWhatsApp } from '../../config/contacto';
import { OM_YOGA } from './datos';

const SOL = 'radial-gradient(circle at 35% 35%, #FFF3C4 0%, #FFE08A 30%, #FCA929 65%, rgba(250,123,33,0) 72%)';

/** Una tarjeta de plan. Todo lo que dice sale del catálogo (Space ▸ Catálogo ▸ En la web). */
function TarjetaPlan({ plan }: { plan: ItemCatalogo }) {
  const w = plan.web;
  const destacado = !!w?.destacado;
  const titulo = w?.titulo || plan.nombre;
  const mensaje = `Hola, quiero inscribirme al plan ${titulo} de OmYoga`;

  return (
    <article className={`relative flex flex-col overflow-hidden rounded-[28px] p-6 sm:p-8 ${
      destacado ? 'bg-zinc-950 ring-1 ring-[#FA7B21]/60' : 'border border-white/10 bg-white/[0.03]'
    }`}>
      {destacado && <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-80" style={{ background: SOL }} />}
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-2xl font-bold text-white">{titulo}</h3>
          {w?.etiqueta && (
            <span className="rounded-full bg-[#FA7B21] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">{w.etiqueta}</span>
          )}
        </div>
        {w?.texto && <p className="mt-1 text-white/55">{w.texto}</p>}

        <div className="mt-6 flex items-baseline gap-2">
          {w?.precio_referencia ? <span className="text-lg text-white/35 line-through">{soles(w.precio_referencia)}</span> : null}
          <span className="text-5xl font-bold tracking-tight text-white">{soles(plan.precio)}</span>
          {w?.nota_precio && <span className="text-sm text-white/50">{w.nota_precio}</span>}
        </div>

        {w?.beneficios?.length ? (
          <ul className="mt-6 space-y-3">
            {w.beneficios.map((b) => (
              <li key={b} className="flex items-start gap-3 text-white/80">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#FCA929]" strokeWidth={2} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <a href={enlaceWhatsApp(mensaje)} target="_blank" rel="noopener noreferrer"
        className={`relative mt-8 flex min-h-[52px] items-center justify-center gap-2 rounded-xl px-6 text-base font-semibold transition-transform duration-150 active:scale-[0.98] ${
          destacado
            ? 'bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white shadow-lg shadow-[#FA7B21]/30'
            : 'border border-white/15 text-white hover:border-white/30'
        }`}>
        <MessageCircle className="h-5 w-5" /> Inscribirme
      </a>
    </article>
  );
}

/**
 * Planes de OmYoga: aparecen cuando termina la clase de prueba. Si el catálogo no
 * responde no se inventan precios: se ofrece WhatsApp.
 */
export function PlanesOmYoga() {
  const { items, estado } = useCatalogoPublico();
  const planes = OM_YOGA.PLANES.map((c) => programaPorCodigo(items, c)).filter((p): p is ItemCatalogo => !!p);

  return (
    <div>
      <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Elige tu{' '}
          <span className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] bg-clip-text text-transparent">plan</span>
        </h2>
        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-white/75">
          <Clock className="h-4 w-4 text-[#FCA929]" /> {OM_YOGA.horario} · Av. San Luis 2083, San Borja
        </p>
      </div>

      {estado === 'cargando' ? (
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {[0, 1].map((i) => <div key={i} className="h-[420px] animate-pulse rounded-[28px] bg-white/5" />)}
        </div>
      ) : planes.length === 0 ? (
        <div className="mx-auto max-w-md text-center">
          <p className="mb-6 text-white/65">Escríbenos y te contamos los planes y precios de OmYoga.</p>
          <a href={enlaceWhatsApp('Hola, quiero información de los planes de OmYoga')} target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-gradient-to-r from-[#FA7B21] to-[#FCA929] px-6 font-semibold text-white">
            <MessageCircle className="h-5 w-5" /> Escribir por WhatsApp
          </a>
        </div>
      ) : (
        <div className="mx-auto grid max-w-4xl items-stretch gap-6 md:grid-cols-2">
          {planes.map((p) => <TarjetaPlan key={p.id} plan={p} />)}
        </div>
      )}
    </div>
  );
}
