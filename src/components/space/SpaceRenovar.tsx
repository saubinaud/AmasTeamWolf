import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Loader2, RefreshCw, CheckCircle2, ArrowRight, X, Tag, Search, User, AlertCircle, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '../../config/api';
import { cx } from './tokens';
import { ContratoFirma } from '../ContratoFirma';
import {
  PROGRAMAS_RENOVACION,
  PROGRAMA_CLASES,
  PRECIOS_BASE,
  PRECIOS_POLOS,
  NOMBRES_PROGRAMA,
  TALLAS_OPTIONS,
  type ProgramaKey,
  type HorariosInfo,
  type CodigoAplicado,
  calcularHorarios,
  obtenerFechasDisponiblesInicio,
  diasPermitidosPorTurnoCategoria,
  obtenerNombreDia,
  calcularFechaFin,
  validarCodigoPromocional,
  obtenerClasesExtraDePromo,
  formatearFechaLarga,
  toISODateString,
} from './matriculaShared';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  token: string;
  onGoToInscritos?: () => void;
}

type PolosOption = '0' | '1' | '2' | '3';
type Turno = 'manana' | 'tarde';
type OpcionFecha = 'fechas' | 'no-especificado' | 'otra';
type EstadoPago = 'Pendiente' | 'Parcial' | 'Pagado';
type MetodoPago = 'efectivo' | 'yape' | 'transferencia' | 'tarjeta' | 'otro';
type TipoCliente = 'Nuevo/Primer registro' | 'Renovación' | 'Walk-in' | 'Promocional' | 'Transferido';

interface AdminOverrides {
  precioProgramaOverride: string;
  descuentoManual: string;
  precioPagadoOverride: string;
  programaCustom: string;
  clasesTotalesOverride: string;
  fechaFinOverride: string;
  estadoPago: EstadoPago;
  metodoPago: MetodoPago;
  montoParcial: string;
  tipoCliente: TipoCliente;
  observaciones: string;
  skipContrato: boolean;
  skipEmail: boolean;
}

function initialAdmin(): AdminOverrides {
  return {
    precioProgramaOverride: '',
    descuentoManual: '',
    precioPagadoOverride: '',
    programaCustom: '',
    clasesTotalesOverride: '',
    fechaFinOverride: '',
    estadoPago: 'Pendiente',
    metodoPago: 'efectivo',
    montoParcial: '',
    tipoCliente: 'Renovación',
    observaciones: '',
    skipContrato: false,
    skipEmail: false,
  };
}

interface AlumnoBusqueda {
  id: number;
  nombre_alumno?: string;
  nombre?: string;
  dni_alumno?: string;
  dni?: string;
  fecha_nacimiento?: string;
  nombre_apoderado?: string;
  dni_apoderado?: string;
  correo?: string;
  telefono?: string;
  direccion?: string;
}

interface InscripcionActiva {
  programa: string;
  fecha_fin: string;
  estado_pago: string;
}

interface FormState {
  alumno_id: number | null;
  nombreAlumno: string;
  dniAlumno: string;
  fechaNacimiento: string;
  nombrePadre: string;
  dniPadre: string;
  telefono: string;
  direccion: string;
  email: string;
  fechaInicio: string;
}

const INITIAL_FORM: FormState = {
  alumno_id: null,
  nombreAlumno: '',
  dniAlumno: '',
  fechaNacimiento: '',
  nombrePadre: '',
  dniPadre: '',
  telefono: '',
  direccion: '',
  email: '',
  fechaInicio: '',
};

