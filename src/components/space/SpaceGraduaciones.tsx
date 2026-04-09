import { useState, useEffect, useRef, useCallback } from 'react';
import {
  GraduationCap, Plus, Pencil, Trash2, Search,
  Check, X, Calendar, Clock, Award, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '../../config/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Graduacion {
  id: number;
  alumno_id: number | null;
  nombre: string;
  apellido: string;
  rango: string;
  horario: string;
  turno: string;
  fecha: string;
  estado: 'programada' | 'completada' | 'cancelada';
  observaciones?: string;
}

interface GraduacionStats {
  programadas: number;
  completadas: number;
  canceladas: number;
}

interface Correccion {
  id: number;
  nombre: string;
  comentario: string;
  fecha: string;
  estado: 'pendiente' | 'resuelta' | 'rechazada';
}

interface AlumnoBusqueda {
  id: number;
  nombre: string;
  apellido: string;
}

interface SpaceGraduacionesProps {
  token: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RANGOS = [
  'Cinturon Blanco',
  'Punta Amarilla',
  'Cinturon Amarillo',
  'Punta Verde',
  'Cinturon Verde',
  'Punta Azul',
  'Cinturon Azul',
  'Punta Roja',
  'Cinturon Rojo',
  'Punta Negra',
  'Cinturon Negro',
];

const TURNOS = [
  { value: 'primer', label: 'Primer Turno' },
  { value: 'segundo', label: 'Segundo Turno' },
  { value: 'tercer', label: 'Tercer Turno' },
  { value: 'cuarto', label: 'Cuarto Turno' },
];

const TURNO_COLORS: Record<string, string> = {
  primer: 'bg-[#FA7B21]',
  segundo: 'bg-blue-500',
  tercer: 'bg-emerald-500',
  cuarto: 'bg-zinc-500',
};

const ESTADO_STYLES: Record<string, { bg: string; text: string }> = {
  programada: { bg: 'bg-yellow-500/15 border border-yellow-500/30', text: 'text-yellow-400' },
  completada: { bg: 'bg-emerald-500/15 border border-emerald-500/30', text: 'text-emerald-400' },
  cancelada: { bg: 'bg-zinc-500/15 border border-zinc-500/30', text: 'text-zinc-400' },
};

const CORRECCION_STYLES: Record<string, { bg: string; text: string }> = {
  pendiente: { bg: 'bg-yellow-500/15 border border-yellow-500/30', text: 'text-yellow-400' },
  resuelta: { bg: 'bg-emerald-500/15 border border-emerald-500/30', text: 'text-emerald-400' },
  rechazada: { bg: 'bg-red-500/15 border border-red-500/30', text: 'text-red-400' },
};

const EMPTY_FORM: FormData = {
  alumno_id: null,
  nombre: '',
  apellido: '',
  rango: RANGOS[0],
  horario: '',
  turno: 'primer',
  fecha: '',
  observaciones: '',
};

interface FormData {
  alumno_id: number | null;
  nombre: string;
  apellido: string;
  rango: string;
  horario: string;
  turno: string;
  fecha: string;
  observaciones: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function headers(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function formatFecha(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function turnoLabel(val: string) {
  return TURNOS.find(t => t.value === val)?.label ?? val;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SpaceGraduaciones({ token }: SpaceGraduacionesProps) {
  // State: data
  const [graduaciones, setGraduaciones] = useState<Graduacion[]>([]);
  const [stats, setStats] = useState<GraduacionStats>({ programadas: 0, completadas: 0, canceladas: 0 });
  const [correcciones, setCorrecciones] = useState<Correccion[]>([]);

  // State: UI
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'graduaciones' | 'correcciones'>('graduaciones');
  const [search, setSearch] = useState('');
  const [filterTurno, setFilterTurno] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // State: Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  // State: Autocomplete
  const [alumnoQuery, setAlumnoQuery] = useState('');
  const [alumnoResults, setAlumnoResults] = useState<AlumnoBusqueda[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -----------------------------------------------------------------------
  // Fetch helpers
  // -----------------------------------------------------------------------

  const fetchGraduaciones = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterTurno) params.set('turno', filterTurno);
      if (filterEstado) params.set('estado', filterEstado);
      const qs = params.toString();
      const url = `${API_BASE}/space/graduaciones${qs ? `?${qs}` : ''}`;
      const res = await fetch(url, { headers: headers(token) });
      const data = await res.json();
      if (data.success !== false) {
        setGraduaciones(Array.isArray(data.graduaciones) ? data.graduaciones : (Array.isArray(data) ? data : []));
      }
    } catch {
      // silent - list may be empty during API build
    }
  }, [token, search, filterTurno, filterEstado]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/space/graduaciones/stats`, { headers: headers(token) });
      const data = await res.json();
      if (data.programadas !== undefined) setStats(data);
      else if (data.stats) setStats(data.stats);
    } catch {
      // silent
    }
  }, [token]);

  const fetchCorrecciones = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/space/graduaciones/correcciones`, { headers: headers(token) });
      const data = await res.json();
      if (Array.isArray(data.correcciones)) setCorrecciones(data.correcciones);
      else if (Array.isArray(data)) setCorrecciones(data);
    } catch {
      // silent
    }
  }, [token]);

  // -----------------------------------------------------------------------
  // Effects
  // -----------------------------------------------------------------------

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchGraduaciones(), fetchStats()]).finally(() => setLoading(false));
  }, [fetchGraduaciones, fetchStats]);

  useEffect(() => {
    if (tab === 'correcciones') fetchCorrecciones();
  }, [tab, fetchCorrecciones]);

  // Debounced search
  const debouncedSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    if (debouncedSearchRef.current) clearTimeout(debouncedSearchRef.current);
    debouncedSearchRef.current = setTimeout(() => setSearch(searchInput), 300);
    return () => { if (debouncedSearchRef.current) clearTimeout(debouncedSearchRef.current); };
  }, [searchInput]);

  // Close autocomplete on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowAutocomplete(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // -----------------------------------------------------------------------
  // Alumno autocomplete
  // -----------------------------------------------------------------------

  function handleAlumnoSearch(q: string) {
    setAlumnoQuery(q);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (q.length < 2) { setAlumnoResults([]); setShowAutocomplete(false); return; }
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/space/graduaciones/alumnos/buscar?q=${encodeURIComponent(q)}`, { headers: headers(token) });
        const data = await res.json();
        const list = Array.isArray(data.alumnos) ? data.alumnos : (Array.isArray(data) ? data : []);
        setAlumnoResults(list);
        setShowAutocomplete(list.length > 0);
      } catch {
        setAlumnoResults([]);
      }
    }, 300);
  }

  function selectAlumno(a: AlumnoBusqueda) {
    setForm(f => ({ ...f, alumno_id: a.id, nombre: a.nombre, apellido: a.apellido }));
    setAlumnoQuery(`${a.nombre} ${a.apellido}`);
    setShowAutocomplete(false);
  }

  // -----------------------------------------------------------------------
  // CRUD
  // -----------------------------------------------------------------------

  async function handleSave() {
    if (!form.nombre.trim() || !form.apellido.trim()) {
      toast.error('Nombre y apellido son obligatorios');
      return;
    }
    if (!form.fecha) {
      toast.error('La fecha es obligatoria');
      return;
    }
    setSaving(true);
    try {
      const url = editingId
        ? `${API_BASE}/space/graduaciones/${editingId}`
        : `${API_BASE}/space/graduaciones`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: headers(token), body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        toast.success(editingId ? 'Graduacion actualizada' : 'Graduacion creada');
        closeModal();
        fetchGraduaciones();
        fetchStats();
      } else {
        toast.error(data.message || 'Error al guardar');
      }
    } catch {
      toast.error('Error de conexion');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Eliminar esta graduacion?')) return;
    try {
      const res = await fetch(`${API_BASE}/space/graduaciones/${id}`, {
        method: 'DELETE', headers: headers(token),
      });
      if (res.ok) {
        toast.success('Graduacion eliminada');
        fetchGraduaciones();
        fetchStats();
      } else {
        toast.error('Error al eliminar');
      }
    } catch {
      toast.error('Error de conexion');
    }
  }

  async function handleCorreccion(id: number, accion: 'resuelta' | 'rechazada') {
    try {
      const res = await fetch(`${API_BASE}/space/graduaciones/correcciones/${id}`, {
        method: 'PUT', headers: headers(token), body: JSON.stringify({ estado: accion }),
      });
      if (res.ok) {
        toast.success(accion === 'resuelta' ? 'Correccion resuelta' : 'Correccion rechazada');
        fetchCorrecciones();
      } else {
        toast.error('Error al actualizar correccion');
      }
    } catch {
      toast.error('Error de conexion');
    }
  }

  // -----------------------------------------------------------------------
  // Modal helpers
  // -----------------------------------------------------------------------

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setAlumnoQuery('');
    setModalOpen(true);
  }

  function openEdit(g: Graduacion) {
    setEditingId(g.id);
    setForm({
      alumno_id: g.alumno_id,
      nombre: g.nombre,
      apellido: g.apellido,
      rango: g.rango,
      horario: g.horario,
      turno: g.turno,
      fecha: g.fecha?.slice(0, 10) ?? '',
      observaciones: g.observaciones ?? '',
    });
    setAlumnoQuery(`${g.nombre} ${g.apellido}`);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setAlumnoQuery('');
    setShowAutocomplete(false);
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-5">
      {/* Top bar: title + stats + action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <GraduationCap size={24} className="text-[#FA7B21] shrink-0" />
          <h1 className="text-white text-xl font-bold">Graduaciones</h1>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FA7B21]/15 text-[#FA7B21] border border-[#FA7B21]/30">
            {stats.programadas} programadas
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            {stats.completadas} completadas
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">
            {stats.canceladas} canceladas
          </span>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#FA7B21] to-[#e06510] hover:brightness-110 active:scale-95 transition-all shrink-0"
        >
          <Plus size={16} />
          Nueva graduacion
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900/60 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('graduaciones')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'graduaciones' ? 'bg-[#FA7B21]/20 text-[#FA7B21]' : 'text-white/50 hover:text-white/80'
          }`}
        >
          Graduaciones
        </button>
        <button
          onClick={() => setTab('correcciones')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'correcciones' ? 'bg-[#FA7B21]/20 text-[#FA7B21]' : 'text-white/50 hover:text-white/80'
          }`}
        >
          Correcciones
        </button>
      </div>

      {tab === 'graduaciones' && (
        <>
          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-800 border border-white/20 text-white text-sm placeholder:text-white/30 focus:border-[#FA7B21] focus:ring-2 focus:ring-[#FA7B21]/30 outline-none transition-all"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {TURNOS.map(t => (
                <button
                  key={t.value}
                  onClick={() => setFilterTurno(filterTurno === t.value ? '' : t.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 ${
                    filterTurno === t.value
                      ? 'bg-[#FA7B21]/20 border-[#FA7B21]/40 text-[#FA7B21]'
                      : 'bg-zinc-800/60 border-white/10 text-white/50 hover:text-white/80'
                  }`}
                >
                  {t.label}
                </button>
              ))}
              <button
                onClick={() => setFilterEstado(filterEstado === 'programada' ? '' : 'programada')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 ${
                  filterEstado === 'programada'
                    ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                    : 'bg-zinc-800/60 border-white/10 text-white/50 hover:text-white/80'
                }`}
              >
                Programada
              </button>
              <button
                onClick={() => setFilterEstado(filterEstado === 'completada' ? '' : 'completada')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 ${
                  filterEstado === 'completada'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-zinc-800/60 border-white/10 text-white/50 hover:text-white/80'
                }`}
              >
                Completada
              </button>
            </div>
          </div>

          {/* Data table */}
          <div className="bg-zinc-900/80 border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-5 py-3.5 text-white/50 font-medium text-xs uppercase tracking-wider">Alumno</th>
                    <th className="px-5 py-3.5 text-white/50 font-medium text-xs uppercase tracking-wider">Rango</th>
                    <th className="px-5 py-3.5 text-white/50 font-medium text-xs uppercase tracking-wider hidden md:table-cell">Horario</th>
                    <th className="px-5 py-3.5 text-white/50 font-medium text-xs uppercase tracking-wider">Turno</th>
                    <th className="px-5 py-3.5 text-white/50 font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Fecha</th>
                    <th className="px-5 py-3.5 text-white/50 font-medium text-xs uppercase tracking-wider">Estado</th>
                    <th className="px-5 py-3.5 text-white/50 font-medium text-xs uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-white/5">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-4 bg-white/5 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : graduaciones.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center">
                        <GraduationCap size={40} className="mx-auto text-white/10 mb-3" />
                        <p className="text-white/50 text-sm mb-4">No hay graduaciones programadas</p>
                        <button
                          onClick={openCreate}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-[#FA7B21] to-[#e06510] hover:brightness-110 active:scale-95 transition-all"
                        >
                          <Plus size={14} />
                          Crear graduacion
                        </button>
                      </td>
                    </tr>
                  ) : (
                    graduaciones.map((g, idx) => (
                      <tr
                        key={g.id}
                        className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                          idx % 2 === 1 ? 'bg-zinc-800/30' : ''
                        }`}
                      >
                        <td className="px-5 py-3.5 text-white font-medium whitespace-nowrap">
                          {g.nombre.toUpperCase()} {g.apellido.toUpperCase()}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-[#FA7B21]/20 to-[#e06510]/20 text-[#FA7B21] border border-[#FA7B21]/30">
                            <Award size={12} />
                            {g.rango}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-white/70 hidden md:table-cell">
                          <span className="inline-flex items-center gap-1">
                            <Clock size={13} className="text-white/30" />
                            {g.horario}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-white/70 text-xs">
                            <span className={`w-2 h-2 rounded-full ${TURNO_COLORS[g.turno] ?? 'bg-zinc-500'}`} />
                            {turnoLabel(g.turno)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-white/70 hidden sm:table-cell">
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={13} className="text-white/30" />
                            {formatFecha(g.fecha)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${ESTADO_STYLES[g.estado]?.bg ?? ''} ${ESTADO_STYLES[g.estado]?.text ?? 'text-white/50'}`}>
                            {g.estado}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex gap-1">
                            <button
                              onClick={() => openEdit(g)}
                              className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                              title="Editar"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(g.id)}
                              className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all"
                              title="Eliminar"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Corrections tab */}
      {tab === 'correcciones' && (
        <div className="bg-zinc-900/80 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-5 py-3.5 text-white/50 font-medium text-xs uppercase tracking-wider">Nombre</th>
                  <th className="px-5 py-3.5 text-white/50 font-medium text-xs uppercase tracking-wider">Comentario</th>
                  <th className="px-5 py-3.5 text-white/50 font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Fecha</th>
                  <th className="px-5 py-3.5 text-white/50 font-medium text-xs uppercase tracking-wider">Estado</th>
                  <th className="px-5 py-3.5 text-white/50 font-medium text-xs uppercase tracking-wider text-right">Accion</th>
                </tr>
              </thead>
              <tbody>
                {correcciones.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <Check size={40} className="mx-auto text-white/10 mb-3" />
                      <p className="text-white/50 text-sm">No hay correcciones pendientes</p>
                    </td>
                  </tr>
                ) : (
                  correcciones.map((c, idx) => (
                    <tr
                      key={c.id}
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                        idx % 2 === 1 ? 'bg-zinc-800/30' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5 text-white font-medium">{c.nombre}</td>
                      <td className="px-5 py-3.5 text-white/70 max-w-xs truncate">{c.comentario}</td>
                      <td className="px-5 py-3.5 text-white/70 hidden sm:table-cell">{formatFecha(c.fecha)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${CORRECCION_STYLES[c.estado]?.bg ?? ''} ${CORRECCION_STYLES[c.estado]?.text ?? 'text-white/50'}`}>
                          {c.estado}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {c.estado === 'pendiente' && (
                          <div className="inline-flex gap-1">
                            <button
                              onClick={() => handleCorreccion(c.id, 'resuelta')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 active:scale-95 transition-all"
                            >
                              <Check size={13} />
                              Resolver
                            </button>
                            <button
                              onClick={() => handleCorreccion(c.id, 'rechazada')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 active:scale-95 transition-all"
                            >
                              <X size={13} />
                              Rechazar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal (Dialog overlay) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />

          {/* Dialog */}
          <div className="relative bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90dvh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-white text-lg font-bold">
                {editingId ? 'Editar graduacion' : 'Nueva graduacion'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Alumno autocomplete */}
              <div ref={autocompleteRef} className="relative">
                <label className="block text-white/50 text-xs font-medium mb-1.5 uppercase tracking-wider">Alumno</label>
                <input
                  type="text"
                  placeholder="Buscar alumno..."
                  value={alumnoQuery}
                  onChange={e => { handleAlumnoSearch(e.target.value); setAlumnoQuery(e.target.value); }}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-white/20 text-white text-base placeholder:text-white/30 focus:border-[#FA7B21] focus:ring-2 focus:ring-[#FA7B21]/30 outline-none transition-all"
                />
                {showAutocomplete && alumnoResults.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-zinc-800 border border-white/20 rounded-xl shadow-xl overflow-hidden">
                    {alumnoResults.map(a => (
                      <button
                        key={a.id}
                        onClick={() => selectAlumno(a)}
                        className="w-full text-left px-4 py-2.5 text-white text-sm hover:bg-white/10 transition-colors"
                      >
                        {a.nombre} {a.apellido}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Nombre y Apellido */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 text-xs font-medium mb-1.5 uppercase tracking-wider">Nombre</label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-white/20 text-white text-base placeholder:text-white/30 focus:border-[#FA7B21] focus:ring-2 focus:ring-[#FA7B21]/30 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs font-medium mb-1.5 uppercase tracking-wider">Apellido</label>
                  <input
                    type="text"
                    value={form.apellido}
                    onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-white/20 text-white text-base placeholder:text-white/30 focus:border-[#FA7B21] focus:ring-2 focus:ring-[#FA7B21]/30 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Rango */}
              <div>
                <label className="block text-white/50 text-xs font-medium mb-1.5 uppercase tracking-wider">Rango</label>
                <select
                  value={form.rango}
                  onChange={e => setForm(f => ({ ...f, rango: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-white/20 text-white text-base focus:border-[#FA7B21] focus:ring-2 focus:ring-[#FA7B21]/30 outline-none transition-all appearance-none"
                >
                  {RANGOS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Horario + Turno */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 text-xs font-medium mb-1.5 uppercase tracking-wider">Horario</label>
                  <input
                    type="text"
                    placeholder="3:30 PM"
                    value={form.horario}
                    onChange={e => setForm(f => ({ ...f, horario: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-white/20 text-white text-base placeholder:text-white/30 focus:border-[#FA7B21] focus:ring-2 focus:ring-[#FA7B21]/30 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs font-medium mb-1.5 uppercase tracking-wider">Turno</label>
                  <select
                    value={form.turno}
                    onChange={e => setForm(f => ({ ...f, turno: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-white/20 text-white text-base focus:border-[#FA7B21] focus:ring-2 focus:ring-[#FA7B21]/30 outline-none transition-all appearance-none"
                  >
                    {TURNOS.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-white/50 text-xs font-medium mb-1.5 uppercase tracking-wider">Fecha</label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-white/20 text-white text-base focus:border-[#FA7B21] focus:ring-2 focus:ring-[#FA7B21]/30 outline-none transition-all"
                />
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-white/50 text-xs font-medium mb-1.5 uppercase tracking-wider">Observaciones</label>
                <textarea
                  value={form.observaciones}
                  onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                  rows={3}
                  placeholder="Opcional..."
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-white/20 text-white text-base placeholder:text-white/30 focus:border-[#FA7B21] focus:ring-2 focus:ring-[#FA7B21]/30 outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10">
              <button
                onClick={closeModal}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 border border-white/20 hover:bg-white/5 active:scale-95 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#FA7B21] to-[#e06510] hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 disabled:pointer-events-none"
              >
                {saving && <Loader2 size={15} className="animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
