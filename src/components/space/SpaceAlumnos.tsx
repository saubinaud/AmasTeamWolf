import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, X, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '../../config/api';
import { cx, badgeColors } from './tokens';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Alumno {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  fecha_nacimiento?: string;
  categoria: string;
  estado: 'activo' | 'inactivo' | 'congelado';
  telefono_apoderado?: string;
  nombre_apoderado?: string;
  correo_apoderado?: string;
}

interface AlumnoDetalle extends Alumno {
  inscripciones?: InscripcionMini[];
  asistencias_30d?: number;
}

interface InscripcionMini {
  id: number;
  programa: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado_pago: string;
  activa: boolean;
}

interface SpaceAlumnosProps {
  token: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ESTADOS = ['activo', 'inactivo', 'congelado'] as const;

const ESTADO_BADGE: Record<string, string> = {
  activo: badgeColors.green,
  inactivo: badgeColors.red,
  congelado: badgeColors.blue,
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

function AlumnosTableSkeleton() {
  return (
    <div className={cx.card + ' overflow-hidden'}>
      {SKELETON_KEYS.map(sk => (
        <div key={sk} className={'flex gap-4 px-4 py-4 ' + cx.tr}>
          <div className={cx.skeleton + ' h-4 w-32'} />
          <div className={cx.skeleton + ' h-4 w-20'} />
          <div className={cx.skeleton + ' h-4 w-16 hidden sm:block'} />
          <div className={cx.skeleton + ' h-4 w-16 hidden md:block'} />
        </div>
      ))}
    </div>
  );
}

function AlumnoDetailPanel({
  alumno,
  loading,
  onClose,
}: {
  alumno: AlumnoDetalle | null;
  loading: boolean;
  onClose: () => void;
}) {
  if (!alumno && !loading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-zinc-950 border-l border-zinc-800 w-full max-w-md h-full overflow-y-auto shadow-2xl shadow-black/50">
        <div className="h-1 bg-gradient-to-r from-[#FA7B21] to-[#FCA929]" />

        <div className="sticky top-0 z-10 bg-zinc-950 flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-white text-lg font-bold">Detalle del alumno</h2>
          <button onClick={onClose} className={cx.btnIcon}>
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#FA7B21]" />
          </div>
        ) : alumno ? (
          <div className="px-6 py-5 space-y-6">
            {/* Datos del alumno */}
            <section>
              <h3 className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">Datos del alumno</h3>
              <div className="bg-zinc-900 rounded-xl p-4 space-y-3 border border-zinc-800">
                <div className="flex justify-between">
                  <span className="text-zinc-500 text-sm">Nombre</span>
                  <span className="text-white text-sm font-medium">{alumno.nombre} {alumno.apellido}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50 text-sm">DNI</span>
                  <span className="text-white text-sm">{alumno.dni}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50 text-sm">Fecha nacimiento</span>
                  <span className="text-white text-sm">{formatFecha(alumno.fecha_nacimiento)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50 text-sm">Categoria</span>
                  <span className="text-white text-sm">{alumno.categoria}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">Estado</span>
                  <span className={cx.badge(ESTADO_BADGE[alumno.estado] ?? badgeColors.gray)}>
                    {alumno.estado}
                  </span>
                </div>
              </div>
            </section>

            {/* Datos del apoderado */}
            <section>
              <h3 className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">Datos del apoderado</h3>
              <div className="bg-zinc-900 rounded-xl p-4 space-y-3 border border-zinc-800">
                <div className="flex justify-between">
                  <span className="text-zinc-500 text-sm">Nombre</span>
                  <span className="text-white text-sm">{alumno.nombre_apoderado || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50 text-sm">Telefono</span>
                  <span className="text-white text-sm">{alumno.telefono_apoderado || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50 text-sm">Correo</span>
                  <span className="text-white text-sm">{alumno.correo_apoderado || '—'}</span>
                </div>
              </div>
            </section>

            {/* Inscripciones activas */}
            <section>
              <h3 className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">Inscripciones activas</h3>
              {alumno.inscripciones && alumno.inscripciones.length > 0 ? (
                <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className={cx.th}>Programa</th>
                        <th className={cx.th}>Inicio</th>
                        <th className={cx.th}>Fin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alumno.inscripciones.map(ins => (
                        <tr key={ins.id} className={cx.tr}>
                          <td className={cx.td + ' text-white font-medium'}>{ins.programa}</td>
                          <td className={cx.td + ' text-white/60'}>{formatFecha(ins.fecha_inicio)}</td>
                          <td className={cx.td + ' text-white/60'}>{formatFecha(ins.fecha_fin)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-white/30 text-sm">Sin inscripciones activas</p>
              )}
            </section>

            {/* Asistencias */}
            <section>
              <h3 className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">Asistencias (ultimos 30 dias)</h3>
              <div className="bg-zinc-900 rounded-xl p-4 text-center border border-zinc-800">
                <span className="text-2xl font-bold text-white">{alumno.asistencias_30d ?? 0}</span>
                <span className="text-white/40 text-sm ml-2">asistencias</span>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SpaceAlumnos({ token }: SpaceAlumnosProps) {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // Detail panel
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detalle, setDetalle] = useState<AlumnoDetalle | null>(null);
  const [detalleLoading, setDetalleLoading] = useState(false);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  const debouncedRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const limit = 20;

  // -----------------------------------------------------------------------
  // Fetch
  // -----------------------------------------------------------------------

  const fetchAlumnos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterEstado) params.set('estado', filterEstado);
      params.set('page', String(page));
      params.set('limit', String(limit));
      const qs = params.toString();
      const res = await fetch(`${API_BASE}/space/alumnos?${qs}`, { headers: authHeaders(token) });
      const data = await res.json();
      if (data.success !== false) {
        setAlumnos(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
        setTotal(data.total ?? data.data?.length ?? 0);
      }
    } catch {
      toast.error('Error al cargar alumnos');
    } finally {
      setLoading(false);
    }
  }, [token, search, filterEstado, page]);

  const fetchDetalle = useCallback(async (id: number) => {
    setDetalleLoading(true);
    setSelectedId(id);
    try {
      const res = await fetch(`${API_BASE}/space/alumnos/${id}`, { headers: authHeaders(token) });
      const data = await res.json();
      if (data.success !== false) {
        setDetalle(data.data ?? data);
      }
    } catch {
      toast.error('Error al cargar detalle');
    } finally {
      setDetalleLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAlumnos();
  }, [fetchAlumnos]);

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

  const handleEstadoFilter = useCallback((value: string) => {
    setFilterEstado(prev => prev === value ? '' : value);
    setPage(1);
  }, []);

  const handleRowClick = useCallback((id: number) => {
    fetchDetalle(id);
  }, [fetchDetalle]);

  const handleCloseDetail = useCallback(() => {
    setSelectedId(null);
    setDetalle(null);
  }, []);

  const handlePrevPage = useCallback(() => setPage(p => Math.max(1, p - 1)), []);
  const handleNextPage = useCallback(() => setPage(p => p + 1), []);

  // -----------------------------------------------------------------------
  // Computed
  // -----------------------------------------------------------------------

  const estadoChipClass = useCallback((value: string) => {
    if (filterEstado !== value) return cx.chip(false);
    if (value === 'activo') return 'px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20';
    if (value === 'inactivo') return 'px-3 py-1.5 rounded-xl text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/20';
    return 'px-3 py-1.5 rounded-xl text-xs font-medium bg-sky-500/15 text-sky-400 border border-sky-500/20';
  }, [filterEstado]);

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
        <h1 className="text-white text-xl font-bold">Alumnos</h1>
        <p className="text-white/40 text-xs mt-1">{total} alumnos registrados</p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Buscar por nombre o DNI..."
            value={searchInput}
            onChange={handleSearchChange}
            className={cx.input + ' pl-9'}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {ESTADOS.map(e => (
            <button
              key={e}
              onClick={() => handleEstadoFilter(e)}
              className={`transition-all duration-200 ${estadoChipClass(e)}`}
            >
              {e.charAt(0).toUpperCase() + e.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <p className="text-white/30 text-xs">
        Mostrando {showingFrom}–{showingTo} de {total} alumnos
      </p>

      {/* Table */}
      {loading ? (
        <AlumnosTableSkeleton />
      ) : alumnos.length === 0 ? (
        <div className={cx.card + ' py-16 text-center'}>
          <Users size={40} className="mx-auto text-white/10 mb-3" />
          <p className="text-white/50 mb-1">Sin alumnos</p>
          <p className="text-white/30 text-sm">No se encontraron alumnos con los filtros actuales</p>
        </div>
      ) : (
        <div className={cx.card + ' overflow-hidden'}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className={cx.th}>Nombre</th>
                  <th className={cx.th}>DNI</th>
                  <th className={cx.th + ' hidden sm:table-cell'}>Categoria</th>
                  <th className={cx.th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {alumnos.map(a => (
                  <tr
                    key={a.id}
                    onClick={() => handleRowClick(a.id)}
                    className={cx.tr + ' cursor-pointer'}
                  >
                    <td className={cx.td + ' text-white font-medium whitespace-nowrap'}>
                      {a.nombre} {a.apellido}
                    </td>
                    <td className={cx.td + ' text-white/60'}>{a.dni}</td>
                    <td className={cx.td + ' text-white/60 hidden sm:table-cell'}>{a.categoria}</td>
                    <td className={cx.td}>
                      <span className={cx.badge(ESTADO_BADGE[a.estado] ?? badgeColors.gray)}>
                        {a.estado}
                      </span>
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
          <span className="text-white/40 text-sm">
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

      {/* Detail panel */}
      <AlumnoDetailPanel
        alumno={detalle}
        loading={detalleLoading && selectedId !== null}
        onClose={handleCloseDetail}
      />
    </div>
  );
}
