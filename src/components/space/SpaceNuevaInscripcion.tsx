import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Loader2, User, UserPlus, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '../../config/api';
import { cx } from './tokens';
import { Modal } from './Modal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Modo = 'matricula' | 'renovacion';

type ProgramaKey = '1mes' | 'full' | '6meses';

interface ProgramaDef {
  key: ProgramaKey;
  nombre: string;
  clases: number;
  precio: number;
  duracionMeses: number;
}

interface AlumnoBusqueda {
  id: number;
  nombre_alumno?: string;
  nombre?: string;
  dni_alumno?: string;
  dni?: string;
}

interface SpaceNuevaInscripcionProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  token: string;
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
  // Alumno
  alumno_id: number | null;
  nombre_alumno: string;
  dni_alumno: string;
  fecha_nacimiento: string;
  categoria: string;
  // Apoderado (solo matrícula)
  nombre_apoderado: string;
  dni_apoderado: string;
  correo: string;
  telefono: string;
  direccion: string;
  // Programa
  programa_key: ProgramaKey;
  fecha_inicio: string;
  fecha_fin: string;
  clases_totales: string;
  turno: string;
  dias_tentativos: string;
  // Pago
  precio_programa: string;
  precio_pagado: string;
  descuento: string;
  estado_pago: (typeof ESTADOS_PAGO)[number];
  codigo_promocional: string;
}

