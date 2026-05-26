import { useState, useEffect, useCallback } from 'react';
import { Plus, Check, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { API_BASE } from '../../config/api';
import { cx, badgeColors } from './tokens';
import { Modal } from './Modal';
import { SpaceSelect } from './SpaceSelect';

interface Tarea {
  id: number; titulo: string; descripcion: string | null;
  estado: 'pendiente' | 'en_progreso' | 'completada';
  prioridad: 'alta' | 'media' | 'baja';
  fecha_limite: string | null; asignado_a: string | null;
  imagen_url: string | null; orden: number; created_at: string;
}
interface SpaceTareasProps { token: string; }

const PRIORIDAD_COLORS = { alta: badgeColors.red, media: badgeColors.yellow, baja: badgeColors.green };
const COLUMNS: { key: Tarea['estado']; title: string; color: string }[] = [
  { key: 'pendiente', title: 'Pendiente', color: 'bg-stone-400' },
  { key: 'en_progreso', title: 'En progreso', color: 'bg-amber-400' },
  { key: 'completada', title: 'Completada', color: 'bg-emerald-400' },
];
const EMPTY_FORM = { titulo: '', descripcion: '', prioridad: 'media', fecha_limite: '', estado: 'pendiente', asignado_a: '', imagen_url: '' };

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}
const isOverdue = (t: Tarea) =>
  t.fecha_limite && t.estado !== 'completada' && new Date(t.fecha_limite.split('T')[0] + 'T23:59:59') < new Date();
const formatDate = (d: string) => {
  try {
    const dateOnly = d.split('T')[0];
    return new Date(dateOnly + 'T12:00:00Z').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', timeZone: 'America/Lima' });
  } catch { return d; }
};
function sortTareas(arr: Tarea[]) {
  const order: Record<string, number> = { pendiente: 0, en_progreso: 1, completada: 2 };
  return [...arr].sort((a, b) => {
    const diff = (order[a.estado] ?? 9) - (order[b.estado] ?? 9);
    if (diff !== 0) return diff;
    if (a.orden !== b.orden) return a.orden - b.orden;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

// ── Sortable Card ──
function SortableCard({ tarea, onEdit, onToggle, onDelete }: { tarea: Tarea; onEdit: (t: Tarea) => void; onToggle: (t: Tarea) => void; onDelete: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tarea.id, data: { estado: tarea.estado } });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 50 : undefined };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className={cx.card + ' p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow'}
    >
      {tarea.imagen_url && <img src={tarea.imagen_url} alt="" className="w-full h-24 object-cover rounded-lg mb-2" />}
      <div className="flex items-start gap-2">
        <button onClick={(e) => { e.stopPropagation(); onToggle(tarea); }}
          className={`w-4 h-4 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${tarea.estado === 'completada' ? 'bg-emerald-500 border-emerald-500' : 'border-stone-300 hover:border-stone-400'}`}>
          {tarea.estado === 'completada' && <Check size={10} className="text-white" />}
        </button>
        <p onClick={() => onEdit(tarea)} className={`text-sm font-medium cursor-pointer flex-1 ${tarea.estado === 'completada' ? 'line-through text-stone-400' : 'text-stone-900'}`}>
          {tarea.titulo}
        </p>
        <button onClick={(e) => { e.stopPropagation(); onDelete(tarea.id); }} className="p-0.5 text-stone-300 hover:text-rose-400 shrink-0"><Trash2 size={12} /></button>
      </div>
      <div className="flex items-center justify-between gap-2 mt-2">
        <span className={cx.badge(PRIORIDAD_COLORS[tarea.prioridad])}>{tarea.prioridad}</span>
        {tarea.fecha_limite && (
          <span className={`text-[10px] ${isOverdue(tarea) ? 'text-rose-500 font-medium' : 'text-stone-400'}`}>{formatDate(tarea.fecha_limite)}</span>
        )}
      </div>
      {tarea.asignado_a && (
        <div className="flex items-center gap-1.5 mt-2">
          <div className="w-5 h-5 rounded-full bg-stone-200 flex items-center justify-center">
            <span className="text-[9px] font-bold text-stone-500">{tarea.asignado_a.charAt(0).toUpperCase()}</span>
          </div>
          <span className="text-[11px] text-stone-400">{tarea.asignado_a}</span>
        </div>
      )}
    </div>
  );
}

