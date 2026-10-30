// Matrícula pública (/registro-3-meses, /registro-6-meses, /registro-mensual).
// Programa, polos y uniforme salen del catálogo del API; el total lo devuelve
// POST /api/config/cotizar y al enviar el servidor vuelve a cotizar las mismas
// líneas (lo que manda el navegador como precio no se guarda).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUmami } from '../hooks/useUmami';
import { API_BASE } from '../config/api';
import { useCatalogoPublico, useCotizacion } from '../hooks/useCatalogoPublico';
import { ContratoFirma } from './ContratoFirma';
import { cx } from './matricula/tokens';
import {
  CabeceraJMA, Portada, Seccion, Campo, CampoFechaNacimiento, SelectorTalla, SelectorPolos, Casilla, Exito, irA,
} from './matricula/piezas';
import { CampoCodigo, ResumenCotizacion, BarraTotal, EspacioBarra } from './matricula/Resumen';
import { SeccionFechas, useFechasPrograma } from './matricula/SeccionFechas';
import {
  lineasMatricula, piezasRopa, programaPorCodigo, itemPolos, soles,
  type CantidadPolos, type PedidoCotizacion,
} from '../utils/catalogo';

export interface PortadaPrograma {
  etiqueta: string;
  titulo: string;
  bajada: string;
  incluye: string[];
  notaPrecio?: string;
}

interface FormularioMatriculaProps {
  /** Código del programa en el catálogo */
  programa: 'full' | '1mes' | '6meses';
  portada: PortadaPrograma;
  onVolver: () => void;
  onSuccess: (total: number) => void;
}

const PERSONAS = {
  nombreAlumno: '', dniAlumno: '', fechaNacimiento: '',
  nombrePadre: '', dniPadre: '', telefono: '', email: '', direccion: '',
};

const soloDigitos = (v: string, max: number) => v.replace(/\D/g, '').slice(0, max);

