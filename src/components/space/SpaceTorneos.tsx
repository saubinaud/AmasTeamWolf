import { useState, useEffect, useCallback } from 'react';
import { Trophy, Plus, Pencil, Trash2, Users, CheckCircle, Clock, DollarSign, Search, X, ChevronLeft } from 'lucide-react';
import { API_BASE } from '../../config/api';
import { cx, badgeColors } from './tokens';
import { formatFecha } from './dateUtils';

interface TorneoConfig {
  id: number;
  nombre: string;
  tipo: string;
  fecha: string | null;
  lugar: string | null;
  precio: number;
  activo: boolean;
  total_selecciones: number;
  created_at: string;
}

interface Seleccion {
  id: number;
  torneo_id: number;
  alumno_id: number;
  modalidad: string | null;
  estado: string;
  estado_pago: string;
  observaciones: string | null;
  nombre_alumno: string;
  dni_alumno: string;
  categoria: string | null;
  created_at: string;
}

interface Stats {
  torneos_activos: number;
  total_selecciones: number;
  confirmados: number;
  pago_pendiente: number;
}

interface AlumnoSearch {
  id: number;
  nombre_alumno: string;
  dni_alumno: string;
  categoria: string | null;
}

const TIPO_BADGE: Record<string, string> = {
  regional: badgeColors.blue,
  nacional: badgeColors.orange,
  interescuelas: badgeColors.green,
  panamericano: badgeColors.violet,
  mundial: badgeColors.red,
};

const ESTADO_BADGE: Record<string, string> = {
  seleccionado: badgeColors.blue,
  confirmado: badgeColors.green,
  descartado: badgeColors.red,
};

const PAGO_BADGE: Record<string, string> = {
  Pendiente: badgeColors.yellow,
  Pagado: badgeColors.green,
  Parcial: badgeColors.orange,
};

async function apiFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}/space/torneos${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error de red' }));
    throw new Error(err?.error ?? 'Error desconocido');
  }
  return res.json();
}

