import { useState, useEffect, useCallback } from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '../../config/api';
import { cx, badgeColors } from './tokens';
import { Modal } from './Modal';
import { SpaceSelect } from './SpaceSelect';

interface Tarea {
  id: number; titulo: string; descripcion: string | null;
  estado: 'pendiente' | 'en_progreso' | 'completada';
  prioridad: 'alta' | 'media' | 'baja';
  fecha_limite: string | null; orden: number; created_at: string;
}
interface SpaceTareasProps { token: string; }

const PRIORIDAD_COLORS = { alta: badgeColors.red, media: badgeColors.yellow, baja: badgeColors.green };
const ESTADO_ORDER: Record<string, number> = { pendiente: 0, en_progreso: 1, completada: 2 };
const COLUMNS: { key: Tarea['estado']; title: string }[] = [
  { key: 'pendiente', title: 'Pendiente' },
  { key: 'en_progreso', title: 'En progreso' },
  { key: 'completada', title: 'Completada' },
];
const EMPTY_FORM = { titulo: '', descripcion: '', prioridad: 'media', fecha_limite: '', estado: 'pendiente' };

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}
const isOverdue = (t: Tarea) =>
  t.fecha_limite && t.estado !== 'completada' && new Date(t.fecha_limite + 'T23:59:59') < new Date();
const formatDate = (d: string) =>
  new Date(d + 'T12:00:00Z').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', timeZone: 'America/Lima' });

