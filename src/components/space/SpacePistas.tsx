import { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, Plus, Pencil, Trash2, MapPin, Swords } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '../../config/api';
import { cx, badgeColors } from './tokens';
import { Modal } from './Modal';
import { SpaceSelect } from './SpaceSelect';

interface SpacePistasProps { token: string; }

interface Torneo { id: number; nombre: string; activo: boolean; }
interface Pista { id: number; torneo_id: number; numero: number; nombre: string | null; total_combates: number; }
interface Combate {
  id: number; torneo_id: number; pista_id: number; modalidad_id: number;
  hora: string; alumno1_id: number; alumno2_id: number;
  alumno1_nombre: string; alumno2_nombre: string; modalidad_nombre: string;
  estado: string; ganador_id: number | null;
  puntaje_alumno1: number | null; puntaje_alumno2: number | null;
  observaciones: string | null;
}
interface Modalidad { id: number; nombre: string; }
interface Alumno { id: number; nombre_alumno: string; alumno_id: number; }

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// Time slots 08:00 to 18:00 every 15 min
const TIME_SLOTS: { value: string; label: string }[] = [];
for (let h = 8; h <= 18; h++) {
  for (let m = 0; m < 60; m += 15) {
    const t = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    TIME_SLOTS.push({ value: t, label: t });
  }
}

const ESTADO_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_curso', label: 'En curso' },
  { value: 'finalizado', label: 'Finalizado' },
];

