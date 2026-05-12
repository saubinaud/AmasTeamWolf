import { useState, useEffect, useCallback } from 'react';
import { Trophy, Plus, Pencil, Trash2, Users, CheckCircle, Clock, DollarSign, Search, X, ChevronLeft, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';
import { API_BASE } from '../../config/api';
import { cx, badgeColors } from './tokens';
import { formatFecha } from './dateUtils';
import { Modal } from './Modal';
import { SpaceSelect } from './SpaceSelect';

interface TorneoConfig {
  id: number;
  nombre: string;
  descripcion: string | null;
  tipo: string;
  fecha: string | null;
  lugar: string | null;
  precio: number;
  precio_entrada: number;
  activo: boolean;
  total_selecciones: number;
  created_at: string;
}

interface Modalidad {
  id: number;
  torneo_id: number;
  nombre: string;
  icono: string;
  implementos_requeridos: string[];
  activo: boolean;
  orden: number;
}

interface Seleccion {
  id: number;
  torneo_id: number;
  alumno_id: number;
  modalidad: string | null;
  modalidades: string[] | null;
  estado: string;
  estado_pago: string;
  precio_total: number | null;
  descuento: number | null;
  descuento_tipo: string | null;
  implementos_faltantes: string[] | null;
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

const TIPO_OPTIONS = [
  { value: 'regional', label: 'Regional' },
  { value: 'nacional', label: 'Nacional' },
  { value: 'interescuelas', label: 'Interescuelas' },
  { value: 'panamericano', label: 'Panamericano' },
  { value: 'mundial', label: 'Mundial' },
];

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
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [loadingMod, setLoadingMod] = useState(false);

  // Create/edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingTorneo, setEditingTorneo] = useState<TorneoConfig | null>(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', tipo: 'regional', fecha: '', lugar: '', precio: '', precio_entrada: '25' });
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

  const loadModalidades = useCallback(async (torneoId: number) => {
    try {
      setLoadingMod(true);
      const res = await apiFetch(`/${torneoId}/modalidades`, token);
      setModalidades(res?.data ?? []);
    } catch { setModalidades([]); }
    finally { setLoadingMod(false); }
  }, [token]);

  const openDetail = useCallback((t: TorneoConfig) => {
    setSelectedTorneo(t);
    loadSelecciones(t.id);
    loadModalidades(t.id);
  }, [loadSelecciones, loadModalidades]);

  const backToList = useCallback(() => {
    setSelectedTorneo(null);
    setSelecciones([]);
    setModalidades([]);
    loadTorneos();
  }, [loadTorneos]);

  // Create / Edit tournament
  const openCreateModal = useCallback(() => {
    setEditingTorneo(null);
    setForm({ nombre: '', descripcion: '', tipo: 'regional', fecha: '', lugar: '', precio: '', precio_entrada: '25' });
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((t: TorneoConfig) => {
    setEditingTorneo(t);
    setForm({
      nombre: t.nombre ?? '',
      descripcion: t.descripcion ?? '',
      tipo: t.tipo ?? 'regional',
      fecha: t.fecha ? t.fecha.split('T')[0] : '',
      lugar: t.lugar ?? '',
      precio: String(t.precio ?? 0),
      precio_entrada: String(t.precio_entrada ?? 25),
    });
    setShowModal(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.nombre.trim()) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        nombre: form.nombre.trim(),
        tipo: form.tipo,
        fecha: form.fecha || null,
        lugar: form.lugar.trim() || null,
        precio: parseFloat(form.precio) || 0,
      };
      if (!editingTorneo) {
        body.descripcion = form.descripcion.trim() || null;
        body.precio_entrada = parseFloat(form.precio_entrada) || 25;
      }
      if (editingTorneo) {
        body.descripcion = form.descripcion.trim() || null;
        body.precio_entrada = parseFloat(form.precio_entrada) || 25;
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

  // Toggle modalidad activo
  const toggleModalidad = useCallback(async (mod: Modalidad) => {
    try {
      await apiFetch(`/modalidades/${mod.id}`, token, {
        method: 'PUT',
        body: JSON.stringify({ activo: !mod.activo }),
      });
      setModalidades(prev => prev.map(m => m.id === mod.id ? { ...m, activo: !m.activo } : m));
    } catch { /* silently fail */ }
  }, [token]);

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

        {/* Torneo info card */}
        <div className={`${cx.card} p-5`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-stone-900 text-lg font-semibold">{selectedTorneo.nombre ?? '—'}</h2>
              {selectedTorneo.descripcion && (
                <p className="text-stone-500 text-sm mt-1">{selectedTorneo.descripcion}</p>
              )}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className={cx.badge(TIPO_BADGE[selectedTorneo.tipo ?? ''] ?? badgeColors.gray)}>
                  {selectedTorneo.tipo ?? '—'}
                </span>
                {selectedTorneo.fecha && (
                  <span className="text-stone-500 text-sm">{formatFecha(selectedTorneo.fecha)}</span>
                )}
                {selectedTorneo.lugar && (
                  <span className="text-stone-400 text-sm">{selectedTorneo.lugar}</span>
                )}
                {(selectedTorneo.precio ?? 0) > 0 && (
                  <span className="text-emerald-400 text-sm font-medium">S/ {Number(selectedTorneo.precio).toFixed(2)}</span>
                )}
                {(selectedTorneo.precio_entrada ?? 0) > 0 && (
                  <span className="text-stone-400 text-sm">Entrada: S/ {Number(selectedTorneo.precio_entrada).toFixed(2)}</span>
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

        {/* Modalidades section */}
        <div>
          <h3 className="text-stone-900 font-semibold mb-3">Modalidades</h3>
          {loadingMod ? (
            <div className={`${cx.skeleton} h-24`} />
          ) : modalidades.length === 0 ? (
            <div className={`${cx.card} p-6 text-center`}>
              <p className="text-stone-500 text-sm">No hay modalidades configuradas</p>
            </div>
          ) : (
            <div className={`${cx.card} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone-200">
                      <th className={cx.th}>Nombre</th>
                      <th className={cx.th}>Icono</th>
                      <th className={cx.th}>Implementos</th>
                      <th className={cx.th}>Activo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalidades.map(m => (
                      <tr key={m.id} className={cx.tr}>
                        <td className={`${cx.td} text-stone-900 font-medium`}>{m.nombre}</td>
                        <td className={`${cx.td} text-stone-400 text-xs font-mono`}>{m.icono}</td>
                        <td className={cx.td}>
                          {(m.implementos_requeridos ?? []).length > 0 ? (
                            <div className="flex gap-1 flex-wrap">
                              {m.implementos_requeridos.map(imp => (
                                <span key={imp} className={cx.badge(badgeColors.violet)}>{imp}</span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-stone-300 text-xs">—</span>
                          )}
                        </td>
                        <td className={cx.td}>
                          <button
                            onClick={() => toggleModalidad(m)}
                            className="transition-colors"
                            title={m.activo ? 'Desactivar' : 'Activar'}
                          >
                            {m.activo ? (
                              <ToggleRight size={28} className="text-[var(--accent)]" />
                            ) : (
                              <ToggleLeft size={28} className="text-stone-300" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Inscripciones section */}
        <div>
          <h3 className="text-stone-900 font-semibold mb-3">Inscripciones</h3>
          {loadingSel ? (
            <div className={`${cx.skeleton} h-32`} />
          ) : selecciones.length === 0 ? (
            <div className={`${cx.card} p-8 text-center`}>
              <Users size={32} className="mx-auto text-stone-300 mb-3" />
              <p className="text-stone-500 text-sm">No hay alumnos seleccionados para este torneo</p>
            </div>
          ) : (
            <div className={`${cx.card} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone-200">
                      <th className={cx.th}>Alumno</th>
                      <th className={cx.th}>Modalidades</th>
                      <th className={cx.th}>Precio</th>
                      <th className={cx.th}>Descuento</th>
                      <th className={cx.th}>Pago</th>
                      <th className={cx.th}>Implementos faltantes</th>
                      <th className={cx.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selecciones.map(s => (
                      <tr key={s.id} className={cx.tr}>
                        <td className={cx.td}>
                          <p className="text-stone-900 font-medium">{s.nombre_alumno ?? '—'}</p>
                          <p className="text-stone-400 text-xs">{s.dni_alumno ?? '—'} {s.categoria ? `/ ${s.categoria}` : ''}</p>
                        </td>
                        <td className={cx.td}>
                          {(s.modalidades ?? []).length > 0 ? (
                            <div className="flex gap-1 flex-wrap">
                              {(s.modalidades ?? []).map(mod => (
                                <span key={mod} className={cx.badge(badgeColors.orange)}>{mod}</span>
                              ))}
                            </div>
                          ) : s.modalidad ? (
                            <span className={cx.badge(badgeColors.orange)}>{s.modalidad}</span>
                          ) : (
                            <span className="text-stone-300 text-xs">—</span>
                          )}
                        </td>
                        <td className={cx.td}>
                          {s.precio_total != null ? (
                            <span className="text-stone-700 text-sm font-medium">S/ {Number(s.precio_total).toFixed(2)}</span>
                          ) : (
                            <span className="text-stone-300 text-xs">—</span>
                          )}
                        </td>
                        <td className={cx.td}>
                          {s.descuento != null && Number(s.descuento) > 0 ? (
                            <span className={cx.badge(badgeColors.green)}>
                              {s.descuento_tipo === 'porcentaje' ? `${s.descuento}%` : `S/ ${Number(s.descuento).toFixed(2)}`}
                            </span>
                          ) : (
                            <span className="text-stone-300 text-xs">—</span>
                          )}
                        </td>
                        <td className={cx.td}>
                          <span className={cx.badge(PAGO_BADGE[s.estado_pago ?? ''] ?? badgeColors.gray)}>
                            {s.estado_pago ?? '—'}
                          </span>
                        </td>
                        <td className={cx.td}>
                          {(s.implementos_faltantes ?? []).length > 0 ? (
                            <div className="flex gap-1 flex-wrap">
                              {(s.implementos_faltantes ?? []).map(imp => (
                                <span key={imp} className={cx.badge('bg-amber-50 text-amber-600')}>
                                  <AlertTriangle size={10} className="mr-1" />{imp}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-stone-300 text-xs">—</span>
                          )}
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
        </div>

        {/* Add alumno modal */}
        <Modal open={showAddAlumno} onClose={() => setShowAddAlumno(false)} title="Seleccionar alumno">
          <div className="space-y-4">
            <div>
              <label className={cx.label}>Buscar alumno</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  className={`${cx.input} pl-9`}
                  placeholder="Nombre o DNI..."
                  value={alumnoSearch}
                  onChange={e => { setAlumnoSearch(e.target.value); searchAlumnos(e.target.value); }}
                />
              </div>
              {searchingAlumnos && <p className="text-stone-400 text-xs mt-1">Buscando...</p>}
              {alumnoResults.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                  {alumnoResults.map(a => (
                    <button
                      key={a.id}
                      onClick={() => handleAddAlumno(a.id)}
                      className="w-full text-left px-3 py-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 transition-all"
                    >
                      <p className="text-stone-900 text-sm">{a.nombre_alumno ?? '—'}</p>
                      <p className="text-stone-400 text-xs">{a.dni_alumno ?? '—'} {a.categoria ? `/ ${a.categoria}` : ''}</p>
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
        </Modal>

        {/* Edit selection modal */}
        <Modal open={!!editingSel} onClose={() => setEditingSel(null)} title="Editar seleccion"
          footer={<button onClick={handleSaveSel} className={cx.btnPrimary}>Guardar</button>}
        >
          <div className="space-y-4">
            {editingSel && <p className="text-stone-500 text-sm">{editingSel.nombre_alumno ?? '—'}</p>}
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
          </div>
        </Modal>

        {/* Reuse create/edit modal */}
        {renderTorneoModal()}
      </div>
    );
  }

  // ── TORNEO CREATE/EDIT MODAL ──
  function renderTorneoModal() {
    return (
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingTorneo ? 'Editar torneo' : 'Nuevo torneo'}
        footer={
          <button onClick={handleSave} disabled={saving || !form.nombre.trim()} className={cx.btnPrimary}>
            {saving ? 'Guardando...' : editingTorneo ? 'Actualizar' : 'Crear torneo'}
          </button>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={cx.label}>Nombre *</label>
            <input className={cx.input} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre del torneo" />
          </div>
          <div>
            <label className={cx.label}>Descripcion</label>
            <textarea
              className={`${cx.input} min-h-[80px] resize-y`}
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              placeholder="Descripcion del torneo (opcional)"
              rows={3}
            />
          </div>
          <div>
            <label className={cx.label}>Tipo</label>
            <SpaceSelect
              value={form.tipo}
              onChange={v => setForm(f => ({ ...f, tipo: v }))}
              options={TIPO_OPTIONS}
            />
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={cx.label}>Precio entrada (S/)</label>
              <input type="number" step="0.01" min="0" className={cx.input} value={form.precio_entrada} onChange={e => setForm(f => ({ ...f, precio_entrada: e.target.value }))} placeholder="25" />
            </div>
            <div>
              <label className={cx.label}>Lugar</label>
              <input className={cx.input} value={form.lugar} onChange={e => setForm(f => ({ ...f, lugar: e.target.value }))} placeholder="Lugar del torneo" />
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  // ── LIST VIEW ──
  return (
    <div className="space-y-5">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Torneos activos', value: stats.torneos_activos ?? 0, icon: Trophy, color: 'text-[var(--accent)]' },
            { label: 'Selecciones', value: stats.total_selecciones ?? 0, icon: Users, color: 'text-sky-400' },
            { label: 'Confirmados', value: stats.confirmados ?? 0, icon: CheckCircle, color: 'text-emerald-400' },
            { label: 'Pago pendiente', value: stats.pago_pendiente ?? 0, icon: Clock, color: 'text-amber-400' },
          ].map(s => (
            <div key={s.label} className={`${cx.card} p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={16} className={s.color} />
                <span className="text-stone-400 text-[10px] uppercase tracking-wider font-semibold">{s.label}</span>
              </div>
              <p className="text-stone-900 text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-stone-900 font-semibold text-lg">Torneos</h2>
        <button onClick={openCreateModal} className={cx.btnPrimary}>
          <Plus size={14} className="inline mr-1.5" /> Nuevo torneo
        </button>
      </div>

      {/* Tournament cards */}
      {torneos.length === 0 ? (
        <div className={`${cx.card} p-12 text-center`}>
          <Trophy size={40} className="mx-auto text-stone-300 mb-4" />
          <p className="text-stone-500">No hay torneos activos</p>
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
                    <h3 className="text-stone-900 font-semibold truncate">{t.nombre ?? '—'}</h3>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={cx.badge(TIPO_BADGE[t.tipo ?? ''] ?? badgeColors.gray)}>
                        {t.tipo ?? '—'}
                      </span>
                      {t.fecha && <span className="text-stone-400 text-xs">{formatFecha(t.fecha)}</span>}
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

                <div className="flex items-center gap-4 mt-3 text-sm text-stone-500">
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
      {renderTorneoModal()}
    </div>
  );
}