const PROGRAMA_LABELS: Record<ProgramaKey, { titulo: string; sub: string }> = {
  '1mes': { titulo: '1 Mes', sub: '8 clases · S/ 330' },
  full: { titulo: '3 Meses FULL', sub: '24 clases · S/ 869' },
  '6meses': { titulo: '6 Meses', sub: '48 clases · S/ 1699' },
  '12meses_sin': { titulo: '12 Meses', sub: '96 clases · S/ 2999' },
  '12meses_con': { titulo: 'WOLF ELITE 365', sub: '96 clases · S/ 3699' },
};

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SpaceRenovar({ token, onGoToInscritos }: Props) {
  // Programa
  const [programa, setPrograma] = useState<ProgramaKey>('full');

  // Form
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firmaBase64, setFirmaBase64] = useState<string | null>(null);
  const [polosOption, setPolosOption] = useState<PolosOption>('0');
  const [tallasPolos, setTallasPolos] = useState<string[]>([]);

  // Búsqueda alumno
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AlumnoBusqueda[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [inscripcionActiva, setInscripcionActiva] = useState<InscripcionActiva | null>(null);

  // Horarios / fechas / dias
  const [horariosInfo, setHorariosInfo] = useState<HorariosInfo | null>(null);
  const [categoriaAlumno, setCategoriaAlumno] = useState('');
  const [diasTentativos, setDiasTentativos] = useState<string[]>([]);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<Turno>('tarde');
  const [opcionFecha, setOpcionFecha] = useState<OpcionFecha>('fechas');
  const [fechasDisponibles, setFechasDisponibles] = useState<Date[]>([]);
  const [fechaFinCalculada, setFechaFinCalculada] = useState('');
  const [detallesFechaFin, setDetallesFechaFin] = useState<{
    clasesTotales: number;
    semanasAproximadas: number;
  } | null>(null);

  // Promo
  const [codigoInput, setCodigoInput] = useState('');
  const [codigoAplicado, setCodigoAplicado] = useState<CodigoAplicado | null>(null);

  // Admin overrides
  const [admin, setAdmin] = useState<AdminOverrides>(initialAdmin());
  const [adminOpen, setAdminOpen] = useState(false);

  // Success
  const [lastCreated, setLastCreated] = useState<{ nombre: string; programa: string; total: number } | null>(null);

  // -----------------------------------------------------------------------
  // Reset
  // -----------------------------------------------------------------------
  const resetAll = useCallback(() => {
    setForm(INITIAL_FORM);
    setFirmaBase64(null);
    setPolosOption('0');
    setTallasPolos([]);
    setSearchQuery('');
    setSearchResults([]);
    setInscripcionActiva(null);
    setHorariosInfo(null);
    setCategoriaAlumno('');
    setDiasTentativos([]);
    setTurnoSeleccionado('tarde');
    setOpcionFecha('fechas');
    setFechasDisponibles([]);
    setFechaFinCalculada('');
    setDetallesFechaFin(null);
    setCodigoInput('');
    setCodigoAplicado(null);
    setAdmin(initialAdmin());
  }, []);

  // -----------------------------------------------------------------------
  // Búsqueda alumno
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    if (form.alumno_id && form.nombreAlumno === searchQuery) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `${API_BASE}/space/alumnos?search=${encodeURIComponent(searchQuery)}&limit=10`,
          { headers: authHeaders(token) },
        );
        const data = await res.json();
        const list: AlumnoBusqueda[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setSearchResults(list);
        setShowResults(true);
      } catch {
        toast.error('Error al buscar alumnos');
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, token, form.alumno_id, form.nombreAlumno]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) setShowResults(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleSelectAlumno = useCallback(
    async (a: AlumnoBusqueda) => {
      const nombre = a.nombre_alumno ?? a.nombre ?? '';
      const dni = a.dni_alumno ?? a.dni ?? '';
      const fNac = a.fecha_nacimiento ? a.fecha_nacimiento.slice(0, 10) : '';
      setForm((f) => ({
        ...f,
        alumno_id: a.id,
        nombreAlumno: nombre,
        dniAlumno: dni,
        fechaNacimiento: fNac,
        nombrePadre: a.nombre_apoderado ?? '',
        dniPadre: a.dni_apoderado ?? '',
        telefono: a.telefono ?? '',
        email: a.correo ?? '',
        direccion: a.direccion ?? '',
      }));
      setSearchQuery(nombre);
      setShowResults(false);
      setInscripcionActiva(null);

      if (fNac) {
        const horarios = calcularHorarios(fNac);
        setHorariosInfo(horarios);
        setCategoriaAlumno(horarios.categoria);
      }

      // Cargar inscripción activa actual
      try {
        const res = await fetch(`${API_BASE}/space/alumnos/${a.id}`, { headers: authHeaders(token) });
        const data = await res.json();
        const inscripciones = data?.data?.inscripciones ?? [];
        const activa = inscripciones.find((i: { estado?: string }) => i.estado === 'Activo');
        if (activa) setInscripcionActiva(activa as InscripcionActiva);
      } catch {
        /* silencioso */
      }
    },
    [token],
  );

  // -----------------------------------------------------------------------
  // Efectos fechas/horarios
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (form.fechaNacimiento) {
      const todas = obtenerFechasDisponiblesInicio();
      const horarios = calcularHorarios(form.fechaNacimiento);
      const diasPermitidos = diasPermitidosPorTurnoCategoria(turnoSeleccionado, horarios.categoria);
      const filtradas = todas.filter((f) => diasPermitidos.includes(obtenerNombreDia(f)));
      setFechasDisponibles(filtradas.slice(0, 5));
    } else {
      setFechasDisponibles(obtenerFechasDisponiblesInicio());
    }
  }, [form.fechaNacimiento, turnoSeleccionado]);

  useEffect(() => {
    if (diasTentativos.length === 0) return;
    const permitidos = diasPermitidosPorTurnoCategoria(turnoSeleccionado, categoriaAlumno);
    const filtrados = diasTentativos.filter((d) => permitidos.includes(d));
    if (filtrados.length !== diasTentativos.length) setDiasTentativos(filtrados);
  }, [turnoSeleccionado, categoriaAlumno, diasTentativos]);

  useEffect(() => {
    if (!form.fechaInicio || form.fechaInicio === 'no-especificado' || diasTentativos.length < 1) {
      setFechaFinCalculada('');
      setDetallesFechaFin(null);
      return;
    }
    const clasesExtra = codigoAplicado?.codigo ? obtenerClasesExtraDePromo(codigoAplicado.codigo) : 0;
    const resultado = calcularFechaFin(new Date(form.fechaInicio), programa, diasTentativos, clasesExtra);
    setFechaFinCalculada(toISODateString(resultado.fechaFin));
    setDetallesFechaFin({
      clasesTotales: resultado.clasesTotales,
      semanasAproximadas: resultado.semanasAproximadas,
    });
  }, [form.fechaInicio, diasTentativos, codigoAplicado, programa]);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const handleInputChange = useCallback((field: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  }, []);

  const handleFechaNacimientoChange = useCallback(
    (fecha: string) => {
      handleInputChange('fechaNacimiento', fecha);
      if (fecha) {
        const horarios = calcularHorarios(fecha);
        setHorariosInfo(horarios);
        setCategoriaAlumno(horarios.categoria);
      } else {
        setHorariosInfo(null);
        setCategoriaAlumno('');
      }
    },
    [handleInputChange],
  );

  const handlePolosChange = useCallback((v: PolosOption) => {
    setPolosOption(v);
    setTallasPolos(new Array(parseInt(v, 10)).fill(''));
  }, []);

  const handleTallaPoloChange = useCallback((index: number, talla: string) => {
    setTallasPolos((prev) => {
      const next = [...prev];
      next[index] = talla;
      return next;
    });
  }, []);

  const handleDiaTentativoToggle = useCallback((dia: string) => {
    setDiasTentativos((prev) => (prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]));
  }, []);

  const handleAplicarCodigo = useCallback(() => {
    if (!codigoInput.trim()) {
      toast.error('Ingresa un código');
      return;
    }
    const resultado = validarCodigoPromocional(codigoInput, programa);
    if (!resultado.valido) {
      toast.error(resultado.mensaje ?? 'Código no válido');
      setCodigoAplicado(null);
      return;
    }
    setCodigoAplicado(resultado);
    toast.success(`Código "${resultado.codigo}" aplicado`);
  }, [codigoInput, programa]);

  const handleQuitarCodigo = useCallback(() => {
    setCodigoInput('');
    setCodigoAplicado(null);
  }, []);

  // -----------------------------------------------------------------------
  // Cálculo de precio (con overrides admin)
  // -----------------------------------------------------------------------

  const precioBase = admin.precioProgramaOverride
    ? Number(admin.precioProgramaOverride) || 0
    : PRECIOS_BASE[programa];

  let precioPolosAjustado = PRECIOS_POLOS[polosOption];
  let descuentoDinero = 0;
  let descuentoPorcentaje = 0;

  if (codigoAplicado?.valido && codigoAplicado.valor !== undefined && codigoAplicado.tipo !== 'desbloquear_1mes') {
    if (codigoAplicado.tipo === 'descuento_dinero') descuentoDinero = codigoAplicado.valor;
    else if (codigoAplicado.tipo === 'descuento_porcentaje') descuentoPorcentaje = codigoAplicado.valor;
    else if (codigoAplicado.tipo === 'polo_gratis') {
      const valorDesc = codigoAplicado.valor === 1 ? 60 : 110;
      precioPolosAjustado = Math.max(0, PRECIOS_POLOS[polosOption] - valorDesc);
    }
  }

  const descuentoManual = Number(admin.descuentoManual) || 0;
  const descuentoDineroTotal = descuentoDinero + descuentoManual;

  const subtotal = precioBase + precioPolosAjustado - descuentoDineroTotal;
  const descuentoPorcentualMonto = descuentoPorcentaje > 0 ? Math.round(subtotal * (descuentoPorcentaje / 100)) : 0;
  const totalCalculado = Math.max(0, subtotal - descuentoPorcentualMonto);

  const total = admin.precioPagadoOverride
    ? Number(admin.precioPagadoOverride) || 0
    : totalCalculado;

  const needsPoloSize = polosOption !== '0';

  // -----------------------------------------------------------------------
  // Contrato: datos
  // -----------------------------------------------------------------------

  const datosContrato = useMemo(
    () => ({
      nombrePadre: form.nombrePadre,
      dniPadre: form.dniPadre,
      email: form.email,
      telefono: form.telefono,
      direccion: form.direccion,
      nombreAlumno: form.nombreAlumno,
      dniAlumno: form.dniAlumno,
      fechaNacimiento: form.fechaNacimiento,
      categoriaAlumno,
      programa: NOMBRES_PROGRAMA[programa],
      fechaInicio: form.fechaInicio,
      fechaFin: fechaFinCalculada || '',
      clasesTotales: detallesFechaFin?.clasesTotales,
      turnoSeleccionado: turnoSeleccionado === 'manana' ? 'Mañana' : 'Tarde',
      diasTentativos: diasTentativos.join(', '),
      precioPrograma: precioBase,
      descuentoDinero,
      total,
    }),
    [form, categoriaAlumno, programa, fechaFinCalculada, detallesFechaFin, turnoSeleccionado, diasTentativos, precioBase, descuentoDinero, total],
  );

  // -----------------------------------------------------------------------
  // Submit
  // -----------------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    if (!form.nombreAlumno || !form.dniAlumno || !form.nombrePadre || !form.dniPadre || !form.email || !form.fechaInicio) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }
    if (!form.fechaNacimiento) {
      toast.error('Ingresa la fecha de nacimiento del alumno');
      return;
    }
    if (form.fechaInicio !== 'no-especificado' && diasTentativos.length < 1) {
      toast.error('Selecciona al menos 1 día tentativo');
      return;
    }
    if (form.fechaInicio !== 'no-especificado' && !fechaFinCalculada) {
      toast.error('La fecha de fin no se calculó correctamente');
      return;
    }
    if (needsPoloSize && tallasPolos.some((t) => !t)) {
      toast.error('Selecciona todas las tallas de polos');
      return;
    }
    if (!firmaBase64 && !admin.skipContrato) {
      toast.error('Firma el contrato o marca "Registrar sin firma" en Ajustes admin');
      return;
    }

    setIsSubmitting(true);
    try {
      const programaFinal = admin.programaCustom.trim() || NOMBRES_PROGRAMA[programa];
      const clasesTotalesFinal = admin.clasesTotalesOverride
        ? Number(admin.clasesTotalesOverride) || PROGRAMA_CLASES[programa]
        : form.fechaInicio === 'no-especificado'
          ? PROGRAMA_CLASES[programa]
          : (detallesFechaFin?.clasesTotales ?? PROGRAMA_CLASES[programa]);
      const fechaFinFinal = admin.fechaFinOverride
        ? admin.fechaFinOverride
        : form.fechaInicio === 'no-especificado'
          ? 'Por calcular'
          : fechaFinCalculada;

      const payload = {
        tipoFormulario: 'Renovación',
        programa: programaFinal,
        clasesTotales: clasesTotalesFinal,

        nombreAlumno: form.nombreAlumno,
        dniAlumno: form.dniAlumno,
        fechaNacimiento: form.fechaNacimiento,
        categoriaAlumno: categoriaAlumno || 'No especificada',

        turnoSeleccionado: turnoSeleccionado === 'manana' ? 'Mañana' : 'Tarde',
        horariosDisponibles: horariosInfo
          ? {
              horarioSemana: turnoSeleccionado === 'manana' ? horariosInfo.horarioManana : horariosInfo.horarioSemana,
              horarioSabado: horariosInfo.horarioSabado,
              horarioManana: horariosInfo.horarioManana,
              horarioTarde: horariosInfo.horarioSemana,
              diasSemana: turnoSeleccionado === 'manana' ? 'Martes, Jueves y Sábado' : horariosInfo.diasSemana,
            }
          : null,

        tallasPolos: needsPoloSize ? tallasPolos : [],

        nombrePadre: form.nombrePadre,
        dniPadre: form.dniPadre,
        telefono: form.telefono,
        direccion: form.direccion,
        email: form.email,

        polos: polosOption === '0' ? 'No' : `${polosOption} polo(s)`,
        precioPolos: PRECIOS_POLOS[polosOption],

        fechaInicio: form.fechaInicio,
        diasTentativos: form.fechaInicio === 'no-especificado' ? 'Aún no especificado' : diasTentativos.join(', '),
        fechaFin: fechaFinFinal,
        semanasAproximadas: form.fechaInicio === 'no-especificado' ? 0 : (detallesFechaFin?.semanasAproximadas ?? 0),

        codigoPromocional: codigoAplicado?.codigo ?? 'No aplicado',
        tipoDescuento: codigoAplicado?.tipo ?? 'ninguno',
        descuentoDinero: descuentoDineroTotal,
        descuentoPorcentaje,
        descuentoPorcentualMonto,

        precioPrograma: precioBase,
        subtotal,
        total,

        contratoFirmado: admin.skipContrato ? null : firmaBase64,
        fechaRegistro: new Date().toISOString(),
        origen: 'space',

        // ── Admin overrides ──
        estadoPago: admin.estadoPago,
        metodoPago: admin.estadoPago !== 'Pendiente' ? admin.metodoPago : null,
        montoParcial: admin.estadoPago === 'Parcial' ? Number(admin.montoParcial) || 0 : undefined,
        tipoCliente: admin.tipoCliente,
        observaciones: admin.observaciones.trim() || null,
        skipContrato: admin.skipContrato,
        skipEmail: admin.skipEmail,
      };

      const res = await fetch(`${API_BASE}/renovacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      toast.success('Renovación registrada correctamente');
      setLastCreated({ nombre: form.nombreAlumno, programa: NOMBRES_PROGRAMA[programa], total });
      resetAll();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error en renovación:', err);
      toast.error('Hubo un error al registrar la renovación');
    } finally {
      setIsSubmitting(false);
    }
  }, [form, programa, categoriaAlumno, turnoSeleccionado, horariosInfo, diasTentativos, fechaFinCalculada, detallesFechaFin, polosOption, tallasPolos, needsPoloSize, codigoAplicado, descuentoDineroTotal, descuentoPorcentaje, descuentoPorcentualMonto, precioBase, subtotal, total, firmaBase64, admin, resetAll]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-white text-xl font-bold">Renovar inscripción</h1>
        <p className="text-zinc-500 text-xs mt-1">
          Busca al alumno para pre-llenar sus datos, selecciona programa, códigos, fechas y firma el contrato.
        </p>
      </div>

      {/* Success banner */}
      {lastCreated && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
          <div className="flex-1">
            <p className="text-emerald-400 text-sm font-semibold">Renovación registrada: {lastCreated.nombre}</p>
            <p className="text-emerald-400/70 text-xs">{lastCreated.programa} · Total S/ {lastCreated.total}</p>
          </div>
          {onGoToInscritos && (
            <button onClick={onGoToInscritos} className="flex items-center gap-1 text-emerald-400 text-xs font-medium hover:text-emerald-300">
              Ver inscritos <ArrowRight size={12} />
            </button>
          )}
          <button onClick={() => setLastCreated(null)} className={cx.btnIcon}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Búsqueda alumno */}
      <section className={cx.card + ' p-5'}>
        <h3 className="text-white text-sm font-semibold mb-4">1. Buscar alumno</h3>
        <div className="relative" ref={resultsRef}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value === '') {
                setForm(INITIAL_FORM);
                setInscripcionActiva(null);
              }
            }}
            placeholder="Buscar por nombre o DNI (opcional — también puedes llenar manualmente)"
            className={cx.input + ' pl-9'}
          />
          {searching && (
            <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 animate-spin" />
          )}
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl max-h-48 overflow-y-auto shadow-xl">
              {searchResults.map((a) => {
                const nombre = a.nombre_alumno ?? a.nombre ?? '';
                const dni = a.dni_alumno ?? a.dni ?? '';
                return (
                  <button
                    key={a.id}
                    onClick={() => handleSelectAlumno(a)}
                    className="w-full text-left px-3.5 py-2.5 text-sm text-white hover:bg-zinc-700 transition-colors flex items-center gap-2"
                  >
                    <User size={14} className="text-zinc-500 shrink-0" />
                    <span>{nombre}</span>
                    {dni && <span className="text-zinc-500 text-xs ml-auto">{dni}</span>}
                  </button>
                );
              })}
            </div>
          )}
          {showResults && searchResults.length === 0 && searchQuery.length >= 2 && !searching && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-3 text-sm text-zinc-500">
              Sin resultados — puedes llenar los datos manualmente
            </div>
          )}
        </div>

        {inscripcionActiva && (
          <div className="mt-3 flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <p className="text-amber-400 font-semibold">Inscripción activa actual</p>
              <p className="text-amber-400/80 mt-0.5">
                {inscripcionActiva.programa} · vence {inscripcionActiva.fecha_fin} · pago {inscripcionActiva.estado_pago}
              </p>
              <p className="text-amber-400/60 mt-1">Al registrar la renovación, esta inscripción se marcará como vencida.</p>
            </div>
          </div>
        )}
      </section>

      {/* Programa */}
      <section className={cx.card + ' p-5'}>
        <h3 className="text-white text-sm font-semibold mb-3">2. Programa a renovar</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PROGRAMAS_RENOVACION.map((k) => {
            const lbl = PROGRAMA_LABELS[k];
            const active = programa === k;
            return (
              <button
                key={k}
                onClick={() => setPrograma(k)}
                className={
                  active
                    ? 'px-3 py-3 rounded-xl bg-[#FA7B21]/15 border border-[#FA7B21]/30 text-left'
                    : 'px-3 py-3 rounded-xl bg-zinc-800 border border-zinc-800 hover:bg-zinc-700 text-left transition-all'
                }
              >
                <div className={active ? 'text-[#FA7B21] text-sm font-semibold' : 'text-white text-sm font-semibold'}>
                  {lbl.titulo}
                </div>
                <div className="text-zinc-500 text-xs mt-0.5">{lbl.sub}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Datos alumno */}
      <section className={cx.card + ' p-5'}>
        <h3 className="text-white text-sm font-semibold mb-4">3. Datos del alumno</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={cx.label}>Nombre completo *</label>
              <input type="text" value={form.nombreAlumno} onChange={(e) => handleInputChange('nombreAlumno', e.target.value)} className={cx.input} />
            </div>
            <div>
              <label className={cx.label}>DNI *</label>
              <input type="text" inputMode="numeric" maxLength={8} value={form.dniAlumno} onChange={(e) => handleInputChange('dniAlumno', e.target.value)} className={cx.input} />
            </div>
          </div>
          <div>
            <label className={cx.label}>Fecha de nacimiento *</label>
            <input type="date" value={form.fechaNacimiento} onChange={(e) => handleFechaNacimientoChange(e.target.value)} className={cx.input} />
          </div>

          {horariosInfo && horariosInfo.horarioSemana && (
            <div className="mt-2 p-4 rounded-xl bg-zinc-800 border border-[#FA7B21]/20">
              <p className="text-white text-sm font-semibold mb-3">Turno preferido</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTurnoSeleccionado('manana')}
                  className={
                    turnoSeleccionado === 'manana'
                      ? 'p-3 rounded-xl border-2 border-[#FA7B21] bg-[#FA7B21]/15 text-center'
                      : 'p-3 rounded-xl border-2 border-zinc-700 bg-zinc-900 hover:border-[#FA7B21]/50 text-center transition-all'
                  }
                >
                  <div className={turnoSeleccionado === 'manana' ? 'text-[#FA7B21] font-semibold text-sm' : 'text-white font-semibold text-sm'}>Mañana</div>
                  <div className="text-zinc-500 text-xs mt-1">{horariosInfo.horarioManana}</div>
                </button>
                <button
                  onClick={() => setTurnoSeleccionado('tarde')}
                  className={
                    turnoSeleccionado === 'tarde'
                      ? 'p-3 rounded-xl border-2 border-[#FA7B21] bg-[#FA7B21]/15 text-center'
                      : 'p-3 rounded-xl border-2 border-zinc-700 bg-zinc-900 hover:border-[#FA7B21]/50 text-center transition-all'
                  }
                >
                  <div className={turnoSeleccionado === 'tarde' ? 'text-[#FA7B21] font-semibold text-sm' : 'text-white font-semibold text-sm'}>Tarde</div>
                  <div className="text-zinc-500 text-xs mt-1">{horariosInfo.horarioSemana}</div>
                </button>
              </div>
              {horariosInfo.categoria && <p className="text-zinc-500 text-xs mt-3">Categoría: {horariosInfo.categoria}</p>}
              <p className="text-zinc-500 text-xs mt-1">
                Días disponibles: {turnoSeleccionado === 'manana' ? 'Martes, Jueves y Sábado' : horariosInfo.diasSemana}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Datos apoderado */}
      <section className={cx.card + ' p-5'}>
        <h3 className="text-white text-sm font-semibold mb-4">4. Datos del apoderado</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={cx.label}>Nombre completo *</label>
              <input type="text" value={form.nombrePadre} onChange={(e) => handleInputChange('nombrePadre', e.target.value)} className={cx.input} />
            </div>
            <div>
              <label className={cx.label}>DNI *</label>
              <input type="text" inputMode="numeric" maxLength={8} value={form.dniPadre} onChange={(e) => handleInputChange('dniPadre', e.target.value)} className={cx.input} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={cx.label}>WhatsApp / Celular</label>
              <input type="tel" value={form.telefono} onChange={(e) => handleInputChange('telefono', e.target.value)} className={cx.input} />
            </div>
            <div>
              <label className={cx.label}>Correo *</label>
              <input type="email" value={form.email} onChange={(e) => handleInputChange('email', e.target.value)} className={cx.input} />
            </div>
          </div>
          <div>
            <label className={cx.label}>Dirección</label>
            <input type="text" value={form.direccion} onChange={(e) => handleInputChange('direccion', e.target.value)} className={cx.input} />
          </div>
        </div>
      </section>

      {/* Polos */}
      <section className={cx.card + ' p-5'}>
        <h3 className="text-white text-sm font-semibold mb-4">5. Polos adicionales</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { v: '0' as PolosOption, label: 'Ninguno' },
            { v: '1' as PolosOption, label: '1 × S/ 60' },
            { v: '2' as PolosOption, label: '2 × S/ 110' },
            { v: '3' as PolosOption, label: '3 × S/ 150' },
          ].map((o) => (
            <button
              key={o.v}
              onClick={() => handlePolosChange(o.v)}
              className={
                polosOption === o.v
                  ? 'px-3 py-2.5 rounded-xl border-2 border-[#FA7B21] bg-[#FA7B21]/15 text-[#FA7B21] text-xs font-semibold'
                  : 'px-3 py-2.5 rounded-xl border-2 border-zinc-800 bg-zinc-800 text-zinc-400 text-xs font-semibold hover:border-[#FA7B21]/30 transition-all'
              }
            >
              {o.label}
            </button>
          ))}
        </div>
        {needsPoloSize && (
          <div className="mt-4 space-y-2">
            <label className={cx.label}>Tallas de polos *</label>
            {Array.from({ length: parseInt(polosOption, 10) }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-zinc-500 text-xs w-16">Polo {i + 1}:</span>
                <select
                  value={tallasPolos[i] ?? ''}
                  onChange={(e) => handleTallaPoloChange(i, e.target.value)}
                  className={cx.select + ' flex-1'}
                >
                  <option value="">Seleccionar talla</option>
                  {TALLAS_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      Talla {t}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Fechas */}
      <section className={cx.card + ' p-5'}>
        <h3 className="text-white text-sm font-semibold mb-4">6. Fechas del programa</h3>
        <div className="space-y-4">
          <label className={cx.label}>Fecha de inicio *</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {fechasDisponibles.map((f, idx) => {
              const fechaStr = toISODateString(f);
              const isSelected = form.fechaInicio === fechaStr && opcionFecha === 'fechas';
              return (
                <button
                  key={idx}
                  onClick={() => {
                    handleInputChange('fechaInicio', fechaStr);
                    setOpcionFecha('fechas');
                  }}
                  className={
                    isSelected
                      ? 'p-3 rounded-xl border-2 border-[#FA7B21] bg-[#FA7B21]/15 text-left'
                      : 'p-3 rounded-xl border-2 border-zinc-800 bg-zinc-800 hover:border-[#FA7B21]/30 text-left transition-all'
                  }
                >
                  <div className="flex items-center gap-2">
                    <div className={isSelected ? 'w-10 h-10 rounded-full bg-[#FA7B21] flex items-center justify-center font-bold text-white' : 'w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-white/80'}>
                      {f.getDate()}
                    </div>
                    <div className="flex-1">
                      <div className={isSelected ? 'text-[#FA7B21] text-sm font-semibold' : 'text-white text-sm font-semibold'}>
                        {obtenerNombreDia(f)}
                      </div>
                      <div className="text-zinc-500 text-xs capitalize">
                        {f.toLocaleDateString('es-PE', { month: 'long' })}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            <button
              onClick={() => {
                handleInputChange('fechaInicio', 'no-especificado');
                setOpcionFecha('no-especificado');
              }}
              className={
                opcionFecha === 'no-especificado'
                  ? 'p-3 rounded-xl border-2 border-[#FA7B21] bg-[#FA7B21]/15 text-left'
                  : 'p-3 rounded-xl border-2 border-zinc-800 bg-zinc-800 hover:border-[#FA7B21]/30 text-left transition-all'
              }
            >
              <div className="flex items-center gap-2">
                <div className={opcionFecha === 'no-especificado' ? 'w-10 h-10 rounded-full bg-[#FA7B21] flex items-center justify-center text-white' : 'w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white/80'}>
                  ?
                </div>
                <div className="flex-1">
                  <div className={opcionFecha === 'no-especificado' ? 'text-[#FA7B21] text-sm font-semibold' : 'text-white text-sm font-semibold'}>
                    Sin definir
                  </div>
                  <div className="text-zinc-500 text-xs">Lo decidiré después</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setOpcionFecha('otra')}
              className={
                opcionFecha === 'otra'
                  ? 'p-3 rounded-xl border-2 border-[#FA7B21] bg-[#FA7B21]/15 text-left'
                  : 'p-3 rounded-xl border-2 border-zinc-800 bg-zinc-800 hover:border-[#FA7B21]/30 text-left transition-all'
              }
            >
              <div className="flex items-center gap-2">
                <div className={opcionFecha === 'otra' ? 'w-10 h-10 rounded-full bg-[#FA7B21] flex items-center justify-center text-white' : 'w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white/80'}>
                  +
                </div>
                <div className="flex-1">
                  <div className={opcionFecha === 'otra' ? 'text-[#FA7B21] text-sm font-semibold' : 'text-white text-sm font-semibold'}>
                    Otra fecha
                  </div>
                  <div className="text-zinc-500 text-xs">Personalizada</div>
                </div>
              </div>
            </button>
          </div>

          {opcionFecha === 'otra' && (
            <div>
              <label className={cx.label}>Fecha personalizada</label>
              <input
                type="date"
                value={form.fechaInicio !== 'no-especificado' ? form.fechaInicio : ''}
                onChange={(e) => handleInputChange('fechaInicio', e.target.value)}
                min={toISODateString(new Date())}
                className={cx.input}
              />
            </div>
          )}

          {form.fechaInicio && form.fechaInicio !== 'no-especificado' && form.fechaNacimiento && (
            <div>
              <label className={cx.label}>Días tentativos de clase *</label>
              <p className="text-zinc-500 text-xs mb-2">Mínimo 1 día. Se usan para calcular la fecha de fin.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((dia) => {
                  const permitidos = diasPermitidosPorTurnoCategoria(turnoSeleccionado, categoriaAlumno);
                  const disabled = !permitidos.includes(dia);
                  const selected = diasTentativos.includes(dia);
                  return (
                    <button
                      key={dia}
                      onClick={() => !disabled && handleDiaTentativoToggle(dia)}
                      disabled={disabled}
                      className={
                        disabled
                          ? 'px-3 py-2.5 rounded-xl border-2 border-zinc-800 bg-zinc-900 text-zinc-700 text-xs font-semibold opacity-40 cursor-not-allowed'
                          : selected
                            ? 'px-3 py-2.5 rounded-xl border-2 border-[#FA7B21] bg-[#FA7B21]/15 text-[#FA7B21] text-xs font-semibold'
                            : 'px-3 py-2.5 rounded-xl border-2 border-zinc-800 bg-zinc-800 text-zinc-400 text-xs font-semibold hover:border-[#FA7B21]/30 transition-all'
                      }
                    >
                      {dia}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {fechaFinCalculada && detallesFechaFin && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-emerald-400 text-xs uppercase tracking-wider mb-1">Fecha de fin calculada</p>
              <p className="text-white text-base font-bold">{formatearFechaLarga(fechaFinCalculada)}</p>
              <p className="text-emerald-400/70 text-xs mt-1">
                {detallesFechaFin.clasesTotales} clases · {detallesFechaFin.semanasAproximadas} semanas
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Código */}
      <section className={cx.card + ' p-5'}>
        <h3 className="text-white text-sm font-semibold mb-4">7. Código promocional (opcional)</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={codigoInput}
            onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
            placeholder="RENUEVA100"
            className={cx.input + ' flex-1 uppercase'}
          />
          <button onClick={handleAplicarCodigo} className={cx.btnPrimary + ' flex items-center gap-2'}>
            <Tag size={14} /> Aplicar
          </button>
        </div>
        {codigoAplicado?.valido && (
          <div className="mt-3 flex items-start gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <p className="text-emerald-400 font-semibold">Código "{codigoAplicado.codigo}" aplicado</p>
              <p className="text-emerald-400/80 mt-0.5">{codigoAplicado.descripcion}</p>
            </div>
            <button onClick={handleQuitarCodigo} className={cx.btnIcon}>
              <X size={14} />
            </button>
          </div>
        )}
      </section>

      {/* Resumen */}
      <section className={cx.card + ' p-5'}>
        <h3 className="text-white text-sm font-semibold mb-4">8. Resumen</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-zinc-400">
            <span>{NOMBRES_PROGRAMA[programa]}</span>
            <span className="text-white">S/ {precioBase}</span>
          </div>
          {polosOption !== '0' && (
            <div className="flex justify-between text-zinc-400">
              <span>{polosOption} polo(s){codigoAplicado?.tipo === 'polo_gratis' && ' (desc. aplicado)'}</span>
              <span className="text-white">S/ {precioPolosAjustado}</span>
            </div>
          )}
          {descuentoDinero > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Descuento código</span>
              <span>- S/ {descuentoDinero}</span>
            </div>
          )}
          {descuentoManual > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Descuento manual admin</span>
              <span>- S/ {descuentoManual}</span>
            </div>
          )}
          {descuentoPorcentaje > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Descuento {descuentoPorcentaje}%</span>
              <span>- S/ {descuentoPorcentualMonto}</span>
            </div>
          )}
          {admin.precioPagadoOverride && (
            <div className="text-amber-400 text-xs italic pt-1">
              * Total sobrescrito manualmente (calculado: S/ {totalCalculado})
            </div>
          )}
          <div className="flex justify-between items-center pt-3 border-t border-zinc-800">
            <span className="text-white font-bold text-base">TOTAL</span>
            <span className="text-[#FCA929] text-2xl font-bold">S/ {total}</span>
          </div>
        </div>
      </section>

      {/* Ajustes admin */}
      <section className={cx.card + ' overflow-hidden'}>
        <button
          onClick={() => setAdminOpen(!adminOpen)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#FA7B21]/15 flex items-center justify-center">
              <Shield size={14} className="text-[#FA7B21]" />
            </div>
            <div className="text-left">
              <h3 className="text-white text-sm font-semibold">Ajustes de administrador</h3>
              <p className="text-zinc-500 text-xs">Override de precios, estado de pago, firma, notas internas</p>
            </div>
          </div>
          {adminOpen ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
        </button>

        {adminOpen && (
          <div className="px-5 pb-5 space-y-5 border-t border-zinc-800">
            {/* Overrides de precio */}
            <div className="pt-4">
              <p className="text-zinc-400 text-xs uppercase tracking-wider mb-3">Overrides de precio</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={cx.label}>Precio programa override</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={admin.precioProgramaOverride}
                    onChange={(e) => setAdmin((a) => ({ ...a, precioProgramaOverride: e.target.value }))}
                    placeholder={`S/ ${PRECIOS_BASE[programa]} (default)`}
                    className={cx.input}
                  />
                </div>
                <div>
                  <label className={cx.label}>Descuento manual S/</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={admin.descuentoManual}
                    onChange={(e) => setAdmin((a) => ({ ...a, descuentoManual: e.target.value }))}
                    placeholder="0"
                    className={cx.input}
                  />
                </div>
                <div>
                  <label className={cx.label}>Total final override</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={admin.precioPagadoOverride}
                    onChange={(e) => setAdmin((a) => ({ ...a, precioPagadoOverride: e.target.value }))}
                    placeholder={`S/ ${totalCalculado} (calculado)`}
                    className={cx.input}
                  />
                </div>
              </div>
            </div>

            {/* Estado de pago */}
            <div>
              <p className="text-zinc-400 text-xs uppercase tracking-wider mb-3">Estado de pago</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {(['Pendiente', 'Parcial', 'Pagado'] as EstadoPago[]).map((ep) => (
                  <button
                    key={ep}
                    onClick={() => setAdmin((a) => ({ ...a, estadoPago: ep }))}
                    className={
                      admin.estadoPago === ep
                        ? 'px-3 py-2.5 rounded-xl border-2 border-[#FA7B21] bg-[#FA7B21]/15 text-[#FA7B21] text-xs font-semibold'
                        : 'px-3 py-2.5 rounded-xl border-2 border-zinc-800 bg-zinc-800 text-zinc-400 text-xs font-semibold hover:border-[#FA7B21]/30 transition-all'
                    }
                  >
                    {ep}
                  </button>
                ))}
              </div>

              {(admin.estadoPago === 'Pagado' || admin.estadoPago === 'Parcial') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={cx.label}>Método de pago</label>
                    <select
                      value={admin.metodoPago}
                      onChange={(e) => setAdmin((a) => ({ ...a, metodoPago: e.target.value as MetodoPago }))}
                      className={cx.select}
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="yape">Yape</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  {admin.estadoPago === 'Parcial' && (
                    <div>
                      <label className={cx.label}>Monto parcial pagado</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={admin.montoParcial}
                        onChange={(e) => setAdmin((a) => ({ ...a, montoParcial: e.target.value }))}
                        placeholder="S/ 0"
                        className={cx.input}
                      />
                    </div>
                  )}
                </div>
              )}
              <p className="text-zinc-500 text-xs mt-2">
                Si seleccionas Pagado o Parcial, se registrará automáticamente una entrada en la tabla de pagos.
              </p>
            </div>

            {/* Programa y clases override */}
            <div>
              <p className="text-zinc-400 text-xs uppercase tracking-wider mb-3">Overrides de programa</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={cx.label}>Nombre programa custom</label>
                  <input
                    type="text"
                    value={admin.programaCustom}
                    onChange={(e) => setAdmin((a) => ({ ...a, programaCustom: e.target.value }))}
                    placeholder={NOMBRES_PROGRAMA[programa]}
                    className={cx.input}
                  />
                </div>
                <div>
                  <label className={cx.label}>Clases totales override</label>
                  <input
                    type="number"
                    min="0"
                    value={admin.clasesTotalesOverride}
                    onChange={(e) => setAdmin((a) => ({ ...a, clasesTotalesOverride: e.target.value }))}
                    placeholder={`${PROGRAMA_CLASES[programa]} (default)`}
                    className={cx.input}
                  />
                </div>
                <div>
                  <label className={cx.label}>Fecha fin override</label>
                  <input
                    type="date"
                    value={admin.fechaFinOverride}
                    onChange={(e) => setAdmin((a) => ({ ...a, fechaFinOverride: e.target.value }))}
                    className={cx.input}
                  />
                </div>
                <div>
                  <label className={cx.label}>Tipo de cliente</label>
                  <select
                    value={admin.tipoCliente}
                    onChange={(e) => setAdmin((a) => ({ ...a, tipoCliente: e.target.value as TipoCliente }))}
                    className={cx.select}
                  >
                    <option value="Renovación">Renovación</option>
                    <option value="Nuevo/Primer registro">Nuevo / Primer registro</option>
                    <option value="Walk-in">Walk-in (presencial)</option>
                    <option value="Promocional">Promocional</option>
                    <option value="Transferido">Transferido</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <label className={cx.label}>Observaciones internas</label>
              <textarea
                value={admin.observaciones}
                onChange={(e) => setAdmin((a) => ({ ...a, observaciones: e.target.value }))}
                placeholder="Notas para el equipo — aparecerán en el registro de pago si se crea uno"
                rows={3}
                className={cx.input + ' resize-none'}
              />
            </div>

            {/* Flags */}
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-800 cursor-pointer hover:border-[#FA7B21]/30 transition-all">
                <input
                  type="checkbox"
                  checked={admin.skipContrato}
                  onChange={(e) => setAdmin((a) => ({ ...a, skipContrato: e.target.checked }))}
                  className="mt-1 w-4 h-4 accent-[#FA7B21]"
                />
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">Registrar sin firma del contrato</div>
                  <div className="text-zinc-500 text-xs mt-0.5">
                    Útil para walk-ins donde el padre firma un contrato físico aparte.
                  </div>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-800 cursor-pointer hover:border-[#FA7B21]/30 transition-all">
                <input
                  type="checkbox"
                  checked={admin.skipEmail}
                  onChange={(e) => setAdmin((a) => ({ ...a, skipEmail: e.target.checked }))}
                  className="mt-1 w-4 h-4 accent-[#FA7B21]"
                />
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">No enviar email de confirmación</div>
                  <div className="text-zinc-500 text-xs mt-0.5">
                    El registro se guarda pero no se notifica por correo al padre.
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}
      </section>

      {/* Contrato */}
      <section className={cx.card + ' p-5'}>
        <h3 className="text-white text-sm font-semibold mb-4">9. Contrato y firma</h3>
        <ContratoFirma datos={datosContrato} onFirmaCompleta={(firma) => setFirmaBase64(firma)} />
      </section>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pb-6">
        <button onClick={resetAll} className={cx.btnSecondary}>
          Limpiar
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || (!firmaBase64 && !admin.skipContrato)}
          className={cx.btnPrimary + ' flex items-center gap-2'}
        >
          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Registrar renovación
        </button>
      </div>
    </div>
  );
}