export function SpacePistas({ token }: SpacePistasProps) {
  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [selectedTorneoId, setSelectedTorneoId] = useState('');
  const [pistas, setPistas] = useState<Pista[]>([]);
  const [loadingPistas, setLoadingPistas] = useState(false);

  // Detail view
  const [selectedPista, setSelectedPista] = useState<Pista | null>(null);
  const [combates, setCombates] = useState<Combate[]>([]);
  const [loadingCombates, setLoadingCombates] = useState(false);

  // Jueces
  const [jueces, setJueces] = useState<Array<{id: number; nombre: string; pista_id: number|null; pista_numero?: number}>>([]);
  const [newJuezNombre, setNewJuezNombre] = useState('');

  // Modals
  const [showCreatePista, setShowCreatePista] = useState(false);
  const [pistaForm, setPistaForm] = useState({ numero: '', nombre: '' });

  const [showCreateCombate, setShowCreateCombate] = useState(false);
  const [combateForm, setCombateForm] = useState({ hora: '08:00', modalidad_id: '', alumno1_id: '', alumno2_id: '' });

  const [editingCombate, setEditingCombate] = useState<Combate | null>(null);
  const [editForm, setEditForm] = useState({ estado: 'pendiente', ganador_id: '', puntaje_alumno1: '', puntaje_alumno2: '', observaciones: '' });

  // Data for combate creation
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);

  // Load torneos
  useEffect(() => {
    fetch(`${API_BASE}/space/torneos`, { headers: authHeaders(token) })
      .then(r => r.json())
      .then(data => setTorneos((data?.data ?? []).filter((t: Torneo) => t.activo)))
      .catch(() => {});
  }, [token]);

  // Load pistas when torneo selected
  const loadPistas = useCallback(async (torneoId: string) => {
    if (!torneoId) { setPistas([]); return; }
    setLoadingPistas(true);
    try {
      const res = await fetch(`${API_BASE}/space/pistas/${torneoId}`, { headers: authHeaders(token) });
      const data = await res.json();
      setPistas(data?.data ?? []);
    } catch { setPistas([]); }
    finally { setLoadingPistas(false); }
  }, [token]);

  useEffect(() => { loadPistas(selectedTorneoId); }, [selectedTorneoId, loadPistas]);

  // Jueces
  const loadJueces = useCallback(async () => {
    if (!selectedTorneoId) { setJueces([]); return; }
    try {
      const res = await fetch(`${API_BASE}/space/torneos/${selectedTorneoId}/jueces`, { headers: authHeaders(token) });
      const data = await res.json();
      if (data.success) setJueces(data.data);
    } catch { setJueces([]); }
  }, [selectedTorneoId, token]);

  useEffect(() => { loadJueces(); }, [loadJueces]);

  const createJuez = async () => {
    if (!newJuezNombre.trim() || !selectedTorneoId) return;
    try {
      const res = await fetch(`${API_BASE}/space/torneos/${selectedTorneoId}/jueces`, {
        method: 'POST', headers: authHeaders(token),
        body: JSON.stringify({ nombre: newJuezNombre.trim() }),
      });
      if (!res.ok) throw new Error();
      toast.success('Juez agregado');
      setNewJuezNombre('');
      loadJueces();
    } catch { toast.error('Error al agregar juez'); }
  };

  const deleteJuez = async (id: number) => {
    if (!confirm('Eliminar este juez?')) return;
    try {
      const res = await fetch(`${API_BASE}/space/torneos/jueces/${id}`, { method: 'DELETE', headers: authHeaders(token) });
      if (!res.ok) throw new Error();
      toast.success('Juez eliminado');
      loadJueces();
    } catch { toast.error('Error al eliminar juez'); }
  };

  const assignJuezToPista = async (juezId: number, pistaId: number | null) => {
    try {
      const res = await fetch(`${API_BASE}/space/torneos/jueces/${juezId}`, {
        method: 'PUT', headers: authHeaders(token),
        body: JSON.stringify({ pista_id: pistaId }),
      });
      if (!res.ok) throw new Error();
      loadJueces();
    } catch { toast.error('Error al asignar juez'); }
  };

  // All combates for the torneo (loaded with pistas for tatami cards)
  const [allCombates, setAllCombates] = useState<Combate[]>([]);

  // Load all combates for the torneo
  const loadAllCombates = useCallback(async () => {
    if (!selectedTorneoId) { setAllCombates([]); return; }
    try {
      const res = await fetch(`${API_BASE}/space/pistas/${selectedTorneoId}/combates`, { headers: authHeaders(token) });
      const data = await res.json();
      setAllCombates(data?.data ?? []);
    } catch { setAllCombates([]); }
  }, [token, selectedTorneoId]);

  useEffect(() => { loadAllCombates(); }, [loadAllCombates]);

  // Current combate per pista (first non-finished, or last if all finished)
  const currentCombateByPista = useMemo(() => {
    const map: Record<number, Combate> = {};
    allCombates.forEach(c => {
      if (!map[c.pista_id] || (map[c.pista_id].estado === 'finalizado' && c.estado !== 'finalizado')) {
        map[c.pista_id] = c;
      }
    });
    return map;
  }, [allCombates]);

  // Load combates for selected pista
  const loadCombates = useCallback(async () => {
    if (!selectedTorneoId) return;
    setLoadingCombates(true);
    try {
      const res = await fetch(`${API_BASE}/space/pistas/${selectedTorneoId}/combates`, { headers: authHeaders(token) });
      const data = await res.json();
      const all: Combate[] = data?.data ?? [];
      setCombates(selectedPista ? all.filter(c => c.pista_id === selectedPista.id) : all);
    } catch { setCombates([]); }
    finally { setLoadingCombates(false); }
  }, [token, selectedTorneoId, selectedPista]);

  useEffect(() => { if (selectedPista) loadCombates(); }, [selectedPista, loadCombates]);

  // Load modalidades & alumnos for combate creation
  const loadCombateData = useCallback(async () => {
    if (!selectedTorneoId) return;
    try {
      const [modRes, selRes] = await Promise.all([
        fetch(`${API_BASE}/space/torneos/${selectedTorneoId}/modalidades`, { headers: authHeaders(token) }),
        fetch(`${API_BASE}/space/torneos/${selectedTorneoId}/selecciones`, { headers: authHeaders(token) }),
      ]);
      const modData = await modRes.json();
      const selData = await selRes.json();
      setModalidades(modData?.data ?? []);
      setAlumnos(selData?.data ?? []);
    } catch { /* silent */ }
  }, [token, selectedTorneoId]);

  // Create pista
  const handleCreatePista = async () => {
    if (!pistaForm.numero || !selectedTorneoId) return;
    try {
      const res = await fetch(`${API_BASE}/space/pistas/${selectedTorneoId}`, {
        method: 'POST', headers: authHeaders(token),
        body: JSON.stringify({ numero: parseInt(pistaForm.numero), nombre: pistaForm.nombre.trim() || null }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error ?? 'Error'); }
      toast.success('Pista creada');
      setShowCreatePista(false);
      setPistaForm({ numero: '', nombre: '' });
      loadPistas(selectedTorneoId);
    } catch (err: any) { toast.error(err?.message ?? 'Error al crear pista'); }
  };

  // Delete pista
  const handleDeletePista = async (pistaId: number) => {
    if (!confirm('Eliminar esta pista?')) return;
    try {
      const res = await fetch(`${API_BASE}/space/pistas/${pistaId}`, { method: 'DELETE', headers: authHeaders(token) });
      if (!res.ok) throw new Error();
      toast.success('Pista eliminada');
      setSelectedPista(null);
      loadPistas(selectedTorneoId);
    } catch { toast.error('Error al eliminar pista'); }
  };

  // Create combate
  const handleCreateCombate = async () => {
    if (!combateForm.hora || !combateForm.modalidad_id || !combateForm.alumno1_id || !selectedPista) return;
    try {
      const body: Record<string, unknown> = {
        torneo_id: parseInt(selectedTorneoId),
        pista_id: selectedPista.id,
        modalidad_id: parseInt(combateForm.modalidad_id),
        hora: combateForm.hora,
        alumno1_id: parseInt(combateForm.alumno1_id),
      };
      if (combateForm.alumno2_id) body.alumno2_id = parseInt(combateForm.alumno2_id);
      const res = await fetch(`${API_BASE}/space/pistas/combates`, {
        method: 'POST', headers: authHeaders(token),
        body: JSON.stringify(body),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error ?? 'Error'); }
      toast.success('Combate creado');
      setShowCreateCombate(false);
      setCombateForm({ hora: '08:00', modalidad_id: '', alumno1_id: '', alumno2_id: '' });
      loadCombates();
      loadAllCombates();
      loadPistas(selectedTorneoId);
    } catch (err: any) { toast.error(err?.message ?? 'Error al crear combate'); }
  };

  // Edit combate
  const openEditCombate = (c: Combate) => {
    setEditingCombate(c);
    setEditForm({
      estado: c.estado ?? 'pendiente',
      ganador_id: c.ganador_id ? String(c.ganador_id) : '',
      puntaje_alumno1: c.puntaje_alumno1 != null ? String(c.puntaje_alumno1) : '',
      puntaje_alumno2: c.puntaje_alumno2 != null ? String(c.puntaje_alumno2) : '',
      observaciones: c.observaciones ?? '',
    });
  };

  const handleEditCombate = async () => {
    if (!editingCombate) return;
    try {
      const body: Record<string, unknown> = {
        estado: editForm.estado,
        observaciones: editForm.observaciones.trim() || null,
      };
      if (editForm.estado === 'finalizado') {
        body.ganador_id = editForm.ganador_id ? parseInt(editForm.ganador_id) : null;
        body.puntaje_alumno1 = editForm.puntaje_alumno1 ? parseInt(editForm.puntaje_alumno1) : null;
        body.puntaje_alumno2 = editForm.puntaje_alumno2 ? parseInt(editForm.puntaje_alumno2) : null;
      }
      const res = await fetch(`${API_BASE}/space/pistas/combates/${editingCombate.id}`, {
        method: 'PUT', headers: authHeaders(token), body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success('Combate actualizado');
      setEditingCombate(null);
      loadCombates();
      loadAllCombates();
      loadPistas(selectedTorneoId);
    } catch { toast.error('Error al actualizar combate'); }
  };

  // Delete combate
  const deleteCombate = async (id: number) => {
    if (!confirm('Eliminar este combate?')) return;
    try {
      const res = await fetch(`${API_BASE}/space/pistas/combates/${id}`, { method: 'DELETE', headers: authHeaders(token) });
      if (!res.ok) throw new Error();
      toast.success('Combate eliminado');
      loadCombates();
      loadAllCombates();
      loadPistas(selectedTorneoId);
    } catch { toast.error('Error al eliminar combate'); }
  };

  // Open create combate modal
  const openCreateCombate = () => {
    loadCombateData();
    setCombateForm({ hora: '08:00', modalidad_id: '', alumno1_id: '', alumno2_id: '' });
    setShowCreateCombate(true);
  };

  // Alumno options for SpaceSelect
  const alumnoOptions = alumnos.map(a => ({ value: String(a.alumno_id ?? a.id), label: a.nombre_alumno }));
  const alumno2Options = alumnoOptions.filter(o => o.value !== combateForm.alumno1_id);

  // ── VIEW 2: Pista detail ──
  if (selectedPista) {
    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedPista(null)} className={`${cx.btnGhost} flex items-center gap-2`}>
              <ArrowLeft size={16} /> Volver
            </button>
            <h2 className="text-stone-900 text-lg font-bold">PISTA {selectedPista.numero}</h2>
            {selectedPista.nombre && <span className="text-stone-400 text-sm">{selectedPista.nombre}</span>}
          </div>
          <div className="flex gap-2">
            <button onClick={openCreateCombate} className={cx.btnPrimary}>
              <Plus size={14} className="inline mr-1.5" /> Agregar combate
            </button>
            <button onClick={() => handleDeletePista(selectedPista.id)} className={cx.btnDanger}>
              <Trash2 size={14} className="inline mr-1.5" /> Eliminar pista
            </button>
          </div>
        </div>

        {/* Combates list */}
        {loadingCombates ? (
          <div className={`${cx.skeleton} h-32`} />
        ) : combates.length === 0 ? (
          <div className={`${cx.card} p-12 text-center`}>
            <Swords size={36} className="mx-auto text-stone-300 mb-3" />
            <p className="text-stone-500 text-sm">Sin combates programados</p>
            <button onClick={openCreateCombate} className={`${cx.btnPrimary} mt-4`}>
              <Plus size={14} className="inline mr-1.5" /> Programar combate
            </button>
          </div>
        ) : (
          <div className={`${cx.card} overflow-hidden divide-y divide-stone-100`}>
            {combates.map(combate => (
              <div key={combate.id} className={cx.tr + ' flex items-center gap-4 px-4 py-4'}>
                {/* Hora */}
                <div className="w-16 shrink-0 text-center">
                  <span className="text-stone-900 text-sm font-bold">{combate.hora}</span>
                </div>
                {/* Divider */}
                <div className="w-px h-10 bg-stone-200" />
                {/* Match info */}
                <div className="flex-1 min-w-0">
                  <p className="text-stone-900 text-sm font-medium flex items-center gap-1.5 flex-wrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shrink-0" />
                    <span>{combate.alumno1_nombre}</span>
                    <span className="text-stone-400 font-normal">vs</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block shrink-0" />
                    <span>{combate.alumno2_nombre || 'Por definir'}</span>
                  </p>
                  <p className="text-stone-400 text-xs mt-0.5">
                    {combate.modalidad_nombre}
                    {combate.estado === 'finalizado' && ` \u00b7 ${combate.puntaje_alumno1}-${combate.puntaje_alumno2}`}
                  </p>
                </div>
                {/* Estado badge */}
                <span className={cx.badge(
                  combate.estado === 'finalizado' ? badgeColors.green :
                  combate.estado === 'en_curso' ? badgeColors.orange :
                  badgeColors.yellow
                )}>
                  {combate.estado === 'finalizado' ? 'Finalizado' : combate.estado === 'en_curso' ? 'En curso' : 'Pendiente'}
                </span>
                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEditCombate(combate)} className={cx.btnIcon}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteCombate(combate.id)} className={cx.btnIcon + ' text-rose-400'}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create combate modal */}
        <Modal open={showCreateCombate} onClose={() => setShowCreateCombate(false)} title="Nuevo combate"
          footer={<button onClick={handleCreateCombate} disabled={!combateForm.alumno1_id || !combateForm.modalidad_id} className={cx.btnPrimary}>Crear combate</button>}
        >
          <div className="space-y-4">
            <div>
              <label className={cx.label}>Hora</label>
              <SpaceSelect value={combateForm.hora} onChange={v => setCombateForm(f => ({ ...f, hora: v }))} options={TIME_SLOTS} />
            </div>
            <div>
              <label className={cx.label}>Modalidad</label>
              <SpaceSelect
                value={combateForm.modalidad_id}
                onChange={v => setCombateForm(f => ({ ...f, modalidad_id: v }))}
                options={modalidades.map(m => ({ value: String(m.id), label: m.nombre }))}
                placeholder="Seleccionar modalidad..."
              />
            </div>
            <div>
              <label className={cx.label}>Alumno 1</label>
              <SpaceSelect
                value={combateForm.alumno1_id}
                onChange={v => setCombateForm(f => ({ ...f, alumno1_id: v, alumno2_id: f.alumno2_id === v ? '' : f.alumno2_id }))}
                options={alumnoOptions}
                placeholder="Seleccionar alumno..."
              />
            </div>
            <div>
              <label className={cx.label}>Alumno 2 (opcional)</label>
              <SpaceSelect
                value={combateForm.alumno2_id}
                onChange={v => setCombateForm(f => ({ ...f, alumno2_id: v }))}
                options={alumno2Options}
                placeholder="Seleccionar (opcional)"
              />
            </div>
          </div>
        </Modal>

        {/* Edit combate modal */}
        <Modal open={!!editingCombate} onClose={() => setEditingCombate(null)} title="Editar combate"
          footer={<button onClick={handleEditCombate} className={cx.btnPrimary}>Guardar</button>}
        >
          <div className="space-y-4">
            {editingCombate && (
              <p className="text-stone-500 text-sm">{editingCombate.alumno1_nombre} vs {editingCombate.alumno2_nombre}</p>
            )}
            <div>
              <label className={cx.label}>Estado</label>
              <SpaceSelect value={editForm.estado} onChange={v => setEditForm(f => ({ ...f, estado: v }))} options={ESTADO_OPTIONS} />
            </div>
            {editForm.estado === 'finalizado' && editingCombate && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={cx.label}>Puntaje {editingCombate.alumno1_nombre.split(' ')[0]}</label>
                    <input type="number" min="0" className={cx.input} value={editForm.puntaje_alumno1} onChange={e => setEditForm(f => ({ ...f, puntaje_alumno1: e.target.value }))} />
                  </div>
                  <div>
                    <label className={cx.label}>Puntaje {editingCombate.alumno2_nombre.split(' ')[0]}</label>
                    <input type="number" min="0" className={cx.input} value={editForm.puntaje_alumno2} onChange={e => setEditForm(f => ({ ...f, puntaje_alumno2: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className={cx.label}>Ganador</label>
                  <SpaceSelect
                    value={editForm.ganador_id}
                    onChange={v => setEditForm(f => ({ ...f, ganador_id: v }))}
                    options={[
                      { value: String(editingCombate.alumno1_id), label: editingCombate.alumno1_nombre },
                      { value: String(editingCombate.alumno2_id), label: editingCombate.alumno2_nombre },
                    ]}
                    placeholder="Seleccionar ganador..."
                  />
                </div>
              </>
            )}
            <div>
              <label className={cx.label}>Observaciones</label>
              <textarea
                className={`${cx.input} min-h-[80px] resize-y`}
                value={editForm.observaciones}
                onChange={e => setEditForm(f => ({ ...f, observaciones: e.target.value }))}
                placeholder="Notas opcionales..."
                rows={3}
              />
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // ── VIEW 1: Grid de Pistas ──
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-stone-900 text-lg font-semibold flex items-center gap-2">
          <MapPin size={20} className="text-[var(--accent)]" /> Pistas de Torneo
        </h2>
        {selectedTorneoId && (
          <button onClick={() => setShowCreatePista(true)} className={cx.btnPrimary}>
            <Plus size={14} className="inline mr-1.5" /> Nueva pista
          </button>
        )}
      </div>

      {/* Tournament selector */}
      <div className="max-w-xs">
        <label className={cx.label}>Torneo</label>
        <SpaceSelect
          value={selectedTorneoId}
          onChange={v => { setSelectedTorneoId(v); setSelectedPista(null); }}
          options={torneos.map(t => ({ value: String(t.id), label: t.nombre }))}
          placeholder="Seleccionar torneo..."
        />
      </div>

      {/* Content */}
      {!selectedTorneoId ? (
        <div className={`${cx.card} p-12 text-center`}>
          <MapPin size={36} className="mx-auto text-stone-300 mb-3" />
          <p className="text-stone-500 text-sm">Selecciona un torneo para ver las pistas</p>
        </div>
      ) : loadingPistas ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className={`${cx.skeleton} min-h-[160px]`} />)}
        </div>
      ) : pistas.length === 0 ? (
        <div className={`${cx.card} p-12 text-center`}>
          <MapPin size={36} className="mx-auto text-stone-300 mb-3" />
          <p className="text-stone-500 text-sm">No hay pistas configuradas</p>
          <button onClick={() => setShowCreatePista(true)} className={`${cx.btnPrimary} mt-4`}>
            <Plus size={14} className="inline mr-1.5" /> Crear primera pista
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {pistas.map(pista => {
            const currentCombate = currentCombateByPista[pista.id] || null;
            return (
              <div
                key={pista.id}
                onClick={() => setSelectedPista(pista)}
                className="relative overflow-hidden rounded-2xl border border-stone-200 cursor-pointer hover:shadow-lg transition-shadow min-h-[180px] bg-white"
              >
                {/* Two halves */}
                <div className="flex h-full min-h-[180px]">
                  {/* Left half - Red/Coral */}
                  <div className="flex-1 bg-gradient-to-br from-rose-50 to-rose-100/50 p-4 flex flex-col items-center justify-center border-r border-stone-200">
                    {currentCombate ? (
                      <>
                        <p className="text-rose-700 text-xs font-bold uppercase tracking-wider mb-1">Rojo</p>
                        <p className="text-stone-800 text-sm font-semibold text-center leading-tight">{currentCombate.alumno1_nombre || '\u2014'}</p>
                        {currentCombate.estado === 'finalizado' && (
                          <p className="text-rose-600 text-lg font-bold mt-1">{currentCombate.puntaje_alumno1}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-stone-300 text-xs">&mdash;</p>
                    )}
                  </div>

                  {/* Right half - Blue */}
                  <div className="flex-1 bg-gradient-to-bl from-sky-50 to-sky-100/50 p-4 flex flex-col items-center justify-center">
                    {currentCombate ? (
                      <>
                        <p className="text-sky-700 text-xs font-bold uppercase tracking-wider mb-1">Azul</p>
                        <p className="text-stone-800 text-sm font-semibold text-center leading-tight">{currentCombate.alumno2_nombre || 'Por definir'}</p>
                        {currentCombate.estado === 'finalizado' && (
                          <p className="text-sky-600 text-lg font-bold mt-1">{currentCombate.puntaje_alumno2}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-stone-300 text-xs">&mdash;</p>
                    )}
                  </div>
                </div>

                {/* Center circle with pista number */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white border-2 border-stone-300 shadow-md flex items-center justify-center z-10">
                  <span className="text-stone-800 text-lg font-bold">{pista.numero}</span>
                </div>

                {/* Bottom info bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-stone-200 px-3 py-2 flex items-center justify-between">
                  <span className="text-stone-500 text-[10px] font-medium">
                    {currentCombate?.hora || 'Sin combates'}
                  </span>
                  <span className={cx.badge(
                    currentCombate?.estado === 'finalizado' ? badgeColors.green :
                    currentCombate?.estado === 'en_curso' ? badgeColors.orange :
                    pista.total_combates > 0 ? badgeColors.yellow : badgeColors.gray
                  )}>
                    {currentCombate?.estado === 'en_curso' ? 'En curso' :
                     currentCombate?.estado === 'finalizado' ? 'Finalizado' :
                     pista.total_combates > 0 ? `${pista.total_combates} combate${pista.total_combates !== 1 ? 's' : ''}` : 'Vac\u00eda'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Jueces */}
      {selectedTorneoId && !selectedPista && (
        <div className="mt-8">
          <h3 className="text-stone-900 text-sm font-semibold mb-3">Jueces del torneo</h3>
          <div className={cx.card + ' divide-y divide-stone-100'}>
            {jueces.map(j => (
              <div key={j.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-stone-800 text-sm font-medium flex-1">{j.nombre}</span>
                <SpaceSelect
                  value={String(j.pista_id || '')}
                  onChange={(v: string) => assignJuezToPista(j.id, v ? parseInt(v) : null)}
                  options={[{ value: '', label: 'Sin asignar' }, ...pistas.map(p => ({ value: String(p.id), label: `Pista ${p.numero}` }))]}
                  placeholder="Asignar pista"
                />
                <button onClick={() => deleteJuez(j.id)} className={cx.btnIcon + ' text-rose-400'}><Trash2 size={14} /></button>
              </div>
            ))}
            {jueces.length === 0 && <p className="px-4 py-6 text-stone-400 text-sm text-center">Sin jueces registrados</p>}
          </div>
          <div className="flex gap-2 mt-3">
            <input value={newJuezNombre} onChange={e => setNewJuezNombre(e.target.value)} placeholder="Nombre del juez..." className={cx.input + ' flex-1'} />
            <button onClick={createJuez} disabled={!newJuezNombre.trim()} className={cx.btnPrimary + ' disabled:opacity-50'}>Agregar</button>
          </div>
        </div>
      )}

      {/* Create pista modal */}
      <Modal open={showCreatePista} onClose={() => setShowCreatePista(false)} title="Nueva pista" size="sm"
        footer={<button onClick={handleCreatePista} disabled={!pistaForm.numero} className={cx.btnPrimary}>Crear pista</button>}
      >
        <div className="space-y-4">
          <div>
            <label className={cx.label}>Numero de pista *</label>
            <input type="number" min="1" className={cx.input} value={pistaForm.numero} onChange={e => setPistaForm(f => ({ ...f, numero: e.target.value }))} placeholder="1" />
          </div>
          <div>
            <label className={cx.label}>Nombre (opcional)</label>
            <input className={cx.input} value={pistaForm.nombre} onChange={e => setPistaForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Pista Principal" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
