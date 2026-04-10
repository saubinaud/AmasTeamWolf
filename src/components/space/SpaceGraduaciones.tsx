import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, Check, Loader2, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '../../config/api';
import { cx, badgeColors } from './tokens';
import { Modal } from './Modal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Graduacion {
  id: number;
  alumno_id: number | null;
  nombre: string;
  apellido: string;
  nombre_alumno?: string;
  apellido_alumno?: string;
  rango: string;
  horario: string;
  turno: string;
  fecha: string;
  fecha_graduacion?: string;
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

interface SpaceGraduacionesProps {
  token: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RANGOS = [
  'Cinturon Blanco', 'Punta Amarilla', 'Cinturon Amarillo', 'Punta Verde',
  'Cinturon Verde', 'Punta Azul', 'Cinturon Azul', 'Punta Roja',
  'Cinturon Rojo', 'Punta Negra', 'Cinturon Negro',
];

const TURNOS = [
  { value: 'primer', label: 'Primer Turno' },
  { value: 'segundo', label: 'Segundo Turno' },
  { value: 'tercer', label: 'Tercer Turno' },
  { value: 'cuarto', label: 'Cuarto Turno' },
];

const EMPTY_FORM: FormData = {
  alumno_id: null, nombre: '', apellido: '', rango: RANGOS[0],
  horario: '', turno: 'primer', fecha: '', observaciones: '',
};

const ESTADO_PILL: Record<string, string> = {
  programada: badgeColors.yellow,
  completada: badgeColors.green,
  cancelada: badgeColors.gray,
};

const CORRECCION_PILL: Record<string, string> = {
  pendiente: badgeColors.yellow,
  resuelta: badgeColors.green,
  rechazada: badgeColors.red,
};

const SKELETON_KEYS = ['ls-1', 'ls-2', 'ls-3', 'ls-4', 'ls-5'] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function formatFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function turnoLabel(val: string): string {
  return TURNOS.find(t => t.value === val)?.label ?? val;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function GraduacionesTable({
  loading, graduaciones, onEdit, onDelete, onOpenCreate,
}: {
  loading: boolean;
  graduaciones: Graduacion[];
  onEdit: (g: Graduacion) => void;
  onDelete: (id: number) => void;
  onOpenCreate: () => void;
}) {
  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {SKELETON_KEYS.map(sk => (
          <div key={sk} className="flex gap-4 px-5 py-4 border-b border-zinc-800 last:border-0">
            <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse" />
            <div className="h-4 w-20 bg-zinc-800 rounded animate-pulse" />
            <div className="h-4 w-16 bg-zinc-800 rounded animate-pulse hidden sm:block" />
          </div>
        ))}
      </div>
    );
  }

