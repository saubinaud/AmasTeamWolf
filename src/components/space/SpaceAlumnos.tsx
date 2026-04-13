import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, Users, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '../../config/api';
import { cx, badgeColors } from './tokens';
import { Modal } from './Modal';
// Fechas — timeZone: America/Lima forzado
import { formatFecha } from './dateUtils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Alumno {
  id: number;
  nombre: string;
  dni: string;
  dni_apoderado?: string;
  nombre_apoderado?: string;
  categoria: string;
  cinturon_actual?: string;
  estado: 'activo' | 'inactivo' | 'congelado';
  programa?: string;
  clases_totales?: number;
  clases_asistidas?: number;
  clases_restantes?: number;
  telefono?: string;
  correo?: string;
}

interface Implemento {
  id: number;
  categoria: string;
  tipo: string;
  talla?: string;
  precio?: number;
  origen?: string;
  fecha_adquisicion?: string;
}

interface AlumnoDetalle extends Alumno {
  fecha_nacimiento?: string;
  telefono_apoderado?: string;
  correo_apoderado?: string;
  direccion?: string;
  programa_activo?: string;
  fecha_fin_plan?: string;
  estado_pago?: string;
  turno?: string;
  dias?: string;
  asistencias_total?: number;
  asistencias_recientes?: Array<{ fecha: string; hora: string; turno: string; asistio: string }>;
  inscripciones?: InscripcionMini[];
  implementos?: Implemento[];
  armas?: Implemento[];
}

