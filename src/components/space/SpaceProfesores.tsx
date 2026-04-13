import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Users, Loader2, Pencil, Trash2, Plus,
  UserCheck, CalendarCheck, TrendingUp, ClipboardCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '../../config/api';
import { cx, badgeColors, statGradients } from './tokens';
import { Modal } from './Modal';
import { formatFecha, formatHora } from './dateUtils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Profesor {
  id: number;
  nombre: string;
  dni: string | null;
  telefono: string | null;
  email: string | null;
  contacto_emergencia: string | null;
  activo: boolean;
  ultima_asistencia: string | null;
}

interface ProfesorStats {
  total_activos: number;
  asistencias_mes: number;
  tasa_asistencia: number;
}

interface ResumenMes {
  mes: string;
  dias_asistidos: number;
  dias_esperados: number;
  porcentaje: number;
}

interface AsistenciaHoy {
  id: number;
  nombre: string;
  dni: string;
  hora_entrada: string;
}

interface SpaceProfesoresProps {
  token: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SKELETON_ROWS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5'] as const;

const ESTADO_BADGE: Record<string, string> = {
  activo: badgeColors.green,
  inactivo: badgeColors.red,
};

const EMPTY_FORM = {
  nombre: '',
  dni: '',
  telefono: '',
  email: '',
  contacto_emergencia: '',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function mesLabel(mes: string): string {
  const [y, m] = mes.split('-');
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${meses[parseInt(m, 10) - 1]} ${y}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatsBar({ stats, loading }: { stats: ProfesorStats; loading: boolean }) {
  const items = [
    {
      label: 'Profesores activos',
      value: String(stats.total_activos),
      gradient: statGradients.blue,
      icon: <UserCheck size={18} />,
    },
    {
      label: 'Asistencias este mes',
      value: String(stats.asistencias_mes),
      gradient: statGradients.green,
      icon: <CalendarCheck size={18} />,
    },
    {
      label: 'Tasa asistencia',
      value: `${stats.tasa_asistencia}%`,
      gradient: statGradients.orange,
      icon: <TrendingUp size={18} />,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((item) => {
        const baseCls = `bg-gradient-to-br ${item.gradient.bg} border ${item.gradient.border} rounded-2xl p-4 text-left`;
        const content = loading ? (
          <div className="space-y-2">
            <div className={cx.skeleton + ' h-4 w-20'} />
            <div className={cx.skeleton + ' h-7 w-16'} />
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
        );
        return (
          <div key={item.label} className={baseCls}>
            {content}
          </div>
        );
      })}
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
          <div className={cx.skeleton + ' h-4 w-24 hidden md:block'} />
          <div className={cx.skeleton + ' h-4 w-16'} />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SpaceProfesores({ token }: SpaceProfesoresProps) {
  // Data
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [stats, setStats] = useState<ProfesorStats>({ total_activos: 0, asistencias_mes: 0, tasa_asistencia: 0 });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Search
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const debouncedRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Quick attendance
  const [dniInput, setDniInput] = useState('');
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceResult, setAttendanceResult] = useState<{ nombre: string; ya_registrado: boolean } | null>(null);
  const [asistenciasHoy, setAsistenciasHoy] = useState<AsistenciaHoy[]>([]);

  // Create/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Detail/Resumen modal
  const [selectedProfesor, setSelectedProfesor] = useState<Profesor | null>(null);
  const [resumen, setResumen] = useState<ResumenMes[]>([]);
  const [resumenLoading, setResumenLoading] = useState(false);

  // -----------------------------------------------------------------------
  // Fetch
  // -----------------------------------------------------------------------

  const fetchProfesores = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/space/profesores`, { headers: authHeaders(token) });
      const data = await res.json();
      if (data.success) {
        setProfesores(data.data || []);
      }
    } catch {
      toast.error('Error al cargar profesores');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/space/profesores/stats`, { headers: authHeaders(token) });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch {
      // silent
    } finally {
      setStatsLoading(false);
    }
  }, [token]);

  const fetchAsistenciasHoy = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/space/profesores/asistencia/hoy`, { headers: authHeaders(token) });
      const data = await res.json();
      if (data.success) {
        setAsistenciasHoy(data.data || []);
      }
    } catch {
      // silent
    }
  }, [token]);

  const fetchResumen = useCallback(async (id: number) => {
    setResumenLoading(true);
    try {
      const res = await fetch(`${API_BASE}/space/profesores/asistencia/resumen/${id}`, { headers: authHeaders(token) });
      const data = await res.json();
      if (data.success) {
        setResumen(data.data || []);
      }
    } catch {
      toast.error('Error al cargar resumen');
    } finally {
      setResumenLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfesores();
    fetchStats();
    fetchAsistenciasHoy();
  }, [fetchProfesores, fetchStats, fetchAsistenciasHoy]);

  // Debounced search
  useEffect(() => {
    if (debouncedRef.current) clearTimeout(debouncedRef.current);
    debouncedRef.current = setTimeout(() => {
      setSearch(searchInput);
    }, 300);
    return () => { if (debouncedRef.current) clearTimeout(debouncedRef.current); };
  }, [searchInput]);

  // -----------------------------------------------------------------------
  // Filtered list
  // -----------------------------------------------------------------------

  const filtered = search
    ? profesores.filter(
        (p) =>
          p.nombre.toLowerCase().includes(search.toLowerCase()) ||
          (p.dni && p.dni.includes(search))
      )
    : profesores;

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value), []);

  const handleRegisterAttendance = useCallback(async () => {
    if (!dniInput.trim()) return;
    setAttendanceLoading(true);
    setAttendanceResult(null);
    try {
      const res = await fetch(`${API_BASE}/space/profesores/asistencia`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ dni: dniInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setAttendanceResult({ nombre: data.data.profesor, ya_registrado: data.data.ya_registrado });
        if (data.data.ya_registrado) {
          toast.info(data.message);
        } else {
          toast.success(data.message);
        }
        setDniInput('');
        fetchAsistenciasHoy();
        fetchStats();
      } else {
        toast.error(data.error || 'Error al registrar');
      }
    } catch {
      toast.error('Error de conexion');
    } finally {
      setAttendanceLoading(false);
    }
  }, [token, dniInput, fetchAsistenciasHoy, fetchStats]);

  const handleOpenCreate = useCallback(() => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((p: Profesor) => {
    setEditingId(p.id);
    setForm({
      nombre: p.nombre,
      dni: p.dni || '',
      telefono: p.telefono || '',
      email: p.email || '',
      contacto_emergencia: p.contacto_emergencia || '',
    });
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    setSaving(true);
    try {
      const url = editingId
        ? `${API_BASE}/space/profesores/${editingId}`
        : `${API_BASE}/space/profesores`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders(token),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? 'Profesor actualizado' : 'Profesor creado');
        setModalOpen(false);
        fetchProfesores();
        fetchStats();
      } else {
        toast.error(data.error || 'Error al guardar');
      }
    } catch {
      toast.error('Error de conexion');
    } finally {
      setSaving(false);
    }
  }, [token, editingId, form, fetchProfesores, fetchStats]);

  const handleDeactivate = useCallback(async (id: number, nombre: string) => {
    if (!confirm(`Desactivar a ${nombre}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/space/profesores/${id}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Profesor desactivado');
        fetchProfesores();
        fetchStats();
      } else {
        toast.error(data.error || 'Error');
      }
    } catch {
      toast.error('Error de conexion');
    }
  }, [token, fetchProfesores, fetchStats]);

  const handleRowClick = useCallback((p: Profesor) => {
    setSelectedProfesor(p);
    fetchResumen(p.id);
  }, [fetchResumen]);

  const patch = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold">Profesores</h1>
          <p className="text-white/40 text-xs mt-1">{profesores.length} profesores registrados</p>
        </div>
        <button onClick={handleOpenCreate} className={cx.btnPrimary + ' flex items-center gap-2'}>
          <Plus size={16} /> Nuevo
        </button>
      </div>

      {/* Stats */}
      <StatsBar stats={stats} loading={statsLoading} />

      {/* Quick attendance */}
      <div className={cx.card + ' p-4 space-y-3'}>
        <h2 className="text-white text-sm font-semibold flex items-center gap-2">
          <ClipboardCheck size={16} className="text-[#FA7B21]" />
          Registrar asistencia rapida
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="DNI del profesor..."
            value={dniInput}
            onChange={(e) => setDniInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRegisterAttendance()}
            className={cx.input + ' flex-1'}
          />
          <button
            onClick={handleRegisterAttendance}
            disabled={attendanceLoading || !dniInput.trim()}
            className={cx.btnPrimary + ' flex items-center gap-2 whitespace-nowrap'}
          >
            {attendanceLoading ? <Loader2 size={15} className="animate-spin" /> : <CalendarCheck size={15} />}
            Registrar
          </button>
        </div>
        {attendanceResult && (
          <div className={`text-sm p-3 rounded-xl border ${attendanceResult.ya_registrado ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
            {attendanceResult.ya_registrado
              ? `${attendanceResult.nombre} ya tiene asistencia registrada hoy`
              : `Asistencia registrada para ${attendanceResult.nombre}`}
          </div>
        )}
        {asistenciasHoy.length > 0 && (
          <div className="mt-2">
            <p className="text-zinc-500 text-xs mb-2">Asistencias hoy ({asistenciasHoy.length}):</p>
            <div className="flex flex-wrap gap-2">
              {asistenciasHoy.map((a) => (
                <span key={a.id} className={cx.badge(badgeColors.green)}>
                  {a.nombre} — {formatHora(a.hora_entrada)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          placeholder="Buscar por nombre o DNI..."
          value={searchInput}
          onChange={handleSearchChange}
          className={cx.input + ' pl-9'}
        />
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <div className={cx.card + ' py-16 text-center'}>
          <Users size={40} className="mx-auto text-zinc-700 mb-3" />
          <p className="text-zinc-400 mb-1">Sin profesores</p>
          <p className="text-zinc-500 text-sm">No se encontraron profesores con los filtros actuales</p>
        </div>
      ) : (
        <div className={cx.card + ' overflow-hidden'}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className={cx.th}>Nombre</th>
                  <th className={cx.th}>DNI</th>
                  <th className={cx.th + ' hidden sm:table-cell'}>Telefono</th>
                  <th className={cx.th + ' hidden md:table-cell'}>Email</th>
                  <th className={cx.th}>Estado</th>
                  <th className={cx.th + ' hidden lg:table-cell'}>Ultima asist.</th>
                  <th className={cx.th + ' text-right'}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => handleRowClick(p)}
                    className={cx.tr + ' cursor-pointer'}
                  >
                    <td className={cx.td + ' text-white font-medium whitespace-nowrap'}>{p.nombre}</td>
                    <td className={cx.td + ' text-zinc-400 font-mono text-xs'}>{p.dni || '—'}</td>
                    <td className={cx.td + ' text-zinc-400 hidden sm:table-cell'}>{p.telefono || '—'}</td>
                    <td className={cx.td + ' text-zinc-400 hidden md:table-cell text-xs'}>{p.email || '—'}</td>
                    <td className={cx.td}>
                      <span className={cx.badge(ESTADO_BADGE[p.activo ? 'activo' : 'inactivo'])}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className={cx.td + ' text-zinc-400 text-xs hidden lg:table-cell'}>
                      {formatFecha(p.ultima_asistencia)}
                    </td>
                    <td className={cx.td + ' text-right'}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenEdit(p); }}
                          className={cx.btnIcon}
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        {p.activo && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeactivate(p.id, p.nombre); }}
                            className={cx.btnDanger}
                            title="Desactivar"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar profesor' : 'Nuevo profesor'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className={cx.btnSecondary}>Cancelar</button>
            <button onClick={handleSave} disabled={saving} className={cx.btnPrimary + ' flex items-center gap-2'}>
              {saving && <Loader2 size={15} className="animate-spin" />}
              {editingId ? 'Guardar' : 'Crear'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={cx.label}>Nombre completo *</label>
            <input value={form.nombre} onChange={(e) => patch('nombre', e.target.value)} className={cx.input} />
          </div>
          <div>
            <label className={cx.label}>DNI</label>
            <input value={form.dni} onChange={(e) => patch('dni', e.target.value)} className={cx.input} />
          </div>
          <div>
            <label className={cx.label}>Telefono</label>
            <input value={form.telefono} onChange={(e) => patch('telefono', e.target.value)} className={cx.input} placeholder="Ej: 989717412" />
          </div>
          <div>
            <label className={cx.label}>Email</label>
            <input type="email" value={form.email} onChange={(e) => patch('email', e.target.value)} className={cx.input} />
          </div>
          <div>
            <label className={cx.label}>Contacto de emergencia</label>
            <input value={form.contacto_emergencia} onChange={(e) => patch('contacto_emergencia', e.target.value)} className={cx.input} placeholder="Nombre y telefono" />
          </div>
        </div>
      </Modal>

      {/* Detail / Resumen modal */}
      <Modal
        open={!!selectedProfesor}
        onClose={() => { setSelectedProfesor(null); setResumen([]); }}
        title={selectedProfesor ? `Resumen — ${selectedProfesor.nombre}` : ''}
        size="full-right"
      >
        {selectedProfesor && (
          <div className="space-y-6">
            {/* Info */}
            <section>
              <h3 className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-3">Datos del profesor</h3>
              <div className="bg-zinc-900 rounded-xl p-4 space-y-3 border border-zinc-800">
                {[
                  ['Nombre', selectedProfesor.nombre],
                  ['DNI', selectedProfesor.dni],
                  ['Telefono', selectedProfesor.telefono],
                  ['Email', selectedProfesor.email],
                  ['Contacto emergencia', selectedProfesor.contacto_emergencia],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-zinc-500 text-sm">{label}</span>
                    <span className="text-white text-sm font-medium">{value || '—'}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-sm">Estado</span>
                  <span className={cx.badge(ESTADO_BADGE[selectedProfesor.activo ? 'activo' : 'inactivo'])}>
                    {selectedProfesor.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </section>

            {/* Resumen asistencia mensual */}
            <section>
              <h3 className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-3">Asistencia mensual</h3>
              {resumenLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-[#FA7B21]" />
                </div>
              ) : resumen.length === 0 ? (
                <p className="text-zinc-500 text-sm">Sin registros de asistencia</p>
              ) : (
                <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className={cx.th}>Mes</th>
                        <th className={cx.th}>Dias asistidos</th>
                        <th className={cx.th}>Dias esperados</th>
                        <th className={cx.th}>Porcentaje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumen.map((r) => (
                        <tr key={r.mes} className={cx.tr}>
                          <td className={cx.td + ' text-white font-medium'}>{mesLabel(r.mes)}</td>
                          <td className={cx.td + ' text-zinc-400'}>{r.dias_asistidos}</td>
                          <td className={cx.td + ' text-zinc-400'}>{r.dias_esperados}</td>
                          <td className={cx.td}>
                            <span className={cx.badge(
                              r.porcentaje >= 80 ? badgeColors.green
                                : r.porcentaje >= 50 ? badgeColors.yellow
                                : badgeColors.red
                            )}>
                              {r.porcentaje}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </Modal>
    </div>
  );
}
