import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search, User, Plus, X, Loader2, CheckCircle2, CalendarCheck,
  ArrowRight, AlertCircle, Trash2, ClipboardPaste, Calendar, Wand2,
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '../../config/api';
import { cx, badgeColors } from './tokens';
import { formatFecha } from './dateUtils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AlumnoBusqueda {
  id: number;
  nombre_alumno?: string;
  nombre?: string;
  dni_alumno?: string;
  dni?: string;
  estado?: string;
}

interface AsistenciaExistente {
  id: number;
  fecha: string;
  turno: string;
  asistio: string;
  metodo_registro: string;
}

// El campo "turno" en la BD guarda el nombre de la clase, no un turno horario.
type Clase = 'Súper Baby Wolf' | 'Baby Wolf' | 'Little Wolf' | 'Junior Wolf' | 'Adolescentes Wolf';
type Asistio = 'Sí' | 'No' | 'Tardanza';

const CLASES: Clase[] = [
  'Súper Baby Wolf',
  'Baby Wolf',
  'Little Wolf',
  'Junior Wolf',
  'Adolescentes Wolf',
];

interface FechaPendiente {
  fecha: string;
  turno: Clase;
  asistio: Asistio;
  observaciones: string;
}

type Modo = 'individual' | 'lote' | 'rango';

interface Props {
  token: string;
}

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// ---------------------------------------------------------------------------
// Date parsing helpers — múltiples formatos
// ---------------------------------------------------------------------------

/**
 * Intenta parsear una fecha en varios formatos comunes.
 * Devuelve string ISO YYYY-MM-DD o null si no se puede.
 */
function parseFechaFlexible(raw: string): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;

  // Formato 1: YYYY-MM-DD o YYYY/MM/DD
  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (m) {
    const y = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10);
    const d = parseInt(m[3], 10);
    return validateAndFormat(y, mo, d);
  }

  // Formato 2: DD/MM/YYYY o DD-MM-YYYY o DD.MM.YYYY
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) {
    const d = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10);
    const y = parseInt(m[3], 10);
    return validateAndFormat(y, mo, d);
  }

  // Formato 3: DD/MM/YY (año de 2 dígitos — asumir 2000+)
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/);
  if (m) {
    const d = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10);
    const y = 2000 + parseInt(m[3], 10);
    return validateAndFormat(y, mo, d);
  }

  return null;
}

function validateAndFormat(y: number, mo: number, d: number): string | null {
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Genera fechas entre dos ISO date strings que caen en los días de semana seleccionados.
 *  dias: array de números 0-6 (0=Dom, 1=Lun, ..., 6=Sáb).
 */
function generarFechasRango(inicio: string, fin: string, dias: number[]): string[] {
  if (!inicio || !fin || dias.length === 0) return [];
  const start = new Date(inicio + 'T12:00:00');
  const end = new Date(fin + 'T12:00:00');
  if (start > end) return [];
  const diasSet = new Set(dias);
  const result: string[] = [];
  const cursor = new Date(start);
  const MAX = 400; // safety cap
  let count = 0;
  while (cursor <= end && count < MAX) {
    if (diasSet.has(cursor.getDay())) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, '0');
      const d = String(cursor.getDate()).padStart(2, '0');
      result.push(`${y}-${m}-${d}`);
    }
    cursor.setDate(cursor.getDate() + 1);
    count++;
  }
  return result;
}

