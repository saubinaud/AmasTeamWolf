import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, MessageCircle } from 'lucide-react';
import { API_BASE } from '../../config/api';
import { enlaceWhatsApp } from '../../config/contacto';
import { OM_YOGA, CAMPOS, EXPERIENCIAS, useCuentaRegresiva } from './datos';
import { EntradaTarjeta, type Entrada } from '../entrada/EntradaTarjeta';

const CLAVE_ENTRADA = 'om-yoga-entrada';

/** La entrada guardada en este teléfono: si vuelve a la página, ve su entrada en vez del formulario. */
function entradaGuardada(): Entrada | null {
  try { const v = localStorage.getItem(CLAVE_ENTRADA); return v ? JSON.parse(v) : null; } catch { return null; }
}

type Estado = 'cargando' | 'listo' | 'enviando' | 'enviado' | 'sin-formulario';

interface Campos {
  nombre: string;
  whatsapp: string;
  correo: string;
  experiencia: string;
  condicion: string;
}

const VACIO: Campos = { nombre: '', whatsapp: '', correo: '', experiencia: '', condicion: '' };

const input =
  'w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-base text-white placeholder:text-white/30 outline-none transition focus:border-[#FCA929]/70 focus:bg-white/[0.06] focus:ring-4 focus:ring-[#FA7B21]/15';

/**
 * Inscripción a la clase de prueba. Envía al formulario "om-yoga" de Space ▸ Formularios,
 * así las inscripciones se ven y se exportan allí. Tras el cierre ya no recibe inscripciones.
 */