export function SpaceTorneos({ token }: { token: string }) {
  const [torneos, setTorneos] = useState<TorneoConfig[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Detail view
  const [selectedTorneo, setSelectedTorneo] = useState<TorneoConfig | null>(null);
  const [selecciones, setSelecciones] = useState<Seleccion[]>([]);
  const [loadingSel, setLoadingSel] = useState(false);

  // Create/edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingTorneo, setEditingTorneo] = useState<TorneoConfig | null>(null);
  const [form, setForm] = useState({ nombre: '', tipo: 'regional', fecha: '', lugar: '', precio: '' });
  const [saving, setSaving] = useState(false);

  // Add student
  const [showAddAlumno, setShowAddAlumno] = useState(false);
  const [alumnoSearch, setAlumnoSearch] = useState('');
  const [alumnoResults, setAlumnoResults] = useState<AlumnoSearch[]>([]);
  const [searchingAlumnos, setSearchingAlumnos] = useState(false);
  const [addModalidad, setAddModalidad] = useState('');
  const [addObservaciones, setAddObservaciones] = useState('');

  // Edit selection
  const [editingSel, setEditingSel] = useState<Seleccion | null>(null);
  const [editSelForm, setEditSelForm] = useState({ estado: '', estado_pago: '', modalidad: '', observaciones: '' });

  const loadTorneos = useCallback(async () => {
    try {
      setLoading(true);
      const [torneosRes, statsRes] = await Promise.all([
        apiFetch('/', token),
        apiFetch('/stats', token),
      ]);
      setTorneos(torneosRes?.data ?? []);
      setStats(statsRes?.data ?? null);
    } catch (err: any) {
      setError(err?.message ?? 'Error al cargar torneos');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadTorneos(); }, [loadTorneos]);

  const loadSelecciones = useCallback(async (torneoId: number) => {
    try {
      setLoadingSel(true);
      const res = await apiFetch(`/${torneoId}/selecciones`, token);
      setSelecciones(res?.data ?? []);
    } catch { setSelecciones([]); }
    finally { setLoadingSel(false); }
  }, [token]);

  const openDetail = useCallback((t: TorneoConfig) => {
    setSelectedTorneo(t);
    loadSelecciones(t.id);
  }, [loadSelecciones]);

  const backToList = useCallback(() => {
    setSelectedTorneo(null);
    setSelecciones([]);
    loadTorneos();
  }, [loadTorneos]);

  // Create / Edit tournament
  const openCreateModal = useCallback(() => {
    setEditingTorneo(null);
    setForm({ nombre: '', tipo: 'regional', fecha: '', lugar: '', precio: '' });
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((t: TorneoConfig) => {
    setEditingTorneo(t);
    setForm({
      nombre: t.nombre ?? '',
      tipo: t.tipo ?? 'regional',
      fecha: t.fecha ? t.fecha.split('T')[0] : '',
      lugar: t.lugar ?? '',
      precio: String(t.precio ?? 0),
    });
    setShowModal(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.nombre.trim()) return;
    setSaving(true);
    try {
      const body = {
        nombre: form.nombre.trim(),
        tipo: form.tipo,
        fecha: form.fecha || null,
        lugar: form.lugar.trim() || null,
        precio: parseFloat(form.precio) || 0,
      };
      if (editingTorneo) {
        await apiFetch(`/${editingTorneo.id}`, token, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await apiFetch('/', token, { method: 'POST', body: JSON.stringify(body) });
      }
      setShowModal(false);
      loadTorneos();
    } catch { /* silently fail */ }
    finally { setSaving(false); }
  }, [form, editingTorneo, token, loadTorneos]);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Desactivar este torneo?')) return;
    try {
      await apiFetch(`/${id}`, token, { method: 'DELETE' });
      if (selectedTorneo?.id === id) backToList();
      else loadTorneos();
    } catch { /* silently fail */ }
  }, [token, selectedTorneo, backToList, loadTorneos]);

  // Search alumnos
  const searchAlumnos = useCallback(async (q: string) => {
    if (q.length < 2) { setAlumnoResults([]); return; }
    setSearchingAlumnos(true);
    try {
      const res = await fetch(`${API_BASE}/space/alumnos?search=${encodeURIComponent(q)}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAlumnoResults(data?.data ?? data ?? []);
    } catch { setAlumnoResults([]); }
    finally { setSearchingAlumnos(false); }
  }, [token]);

  const handleAddAlumno = useCallback(async (alumnoId: number) => {
    if (!selectedTorneo) return;
    try {
      await apiFetch(`/${selectedTorneo.id}/seleccionar`, token, {
        method: 'POST',
        body: JSON.stringify({
          alumno_id: alumnoId,
          modalidad: addModalidad.trim() || null,
          observaciones: addObservaciones.trim() || null,
        }),
      });
      setShowAddAlumno(false);
      setAlumnoSearch('');
      setAlumnoResults([]);
      setAddModalidad('');
      setAddObservaciones('');
      loadSelecciones(selectedTorneo.id);
    } catch (err: any) {
      alert(err?.message ?? 'Error al agregar alumno');
    }
  }, [selectedTorneo, token, addModalidad, addObservaciones, loadSelecciones]);

  // Edit selection
  const openEditSel = useCallback((s: Seleccion) => {
    setEditingSel(s);
    setEditSelForm({
      estado: s.estado ?? 'seleccionado',
      estado_pago: s.estado_pago ?? 'Pendiente',
      modalidad: s.modalidad ?? '',
      observaciones: s.observaciones ?? '',
    });
  }, []);

  const handleSaveSel = useCallback(async () => {
    if (!editingSel) return;
    try {
      await apiFetch(`/selecciones/${editingSel.id}`, token, {
        method: 'PUT',
        body: JSON.stringify({
          estado: editSelForm.estado,
          estado_pago: editSelForm.estado_pago,
          modalidad: editSelForm.modalidad.trim() || null,
          observaciones: editSelForm.observaciones.trim() || null,
        }),
      });
      setEditingSel(null);
      if (selectedTorneo) loadSelecciones(selectedTorneo.id);
    } catch { /* silently fail */ }
  }, [editingSel, editSelForm, token, selectedTorneo, loadSelecciones]);

  const handleRemoveSel = useCallback(async (id: number) => {
    if (!confirm('Eliminar esta seleccion?')) return;
    try {
      await apiFetch(`/selecciones/${id}`, token, { method: 'DELETE' });
      if (selectedTorneo) loadSelecciones(selectedTorneo.id);
    } catch { /* silently fail */ }
  }, [token, selectedTorneo, loadSelecciones]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className={`${cx.skeleton} h-24`} />)}
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-20 text-red-400">{error}</div>;
  }

  // ── DETAIL VIEW ──
  if (selectedTorneo) {
    return (
      <div className="space-y-5">
        <button onClick={backToList} className={`${cx.btnGhost} flex items-center gap-2`}>
          <ChevronLeft size={16} /> Volver a torneos
        </button>

        <div className={`${cx.card} p-5`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-white text-lg font-semibold">{selectedTorneo.nombre ?? '—'}</h2>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className={cx.badge(TIPO_BADGE[selectedTorneo.tipo ?? ''] ?? badgeColors.gray)}>
                  {selectedTorneo.tipo ?? '—'}
                </span>
                {selectedTorneo.fecha && (
                  <span className="text-zinc-400 text-sm">{formatFecha(selectedTorneo.fecha)}</span>
                )}
                {selectedTorneo.lugar && (
                  <span className="text-zinc-500 text-sm">{selectedTorneo.lugar}</span>
                )}
                {(selectedTorneo.precio ?? 0) > 0 && (
                  <span className="text-emerald-400 text-sm font-medium">S/ {Number(selectedTorneo.precio).toFixed(2)}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEditModal(selectedTorneo)} className={cx.btnSecondary}>
                <Pencil size={14} className="inline mr-1.5" /> Editar
              </button>
              <button onClick={() => setShowAddAlumno(true)} className={cx.btnPrimary}>
                <Plus size={14} className="inline mr-1.5" /> Seleccionar alumno
              </button>
            </div>
          </div>
        </div>

        {/* Selecciones table */}
        {loadingSel ? (
          <div className={`${cx.skeleton} h-32`} />
        ) : selecciones.length === 0 ? (
          <div className={`${cx.card} p-8 text-center`}>
            <Users size={32} className="mx-auto text-zinc-600 mb-3" />
            <p className="text-zinc-400 text-sm">No hay alumnos seleccionados para este torneo</p>
          </div>
        ) : (
          <div className={`${cx.card} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className={cx.th}>Alumno</th>
                    <th className={cx.th}>Modalidad</th>
                    <th className={cx.th}>Estado</th>
                    <th className={cx.th}>Pago</th>
                    <th className={cx.th}>Obs.</th>
                    <th className={cx.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {selecciones.map(s => (
                    <tr key={s.id} className={cx.tr}>
                      <td className={cx.td}>
                        <p className="text-white font-medium">{s.nombre_alumno ?? '—'}</p>
                        <p className="text-zinc-500 text-xs">{s.dni_alumno ?? '—'} {s.categoria ? `/ ${s.categoria}` : ''}</p>
                      </td>
                      <td className={`${cx.td} text-zinc-300`}>{s.modalidad ?? '—'}</td>
                      <td className={cx.td}>
                        <span className={cx.badge(ESTADO_BADGE[s.estado ?? ''] ?? badgeColors.gray)}>
                          {s.estado ?? '—'}
                        </span>
                      </td>
                      <td className={cx.td}>
                        <span className={cx.badge(PAGO_BADGE[s.estado_pago ?? ''] ?? badgeColors.gray)}>
                          {s.estado_pago ?? '—'}
                        </span>
                      </td>
                      <td className={`${cx.td} text-zinc-500 text-xs max-w-[150px] truncate`}>
                        {s.observaciones ?? '—'}
                      </td>
                      <td className={cx.td}>
                        <div className="flex gap-1">
                          <button onClick={() => openEditSel(s)} className={cx.btnIcon} title="Editar">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleRemoveSel(s.id)} className={cx.btnDanger} title="Eliminar">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add alumno modal */}
        {showAddAlumno && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/90 p-4" onClick={() => setShowAddAlumno(false)}>
            <div className={`${cx.card} p-6 w-full max-w-md space-y-4`} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Seleccionar alumno</h3>
                <button onClick={() => setShowAddAlumno(false)} className={cx.btnIcon}><X size={18} /></button>
              </div>

              <div>
                <label className={cx.label}>Buscar alumno</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    className={`${cx.input} pl-9`}
                    placeholder="Nombre o DNI..."
                    value={alumnoSearch}
                    onChange={e => { setAlumnoSearch(e.target.value); searchAlumnos(e.target.value); }}
                  />
                </div>
                {searchingAlumnos && <p className="text-zinc-500 text-xs mt-1">Buscando...</p>}
                {alumnoResults.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                    {alumnoResults.map(a => (
                      <button
                        key={a.id}
                        onClick={() => handleAddAlumno(a.id)}
                        className="w-full text-left px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-all"
                      >
                        <p className="text-white text-sm">{a.nombre_alumno ?? '—'}</p>
                        <p className="text-zinc-500 text-xs">{a.dni_alumno ?? '—'} {a.categoria ? `/ ${a.categoria}` : ''}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className={cx.label}>Modalidad</label>
                <input className={cx.input} placeholder="Ej: Combate, Poomsae..." value={addModalidad} onChange={e => setAddModalidad(e.target.value)} />
              </div>
              <div>
                <label className={cx.label}>Observaciones</label>
                <input className={cx.input} placeholder="Opcional" value={addObservaciones} onChange={e => setAddObservaciones(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Edit selection modal */}
        {editingSel && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/90 p-4" onClick={() => setEditingSel(null)}>
            <div className={`${cx.card} p-6 w-full max-w-md space-y-4`} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Editar seleccion</h3>
                <button onClick={() => setEditingSel(null)} className={cx.btnIcon}><X size={18} /></button>
              </div>
              <p className="text-zinc-400 text-sm">{editingSel.nombre_alumno ?? '—'}</p>

              <div>
                <label className={cx.label}>Estado</label>
                <select className={cx.select} value={editSelForm.estado} onChange={e => setEditSelForm(f => ({ ...f, estado: e.target.value }))}>
                  <option value="seleccionado">Seleccionado</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="descartado">Descartado</option>
                </select>
              </div>
              <div>
                <label className={cx.label}>Estado de pago</label>
                <select className={cx.select} value={editSelForm.estado_pago} onChange={e => setEditSelForm(f => ({ ...f, estado_pago: e.target.value }))}>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Pagado">Pagado</option>
                  <option value="Parcial">Parcial</option>
                </select>
              </div>
              <div>
                <label className={cx.label}>Modalidad</label>
                <input className={cx.input} value={editSelForm.modalidad} onChange={e => setEditSelForm(f => ({ ...f, modalidad: e.target.value }))} />
              </div>
              <div>
                <label className={cx.label}>Observaciones</label>
                <input className={cx.input} value={editSelForm.observaciones} onChange={e => setEditSelForm(f => ({ ...f, observaciones: e.target.value }))} />
              </div>
              <button onClick={handleSaveSel} className={`${cx.btnPrimary} w-full`}>Guardar</button>
            </div>
          </div>
        )}

        {/* Reuse create/edit modal */}
        {showModal && renderTorneoModal()}
      </div>
    );
  }

  // ── LIST VIEW ──
  function renderTorneoModal() {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/90 p-4" onClick={() => setShowModal(false)}>
        <div className={`${cx.card} p-6 w-full max-w-md space-y-4`} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">{editingTorneo ? 'Editar torneo' : 'Nuevo torneo'}</h3>
            <button onClick={() => setShowModal(false)} className={cx.btnIcon}><X size={18} /></button>
          </div>
          <div>
            <label className={cx.label}>Nombre *</label>
            <input className={cx.input} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre del torneo" />
          </div>
          <div>
            <label className={cx.label}>Tipo</label>
            <select className={cx.select} value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
              <option value="regional">Regional</option>
              <option value="nacional">Nacional</option>
              <option value="interescuelas">Interescuelas</option>
              <option value="panamericano">Panamericano</option>
              <option value="mundial">Mundial</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={cx.label}>Fecha</label>
              <input type="date" className={cx.input} value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
            </div>
            <div>
              <label className={cx.label}>Precio (S/)</label>
              <input type="number" step="0.01" min="0" className={cx.input} value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className={cx.label}>Lugar</label>
            <input className={cx.input} value={form.lugar} onChange={e => setForm(f => ({ ...f, lugar: e.target.value }))} placeholder="Lugar del torneo" />
          </div>
          <button onClick={handleSave} disabled={saving || !form.nombre.trim()} className={`${cx.btnPrimary} w-full`}>
            {saving ? 'Guardando...' : editingTorneo ? 'Actualizar' : 'Crear torneo'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Torneos activos', value: stats.torneos_activos ?? 0, icon: Trophy, color: 'text-[#FA7B21]' },
            { label: 'Selecciones', value: stats.total_selecciones ?? 0, icon: Users, color: 'text-sky-400' },
            { label: 'Confirmados', value: stats.confirmados ?? 0, icon: CheckCircle, color: 'text-emerald-400' },
            { label: 'Pago pendiente', value: stats.pago_pendiente ?? 0, icon: Clock, color: 'text-amber-400' },
          ].map(s => (
            <div key={s.label} className={`${cx.card} p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={16} className={s.color} />
                <span className="text-zinc-500 text-[10px] uppercase tracking-wider font-semibold">{s.label}</span>
              </div>
              <p className="text-white text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-lg">Torneos</h2>
        <button onClick={openCreateModal} className={cx.btnPrimary}>
          <Plus size={14} className="inline mr-1.5" /> Nuevo torneo
        </button>
      </div>

      {/* Tournament cards */}
      {torneos.length === 0 ? (
        <div className={`${cx.card} p-12 text-center`}>
          <Trophy size={40} className="mx-auto text-zinc-600 mb-4" />
          <p className="text-zinc-400">No hay torneos activos</p>
          <button onClick={openCreateModal} className={`${cx.btnPrimary} mt-4`}>
            <Plus size={14} className="inline mr-1.5" /> Crear primer torneo
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {torneos.map(t => (
            <div
              key={t.id}
              className={cx.cardHover}
              onClick={() => openDetail(t)}
            >
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-white font-semibold truncate">{t.nombre ?? '—'}</h3>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={cx.badge(TIPO_BADGE[t.tipo ?? ''] ?? badgeColors.gray)}>
                        {t.tipo ?? '—'}
                      </span>
                      {t.fecha && <span className="text-zinc-500 text-xs">{formatFecha(t.fecha)}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEditModal(t)} className={cx.btnIcon} title="Editar">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(t.id)} className={cx.btnDanger} title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 text-sm text-zinc-400">
                  {t.lugar && <span className="truncate">{t.lugar}</span>}
                  {(t.precio ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <DollarSign size={12} /> S/ {Number(t.precio).toFixed(2)}
                    </span>
                  )}
                  <span className="flex items-center gap-1 ml-auto">
                    <Users size={12} /> {t.total_selecciones ?? 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      {showModal && renderTorneoModal()}
    </div>
  );
}
