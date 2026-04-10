import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, FileText, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '../../config/api';
import { cx, badgeColors } from './tokens';
import { Modal } from './Modal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Inscripcion {
  id: number;
  alumno_id: number;
  alumno_nombre: string;
  alumno_apellido: string;
  programa: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado_pago: 'pendiente' | 'parcial' | 'pagado' | 'vencido';
  activa: boolean;
}

interface SpaceInscripcionesProps {
  token: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ESTADO_PAGO_OPTIONS = ['pendiente', 'parcial', 'pagado', 'vencido'] as const;
const ACTIVA_OPTIONS = [
  { value: 'si', label: 'Activa' },
  { value: 'no', label: 'Inactiva' },
] as const;

const PAGO_BADGE: Record<string, string> = {
  pendiente: badgeColors.yellow,
  parcial: badgeColors.orange,
  pagado: badgeColors.green,
  vencido: badgeColors.red,
};

const SKELETON_KEYS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5'] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function formatFecha(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InscripcionesTableSkeleton() {
  return (
    <div className={cx.card + ' overflow-hidden'}>
      {SKELETON_KEYS.map(sk => (
        <div key={sk} className={'flex gap-4 px-4 py-4 ' + cx.tr}>
          <div className={cx.skeleton + ' h-4 w-28'} />
          <div className={cx.skeleton + ' h-4 w-24'} />
          <div className={cx.skeleton + ' h-4 w-20 hidden sm:block'} />
          <div className={cx.skeleton + ' h-4 w-16 hidden md:block'} />
        </div>
      ))}
    </div>
  );
}

