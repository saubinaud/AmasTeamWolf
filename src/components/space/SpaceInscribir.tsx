import { useState, useCallback, useMemo } from 'react';
import { Loader2, UserPlus, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '../../config/api';
import { cx } from './tokens';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProgramaKey = '1mes' | 'full' | '6meses';

interface ProgramaDef {
  key: ProgramaKey;
  nombre: string;
  clases: number;
  precio: number;
  duracionMeses: number;
}

interface Props {
  token: string;
  onGoToInscritos?: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROGRAMAS: ProgramaDef[] = [
  { key: '1mes', nombre: 'Programa 1 Mes', clases: 8, precio: 330, duracionMeses: 1 },
  { key: 'full', nombre: 'Programa 3 Meses FULL', clases: 24, precio: 869, duracionMeses: 3 },
  { key: '6meses', nombre: 'Programa 6 Meses', clases: 48, precio: 1699, duracionMeses: 6 },
];

const CATEGORIAS = ['Niño', 'Adolescente', 'Adulto'] as const;

const TURNOS = [
  'Mañana (10:00 - 11:00)',
  'Mañana (11:00 - 12:00)',
  'Tarde (16:00 - 17:00)',
  'Tarde (17:00 - 18:00)',
  'Tarde (18:00 - 19:00)',
  'Noche (19:00 - 20:00)',
] as const;

const ESTADOS_PAGO = ['Pendiente', 'Parcial', 'Pagado'] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addMonthsISO(iso: string, months: number): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  d.setMonth(d.getMonth() + months);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

interface FormState {
  nombre_alumno: string;
  dni_alumno: string;
  fecha_nacimiento: string;
  categoria: string;
  nombre_apoderado: string;
  dni_apoderado: string;
  correo: string;
  telefono: string;
  direccion: string;
  programa_key: ProgramaKey;
  fecha_inicio: string;
  fecha_fin: string;
  clases_totales: string;
  turno: string;
  dias_tentativos: string;
  precio_programa: string;
  precio_pagado: string;
  descuento: string;
  estado_pago: (typeof ESTADOS_PAGO)[number];
  codigo_promocional: string;
}

function initialForm(): FormState {
  const prog = PROGRAMAS[1];
  const hoy = todayISO();
  return {
    nombre_alumno: '',
    dni_alumno: '',
    fecha_nacimiento: '',
    categoria: 'Niño',
    nombre_apoderado: '',
    dni_apoderado: '',
    correo: '',
    telefono: '',
    direccion: '',
    programa_key: prog.key,
    fecha_inicio: hoy,
    fecha_fin: addMonthsISO(hoy, prog.duracionMeses),
    clases_totales: String(prog.clases),
    turno: '',
    dias_tentativos: '',
    precio_programa: String(prog.precio),
    precio_pagado: '',
    descuento: '0',
    estado_pago: 'Pendiente',
    codigo_promocional: '',
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SpaceInscribir({ token, onGoToInscritos }: Props) {
  const [form, setForm] = useState<FormState>(initialForm());
  const [saving, setSaving] = useState(false);
  const [lastCreated, setLastCreated] = useState<{ nombre: string; programa: string } | null>(null);

  const programaDef = useMemo(
    () => PROGRAMAS.find((p) => p.key === form.programa_key) ?? PROGRAMAS[0],
    [form.programa_key],
  );

  const handleProgramaChange = useCallback((key: ProgramaKey) => {
    const def = PROGRAMAS.find((p) => p.key === key) ?? PROGRAMAS[0];
    setForm((f) => ({
      ...f,
      programa_key: key,
      clases_totales: String(def.clases),
      precio_programa: String(def.precio),
      fecha_fin: addMonthsISO(f.fecha_inicio, def.duracionMeses),
    }));
  }, []);

  const handleFechaInicioChange = useCallback((iso: string) => {
    setForm((f) => {
      const def = PROGRAMAS.find((p) => p.key === f.programa_key) ?? PROGRAMAS[0];
      return { ...f, fecha_inicio: iso, fecha_fin: addMonthsISO(iso, def.duracionMeses) };
    });
  }, []);

  const canSave =
    form.nombre_alumno.trim().length > 0 &&
    form.dni_alumno.trim().length >= 6 &&
    form.fecha_inicio.length > 0;

  const handleReset = useCallback(() => {
    setForm(initialForm());
    setLastCreated(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!canSave) {
      toast.error('Completa los campos requeridos (nombre, DNI, fecha inicio)');
      return;
    }
    setSaving(true);
    try {
      const body = {
        nombre_alumno: form.nombre_alumno.trim(),
        dni_alumno: form.dni_alumno.trim(),
        fecha_nacimiento: form.fecha_nacimiento || null,
        categoria: form.categoria,
        nombre_apoderado: form.nombre_apoderado.trim() || null,
        dni_apoderado: form.dni_apoderado.trim() || null,
        correo: form.correo.trim() || null,
        telefono: form.telefono.trim() || null,
        direccion: form.direccion.trim() || null,
        programa: programaDef.nombre,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin || null,
        clases_totales: parseInt(form.clases_totales, 10) || programaDef.clases,
        turno: form.turno || null,
        dias_tentativos: form.dias_tentativos || null,
        precio_programa: parseFloat(form.precio_programa) || 0,
        precio_pagado: parseFloat(form.precio_pagado) || 0,
        descuento: parseFloat(form.descuento) || 0,
        codigo_promocional: form.codigo_promocional || null,
        estado_pago: form.estado_pago,
      };

      const res = await fetch(`${API_BASE}/space/inscripciones`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        toast.error(data?.error ?? 'Error al guardar inscripción');
        return;
      }

      toast.success('Matrícula registrada');
      setLastCreated({ nombre: form.nombre_alumno.trim(), programa: programaDef.nombre });
      setForm(initialForm());
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  }, [canSave, form, programaDef, token]);

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-white text-xl font-bold">Inscribir alumno</h1>
        <p className="text-zinc-500 text-xs mt-1">
          Nueva matrícula. El alumno se crea si no existe, o se actualiza si ya está en el sistema por DNI.
        </p>
      </div>

      {/* Success banner */}
      {lastCreated && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
          <div className="flex-1">
            <p className="text-emerald-400 text-sm font-semibold">
              Matrícula registrada: {lastCreated.nombre}
            </p>
            <p className="text-emerald-400/70 text-xs">{lastCreated.programa}</p>
          </div>
          {onGoToInscritos && (
            <button
              onClick={onGoToInscritos}
              className="flex items-center gap-1 text-emerald-400 text-xs font-medium hover:text-emerald-300"
            >
              Ver inscritos <ArrowRight size={12} />
            </button>
          )}
        </div>
      )}

      {/* Datos alumno */}
      <section className={cx.card + ' p-5'}>
        <h3 className="text-white text-sm font-semibold mb-4">Datos del alumno</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={cx.label}>Nombre completo *</label>
              <input
                type="text"
                value={form.nombre_alumno}
                onChange={(e) => setForm((f) => ({ ...f, nombre_alumno: e.target.value }))}
                placeholder="Nombres y apellidos"
                className={cx.input}
              />
            </div>
            <div>
              <label className={cx.label}>DNI *</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.dni_alumno}
                onChange={(e) => setForm((f) => ({ ...f, dni_alumno: e.target.value }))}
                placeholder="12345678"
                className={cx.input}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={cx.label}>Fecha de nacimiento</label>
              <input
                type="date"
                value={form.fecha_nacimiento}
                onChange={(e) => setForm((f) => ({ ...f, fecha_nacimiento: e.target.value }))}
                className={cx.input}
              />
            </div>
            <div>
              <label className={cx.label}>Categoría</label>
              <select
                value={form.categoria}
                onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                className={cx.select}
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Datos apoderado */}
      <section className={cx.card + ' p-5'}>
        <h3 className="text-white text-sm font-semibold mb-4">Datos del apoderado</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={cx.label}>Nombre apoderado</label>
              <input
                type="text"
                value={form.nombre_apoderado}
                onChange={(e) => setForm((f) => ({ ...f, nombre_apoderado: e.target.value }))}
                className={cx.input}
              />
            </div>
            <div>
              <label className={cx.label}>DNI apoderado</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.dni_apoderado}
                onChange={(e) => setForm((f) => ({ ...f, dni_apoderado: e.target.value }))}
                className={cx.input}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={cx.label}>Correo</label>
              <input
                type="email"
                value={form.correo}
                onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))}
                className={cx.input}
              />
            </div>
            <div>
              <label className={cx.label}>Teléfono</label>
              <input
                type="tel"
                inputMode="numeric"
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                className={cx.input}
              />
            </div>
          </div>
          <div>
            <label className={cx.label}>Dirección</label>
            <input
              type="text"
              value={form.direccion}
              onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
              className={cx.input}
            />
          </div>
        </div>
      </section>

      {/* Programa */}
      <section className={cx.card + ' p-5'}>
        <h3 className="text-white text-sm font-semibold mb-4">Programa</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {PROGRAMAS.map((p) => (
              <button
                key={p.key}
                onClick={() => handleProgramaChange(p.key)}
                className={
                  form.programa_key === p.key
                    ? 'px-3 py-3 rounded-xl bg-[#FA7B21]/15 border border-[#FA7B21]/30 text-left'
                    : 'px-3 py-3 rounded-xl bg-zinc-800 border border-zinc-800 hover:bg-zinc-700 text-left transition-all'
                }
              >
                <div
                  className={
                    form.programa_key === p.key
                      ? 'text-[#FA7B21] text-sm font-semibold'
                      : 'text-white text-sm font-semibold'
                  }
                >
                  {p.nombre}
                </div>
                <div className="text-zinc-500 text-xs mt-0.5">
                  {p.clases} clases · S/ {p.precio}
                </div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={cx.label}>Fecha inicio *</label>
              <input
                type="date"
                value={form.fecha_inicio}
                onChange={(e) => handleFechaInicioChange(e.target.value)}
                className={cx.input}
              />
            </div>
            <div>
              <label className={cx.label}>Fecha fin</label>
              <input
                type="date"
                value={form.fecha_fin}
                onChange={(e) => setForm((f) => ({ ...f, fecha_fin: e.target.value }))}
                className={cx.input}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={cx.label}>Clases totales</label>
              <input
                type="number"
                min="0"
                value={form.clases_totales}
                onChange={(e) => setForm((f) => ({ ...f, clases_totales: e.target.value }))}
                className={cx.input}
              />
            </div>
            <div>
              <label className={cx.label}>Turno</label>
              <select
                value={form.turno}
                onChange={(e) => setForm((f) => ({ ...f, turno: e.target.value }))}
                className={cx.select}
              >
                <option value="">Sin especificar</option>
                {TURNOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={cx.label}>Días tentativos</label>
            <input
              type="text"
              value={form.dias_tentativos}
              onChange={(e) => setForm((f) => ({ ...f, dias_tentativos: e.target.value }))}
              placeholder="Ej: Lunes, miércoles y viernes"
              className={cx.input}
            />
          </div>
        </div>
      </section>

      {/* Pago */}
      <section className={cx.card + ' p-5'}>
        <h3 className="text-white text-sm font-semibold mb-4">Pago</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={cx.label}>Precio programa</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.precio_programa}
                onChange={(e) => setForm((f) => ({ ...f, precio_programa: e.target.value }))}
                className={cx.input}
              />
            </div>
            <div>
              <label className={cx.label}>Precio pagado</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.precio_pagado}
                onChange={(e) => setForm((f) => ({ ...f, precio_pagado: e.target.value }))}
                placeholder="0.00"
                className={cx.input}
              />
            </div>
            <div>
              <label className={cx.label}>Descuento</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.descuento}
                onChange={(e) => setForm((f) => ({ ...f, descuento: e.target.value }))}
                className={cx.input}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={cx.label}>Estado de pago</label>
              <select
                value={form.estado_pago}
                onChange={(e) =>
                  setForm((f) => ({ ...f, estado_pago: e.target.value as FormState['estado_pago'] }))
                }
                className={cx.select}
              >
                {ESTADOS_PAGO.map((ep) => (
                  <option key={ep} value={ep}>
                    {ep}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={cx.label}>Código promocional</label>
              <input
                type="text"
                value={form.codigo_promocional}
                onChange={(e) => setForm((f) => ({ ...f, codigo_promocional: e.target.value }))}
                placeholder="Opcional"
                className={cx.input}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pb-4">
        <button onClick={handleReset} className={cx.btnSecondary}>
          Limpiar
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !canSave}
          className={cx.btnPrimary + ' flex items-center gap-2'}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
          Registrar matrícula
        </button>
      </div>
    </div>
  );
}