  if (graduaciones.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl py-16 text-center">
        <GraduationCap size={40} className="mx-auto text-zinc-700 mb-3" />
        <p className="text-zinc-400 mb-1">Sin graduaciones</p>
        <p className="text-white/30 text-sm mb-5">Programa la primera graduacion para tus alumnos</p>
        <button
          onClick={onOpenCreate}
          className={cx.btnPrimary + ' inline-flex items-center gap-2'}
        >
          <Plus size={14} />
          Crear graduacion
        </button>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="px-5 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Alumno</th>
              <th className="px-5 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Rango</th>
              <th className="px-5 py-3 text-white/40 font-medium text-xs uppercase tracking-wider hidden md:table-cell">Turno</th>
              <th className="px-5 py-3 text-white/40 font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Fecha</th>
              <th className="px-5 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Estado</th>
              <th className="px-5 py-3 text-white/40 font-medium text-xs uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {graduaciones.map(g => (
              <tr key={g.id} className="border-b border-zinc-800 last:border-0">
                <td className="px-5 py-3.5 text-white font-medium whitespace-nowrap">
                  {g.nombre_alumno || g.nombre} {g.apellido_alumno || g.apellido}
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-[#FA7B21]/10 text-[#FA7B21]">
                    {g.rango}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-white/60 hidden md:table-cell">{turnoLabel(g.turno)}</td>
                <td className="px-5 py-3.5 text-white/60 hidden sm:table-cell">{formatFecha(g.fecha_graduacion || g.fecha)}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ESTADO_PILL[g.estado] ?? 'text-zinc-400'}`}>
                    {g.estado}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="inline-flex gap-1">
                    <button onClick={() => onEdit(g)} className={cx.btnIcon} title="Editar">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => onDelete(g.id)} className={cx.btnDanger} title="Eliminar">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CorreccionesTable({
  correcciones, onResolve, onReject,
}: {
  correcciones: Correccion[];
  onResolve: (id: number) => void;
  onReject: (id: number) => void;
}) {
  if (correcciones.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl py-16 text-center">
        <Check size={40} className="mx-auto text-zinc-700 mb-3" />
        <p className="text-zinc-400 text-sm">No hay correcciones pendientes</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="px-5 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Nombre</th>
              <th className="px-5 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Comentario</th>
              <th className="px-5 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Estado</th>
              <th className="px-5 py-3 text-white/40 font-medium text-xs uppercase tracking-wider text-right">Accion</th>
            </tr>
          </thead>
          <tbody>
            {correcciones.map(c => (
              <tr key={c.id} className="border-b border-zinc-800 last:border-0">
                <td className="px-5 py-3.5 text-white font-medium">{c.nombre}</td>
                <td className="px-5 py-3.5 text-white/60 max-w-xs truncate">{c.comentario}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${CORRECCION_PILL[c.estado] ?? 'text-zinc-400'}`}>
                    {c.estado}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  {c.estado === 'pendiente' && (
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => onResolve(c.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                      >
                        Resolver
                      </button>
                      <button
                        onClick={() => onReject(c.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

function GraduacionModal({
  open, editingId, form, saving, alumnoQuery, alumnoResults, showAutocomplete, autocompleteRef, alumnoArmas,
  onClose, onSave, onFormChange, onAlumnoSearch, onSelectAlumno,
}: {
  open: boolean;
  editingId: number | null;
  form: FormData;
  saving: boolean;
  alumnoQuery: string;
  alumnoResults: AlumnoBusqueda[];
  showAutocomplete: boolean;
  autocompleteRef: React.RefObject<HTMLDivElement | null>;
  alumnoArmas: Array<{ id: number; tipo: string }>;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (patch: Partial<FormData>) => void;
  onAlumnoSearch: (q: string) => void;
  onSelectAlumno: (a: AlumnoBusqueda) => void;
}) {
  const inputClass = cx.input;
  const labelClass = cx.label;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingId ? 'Editar graduacion' : 'Nueva graduacion'}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className={cx.btnSecondary}>Cancelar</button>
          <button onClick={onSave} disabled={saving} className={cx.btnPrimary + ' flex items-center gap-2'}>
            {saving && <Loader2 size={15} className="animate-spin" />}
            Guardar
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div ref={autocompleteRef} className="relative">
          <label className={labelClass}>Alumno</label>
          <input type="text" placeholder="Buscar alumno..." value={alumnoQuery} onChange={e => onAlumnoSearch(e.target.value)} className={inputClass} />
          {showAutocomplete && alumnoResults.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl shadow-black/50">
              {alumnoResults.map(a => (
                <button key={a.id} onClick={() => onSelectAlumno(a)} className="w-full text-left px-4 py-3 text-white text-sm hover:bg-zinc-800 transition-colors border-b border-zinc-800 last:border-0">
                  {a.nombre} {a.apellido}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelClass}>Nombre</label><input type="text" value={form.nombre} onChange={e => onFormChange({ nombre: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Apellido</label><input type="text" value={form.apellido} onChange={e => onFormChange({ apellido: e.target.value })} className={inputClass} /></div>
        </div>

        {/* Armas del alumno (modalidades disponibles) */}
        {form.alumno_id && (
          <div className="bg-[#FA7B21]/5 border border-[#FA7B21]/20 rounded-xl p-4">
            <label className={labelClass + ' text-[#FA7B21]'}>⚔️ Modalidades / Armas disponibles</label>
            {alumnoArmas.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {alumnoArmas.map(arma => (
                  <span key={arma.id} className="inline-flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs">
                    <span className="text-[#FCA929]">⚔</span>
                    <span className="text-white font-medium">{arma.tipo}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-xs mt-2">
                Este alumno no tiene armas registradas. Puedes agregarlas en el módulo de Compras.
              </p>
            )}
          </div>
        )}
        <div><label className={labelClass}>Rango</label><select value={form.rango} onChange={e => onFormChange({ rango: e.target.value })} className={cx.select}>{RANGOS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelClass}>Horario</label><input type="text" placeholder="3:30 PM" value={form.horario} onChange={e => onFormChange({ horario: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Turno</label><select value={form.turno} onChange={e => onFormChange({ turno: e.target.value })} className={cx.select}>{TURNOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
        </div>
        <div><label className={labelClass}>Fecha</label><input type="date" value={form.fecha} onChange={e => onFormChange({ fecha: e.target.value })} className={inputClass} /></div>
        <div><label className={labelClass}>Observaciones</label><textarea value={form.observaciones} onChange={e => onFormChange({ observaciones: e.target.value })} rows={3} placeholder="Opcional..." className={inputClass + ' resize-none'} /></div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SpaceGraduaciones({ token }: SpaceGraduacionesProps) {
  const [graduaciones, setGraduaciones] = useState<Graduacion[]>([]);
  const [stats, setStats] = useState<GraduacionStats>({ programadas: 0, completadas: 0, canceladas: 0 });
  const [correcciones, setCorrecciones] = useState<Correccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'graduaciones' | 'correcciones'>('graduaciones');
  const [search, setSearch] = useState('');
  const [filterTurno, setFilterTurno] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  // Autocomplete state
  const [alumnoQuery, setAlumnoQuery] = useState('');
  const [alumnoResults, setAlumnoResults] = useState<AlumnoBusqueda[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [alumnoArmas, setAlumnoArmas] = useState<Array<{ id: number; tipo: string }>>([]);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search input
  const [searchInput, setSearchInput] = useState('');
  const debouncedRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -----------------------------------------------------------------------
  // Fetch
  // -----------------------------------------------------------------------

  const fetchGraduaciones = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterTurno) params.set('turno', filterTurno);
      if (filterEstado) params.set('estado', filterEstado);
      const qs = params.toString();
      const res = await fetch(`${API_BASE}/space/graduaciones${qs ? `?${qs}` : ''}`, { headers: authHeaders(token) });
      const data = await res.json();
      if (data.success !== false) {
        setGraduaciones(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
      }
    } catch { /* silent */ }
  }, [token, search, filterTurno, filterEstado]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/space/graduaciones/stats`, { headers: authHeaders(token) });
      const data = await res.json();
      if (data.stats) setStats(data.stats);
      else if (data.programadas !== undefined) setStats(data);
    } catch { /* silent */ }
  }, [token]);

  const fetchCorrecciones = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/space/graduaciones/correcciones`, { headers: authHeaders(token) });
      const data = await res.json();
      if (Array.isArray(data.data)) setCorrecciones(data.data);
      else if (Array.isArray(data)) setCorrecciones(data);
    } catch { /* silent */ }
  }, [token]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchGraduaciones(), fetchStats()]).finally(() => setLoading(false));
  }, [fetchGraduaciones, fetchStats]);

  useEffect(() => {
    if (tab === 'correcciones') fetchCorrecciones();
  }, [tab, fetchCorrecciones]);

  // Debounced search
  useEffect(() => {
    if (debouncedRef.current) clearTimeout(debouncedRef.current);
    debouncedRef.current = setTimeout(() => setSearch(searchInput), 300);
    return () => { if (debouncedRef.current) clearTimeout(debouncedRef.current); };
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

  const handleAlumnoSearch = useCallback((q: string) => {
    setAlumnoQuery(q);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (q.length < 2) { setAlumnoResults([]); setShowAutocomplete(false); return; }
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/space/graduaciones/alumnos/buscar?q=${encodeURIComponent(q)}`, { headers: authHeaders(token) });
        const data = await res.json();
        const list = Array.isArray(data.data) ? data.data : (Array.isArray(data.alumnos) ? data.alumnos : (Array.isArray(data) ? data : []));
        setAlumnoResults(list);
        setShowAutocomplete(list.length > 0);
      } catch {
        setAlumnoResults([]);
      }
    }, 300);
  }, [token]);

  const selectAlumno = useCallback(async (a: AlumnoBusqueda) => {
    setForm(f => ({ ...f, alumno_id: a.id, nombre: a.nombre, apellido: a.apellido }));
    setAlumnoQuery(`${a.nombre} ${a.apellido}`);
    setShowAutocomplete(false);
    // Fetch armas del alumno
    try {
      const res = await fetch(`${API_BASE}/space/compras/armas-alumno/${a.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success !== false) {
        setAlumnoArmas(Array.isArray(data.data) ? data.data : []);
      }
    } catch {
      setAlumnoArmas([]);
    }
  }, [token]);

  // -----------------------------------------------------------------------
  // CRUD
  // -----------------------------------------------------------------------

  const handleSave = useCallback(async () => {
    if (!form.nombre.trim() || !form.apellido.trim()) { toast.error('Nombre y apellido son obligatorios'); return; }
    if (!form.fecha) { toast.error('La fecha es obligatoria'); return; }
    setSaving(true);
    try {
      const url = editingId ? `${API_BASE}/space/graduaciones/${editingId}` : `${API_BASE}/space/graduaciones`;
      const method = editingId ? 'PUT' : 'POST';
      const payload = {
        ...form,
        nombre_alumno: form.nombre,
        apellido_alumno: form.apellido,
        fecha_graduacion: form.fecha,
      };
      const res = await fetch(url, { method, headers: authHeaders(token), body: JSON.stringify(payload) });
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
  }, [form, editingId, token, fetchGraduaciones, fetchStats]);

  const handleDelete = useCallback(async (id: number) => {
    if (!window.confirm('Eliminar esta graduacion?')) return;
    try {
      const res = await fetch(`${API_BASE}/space/graduaciones/${id}`, { method: 'DELETE', headers: authHeaders(token) });
      if (res.ok) { toast.success('Graduacion eliminada'); fetchGraduaciones(); fetchStats(); }
      else toast.error('Error al eliminar');
    } catch {
      toast.error('Error de conexion');
    }
  }, [token, fetchGraduaciones, fetchStats]);

  const handleCorreccion = useCallback(async (id: number, accion: 'resuelta' | 'rechazada') => {
    try {
      const res = await fetch(`${API_BASE}/space/graduaciones/correcciones/${id}`, {
        method: 'PUT', headers: authHeaders(token), body: JSON.stringify({ estado: accion }),
      });
      if (res.ok) { toast.success(accion === 'resuelta' ? 'Correccion resuelta' : 'Correccion rechazada'); fetchCorrecciones(); }
      else toast.error('Error al actualizar correccion');
    } catch {
      toast.error('Error de conexion');
    }
  }, [token, fetchCorrecciones]);

  // -----------------------------------------------------------------------
  // Modal helpers
  // -----------------------------------------------------------------------

  const openCreate = useCallback(() => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setAlumnoQuery('');
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((g: Graduacion) => {
    setEditingId(g.id);
    const nom = g.nombre_alumno || g.nombre || '';
    const ape = g.apellido_alumno || g.apellido || '';
    const fec = (g.fecha_graduacion || g.fecha || '').slice(0, 10);
    setForm({
      alumno_id: g.alumno_id, nombre: nom, apellido: ape, rango: g.rango,
      horario: g.horario, turno: g.turno, fecha: fec, observaciones: g.observaciones ?? '',
    });
    setAlumnoQuery(`${nom} ${ape}`);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setAlumnoQuery('');
    setShowAutocomplete(false);
  }, []);

  const handleFormChange = useCallback((patch: Partial<FormData>) => {
    setForm(f => ({ ...f, ...patch }));
  }, []);

  // -----------------------------------------------------------------------
  // Filter handlers
  // -----------------------------------------------------------------------

  const handleTurnoFilter = useCallback((value: string) => setFilterTurno(prev => prev === value ? '' : value), []);
  const handleEstadoFilter = useCallback((value: string) => setFilterEstado(prev => prev === value ? '' : value), []);
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value), []);

  const handleResolve = useCallback((id: number) => handleCorreccion(id, 'resuelta'), [handleCorreccion]);
  const handleReject = useCallback((id: number) => handleCorreccion(id, 'rechazada'), [handleCorreccion]);

  // -----------------------------------------------------------------------
  // Computed
  // -----------------------------------------------------------------------

  const totalCount = useMemo(() => stats.programadas + stats.completadas + stats.canceladas, [stats]);

  const turnoChipClass = useCallback((value: string) => {
    return filterTurno === value
      ? 'px-3 py-1.5 rounded-xl text-xs font-medium bg-[#FA7B21]/15 text-[#FA7B21] border border-[#FA7B21]/20'
      : 'px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-800 hover:bg-zinc-700 hover:text-zinc-300 transition-all duration-200';
  }, [filterTurno]);

  const estadoChipClass = useCallback((value: string) => {
    if (filterEstado !== value) return 'px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-800 hover:bg-zinc-700 hover:text-zinc-300 transition-all duration-200';
    if (value === 'programada') return 'px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20';
    return 'px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20';
  }, [filterEstado]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-xl font-bold">Graduaciones</h1>
          <div className="flex gap-3 mt-1 text-xs text-white/40">
            <span>{stats.programadas} programadas</span>
            <span>{stats.completadas} completadas</span>
            <span>{stats.canceladas} canceladas</span>
          </div>
        </div>
        <button
          onClick={openCreate}
          className={cx.btnPrimary + ' flex items-center gap-2 shrink-0'}
        >
          <Plus size={16} />
          Nueva graduacion
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-800 rounded-xl p-1 w-fit border border-zinc-800">
        <button
          onClick={() => setTab('graduaciones')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'graduaciones' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Graduaciones
        </button>
        <button
          onClick={() => setTab('correcciones')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'correcciones' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Correcciones
        </button>
      </div>

      {tab === 'graduaciones' && (
        <>
          {/* Search + filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchInput}
                onChange={handleSearchChange}
                className={cx.input + ' pl-9'}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {TURNOS.map(t => (
                <button
                  key={t.value}
                  onClick={() => handleTurnoFilter(t.value)}
                  className={`transition-all duration-200 ${turnoChipClass(t.value)}`}
                >
                  {t.label}
                </button>
              ))}
              <button
                onClick={() => handleEstadoFilter('programada')}
                className={`transition-all duration-200 ${estadoChipClass('programada')}`}
              >
                Programada
              </button>
              <button
                onClick={() => handleEstadoFilter('completada')}
                className={`transition-all duration-200 ${estadoChipClass('completada')}`}
              >
                Completada
              </button>
            </div>
          </div>

          <p className="text-white/30 text-xs">
            Mostrando {graduaciones.length} de {totalCount} graduaciones
          </p>

          <GraduacionesTable
            loading={loading}
            graduaciones={graduaciones}
            onEdit={openEdit}
            onDelete={handleDelete}
            onOpenCreate={openCreate}
          />
        </>
      )}

      {tab === 'correcciones' && (
        <CorreccionesTable
          correcciones={correcciones}
          onResolve={handleResolve}
          onReject={handleReject}
        />
      )}

      <GraduacionModal
        open={modalOpen}
        editingId={editingId}
        form={form}
        saving={saving}
        alumnoQuery={alumnoQuery}
        alumnoResults={alumnoResults}
        showAutocomplete={showAutocomplete}
        autocompleteRef={autocompleteRef}
        alumnoArmas={alumnoArmas}
        onClose={closeModal}
        onSave={handleSave}
        onFormChange={handleFormChange}
        onAlumnoSearch={handleAlumnoSearch}
        onSelectAlumno={selectAlumno}
      />
    </div>
  );
}
