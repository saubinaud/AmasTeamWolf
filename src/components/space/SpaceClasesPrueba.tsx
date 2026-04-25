import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, Plus, Pencil, Search, Loader2,
  Users, TrendingUp, UserCheck, BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { cx, badgeColors, statGradients } from './tokens';
import { Modal } from './Modal';
import { API_BASE } from '../../config/api';
import { formatFecha } from './dateUtils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Estado = 'por_asistir' | 'asistio' | 'no_asistio';
type Resultado = 'inscrito' | 'en_confirmacion' | 'separacion' | 'no_interesado';

interface ClasePrueba {
  id: number;
  nombre_prospecto: string;
  telefono?: string | null;
  email?: string | null;
  fecha: string;
  hora?: string | null;
  profesora?: string | null;
  estado: Estado;
  resultado?: Resultado | null;
  observaciones?: string | null;
  alumno_inscrito_id?: number | null;
  created_at: string;
}

interface Stats {
  total_mes: number;
  asistieron: number;
  inscritos: number;
  tasa_conversion: number;
}

interface Embudo {
  por_asistir: number;
  asistio: number;
  no_asistio: number;
  inscrito: number;
  en_confirmacion: number;
  separacion: number;
  no_interesado: number;
}

interface SpaceClasesPruebaProps {
  token: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LIMIT = 20;
const SKELETON_ROWS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5'] as const;

const ESTADO_BADGE: Record<Estado, string> = {
  por_asistir: badgeColors.yellow,
  asistio: badgeColors.blue,
  no_asistio: badgeColors.red,
};

const ESTADO_LABEL: Record<Estado, string> = {
  por_asistir: 'Por asistir',
  asistio: 'Asistio',
  no_asistio: 'No asistio',
};

const RESULTADO_BADGE: Record<Resultado, string> = {
  inscrito: badgeColors.green,
  en_confirmacion: badgeColors.orange,
  separacion: badgeColors.green,
  no_interesado: badgeColors.gray,
};

const RESULTADO_LABEL: Record<Resultado, string> = {
  inscrito: 'Inscrito',
  en_confirmacion: 'En confirmacion',
  separacion: 'Separacion',
  no_interesado: 'No interesado',
};

const ESTADOS_FILTER: { key: Estado | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'por_asistir', label: 'Por asistir' },
  { key: 'asistio', label: 'Asistio' },
  { key: 'no_asistio', label: 'No asistio' },
];