// ── Droppable Column ──
function KanbanColumn({ col, items, onEdit, onToggle, onDelete }: {
  col: typeof COLUMNS[0]; items: Tarea[];
  onEdit: (t: Tarea) => void; onToggle: (t: Tarea) => void; onDelete: (id: number) => void;
}) {
  return (
    <div className="flex-1 min-w-[220px] bg-stone-50/80 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`w-2 h-2 rounded-full ${col.color}`} />
        <h3 className="text-stone-600 text-xs font-semibold uppercase tracking-wider">{col.title}</h3>
        <span className="text-stone-300 text-xs">{items.length}</span>
      </div>
      <SortableContext items={items.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[60px]">
          {items.map(t => <SortableCard key={t.id} tarea={t} onEdit={onEdit} onToggle={onToggle} onDelete={onDelete} />)}
          {items.length === 0 && <p className="text-stone-300 text-xs text-center py-8">Sin tareas</p>}
        </div>
      </SortableContext>
    </div>
  );
}

// ── Main ──
export function SpaceTareas({ token }: SpaceTareasProps) {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [filterPrioridad, setFilterPrioridad] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTarea, setEditingTarea] = useState<Tarea | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

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
    setForm({
      titulo: t.titulo, descripcion: t.descripcion || '', prioridad: t.prioridad,
      fecha_limite: t.fecha_limite ? t.fecha_limite.split('T')[0] : '', estado: t.estado,
      asignado_a: t.asignado_a || '', imagen_url: t.imagen_url || '',
    });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingTarea(null); };

  const saveTarea = async () => {
    if (!form.titulo.trim()) { toast.error('El titulo es requerido'); return; }
    const payload = {
      titulo: form.titulo, descripcion: form.descripcion || null,
      prioridad: form.prioridad, fecha_limite: form.fecha_limite || null,
      estado: form.estado, asignado_a: form.asignado_a || null,
      imagen_url: form.imagen_url || null,
    };
    try {
      const url = editingTarea ? `${API_BASE}/space/tareas/${editingTarea.id}` : `${API_BASE}/space/tareas`;
      const res = await fetch(url, { method: editingTarea ? 'PUT' : 'POST', headers: authHeaders(token), body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Error al guardar');
      toast.success(editingTarea ? 'Tarea actualizada' : 'Tarea creada');
      closeModal(); fetchTareas();
    } catch (e: any) { toast.error(e.message); }
  };

  const deleteTarea = async (id: number) => {
    setTareas(prev => prev.filter(t => t.id !== id));
    try {
      await fetch(`${API_BASE}/space/tareas/${id}`, { method: 'DELETE', headers: authHeaders(token) });
    } catch { fetchTareas(); }
  };

  const toggleComplete = async (t: Tarea) => {
    const newEstado = t.estado === 'completada' ? 'pendiente' : 'completada';
    setTareas(prev => prev.map(x => x.id === t.id ? { ...x, estado: newEstado } as Tarea : x));
    await fetch(`${API_BASE}/space/tareas/${t.id}`, { method: 'PUT', headers: authHeaders(token), body: JSON.stringify({ estado: newEstado }) });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', 'ml_default');
      const res = await fetch('https://api.cloudinary.com/v1_1/dkoocok3j/image/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.secure_url) setForm(f => ({ ...f, imagen_url: data.secure_url }));
    } catch { toast.error('Error al subir imagen'); }
    finally { setUploading(false); }
  };

  // DnD handlers
  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as number);
  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const draggedTarea = tareas.find(t => t.id === active.id);
    if (!draggedTarea) return;

    // Determine target column from where it was dropped
    const overTarea = tareas.find(t => t.id === over.id);
    const targetEstado = overTarea?.estado || (over.id as string);

    // Check if it's a column ID (string) or a tarea ID (number)
    let newEstado: string;
    if (typeof over.id === 'string' && COLUMNS.some(c => c.key === over.id)) {
      newEstado = over.id;
    } else if (overTarea) {
      newEstado = overTarea.estado;
    } else {
      return;
    }

    if (draggedTarea.estado !== newEstado) {
      setTareas(prev => prev.map(t => t.id === active.id ? { ...t, estado: newEstado as Tarea['estado'] } : t));
      await fetch(`${API_BASE}/space/tareas/${active.id}`, {
        method: 'PUT', headers: authHeaders(token), body: JSON.stringify({ estado: newEstado }),
      });
      fetchTareas();
    }
  };

  const activeTarea = activeId ? tareas.find(t => t.id === activeId) : null;

  const filtered = sortTareas(tareas.filter(t => {
    if (hideCompleted && t.estado === 'completada') return false;
    if (filterPrioridad && t.prioridad !== filterPrioridad) return false;
    return true;
  }));

  if (loading) return (
    <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className={cx.skeleton + ' h-12 w-full'} />)}</div>
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
            <button onClick={() => setView('list')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === 'list' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'}`}>Lista</button>
            <button onClick={() => setView('kanban')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === 'kanban' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'}`}>Kanban</button>
          </div>
          <button onClick={openCreateModal} className={cx.btnPrimary + ' flex items-center gap-2'}><Plus size={14} /> Nueva tarea</button>
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
              <button onClick={() => toggleComplete(t)} className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${t.estado === 'completada' ? 'bg-emerald-500 border-emerald-500' : 'border-stone-300 hover:border-stone-400'}`}>
                {t.estado === 'completada' && <Check size={12} className="text-white" />}
              </button>
              <div className="flex-1 min-w-0 flex items-center gap-2 cursor-pointer" onClick={() => openEditModal(t)}>
                <p className={`text-sm font-medium truncate ${t.estado === 'completada' ? 'line-through text-stone-400' : 'text-stone-900'}`}>{t.titulo}</p>
                {t.asignado_a && <span className="text-[10px] text-stone-400 shrink-0">→ {t.asignado_a}</span>}
                {t.imagen_url && <img src={t.imagen_url} alt="" className="w-8 h-8 rounded object-cover shrink-0" />}
              </div>
              <span className={cx.badge(PRIORIDAD_COLORS[t.prioridad])}>{t.prioridad}</span>
              {t.fecha_limite && <span className={`text-xs whitespace-nowrap ${isOverdue(t) ? 'text-rose-500 font-medium' : 'text-stone-400'}`}>{formatDate(t.fecha_limite)}</span>}
              <button onClick={() => deleteTarea(t.id)} className={cx.btnIcon + ' text-stone-300 hover:text-rose-400'}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Kanban View */}
      {view === 'kanban' && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {COLUMNS.map(col => (
              <KanbanColumn key={col.key} col={col}
                items={filtered.filter(t => t.estado === col.key)}
                onEdit={openEditModal} onToggle={toggleComplete} onDelete={deleteTarea}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTarea && (
              <div className={cx.card + ' p-3 shadow-xl rotate-2 w-[220px]'}>
                <p className="text-stone-900 text-sm font-medium">{activeTarea.titulo}</p>
                <span className={cx.badge(PRIORIDAD_COLORS[activeTarea.prioridad]) + ' mt-2'}>{activeTarea.prioridad}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Modal */}
      <Modal open={showModal} onClose={closeModal} title={editingTarea ? 'Editar tarea' : 'Nueva tarea'}
        footer={<>
          <button onClick={closeModal} className={cx.btnSecondary}>Cancelar</button>
          <button onClick={saveTarea} disabled={uploading} className={cx.btnPrimary}>{uploading ? 'Subiendo...' : 'Guardar'}</button>
        </>}
      >
        <div className="space-y-4">
          <div><label className={cx.label}>Titulo *</label><input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} className={cx.input} placeholder="Que hay que hacer?" /></div>
          <div><label className={cx.label}>Descripcion</label><textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} className={cx.input + ' min-h-[80px]'} placeholder="Detalles..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={cx.label}>Prioridad</label><SpaceSelect value={form.prioridad} onChange={v => setForm(f => ({ ...f, prioridad: v }))} options={[{ value: 'alta', label: 'Alta' }, { value: 'media', label: 'Media' }, { value: 'baja', label: 'Baja' }]} /></div>
            <div><label className={cx.label}>Fecha limite</label><input type="date" value={form.fecha_limite} onChange={e => setForm(f => ({ ...f, fecha_limite: e.target.value }))} className={cx.input} /></div>
          </div>
          <div><label className={cx.label}>Asignado a</label><input value={form.asignado_a} onChange={e => setForm(f => ({ ...f, asignado_a: e.target.value }))} placeholder="Nombre..." className={cx.input} /></div>
          {editingTarea && (
            <div><label className={cx.label}>Estado</label><SpaceSelect value={form.estado} onChange={v => setForm(f => ({ ...f, estado: v }))} options={[{ value: 'pendiente', label: 'Pendiente' }, { value: 'en_progreso', label: 'En progreso' }, { value: 'completada', label: 'Completada' }]} /></div>
          )}
          <div>
            <label className={cx.label}>Imagen adjunta</label>
            {form.imagen_url ? (
              <div className="relative">
                <img src={form.imagen_url} alt="" className="w-full h-32 object-cover rounded-xl border border-stone-200" />
                <button onClick={() => setForm(f => ({ ...f, imagen_url: '' }))} className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"><X size={12} /></button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-stone-400 transition-colors">
                <ImageIcon size={16} className="text-stone-400" />
                <span className="text-stone-400 text-sm">{uploading ? 'Subiendo...' : 'Subir imagen'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
