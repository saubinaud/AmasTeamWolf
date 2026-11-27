// Libro de Reclamaciones virtual (Ley 29571, art. 150; DS 011-2011-PCM, Anexo I,
// modificado por DS 101-2022-PCM). La hoja sigue el orden del anexo: proveedor,
// consumidor, bien contratado y detalle. El número correlativo, la fecha límite
// y el PDF los pone el servidor (amas-api, POST /api/reclamaciones); aquí solo
// se ayuda a llenar bien. El servidor manda en la validación.
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Download, Loader2 } from 'lucide-react';
import { API_BASE } from '../../config/api';
import { cx } from '../matricula/tokens';
import { CabeceraJMA, Campo, Casilla, Chips, Seccion, irA } from '../matricula/piezas';
import { useAppNavigate } from '../../hooks/useAppNavigate';

type Tipo = 'reclamo' | 'queja';
type TipoDoc = 'DNI' | 'CE' | 'Pasaporte';
type BienTipo = 'producto' | 'servicio';

interface Proveedor { nombre: string; razon_social: string | null; ruc: string | null; direccion: string }
interface Registro { numero: string; fecha: string; hora: string; fecha_limite: string; pdf: string; correo_enviado: boolean }

const PROVEEDOR_RESPALDO: Proveedor = { nombre: 'Team Wolf × JMA', razon_social: null, ruc: null, direccion: 'Av. San Luis 2083, San Borja' };

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const fechaLarga = (ymd: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd);
  return m ? `${Number(m[3])} de ${MESES[Number(m[2]) - 1]} de ${m[1]}` : ymd;
};
const hoyLima = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Lima' });

const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Campo de texto largo con el mismo aspecto que los inputs de la web. */
function Texto({ id, label, ayuda, valor, onValor, error, max = 2000 }: {
  id: string; label: string; ayuda?: string; valor: string; onValor: (v: string) => void; error?: string; max?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className={cx.label}>{label}</label>
      <textarea
        id={id}
        value={valor}
        maxLength={max}
        onChange={(e) => onValor(e.target.value)}
        className={`${cx.input} h-auto min-h-[120px] py-3 leading-relaxed`}
      />
      {ayuda && <p className={cx.ayuda}>{ayuda}</p>}
      <Error texto={error} />
    </div>
  );
}

function Error({ texto }: { texto?: string }) {
  return texto ? <p className="mt-1.5 text-[13px] font-bold text-rose-300">{texto}</p> : null;
}

