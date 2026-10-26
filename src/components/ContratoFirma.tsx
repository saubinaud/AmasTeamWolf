import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle, ChevronDown, Pen, RotateCcw } from 'lucide-react';
import { cx } from './matricula/tokens';
import { Casilla } from './matricula/piezas';
import { PadFirma } from './PadFirma';
import { soles } from '../utils/catalogo';
import { clausulasCon, useTextoContrato } from '../hooks/useTextoContrato';

interface ContratoFirmaProps {
  datos: {
    nombrePadre: string;
    dniPadre: string;
    email: string;
    telefono?: string;
    direccion?: string;
    nombreAlumno: string;
    dniAlumno: string;
    fechaNacimiento?: string;
    categoriaAlumno?: string;
    programa: string;
    fechaInicio?: string;
    fechaFin?: string;
    clasesTotales?: number;
    turnoSeleccionado?: string;
    diasTentativos?: string;
    precioPrograma?: number;
    descuentoDinero?: number;
    /** Total cotizado por el servidor (0 es un total válido) */
    total?: number;
  };
  /** Firma en data URL, o '' si se borró (cambiaron los datos o se vuelve a firmar) */
  onFirmaCompleta: (firmaBase64: string) => void;
  /** Lo que eligió el apoderado sobre el uso promocional de imagen */
  onAutorizaImagen: (autoriza: boolean) => void;
}

/** '2026-10-25' → '25 oct. 2026'; cualquier otro texto se deja tal cual. */
const fechaCorta = (v?: string) => {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return v ?? '';
  return new Date(`${v}T12:00:00`).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
};

const unir = (...partes: (string | false | null | undefined)[]) => partes.filter(Boolean).join(' · ');

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className={`${cx.textoApagado} text-[12px] font-bold uppercase tracking-wider`}>{etiqueta}</p>
      <div className="mt-0.5 text-[15px] text-white">{children}</div>
    </div>
  );
}

/**
 * Contrato y firma de la matrícula y la renovación públicas: resumen primero,
 * el texto completo (el mismo del PDF, servido por el API) en un desplegable,
 * las dos casillas, el botón Firmar y la firma a pantalla completa. Si los
 * datos cambian después de firmar, la firma se borra.
 */