const DIAS_SEMANA = [
  { num: 1, label: 'L', nombre: 'Lunes' },
  { num: 2, label: 'M', nombre: 'Martes' },
  { num: 3, label: 'X', nombre: 'Miércoles' },
  { num: 4, label: 'J', nombre: 'Jueves' },
  { num: 5, label: 'V', nombre: 'Viernes' },
  { num: 6, label: 'S', nombre: 'Sábado' },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SpaceAsistenciaHistorica({ token }: Props) {
  // Alumno seleccionado
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AlumnoBusqueda[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [alumnoSel, setAlumnoSel] = useState<AlumnoBusqueda | null>(null);
  const [asistenciasExistentes, setAsistenciasExistentes] = useState<AsistenciaExistente[]>([]);
  const [loadingExistentes, setLoadingExistentes] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Modo de carga
  const [modo, setModo] = useState<Modo>('individual');

  // Nueva fecha a agregar (modo individual)
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevoTurno, setNuevoTurno] = useState<Clase>('Baby Wolf');
  const [nuevoAsistio, setNuevoAsistio] = useState<Asistio>('Sí');
  const [nuevaObs, setNuevaObs] = useState('');

  // Modo LOTE: textarea con fechas
  const [loteTexto, setLoteTexto] = useState('');
  const [loteTurno, setLoteTurno] = useState<Clase>('Baby Wolf');
  const [loteAsistio, setLoteAsistio] = useState<Asistio>('Sí');
  const [loteObs, setLoteObs] = useState('');
  const [loteParsed, setLoteParsed] = useState<{ ok: string[]; invalid: string[] } | null>(null);

  // Modo RANGO: fechas + días semana
  const [rangoInicio, setRangoInicio] = useState('');
  const [rangoFin, setRangoFin] = useState('');
  const [rangoDias, setRangoDias] = useState<number[]>([]);
  const [rangoTurno, setRangoTurno] = useState<Clase>('Baby Wolf');
  const [rangoAsistio, setRangoAsistio] = useState<Asistio>('Sí');
  const [rangoObs, setRangoObs] = useState('');

  // Fechas acumuladas listas para registrar
  const [fechasPendientes, setFechasPendientes] = useState<FechaPendiente[]>([]);
  const [saving, setSaving] = useState(false);
  const [lastResult, setLastResult] = useState<{ insertadas: number; skipped: number } | null>(null);

  // -----------------------------------------------------------------------
  // Búsqueda alumno (debounced)
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    if (alumnoSel && alumnoSel.nombre_alumno === searchQuery) return;

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
  }, [searchQuery, token, alumnoSel]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) setShowResults(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleSelectAlumno = useCallback(
    async (a: AlumnoBusqueda) => {
      setAlumnoSel(a);
      setSearchQuery(a.nombre_alumno ?? a.nombre ?? '');
      setShowResults(false);
      setFechasPendientes([]);
      setLastResult(null);

      // Cargar asistencias históricas para mostrar cuáles ya tiene
      setLoadingExistentes(true);
      try {
        const res = await fetch(
          `${API_BASE}/space/asistencia/por-alumno/${a.id}`,
          { headers: authHeaders(token) },
        );
        const data = await res.json();
        const registros: AsistenciaExistente[] = data?.data?.registros ?? [];
        setAsistenciasExistentes(registros);
      } catch {
        toast.error('Error al cargar asistencias del alumno');
        setAsistenciasExistentes([]);
      } finally {
        setLoadingExistentes(false);
      }
    },
    [token],
  );

  // -----------------------------------------------------------------------
  // Agregar fecha al batch
  // -----------------------------------------------------------------------

  const fechasExistentesSet = useMemo(() => {
    const s = new Set<string>();
    for (const a of asistenciasExistentes) {
      const iso = typeof a.fecha === 'string' ? a.fecha.slice(0, 10) : '';
      if (iso) s.add(iso);
    }
    for (const p of fechasPendientes) {
      s.add(p.fecha);
    }
    return s;
  }, [asistenciasExistentes, fechasPendientes]);

  const handleAddFecha = useCallback(() => {
    if (!nuevaFecha) {
      toast.error('Selecciona una fecha');
      return;
    }
    if (fechasExistentesSet.has(nuevaFecha)) {
      toast.error('Ya existe una asistencia para esa fecha');
      return;
    }
    setFechasPendientes((prev) => [
      ...prev,
      { fecha: nuevaFecha, turno: nuevoTurno, asistio: nuevoAsistio, observaciones: nuevaObs.trim() },
    ].sort((a, b) => a.fecha.localeCompare(b.fecha)));
    setNuevaFecha('');
    setNuevaObs('');
  }, [nuevaFecha, nuevoTurno, nuevoAsistio, nuevaObs, fechasExistentesSet]);

  const handleRemovePendiente = useCallback((fecha: string) => {
    setFechasPendientes((prev) => prev.filter((p) => p.fecha !== fecha));
  }, []);

  // ---------------------------------------------------------------------
  // MODO LOTE: parsear texto con fechas
  // ---------------------------------------------------------------------
  const handleParseLote = useCallback(() => {
    const lineas = loteTexto
      .split(/[\n,;]/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lineas.length === 0) {
      toast.error('Pega al menos una fecha');
      setLoteParsed(null);
      return;
    }
    const ok: string[] = [];
    const invalid: string[] = [];
    const seen = new Set<string>();
    for (const linea of lineas) {
      const iso = parseFechaFlexible(linea);
      if (!iso) {
        invalid.push(linea);
        continue;
      }
      if (seen.has(iso)) continue; // dedup interno
      seen.add(iso);
      ok.push(iso);
    }
    setLoteParsed({ ok, invalid });
    if (ok.length === 0) {
      toast.error('Ninguna fecha válida');
    } else {
      toast.success(`${ok.length} fecha${ok.length > 1 ? 's' : ''} parseada${ok.length > 1 ? 's' : ''}`);
    }
  }, [loteTexto]);

  const handleAgregarLoteAPendientes = useCallback(() => {
    if (!loteParsed || loteParsed.ok.length === 0) {
      toast.error('Primero parsea las fechas');
      return;
    }
    // Filtrar las que ya existen (en BD o en pendientes)
    const nuevas: FechaPendiente[] = [];
    let yaExistentes = 0;
    for (const iso of loteParsed.ok) {
      if (fechasExistentesSet.has(iso)) {
        yaExistentes++;
        continue;
      }
      nuevas.push({
        fecha: iso,
        turno: loteTurno,
        asistio: loteAsistio,
        observaciones: loteObs.trim(),
      });
    }
    if (nuevas.length === 0) {
      toast.error('Todas las fechas ya existen en BD');
      return;
    }
    setFechasPendientes((prev) =>
      [...prev, ...nuevas].sort((a, b) => a.fecha.localeCompare(b.fecha))
    );
    toast.success(
      `${nuevas.length} fecha${nuevas.length > 1 ? 's' : ''} agregada${nuevas.length > 1 ? 's' : ''}${
        yaExistentes > 0 ? ` (${yaExistentes} ya existían)` : ''
      }`
    );
    setLoteTexto('');
    setLoteParsed(null);
  }, [loteParsed, loteTurno, loteAsistio, loteObs, fechasExistentesSet]);

  // ---------------------------------------------------------------------
  // MODO RANGO: generar fechas según días semana
  // ---------------------------------------------------------------------
  const rangoFechasGeneradas = useMemo(() => {
    if (!rangoInicio || !rangoFin || rangoDias.length === 0) return [];
    return generarFechasRango(rangoInicio, rangoFin, rangoDias);
  }, [rangoInicio, rangoFin, rangoDias]);

  const handleAgregarRangoAPendientes = useCallback(() => {
    if (rangoFechasGeneradas.length === 0) {
      toast.error('Genera las fechas primero (elige rango y días)');
      return;
    }
    const nuevas: FechaPendiente[] = [];
    let yaExistentes = 0;
    for (const iso of rangoFechasGeneradas) {
      if (fechasExistentesSet.has(iso)) {
        yaExistentes++;
        continue;
      }
      nuevas.push({
        fecha: iso,
        turno: rangoTurno,
        asistio: rangoAsistio,
        observaciones: rangoObs.trim(),
      });
    }
    if (nuevas.length === 0) {
      toast.error('Todas las fechas generadas ya existen en BD');
      return;
    }
    setFechasPendientes((prev) =>
      [...prev, ...nuevas].sort((a, b) => a.fecha.localeCompare(b.fecha))
    );
    toast.success(
      `${nuevas.length} fecha${nuevas.length > 1 ? 's' : ''} agregada${nuevas.length > 1 ? 's' : ''}${
        yaExistentes > 0 ? ` (${yaExistentes} ya existían)` : ''
      }`
    );
    setRangoInicio('');
    setRangoFin('');
    setRangoDias([]);
    setRangoObs('');
  }, [rangoFechasGeneradas, rangoTurno, rangoAsistio, rangoObs, fechasExistentesSet]);

  const toggleRangoDia = useCallback((num: number) => {
    setRangoDias((prev) => (prev.includes(num) ? prev.filter((d) => d !== num) : [...prev, num]));
  }, []);

  // -----------------------------------------------------------------------
  // Guardar batch
  // -----------------------------------------------------------------------

  const handleGuardar = useCallback(async () => {
    if (!alumnoSel || fechasPendientes.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/space/asistencia/historica/batch`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({
          alumno_id: alumnoSel.id,
          fechas: fechasPendientes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error ?? 'Error al guardar');
        return;
      }
      const { insertadas, skipped_duplicadas } = data.data;
      toast.success(`${insertadas} asistencias registradas`);
      setLastResult({ insertadas, skipped: skipped_duplicadas });
      setFechasPendientes([]);

      // Recargar asistencias existentes
      if (alumnoSel) {
        const res2 = await fetch(
          `${API_BASE}/space/asistencia/por-alumno/${alumnoSel.id}`,
          { headers: authHeaders(token) },
        );
        const d2 = await res2.json();
        setAsistenciasExistentes(d2?.data?.registros ?? []);
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  }, [alumnoSel, fechasPendientes, token]);

  const handleReset = useCallback(() => {
    setAlumnoSel(null);
    setSearchQuery('');
    setFechasPendientes([]);
    setAsistenciasExistentes([]);
    setLastResult(null);
    setLoteTexto('');
    setLoteParsed(null);
    setRangoInicio('');
    setRangoFin('');
    setRangoDias([]);
  }, []);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-stone-900 text-xl font-bold">Registrar asistencias pasadas</h1>
        <p className="text-stone-400 text-xs mt-1">
          Busca un alumno y agrega fechas de asistencia pasadas. Útil para migrar datos históricos
          o corregir asistencias no registradas por QR.
        </p>
      </div>

      {/* Success banner */}
      {lastResult && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200">
          <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
          <div className="flex-1">
            <p className="text-emerald-400 text-sm font-semibold">
              {lastResult.insertadas} asistencias registradas
            </p>
            {lastResult.skipped > 0 && (
              <p className="text-emerald-400/70 text-xs">{lastResult.skipped} fechas omitidas (ya existían)</p>
            )}
          </div>
          <button onClick={() => setLastResult(null)} className={cx.btnIcon}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Buscar alumno */}
      <section className={cx.card + ' p-5'}>
        <h3 className="text-stone-900 text-sm font-semibold mb-4">1. Buscar alumno</h3>
        <div className="relative" ref={resultsRef}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!e.target.value) {
                setAlumnoSel(null);
                setAsistenciasExistentes([]);
              }
            }}
            placeholder="Buscar por nombre o DNI..."
            className={cx.input + ' pl-9'}
          />
          {searching && (
            <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 animate-spin" />
          )}
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-stone-50 border border-stone-200 rounded-xl max-h-48 overflow-y-auto shadow-xl">
              {searchResults.map((a) => {
                const nombre = a.nombre_alumno ?? a.nombre ?? '';
                const dni = a.dni_alumno ?? a.dni ?? '';
                return (
                  <button
                    key={a.id}
                    onClick={() => handleSelectAlumno(a)}
                    className="w-full text-left px-3.5 py-2.5 text-sm text-stone-900 hover:bg-stone-100 transition-colors flex items-center gap-2"
                  >
                    <User size={14} className="text-stone-400 shrink-0" />
                    <span className="flex-1">{nombre}</span>
                    {dni && <span className="text-stone-400 text-xs">{dni}</span>}
                    {a.estado === 'Inactivo' && (
                      <span className={cx.badge(badgeColors.gray)}>Inactivo</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {showResults && searchResults.length === 0 && searchQuery.length >= 2 && !searching && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm text-stone-400">
              Sin resultados
            </div>
          )}
        </div>

        {alumnoSel && (
          <div className="mt-4 flex items-start gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <User size={18} className="text-[var(--accent)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-stone-900 text-sm font-semibold">{alumnoSel.nombre_alumno ?? alumnoSel.nombre}</p>
              <p className="text-stone-400 text-xs">
                ID #{alumnoSel.id}
                {alumnoSel.dni_alumno && ` · DNI ${alumnoSel.dni_alumno}`}
                {alumnoSel.estado && ` · ${alumnoSel.estado}`}
              </p>
              {loadingExistentes ? (
                <p className="text-stone-400 text-xs mt-1">Cargando asistencias...</p>
              ) : (
                <p className="text-stone-400 text-xs mt-1">
                  {asistenciasExistentes.length} asistencias ya registradas en BD
                </p>
              )}
            </div>
            <button onClick={handleReset} className={cx.btnIcon} title="Cambiar alumno">
              <X size={16} />
            </button>
          </div>
        )}
      </section>

      {/* Agregar fechas */}
      {alumnoSel && (
        <>
          <section className={cx.card + ' p-5'}>
            <h3 className="text-stone-900 text-sm font-semibold mb-4">2. Agregar fechas de asistencia</h3>

            {/* Tabs de modo */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              <button
                onClick={() => setModo('individual')}
                className={
                  modo === 'individual'
                    ? 'flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-orange-50 border border-orange-200 text-[var(--accent)] text-xs font-semibold'
                    : 'flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-500 text-xs font-semibold hover:border-orange-200 transition-all'
                }
              >
                <Plus size={14} /> Individual
              </button>
              <button
                onClick={() => setModo('lote')}
                className={
                  modo === 'lote'
                    ? 'flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-orange-50 border border-orange-200 text-[var(--accent)] text-xs font-semibold'
                    : 'flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-500 text-xs font-semibold hover:border-orange-200 transition-all'
                }
              >
                <ClipboardPaste size={14} /> Pegar lote
              </button>
              <button
                onClick={() => setModo('rango')}
                className={
                  modo === 'rango'
                    ? 'flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-orange-50 border border-orange-200 text-[var(--accent)] text-xs font-semibold'
                    : 'flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-500 text-xs font-semibold hover:border-orange-200 transition-all'
                }
              >
                <Calendar size={14} /> Por rango
              </button>
            </div>

            {/* ========== MODO INDIVIDUAL ========== */}
            {modo === 'individual' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={cx.label}>Fecha *</label>
                    <input
                      type="date"
                      value={nuevaFecha}
                      onChange={(e) => setNuevaFecha(e.target.value)}
                      max={new Date().toISOString().slice(0, 10)}
                      className={cx.input}
                    />
                    {nuevaFecha && fechasExistentesSet.has(nuevaFecha) && (
                      <p className="text-amber-400 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> Ya existe asistencia para esa fecha
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={cx.label}>Clase</label>
                    <select
                      value={nuevoTurno}
                      onChange={(e) => setNuevoTurno(e.target.value as Clase)}
                      className={cx.select}
                    >
                      {CLASES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={cx.label}>Estado</label>
                    <select
                      value={nuevoAsistio}
                      onChange={(e) => setNuevoAsistio(e.target.value as Asistio)}
                      className={cx.select}
                    >
                      <option value="Sí">Asistió</option>
                      <option value="Tardanza">Tardanza</option>
                      <option value="No">No asistió</option>
                    </select>
                  </div>
                  <div>
                    <label className={cx.label}>Observaciones (opcional)</label>
                    <input
                      type="text"
                      value={nuevaObs}
                      onChange={(e) => setNuevaObs(e.target.value)}
                      placeholder="Notas internas"
                      className={cx.input}
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddFecha}
                  disabled={!nuevaFecha || fechasExistentesSet.has(nuevaFecha)}
                  className={cx.btnSecondary + ' flex items-center gap-2'}
                >
                  <Plus size={14} /> Agregar a la lista
                </button>
              </div>
            )}

            {/* ========== MODO LOTE (PEGAR TEXTO) ========== */}
            {modo === 'lote' && (
              <div className="space-y-4">
                <div>
                  <label className={cx.label}>Pegar fechas (una por línea)</label>
                  <textarea
                    value={loteTexto}
                    onChange={(e) => {
                      setLoteTexto(e.target.value);
                      setLoteParsed(null);
                    }}
                    placeholder={'Ejemplos válidos:\n2025-03-15\n2025-03-22\n15/03/2025\n22-03-2025\n15.03.25'}
                    rows={8}
                    className={cx.input + ' resize-y font-mono text-xs'}
                  />
                  <p className="text-stone-400 text-xs mt-1">
                    Acepta formatos: <code className="text-stone-500">YYYY-MM-DD</code>,{' '}
                    <code className="text-stone-500">DD/MM/YYYY</code>,{' '}
                    <code className="text-stone-500">DD-MM-YYYY</code>,{' '}
                    <code className="text-stone-500">DD.MM.YY</code>. Separa con salto de línea, coma o punto y coma.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={cx.label}>Clase para todas</label>
                    <select
                      value={loteTurno}
                      onChange={(e) => setLoteTurno(e.target.value as Clase)}
                      className={cx.select}
                    >
                      {CLASES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={cx.label}>Estado para todas</label>
                    <select
                      value={loteAsistio}
                      onChange={(e) => setLoteAsistio(e.target.value as Asistio)}
                      className={cx.select}
                    >
                      <option value="Sí">Asistió</option>
                      <option value="Tardanza">Tardanza</option>
                      <option value="No">No asistió</option>
                    </select>
                  </div>
                  <div>
                    <label className={cx.label}>Observaciones</label>
                    <input
                      type="text"
                      value={loteObs}
                      onChange={(e) => setLoteObs(e.target.value)}
                      placeholder="Opcional"
                      className={cx.input}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleParseLote}
                    disabled={!loteTexto.trim()}
                    className={cx.btnSecondary + ' flex items-center gap-2'}
                  >
                    <Wand2 size={14} /> Parsear fechas
                  </button>
                  {loteParsed && loteParsed.ok.length > 0 && (
                    <button
                      onClick={handleAgregarLoteAPendientes}
                      className={cx.btnPrimary + ' flex items-center gap-2'}
                    >
                      <Plus size={14} /> Agregar {loteParsed.ok.length} fechas a la lista
                    </button>
                  )}
                </div>

                {/* Preview del parseo */}
                {loteParsed && (
                  <div className="space-y-2">
                    {loteParsed.ok.length > 0 && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                        <p className="text-emerald-400 text-xs font-semibold mb-2">
                          ✓ {loteParsed.ok.length} fecha{loteParsed.ok.length > 1 ? 's' : ''} válida
                          {loteParsed.ok.length > 1 ? 's' : ''}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {loteParsed.ok.slice(0, 50).map((f) => {
                            const existe = fechasExistentesSet.has(f);
                            return (
                              <span
                                key={f}
                                className={
                                  existe
                                    ? 'inline-flex px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-400 line-through'
                                    : 'inline-flex px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-300'
                                }
                                title={existe ? 'Ya existe — se saltará' : 'Nueva'}
                              >
                                {f}
                              </span>
                            );
                          })}
                          {loteParsed.ok.length > 50 && (
                            <span className="text-stone-400 text-[10px]">+{loteParsed.ok.length - 50} más</span>
                          )}
                        </div>
                      </div>
                    )}
                    {loteParsed.invalid.length > 0 && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                        <p className="text-red-400 text-xs font-semibold mb-2">
                          ✗ {loteParsed.invalid.length} línea{loteParsed.invalid.length > 1 ? 's' : ''} inválida
                          {loteParsed.invalid.length > 1 ? 's' : ''}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {loteParsed.invalid.slice(0, 20).map((l, i) => (
                            <span key={i} className="inline-flex px-2 py-0.5 rounded text-[10px] bg-rose-50 text-red-300">
                              {l}
                            </span>
                          ))}
                          {loteParsed.invalid.length > 20 && (
                            <span className="text-stone-400 text-[10px]">+{loteParsed.invalid.length - 20} más</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ========== MODO RANGO ========== */}
            {modo === 'rango' && (
              <div className="space-y-4">
                <p className="text-stone-400 text-xs">
                  Genera automáticamente las fechas entre dos días filtrando por días de la semana.
                  Útil para cargar "todos los martes y jueves del 1 de marzo al 30 de abril".
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={cx.label}>Fecha inicio</label>
                    <input
                      type="date"
                      value={rangoInicio}
                      onChange={(e) => setRangoInicio(e.target.value)}
                      max={new Date().toISOString().slice(0, 10)}
                      className={cx.input}
                    />
                  </div>
                  <div>
                    <label className={cx.label}>Fecha fin</label>
                    <input
                      type="date"
                      value={rangoFin}
                      onChange={(e) => setRangoFin(e.target.value)}
                      max={new Date().toISOString().slice(0, 10)}
                      className={cx.input}
                    />
                  </div>
                </div>

                <div>
                  <label className={cx.label}>Días de la semana (selecciona uno o más)</label>
                  <div className="grid grid-cols-6 gap-2">
                    {DIAS_SEMANA.map((d) => {
                      const active = rangoDias.includes(d.num);
                      return (
                        <button
                          key={d.num}
                          onClick={() => toggleRangoDia(d.num)}
                          title={d.nombre}
                          className={
                            active
                              ? 'px-2 py-3 rounded-xl border-2 border-[var(--accent)] bg-orange-50 text-[var(--accent)] font-bold text-sm'
                              : 'px-2 py-3 rounded-xl border-2 border-stone-200 bg-stone-50 text-stone-500 font-bold text-sm hover:border-orange-200 transition-all'
                          }
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={cx.label}>Clase para todas</label>
                    <select
                      value={rangoTurno}
                      onChange={(e) => setRangoTurno(e.target.value as Clase)}
                      className={cx.select}
                    >
                      {CLASES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={cx.label}>Estado para todas</label>
                    <select
                      value={rangoAsistio}
                      onChange={(e) => setRangoAsistio(e.target.value as Asistio)}
                      className={cx.select}
                    >
                      <option value="Sí">Asistió</option>
                      <option value="Tardanza">Tardanza</option>
                      <option value="No">No asistió</option>
                    </select>
                  </div>
                  <div>
                    <label className={cx.label}>Observaciones</label>
                    <input
                      type="text"
                      value={rangoObs}
                      onChange={(e) => setRangoObs(e.target.value)}
                      placeholder="Opcional"
                      className={cx.input}
                    />
                  </div>
                </div>

                {/* Preview */}
                {rangoFechasGeneradas.length > 0 && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <p className="text-emerald-400 text-xs font-semibold mb-2">
                      ✓ Se generarán {rangoFechasGeneradas.length} fecha
                      {rangoFechasGeneradas.length > 1 ? 's' : ''}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {rangoFechasGeneradas.slice(0, 50).map((f) => {
                        const existe = fechasExistentesSet.has(f);
                        return (
                          <span
                            key={f}
                            className={
                              existe
                                ? 'inline-flex px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-400 line-through'
                                : 'inline-flex px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-300'
                            }
                            title={existe ? 'Ya existe — se saltará' : 'Nueva'}
                          >
                            {f}
                          </span>
                        );
                      })}
                      {rangoFechasGeneradas.length > 50 && (
                        <span className="text-stone-400 text-[10px]">+{rangoFechasGeneradas.length - 50} más</span>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleAgregarRangoAPendientes}
                  disabled={rangoFechasGeneradas.length === 0}
                  className={cx.btnPrimary + ' flex items-center gap-2'}
                >
                  <Plus size={14} /> Agregar {rangoFechasGeneradas.length} fechas a la lista
                </button>
              </div>
            )}
          </section>

          {/* Lista pendientes */}
          {fechasPendientes.length > 0 && (
            <section className={cx.card + ' p-5'}>
              <h3 className="text-stone-900 text-sm font-semibold mb-4">
                3. Revisar y guardar ({fechasPendientes.length} fechas)
              </h3>
              <div className="space-y-2 mb-4">
                {fechasPendientes.map((p) => (
                  <div
                    key={p.fecha}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200"
                  >
                    <CalendarCheck size={14} className="text-[var(--accent)] shrink-0" />
                    <span className="text-stone-900 text-sm font-medium">{formatFecha(p.fecha)}</span>
                    <span className={cx.badge(badgeColors.blue)}>{p.turno}</span>
                    <span
                      className={cx.badge(
                        p.asistio === 'Sí'
                          ? badgeColors.green
                          : p.asistio === 'Tardanza'
                            ? badgeColors.yellow
                            : badgeColors.red,
                      )}
                    >
                      {p.asistio === 'Sí' ? 'Asistió' : p.asistio}
                    </span>
                    {p.observaciones && (
                      <span className="text-stone-400 text-xs truncate flex-1">{p.observaciones}</span>
                    )}
                    <button
                      onClick={() => handleRemovePendiente(p.fecha)}
                      className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-rose-50 rounded-lg transition-colors ml-auto"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setFechasPendientes([])}
                  className={cx.btnSecondary}
                  disabled={saving}
                >
                  Limpiar
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={saving || fechasPendientes.length === 0}
                  className={cx.btnPrimary + ' flex items-center gap-2'}
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                  Registrar {fechasPendientes.length} asistencia{fechasPendientes.length > 1 ? 's' : ''}
                </button>
              </div>
            </section>
          )}

          {/* Asistencias existentes */}
          {asistenciasExistentes.length > 0 && (
            <section className={cx.card + ' p-5'}>
              <h3 className="text-stone-900 text-sm font-semibold mb-3">
                Asistencias ya registradas ({asistenciasExistentes.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                {asistenciasExistentes.slice(0, 60).map((a) => (
                  <div
                    key={a.id}
                    className="px-2 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-xs"
                  >
                    <div className="text-stone-900">{formatFecha(a.fecha)}</div>
                    <div className="text-stone-400 text-[10px]">
                      {a.turno} · {a.metodo_registro}
                    </div>
                  </div>
                ))}
              </div>
              {asistenciasExistentes.length > 60 && (
                <p className="text-stone-400 text-xs mt-2">
                  + {asistenciasExistentes.length - 60} más
                </p>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
