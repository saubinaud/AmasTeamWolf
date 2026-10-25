// Código promocional, resumen de la cotización del servidor y barra fija con
// el total y el botón de enviar. Aquí no se suma nada: se pinta la cotización.
import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { cx } from './tokens';
import { soles, type Cotizacion } from '../../utils/catalogo';

/**
 * El código se aplica pidiendo una cotización con él: el servidor dice si vale
 * (promocion.aplicada) o por qué no (promocion.motivo).
 */
export function CampoCodigo({ aplicado, onAplicar, onQuitar, cotizacion, alDia, inicialAbierto = false }: {
  aplicado: string;
  onAplicar: (codigo: string) => void;
  onQuitar: () => void;
  cotizacion: Cotizacion | null;
  alDia: boolean;
  inicialAbierto?: boolean;
}) {
  const [abierto, setAbierto] = useState(inicialAbierto || !!aplicado);
  const [texto, setTexto] = useState(aplicado);
  const promo = alDia && aplicado ? cotizacion?.promocion : null;
  const revisando = !!aplicado && !alDia;

  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)} className={cx.btnTexto}>
        ¿Tienes un código promocional?
      </button>
    );
  }

  return (
    <div>
      <label htmlFor="codigo-promo" className={cx.label}>Código promocional</label>
      <div className="flex gap-2">
        <input
          id="codigo-promo"
          value={texto}
          onChange={(e) => setTexto(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (texto.trim()) onAplicar(texto.trim()); } }}
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="Escribe tu código"
          className={`${cx.input} uppercase`}
        />
        {aplicado ? (
          <button type="button" onClick={() => { setTexto(''); onQuitar(); }} className={`${cx.btnSecundario} shrink-0`} aria-label="Quitar código">
            <X className="h-5 w-5" />
          </button>
        ) : (
          <button type="button" disabled={!texto.trim()} onClick={() => onAplicar(texto.trim())} className={`${cx.btnSecundario} shrink-0`}>
            Aplicar
          </button>
        )}
      </div>
      {revisando && <p className={`${cx.ayuda} flex items-center gap-2`}><Loader2 className="h-4 w-4 animate-spin" /> Revisando el código…</p>}
      {promo?.aplicada && (
        <p className={`${cx.avisoOk} mt-3`}><strong>{promo.codigo}</strong> aplicado{promo.nombre ? `: ${promo.nombre}` : ''}.</p>
      )}
      {promo && !promo.aplicada && promo.motivo && (
        <p className={`${cx.avisoError} mt-3`}>{promo.motivo}.</p>
      )}
    </div>
  );
}

/** Desglose que devuelve el servidor. */
export function ResumenCotizacion({ cotizacion, alDia, error, respaldo, etiquetaDescuentoManual = 'Descuento', clasesBase }: {
  cotizacion: Cotizacion | null;
  alDia: boolean;
  error: string | null;
  respaldo?: boolean;
  etiquetaDescuentoManual?: string;
  clasesBase?: number | null;
}) {
  if (respaldo) {
    return <p className={cx.avisoAmbar}>No pudimos calcular el total con la academia. Revisa tu conexión y vuelve a intentarlo en un momento.</p>;
  }
  if (!cotizacion) {
    return error
      ? <p className={cx.avisoError}>No se pudo calcular el total. Reintentando…</p>
      : <div className="h-24 animate-pulse rounded-xl bg-white/5" />;
  }
  const c = cotizacion;
  return (
    <div className={`space-y-3 text-[15px] transition-opacity duration-150 ${alDia ? '' : 'opacity-50'}`}>
      {c.lineas.map((l) => (
        <div key={`${l.item_id}`} className="flex items-baseline justify-between gap-3">
          <span className="text-white/85">
            {l.nombre}
            {l.tipo === 'programa' && l.clases ? <span className="text-white/45"> · {l.clases} clases</span> : null}
          </span>
          <span className={`${cx.cifra} shrink-0 text-white`}>{soles(l.subtotal)}</span>
        </div>
      ))}
      {c.descuento_promocion > 0 && (
        <div className="flex items-baseline justify-between gap-3 text-emerald-300">
          <span>Código {c.promocion.codigo}</span>
          <span className={`${cx.cifra} shrink-0`}>− {soles(c.descuento_promocion)}</span>
        </div>
      )}
      {c.descuento_manual > 0 && (
        <div className="flex items-baseline justify-between gap-3 text-emerald-300">
          <span>{etiquetaDescuentoManual}</span>
          <span className={`${cx.cifra} shrink-0`}>− {soles(c.descuento_manual)}</span>
        </div>
      )}
      {c.clases_extra > 0 && (
        <p className="text-emerald-300">+ {c.clases_extra} clases de regalo{clasesBase ? ` (${clasesBase + c.clases_extra} en total)` : ''}</p>
      )}
      {c.regalos.map((g) => (
        <p key={g.item_id} className="text-emerald-300">+ {g.cantidad > 1 ? `${g.cantidad} × ` : ''}{g.nombre} de regalo</p>
      ))}
      {!c.ok && <p className={cx.avisoError}>{c.errores[0]}</p>}
      <div className={`${cx.divisor} flex items-baseline justify-between pt-4`}>
        <span className={`${cx.display} text-[15px] text-white`}>TOTAL</span>
        <span className={`${cx.cifra} text-[28px] text-[#F47B20]`}>{soles(c.total)}</span>
      </div>
    </div>
  );
}

/** Barra fija abajo: total del servidor y el botón. Deja hueco con <EspacioBarra />. */
export function BarraTotal({ total, calculando, enviando, onEnviar, texto, deshabilitado }: {
  total: number | null;
  calculando: boolean;
  enviando: boolean;
  onEnviar: () => void;
  texto: string;
  deshabilitado?: boolean;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#231F20]/97 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className={`${cx.contenedor} flex items-center gap-4 py-3`}>
        <div className="min-w-0">
          <p className="text-[12px] font-bold uppercase tracking-wider text-white/50">Total</p>
          <p className={`${cx.cifra} flex h-8 items-center text-[24px] text-white`}>
            {total == null ? '—' : calculando ? <Loader2 className="h-5 w-5 animate-spin text-white/60" /> : soles(total)}
          </p>
        </div>
        <button type="button" onClick={onEnviar} disabled={enviando || deshabilitado} className={`${cx.btnPrimario} flex-1`}>
          {enviando ? <><Loader2 className="h-5 w-5 animate-spin" /> Enviando…</> : texto}
        </button>
      </div>
    </div>
  );
}

export function EspacioBarra() {
  return <div className="h-28" aria-hidden />;
}