function EditModal({
  inscripcion,
  saving,
  onClose,
  onSave,
}: {
  inscripcion: Inscripcion;
  saving: boolean;
  onClose: () => void;
  onSave: (id: number, patch: { estado_pago: string; activa: boolean }) => void;
}) {
  const [estadoPago, setEstadoPago] = useState(inscripcion.estado_pago);
  const [activa, setActiva] = useState(inscripcion.activa);

  const handleSave = useCallback(() => {
    onSave(inscripcion.id, { estado_pago: estadoPago, activa });
  }, [inscripcion.id, estadoPago, activa, onSave]);

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Editar inscripcion"
      footer={
        <>
          <button onClick={onClose} className={cx.btnSecondary}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} className={cx.btnPrimary + ' flex items-center gap-2'}>
            {saving && <Loader2 size={15} className="animate-spin" />}
            Guardar
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-white font-medium text-sm">{inscripcion.alumno_nombre} {inscripcion.alumno_apellido}</p>
          <p className="text-zinc-500 text-xs mt-0.5">{inscripcion.programa}</p>
        </div>
        <div>
          <label className={cx.label}>Estado de pago</label>
          <select value={estadoPago} onChange={e => setEstadoPago(e.target.value as Inscripcion['estado_pago'])} className={cx.select}>
            {ESTADO_PAGO_OPTIONS.map(ep => (
              <option key={ep} value={ep}>{ep.charAt(0).toUpperCase() + ep.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={cx.label}>Activa</label>
          <select value={activa ? 'si' : 'no'} onChange={e => setActiva(e.target.value === 'si')} className={cx.select}>
            <option value="si">Si</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SpaceInscripciones({ token }: SpaceInscripcionesProps) {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [programas, setProgramas] = useState<string[]>([]);
  const [filterPrograma, setFilterPrograma] = useState('');
  const [filterEstadoPago, setFilterEstadoPago] = useState('');
  const [filterActiva, setFilterActiva] = useState('');
  const [vencimientos, setVencimientos] = useState(0);

  // Edit modal
  const [editingInscripcion, setEditingInscripcion] = useState<Inscripcion | null>(null);
  const [saving, setSaving] = useState(false);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const debouncedRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const limit = 20;

  // -----------------------------------------------------------------------
  // Fetch
  // -----------------------------------------------------------------------

  const fetchInscripciones = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search) params.set('search', search);
      if (filterPrograma) params.set('programa', filterPrograma);
      if (filterEstadoPago) params.set('estado_pago', filterEstadoPago);
      if (filterActiva) params.set('activa', filterActiva);
      const qs = params.toString();
      const res = await fetch(`${API_BASE}/space/inscripciones?${qs}`, { headers: authHeaders(token) });
      const data = await res.json();
      if (data.success !== false) {
        setInscripciones(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
        setTotal(data.total ?? data.data?.length ?? 0);
        if (Array.isArray(data.programas)) setProgramas(data.programas);
      }
    } catch {
      toast.error('Error al cargar inscripciones');
    } finally {
      setLoading(false);
    }
  }, [token, search, filterPrograma, filterEstadoPago, filterActiva, page]);

  const fetchVencimientos = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/space/inscripciones/vencimientos`, { headers: authHeaders(token) });
      const data = await res.json();
      setVencimientos(data.count ?? data.total ?? 0);
    } catch { /* silent */ }
  }, [token]);

  useEffect(() => {
    fetchInscripciones();
  }, [fetchInscripciones]);

  useEffect(() => {
    fetchVencimientos();
  }, [fetchVencimientos]);

  // Debounced search
  useEffect(() => {
    if (debouncedRef.current) clearTimeout(debouncedRef.current);
    debouncedRef.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => { if (debouncedRef.current) clearTimeout(debouncedRef.current); };
  }, [searchInput]);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value), []);

  const handleProgramaFilter = useCallback((value: string) => {
    setFilterPrograma(prev => prev === value ? '' : value);
    setPage(1);
  }, []);

  const handleEstadoPagoFilter = useCallback((value: string) => {
    setFilterEstadoPago(prev => prev === value ? '' : value);
    setPage(1);
  }, []);

  const handleActivaFilter = useCallback((value: string) => {
    setFilterActiva(prev => prev === value ? '' : value);
    setPage(1);
  }, []);

  const handleRowClick = useCallback((ins: Inscripcion) => {
    setEditingInscripcion(ins);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditingInscripcion(null);
  }, []);

  const handleSaveEdit = useCallback(async (id: number, patch: { estado_pago: string; activa: boolean }) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/space/inscripciones/${id}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        toast.success('Inscripcion actualizada');
        setEditingInscripcion(null);
        fetchInscripciones();
        fetchVencimientos();
      } else {
        toast.error(data.message || 'Error al actualizar');
      }
    } catch {
      toast.error('Error de conexion');
    } finally {
      setSaving(false);
    }
  }, [token, fetchInscripciones, fetchVencimientos]);

  const handlePrevPage = useCallback(() => setPage(p => Math.max(1, p - 1)), []);
  const handleNextPage = useCallback(() => setPage(p => p + 1), []);

  // -----------------------------------------------------------------------
  // Computed
  // -----------------------------------------------------------------------

  const chipClass = useCallback((active: boolean, color?: string) => {
    if (!active) return cx.chip(false);
    if (color) return `${color} text-white`;
    return 'bg-[#FA7B21] text-white';
  }, []);

  const estadoPagoChipColor = useCallback((value: string) => {
    const map: Record<string, string> = {
      pendiente: 'bg-yellow-500',
      parcial: 'bg-orange-500',
      pagado: 'bg-emerald-500',
      vencido: 'bg-red-500',
    };
    return map[value] ?? 'bg-zinc-600';
  }, []);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total]);
  const showingFrom = useMemo(() => total === 0 ? 0 : (page - 1) * limit + 1, [page, total]);
  const showingTo = useMemo(() => Math.min(page * limit, total), [page, total]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-white text-xl font-bold">Inscripciones</h1>
        <p className="text-zinc-500 text-xs mt-1">{total} inscripciones registradas</p>
      </div>

      {/* Vencimientos alert */}
      {vencimientos > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <AlertTriangle size={18} className="text-yellow-400 shrink-0" />
          <p className="text-yellow-400 text-sm">
            <span className="font-semibold">{vencimientos}</span> inscripciones vencen esta semana
          </p>
        </div>
      )}

      {/* Search + filters */}
      <div className="flex flex-col gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por alumno..."
            value={searchInput}
            onChange={handleSearchChange}
            className={cx.input + ' pl-9'}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Programa chips */}
          {programas.map(p => (
            <button
              key={p}
              onClick={() => handleProgramaFilter(p)}
              className={`transition-all duration-200 ${chipClass(filterPrograma === p)}`}
            >
              {p}
            </button>
          ))}

          {/* Separator if both exist */}
          {programas.length > 0 && <div className="w-px bg-zinc-700 mx-1" />}

          {/* Estado pago chips */}
          {ESTADO_PAGO_OPTIONS.map(ep => (
            <button
              key={ep}
              onClick={() => handleEstadoPagoFilter(ep)}
              className={`transition-all duration-200 ${chipClass(filterEstadoPago === ep, estadoPagoChipColor(ep))}`}
            >
              {ep.charAt(0).toUpperCase() + ep.slice(1)}
            </button>
          ))}

          <div className="w-px bg-zinc-700 mx-1" />

          {/* Activa chips */}
          {ACTIVA_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleActivaFilter(opt.value)}
              className={`transition-all duration-200 ${chipClass(filterActiva === opt.value, opt.value === 'si' ? 'bg-emerald-500' : 'bg-zinc-600')}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-zinc-500 text-xs">
        Mostrando {showingFrom}–{showingTo} de {total} inscripciones
      </p>

      {/* Table */}
      {loading ? (
        <InscripcionesTableSkeleton />
      ) : inscripciones.length === 0 ? (
        <div className={cx.card + ' py-16 text-center'}>
          <FileText size={40} className="mx-auto text-zinc-700 mb-3" />
          <p className="text-zinc-400 mb-1">Sin inscripciones</p>
          <p className="text-zinc-500 text-sm">No se encontraron inscripciones con los filtros actuales</p>
        </div>
      ) : (
        <div className={cx.card + ' overflow-hidden'}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className={cx.th}>Alumno</th>
                  <th className={cx.th}>Programa</th>
                  <th className={cx.th + ' hidden sm:table-cell'}>Fecha inicio</th>
                  <th className={cx.th + ' hidden md:table-cell'}>Fecha fin</th>
                  <th className={cx.th}>Estado pago</th>
                  <th className={cx.th}>Activa</th>
                </tr>
              </thead>
              <tbody>
                {inscripciones.map(ins => (
                  <tr
                    key={ins.id}
                    onClick={() => handleRowClick(ins)}
                    className={cx.tr + ' hover:bg-zinc-800/50 cursor-pointer transition-colors'}
                  >
                    <td className={cx.td + ' text-white font-medium whitespace-nowrap'}>
                      {ins.alumno_nombre} {ins.alumno_apellido}
                    </td>
                    <td className={cx.td + ' text-white/60'}>{ins.programa}</td>
                    <td className={cx.td + ' text-white/60 hidden sm:table-cell'}>{formatFecha(ins.fecha_inicio)}</td>
                    <td className={cx.td + ' text-white/60 hidden md:table-cell'}>{formatFecha(ins.fecha_fin)}</td>
                    <td className={cx.td}>
                      <span className={cx.badge(PAGO_BADGE[ins.estado_pago] ?? badgeColors.gray)}>
                        {ins.estado_pago}
                      </span>
                    </td>
                    <td className={cx.td}>
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${ins.activa ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevPage}
            disabled={page <= 1}
            className={cx.btnSecondary + ' disabled:opacity-30'}
          >
            Anterior
          </button>
          <span className="text-zinc-500 text-sm">
            Pagina {page} de {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={page >= totalPages}
            className={cx.btnSecondary + ' disabled:opacity-30'}
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Edit modal */}
      {editingInscripcion && (
        <EditModal
          inscripcion={editingInscripcion}
          saving={saving}
          onClose={handleCloseEdit}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
