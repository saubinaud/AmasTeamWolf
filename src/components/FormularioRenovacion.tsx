// Renovación pública (/renovacion). Los planes y sus precios salen del
// catálogo (programas con en_renovacion, más los que desbloquea un código como
// RENOVAR1MES); el total lo devuelve POST /api/config/cotizar y al enviar el
// servidor vuelve a cotizar las mismas líneas.
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { API_BASE } from '../config/api';
import { useCatalogoPublico, useCotizacion } from '../hooks/useCatalogoPublico';
import { ContratoFirma } from './ContratoFirma';
import { cx } from './matricula/tokens';
import { CabeceraJMA, Portada, Seccion, Campo, CampoFechaNacimiento, SelectorPolos, Exito, irA } from './matricula/piezas';
import { CampoCodigo, ResumenCotizacion, BarraTotal, EspacioBarra } from './matricula/Resumen';
import { SeccionFechas, useFechasPrograma } from './matricula/SeccionFechas';
import {
  lineasMatricula, piezasRopa, programasOfrecidos, itemPolos, soles,
  type CantidadPolos, type ItemCatalogo, type PedidoCotizacion,
} from '../utils/catalogo';

/** Lo que trae cada plan (texto de marketing; precio y clases vienen del catálogo). */
const BENEFICIOS: Record<string, { subtitulo: string; beneficios: string[]; destacado?: string }> = {
  '1mes': {
    subtitulo: 'Desbloqueado con tu código',
    beneficios: ['Clases 2 veces por semana', 'Clases recuperables', 'Flexibilidad de horarios'],
  },
  full: {
    subtitulo: '2 veces por semana',
    beneficios: ['Clases recuperables', '1 congelamiento por inasistencia o viaje', 'Cartilla de deberes y seguimiento', '1 graduación con nuevo cinturón', '2 certificados del nuevo rango'],
  },
  '6meses': {
    subtitulo: '2 veces por semana',
    destacado: 'Más elegido',
    beneficios: ['Clases recuperables', '1 congelamiento por inasistencia o viaje', 'Cartilla de deberes y seguimiento', '2 graduaciones con nuevo cinturón', '2 certificados del nuevo rango', '15 días de membresía adicionales', '1 implemento de regalo'],
  },
  '12meses_sin': {
    subtitulo: 'Un año completo',
    beneficios: ['Clases recuperables', '1 congelamiento por inasistencia o viaje', 'Cartilla de deberes y seguimiento', '4 graduaciones con nuevo cinturón', '4 certificados del nuevo rango'],
  },
  '12meses_con': {
    subtitulo: 'Programa élite',
    destacado: 'Todo incluido',
    beneficios: ['Un año completo de clases', '4 graduaciones con ceremonia', 'Guantes, zapatos, bo staff, combat weapon y nunchaku', 'Acceso indefinido a Leadership', '15 días de regalo'],
  },
};

interface FormularioRenovacionProps {
  onVolver: () => void;
  onSuccess: (total: number) => void;
}

const PERSONAS = { nombreAlumno: '', dniAlumno: '', fechaNacimiento: '', nombrePadre: '', dniPadre: '', email: '', direccion: '' };
const soloDigitos = (v: string, max: number) => v.replace(/\D/g, '').slice(0, max);