export function LibroReclamacionesPage() {
  const navegar = useAppNavigate();
  const [proveedor, setProveedor] = useState<Proveedor>(PROVEEDOR_RESPALDO);
  const [f, setF] = useState({
    tipo: '' as Tipo | '',
    nombre: '', tipo_documento: 'DNI' as TipoDoc, documento: '', domicilio: '', telefono: '', correo: '',
    es_menor: false, apoderado_nombre: '', apoderado_documento: '',
    bien_tipo: '' as BienTipo | '', monto: '', descripcion_bien: '',
    detalle: '', pedido: '',
    acepta: false,
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [registro, setRegistro] = useState<Registro | null>(null);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => {
    setF((x) => ({ ...x, [k]: v }));
    if (errores[k as string]) setErrores((e) => { const { [k as string]: _q, ...resto } = e; return resto; });
  };

  useEffect(() => {
    let vigente = true;
    fetch(`${API_BASE}/reclamaciones/proveedor`)
      .then((r) => r.json())
      .then((j) => { if (vigente && j?.success && j.data) setProveedor({ ...PROVEEDOR_RESPALDO, ...j.data }); })
      .catch(() => { /* el respaldo basta para el encabezado */ });
    return () => { vigente = false; };
  }, []);

  useEffect(() => { if (registro) window.scrollTo({ top: 0, behavior: 'smooth' }); }, [registro]);

  const hoy = useMemo(() => fechaLarga(hoyLima()), []);

  /** Lo mismo que revisa el servidor; si algo se escapa, el servidor responde con el campo. */
  const validar = () => {
    const e: Record<string, string> = {};
    const doc = f.documento.trim();
    if (f.nombre.trim().length < 3) e.nombre = 'Escribe tu nombre completo';
    if (!doc) e.documento = 'Escribe tu número de documento';
    else if (f.tipo_documento === 'DNI' && !/^\d{8}$/.test(doc)) e.documento = 'El DNI tiene 8 dígitos';
    else if (f.tipo_documento !== 'DNI' && !/^[A-Za-z0-9-]{6,15}$/.test(doc)) e.documento = 'Revisa el número de documento';
    if (f.domicilio.trim().length < 5) e.domicilio = 'Escribe tu domicilio';
    if (!CORREO_RE.test(f.correo.trim())) e.correo = 'Escribe un correo válido: ahí te llegará la copia y la respuesta';
    if (f.telefono.trim() && !/^[\d\s+()-]{6,20}$/.test(f.telefono.trim())) e.telefono = 'Revisa el teléfono';
    if (f.es_menor) {
      if (f.apoderado_nombre.trim().length < 3) e.apoderado_nombre = 'Escribe el nombre de tu padre, madre o tutor';
      if (!f.apoderado_documento.trim()) e.apoderado_documento = 'Escribe su número de documento';
    }
    if (!f.bien_tipo) e.bien_tipo = 'Elige si es un producto o un servicio';
    if (f.monto.trim() && !(Number(f.monto) >= 0)) e.monto = 'Escribe un monto válido o déjalo vacío';
    if (f.descripcion_bien.trim().length < 3) e.descripcion_bien = 'Describe el producto o servicio';
    if (!f.tipo) e.tipo = 'Elige si es un reclamo o una queja';
    if (f.detalle.trim().length < 10) e.detalle = 'Cuéntanos qué pasó';
    if (f.pedido.trim().length < 3) e.pedido = 'Cuéntanos qué solicitas';
    if (!f.acepta) e.acepta = 'Marca la declaración para enviar';
    return e;
  };

  const SECCION_DE: Record<string, string> = {
    nombre: 'sec-consumidor', documento: 'sec-consumidor', domicilio: 'sec-consumidor', telefono: 'sec-consumidor', correo: 'sec-consumidor',
    apoderado_nombre: 'sec-consumidor', apoderado_documento: 'sec-consumidor', tipo_documento: 'sec-consumidor',
    bien_tipo: 'sec-bien', monto: 'sec-bien', descripcion_bien: 'sec-bien',
    tipo: 'sec-detalle', detalle: 'sec-detalle', pedido: 'sec-detalle', acepta: 'sec-envio',
  };

  const enviar = async () => {
    setErrorGeneral(null);
    const e = validar();
    setErrores(e);
    const primero = Object.keys(e)[0];
    if (primero) { irA(SECCION_DE[primero] ?? 'sec-consumidor'); return; }
    setEnviando(true);
    try {
      const r = await fetch(`${API_BASE}/reclamaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: f.tipo,
          nombre: f.nombre.trim(), tipo_documento: f.tipo_documento, documento: f.documento.trim(),
          domicilio: f.domicilio.trim(), telefono: f.telefono.trim() || null, correo: f.correo.trim(),
          es_menor: f.es_menor,
          apoderado_nombre: f.es_menor ? f.apoderado_nombre.trim() : null,
          apoderado_documento: f.es_menor ? f.apoderado_documento.trim() : null,
          bien_tipo: f.bien_tipo, monto: f.monto.trim() ? Number(f.monto) : null, descripcion_bien: f.descripcion_bien.trim(),
          detalle: f.detalle.trim(), pedido: f.pedido.trim(),
          acepta: true,
        }),
      });
      let j: { success?: boolean; data?: Registro; error?: string; campo?: string } = {};
      try { j = await r.json(); } catch { /* sin cuerpo */ }
      if (!r.ok || !j.success || !j.data) {
        const msg = j.error || (r.status === 429 ? 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.' : 'No se pudo registrar. Intenta de nuevo en un momento.');
        if (j.campo) { setErrores({ [j.campo]: msg }); irA(SECCION_DE[j.campo] ?? 'sec-consumidor'); }
        else setErrorGeneral(msg);
        return;
      }
      setRegistro(j.data);
    } catch {
      setErrorGeneral('No hay conexión con la academia. Revisa tu internet y vuelve a intentarlo.');
    } finally {
      setEnviando(false);
    }
  };

  const encabezado = (
    <section className="pt-7 pb-5">
      <p className={`${cx.display} flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-[#FA7B21]`}>
        <BookOpen className="h-4 w-4" strokeWidth={2.25} /> Hoja de reclamación virtual
      </p>
      <h1 className={`${cx.h1} mt-2`}>Libro de Reclamaciones</h1>
      <div className={`${cx.card} mt-5 grid gap-x-6 gap-y-3 p-4 text-[14px] sm:grid-cols-2`}>
        <div>
          <p className={cx.textoApagado}>Proveedor</p>
          <p className="font-bold text-white">{proveedor.razon_social || proveedor.nombre}</p>
          {proveedor.razon_social && <p className={cx.textoSec}>{proveedor.nombre}</p>}
          {proveedor.ruc && <p className={cx.textoSec}>RUC {proveedor.ruc}</p>}
          <p className={cx.textoSec}>{proveedor.direccion}</p>
        </div>
        <div className="space-y-3">
          <div>
            <p className={cx.textoApagado}>Fecha</p>
            <p className="font-bold text-white">{registro ? fechaLarga(registro.fecha) : hoy}</p>
          </div>
          <div>
            <p className={cx.textoApagado}>Hoja N.°</p>
            <p className="font-bold text-white">{registro ? registro.numero : 'Se asigna al enviar'}</p>
          </div>
        </div>
      </div>
    </section>
  );

  if (registro) {
    return (
      <div className={cx.pagina}>
        <CabeceraJMA onVolver={() => navegar('home')} />
        <main className={`${cx.contenedor} pb-16`}>
          {encabezado}
          <section className={`${cx.card} ${cx.cardPad} text-center`}>
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-300" strokeWidth={1.75} />
            <p className={`${cx.textoSec} mt-4 text-[15px]`}>Registramos tu hoja de reclamación</p>
            <p className={`${cx.cifra} mt-2 text-[32px] leading-tight text-white sm:text-[40px]`}>{registro.numero}</p>
            <p className={`${cx.textoSec} mt-2 text-[15px]`}>
              {fechaLarga(registro.fecha)}, {registro.hora}
            </p>
            <div className={`${cx.divisor} my-6`} />
            <p className="text-[15px] text-white">
              Te responderemos a más tardar el <strong>{fechaLarga(registro.fecha_limite)}</strong>, al correo que indicaste.
            </p>
            <a href={registro.pdf} target="_blank" rel="noopener" className={`${cx.btnPrimario} mt-6 w-full sm:w-auto sm:inline-flex`}>
              <Download className="h-5 w-5" /> Descargar hoja (PDF)
            </a>
            <p className={`mt-5 ${registro.correo_enviado ? cx.avisoOk : cx.avisoAmbar} text-left`}>
              {registro.correo_enviado
                ? 'Te enviamos una copia de la hoja a tu correo.'
                : 'Guarda el PDF: es tu constancia. Si no te llega una copia por correo, la tienes ahí.'}
            </p>
          </section>
          <p className={`${cx.textoApagado} mt-6 text-[13px] leading-relaxed`}>
            La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className={cx.pagina}>
      <CabeceraJMA onVolver={() => navegar('home')} />
      <main className={`${cx.contenedor} space-y-5 pb-16`}>
        {encabezado}

        <Seccion id="sec-consumidor" numero={1} titulo="Identificación del consumidor reclamante">
          <div>
            <Campo id="rc-nombre" label="Nombre completo" autoComplete="name" value={f.nombre} onValor={(v) => set('nombre', v)} />
            <Error texto={errores.nombre} />
          </div>
          <div>
            <p className={cx.label}>Documento de identidad</p>
            <Chips<TipoDoc>
              etiqueta="Tipo de documento"
              opciones={[{ valor: 'DNI', etiqueta: 'DNI' }, { valor: 'CE', etiqueta: 'Carné de extranjería' }, { valor: 'Pasaporte', etiqueta: 'Pasaporte' }]}
              valor={f.tipo_documento}
              onCambio={(v) => set('tipo_documento', v)}
              columnas="grid-cols-3"
            />
            <input
              id="rc-documento"
              aria-label="Número de documento"
              inputMode={f.tipo_documento === 'DNI' ? 'numeric' : 'text'}
              maxLength={f.tipo_documento === 'DNI' ? 8 : 15}
              placeholder="Número"
              value={f.documento}
              onChange={(e) => set('documento', f.tipo_documento === 'DNI' ? e.target.value.replace(/\D/g, '') : e.target.value)}
              className={`${cx.input} mt-2`}
            />
            <Error texto={errores.documento} />
          </div>
          <div>
            <Campo id="rc-domicilio" label="Domicilio" autoComplete="street-address" value={f.domicilio} onValor={(v) => set('domicilio', v)} />
            <Error texto={errores.domicilio} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Campo id="rc-telefono" label="Teléfono (opcional)" type="tel" inputMode="tel" autoComplete="tel" value={f.telefono} onValor={(v) => set('telefono', v)} />
              <Error texto={errores.telefono} />
            </div>
            <div>
              <Campo id="rc-correo" label="Correo electrónico" type="email" inputMode="email" autoComplete="email" value={f.correo} onValor={(v) => set('correo', v)} />
              <Error texto={errores.correo} />
            </div>
          </div>
          <Casilla
            marcada={f.es_menor}
            onCambio={(v) => set('es_menor', v)}
            titulo="Soy menor de edad"
            detalle="Se registran también los datos de tu padre, madre o tutor."
          />
          {f.es_menor && (
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Campo id="rc-apoderado" label="Nombre del padre, madre o tutor" value={f.apoderado_nombre} onValor={(v) => set('apoderado_nombre', v)} />
                <Error texto={errores.apoderado_nombre} />
              </div>
              <div>
                <Campo id="rc-apoderado-doc" label="Su documento" inputMode="numeric" value={f.apoderado_documento} onValor={(v) => set('apoderado_documento', v)} />
                <Error texto={errores.apoderado_documento} />
              </div>
            </div>
          )}
        </Seccion>

        <Seccion id="sec-bien" numero={2} titulo="Identificación del bien contratado">
          <div>
            <p className={cx.label}>¿Es un producto o un servicio?</p>
            <Chips<BienTipo>
              etiqueta="Bien contratado"
              opciones={[
                { valor: 'servicio', etiqueta: 'Servicio', detalle: 'Clases, programas, eventos' },
                { valor: 'producto', etiqueta: 'Producto', detalle: 'Uniformes, implementos' },
              ]}
              valor={f.bien_tipo}
              onCambio={(v) => set('bien_tipo', v)}
              columnas="grid-cols-2"
            />
            <Error texto={errores.bien_tipo} />
          </div>
          <div>
            <label htmlFor="rc-monto" className={cx.label}>Monto reclamado (opcional)</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-white/50">S/</span>
              <input
                id="rc-monto"
                inputMode="decimal"
                placeholder="0.00"
                value={f.monto}
                onChange={(e) => set('monto', e.target.value.replace(/[^\d.]/g, ''))}
                className={`${cx.input} pl-11`}
              />
            </div>
            <Error texto={errores.monto} />
          </div>
          <Texto
            id="rc-descripcion"
            label="Descripción"
            ayuda="Qué contrataste o compraste: programa, fecha, alumno, artículo."
            valor={f.descripcion_bien}
            onValor={(v) => set('descripcion_bien', v)}
            error={errores.descripcion_bien}
            max={1000}
          />
        </Seccion>

        <Seccion id="sec-detalle" numero={3} titulo="Detalle de la reclamación">
          <div>
            <Chips<Tipo>
              etiqueta="Tipo"
              opciones={[
                { valor: 'reclamo', etiqueta: 'Reclamo', detalle: 'Sobre el producto o servicio' },
                { valor: 'queja', etiqueta: 'Queja', detalle: 'Sobre la atención' },
              ]}
              valor={f.tipo}
              onCambio={(v) => set('tipo', v)}
              columnas="grid-cols-2"
            />
            <Error texto={errores.tipo} />
            <dl className={`${cx.ayuda} mt-3 space-y-1.5 leading-relaxed`}>
              <div><dt className="inline font-bold text-white/75">Reclamo: </dt><dd className="inline">disconformidad relacionada a los productos o servicios.</dd></div>
              <div><dt className="inline font-bold text-white/75">Queja: </dt><dd className="inline">disconformidad no relacionada a los productos o servicios; o malestar o descontento respecto a la atención al público.</dd></div>
            </dl>
          </div>
          <Texto id="rc-detalle" label="Detalle" ayuda="Cuéntanos qué pasó, con fechas si las recuerdas." valor={f.detalle} onValor={(v) => set('detalle', v)} error={errores.detalle} />
          <Texto id="rc-pedido" label="Pedido" ayuda="Qué solicitas que haga la academia." valor={f.pedido} onValor={(v) => set('pedido', v)} error={errores.pedido} max={1000} />
        </Seccion>

        <section id="sec-envio" className={`${cx.card} ${cx.cardPad} space-y-4 scroll-mt-24`}>
          <Casilla
            marcada={f.acepta}
            onCambio={(v) => set('acepta', v)}
            titulo="Declaro que los datos son verdaderos."
            detalle="La academia responderá en un plazo máximo de 15 días hábiles al correo indicado."
          />
          <Error texto={errores.acepta} />
          <div className={`${cx.textoApagado} space-y-2 text-[13px] leading-relaxed`}>
            <p>La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.</p>
            <p>El proveedor deberá dar respuesta al reclamo en un plazo no mayor a quince (15) días hábiles.</p>
          </div>
          {errorGeneral && <p className={cx.avisoError}>{errorGeneral}</p>}
          <button type="button" onClick={enviar} disabled={enviando} className={`${cx.btnPrimario} w-full`}>
            {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {enviando ? 'Registrando…' : 'Enviar hoja de reclamación'}
          </button>
        </section>
      </main>
    </div>
  );
}
