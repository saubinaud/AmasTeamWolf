// Renovación pública (/renovacion). Los planes y sus precios salen del
// catálogo (programas con en_renovacion, más los que desbloquea un código como
// RENOVAR1MES); el total lo devuelve POST /api/config/cotizar y al enviar el
// servidor vuelve a cotizar las mismas líneas.
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Gift } from 'lucide-react';
import { API_BASE } from '../config/api';
import { useCatalogoPublico, useCotizacion, useOfertasRenovacion } from '../hooks/useCatalogoPublico';
import { ContratoFirma } from './ContratoFirma';
import { cx } from './matricula/tokens';
import { enlaceWhatsApp } from '../config/contacto';
import { CabeceraJMA, Portada, Seccion, Campo, CampoFechaNacimiento, SelectorPolos, Exito, irA } from './matricula/piezas';
import { CampoCodigo, ResumenCotizacion, BarraTotal, EspacioBarra } from './matricula/Resumen';
import { SeccionFechas, useFechasPrograma } from './matricula/SeccionFechas';
import { deYmd } from '../utils/matricula';
import {
  lineasMatricula, piezasRopa, programasOfrecidos, itemPolos, soles,
  type CantidadPolos, type ItemCatalogo, type OfertaRenovacion, type PedidoCotizacion,
} from '../utils/catalogo';
import { EtiquetaPromocion, NotaPromocion } from './legal/AvisoPromocion';

interface FormularioRenovacionProps {
  onVolver: () => void;
  onSuccess: (total: number) => void;
}

const PERSONAS = { nombreAlumno: '', dniAlumno: '', fechaNacimiento: '', nombrePadre: '', dniPadre: '', email: '', direccion: '' };
const soloDigitos = (v: string, max: number) => v.replace(/\D/g, '').slice(0, max);

/** '2026-11-28' → 'sábado 28 de noviembre' */
const diaLargo = (ymd: string) => deYmd(ymd).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '');