function sortTareas(list: Tarea[]): Tarea[] {
  return [...list].sort((a, b) => {
    const ea = ESTADO_ORDER[a.estado] ?? 9, eb = ESTADO_ORDER[b.estado] ?? 9;
    if (ea !== eb) return ea - eb;
    if (a.orden !== b.orden) return a.orden - b.orden;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

export function SpaceTareas({ token }: SpaceTareasProps) {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [filterPrioridad, setFilterPrioridad] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTarea, setEditingTarea] = useState<Tarea | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [hideCompleted, setHideCompleted] = useState(false);

  const fetchTareas = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/space/tareas`, { headers: authHeaders(token) });
      if (!res.ok) throw new Error('Error al cargar tareas');
      const json = await res.json();
      setTareas(Array.isArray(json) ? json : json.data || []);
    } catch (e: any) { toast.error(e.message || 'Error al cargar tareas'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchTareas(); }, [fetchTareas]);

  const openCreateModal = () => { setEditingTarea(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEditModal = (t: Tarea) => {
    setEditingTarea(t);
    setForm({ titulo: t.titulo, descripcion: t.descripcion || '', prioridad: t.prioridad, fecha_limite: t.fecha_limite || '', estado: t.estado });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingTarea(null); };

  const saveTarea = async () => {
    if (!form.titulo.trim()) { toast.error('El titulo es requerido'); return; }
    try {
      if (editingTarea) {
        const res = await fetch(`${API_BASE}/space/tareas/${editingTarea.id}`, {
          method: 'PUT', headers: authHeaders(token), body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error('Error al actualizar');
        toast.success('Tarea actualizada');
      } else {
        const res = await fetch(`${API_BASE}/space/tareas`, {
          method: 'POST', headers: authHeaders(token),
          body: JSON.stringify({ titulo: form.titulo, descripcion: form.descripcion || null, prioridad: form.prioridad, fecha_limite: form.fecha_limite || null }),
        });
        if (!res.ok) throw new Error('Error al crear');
        toast.success('Tarea creada');
      }
      closeModal(); fetchTareas();
    } catch (e: any) { toast.error(e.message); }
  };

  const deleteTarea = async (id: number) => {
    setTareas(prev => prev.filter(t => t.id !== id));
    try {
      const res = await fetch(`${API_BASE}/space/tareas/${id}`, { method: 'DELETE', headers: authHeaders(token) });
      if (!res.ok) throw new Error('Error al eliminar');
      toast.success('Tarea eliminada');
    } catch (e: any) { toast.error(e.message); fetchTareas(); }
  };

  const toggleComplete = async (t: Tarea) => {
    const newEstado = t.estado === 'completada' ? 'pendiente' : 'completada';
    setTareas(prev => prev.map(x => x.id === t.id ? { ...x, estado: newEstado } as Tarea : x));
    await fetch(`${API_BASE}/space/tareas/${t.id}`, {
      method: 'PUT', headers: authHeaders(token), body: JSON.stringify({ estado: newEstado }),
    });
  };

  const filtered = sortTareas(tareas.filter(t => {
    if (hideCompleted && t.estado === 'completada') return false;
    if (filterPrioridad && t.prioridad !== filterPrioridad) return false;
    return true;
  }));

  if (loading) return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map(i => <div key={i} className={cx.skeleton + ' h-14'} />)}
    </div>
  );

  const viewBtn = (v: 'list' | 'kanban', label: string) => (
    <button onClick={() => setView(v)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === v ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'}`}>
      {label}
    </button>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-stone-900 text-xl font-bold">Tareas</h1>
          <p className="text-stone-400 text-xs mt-1">{tareas.length} tareas</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-stone-100 rounded-lg p-0.5">
            {viewBtn('list', 'Lista')}
            {viewBtn('kanban', 'Kanban')}
          </div>
          <button onClick={openCreateModal} className={cx.btnPrimary + ' flex items-center gap-2'}>
            <Plus size={14} /> Nueva tarea
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['', 'alta', 'media', 'baja'] as const).map(p => (
          <button key={p || 'all'} onClick={() => setFilterPrioridad(p)} className={cx.chip(filterPrioridad === p)}>
            {p ? p.charAt(0).toUpperCase() + p.slice(1) : 'Todas'}
          </button>
        ))}
        <div className="w-px h-5 bg-stone-200 mx-1" />
        <button onClick={() => setHideCompleted(h => !h)} className={cx.chip(hideCompleted)}>Ocultar completadas</button>
      </div>

      {/* List View */}
      {view === 'list' && (
        <div className={cx.card + ' divide-y divide-stone-100'}>
          {filtered.length === 0 && <p className="text-stone-400 text-sm text-center py-10">Sin tareas</p>}
          {filtered.map(t => (
            <div key={t.id} className={cx.tr + ' flex items-center gap-3 px-4 py-3'}>
              <button onClick={() => toggleComplete(t)} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${t.estado === 'completada' ? 'bg-emerald-500 border-emerald-500' : 'border-stone-300 hover:border-stone-400'}`}>
                {t.estado === 'completada' && <Check size={12} className="text-white" />}
              </button>
              <div className="flex-1 min-w-0" onClick={() => openEditModal(t)}>
                <p className={`text-sm font-medium cursor-pointer ${t.estado === 'completada' ? 'line-through text-stone-400' : 'text-stone-900'}`}>{t.titulo}</p>
                {t.descripcion && <p className="text-xs text-stone-400 truncate">{t.descripcion}</p>}
              </div>
              <span className={cx.badge(PRIORIDAD_COLORS[t.prioridad])}>{t.prioridad}</span>
              {t.fecha_limite && (
                <span className={`text-xs ${isOverdue(t) ? 'text-rose-500 font-medium' : 'text-stone-400'}`}>{formatDate(t.fecha_limite)}</span>
              )}
              <button onClick={() => deleteTarea(t.id)} className={cx.btnIcon + ' text-stone-300 hover:text-rose-400'}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {COLUMNS.map(col => {
            const items = filtered.filter(t => t.estado === col.key);
            return (
              <div key={col.key} className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-stone-500 text-xs font-semibold uppercase tracking-wider">{col.title}</h3>
                  <span className="text-stone-400 text-xs">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map(t => (
                    <div key={t.id} onClick={() => openEditModal(t)} className={cx.card + ' p-3 cursor-pointer hover:shadow-md transition-shadow'}>
                      <p className="text-stone-900 text-sm font-medium mb-2">{t.titulo}</p>
                      <div className="flex items-center justify-between">
                        <span className={cx.badge(PRIORIDAD_COLORS[t.prioridad])}>{t.prioridad}</span>
                        {t.fecha_limite && (
                          <span className={`text-[10px] ${isOverdue(t) ? 'text-rose-500' : 'text-stone-400'}`}>{formatDate(t.fecha_limite)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <p className="text-stone-300 text-xs text-center py-6">Sin tareas</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal open={showModal} onClose={closeModal} title={editingTarea ? 'Editar tarea' : 'Nueva tarea'} footer={<>
        <button onClick={closeModal} className={cx.btnSecondary}>Cancelar</button>
        <button onClick={saveTarea} className={cx.btnPrimary}>{editingTarea ? 'Guardar' : 'Crear'}</button>
      </>}>
        <div className="space-y-4">
          <div>
            <label className={cx.label}>Titulo *</label>
            <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} className={cx.input} placeholder="Nombre de la tarea" />
          </div>
          <div>
            <label className={cx.label}>Descripcion</label>
            <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} className={cx.input + ' min-h-[80px]'} placeholder="Detalles opcionales..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={cx.label}>Prioridad</label>
              <SpaceSelect value={form.prioridad} onChange={v => setForm(f => ({ ...f, prioridad: v }))} options={[{ value: 'alta', label: 'Alta' }, { value: 'media', label: 'Media' }, { value: 'baja', label: 'Baja' }]} />
            </div>
            <div>
              <label className={cx.label}>Fecha limite</label>
              <input type="date" value={form.fecha_limite} onChange={e => setForm(f => ({ ...f, fecha_limite: e.target.value }))} className={cx.input} />
            </div>
          </div>
          {editingTarea && (
            <div>
              <label className={cx.label}>Estado</label>
              <SpaceSelect value={form.estado} onChange={v => setForm(f => ({ ...f, estado: v }))} options={[{ value: 'pendiente', label: 'Pendiente' }, { value: 'en_progreso', label: 'En progreso' }, { value: 'completada', label: 'Completada' }]} />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