const PROFESORAS = ['Paola', 'Adriana', 'Otra'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatsBar({ stats, loading }: { stats: Stats; loading: boolean }) {
  const items = [
    {
      label: 'Total este mes',
      value: String(stats.total_mes),
      gradient: statGradients.blue,
      icon: <Users size={18} />,
    },
    {
      label: 'Asistieron',
      value: String(stats.asistieron),
      gradient: statGradients.orange,
      icon: <UserCheck size={18} />,
    },
    {
      label: 'Se inscribieron',
      value: String(stats.inscritos),
      gradient: statGradients.green,
      icon: <Sparkles size={18} />,
    },
    {
      label: 'Tasa conversion',
      value: `${stats.tasa_conversion}%`,
      gradient: statGradients.violet,
      icon: <TrendingUp size={18} />,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={`bg-gradient-to-br ${item.gradient.bg} border ${item.gradient.border} rounded-2xl p-4 text-left`}
        >
          {loading ? (
            <div className="space-y-2">
              <div className={cx.skeleton + ' h-4 w-20'} />
              <div className={cx.skeleton + ' h-7 w-16'} />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-stone-500 text-xs font-medium uppercase tracking-wider">
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

function EmbudoVisual({ embudo, loading }: { embudo: Embudo; loading: boolean }) {
  if (loading) {
    return (
      <div className={cx.card + ' p-4'}>
        <div className={cx.skeleton + ' h-5 w-40 mb-3'} />
        <div className={cx.skeleton + ' h-10 w-full'} />
      </div>
    );
  }

  const total = embudo.por_asistir + embudo.asistio + embudo.no_asistio;
  if (total === 0) return null;

  const steps = [
    { label: 'Por asistir', value: embudo.por_asistir, color: 'bg-amber-500' },
    { label: 'Asistio', value: embudo.asistio, color: 'bg-sky-500' },
    { label: 'Inscrito', value: embudo.inscrito, color: 'bg-emerald-500' },
    { label: 'En confirmacion', value: embudo.en_confirmacion, color: 'bg-[var(--accent)]' },
    { label: 'No interesado', value: embudo.no_interesado, color: 'bg-stone-400' },
  ];

  return (
    <div className={cx.card + ' p-4'}>
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={16} className="text-stone-500" />
        <span className="text-stone-900 text-sm font-semibold">Embudo de conversion</span>
      </div>
      <div className="flex gap-1 h-8 rounded-xl overflow-hidden">
        {steps.map((step) => {
          const pct = total > 0 ? (step.value / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={step.label}
              className={`${step.color} flex items-center justify-center transition-all`}
              style={{ width: `${Math.max(pct, 5)}%` }}
              title={`${step.label}: ${step.value}`}
            >
              <span className="text-white text-[10px] font-bold truncate px-1">
                {step.value}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 mt-2">
        {steps.map((step) =>
          step.value > 0 ? (
            <div key={step.label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-sm ${step.color}`} />
              <span className="text-stone-500 text-[10px]">
                {step.label} ({step.value})
              </span>
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SpaceClasesPrueba({ token }: SpaceClasesPruebaProps) {
  // Data
  const [clases, setClases] = useState<ClasePrueba[]>([]);
  const [stats, setStats] = useState<Stats>({ total_mes: 0, asistieron: 0, inscritos: 0, tasa_conversion: 0 });
  const [embudo, setEmbudo] = useState<Embudo>({ por_asistir: 0, asistio: 0, no_asistio: 0, inscrito: 0, en_confirmacion: 0, separacion: 0, no_interesado: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // UI state
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<Estado | 'all'>('all');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<ClasePrueba | null>(null);

  // Form
  const [form, setForm] = useState({
    nombre_prospecto: '',
    telefono: '',
    email: '',
    fecha: todayISO(),
    hora: '',
    profesora: '',
    estado: 'por_asistir' as Estado,
    resultado: '' as string,
    observaciones: '',
  });

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [statsRes, embudoRes] = await Promise.all([
        fetch(`${API_BASE}/space/clases-prueba/stats`, { headers: authHeaders(token) }),
        fetch(`${API_BASE}/space/clases-prueba/embudo`, { headers: authHeaders(token) }),
      ]);
      const statsData = await statsRes.json();
      const embudoData = await embudoRes.json();
      if (statsData.success) setStats(statsData.data);
      if (embudoData.success) setEmbudo(embudoData.data);
    } catch {
      /* silently fail stats */
    } finally {
      setStatsLoading(false);
    }
  }, [token]);

  const fetchClases = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
      if (estadoFilter !== 'all') params.set('estado', estadoFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`${API_BASE}/space/clases-prueba?${params}`, {
        headers: authHeaders(token),
      });
      const data = await res.json();
      if (data.success) {
        setClases(data.data);
        setTotal(data.total);
        setPage(data.page);
      }
    } catch {
      toast.error('Error cargando clases de prueba');
    } finally {
      setLoading(false);
    }
  }, [token, estadoFilter, search]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchClases(1); }, [fetchClases]);

  // ---------------------------------------------------------------------------
  // Modal actions
  // ---------------------------------------------------------------------------

  const openCreate = () => {
    setEditItem(null);
    setForm({
      nombre_prospecto: '',
      telefono: '',
      email: '',
      fecha: todayISO(),
      hora: '',
      profesora: '',
      estado: 'por_asistir',
      resultado: '',
      observaciones: '',
    });
    setShowModal(true);
  };

  const openEdit = (item: ClasePrueba) => {
    setEditItem(item);
    setForm({
      nombre_prospecto: item.nombre_prospecto,
      telefono: item.telefono || '',
      email: item.email || '',
      fecha: item.fecha ? item.fecha.slice(0, 10) : todayISO(),
      hora: item.hora || '',
      profesora: item.profesora || '',
      estado: item.estado,
      resultado: item.resultado || '',
      observaciones: item.observaciones || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nombre_prospecto.trim() || !form.fecha) {
      toast.error('Nombre y fecha son requeridos');
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        nombre_prospecto: form.nombre_prospecto.trim(),
        telefono: form.telefono.trim() || null,
        email: form.email.trim() || null,
        fecha: form.fecha,
        hora: form.hora.trim() || null,
        profesora: form.profesora.trim() || null,
        estado: form.estado,
        resultado: form.resultado || null,
        observaciones: form.observaciones.trim() || null,
      };

      const url = editItem
        ? `${API_BASE}/space/clases-prueba/${editItem.id}`
        : `${API_BASE}/space/clases-prueba`;

      const res = await fetch(url, {
        method: editItem ? 'PUT' : 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success(editItem ? 'Clase actualizada' : 'Clase registrada');
      setShowModal(false);
      fetchClases(page);
      fetchStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------------------------

  const totalPages = Math.ceil(total / LIMIT);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-5">
      {/* Stats */}
      <StatsBar stats={stats} loading={statsLoading} />

      {/* Embudo */}
      <EmbudoVisual embudo={embudo} loading={statsLoading} />

      {/* Toolbar */}
      <div className={cx.card + ' p-4'}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o telefono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cx.input + ' pl-9'}
            />
          </div>

          {/* Estado chips */}
          <div className="flex flex-wrap gap-1.5">
            {ESTADOS_FILTER.map((f) => (
              <button
                key={f.key}
                onClick={() => setEstadoFilter(f.key)}
                className={cx.chip(estadoFilter === f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Create button */}
          <button onClick={openCreate} className={cx.btnPrimary + ' ml-auto flex items-center gap-2 shrink-0'}>
            <Plus size={16} />
            <span className="hidden sm:inline">Nueva clase</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={cx.card + ' overflow-hidden'}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200">
                <th className={cx.th}>Nombre</th>
                <th className={cx.th + ' hidden sm:table-cell'}>Telefono</th>
                <th className={cx.th}>Fecha</th>
                <th className={cx.th + ' hidden md:table-cell'}>Hora</th>
                <th className={cx.th + ' hidden lg:table-cell'}>Profesora</th>
                <th className={cx.th}>Estado</th>
                <th className={cx.th}>Resultado</th>
                <th className={cx.th + ' w-10'}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                SKELETON_ROWS.map((sk) => (
                  <tr key={sk} className={cx.tr}>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <td key={i} className={cx.td}>
                        <div className={cx.skeleton + ' h-4 w-20'} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : clases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-stone-400 text-sm">
                    No hay clases de prueba registradas
                  </td>
                </tr>
              ) : (
                clases.map((c) => (
                  <tr
                    key={c.id}
                    className={cx.tr + ' cursor-pointer'}
                    onClick={() => openEdit(c)}
                  >
                    <td className={cx.td}>
                      <span className="text-stone-900 font-medium">{c.nombre_prospecto}</span>
                    </td>
                    <td className={cx.td + ' hidden sm:table-cell text-stone-500'}>
                      {c.telefono || '—'}
                    </td>
                    <td className={cx.td + ' text-stone-500'}>{formatFecha(c.fecha)}</td>
                    <td className={cx.td + ' hidden md:table-cell text-stone-500'}>
                      {c.hora || '—'}
                    </td>
                    <td className={cx.td + ' hidden lg:table-cell text-stone-500'}>
                      {c.profesora || '—'}
                    </td>
                    <td className={cx.td}>
                      <span className={cx.badge(ESTADO_BADGE[c.estado])}>
                        {ESTADO_LABEL[c.estado]}
                      </span>
                    </td>
                    <td className={cx.td}>
                      {c.resultado ? (
                        <span className={cx.badge(RESULTADO_BADGE[c.resultado])}>
                          {RESULTADO_LABEL[c.resultado]}
                        </span>
                      ) : (
                        <span className="text-stone-300 text-xs">—</span>
                      )}
                    </td>
                    <td className={cx.td}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(c);
                        }}
                        className={cx.btnIcon}
                      >
                        <Pencil size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200">
            <span className="text-stone-400 text-xs">
              {total} resultado{total !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => fetchClases(p)}
                  className={`min-w-[32px] h-8 rounded-lg text-xs font-medium transition-all ${
                    p === page
                      ? 'bg-orange-50 text-[var(--accent)] border border-orange-200'
                      : 'text-stone-400 hover:text-stone-800 hover:bg-stone-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? 'Editar clase de prueba' : 'Nueva clase de prueba'}
        footer={
          <>
            <button onClick={() => setShowModal(false)} className={cx.btnSecondary}>
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving} className={cx.btnPrimary + ' flex items-center gap-2'}>
              {saving && <Loader2 size={14} className="animate-spin" />}
              {editItem ? 'Guardar cambios' : 'Registrar'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Nombre */}
          <div>
            <label className={cx.label}>Nombre del prospecto *</label>
            <input
              type="text"
              value={form.nombre_prospecto}
              onChange={(e) => setForm({ ...form, nombre_prospecto: e.target.value })}
              className={cx.input}
              placeholder="Nombre completo"
            />
          </div>

          {/* Telefono + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={cx.label}>Telefono</label>
              <input
                type="tel"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className={cx.input}
                placeholder="999 999 999"
              />
            </div>
            <div>
              <label className={cx.label}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={cx.input}
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          {/* Fecha + Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={cx.label}>Fecha *</label>
              <input
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                className={cx.input}
              />
            </div>
            <div>
              <label className={cx.label}>Hora</label>
              <input
                type="time"
                value={form.hora}
                onChange={(e) => setForm({ ...form, hora: e.target.value })}
                className={cx.input}
              />
            </div>
          </div>

          {/* Profesora */}
          <div>
            <label className={cx.label}>Profesora</label>
            <select
              value={PROFESORAS.includes(form.profesora) ? form.profesora : (form.profesora ? 'Otra' : '')}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'Otra') setForm({ ...form, profesora: '' });
                else setForm({ ...form, profesora: val });
              }}
              className={cx.select}
            >
              <option value="">Seleccionar...</option>
              {PROFESORAS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {(!PROFESORAS.includes(form.profesora) && form.profesora !== '') && (
              <input
                type="text"
                value={form.profesora}
                onChange={(e) => setForm({ ...form, profesora: e.target.value })}
                className={cx.input + ' mt-2'}
                placeholder="Nombre de la profesora"
              />
            )}
          </div>

          {/* Estado + Resultado (solo en editar) */}
          {editItem && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={cx.label}>Estado</label>
                  <select
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value as Estado })}
                    className={cx.select}
                  >
                    <option value="por_asistir">Por asistir</option>
                    <option value="asistio">Asistio</option>
                    <option value="no_asistio">No asistio</option>
                  </select>
                </div>
                <div>
                  <label className={cx.label}>Resultado</label>
                  <select
                    value={form.resultado}
                    onChange={(e) => setForm({ ...form, resultado: e.target.value })}
                    className={cx.select}
                  >
                    <option value="">Pendiente</option>
                    <option value="inscrito">Inscrito</option>
                    <option value="en_confirmacion">En confirmacion</option>
                    <option value="separacion">Separacion</option>
                    <option value="no_interesado">No interesado</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Observaciones */}
          <div>
            <label className={cx.label}>Observaciones</label>
            <textarea
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              className={cx.input + ' min-h-[80px] resize-y'}
              placeholder="Notas sobre el prospecto..."
              rows={3}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