export function FormularioOmYoga() {
  const { terminado } = useCuentaRegresiva(OM_YOGA.cierre);
  const [estado, setEstado] = useState<Estado>('cargando');
  const [ids, setIds] = useState<Record<string, number>>({});
  const [campos, setCampos] = useState<Campos>(VACIO);
  const [errores, setErrores] = useState<Partial<Record<keyof Campos, string>>>({});
  const [errorEnvio, setErrorEnvio] = useState('');
  const caja = useRef<HTMLDivElement>(null);
  const [entrada, setEntrada] = useState<Entrada | null>(entradaGuardada);

  useEffect(() => {
    let vivo = true;
    fetch(`${API_BASE}/formularios/${OM_YOGA.slugFormulario}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json) => {
        const mapa: Record<string, number> = {};
        for (const b of json?.data?.bloques ?? []) if (b.label) mapa[b.label] = b.id;
        if (!vivo) return;
        if (!mapa[CAMPOS.nombre] || !mapa[CAMPOS.whatsapp]) return setEstado('sin-formulario');
        setIds(mapa);
        setEstado('listo');
      })
      .catch(() => vivo && setEstado('sin-formulario'));
    return () => { vivo = false; };
  }, []);

  const cambiar = (k: keyof Campos, v: string) => {
    setCampos((c) => ({ ...c, [k]: v }));
    if (errores[k]) setErrores((e) => ({ ...e, [k]: undefined }));
  };

  const validar = () => {
    const e: typeof errores = {};
    if (campos.nombre.trim().length < 3) e.nombre = 'Escribe tu nombre y apellido';
    if (campos.whatsapp.replace(/\D/g, '').length < 9) e.whatsapp = 'Escribe un número de 9 dígitos';
    if (campos.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campos.correo)) e.correo = 'Revisa el correo';
    if (!campos.experiencia) e.experiencia = 'Elige una opción';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const enviar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validar()) return;
    setEstado('enviando');
    setErrorEnvio('');
    const datos: Record<string, string> = {};
    (Object.keys(CAMPOS) as (keyof Campos)[]).forEach((k) => {
      const id = ids[CAMPOS[k]];
      if (id && campos[k].trim()) datos[String(id)] = campos[k].trim();
    });
    try {
      const r = await fetch(`${API_BASE}/formularios/${OM_YOGA.slugFormulario}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datos }),
      });
      const json = await r.json().catch(() => null);
      if (!r.ok || !json?.success) throw new Error(json?.message || json?.error);
      const nueva: Entrada | null = json.data?.entrada ?? null;
      if (nueva) {
        setEntrada(nueva);
        try { localStorage.setItem(CLAVE_ENTRADA, JSON.stringify(nueva)); } catch { /* sin almacenamiento: igual se ve */ }
      }
      setEstado('enviado');
      requestAnimationFrame(() => caja.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    } catch (err) {
      setErrorEnvio(err instanceof Error && err.message ? err.message : 'No se pudo enviar. Inténtalo otra vez.');
      setEstado('listo');
    }
  };

  const whatsapp = (
    <a
      href={enlaceWhatsApp('Hola, quiero información sobre OM Yoga')}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm text-white/90 transition hover:border-[#FCA929]/60 hover:text-white"
    >
      <MessageCircle className="h-4 w-4" /> Escríbenos por WhatsApp
    </a>
  );

  // Con entrada (recién inscrito o volviendo desde este teléfono): la entrada en vez del formulario
  if (entrada) {
    return (
      <div ref={caja} aria-live="polite">
        <p className="mb-1 text-center text-2xl font-semibold text-white">Tu lugar está reservado</p>
        <p className="mb-6 text-center text-white/60">Guarda tu entrada: la mostrarás al llegar.</p>
        <EntradaTarjeta entrada={entrada} />
        <button type="button" onClick={() => { try { localStorage.removeItem(CLAVE_ENTRADA); } catch { /* */ } setEntrada(null); setCampos(VACIO); setEstado('listo'); }}
          className="mt-4 w-full text-center text-sm text-white/45 underline-offset-4 hover:text-white/70 hover:underline">
          Inscribir a otra persona
        </button>
      </div>
    );
  }

  if (estado === 'enviado') {
    return (
      <div ref={caja} className="text-center py-6" aria-live="polite">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#FA7B21] to-[#FCA929] shadow-lg shadow-[#FA7B21]/30">
          <CheckCircle2 className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-2xl font-semibold text-white">Tu lugar está reservado</h3>
        <p className="mt-3 text-white/65 leading-relaxed">
          Te esperamos el {OM_YOGA.fechaClase.toLowerCase()}
          {OM_YOGA.HORA_CLASE ? ` a las ${OM_YOGA.HORA_CLASE}` : ''} en Av. San Luis 2083, San Borja.
          Te escribiremos por WhatsApp con los detalles.
        </p>
        <div className="mt-6">{whatsapp}</div>
      </div>
    );
  }

  if (terminado) {
    return (
      <div className="text-center py-6">
        <h3 className="text-xl font-semibold text-white">Las inscripciones cerraron</h3>
        <p className="mt-2 mb-6 text-white/60">Escríbenos y te avisamos de las próximas clases de OM Yoga.</p>
        {whatsapp}
      </div>
    );
  }

  if (estado === 'sin-formulario') {
    return (
      <div className="text-center py-6">
        <h3 className="text-xl font-semibold text-white">Inscríbete por WhatsApp</h3>
        <p className="mt-2 mb-6 text-white/60">El formulario no está disponible en este momento.</p>
        {whatsapp}
      </div>
    );
  }

  const err = (k: keyof Campos) =>
    errores[k] ? <p className="mt-1.5 text-sm text-red-300">{errores[k]}</p> : null;

  return (
    <form onSubmit={enviar} noValidate className="space-y-5">
      <div>
        <label htmlFor="om-nombre" className="mb-2 block text-sm text-white/75">Nombre y apellido</label>
        <input id="om-nombre" className={input} autoComplete="name" placeholder="Ej. María Torres"
          value={campos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} />
        {err('nombre')}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="om-wsp" className="mb-2 block text-sm text-white/75">WhatsApp</label>
          <input id="om-wsp" className={input} type="tel" inputMode="tel" autoComplete="tel" placeholder="9XX XXX XXX"
            value={campos.whatsapp} onChange={(e) => cambiar('whatsapp', e.target.value)} />
          {err('whatsapp')}
        </div>
        <div>
          <label htmlFor="om-correo" className="mb-2 block text-sm text-white/75">
            Correo <span className="text-white/35">(opcional)</span>
          </label>
          <input id="om-correo" className={input} type="email" inputMode="email" autoComplete="email" placeholder="tu@correo.com"
            value={campos.correo} onChange={(e) => cambiar('correo', e.target.value)} />
          {err('correo')}
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 block text-sm text-white/75">¿Has practicado yoga antes?</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {EXPERIENCIAS.map((op) => {
            const activo = campos.experiencia === op;
            return (
              <button key={op} type="button" onClick={() => cambiar('experiencia', op)} aria-pressed={activo}
                className={`rounded-xl border px-3 py-3 text-sm transition active:scale-[0.98] ${
                  activo
                    ? 'border-[#FCA929] bg-[#FA7B21]/15 text-white'
                    : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25'
                }`}>
                {op}
              </button>
            );
          })}
        </div>
        {err('experiencia')}
      </fieldset>

      <div>
        <label htmlFor="om-cond" className="mb-2 block text-sm text-white/75">
          ¿Alguna lesión o condición que debamos saber? <span className="text-white/35">(opcional)</span>
        </label>
        <textarea id="om-cond" rows={3} className={`${input} resize-none`} placeholder="Así Celeste adapta las posturas para ti"
          value={campos.condicion} onChange={(e) => cambiar('condicion', e.target.value)} />
      </div>

      {errorEnvio && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{errorEnvio}</p>}

      <button type="submit" disabled={estado !== 'listo'}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FA7B21] to-[#FCA929] px-6 py-4 text-base font-semibold text-white shadow-lg shadow-[#FA7B21]/25 transition hover:shadow-[#FA7B21]/45 active:scale-[0.99] disabled:opacity-60">
        {estado === 'enviando' || estado === 'cargando' ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        {estado === 'cargando' ? 'Cargando…' : estado === 'enviando' ? 'Reservando…' : 'Reservar mi clase gratis'}
      </button>
      <p className="text-center text-xs text-white/40">Sin costo y sin compromiso. Solo para adultos.</p>
    </form>
  );
}