export function FormularioMatricula({ programa: codigoPrograma, portada, onVolver, onSuccess }: FormularioMatriculaProps) {
  const { trackFormSubmit } = useUmami();
  const { items, estado } = useCatalogoPublico();
  const respaldo = estado === 'respaldo';

  const [p, setP] = useState(PERSONAS);
  const [tallaUniforme, setTallaUniforme] = useState('');
  const [conUniforme, setConUniforme] = useState(false);
  const [polos, setPolos] = useState<CantidadPolos>('0');
  const [tallasPolos, setTallasPolos] = useState<string[]>([]);
  const [codigo, setCodigo] = useState('');
  const [firma, setFirma] = useState<string | null>(null);
  const [autorizaImagen, setAutorizaImagen] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [registrado, setRegistrado] = useState<number | null>(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // ── Catálogo ──
  const programa = useMemo(() => programaPorCodigo(items, codigoPrograma), [items, codigoPrograma]);
  const ropa = useMemo(() => piezasRopa(items), [items]);
  const sinUniforme = !!programa?.sin_uniforme;

  // ── Cotización (la hace el servidor) ──
  const pedido = useMemo<PedidoCotizacion | null>(() => {
    if (!programa || respaldo) return null;
    return { lineas: lineasMatricula(programa, polos, conUniforme, ropa), codigo: codigo || undefined };
  }, [programa, respaldo, polos, conUniforme, ropa, codigo]);
  const { cotizacion, alDia, cargando, error } = useCotizacion(pedido);

  const clasesBase = programa?.clases ?? 0;
  const clasesTotales = clasesBase + (alDia ? cotizacion?.clases_extra ?? 0 : 0);
  const fechas = useFechasPrograma(p.fechaNacimiento, clasesTotales, programa?.codigo, clasesTotales - clasesBase);

  const regaloUniforme = !!cotizacion?.regalos.some((g) => g.categoria === 'uniforme');
  const pideTallaUniforme = !sinUniforme || conUniforme || regaloUniforme;
  const promoAplicada = alDia && cotizacion?.promocion.aplicada ? cotizacion.promocion.codigo : null;
  const lineaDe = (id: number | undefined) => cotizacion?.lineas.find((l) => l.item_id === id);

  const cambiar = useCallback((campo: keyof typeof PERSONAS, valor: string) => setP((x) => ({ ...x, [campo]: valor })), []);
  const cambiarPolos = (c: CantidadPolos) => { setPolos(c); setTallasPolos(new Array(Number(c)).fill('')); };

  // ── Enviar ──
  const enviar = async () => {
    const falta = (msg: string, seccion: string) => { toast.error(msg); irA(seccion); };
    if (!p.nombreAlumno.trim() || p.dniAlumno.length < 8 || !p.fechaNacimiento) return falta('Completa los datos del alumno (nombre, DNI de 8 dígitos y fecha de nacimiento)', 'sec-alumno');
    if (!p.nombrePadre.trim() || p.dniPadre.length < 8 || p.telefono.length < 9 || !/\S+@\S+\.\S+/.test(p.email)) return falta('Completa los datos del apoderado (nombre, DNI, celular y correo)', 'sec-apoderado');
    if (!fechas.completo) return falta('Elige la fecha de inicio y al menos un día de clase', 'sec-fechas');
    if (pideTallaUniforme && !tallaUniforme) return falta('Elige la talla del uniforme', 'sec-uniforme');
    if (tallasPolos.some((t) => !t)) return falta('Elige la talla de cada polo', 'sec-uniforme');
    if (!cotizacion || !alDia) return toast.error('Espera a que se calcule el total');
    if (!cotizacion.ok) return toast.error(cotizacion.errores[0] ?? 'No se pudo calcular el total');
    if (!firma) return falta('Firma el contrato para terminar', 'sec-contrato');
    if (!programa || !pedido) return;

    const h = fechas.horarios;
    const manana = fechas.turno === 'manana';
    const payload = {
      // Lo que se cotizó: el servidor vuelve a cotizar exactamente esto
      programaCodigo: programa.codigo,
      lineas: pedido.lineas,
      codigoPromocional: promoAplicada ?? 'No aplicado',

      programa: programa.nombre,
      clasesTotales: fechas.fin?.clasesTotales ?? clasesTotales,
      nombreAlumno: p.nombreAlumno.trim(),
      dniAlumno: p.dniAlumno,
      fechaNacimiento: p.fechaNacimiento,
      categoriaAlumno: fechas.categoria || 'No especificada',
      turnoSeleccionado: manana ? 'Mañana' : 'Tarde',
      horariosDisponibles: h ? {
        horarioSemana: manana ? h.horarioManana : h.horarioSemana,
        horarioSabado: h.horarioSabado,
        horarioManana: h.horarioManana,
        horarioTarde: h.horarioSemana,
        diasSemana: manana ? h.diasManana : h.diasSemana,
      } : null,
      tallaUniforme: pideTallaUniforme ? tallaUniforme : 'No aplica',
      tallasPolos,
      nombrePadre: p.nombrePadre.trim(),
      dniPadre: p.dniPadre,
      telefono: p.telefono,
      direccion: p.direccion.trim(),
      email: p.email.trim(),
      polos: polos === '0' ? 'No' : `${polos} polo(s)`,
      uniformeAdicional: sinUniforme ? (conUniforme || regaloUniforme ? 'Sí' : 'No') : 'Incluido',
      fechaInicio: fechas.fin?.fechaInicio ?? fechas.fechaInicio,
      diasTentativos: fechas.sinDefinir ? 'Aún no especificado' : fechas.dias.join(', '),
      fechaFin: fechas.sinDefinir ? '' : fechas.fin?.fechaFin ?? '',
      semanasAproximadas: fechas.fin?.semanas ?? 0,

      // Informativo (correo y contrato); el servidor lo reemplaza por su cotización
      precioPrograma: lineaDe(programa.id)?.precio_unitario ?? programa.precio,
      precioPolos: lineaDe(itemPolos(polos, ropa)?.id)?.subtotal ?? 0,
      precioUniforme: conUniforme ? lineaDe(ropa.uniforme?.id)?.subtotal ?? 0 : 0,
      descuentoDinero: cotizacion.descuento,
      subtotal: cotizacion.subtotal,
      total: cotizacion.total,

      contratoFirmado: firma,
      autorizaImagen,
      fechaRegistro: new Date().toISOString(),
    };

    setEnviando(true);
    try {
      const r = await fetch(`${API_BASE}/matricula`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.success === false) throw new Error(j.error || `Error ${r.status}`);
      const total = Number(j.total ?? cotizacion.total);
      trackFormSubmit(`Formulario Matrícula ${programa.nombre}`, total);
      setRegistrado(total);
      window.scrollTo(0, 0);
      onSuccess(total);
    } catch (e) {
      toast.error(`No se pudo enviar: ${(e as Error).message}. Inténtalo de nuevo.`);
    } finally {
      setEnviando(false);
    }
  };

  if (registrado != null) {
    return (
      <div className={cx.pagina}>
        <CabeceraJMA onVolver={onVolver} />
        <Exito
          titulo="¡Matrícula registrada!"
          texto={`Te enviamos el contrato y los detalles a ${p.email || 'tu correo'}. Para reservar el cupo, realiza el pago.`}
          total={registrado}
          onPagar={() => onSuccess(registrado)}
          onInicio={onVolver}
        />
      </div>
    );
  }

  return (
    <div className={cx.pagina}>
      <CabeceraJMA onVolver={onVolver} />
      <main className={cx.contenedor}>
        <Portada
          etiqueta={portada.etiqueta}
          titulo={portada.titulo}
          bajada={portada.bajada}
          precio={programa?.precio}
          notaPrecio={portada.notaPrecio}
          incluye={programa?.clases ? [`${programa.clases} clases`, ...portada.incluye] : portada.incluye}
          respaldo={respaldo}
        />

        <div className="space-y-4">
          <Seccion id="sec-alumno" titulo="Alumno">
            <Campo id="nombreAlumno" label="Nombre completo" autoComplete="off" value={p.nombreAlumno} onValor={(v) => cambiar('nombreAlumno', v)} />
            <Campo id="dniAlumno" label="DNI" inputMode="numeric" value={p.dniAlumno} onValor={(v) => cambiar('dniAlumno', soloDigitos(v, 8))} placeholder="8 dígitos" />
            <CampoFechaNacimiento id="fechaNacimiento" valor={p.fechaNacimiento} onCambio={(v) => cambiar('fechaNacimiento', v)} />
          </Seccion>

          <Seccion id="sec-apoderado" titulo="Madre, padre o apoderado" descripcion="A este correo llegan el contrato y los avisos.">
            <Campo id="nombrePadre" label="Nombre completo" autoComplete="name" value={p.nombrePadre} onValor={(v) => cambiar('nombrePadre', v)} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Campo id="dniPadre" label="DNI" inputMode="numeric" value={p.dniPadre} onValor={(v) => cambiar('dniPadre', soloDigitos(v, 8))} placeholder="8 dígitos" />
              <Campo id="telefono" label="Celular (WhatsApp)" type="tel" inputMode="tel" autoComplete="tel" value={p.telefono} onValor={(v) => cambiar('telefono', soloDigitos(v, 9))} placeholder="9 dígitos" />
            </div>
            <Campo id="email" label="Correo" type="email" inputMode="email" autoComplete="email" value={p.email} onValor={(v) => cambiar('email', v)} />
            <Campo id="direccion" label="Dirección (opcional)" autoComplete="street-address" value={p.direccion} onValor={(v) => cambiar('direccion', v)} />
          </Seccion>

          <Seccion id="sec-fechas" titulo="Horario y fechas">
            <SeccionFechas f={fechas} hayNacimiento={!!p.fechaNacimiento} />
          </Seccion>

          <Seccion id="sec-uniforme" titulo={sinUniforme ? 'Uniforme y polos' : 'Talla de uniforme y polos'} descripcion={sinUniforme ? undefined : 'El uniforme está incluido en el programa.'}>
            {sinUniforme && ropa.uniforme && (
              <Casilla
                marcada={conUniforme}
                onCambio={setConUniforme}
                titulo="Agregar uniforme completo"
                detalle="El programa mensual no lo incluye."
                derecha={`+ ${soles(ropa.uniforme.precio)}`}
              />
            )}
            {sinUniforme && regaloUniforme && !conUniforme && <p className={cx.avisoOk}>Tu código incluye el uniforme de regalo.</p>}
            {pideTallaUniforme && <SelectorTalla titulo="Talla del uniforme" valor={tallaUniforme} onCambio={setTallaUniforme} />}
            <SelectorPolos ropa={ropa} cantidad={polos} onCantidad={cambiarPolos} tallas={tallasPolos} onTalla={(i, t) => setTallasPolos((prev) => prev.map((x, j) => (j === i ? t : x)))} />
          </Seccion>

          <Seccion id="sec-resumen" titulo="Resumen">
            <ResumenCotizacion cotizacion={cotizacion} alDia={alDia} error={error} respaldo={respaldo} clasesBase={clasesBase} />
            {!respaldo && <CampoCodigo aplicado={codigo} onAplicar={setCodigo} onQuitar={() => setCodigo('')} cotizacion={cotizacion} alDia={alDia} />}
          </Seccion>

          <Seccion id="sec-contrato" titulo="Contrato">
            <ContratoFirma
              datos={{
                nombrePadre: p.nombrePadre,
                dniPadre: p.dniPadre,
                email: p.email,
                telefono: p.telefono,
                direccion: p.direccion,
                nombreAlumno: p.nombreAlumno,
                dniAlumno: p.dniAlumno,
                fechaNacimiento: p.fechaNacimiento,
                categoriaAlumno: fechas.categoria,
                programa: programa?.nombre ?? '',
                fechaInicio: fechas.fin?.fechaInicio ?? fechas.fechaInicio,
                fechaFin: fechas.fin?.fechaFin ?? '',
                clasesTotales: fechas.fin?.clasesTotales ?? clasesTotales,
                turnoSeleccionado: fechas.turno === 'manana' ? 'Mañana' : 'Tarde',
                diasTentativos: fechas.dias.join(', '),
                precioPrograma: programa?.precio,
                descuentoDinero: cotizacion?.descuento ?? 0,
                total: cotizacion?.total ?? 0,
              }}
              onFirmaCompleta={setFirma}
              onAutorizaImagen={setAutorizaImagen}
            />
          </Seccion>
        </div>
        <EspacioBarra />
      </main>

      <BarraTotal
        total={cotizacion?.total ?? null}
        calculando={cargando}
        enviando={enviando}
        onEnviar={enviar}
        texto={firma ? 'Enviar matrícula' : 'Continuar'}
        deshabilitado={respaldo || estado === 'cargando'}
      />
    </div>
  );
}