export function ContratoFirma({ datos, onFirmaCompleta, onAutorizaImagen }: ContratoFirmaProps) {
  const { texto, error, reintentar } = useTextoContrato();
  const [firma, setFirma] = useState<string | null>(null);
  const [aceptado, setAceptado] = useState(false);
  const [autorizaImagen, setAutorizaImagen] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [firmando, setFirmando] = useState(false);
  const [invalidada, setInvalidada] = useState(false);

  const huella = JSON.stringify(datos);
  const huellaFirmada = useRef<string | null>(null);
  useEffect(() => {
    if (firma && huellaFirmada.current !== null && huellaFirmada.current !== huella) {
      setFirma(null);
      huellaFirmada.current = null;
      setInvalidada(true);
      onFirmaCompleta('');
    }
  }, [huella, firma, onFirmaCompleta]);

  useEffect(() => { onAutorizaImagen(autorizaImagen); }, [autorizaImagen, onAutorizaImagen]);

  const listo = (base64: string) => {
    setFirmando(false);
    setFirma(base64);
    huellaFirmada.current = huella;
    setInvalidada(false);
    onFirmaCompleta(base64);
  };
  const volverAFirmar = () => {
    setFirma(null);
    huellaFirmada.current = null;
    onFirmaCompleta('');
    setFirmando(true);
  };

  const d = datos;
  const hoy = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Lima' });
  const clausulas = texto ? clausulasCon(texto, autorizaImagen) : [];
  const total = Number.isFinite(Number(d.total)) ? Number(d.total) : null;
  const fuerte = (v?: string) => <strong className="text-white">{v || '___'}</strong>;

  return (
    <div className="space-y-4">
      {/* 1. Lo que se firma */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className={`${cx.textoApagado} mb-3 text-[13px]`}>Contrato de inscripción · Lima, {hoy}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Dato etiqueta="Apoderado">
            <span className="font-bold">{d.nombrePadre || '___'}</span>
            <span className={`${cx.textoApagado} block text-[13px]`}>{unir(d.dniPadre && `DNI ${d.dniPadre}`, d.telefono)}</span>
          </Dato>
          <Dato etiqueta="Alumno">
            <span className="font-bold">{d.nombreAlumno || '___'}</span>
            <span className={`${cx.textoApagado} block text-[13px]`}>{unir(d.dniAlumno && `DNI ${d.dniAlumno}`, d.categoriaAlumno)}</span>
          </Dato>
          <Dato etiqueta="Programa">
            <span className="font-bold">{d.programa || '___'}</span>
            <span className={`${cx.textoApagado} block text-[13px]`}>
              {unir(
                d.fechaInicio && d.fechaFin ? `${fechaCorta(d.fechaInicio)} al ${fechaCorta(d.fechaFin)}` : d.fechaInicio && `Desde el ${fechaCorta(d.fechaInicio)}`,
                d.turnoSeleccionado && `Turno ${d.turnoSeleccionado.toLowerCase()}`,
                d.clasesTotales ? `${d.clasesTotales} clases` : null,
              )}
            </span>
          </Dato>
          <Dato etiqueta="Total">
            <span className={`${cx.cifra} text-[20px]`}>{total != null ? soles(total) : 'Calculando'}</span>
            {!!d.descuentoDinero && d.descuentoDinero > 0 && (
              <span className="block text-[13px] text-emerald-300">Incluye {soles(d.descuentoDinero)} de descuento</span>
            )}
          </Dato>
        </div>
      </div>

      {/* 2. Lo esencial y el contrato completo */}
      {texto && (
        <ul className="space-y-2.5">
          {texto.resumen.map((r) => (
            <li key={r.clausula} className={`${cx.textoSec} flex gap-2.5 text-[15px] leading-relaxed`}>
              <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#F47B20]" />
              <span>{r.texto} <span className={`${cx.textoApagado} whitespace-nowrap text-[12px]`}>Cláusula {r.clausula}</span></span>
            </li>
          ))}
        </ul>
      )}
      {error && !texto && (
        <div className={`${cx.avisoError} flex items-center justify-between gap-3`}>
          <span>No se pudo cargar el contrato.</span>
          <button type="button" onClick={reintentar} className={cx.btnTexto}><RotateCcw className="mr-1 inline h-4 w-4" />Reintentar</button>
        </div>
      )}
      <div className="rounded-xl border border-white/10">
        <button
          type="button"
          onClick={() => setAbierto((a) => !a)}
          aria-expanded={abierto}
          disabled={!texto}
          className="flex min-h-[52px] w-full items-center justify-between gap-3 px-4 text-left"
        >
          <span className="text-[15px] font-bold text-white">Leer el contrato completo</span>
          <span className={`${cx.textoApagado} flex shrink-0 items-center gap-2 whitespace-nowrap text-[13px]`}>
            {texto ? `${clausulas.length} cláusulas` : 'Cargando'}
            <ChevronDown className={`h-4 w-4 transition-transform duration-150 ${abierto ? 'rotate-180' : ''}`} />
          </span>
        </button>
        {abierto && texto && (
          <div className={`${cx.divisor} max-h-[60vh] overflow-y-auto overscroll-contain px-4 py-4`}>
            <div className="max-w-prose space-y-3">
              {clausulas.map((c) => (
                <p key={c.numero} className="text-[15px] leading-relaxed text-white/75">
                  <span className="font-bold text-white">{c.numero}. {c.titulo}.</span> {c.texto}
                </p>
              ))}
              <p className={`${cx.textoApagado} pt-1 text-[12px]`}>Versión {texto.version}. Es el mismo texto que recibirás en el PDF.</p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Declaración y casillas */}
      <p className={`${cx.textoSec} max-w-prose text-[15px] leading-relaxed`}>
        Yo, {fuerte(d.nombrePadre)}, con DNI {fuerte(d.dniPadre)}, declaro haber leído, comprendido y aceptado todas las
        condiciones del presente contrato, incluyendo expresamente la <strong className="text-[#F47B20]">cláusula 4 (cancelaciones
        y devoluciones)</strong>, para la inscripción de {fuerte(d.nombreAlumno)} en el programa {fuerte(d.programa)} de JMA Team Wolf.
      </p>
      <div className={`space-y-2 ${firma ? 'pointer-events-none opacity-60' : ''}`}>
        <Casilla
          marcada={autorizaImagen}
          onCambio={setAutorizaImagen}
          titulo="Autorizo el uso de fotos y videos del alumno en material promocional"
          detalle="Opcional. Sin marcar, solo se usan para comunicación institucional."
        />
        <Casilla marcada={aceptado} onCambio={setAceptado} titulo="He leído y acepto los términos y condiciones del contrato" />
      </div>

      {/* 4. Firma */}
      {firma ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3">
          <div className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
            <img src={firma} alt="Tu firma" className="max-h-full max-w-full object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[15px] font-bold text-emerald-200"><CheckCircle className="h-4 w-4" /> Firmado</p>
            <p className={`${cx.textoApagado} text-[13px]`}>Al enviar, el PDF llega a tu correo.</p>
          </div>
          <button type="button" onClick={volverAFirmar} className={`${cx.btnSecundario} shrink-0 px-3`}>Volver a firmar</button>
        </div>
      ) : (
        <div className="space-y-2">
          {invalidada && (
            <p className={`${cx.avisoAmbar} flex items-start gap-2`}>
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Cambiaron los datos del contrato: firma de nuevo.
            </p>
          )}
          <button type="button" disabled={!aceptado || !texto} onClick={() => setFirmando(true)} className={`${cx.btnPrimario} w-full`}>
            <Pen className="h-5 w-5" /> Firmar contrato
          </button>
          {!aceptado && <p className={`${cx.textoApagado} text-center text-[13px]`}>Marca que aceptas los términos para firmar</p>}
        </div>
      )}

      {firmando && <PadFirma nombre={d.nombrePadre} onCerrar={() => setFirmando(false)} onListo={listo} />}
    </div>
  );
}
