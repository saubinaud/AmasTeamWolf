import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare, Send, Users, Megaphone, User,
  Loader2, Plus, Trash2, Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '../../config/api';
import { cx, badgeColors, statGradients } from './tokens';
import { Modal } from './Modal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MensajeStats {
  total: number;
  difusiones: number;
  individuales: number;
}

interface Mensaje {
  id: number;
  asunto: string;
  contenido: string;
  tipo: 'difusion' | 'programa' | 'individual';
  destinatario: string;
  leidos: number;
  total_destinatarios: number;
  fecha: string;
}

interface Lectura {
  alumno_id: number;
  nombre: string;
  fecha_leido: string | null;
}

interface Programa {
  id: number;
  nombre: string;
}

interface AlumnoBusqueda {
  id: number;
  nombre: string;
  dni?: string;
}

interface SpaceMensajesProps {
  token: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LIMIT = 20;
const SKELETON_ROWS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5'] as const;

const TIPO_BADGE: Record<string, string> = {
  difusion: badgeColors.orange,
  programa: badgeColors.blue,
  individual: badgeColors.violet,
};

const TIPO_LABEL: Record<string, string> = {
  difusion: 'Difusion',
  programa: 'Programa',
  individual: 'Individual',
};

type TipoMensaje = 'difusion' | 'programa' | 'individual';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function formatFecha(iso: string | undefined): string {
  if (!iso) return '\u2014';
  try {
    return new Date(iso).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'America/Lima',
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatsBar({ stats, loading }: { stats: MensajeStats; loading: boolean }) {
  const items = [
    { label: 'Total enviados', value: stats.total, gradient: statGradients.blue, icon: <MessageSquare size={18} /> },
    { label: 'Difusiones', value: stats.difusiones, gradient: statGradients.orange, icon: <Megaphone size={18} /> },
    { label: 'Individuales', value: stats.individuales, gradient: statGradients.violet, icon: <User size={18} /> },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={`bg-gradient-to-br ${item.gradient.bg} border ${item.gradient.border} rounded-2xl p-4`}
        >
          {loading ? (
            <div className="space-y-2">
              <div className={cx.skeleton + ' h-4 w-16'} />
              <div className={cx.skeleton + ' h-7 w-12'} />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
                  {item.label}
                </span>
                <span className={item.gradient.icon}>{item.icon}</span>
              </div>
              <span className={`text-2xl font-bold ${item.gradient.text}`}>
                {item.value}
              </span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className={cx.card + ' overflow-hidden'}>
      {SKELETON_ROWS.map((sk) => (
        <div key={sk} className={'flex gap-4 px-4 py-4 ' + cx.tr}>
          <div className={cx.skeleton + ' h-4 w-40'} />
          <div className={cx.skeleton + ' h-4 w-20 hidden sm:block'} />
          <div className={cx.skeleton + ' h-4 w-28 hidden md:block'} />
          <div className={cx.skeleton + ' h-4 w-16'} />
          <div className={cx.skeleton + ' h-4 w-20 hidden lg:block'} />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className={cx.card + ' py-16 text-center'}>
      <MessageSquare size={40} className="mx-auto text-zinc-700 mb-3" />
      <p className="text-zinc-400 mb-1">Sin mensajes</p>
      <p className="text-zinc-500 text-sm">
        No se encontraron mensajes enviados
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Send Modal
// ---------------------------------------------------------------------------

function SendModal({
  open,
  onClose,
  onSent,
  token,
}: {
  open: boolean;
  onClose: () => void;
  onSent: () => void;
  token: string;
}) {
  const [tipo, setTipo] = useState<TipoMensaje>('difusion');
  const [programaId, setProgramaId] = useState<number | null>(null);
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [alumnoId, setAlumnoId] = useState<number | null>(null);
  const [alumnoNombre, setAlumnoNombre] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AlumnoBusqueda[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [asunto, setAsunto] = useState('');
  const [contenido, setContenido] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingProgramas, setLoadingProgramas] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Fetch programas when tipo changes to programa
  useEffect(() => {
    if (tipo !== 'programa') return;
    if (programas.length > 0) return;
    setLoadingProgramas(true);
    fetch(`${API_BASE}/space/mensajes/programas`, { headers: authHeaders(token) })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProgramas(data);
        else if (data.programas) setProgramas(data.programas);
      })
      .catch(() => toast.error('Error al cargar programas'))
      .finally(() => setLoadingProgramas(false));
  }, [tipo, token, programas.length]);

  // Debounced alumno search
  useEffect(() => {
    if (tipo !== 'individual') return;
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `${API_BASE}/space/alumnos?search=${encodeURIComponent(searchQuery)}`,
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
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, tipo, token]);

  // Close autocomplete on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const resetForm = useCallback(() => {
    setTipo('difusion');
    setProgramaId(null);
    setAlumnoId(null);
    setAlumnoNombre('');
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setAsunto('');
    setContenido('');
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSelectAlumno = useCallback((a: AlumnoBusqueda) => {
    setAlumnoId(a.id);
    setAlumnoNombre(a.nombre);
    setSearchQuery(a.nombre);
    setShowResults(false);
    setSearchResults([]);
  }, []);

  const canSend =
    asunto.trim().length > 0 &&
    contenido.trim().length > 0 &&
    (tipo === 'difusion' ||
      (tipo === 'programa' && programaId !== null) ||
      (tipo === 'individual' && alumnoId !== null));

  const handleSend = useCallback(async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const body: Record<string, unknown> = { tipo, asunto, contenido };
      if (tipo === 'programa') body.programa_destino = programaId;
      if (tipo === 'individual') body.alumno_destino_id = alumnoId;

      const res = await fetch(`${API_BASE}/space/mensajes`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        toast.error(data.error ?? 'Error al enviar mensaje');
        return;
      }
      toast.success('Mensaje enviado correctamente');
      resetForm();
      onSent();
      onClose();
    } catch {
      toast.error('Error de conexion al enviar');
    } finally {
      setSending(false);
    }
  }, [canSend, tipo, asunto, contenido, programaId, alumnoId, token, resetForm, onSent, onClose]);

  const tipoOptions: { key: TipoMensaje; label: string; icon: React.ReactNode }[] = [
    { key: 'difusion', label: 'Difusion', icon: <Megaphone size={14} /> },
    { key: 'programa', label: 'Por programa', icon: <Users size={14} /> },
    { key: 'individual', label: 'Individual', icon: <User size={14} /> },
  ];

  const footer = (
    <>
      <button onClick={handleClose} className={cx.btnSecondary}>
        Cancelar
      </button>
      <button
        onClick={handleSend}
        disabled={sending || !canSend}
        className={cx.btnPrimary + ' flex items-center gap-2'}
      >
        {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        Enviar
      </button>
    </>
  );

  return (
    <Modal open={open} onClose={handleClose} title="Nuevo mensaje" footer={footer} size="lg">
      <div className="space-y-5">
        {/* Tipo selector */}
        <div>
          <label className={cx.label}>Tipo de mensaje</label>
          <div className="flex gap-2">
            {tipoOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  setTipo(opt.key);
                  setProgramaId(null);
                  setAlumnoId(null);
                  setAlumnoNombre('');
                  setSearchQuery('');
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all duration-200 ${
                  tipo === opt.key
                    ? 'bg-[#FA7B21]/15 text-[#FA7B21] border-[#FA7B21]/30'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-800 hover:bg-zinc-700 hover:text-zinc-300'
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Programa selector */}
        {tipo === 'programa' && (
          <div>
            <label className={cx.label}>Programa</label>
            {loadingProgramas ? (
              <div className="flex items-center gap-2 text-zinc-500 text-sm py-2">
                <Loader2 size={14} className="animate-spin" />
                Cargando programas...
              </div>
            ) : (
              <select
                value={programaId ?? ''}
                onChange={(e) => setProgramaId(e.target.value ? Number(e.target.value) : null)}
                className={cx.select}
              >
                <option value="">Seleccionar programa</option>
                {programas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Alumno search */}
        {tipo === 'individual' && (
          <div className="relative" ref={resultsRef}>
            <label className={cx.label}>Alumno</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setAlumnoId(null);
                  setAlumnoNombre('');
                }}
                placeholder="Buscar alumno por nombre o DNI..."
                className={cx.input}
              />
              {searching && (
                <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 animate-spin" />
              )}
            </div>
            {alumnoId && alumnoNombre && (
              <p className="text-xs text-emerald-400 mt-1.5">
                Seleccionado: {alumnoNombre}
              </p>
            )}
            {showResults && searchResults.length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl max-h-48 overflow-y-auto shadow-xl">
                {searchResults.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => handleSelectAlumno(a)}
                    className="w-full text-left px-3.5 py-2.5 text-sm text-white hover:bg-zinc-700 transition-colors first:rounded-t-xl last:rounded-b-xl flex items-center gap-2"
                  >
                    <User size={14} className="text-zinc-500 shrink-0" />
                    <span>{a.nombre}</span>
                    {a.dni && <span className="text-zinc-500 text-xs ml-auto">{a.dni}</span>}
                  </button>
                ))}
              </div>
            )}
            {showResults && searchResults.length === 0 && searchQuery.length >= 2 && !searching && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-3 text-sm text-zinc-500">
                Sin resultados
              </div>
            )}
          </div>
        )}

        {/* Asunto */}
        <div>
          <label className={cx.label}>Asunto</label>
          <input
            type="text"
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            placeholder="Asunto del mensaje..."
            className={cx.input}
          />
        </div>

        {/* Contenido */}
        <div>
          <label className={cx.label}>Contenido</label>
          <textarea
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            placeholder="Escribe el contenido del mensaje..."
            rows={6}
            className={cx.input + ' resize-none'}
          />
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Detail Modal
// ---------------------------------------------------------------------------

function DetailModal({
  mensaje,
  open,
  onClose,
  onDeleted,
  token,
}: {
  mensaje: Mensaje | null;
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
  token: string;
}) {
  const [lecturas, setLecturas] = useState<Lectura[]>([]);
  const [loadingLecturas, setLoadingLecturas] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!mensaje || !open) return;
    setLoadingLecturas(true);
    setConfirmDelete(false);
    fetch(`${API_BASE}/space/mensajes/${mensaje.id}`, {
      headers: authHeaders(token),
    })
      .then((r) => r.json())
      .then((data) => {
        const detail = data?.data || data;
        const list = Array.isArray(detail?.lecturas) ? detail.lecturas : [];
        setLecturas(list);
      })
      .catch(() => toast.error('Error al cargar lecturas'))
      .finally(() => setLoadingLecturas(false));
  }, [mensaje, open, token]);

  const handleDelete = useCallback(async () => {
    if (!mensaje) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/space/mensajes/${mensaje.id}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        toast.error(data.message ?? 'Error al eliminar mensaje');
        return;
      }
      toast.success('Mensaje eliminado');
      onDeleted();
      onClose();
    } catch {
      toast.error('Error de conexion al eliminar');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }, [mensaje, confirmDelete, token, onDeleted, onClose]);

  if (!mensaje) return null;

  const footer = (
    <div className="flex items-center justify-between w-full">
      <button
        onClick={handleDelete}
        disabled={deleting}
        className={
          confirmDelete
            ? 'px-3 py-2 bg-red-500/15 text-red-400 border border-red-500/30 text-sm rounded-xl transition-all duration-200 flex items-center gap-2'
            : cx.btnDanger + ' flex items-center gap-2'
        }
      >
        {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        {confirmDelete ? 'Confirmar eliminacion' : 'Eliminar'}
      </button>
      <button onClick={onClose} className={cx.btnSecondary}>
        Cerrar
      </button>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title="Detalle del mensaje" footer={footer} size="lg">
      <div className="space-y-5">
        {/* Message info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className={cx.badge(TIPO_BADGE[mensaje.tipo] ?? badgeColors.gray)}>
              {TIPO_LABEL[mensaje.tipo] ?? mensaje.tipo}
            </span>
            <span className="text-zinc-500 text-xs">{formatFecha(mensaje.fecha)}</span>
          </div>
          <h3 className="text-white text-base font-semibold">{mensaje.asunto}</h3>
          <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">
            {mensaje.contenido}
          </p>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Eye size={12} />
            <span>
              {mensaje.leidos} / {mensaje.total_destinatarios} leidos
            </span>
          </div>
        </div>

        {/* Lecturas table */}
        <div>
          <h4 className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-3">
            Destinatarios
          </h4>
          {loadingLecturas ? (
            <div className="space-y-2">
              {SKELETON_ROWS.map((sk) => (
                <div key={sk} className="flex gap-3">
                  <div className={cx.skeleton + ' h-4 w-32'} />
                  <div className={cx.skeleton + ' h-4 w-20'} />
                </div>
              ))}
            </div>
          ) : lecturas.length === 0 ? (
            <p className="text-zinc-500 text-sm">Sin datos de lectura</p>
          ) : (
            <div className={cx.card + ' overflow-hidden'}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className={cx.th}>Nombre</th>
                    <th className={cx.th}>Fecha leido</th>
                  </tr>
                </thead>
                <tbody>
                  {lecturas.map((l) => (
                    <tr key={l.alumno_id} className={cx.tr}>
                      <td className={cx.td + ' text-white'}>{l.nombre}</td>
                      <td className={cx.td}>
                        {l.fecha_leido ? (
                          <span className="text-emerald-400 text-xs">
                            {formatFecha(l.fecha_leido)}
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-xs">No leido</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function SpaceMensajes({ token }: SpaceMensajesProps) {
  const [stats, setStats] = useState<MensajeStats>({ total: 0, difusiones: 0, individuales: 0 });
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sendOpen, setSendOpen] = useState(false);
  const [detailMensaje, setDetailMensaje] = useState<Mensaje | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(`${API_BASE}/space/mensajes/stats`, {
        headers: authHeaders(token),
      });
      const data = await res.json();
      const s = data.data ?? data;
      setStats({
        total: s.total ?? 0,
        difusiones: s.difusion ?? s.difusiones ?? 0,
        individuales: s.individual ?? s.individuales ?? 0,
      });
    } catch {
      toast.error('Error al cargar estadisticas');
    } finally {
      setLoadingStats(false);
    }
  }, [token]);

  const fetchMensajes = useCallback(async () => {
    setLoadingTable(true);
    try {
      const res = await fetch(
        `${API_BASE}/space/mensajes?page=${page}&limit=${LIMIT}`,
        { headers: authHeaders(token) },
      );
      const data = await res.json();
      const inner = data?.data || data;
      const list = Array.isArray(inner?.mensajes) ? inner.mensajes : Array.isArray(inner) ? inner : [];
      setMensajes(list);
      setTotal(inner?.pagination?.total ?? data?.total ?? list.length);
    } catch {
      toast.error('Error al cargar mensajes');
    } finally {
      setLoadingTable(false);
    }
  }, [token, page]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchMensajes();
  }, [fetchMensajes]);

  const handleSent = useCallback(() => {
    fetchStats();
    fetchMensajes();
  }, [fetchStats, fetchMensajes]);

  const handleDeleted = useCallback(() => {
    fetchStats();
    fetchMensajes();
  }, [fetchStats, fetchMensajes]);

  const handleRowClick = useCallback((m: Mensaje) => {
    setDetailMensaje(m);
    setDetailOpen(true);
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold">Mensajes</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Envia mensajes a padres y apoderados</p>
        </div>
        <button
          onClick={() => setSendOpen(true)}
          className={cx.btnPrimary + ' flex items-center gap-2'}
        >
          <Plus size={16} />
          Nuevo mensaje
        </button>
      </div>

      {/* Stats */}
      <StatsBar stats={stats} loading={loadingStats} />

      {/* Table */}
      {loadingTable ? (
        <TableSkeleton />
      ) : mensajes.length === 0 ? (
        <EmptyState />
      ) : (
        <div className={cx.card + ' overflow-hidden'}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className={cx.th}>Asunto</th>
                  <th className={cx.th + ' hidden sm:table-cell'}>Tipo</th>
                  <th className={cx.th + ' hidden md:table-cell'}>Destinatario</th>
                  <th className={cx.th}>Leidos</th>
                  <th className={cx.th + ' hidden lg:table-cell'}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {mensajes.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => handleRowClick(m)}
                    className={cx.tr + ' cursor-pointer'}
                  >
                    <td className={cx.td}>
                      <div className="flex items-center gap-2">
                        <MessageSquare size={14} className="text-zinc-600 shrink-0" />
                        <span className="text-white truncate max-w-[200px]">{m.asunto}</span>
                      </div>
                    </td>
                    <td className={cx.td + ' hidden sm:table-cell'}>
                      <span className={cx.badge(TIPO_BADGE[m.tipo] ?? badgeColors.gray)}>
                        {TIPO_LABEL[m.tipo] ?? m.tipo}
                      </span>
                    </td>
                    <td className={cx.td + ' hidden md:table-cell text-zinc-400'}>
                      {m.destinatario || 'Todos'}
                    </td>
                    <td className={cx.td}>
                      <div className="flex items-center gap-1.5">
                        <Eye size={12} className="text-zinc-600" />
                        <span className="text-zinc-400 text-xs">
                          {m.leidos}/{m.total_destinatarios}
                        </span>
                      </div>
                    </td>
                    <td className={cx.td + ' hidden lg:table-cell text-zinc-500 text-xs'}>
                      {formatFecha(m.fecha)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
              <span className="text-zinc-500 text-xs">
                Pagina {page} de {totalPages} ({total} mensajes)
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className={cx.btnSecondary + ' text-xs px-3 py-1.5 disabled:opacity-40'}
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className={cx.btnSecondary + ' text-xs px-3 py-1.5 disabled:opacity-40'}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Send Modal */}
      <SendModal
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        onSent={handleSent}
        token={token}
      />

      {/* Detail Modal */}
      <DetailModal
        mensaje={detailMensaje}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetailMensaje(null);
        }}
        onDeleted={handleDeleted}
        token={token}
      />
    </div>
  );
}