interface InscripcionMini {
  id: number;
  programa: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado_pago: string;
  activa: boolean;
  clases_totales?: number;
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
  token,
  onUpdated,
}: {
  alumno: AlumnoDetalle | null;
  loading: boolean;
  onClose: () => void;
  token: string;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre_alumno: '', dni_alumno: '', fecha_nacimiento: '', categoria: '', estado: '',
    nombre_apoderado: '', telefono: '', correo: '', direccion: '',
  });

  // Sync form with alumno data when panel opens or alumno changes
  useEffect(() => {
    if (alumno) {
      setForm({
        nombre_alumno: alumno.nombre || '',
        dni_alumno: alumno.dni || '',
        fecha_nacimiento: alumno.fecha_nacimiento ? alumno.fecha_nacimiento.split('T')[0] : '',
        categoria: alumno.categoria || '',
        estado: alumno.estado || '',
        nombre_apoderado: alumno.nombre_apoderado || '',
        telefono: alumno.telefono_apoderado || '',
        correo: alumno.correo_apoderado || '',
        direccion: alumno.direccion || '',
      });
      setEditing(false);
    }
  }, [alumno]);

  const handleSave = async () => {
    if (!alumno) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/space/alumnos/${alumno.id}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Alumno actualizado');
        setEditing(false);
        onUpdated();
      } else {
        toast.error(data.error || 'Error al guardar');
      }
    } catch {
      toast.error('Error de conexion');
    } finally {
      setSaving(false);
    }
  };

  const patch = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Modal
      open={!!alumno || loading}
      onClose={() => { setEditing(false); onClose(); }}
      title={editing ? 'Editar alumno' : 'Detalle del alumno'}
      size="full-right"
      footer={editing ? (
        <>
          <button onClick={() => setEditing(false)} className={cx.btnSecondary}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} className={cx.btnPrimary + ' flex items-center gap-2'}>
            {saving && <Loader2 size={15} className="animate-spin" />}
            Guardar
          </button>
        </>
      ) : undefined}
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#FA7B21]" />
        </div>
      ) : alumno ? (
        <div className="space-y-6">
          {/* Edit button + Plan summary */}
          {!editing && (
            <>
              <button onClick={() => setEditing(true)} className={cx.btnSecondary + ' flex items-center gap-2 w-full justify-center'}>
                <Pencil size={14} /> Editar datos
              </button>

              {/* Plan activo + clases */}
              {alumno.programa_activo && (
                <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[#FA7B21] text-sm font-semibold">{alumno.programa_activo}</span>
                    {alumno.estado_pago && (
                      <span className={cx.badge(alumno.estado_pago?.toLowerCase() === 'pagado' ? badgeColors.green : badgeColors.yellow)}>
                        {alumno.estado_pago}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full">
                      <div
                        className="h-2 bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${alumno.clases_totales ? Math.min(100, ((alumno.clases_asistidas ?? 0) / alumno.clases_totales) * 100) : 0}%` }}
                      />
                    </div>
                    <span className="text-white text-sm font-bold">{alumno.clases_asistidas}/{alumno.clases_totales}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-zinc-800 rounded-lg p-2">
                      <p className="text-emerald-400 text-lg font-bold">{alumno.clases_asistidas}</p>
                      <p className="text-zinc-500 text-[10px]">Asistidas</p>
                    </div>
                    <div className="bg-zinc-800 rounded-lg p-2">
                      <p className="text-sky-400 text-lg font-bold">{alumno.clases_restantes}</p>
                      <p className="text-zinc-500 text-[10px]">Restantes</p>
                    </div>
                    <div className="bg-zinc-800 rounded-lg p-2">
                      <p className="text-white text-lg font-bold">{alumno.asistencias_total}</p>
                      <p className="text-zinc-500 text-[10px]">Total hist.</p>
                    </div>
                  </div>
                  {alumno.turno && <p className="text-zinc-500 text-xs">Turno: {alumno.turno} · {alumno.dias}</p>}
                  {alumno.fecha_fin_plan && <p className="text-zinc-500 text-xs">Vence: {formatFecha(alumno.fecha_fin_plan)}</p>}
                </div>
              )}
            </>
          )}

          {/* Datos del alumno */}
          <section>
            <h3 className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-3">Datos del alumno</h3>
            <div className="bg-zinc-900 rounded-xl p-4 space-y-3 border border-zinc-800">
              {editing ? (
                <>
                  <div><label className={cx.label}>Nombre completo</label><input value={form.nombre_alumno} onChange={e => patch('nombre_alumno', e.target.value)} className={cx.input} /></div>
                  <div><label className={cx.label}>DNI alumno</label><input value={form.dni_alumno} onChange={e => patch('dni_alumno', e.target.value)} className={cx.input} /></div>
                  <div><label className={cx.label}>Fecha nacimiento</label><input type="date" value={form.fecha_nacimiento} onChange={e => patch('fecha_nacimiento', e.target.value)} className={cx.input} /></div>
                  <div><label className={cx.label}>Categoria</label><input value={form.categoria} onChange={e => patch('categoria', e.target.value)} className={cx.input} placeholder="Ej: Mini, Niños, Adolescentes" /></div>
                  <div>
                    <label className={cx.label}>Estado</label>
                    <select value={form.estado} onChange={e => patch('estado', e.target.value)} className={cx.select}>
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                      <option value="congelado">Congelado</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  {[
                    ['Nombre', alumno.nombre || ''],
                    ['DNI', alumno.dni],
                    ['Nacimiento', formatFecha(alumno.fecha_nacimiento)],
                    ['Categoria', alumno.categoria],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-zinc-500 text-sm">{label}</span>
                      <span className="text-white text-sm font-medium">{value || '—'}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 text-sm">Estado</span>
                    <span className={cx.badge(ESTADO_BADGE[alumno.estado] ?? badgeColors.gray)}>{alumno.estado}</span>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Apoderado */}
          <section>
            <h3 className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-3">Apoderado</h3>
            <div className="bg-zinc-900 rounded-xl p-4 space-y-3 border border-zinc-800">
              {editing ? (
                <>
                  <div><label className={cx.label}>Nombre apoderado</label><input value={form.nombre_apoderado} onChange={e => patch('nombre_apoderado', e.target.value)} className={cx.input} /></div>
                  <div><label className={cx.label}>Telefono</label><input value={form.telefono} onChange={e => patch('telefono', e.target.value)} className={cx.input} placeholder="Ej: 989717412" /></div>
                  <div><label className={cx.label}>Correo</label><input type="email" value={form.correo} onChange={e => patch('correo', e.target.value)} className={cx.input} /></div>
                  <div><label className={cx.label}>Direccion</label><input value={form.direccion} onChange={e => patch('direccion', e.target.value)} className={cx.input} /></div>
                </>
              ) : (
                <>
                  {[
                    ['Nombre', alumno.nombre_apoderado],
                    ['Telefono', alumno.telefono_apoderado],
                    ['Correo', alumno.correo_apoderado],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-zinc-500 text-sm">{label}</span>
                      <span className="text-white text-sm">{value || '—'}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </section>

          {/* Inscripciones (solo lectura) */}
          {!editing && (
            <>
              <section>
                <h3 className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-3">Inscripciones</h3>
                {alumno.inscripciones && alumno.inscripciones.length > 0 ? (
                  <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                    <table className="w-full text-left text-sm">
                      <thead><tr className="border-b border-zinc-800">
                        <th className={cx.th}>Programa</th><th className={cx.th}>Inicio</th><th className={cx.th}>Fin</th>
                      </tr></thead>
                      <tbody>
                        {alumno.inscripciones.map(ins => (
                          <tr key={ins.id} className={cx.tr}>
                            <td className={cx.td + ' text-white font-medium'}>{ins.programa}</td>
                            <td className={cx.td + ' text-zinc-400'}>{formatFecha(ins.fecha_inicio)}</td>
                            <td className={cx.td + ' text-zinc-400'}>{formatFecha(ins.fecha_fin)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-zinc-500 text-sm">Sin inscripciones activas</p>
                )}
              </section>

              <section>
                <h3 className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-3">Asistencias (30 dias)</h3>
                <div className="bg-zinc-900 rounded-xl p-4 text-center border border-zinc-800">
                  <span className="text-2xl font-bold text-white">{alumno.asistencias_30d ?? 0}</span>
                  <span className="text-zinc-500 text-sm ml-2">asistencias</span>
                </div>
              </section>

              {/* Implementos */}
              {alumno.implementos && alumno.implementos.length > 0 && (
                <section>
                  <h3 className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-3">
                    Implementos ({alumno.implementos.length})
                  </h3>
                  <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                    {Object.entries(
                      alumno.implementos.reduce<Record<string, Implemento[]>>((acc, imp) => {
                        const cat = imp.categoria || 'otro';
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(imp);
                        return acc;
                      }, {})
                    ).map(([cat, items]) => (
                      <div key={cat} className="border-b border-zinc-800 last:border-0 p-4">
                        <p className="text-[10px] text-zinc-500 uppercase font-semibold mb-2">
                          {cat === 'arma' ? '⚔️ Armas' :
                           cat === 'uniforme' ? '🥋 Uniformes' :
                           cat === 'protector' ? '🛡️ Protectores' :
                           cat === 'polo' ? '👕 Polos' :
                           cat === 'accesorio' ? '✨ Accesorios' : '📦 Otros'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {items.map(imp => (
                            <div key={imp.id} className="bg-zinc-800 rounded-lg px-3 py-1.5 text-xs">
                              <span className="text-white font-medium">{imp.tipo}</span>
                              {imp.talla && <span className="text-zinc-500 ml-1">({imp.talla})</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      ) : null}
    </Modal>
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
          <Users size={40} className="mx-auto text-zinc-700 mb-3" />
          <p className="text-zinc-400 mb-1">Sin alumnos</p>
          <p className="text-zinc-500 text-sm">No se encontraron alumnos con los filtros actuales</p>
        </div>
      ) : (
        <div className={cx.card + ' overflow-hidden'}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className={cx.th}>Alumno</th>
                  <th className={cx.th}>DNI</th>
                  <th className={cx.th + ' hidden md:table-cell'}>Programa</th>
                  <th className={cx.th + ' hidden lg:table-cell'}>Clases</th>
                  <th className={cx.th + ' hidden sm:table-cell'}>Cinturon</th>
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
                    <td className={cx.td + ' whitespace-nowrap'}>
                      <div>
                        <p className="text-white font-medium">{a.nombre}</p>
                        <p className="text-zinc-500 text-xs">{a.nombre_apoderado || ''}</p>
                      </div>
                    </td>
                    <td className={cx.td + ' text-zinc-400 font-mono text-xs'}>{a.dni}</td>
                    <td className={cx.td + ' text-zinc-400 hidden md:table-cell'}>
                      {a.programa ? (
                        <span className="text-xs">{a.programa}</span>
                      ) : (
                        <span className="text-zinc-600 text-xs">Sin plan</span>
                      )}
                    </td>
                    <td className={cx.td + ' hidden lg:table-cell'}>
                      {a.clases_totales ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full max-w-16">
                            <div
                              className="h-1.5 bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, ((a.clases_asistidas || 0) / a.clases_totales) * 100)}%` }}
                            />
                          </div>
                          <span className="text-zinc-400 text-xs whitespace-nowrap">
                            {a.clases_asistidas}/{a.clases_totales}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-xs">—</span>
                      )}
                    </td>
                    <td className={cx.td + ' hidden sm:table-cell'}>
                      <span className="text-zinc-400 text-xs">{a.cinturon_actual || 'Blanco'}</span>
                    </td>
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
        token={token}
        onUpdated={() => { fetchAlumnos(); if (selectedId) fetchDetalle(selectedId); }}
      />
    </div>
  );
}