function initialForm(): FormState {
  const prog = PROGRAMAS[1]; // FULL por defecto
  const hoy = todayISO();
  return {
    alumno_id: null,
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

export function SpaceNuevaInscripcion({ open, onClose, onSaved, token }: SpaceNuevaInscripcionProps) {
  const [modo, setModo] = useState<Modo>('matricula');
  const [form, setForm] = useState<FormState>(initialForm());
  const [saving, setSaving] = useState(false);

  // Alumno search (renovación)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AlumnoBusqueda[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Reset cuando se abre
  useEffect(() => {
    if (!open) return;
    setForm(initialForm());
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setModo('matricula');
  }, [open]);

  // Auto-completar al cambiar programa
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

  // Búsqueda alumnos (renovación)
  useEffect(() => {
    if (!open || modo !== 'renovacion') return;
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    if (form.alumno_id && form.nombre_alumno === searchQuery) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `${API_BASE}/space/alumnos?search=${encodeURIComponent(searchQuery)}&limit=10`,
          { headers: authHeaders(token) },
        );
        const data = await res.json();
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
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
  }, [searchQuery, open, modo, token, form.alumno_id, form.nombre_alumno]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleSelectAlumno = useCallback((a: AlumnoBusqueda) => {
    const nombre = a.nombre_alumno ?? a.nombre ?? '';
    const dni = a.dni_alumno ?? a.dni ?? '';
    setForm((f) => ({
      ...f,
      alumno_id: a.id,
      nombre_alumno: nombre,
      dni_alumno: dni,
    }));
    setSearchQuery(nombre);
    setShowResults(false);
  }, []);

  // Validación
  const canSave = useMemo(() => {
    if (modo === 'renovacion') {
      return form.alumno_id !== null && form.programa_key && form.fecha_inicio;
    }
    return (
      form.nombre_alumno.trim().length > 0 &&
      form.dni_alumno.trim().length >= 6 &&
      form.programa_key !== undefined &&
      form.fecha_inicio.length > 0
    );
  }, [modo, form]);

  // Submit
  const handleSave = useCallback(async () => {
    if (!canSave) {
      toast.error('Completa los campos requeridos');
      return;
    }
    setSaving(true);
    try {
      const precioPrograma = parseFloat(form.precio_programa) || 0;
      const precioPagado = parseFloat(form.precio_pagado) || 0;
      const descuento = parseFloat(form.descuento) || 0;
      const clasesTotales = parseInt(form.clases_totales, 10) || programaDef.clases;

      const body: Record<string, unknown> = {
        programa: programaDef.nombre,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin || null,
        clases_totales: clasesTotales,
        turno: form.turno || null,
        dias_tentativos: form.dias_tentativos || null,
        precio_programa: precioPrograma,
        precio_pagado: precioPagado,
        descuento,
        codigo_promocional: form.codigo_promocional || null,
        estado_pago: form.estado_pago,
      };

      let url: string;
      if (modo === 'renovacion') {
        url = `${API_BASE}/space/inscripciones/renovar`;
        body.alumno_id = form.alumno_id;
      } else {
        url = `${API_BASE}/space/inscripciones`;
        body.nombre_alumno = form.nombre_alumno.trim();
        body.dni_alumno = form.dni_alumno.trim();
        body.fecha_nacimiento = form.fecha_nacimiento || null;
        body.categoria = form.categoria;
        body.nombre_apoderado = form.nombre_apoderado.trim() || null;
        body.dni_apoderado = form.dni_apoderado.trim() || null;
        body.correo = form.correo.trim() || null;
        body.telefono = form.telefono.trim() || null;
        body.direccion = form.direccion.trim() || null;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        toast.error(data?.error ?? 'Error al guardar inscripción');
        return;
      }

      toast.success(modo === 'renovacion' ? 'Renovación registrada' : 'Matrícula registrada');
      onSaved();
      onClose();
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  }, [canSave, form, modo, programaDef, token, onSaved, onClose]);

  const footer = (
    <>
      <button onClick={onClose} className={cx.btnSecondary}>
        Cancelar
      </button>
      <button
        onClick={handleSave}
        disabled={saving || !canSave}
        className={cx.btnPrimary + ' flex items-center gap-2'}
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : modo === 'renovacion' ? <RefreshCw size={14} /> : <UserPlus size={14} />}
        {modo === 'renovacion' ? 'Registrar renovación' : 'Registrar matrícula'}
      </button>
    </>
  );

  return (
    <Modal open={open} onClose={onClose} title="Nueva inscripción" footer={footer} size="lg">
      {/* Modo selector */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setModo('matricula')}
          className={
            modo === 'matricula'
              ? 'flex-1 px-4 py-2.5 rounded-xl bg-[#FA7B21]/15 text-[#FA7B21] border border-[#FA7B21]/30 text-sm font-medium flex items-center justify-center gap-2'
              : 'flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 border border-zinc-800 text-sm font-medium flex items-center justify-center gap-2 hover:bg-zinc-700 transition-all'
          }
        >
          <UserPlus size={14} /> Matrícula
        </button>
        <button
          onClick={() => setModo('renovacion')}
          className={
            modo === 'renovacion'
              ? 'flex-1 px-4 py-2.5 rounded-xl bg-[#FA7B21]/15 text-[#FA7B21] border border-[#FA7B21]/30 text-sm font-medium flex items-center justify-center gap-2'
              : 'flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 border border-zinc-800 text-sm font-medium flex items-center justify-center gap-2 hover:bg-zinc-700 transition-all'
          }
        >
          <RefreshCw size={14} /> Renovación
        </button>
      </div>

      <div className="space-y-5">
        {/* Datos alumno */}
        {modo === 'matricula' ? (
          <section>
            <h3 className="text-white text-sm font-semibold mb-3">Datos del alumno</h3>
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
        ) : (
          <section className="relative" ref={resultsRef}>
            <h3 className="text-white text-sm font-semibold mb-3">Alumno a renovar</h3>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setForm((f) => ({ ...f, alumno_id: null, nombre_alumno: '' }));
                }}
                placeholder="Buscar alumno por nombre o DNI..."
                className={cx.input + ' pl-9'}
              />
              {searching && (
                <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 animate-spin" />
              )}
            </div>
            {form.alumno_id && form.nombre_alumno && (
              <p className="text-xs text-emerald-400 mt-1.5">
                Seleccionado: {form.nombre_alumno} ({form.dni_alumno})
              </p>
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
                Sin resultados
              </div>
            )}
          </section>
        )}

        {/* Datos apoderado (solo matrícula) */}
        {modo === 'matricula' && (
          <section>
            <h3 className="text-white text-sm font-semibold mb-3">Datos del apoderado</h3>
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
        )}

        {/* Programa */}
        <section>
          <h3 className="text-white text-sm font-semibold mb-3">Programa</h3>
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
                  <div className={form.programa_key === p.key ? 'text-[#FA7B21] text-sm font-semibold' : 'text-white text-sm font-semibold'}>
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
        <section>
          <h3 className="text-white text-sm font-semibold mb-3">Pago</h3>
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
                  onChange={(e) => setForm((f) => ({ ...f, estado_pago: e.target.value as FormState['estado_pago'] }))}
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
      </div>
    </Modal>
  );
}
