import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, UserPlus, CheckCircle2, ArrowRight, X, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '../../config/api';
import { cx } from './tokens';
import { ContratoFirma } from '../ContratoFirma';
import {
  PROGRAMAS_INSCRIPCION,
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

interface FormState {
  nombreAlumno: string;
  dniAlumno: string;
  fechaNacimiento: string;
  tallaUniforme: string;
  nombrePadre: string;
  dniPadre: string;
  telefono: string;
  direccion: string;
  email: string;
  fechaInicio: string;
}

const INITIAL_FORM: FormState = {
  nombreAlumno: '',
  dniAlumno: '',
  fechaNacimiento: '',
  tallaUniforme: '',
  nombrePadre: '',
  dniPadre: '',
  telefono: '',
  direccion: '',
  email: '',
  fechaInicio: '',
};

const PROGRAMA_LABELS: Record<ProgramaKey, { titulo: string; sub: string }> = {
  '1mes': { titulo: 'Programa 1 Mes', sub: '8 clases · S/ 330' },
  full: { titulo: 'Programa 3 Meses FULL', sub: '24 clases · S/ 869' },
  '6meses': { titulo: 'Programa 6 Meses', sub: '48 clases · S/ 1699' },
  '12meses_sin': { titulo: '', sub: '' },
  '12meses_con': { titulo: '', sub: '' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SpaceInscribir({ onGoToInscritos }: Props) {
  // Programa
  const [programa, setPrograma] = useState<ProgramaKey>('full');

  // Form
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firmaBase64, setFirmaBase64] = useState<string | null>(null);
  const [polosOption, setPolosOption] = useState<PolosOption>('0');
  const [includeUniform, setIncludeUniform] = useState(false);
  const [tallasPolos, setTallasPolos] = useState<string[]>([]);

  // Derived state
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

  // Success
  const [lastCreated, setLastCreated] = useState<{ nombre: string; programa: string; total: number } | null>(null);

  // -----------------------------------------------------------------------
  // Reset form
  // -----------------------------------------------------------------------
  const resetAll = useCallback(() => {
    setForm(INITIAL_FORM);
    setFirmaBase64(null);
    setPolosOption('0');
    setIncludeUniform(false);
    setTallasPolos([]);
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
  }, []);

  // -----------------------------------------------------------------------
  // Efectos
  // -----------------------------------------------------------------------

  // Fechas disponibles según edad + turno
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

  // Limpiar días tentativos al cambiar turno
  useEffect(() => {
    if (diasTentativos.length === 0) return;
    const permitidos = diasPermitidosPorTurnoCategoria(turnoSeleccionado, categoriaAlumno);
    const filtrados = diasTentativos.filter((d) => permitidos.includes(d));
    if (filtrados.length !== diasTentativos.length) setDiasTentativos(filtrados);
  }, [turnoSeleccionado, categoriaAlumno, diasTentativos]);

  // Calcular fecha fin
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

  const handleFechaNacimientoChange = useCallback((fecha: string) => {
    handleInputChange('fechaNacimiento', fecha);
    if (fecha) {
      const horarios = calcularHorarios(fecha);
      setHorariosInfo(horarios);
      setCategoriaAlumno(horarios.categoria);
    } else {
      setHorariosInfo(null);
      setCategoriaAlumno('');
    }
  }, [handleInputChange]);

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
    setDiasTentativos((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia],
    );
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
  // Cálculo de precio
  // -----------------------------------------------------------------------

  const precioBase = PRECIOS_BASE[programa];
  let precioUniforme = programa === '1mes' && includeUniform ? 220 : 0;
  let precioPolosAjustado = PRECIOS_POLOS[polosOption];
  let descuentoDinero = 0;
  let descuentoPorcentaje = 0;

  if (codigoAplicado?.valido && codigoAplicado.valor !== undefined) {
    if (codigoAplicado.tipo === 'descuento_dinero') descuentoDinero = codigoAplicado.valor;
    else if (codigoAplicado.tipo === 'descuento_porcentaje') descuentoPorcentaje = codigoAplicado.valor;
    else if (codigoAplicado.tipo === 'polo_gratis') {
      const valorDesc = codigoAplicado.valor === 1 ? 60 : 110;
      precioPolosAjustado = Math.max(0, PRECIOS_POLOS[polosOption] - valorDesc);
    } else if (codigoAplicado.tipo === 'uniforme_gratis') precioUniforme = 0;
  }

  const subtotal = precioBase + precioPolosAjustado + precioUniforme - descuentoDinero;
  const descuentoPorcentualMonto = descuentoPorcentaje > 0 ? Math.round(subtotal * (descuentoPorcentaje / 100)) : 0;
  const total = Math.max(0, subtotal - descuentoPorcentualMonto);

  const needsUniformSize = programa === 'full' || programa === '6meses' || (programa === '1mes' && includeUniform);
  const needsPoloSize = polosOption !== '0';

  // -----------------------------------------------------------------------
  // Contrato: datos para ContratoFirma
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
    // Validaciones
    if (!form.nombreAlumno || !form.dniAlumno || !form.nombrePadre || !form.dniPadre || !form.telefono || !form.email || !form.fechaInicio) {
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
    if (needsUniformSize && !form.tallaUniforme) {
      toast.error('Selecciona la talla de uniforme');
      return;
    }
    if (needsPoloSize && tallasPolos.some((t) => !t)) {
      toast.error('Selecciona todas las tallas de polos');
      return;
    }
    if (!firmaBase64) {
      toast.error('Firma el contrato antes de enviar');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        programa: NOMBRES_PROGRAMA[programa],
        clasesTotales: form.fechaInicio === 'no-especificado'
          ? PROGRAMA_CLASES[programa]
          : (detallesFechaFin?.clasesTotales ?? PROGRAMA_CLASES[programa]),

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

        tallaUniforme: needsUniformSize ? form.tallaUniforme : 'No aplica',
        tallasPolos: needsPoloSize ? tallasPolos : [],

        nombrePadre: form.nombrePadre,
        dniPadre: form.dniPadre,
        telefono: form.telefono,
        direccion: form.direccion,
        email: form.email,

        polos: polosOption === '0' ? 'No' : `${polosOption} polo(s)`,
        precioPolos: PRECIOS_POLOS[polosOption],
        uniformeAdicional: programa === '1mes' ? (includeUniform ? 'Sí' : 'No') : 'Incluido',
        precioUniforme,

        fechaInicio: form.fechaInicio,
        diasTentativos: form.fechaInicio === 'no-especificado' ? 'Aún no especificado' : diasTentativos.join(', '),
        fechaFin: form.fechaInicio === 'no-especificado' ? 'Por calcular' : fechaFinCalculada,
        semanasAproximadas: form.fechaInicio === 'no-especificado' ? 0 : (detallesFechaFin?.semanasAproximadas ?? 0),

        codigoPromocional: codigoAplicado?.codigo ?? 'No aplicado',
        tipoDescuento: codigoAplicado?.tipo ?? 'ninguno',
        descuentoDinero,
        descuentoPorcentaje,
        descuentoPorcentualMonto,

        precioPrograma: precioBase,
        subtotal,
        total,

        contratoFirmado: firmaBase64,
        fechaRegistro: new Date().toISOString(),
        origen: 'space',
      };

      const res = await fetch(`${API_BASE}/matricula`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      toast.success('Matrícula registrada correctamente');
      setLastCreated({ nombre: form.nombreAlumno, programa: NOMBRES_PROGRAMA[programa], total });
      resetAll();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error en matrícula:', err);
      toast.error('Hubo un error al registrar la matrícula');
    } finally {
      setIsSubmitting(false);
    }
  }, [form, programa, categoriaAlumno, turnoSeleccionado, horariosInfo, diasTentativos, fechaFinCalculada, detallesFechaFin, polosOption, tallasPolos, needsUniformSize, needsPoloSize, includeUniform, precioUniforme, codigoAplicado, descuentoDinero, descuentoPorcentaje, descuentoPorcentualMonto, precioBase, subtotal, total, firmaBase64, resetAll]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-white text-xl font-bold">Inscribir alumno</h1>
        <p className="text-zinc-500 text-xs mt-1">
          Formulario completo con horarios por edad, códigos promocionales, cálculo automático de fecha fin y contrato firmado.
        </p>
      </div>

      {/* Success banner */}
      {lastCreated && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
          <div className="flex-1">
            <p className="text-emerald-400 text-sm font-semibold">Matrícula registrada: {lastCreated.nombre}</p>
            <p className="text-emerald-400/70 text-xs">
              {lastCreated.programa} · Total S/ {lastCreated.total}
            </p>
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

      {/* Programa */}
      <section className={cx.card + ' p-5'}>
        <h3 className="text-white text-sm font-semibold mb-3">1. Programa</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PROGRAMAS_INSCRIPCION.map((k) => {
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
        <h3 className="text-white text-sm font-semibold mb-4">2. Datos del alumno</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={cx.label}>Nombre completo *</label>
              <input
                type="text"
                value={form.nombreAlumno}
                onChange={(e) => handleInputChange('nombreAlumno', e.target.value)}
                placeholder="Nombres y apellidos"
                className={cx.input}
              />
            </div>
            <div>
              <label className={cx.label}>DNI *</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={8}
                value={form.dniAlumno}
                onChange={(e) => handleInputChange('dniAlumno', e.target.value)}
                className={cx.input}
              />
            </div>
          </div>
          <div>
            <label className={cx.label}>Fecha de nacimiento *</label>
            <input
              type="date"
              value={form.fechaNacimiento}
              onChange={(e) => handleFechaNacimientoChange(e.target.value)}
              className={cx.input}
            />
          </div>

          {/* Selector de turno — aparece al poner fecha nacimiento */}
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
                  <div className={turnoSeleccionado === 'manana' ? 'text-[#FA7B21] font-semibold text-sm' : 'text-white font-semibold text-sm'}>
                    Mañana
                  </div>
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
                  <div className={turnoSeleccionado === 'tarde' ? 'text-[#FA7B21] font-semibold text-sm' : 'text-white font-semibold text-sm'}>
                    Tarde
                  </div>
                  <div className="text-zinc-500 text-xs mt-1">{horariosInfo.horarioSemana}</div>
                </button>
              </div>
              {horariosInfo.categoria && (
                <p className="text-zinc-500 text-xs mt-3">Categoría: {horariosInfo.categoria}</p>
              )}
              <p className="text-zinc-500 text-xs mt-1">
                Días disponibles: {turnoSeleccionado === 'manana' ? 'Martes, Jueves y Sábado' : horariosInfo.diasSemana}
              </p>
              <p className="text-zinc-500 text-xs">Sábados: {horariosInfo.horarioSabado}</p>
            </div>
          )}
        </div>
      </section>

      {/* Datos apoderado */}
      <section className={cx.card + ' p-5'}>
        <h3 className="text-white text-sm font-semibold mb-4">3. Datos del apoderado</h3>
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
              <label className={cx.label}>WhatsApp / Celular *</label>
              <input type="tel" inputMode="tel" value={form.telefono} onChange={(e) => handleInputChange('telefono', e.target.value)} placeholder="999 999 999" className={cx.input} />
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

      {/* Uniforme + Polos */}
      <section className={cx.card + ' p-5'}>
        <h3 className="text-white text-sm font-semibold mb-4">4. Uniforme y polos</h3>
        <div className="space-y-5">
          {programa === '1mes' && (
            <label className="flex items-start gap-3 p-4 rounded-xl bg-zinc-800 border border-zinc-800 cursor-pointer hover:border-[#FA7B21]/30 transition-all">
              <input
                type="checkbox"
                checked={includeUniform}
                onChange={(e) => setIncludeUniform(e.target.checked)}
                className="mt-1 w-5 h-5 accent-[#FA7B21]"
              />
              <div className="flex-1">
                <div className="text-white text-sm font-medium">Añadir Uniforme Completo — S/ 220</div>
                <p className="text-zinc-500 text-xs mt-0.5">No está incluido en el programa de 1 mes</p>
              </div>
            </label>
          )}

          {needsUniformSize && (
            <div>
              <label className={cx.label}>Talla de uniforme *</label>
              <select
                value={form.tallaUniforme}
                onChange={(e) => handleInputChange('tallaUniforme', e.target.value)}
                className={cx.select}
              >
                <option value="">Seleccione talla</option>
                {TALLAS_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    Talla {t}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={cx.label}>¿Polos adicionales?</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
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
          </div>

          {needsPoloSize && (
            <div className="space-y-2">
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
        </div>
      </section>

      {/* Fechas */}
      <section className={cx.card + ' p-5'}>
        <h3 className="text-white text-sm font-semibold mb-4">5. Fechas del programa</h3>
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
                    <div
                      className={
                        isSelected
                          ? 'w-10 h-10 rounded-full bg-[#FA7B21] flex items-center justify-center font-bold text-white'
                          : 'w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-white/80'
                      }
                    >
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

          {/* Días tentativos */}
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

          {/* Fecha fin calculada */}
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

      {/* Código promocional */}
      <section className={cx.card + ' p-5'}>
        <h3 className="text-white text-sm font-semibold mb-4">6. Código promocional (opcional)</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={codigoInput}
            onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
            placeholder="AMAS-DESC50"
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
        <h3 className="text-white text-sm font-semibold mb-4">7. Resumen</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-zinc-400">
            <span>{NOMBRES_PROGRAMA[programa]}</span>
            <span className="text-white">S/ {precioBase}</span>
          </div>
          {programa === '1mes' && includeUniform && (
            <div className="flex justify-between text-zinc-400">
              <span>Uniforme adicional{codigoAplicado?.tipo === 'uniforme_gratis' && ' (gratis)'}</span>
              <span className={codigoAplicado?.tipo === 'uniforme_gratis' ? 'line-through text-zinc-500' : 'text-white'}>S/ 220</span>
            </div>
          )}
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
          {descuentoPorcentaje > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Descuento {descuentoPorcentaje}%</span>
              <span>- S/ {descuentoPorcentualMonto}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-3 border-t border-zinc-800">
            <span className="text-white font-bold text-base">TOTAL</span>
            <span className="text-[#FCA929] text-2xl font-bold">S/ {total}</span>
          </div>
        </div>
      </section>

      {/* Contrato firmado */}
      <section className={cx.card + ' p-5'}>
        <h3 className="text-white text-sm font-semibold mb-4">8. Contrato y firma</h3>
        <ContratoFirma datos={datosContrato} onFirmaCompleta={(firma) => setFirmaBase64(firma)} />
      </section>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pb-6">
        <button onClick={resetAll} className={cx.btnSecondary}>
          Limpiar
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !firmaBase64}
          className={cx.btnPrimary + ' flex items-center gap-2'}
        >
          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
          Registrar matrícula
        </button>
      </div>
    </div>
  );
}
