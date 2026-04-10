import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search, User, Plus, X, Loader2, CheckCircle2, CalendarCheck,
  ArrowRight, AlertCircle, Trash2,
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

type Turno = 'Mañana' | 'Tarde' | 'Noche';
type Asistio = 'Sí' | 'No' | 'Tardanza';

interface FechaPendiente {
  fecha: string;
  turno: Turno;
  asistio: Asistio;
  observaciones: string;
}

interface Props {
  token: string;
}

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

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

  // Nueva fecha a agregar
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevoTurno, setNuevoTurno] = useState<Turno>('Tarde');
  const [nuevoAsistio, setNuevoAsistio] = useState<Asistio>('Sí');
  const [nuevaObs, setNuevaObs] = useState('');

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
  }, []);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-white text-xl font-bold">Registrar asistencias pasadas</h1>
        <p className="text-zinc-500 text-xs mt-1">
          Busca un alumno y agrega fechas de asistencia pasadas. Útil para migrar datos históricos
          o corregir asistencias no registradas por QR.
        </p>
      </div>

      {/* Success banner */}
      {lastResult && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
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
        <h3 className="text-white text-sm font-semibold mb-4">1. Buscar alumno</h3>
        <div className="relative" ref={resultsRef}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
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
                    <span className="flex-1">{nombre}</span>
                    {dni && <span className="text-zinc-500 text-xs">{dni}</span>}
                    {a.estado === 'Inactivo' && (
                      <span className={cx.badge(badgeColors.gray)}>Inactivo</span>
                    )}
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
        </div>

        {alumnoSel && (
          <div className="mt-4 flex items-start gap-3 p-3 rounded-xl bg-zinc-800 border border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-[#FA7B21]/15 flex items-center justify-center shrink-0">
              <User size={18} className="text-[#FA7B21]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold">{alumnoSel.nombre_alumno ?? alumnoSel.nombre}</p>
              <p className="text-zinc-500 text-xs">
                ID #{alumnoSel.id}
                {alumnoSel.dni_alumno && ` · DNI ${alumnoSel.dni_alumno}`}
                {alumnoSel.estado && ` · ${alumnoSel.estado}`}
              </p>
              {loadingExistentes ? (
                <p className="text-zinc-500 text-xs mt-1">Cargando asistencias...</p>
              ) : (
                <p className="text-zinc-500 text-xs mt-1">
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
            <h3 className="text-white text-sm font-semibold mb-4">2. Agregar fechas de asistencia</h3>
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
                  <label className={cx.label}>Turno</label>
                  <select
                    value={nuevoTurno}
                    onChange={(e) => setNuevoTurno(e.target.value as Turno)}
                    className={cx.select}
                  >
                    <option value="Mañana">Mañana</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noche">Noche</option>
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
          </section>

          {/* Lista pendientes */}
          {fechasPendientes.length > 0 && (
            <section className={cx.card + ' p-5'}>
              <h3 className="text-white text-sm font-semibold mb-4">
                3. Revisar y guardar ({fechasPendientes.length} fechas)
              </h3>
              <div className="space-y-2 mb-4">
                {fechasPendientes.map((p) => (
                  <div
                    key={p.fecha}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-800"
                  >
                    <CalendarCheck size={14} className="text-[#FA7B21] shrink-0" />
                    <span className="text-white text-sm font-medium">{formatFecha(p.fecha)}</span>
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
                      <span className="text-zinc-500 text-xs truncate flex-1">{p.observaciones}</span>
                    )}
                    <button
                      onClick={() => handleRemovePendiente(p.fecha)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-auto"
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
              <h3 className="text-white text-sm font-semibold mb-3">
                Asistencias ya registradas ({asistenciasExistentes.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                {asistenciasExistentes.slice(0, 60).map((a) => (
                  <div
                    key={a.id}
                    className="px-2 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-800 text-xs"
                  >
                    <div className="text-white">{formatFecha(a.fecha)}</div>
                    <div className="text-zinc-500 text-[10px]">
                      {a.turno} · {a.metodo_registro}
                    </div>
                  </div>
                ))}
              </div>
              {asistenciasExistentes.length > 60 && (
                <p className="text-zinc-500 text-xs mt-2">
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