function TarjetaPlan({ plan, onElegir }: { plan: ItemCatalogo; onElegir: () => void }) {
  const info = BENEFICIOS[plan.codigo ?? ''] ?? { subtitulo: '', beneficios: [] };
  const resaltado = !!info.destacado;
  return (
    <div className={`${cx.card} relative flex flex-col p-5 ${resaltado ? 'border-[#F47B20]' : ''}`}>
      {info.destacado && (
        <span className={`${cx.display} absolute -top-3 left-5 rounded-full bg-[#F47B20] px-3 py-1 text-[11px] uppercase tracking-wider text-[#231F20]`}>
          {info.destacado}
        </span>
      )}
      <p className={`${cx.display} text-[20px] text-white`}>{plan.nombre}</p>
      <p className={`${cx.textoApagado} mt-1 text-[14px]`}>{[plan.clases ? `${plan.clases} clases` : null, info.subtitulo].filter(Boolean).join(' · ')}</p>
      <p className={`${cx.cifra} mt-4 text-[30px] text-white`}>{soles(plan.precio)}</p>
      {info.beneficios.length > 0 && (
        <ul className="mt-4 space-y-2">
          {info.beneficios.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-[14px] text-white/75">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#F47B20]" />
              {b}
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={onElegir} className={`${resaltado ? cx.btnPrimario : cx.btnSecundario} mt-5 w-full`}>
        Renovar con este plan
      </button>
    </div>
  );
}

export function FormularioRenovacion({ onVolver, onSuccess }: FormularioRenovacionProps) {
  const { items, estado } = useCatalogoPublico();
  const respaldo = estado === 'respaldo';

  const [codigoPlan, setCodigoPlan] = useState<string | null>(null);
  const [p, setP] = useState(PERSONAS);
  const [polos, setPolos] = useState<CantidadPolos>('0');
  const [tallasPolos, setTallasPolos] = useState<string[]>([]);
  const [codigo, setCodigo] = useState('');
  const [firma, setFirma] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [registrado, setRegistrado] = useState<number | null>(null);

  useEffect(() => { window.scrollTo(0, 0); }, [codigoPlan]);

  const ropa = useMemo(() => piezasRopa(items), [items]);
  const programa = useMemo(() => items.find((i) => i.tipo === 'programa' && i.codigo === codigoPlan) ?? null, [items, codigoPlan]);

  // Sin plan elegido se cotiza solo el código (para saber si desbloquea un plan)
  const pedido = useMemo<PedidoCotizacion | null>(() => {
    if (respaldo) return null;
    if (!programa) return codigo ? { lineas: [], codigo } : null;
    return { lineas: lineasMatricula(programa, polos, false, ropa), codigo: codigo || undefined };
  }, [respaldo, programa, polos, ropa, codigo]);
  const { cotizacion, alDia, cargando, error } = useCotizacion(pedido);

  const desbloqueados = alDia ? cotizacion?.desbloquea ?? [] : [];
  const planes = useMemo(() => {
    const ofrecidos = programasOfrecidos(items, 'en_renovacion');
    const extra = programasOfrecidos(items, 'en_renovacion', desbloqueados).filter((x) => !ofrecidos.includes(x));
    return [...ofrecidos, ...extra];
  }, [items, desbloqueados]);

  const clasesBase = programa?.clases ?? 0;
  const clasesTotales = clasesBase + (alDia ? cotizacion?.clases_extra ?? 0 : 0);
  const fechas = useFechasPrograma(p.fechaNacimiento, clasesTotales);
  const promoAplicada = alDia && cotizacion?.promocion.aplicada ? cotizacion.promocion.codigo : null;
  const cambiar = (campo: keyof typeof PERSONAS, valor: string) => setP((x) => ({ ...x, [campo]: valor }));
  const cambiarPolos = (c: CantidadPolos) => { setPolos(c); setTallasPolos(new Array(Number(c)).fill('')); };

  const enviar = async () => {
    const falta = (msg: string, seccion: string) => { toast.error(msg); irA(seccion); };
    if (!p.nombreAlumno.trim() || p.dniAlumno.length < 8 || !p.fechaNacimiento) return falta('Completa los datos del alumno (nombre, DNI y fecha de nacimiento)', 'sec-alumno');
    if (!p.nombrePadre.trim() || p.dniPadre.length < 8 || !/\S+@\S+\.\S+/.test(p.email)) return falta('Completa los datos del apoderado (nombre, DNI y correo)', 'sec-apoderado');
    if (!fechas.completo) return falta('Elige la fecha de inicio y al menos un día de clase', 'sec-fechas');
    if (tallasPolos.some((t) => !t)) return falta('Elige la talla de cada polo', 'sec-polos');
    if (!cotizacion || !alDia) return toast.error('Espera a que se calcule el total');
    if (!cotizacion.ok) return toast.error(cotizacion.errores[0] ?? 'No se pudo calcular el total');
    if (!firma) return falta('Firma el contrato para terminar', 'sec-contrato');
    if (!programa || !pedido) return;

    const h = fechas.horarios;
    const manana = fechas.turno === 'manana';
    const lineaDe = (id: number | undefined) => cotizacion.lineas.find((l) => l.item_id === id);
    const payload = {
      tipoFormulario: 'Renovación',
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
        diasSemana: manana ? 'Martes, Jueves y Sábado' : h.diasSemana,
      } : null,
      tallasPolos,
      nombrePadre: p.nombrePadre.trim(),
      dniPadre: p.dniPadre,
      direccion: p.direccion.trim(),
      email: p.email.trim(),
      polos: polos === '0' ? 'No' : `${polos} polo(s)`,
      fechaInicio: fechas.fechaInicio,
      diasTentativos: fechas.sinDefinir ? 'Aún no especificado' : fechas.dias.join(', '),
      fechaFin: fechas.sinDefinir ? 'Por calcular' : fechas.fin?.fechaFin ?? '',
      semanasAproximadas: fechas.fin?.semanas ?? 0,

      // Informativo; el servidor lo reemplaza por su cotización
      precioPrograma: lineaDe(programa.id)?.precio_unitario ?? programa.precio,
      precioPolos: lineaDe(itemPolos(polos, ropa)?.id)?.subtotal ?? 0,
      descuentoDinero: cotizacion.descuento,
      subtotal: cotizacion.subtotal,
      total: cotizacion.total,

      contratoFirmado: firma,
      fechaRegistro: new Date().toISOString(),
    };

    setEnviando(true);
    try {
      const r = await fetch(`${API_BASE}/renovacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      if (r.status === 404) throw new Error('No encontramos un alumno con ese DNI. Revisa el número o escríbenos por WhatsApp');
      if (!r.ok || j.success === false) throw new Error(j.error || `Error ${r.status}`);
      const total = Number(j.total ?? cotizacion.total);
      setRegistrado(total);
      window.scrollTo(0, 0);
      onSuccess(total);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  if (registrado != null) {
    return (
      <div className={cx.pagina}>
        <CabeceraJMA onVolver={onVolver} />
        <Exito
          titulo="¡Renovación registrada!"
          texto={`Gracias por seguir con nosotros. Te enviamos los detalles a ${p.email || 'tu correo'}.`}
          total={registrado}
          onPagar={() => onSuccess(registrado)}
          onInicio={onVolver}
        />
      </div>
    );
  }

  // ── Paso 1: elegir plan ──
  if (!programa) {
    return (
      <div className={cx.pagina}>
        <CabeceraJMA onVolver={onVolver} />
        <main className={`${cx.contenedor} pb-16`}>
          <Portada
            etiqueta="Renovación"
            titulo="Que su camino de guerrero no se detenga"
            bajada="Elige el plan con el que tu hijo sigue entrenando. Todos son 2 veces por semana."
            respaldo={respaldo}
          />
          {estado === 'cargando' ? (
            <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-white/5" />)}</div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {planes.map((plan) => <TarjetaPlan key={plan.id} plan={plan} onElegir={() => setCodigoPlan(plan.codigo)} />)}
            </div>
          )}
          {!respaldo && (
            <div className={`${cx.card} ${cx.cardPad} mt-6`}>
              <CampoCodigo aplicado={codigo} onAplicar={setCodigo} onQuitar={() => setCodigo('')} cotizacion={cotizacion} alDia={alDia} />
              {desbloqueados.length > 0 && <p className={`${cx.ayuda} mt-3`}>Se agregó un plan más a la lista.</p>}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ── Paso 2: datos, fechas, resumen y contrato ──
  return (
    <div className={cx.pagina}>
      <CabeceraJMA onVolver={() => setCodigoPlan(null)} textoVolver="Planes" />
      <main className={cx.contenedor}>
        <Portada etiqueta="Renovación" titulo={programa.nombre} precio={programa.precio} notaPrecio={programa.clases ? `${programa.clases} clases` : undefined} />

        <div className="space-y-4">
          <Seccion id="sec-alumno" titulo="Alumno">
            <Campo id="nombreAlumno" label="Nombre completo" autoComplete="off" value={p.nombreAlumno} onValor={(v) => cambiar('nombreAlumno', v)} />
            <Campo id="dniAlumno" label="DNI" inputMode="numeric" placeholder="8 dígitos" value={p.dniAlumno} onValor={(v) => cambiar('dniAlumno', soloDigitos(v, 8))} ayuda="El mismo con el que está inscrito." />
            <CampoFechaNacimiento id="fechaNacimiento" valor={p.fechaNacimiento} onCambio={(v) => cambiar('fechaNacimiento', v)} />
          </Seccion>

          <Seccion id="sec-apoderado" titulo="Madre, padre o apoderado">
            <Campo id="nombrePadre" label="Nombre completo" autoComplete="name" value={p.nombrePadre} onValor={(v) => cambiar('nombrePadre', v)} />
            <Campo id="dniPadre" label="DNI" inputMode="numeric" placeholder="8 dígitos" value={p.dniPadre} onValor={(v) => cambiar('dniPadre', soloDigitos(v, 8))} />
            <Campo id="email" label="Correo" type="email" inputMode="email" autoComplete="email" value={p.email} onValor={(v) => cambiar('email', v)} />
            <Campo id="direccion" label="Dirección (opcional)" autoComplete="street-address" value={p.direccion} onValor={(v) => cambiar('direccion', v)} />
          </Seccion>

          <Seccion id="sec-fechas" titulo="Horario y fechas">
            <SeccionFechas f={fechas} hayNacimiento={!!p.fechaNacimiento} />
          </Seccion>

          <Seccion id="sec-polos" titulo="Polos (opcional)">
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
                direccion: p.direccion,
                nombreAlumno: p.nombreAlumno,
                dniAlumno: p.dniAlumno,
                fechaNacimiento: p.fechaNacimiento,
                categoriaAlumno: fechas.categoria,
                programa: programa.nombre,
                fechaInicio: fechas.fechaInicio,
                fechaFin: fechas.fin?.fechaFin ?? '',
                clasesTotales: fechas.fin?.clasesTotales ?? clasesTotales,
                turnoSeleccionado: fechas.turno === 'manana' ? 'Mañana' : 'Tarde',
                diasTentativos: fechas.dias.join(', '),
                precioPrograma: programa.precio,
                descuentoDinero: cotizacion?.descuento ?? 0,
                total: cotizacion?.total ?? 0,
              }}
              onFirmaCompleta={setFirma}
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
        texto={firma ? 'Enviar renovación' : 'Continuar'}
        deshabilitado={respaldo}
      />
    </div>
  );
}
