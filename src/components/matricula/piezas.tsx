// Piezas de los formularios públicos: cabecera JMA, secciones, campos y
// selectores táctiles. Ningún <select> ni <input type="date"> nativo.
import { useEffect, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { cx, claseOpcion } from './tokens';
import { TALLAS, itemPolos, soles, type CantidadPolos, type PiezasRopa } from '../../utils/catalogo';

// ─── Marco de la página ──────────────────────────────────────────────────────

export function CabeceraJMA({ onVolver, textoVolver = 'Inicio' }: { onVolver?: () => void; textoVolver?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#231F20]/95 backdrop-blur">
      <div className={`${cx.contenedor} flex h-16 items-center justify-between`}>
        <div className="flex items-center gap-3">
          {/* Logo oficial, versión para fondo oscuro (texto claro) */}
          <img src="/marca/logo-completo-oscuro-800.png" alt="Team Wolf, centro de entrenamiento × JMA" width={800} height={258} className="h-11 w-auto" />
        </div>
        {onVolver && (
          <button type="button" onClick={onVolver} className="flex min-h-[44px] items-center gap-1.5 px-2 text-[14px] font-bold text-white/70 hover:text-white">
            <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
            {textoVolver}
          </button>
        )}
      </div>
    </header>
  );
}

/** Portada corta del formulario: etiqueta, título, precio desde y lo que incluye. */
export function Portada({ etiqueta, titulo, bajada, precio, precioAntes, notaPrecio, incluye, respaldo }: {
  etiqueta: string;
  titulo: string;
  bajada?: string | null;
  precio?: number | null;
  /** Precio tachado (Space ▸ Catálogo ▸ En la web) */
  precioAntes?: number | null;
  notaPrecio?: string | null;
  incluye?: string[];
  respaldo?: boolean;
}) {
  return (
    <section className="pt-7 pb-5">
      <p className={`${cx.display} text-[12px] uppercase tracking-[0.14em] text-[#F47B20]`}>{etiqueta}</p>
      <h1 className={`${cx.h1} mt-2`}>{titulo}</h1>
      {bajada && <p className={`${cx.textoSec} mt-3 text-[16px] leading-relaxed`}>{bajada}</p>}
      {precio != null && (
        <div className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          {precioAntes != null && precioAntes > precio && (
            <span className={`${cx.cifra} text-[18px] text-white/40 line-through`}>{soles(precioAntes)}</span>
          )}
          <span className={`${cx.cifra} text-[34px] text-white`}>{soles(precio)}</span>
          {notaPrecio && <span className={`${cx.textoApagado} text-[14px]`}>{notaPrecio}</span>}
        </div>
      )}
      {respaldo && <p className={`${cx.avisoAmbar} mt-3`}>No pudimos conectar con la academia para mostrar el precio. Intenta de nuevo en un momento o escríbenos por WhatsApp.</p>}
      {incluye && incluye.length > 0 && (
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {incluye.map((t) => (
            <li key={t} className="flex items-start gap-2.5 text-[15px] text-white/80">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#F47B20]" />
              {t}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Seccion({ id, numero, titulo, descripcion, children }: {
  id?: string;
  numero?: number;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`${cx.card} ${cx.cardPad} scroll-mt-24`}>
      <div className="mb-5 flex items-start gap-3">
        {numero != null && (
          <span className={`${cx.display} flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F47B20] text-[15px] text-[#231F20]`}>
            {numero}
          </span>
        )}
        <div className="min-w-0 pt-0.5">
          <h2 className={cx.h2}>{titulo}</h2>
          {descripcion && <p className={`${cx.textoApagado} mt-1 text-[14px]`}>{descripcion}</p>}
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

// ─── Campos ─────────────────────────────────────────────────────────────────

type CampoProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  id: string;
  label: string;
  ayuda?: string;
  onValor: (v: string) => void;
};

export function Campo({ id, label, ayuda, onValor, className, ...resto }: CampoProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className={cx.label}>{label}</label>
      <input id={id} {...resto} onChange={(e) => onValor(e.target.value)} className={cx.input} />
      {ayuda && <p className={cx.ayuda}>{ayuda}</p>}
    </div>
  );
}

/**
 * Fecha de nacimiento escrita como DD/MM/AAAA con teclado numérico.
 * Publica YYYY-MM-DD solo cuando la fecha es real y pasada; si no, ''.
 */
export function CampoFechaNacimiento({ id, valor, onCambio }: { id: string; valor: string; onCambio: (ymd: string) => void }) {
  const aTexto = (ymd: string) => (ymd ? ymd.split('-').reverse().join('/') : '');
  const [texto, setTexto] = useState(aTexto(valor));
  useEffect(() => { if (!valor) setTexto(''); }, [valor]);

  const escribir = (crudo: string) => {
    const d = crudo.replace(/\D/g, '').slice(0, 8);
    const t = d.length > 4 ? `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}` : d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
    setTexto(t);
    if (d.length === 8) {
      const [dd, mm, aa] = [Number(d.slice(0, 2)), Number(d.slice(2, 4)), Number(d.slice(4))];
      const f = new Date(aa, mm - 1, dd);
      const real = f.getFullYear() === aa && f.getMonth() === mm - 1 && f.getDate() === dd;
      onCambio(real && f < new Date() && aa > 1930 ? `${d.slice(4)}-${d.slice(2, 4)}-${d.slice(0, 2)}` : '');
    } else {
      onCambio('');
    }
  };
  const incompleta = texto.length === 10 && !valor;

  return (
    <div>
      <label htmlFor={id} className={cx.label}>Fecha de nacimiento</label>
      <input
        id={id}
        value={texto}
        onChange={(e) => escribir(e.target.value)}
        inputMode="numeric"
        autoComplete="bday"
        placeholder="DD/MM/AAAA"
        className={cx.input}
      />
      <p className={incompleta ? 'mt-1.5 text-[13px] text-rose-300' : cx.ayuda}>
        {incompleta ? 'Revisa la fecha: no existe o es futura.' : 'Con ella vemos su categoría y horarios.'}
      </p>
    </div>
  );
}

// ─── Selectores táctiles ────────────────────────────────────────────────────

export interface OpcionChip<T extends string> {
  valor: T;
  etiqueta: string;
  detalle?: string;
  bloqueada?: boolean;
}

export function Chips<T extends string>({ opciones, valor, onCambio, columnas = 'grid-cols-4 sm:grid-cols-6', etiqueta }: {
  opciones: OpcionChip<T>[];
  valor: T | '';
  onCambio: (v: T) => void;
  columnas?: string;
  etiqueta?: string;
}) {
  return (
    <div role="radiogroup" aria-label={etiqueta} className={`grid gap-2 ${columnas}`}>
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="radio"
          aria-checked={valor === o.valor}
          disabled={o.bloqueada}
          onClick={() => onCambio(o.valor)}
          className={`${claseOpcion(valor === o.valor, o.bloqueada)} ${o.detalle ? 'flex-col py-2' : ''}`}
        >
          <span>{o.etiqueta}</span>
          {o.detalle && <span className="mt-0.5 text-[12px] font-normal text-white/55">{o.detalle}</span>}
        </button>
      ))}
    </div>
  );
}

export function SelectorTalla({ titulo, valor, onCambio }: { titulo: string; valor: string; onCambio: (t: string) => void }) {
  return (
    <div>
      <p className={cx.label}>{titulo}</p>
      <Chips etiqueta={titulo} opciones={TALLAS.map((t) => ({ valor: t, etiqueta: t }))} valor={valor} onCambio={onCambio} />
    </div>
  );
}

/** Cantidad de polos (con el precio del catálogo) y la talla de cada uno. */
export function SelectorPolos({ ropa, cantidad, onCantidad, tallas, onTalla }: {
  ropa: PiezasRopa;
  cantidad: CantidadPolos;
  onCantidad: (c: CantidadPolos) => void;
  tallas: string[];
  onTalla: (i: number, t: string) => void;
}) {
  const opciones = (['0', '1', '2', '3'] as CantidadPolos[])
    .filter((c) => c === '0' || itemPolos(c, ropa))
    .map((c) => ({
      valor: c,
      etiqueta: c === '0' ? 'Ninguno' : c === '1' ? '1 polo' : `${c} polos`,
      detalle: c === '0' ? undefined : soles(itemPolos(c, ropa)!.precio),
    }));
  if (opciones.length === 1) return null;
  return (
    <div className="space-y-5">
      <div>
        <p className={cx.label}>Polos oficiales</p>
        <Chips etiqueta="Polos oficiales" opciones={opciones} valor={cantidad} onCambio={onCantidad} columnas="grid-cols-2 sm:grid-cols-4" />
      </div>
      {tallas.map((t, i) => (
        <SelectorTalla key={i} titulo={tallas.length > 1 ? `Talla del polo ${i + 1}` : 'Talla del polo'} valor={t} onCambio={(v) => onTalla(i, v)} />
      ))}
    </div>
  );
}

/** Casilla grande (uniforme adicional, implementos que ya tiene). */
export function Casilla({ marcada, onCambio, titulo, detalle, derecha }: {
  marcada: boolean;
  onCambio: (v: boolean) => void;
  titulo: string;
  detalle?: string;
  derecha?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={marcada}
      onClick={() => onCambio(!marcada)}
      className={`flex min-h-[56px] w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors duration-100 ${marcada ? cx.opcionOn : cx.opcionOff}`}
    >
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${marcada ? 'border-[#F47B20] bg-[#F47B20]' : 'border-white/30'}`}>
        {marcada && (
          <svg viewBox="0 0 16 16" className="h-4 w-4 text-[#231F20]" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M3 8.5l3.2 3L13 4.5" /></svg>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold text-white">{titulo}</span>
        {detalle && <span className="mt-0.5 block text-[13px] font-normal text-white/55">{detalle}</span>}
      </span>
      {derecha && <span className={`${cx.cifra} shrink-0 text-[15px] text-white/80`}>{derecha}</span>}
    </button>
  );
}

// ─── Envío ──────────────────────────────────────────────────────────────────

/** Lleva a la sección que falta completar. */
export function irA(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** Pantalla final: lo que se registró y el botón para ver cómo pagar. */
export function Exito({ titulo, texto, total, onPagar, onInicio }: {
  titulo: string;
  texto: string;
  total: number;
  onPagar: () => void;
  onInicio: () => void;
}) {
  return (
    <div className={`${cx.contenedor} py-12 text-center`}>
      <img src="/marca/logo-completo-oscuro-800.png" alt="Team Wolf, centro de entrenamiento × JMA" width={800} height={258} className="mx-auto h-auto w-64" />
      <h1 className={`${cx.h1} mt-6`}>{titulo}</h1>
      <p className={`${cx.textoSec} mx-auto mt-3 max-w-md text-[16px] leading-relaxed`}>{texto}</p>
      <div className={`${cx.card} mx-auto mt-8 max-w-sm px-6 py-5`}>
        <p className="text-[13px] font-bold uppercase tracking-wider text-white/50">Total a pagar</p>
        <p className={`${cx.cifra} mt-1 text-[36px] text-[#F47B20]`}>{soles(total)}</p>
      </div>
      <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3">
        <button type="button" onClick={onPagar} className={cx.btnPrimario}>Ver cómo pagar</button>
        <button type="button" onClick={onInicio} className={cx.btnSecundario}>Volver al inicio</button>
      </div>
    </div>
  );
}