/** Se abre al tocar: lo que no hace falta leer para decidir. */
function Desplegable({ abierto, children }: { abierto: boolean; children: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {abierto && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Lista({ textos }: { textos: string[] }) {
  return (
    <ul className="space-y-2">
      {textos.map((t) => (
        <li key={t} className="flex items-start gap-2.5 text-[14px] text-white/75">
          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-white/35" />{t}
        </li>
      ))}
    </ul>
  );
}

const incluyeDe = (plan: ItemCatalogo) => [plan.clases ? `${plan.clases} clases` : null, ...(plan.web?.renovacion_beneficios ?? [])].filter(Boolean) as string[];

/** Un plan en una fila: nombre y precio. Al tocarla, lo que incluye y el botón. */
function FilaPlan({ plan, abierta, onAbrir, onElegir }: { plan: ItemCatalogo; abierta: boolean; onAbrir: () => void; onElegir: () => void }) {
  return (
    <li className="border-t border-white/10 first:border-t-0">
      <button type="button" aria-expanded={abierta} onClick={onAbrir} className="flex min-h-[68px] w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-100 hover:bg-white/[0.03] sm:px-6">
        <span className="min-w-0 flex-1">
          <span className={`${cx.display} block text-[16px] text-white`}>{plan.nombre}</span>
          <span className={`${cx.textoApagado} block text-[13px]`}>{[plan.clases ? `${plan.clases} clases` : null, plan.web?.renovacion_etiqueta].filter(Boolean).join(' · ')}</span>
        </span>
        <span className={`${cx.cifra} shrink-0 text-[18px] text-white`}>{soles(plan.precio)}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-white/45 transition-transform duration-150 ${abierta ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      <Desplegable abierto={abierta}>
        <div className="px-4 pb-5 sm:px-6">
          <Lista textos={incluyeDe(plan)} />
          <button type="button" onClick={onElegir} className={`${cx.btnSecundario} mt-5 w-full`}>Renovar con este plan</button>
        </div>
      </Desplegable>
    </li>
  );
}

/** La promoción vigente: va primero, con el único botón lleno de la página. */
function TarjetaOferta({ oferta, plan, onElegir }: { oferta: OfertaRenovacion; plan: ItemCatalogo; onElegir: () => void }) {
  const [verMas, setVerMas] = useState(false);
  const regalos = oferta.beneficios.filter((b) => b.tipo !== 'inicio_tras_plan');
  const notas = oferta.beneficios.filter((b) => b.tipo === 'inicio_tras_plan');
  return (
    <section className={`${cx.card} !border-[#FA7B21] p-5 sm:p-7`}>
      <EtiquetaPromocion className="mb-3" />
      <h2 className={`${cx.display} text-[28px] leading-tight text-white sm:text-[34px]`}>{oferta.nombre.replace(/^Renovación anticipada:\s*/i, '')}</h2>
      <p className={`${cx.cifra} mt-1 text-[36px] leading-none text-[#FA7B21]`}>{soles(plan.precio)}</p>

      <ul className="mt-6 space-y-3">
        {regalos.map((b) => (
          <li key={b.texto} className="flex items-start gap-3 text-[16px] leading-snug text-white">
            <Gift className="mt-0.5 h-5 w-5 shrink-0 text-[#FA7B21]" aria-hidden />
            <span>{b.texto}{b.hasta && <span className="block text-[14px] text-white/55">Solo hasta el {diaLargo(b.hasta)}</span>}</span>
          </li>
        ))}
      </ul>

      <button type="button" onClick={onElegir} className={`${cx.btnPrimario} mt-7 w-full`}>Renovar con esta promoción</button>
      {notas.map((b) => <p key={b.texto} className={`${cx.ayuda} mt-3 text-center`}>{b.texto}.</p>)}
      <NotaPromocion hasta={oferta.hasta} condiciones={oferta.condiciones} className="mt-3 text-center" />

      <button type="button" aria-expanded={verMas} onClick={() => setVerMas((v) => !v)} className="mx-auto mt-2 flex min-h-[44px] items-center gap-1.5 px-2 text-[14px] font-bold text-white/70 hover:text-white">
        Qué incluye el plan <ChevronDown className={`h-4 w-4 transition-transform duration-150 ${verMas ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      <Desplegable abierto={verMas}><div className="pt-2"><Lista textos={incluyeDe(plan)} /></div></Desplegable>
    </section>
  );
}

export function FormularioRenovacion({ onVolver, onSuccess }: FormularioRenovacionProps) {
  const { items, estado: estadoCatalogo } = useCatalogoPublico();
  const ofertas = useOfertasRenovacion();
  const estado = estadoCatalogo === 'ok' && !ofertas ? 'cargando' : estadoCatalogo;
  const respaldo = estado === 'respaldo';

  const [planAbierto, setPlanAbierto] = useState<number | null>(null);
  const [codigoPlan, setCodigoPlan] = useState<string | null>(null);
  const [p, setP] = useState(PERSONAS);
  const [polos, setPolos] = useState<CantidadPolos>('0');
  const [tallasPolos, setTallasPolos] = useState<string[]>([]);
  const [codigo, setCodigo] = useState('');
  const [firma, setFirma] = useState<string | null>(null);
  const [autorizaImagen, setAutorizaImagen] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [registrado, setRegistrado] = useState<number | null>(null);

  useEffect(() => { window.scrollTo(0, 0); }, [codigoPlan]);

  const ropa = useMemo(() => piezasRopa(items), [items]);
  // Sin plan elegido no hay programa (ojo: un programa sin código, como "Todos los días", tiene codigo null)
  const programa = useMemo(
    () => (codigoPlan ? items.find((i) => i.tipo === 'programa' && i.codigo === codigoPlan) ?? null : null),
    [items, codigoPlan],
  );

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

  // La promoción de cada plan; su tarjeta reemplaza a la normal
  const conOferta = useMemo(
    () => (ofertas ?? []).flatMap((oferta) => {
      const plan = planes.find((x) => x.codigo === oferta.programa);
      return plan ? [{ oferta, plan }] : [];
    }),
    [ofertas, planes],
  );
  const ofertaAplicada = conOferta.find((x) => x.oferta.codigo === codigo && x.plan === programa)?.oferta ?? null;
  const elegir = (plan: ItemCatalogo, promo?: string) => {
    if (promo) setCodigo(promo);
    // La promoción de otro plan no se arrastra
    else if (conOferta.some((x) => x.oferta.codigo === codigo)) setCodigo('');
    setCodigoPlan(plan.codigo);
  };

  const clasesBase = programa?.clases ?? 0;
  const clasesTotales = clasesBase + (alDia ? cotizacion?.clases_extra ?? 0 : 0);
  const fechas = useFechasPrograma(p.fechaNacimiento, clasesTotales, programa?.codigo, clasesTotales - clasesBase);
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
        diasSemana: manana ? h.diasManana : h.diasSemana,
      } : null,
      tallasPolos,
      nombrePadre: p.nombrePadre.trim(),
      dniPadre: p.dniPadre,
      direccion: p.direccion.trim(),
      email: p.email.trim(),
      polos: polos === '0' ? 'No' : `${polos} polo(s)`,
      fechaInicio: fechas.fin?.fechaInicio ?? fechas.fechaInicio,
      diasTentativos: fechas.sinDefinir ? 'Aún no especificado' : fechas.dias.join(', '),
      fechaFin: fechas.sinDefinir ? '' : fechas.fin?.fechaFin ?? '',
      semanasAproximadas: fechas.fin?.semanas ?? 0,

      // Informativo; el servidor lo reemplaza por su cotización
      precioPrograma: lineaDe(programa.id)?.precio_unitario ?? programa.precio,
      precioPolos: lineaDe(itemPolos(polos, ropa)?.id)?.subtotal ?? 0,
      descuentoDinero: cotizacion.descuento,
      subtotal: cotizacion.subtotal,
      total: cotizacion.total,

      contratoFirmado: firma,
      autorizaImagen,
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
            bajada="Todos los planes son 2 veces por semana."
            respaldo={respaldo}
          />
          {estado === 'cargando' ? (
            <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-white/5" />)}</div>
          ) : respaldo ? (
            <a href={enlaceWhatsApp('Hola, quiero renovar el plan de mi hijo')} target="_blank" rel="noopener noreferrer" className={`${cx.btnPrimario} w-full`}>
              Renovar por WhatsApp
            </a>
          ) : (
            <div className="space-y-8">
              {conOferta.map(({ oferta, plan }) => <TarjetaOferta key={oferta.codigo + plan.id} oferta={oferta} plan={plan} onElegir={() => elegir(plan, oferta.codigo)} />)}
              <section>
                {conOferta.length > 0 && <h2 className={`${cx.h2} mb-3`}>Otros planes</h2>}
                <ul className={`${cx.card} overflow-hidden`}>
                  {planes.filter((plan) => !conOferta.some((x) => x.plan === plan)).map((plan) => (
                    <FilaPlan key={plan.id} plan={plan} abierta={planAbierto === plan.id} onAbrir={() => setPlanAbierto((a) => (a === plan.id ? null : plan.id))} onElegir={() => elegir(plan)} />
                  ))}
                </ul>
              </section>
            </div>
          )}
          {!respaldo && (
            <div className="mt-5">
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
        <Portada etiqueta="Renovación" titulo={ofertaAplicada ? ofertaAplicada.nombre.replace(/^Renovación anticipada:\s*/i, '') : programa.nombre} precio={programa.precio} notaPrecio={clasesTotales ? `${clasesTotales} clases` : undefined} />

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
            {ofertaAplicada && <p className={cx.avisoAmbar}>Empieza cuando termine su membresía actual. Si no sabes la fecha, marca «Aún no sé».</p>}
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
                fechaInicio: fechas.fin?.fechaInicio ?? fechas.fechaInicio,
                fechaFin: fechas.fin?.fechaFin ?? '',
                clasesTotales: fechas.fin?.clasesTotales ?? clasesTotales,
                turnoSeleccionado: fechas.turno === 'manana' ? 'Mañana' : 'Tarde',
                diasTentativos: fechas.dias.join(', '),
                precioPrograma: programa.precio,
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
        texto={firma ? 'Enviar renovación' : 'Continuar'}
        deshabilitado={respaldo}
      />
    </div>
  );
}
