import { useState, useEffect, useCallback } from 'react';
import { Settings, Users, Building2, Clock, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '../../config/api';
import { cx, badgeColors } from './tokens';
import { Modal } from './Modal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  ultimo_login?: string;
  permisos?: string[] | null;
}

// Módulos Space con etiquetas legibles — deben coincidir con SpacePage del SpaceApp
const MODULOS_DISPONIBLES: { key: string; label: string }[] = [
  { key: 'alumnos', label: 'Alumnos' },
  { key: 'inscripciones', label: 'Inscritos (lista)' },
  { key: 'inscribir', label: 'Inscribir' },
  { key: 'renovar', label: 'Renovar' },
  { key: 'graduaciones', label: 'Graduaciones' },
  { key: 'asistencia', label: 'Asistencia (reportes)' },
  { key: 'tomar-asistencia', label: 'Tomar asistencia (QR)' },
  { key: 'asistencia-historica', label: 'Registrar asistencias pasadas' },
  { key: 'leads', label: 'Leads' },
  { key: 'compras', label: 'Compras' },
  { key: 'mensajes', label: 'Mensajes' },
  { key: 'profesores', label: 'Profesores' },
  { key: 'clases-prueba', label: 'Clases de prueba' },
  { key: 'config', label: 'Ajustes (admin)' },
];

interface Sede {
  id: number;
  nombre: string;
  direccion: string;
  activa: boolean;
}

interface Horario {
  id: number;
  sede_id: number;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  nombre_clase: string;
  capacidad: number;
  instructor: string;
  sede_nombre?: string;
  activo: boolean;
}

interface UsuarioForm {
  nombre: string;
  email: string;
  password: string;
  rol: string;
  permisos: string[];
}

interface UsuarioEditForm {
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  permisos: string[];
}

interface SedeForm {
  nombre: string;
  direccion: string;
}

interface HorarioForm {
  sede_id: number | '';
  dia_semana: number | '';
  hora_inicio: string;
  hora_fin: string;
  nombre_clase: string;
  capacidad: number | '';
  instructor: string;
}

interface SpaceConfigProps {
  token: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type Tab = 'usuarios' | 'sedes' | 'horarios';

const TABS: { key: Tab; label: string; icon: typeof Users }[] = [
  { key: 'usuarios', label: 'Usuarios', icon: Users },
  { key: 'sedes', label: 'Sedes', icon: Building2 },
  { key: 'horarios', label: 'Horarios', icon: Clock },
];

const DIAS: Record<number, string> = {
  0: 'Lun',
  1: 'Mar',
  2: 'Mié',
  3: 'Jue',
  4: 'Vie',
  5: 'Sáb',
  6: 'Dom',
};

const SKELETON_ROWS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5'] as const;

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
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Lima',
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SpaceConfig({ token }: SpaceConfigProps) {
  const [tab, setTab] = useState<Tab>('usuarios');

  // ── Usuarios state ──
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [modalUsuarioCreate, setModalUsuarioCreate] = useState(false);
  const [modalUsuarioEdit, setModalUsuarioEdit] = useState<Usuario | null>(null);
  const [modalUsuarioPassword, setModalUsuarioPassword] = useState<Usuario | null>(null);
  const [confirmDeactivateUsuario, setConfirmDeactivateUsuario] = useState<Usuario | null>(null);
  const [savingUsuario, setSavingUsuario] = useState(false);

  const [createUsuarioForm, setCreateUsuarioForm] = useState<UsuarioForm>({
    nombre: '', email: '', password: '', rol: 'profesor', permisos: [],
  });
  const [editUsuarioForm, setEditUsuarioForm] = useState<UsuarioEditForm>({
    nombre: '', email: '', rol: 'profesor', activo: true, permisos: [],
  });
  const [newPassword, setNewPassword] = useState('');

  // ── Sedes state ──
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [loadingSedes, setLoadingSedes] = useState(false);
  const [modalSedeCreate, setModalSedeCreate] = useState(false);
  const [modalSedeEdit, setModalSedeEdit] = useState<Sede | null>(null);
  const [confirmDeactivateSede, setConfirmDeactivateSede] = useState<Sede | null>(null);
  const [savingSede, setSavingSede] = useState(false);

  const [sedeForm, setSedeForm] = useState<SedeForm>({ nombre: '', direccion: '' });

  // ── Horarios state ──
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [filtroSede, setFiltroSede] = useState<number | ''>('');
  const [modalHorarioCreate, setModalHorarioCreate] = useState(false);
  const [modalHorarioEdit, setModalHorarioEdit] = useState<Horario | null>(null);
  const [confirmDeactivateHorario, setConfirmDeactivateHorario] = useState<Horario | null>(null);
  const [savingHorario, setSavingHorario] = useState(false);

  const [horarioForm, setHorarioForm] = useState<HorarioForm>({
    sede_id: '', dia_semana: '', hora_inicio: '', hora_fin: '',
    nombre_clase: '', capacidad: '', instructor: '',
  });

  // ── Fetch functions ──

  const fetchUsuarios = useCallback(async () => {
    setLoadingUsuarios(true);
    try {
      const res = await fetch(`${API_BASE}/space/config/usuarios`, { headers: authHeaders(token) });
      if (!res.ok) throw new Error('Error al cargar usuarios');
      const data = await res.json();
      setUsuarios(Array.isArray(data) ? data : data.data ?? []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al cargar usuarios');
    } finally {
      setLoadingUsuarios(false);
    }
  }, [token]);

  const fetchSedes = useCallback(async () => {
    setLoadingSedes(true);
    try {
      const res = await fetch(`${API_BASE}/space/config/sedes`, { headers: authHeaders(token) });
      if (!res.ok) throw new Error('Error al cargar sedes');
      const data = await res.json();
      setSedes(Array.isArray(data) ? data : data.data ?? []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al cargar sedes');
    } finally {
      setLoadingSedes(false);
    }
  }, [token]);

  const fetchHorarios = useCallback(async () => {
    setLoadingHorarios(true);
    try {
      const url = filtroSede
        ? `${API_BASE}/space/config/horarios?sede_id=${filtroSede}`
        : `${API_BASE}/space/config/horarios`;
      const res = await fetch(url, { headers: authHeaders(token) });
      if (!res.ok) throw new Error('Error al cargar horarios');
      const data = await res.json();
      setHorarios(Array.isArray(data) ? data : data.data ?? []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al cargar horarios');
    } finally {
      setLoadingHorarios(false);
    }
  }, [token, filtroSede]);

  // ── Initial loads ──

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);
  useEffect(() => { fetchSedes(); }, [fetchSedes]);
  useEffect(() => { fetchHorarios(); }, [fetchHorarios]);

  // ── CRUD: Usuarios ──

  async function handleCreateUsuario() {
    if (!createUsuarioForm.nombre || !createUsuarioForm.email || !createUsuarioForm.password) {
      toast.error('Completa todos los campos');
      return;
    }
    setSavingUsuario(true);
    try {
      const res = await fetch(`${API_BASE}/space/config/usuarios`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(createUsuarioForm),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Error al crear usuario');
      }
      toast.success('Usuario creado');
      setModalUsuarioCreate(false);
      setCreateUsuarioForm({ nombre: '', email: '', password: '', rol: 'profesor', permisos: [] });
      fetchUsuarios();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al crear usuario');
    } finally {
      setSavingUsuario(false);
    }
  }

  async function handleEditUsuario() {
    if (!modalUsuarioEdit) return;
    setSavingUsuario(true);
    try {
      const res = await fetch(`${API_BASE}/space/config/usuarios/${modalUsuarioEdit.id}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify(editUsuarioForm),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Error al actualizar usuario');
      }
      toast.success('Usuario actualizado');
      setModalUsuarioEdit(null);
      fetchUsuarios();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar usuario');
    } finally {
      setSavingUsuario(false);
    }
  }

  async function handleChangePassword() {
    if (!modalUsuarioPassword || !newPassword) {
      toast.error('Ingresa la nueva contraseña');
      return;
    }
    setSavingUsuario(true);
    try {
      const res = await fetch(`${API_BASE}/space/config/usuarios/${modalUsuarioPassword.id}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Error al cambiar contraseña');
      }
      toast.success('Contraseña actualizada');
      setModalUsuarioPassword(null);
      setNewPassword('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al cambiar contraseña');
    } finally {
      setSavingUsuario(false);
    }
  }

  async function handleDeactivateUsuario() {
    if (!confirmDeactivateUsuario) return;
    setSavingUsuario(true);
    try {
      const res = await fetch(`${API_BASE}/space/config/usuarios/${confirmDeactivateUsuario.id}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error('Error al desactivar usuario');
      toast.success('Usuario desactivado');
      setConfirmDeactivateUsuario(null);
      fetchUsuarios();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al desactivar usuario');
    } finally {
      setSavingUsuario(false);
    }
  }

  // ── CRUD: Sedes ──

  async function handleCreateSede() {
    if (!sedeForm.nombre) { toast.error('Ingresa el nombre de la sede'); return; }
    setSavingSede(true);
    try {
      const res = await fetch(`${API_BASE}/space/config/sedes`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(sedeForm),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Error al crear sede');
      }
      toast.success('Sede creada');
      setModalSedeCreate(false);
      setSedeForm({ nombre: '', direccion: '' });
      fetchSedes();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al crear sede');
    } finally {
      setSavingSede(false);
    }
  }

  async function handleEditSede() {
    if (!modalSedeEdit) return;
    setSavingSede(true);
    try {
      const res = await fetch(`${API_BASE}/space/config/sedes/${modalSedeEdit.id}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify(sedeForm),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Error al actualizar sede');
      }
      toast.success('Sede actualizada');
      setModalSedeEdit(null);
      setSedeForm({ nombre: '', direccion: '' });
      fetchSedes();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar sede');
    } finally {
      setSavingSede(false);
    }
  }

  async function handleDeactivateSede() {
    if (!confirmDeactivateSede) return;
    setSavingSede(true);
    try {
      const res = await fetch(`${API_BASE}/space/config/sedes/${confirmDeactivateSede.id}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error('Error al desactivar sede');
      toast.success('Sede desactivada');
      setConfirmDeactivateSede(null);
      fetchSedes();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al desactivar sede');
    } finally {
      setSavingSede(false);
    }
  }

  // ── CRUD: Horarios ──

  async function handleCreateHorario() {
    if (!horarioForm.sede_id || horarioForm.dia_semana === '' || !horarioForm.hora_inicio || !horarioForm.hora_fin || !horarioForm.nombre_clase) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }
    setSavingHorario(true);
    try {
      const res = await fetch(`${API_BASE}/space/config/horarios`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({
          ...horarioForm,
          sede_id: Number(horarioForm.sede_id),
          dia_semana: Number(horarioForm.dia_semana),
          capacidad: horarioForm.capacidad ? Number(horarioForm.capacidad) : 0,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Error al crear horario');
      }
      toast.success('Horario creado');
      setModalHorarioCreate(false);
      resetHorarioForm();
      fetchHorarios();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al crear horario');
    } finally {
      setSavingHorario(false);
    }
  }

  async function handleEditHorario() {
    if (!modalHorarioEdit) return;
    setSavingHorario(true);
    try {
      const res = await fetch(`${API_BASE}/space/config/horarios/${modalHorarioEdit.id}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({
          ...horarioForm,
          sede_id: Number(horarioForm.sede_id),
          dia_semana: Number(horarioForm.dia_semana),
          capacidad: horarioForm.capacidad ? Number(horarioForm.capacidad) : 0,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Error al actualizar horario');
      }
      toast.success('Horario actualizado');
      setModalHorarioEdit(null);
      resetHorarioForm();
      fetchHorarios();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar horario');
    } finally {
      setSavingHorario(false);
    }
  }

  async function handleDeactivateHorario() {
    if (!confirmDeactivateHorario) return;
    setSavingHorario(true);
    try {
      const res = await fetch(`${API_BASE}/space/config/horarios/${confirmDeactivateHorario.id}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error('Error al desactivar horario');
      toast.success('Horario desactivado');
      setConfirmDeactivateHorario(null);
      fetchHorarios();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al desactivar horario');
    } finally {
      setSavingHorario(false);
    }
  }

  function resetHorarioForm() {
    setHorarioForm({
      sede_id: '', dia_semana: '', hora_inicio: '', hora_fin: '',
      nombre_clase: '', capacidad: '', instructor: '',
    });
  }

  // ── Open edit modals (pre-fill forms) ──

  function openEditUsuario(u: Usuario) {
    setEditUsuarioForm({
      nombre: u.nombre,
      email: u.email,
      rol: u.rol,
      activo: u.activo,
      permisos: Array.isArray(u.permisos) ? u.permisos : [],
    });
    setModalUsuarioEdit(u);
  }

  function openEditSede(s: Sede) {
    setSedeForm({ nombre: s.nombre, direccion: s.direccion });
    setModalSedeEdit(s);
  }

  function openEditHorario(h: Horario) {
    setHorarioForm({
      sede_id: h.sede_id,
      dia_semana: h.dia_semana,
      hora_inicio: h.hora_inicio,
      hora_fin: h.hora_fin,
      nombre_clase: h.nombre_clase,
      capacidad: h.capacidad,
      instructor: h.instructor,
    });
    setModalHorarioEdit(h);
  }

  // ── Skeleton row ──

  function SkeletonRow({ cols }: { cols: number }) {
    return (
      <>
        {SKELETON_ROWS.map(k => (
          <tr key={k} className={cx.tr}>
            {Array.from({ length: cols }).map((_, i) => (
              <td key={i} className={cx.td}>
                <div className={`${cx.skeleton} h-4 w-24`} />
              </td>
            ))}
          </tr>
        ))}
      </>
    );
  }

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="text-[#FA7B21]" size={22} />
        <h1 className="text-white text-xl font-bold">Configuracion</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cx.chip(active) + ' flex items-center gap-1.5'}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ─── Tab: Usuarios ─── */}
      {tab === 'usuarios' && (
        <div className={`${cx.card} overflow-hidden`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <h2 className="text-white text-sm font-semibold">Usuarios del sistema</h2>
            <button onClick={() => setModalUsuarioCreate(true)} className={cx.btnPrimary + ' flex items-center gap-1.5 text-xs'}>
              <Plus size={14} /> Nuevo usuario
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className={cx.th}>Nombre</th>
                  <th className={cx.th}>Email</th>
                  <th className={cx.th}>Rol</th>
                  <th className={cx.th}>Estado</th>
                  <th className={cx.th}>Ultimo login</th>
                  <th className={cx.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsuarios ? (
                  <SkeletonRow cols={6} />
                ) : usuarios.length === 0 ? (
                  <tr><td colSpan={6} className={`${cx.td} text-center text-zinc-500`}>Sin usuarios</td></tr>
                ) : (
                  usuarios.map(u => (
                    <tr key={u.id} className={cx.tr}>
                      <td className={`${cx.td} text-white font-medium`}>{u.nombre}</td>
                      <td className={`${cx.td} text-zinc-400`}>{u.email}</td>
                      <td className={cx.td}>
                        <span className={cx.badge(u.rol === 'admin' ? badgeColors.violet : badgeColors.blue)}>
                          {u.rol}
                        </span>
                      </td>
                      <td className={cx.td}>
                        <span className={cx.badge(u.activo ? badgeColors.green : badgeColors.red)}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className={`${cx.td} text-zinc-400`}>{formatFecha(u.ultimo_login)}</td>
                      <td className={cx.td}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditUsuario(u)} className={cx.btnIcon} title="Editar">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => { setModalUsuarioPassword(u); setNewPassword(''); }} className={cx.btnIcon} title="Cambiar contraseña">
                            <Settings size={14} />
                          </button>
                          {u.activo && (
                            <button onClick={() => setConfirmDeactivateUsuario(u)} className={cx.btnDanger} title="Desactivar">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Tab: Sedes ─── */}
      {tab === 'sedes' && (
        <div className={`${cx.card} overflow-hidden`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <h2 className="text-white text-sm font-semibold">Sedes</h2>
            <button onClick={() => { setSedeForm({ nombre: '', direccion: '' }); setModalSedeCreate(true); }} className={cx.btnPrimary + ' flex items-center gap-1.5 text-xs'}>
              <Plus size={14} /> Nueva sede
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className={cx.th}>Nombre</th>
                  <th className={cx.th}>Direccion</th>
                  <th className={cx.th}>Estado</th>
                  <th className={cx.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loadingSedes ? (
                  <SkeletonRow cols={4} />
                ) : sedes.length === 0 ? (
                  <tr><td colSpan={4} className={`${cx.td} text-center text-zinc-500`}>Sin sedes</td></tr>
                ) : (
                  sedes.map(s => (
                    <tr key={s.id} className={cx.tr}>
                      <td className={`${cx.td} text-white font-medium`}>{s.nombre}</td>
                      <td className={`${cx.td} text-zinc-400`}>{s.direccion || '\u2014'}</td>
                      <td className={cx.td}>
                        <span className={cx.badge(s.activa ? badgeColors.green : badgeColors.red)}>
                          {s.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className={cx.td}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditSede(s)} className={cx.btnIcon} title="Editar">
                            <Pencil size={14} />
                          </button>
                          {s.activa && (
                            <button onClick={() => setConfirmDeactivateSede(s)} className={cx.btnDanger} title="Desactivar">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Tab: Horarios ─── */}
      {tab === 'horarios' && (
        <div className={`${cx.card} overflow-hidden`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-white text-sm font-semibold">Horarios</h2>
              <select
                value={filtroSede}
                onChange={e => setFiltroSede(e.target.value ? Number(e.target.value) : '')}
                className={cx.select + ' !w-auto min-w-[160px]'}
              >
                <option value="">Todas las sedes</option>
                {sedes.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
            <button onClick={() => { resetHorarioForm(); setModalHorarioCreate(true); }} className={cx.btnPrimary + ' flex items-center gap-1.5 text-xs'}>
              <Plus size={14} /> Nuevo horario
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className={cx.th}>Dia</th>
                  <th className={cx.th}>Hora inicio</th>
                  <th className={cx.th}>Hora fin</th>
                  <th className={cx.th}>Clase</th>
                  <th className={cx.th}>Capacidad</th>
                  <th className={cx.th}>Instructor</th>
                  <th className={cx.th}>Sede</th>
                  <th className={cx.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loadingHorarios ? (
                  <SkeletonRow cols={8} />
                ) : horarios.length === 0 ? (
                  <tr><td colSpan={8} className={`${cx.td} text-center text-zinc-500`}>Sin horarios</td></tr>
                ) : (
                  horarios.map(h => {
                    const sedeName = h.sede_nombre || sedes.find(s => s.id === h.sede_id)?.nombre || '\u2014';
                    return (
                      <tr key={h.id} className={cx.tr}>
                        <td className={cx.td}>
                          <span className={cx.badge(badgeColors.orange)}>{DIAS[h.dia_semana] ?? h.dia_semana}</span>
                        </td>
                        <td className={`${cx.td} text-white`}>{h.hora_inicio}</td>
                        <td className={`${cx.td} text-white`}>{h.hora_fin}</td>
                        <td className={`${cx.td} text-white font-medium`}>{h.nombre_clase}</td>
                        <td className={`${cx.td} text-zinc-400`}>{h.capacidad}</td>
                        <td className={`${cx.td} text-zinc-400`}>{h.instructor || '\u2014'}</td>
                        <td className={cx.td}>
                          <span className={cx.badge(badgeColors.blue)}>{sedeName}</span>
                        </td>
                        <td className={cx.td}>
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEditHorario(h)} className={cx.btnIcon} title="Editar">
                              <Pencil size={14} />
                            </button>
                            {h.activo !== false && (
                              <button onClick={() => setConfirmDeactivateHorario(h)} className={cx.btnDanger} title="Desactivar">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODALS                                                            */}
      {/* ================================================================= */}

      {/* ── Create Usuario ── */}
      <Modal
        open={modalUsuarioCreate}
        onClose={() => setModalUsuarioCreate(false)}
        title="Nuevo usuario"
        footer={
          <>
            <button onClick={() => setModalUsuarioCreate(false)} className={cx.btnSecondary}>Cancelar</button>
            <button onClick={handleCreateUsuario} disabled={savingUsuario} className={cx.btnPrimary + ' flex items-center gap-1.5'}>
              {savingUsuario && <Loader2 size={14} className="animate-spin" />}
              Crear
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={cx.label}>Nombre</label>
            <input
              className={cx.input}
              value={createUsuarioForm.nombre}
              onChange={e => setCreateUsuarioForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Nombre completo"
            />
          </div>
          <div>
            <label className={cx.label}>Email</label>
            <input
              className={cx.input}
              type="email"
              value={createUsuarioForm.email}
              onChange={e => setCreateUsuarioForm(f => ({ ...f, email: e.target.value }))}
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div>
            <label className={cx.label}>Contraseña</label>
            <input
              className={cx.input}
              type="password"
              value={createUsuarioForm.password}
              onChange={e => setCreateUsuarioForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Minimo 6 caracteres"
            />
          </div>
          <div>
            <label className={cx.label}>Rol</label>
            <select
              className={cx.select}
              value={createUsuarioForm.rol}
              onChange={e => setCreateUsuarioForm(f => ({ ...f, rol: e.target.value }))}
            >
              <option value="admin">Admin (acceso total)</option>
              <option value="profesor">Profesor (permisos limitados)</option>
            </select>
          </div>

          {createUsuarioForm.rol === 'profesor' && (
            <div>
              <label className={cx.label}>Módulos a los que tiene acceso</label>
              <p className="text-zinc-500 text-xs mb-2">
                El Dashboard siempre está disponible. Selecciona qué otros módulos puede ver este profesor.
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {MODULOS_DISPONIBLES.map((m) => {
                  const checked = createUsuarioForm.permisos.includes(m.key);
                  return (
                    <label key={m.key} className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-800/50 border border-zinc-800 cursor-pointer hover:border-[#FA7B21]/30 transition-all">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setCreateUsuarioForm((f) => ({
                            ...f,
                            permisos: e.target.checked
                              ? [...f.permisos, m.key]
                              : f.permisos.filter((p) => p !== m.key),
                          }));
                        }}
                        className="w-4 h-4 accent-[#FA7B21]"
                      />
                      <span className="text-white text-sm">{m.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ── Edit Usuario ── */}
      <Modal
        open={!!modalUsuarioEdit}
        onClose={() => setModalUsuarioEdit(null)}
        title="Editar usuario"
        footer={
          <>
            <button onClick={() => setModalUsuarioEdit(null)} className={cx.btnSecondary}>Cancelar</button>
            <button onClick={handleEditUsuario} disabled={savingUsuario} className={cx.btnPrimary + ' flex items-center gap-1.5'}>
              {savingUsuario && <Loader2 size={14} className="animate-spin" />}
              Guardar
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={cx.label}>Nombre</label>
            <input
              className={cx.input}
              value={editUsuarioForm.nombre}
              onChange={e => setEditUsuarioForm(f => ({ ...f, nombre: e.target.value }))}
            />
          </div>
          <div>
            <label className={cx.label}>Email</label>
            <input
              className={cx.input}
              type="email"
              value={editUsuarioForm.email}
              onChange={e => setEditUsuarioForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className={cx.label}>Rol</label>
            <select
              className={cx.select}
              value={editUsuarioForm.rol}
              onChange={e => setEditUsuarioForm(f => ({ ...f, rol: e.target.value }))}
            >
              <option value="admin">Admin (acceso total)</option>
              <option value="profesor">Profesor (permisos limitados)</option>
            </select>
          </div>
          <div>
            <label className={cx.label}>Estado</label>
            <button
              type="button"
              onClick={() => setEditUsuarioForm(f => ({ ...f, activo: !f.activo }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editUsuarioForm.activo ? 'bg-emerald-500' : 'bg-zinc-700'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editUsuarioForm.activo ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="ml-2 text-sm text-zinc-400">{editUsuarioForm.activo ? 'Activo' : 'Inactivo'}</span>
          </div>

          {editUsuarioForm.rol === 'profesor' && (
            <div>
              <label className={cx.label}>Módulos a los que tiene acceso</label>
              <p className="text-zinc-500 text-xs mb-2">
                El Dashboard siempre está disponible. Admin tiene acceso total y no usa esta lista.
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {MODULOS_DISPONIBLES.map((m) => {
                  const checked = editUsuarioForm.permisos.includes(m.key);
                  return (
                    <label key={m.key} className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-800/50 border border-zinc-800 cursor-pointer hover:border-[#FA7B21]/30 transition-all">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setEditUsuarioForm((f) => ({
                            ...f,
                            permisos: e.target.checked
                              ? [...f.permisos, m.key]
                              : f.permisos.filter((p) => p !== m.key),
                          }));
                        }}
                        className="w-4 h-4 accent-[#FA7B21]"
                      />
                      <span className="text-white text-sm">{m.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ── Change Password ── */}
      <Modal
        open={!!modalUsuarioPassword}
        onClose={() => setModalUsuarioPassword(null)}
        title={`Cambiar contraseña — ${modalUsuarioPassword?.nombre ?? ''}`}
        size="sm"
        footer={
          <>
            <button onClick={() => setModalUsuarioPassword(null)} className={cx.btnSecondary}>Cancelar</button>
            <button onClick={handleChangePassword} disabled={savingUsuario} className={cx.btnPrimary + ' flex items-center gap-1.5'}>
              {savingUsuario && <Loader2 size={14} className="animate-spin" />}
              Cambiar
            </button>
          </>
        }
      >
        <div>
          <label className={cx.label}>Nueva contraseña</label>
          <input
            className={cx.input}
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Minimo 6 caracteres"
          />
        </div>
      </Modal>

      {/* ── Confirm Deactivate Usuario ── */}
      <Modal
        open={!!confirmDeactivateUsuario}
        onClose={() => setConfirmDeactivateUsuario(null)}
        title="Desactivar usuario"
        size="sm"
        footer={
          <>
            <button onClick={() => setConfirmDeactivateUsuario(null)} className={cx.btnSecondary}>Cancelar</button>
            <button onClick={handleDeactivateUsuario} disabled={savingUsuario} className={cx.btnDanger + ' flex items-center gap-1.5'}>
              {savingUsuario && <Loader2 size={14} className="animate-spin" />}
              Desactivar
            </button>
          </>
        }
      >
        <p className="text-zinc-300 text-sm">
          ¿Estas seguro de desactivar al usuario <strong className="text-white">{confirmDeactivateUsuario?.nombre}</strong>? No podra iniciar sesion.
        </p>
      </Modal>

      {/* ── Create Sede ── */}
      <Modal
        open={modalSedeCreate}
        onClose={() => setModalSedeCreate(false)}
        title="Nueva sede"
        footer={
          <>
            <button onClick={() => setModalSedeCreate(false)} className={cx.btnSecondary}>Cancelar</button>
            <button onClick={handleCreateSede} disabled={savingSede} className={cx.btnPrimary + ' flex items-center gap-1.5'}>
              {savingSede && <Loader2 size={14} className="animate-spin" />}
              Crear
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={cx.label}>Nombre</label>
            <input
              className={cx.input}
              value={sedeForm.nombre}
              onChange={e => setSedeForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Nombre de la sede"
            />
          </div>
          <div>
            <label className={cx.label}>Direccion</label>
            <input
              className={cx.input}
              value={sedeForm.direccion}
              onChange={e => setSedeForm(f => ({ ...f, direccion: e.target.value }))}
              placeholder="Direccion completa"
            />
          </div>
        </div>
      </Modal>

      {/* ── Edit Sede ── */}
      <Modal
        open={!!modalSedeEdit}
        onClose={() => setModalSedeEdit(null)}
        title="Editar sede"
        footer={
          <>
            <button onClick={() => setModalSedeEdit(null)} className={cx.btnSecondary}>Cancelar</button>
            <button onClick={handleEditSede} disabled={savingSede} className={cx.btnPrimary + ' flex items-center gap-1.5'}>
              {savingSede && <Loader2 size={14} className="animate-spin" />}
              Guardar
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={cx.label}>Nombre</label>
            <input
              className={cx.input}
              value={sedeForm.nombre}
              onChange={e => setSedeForm(f => ({ ...f, nombre: e.target.value }))}
            />
          </div>
          <div>
            <label className={cx.label}>Direccion</label>
            <input
              className={cx.input}
              value={sedeForm.direccion}
              onChange={e => setSedeForm(f => ({ ...f, direccion: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      {/* ── Confirm Deactivate Sede ── */}
      <Modal
        open={!!confirmDeactivateSede}
        onClose={() => setConfirmDeactivateSede(null)}
        title="Desactivar sede"
        size="sm"
        footer={
          <>
            <button onClick={() => setConfirmDeactivateSede(null)} className={cx.btnSecondary}>Cancelar</button>
            <button onClick={handleDeactivateSede} disabled={savingSede} className={cx.btnDanger + ' flex items-center gap-1.5'}>
              {savingSede && <Loader2 size={14} className="animate-spin" />}
              Desactivar
            </button>
          </>
        }
      >
        <p className="text-zinc-300 text-sm">
          ¿Estas seguro de desactivar la sede <strong className="text-white">{confirmDeactivateSede?.nombre}</strong>?
        </p>
      </Modal>

      {/* ── Create Horario ── */}
      <Modal
        open={modalHorarioCreate}
        onClose={() => setModalHorarioCreate(false)}
        title="Nuevo horario"
        footer={
          <>
            <button onClick={() => setModalHorarioCreate(false)} className={cx.btnSecondary}>Cancelar</button>
            <button onClick={handleCreateHorario} disabled={savingHorario} className={cx.btnPrimary + ' flex items-center gap-1.5'}>
              {savingHorario && <Loader2 size={14} className="animate-spin" />}
              Crear
            </button>
          </>
        }
      >
        <HorarioFormFields
          form={horarioForm}
          setForm={setHorarioForm}
          sedes={sedes}
        />
      </Modal>

      {/* ── Edit Horario ── */}
      <Modal
        open={!!modalHorarioEdit}
        onClose={() => setModalHorarioEdit(null)}
        title="Editar horario"
        footer={
          <>
            <button onClick={() => setModalHorarioEdit(null)} className={cx.btnSecondary}>Cancelar</button>
            <button onClick={handleEditHorario} disabled={savingHorario} className={cx.btnPrimary + ' flex items-center gap-1.5'}>
              {savingHorario && <Loader2 size={14} className="animate-spin" />}
              Guardar
            </button>
          </>
        }
      >
        <HorarioFormFields
          form={horarioForm}
          setForm={setHorarioForm}
          sedes={sedes}
        />
      </Modal>

      {/* ── Confirm Deactivate Horario ── */}
      <Modal
        open={!!confirmDeactivateHorario}
        onClose={() => setConfirmDeactivateHorario(null)}
        title="Desactivar horario"
        size="sm"
        footer={
          <>
            <button onClick={() => setConfirmDeactivateHorario(null)} className={cx.btnSecondary}>Cancelar</button>
            <button onClick={handleDeactivateHorario} disabled={savingHorario} className={cx.btnDanger + ' flex items-center gap-1.5'}>
              {savingHorario && <Loader2 size={14} className="animate-spin" />}
              Desactivar
            </button>
          </>
        }
      >
        <p className="text-zinc-300 text-sm">
          ¿Estas seguro de desactivar el horario <strong className="text-white">{confirmDeactivateHorario?.nombre_clase}</strong> ({DIAS[confirmDeactivateHorario?.dia_semana ?? 0]} {confirmDeactivateHorario?.hora_inicio})?
        </p>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Horario Form Fields (shared between create / edit)
// ---------------------------------------------------------------------------

function HorarioFormFields({
  form,
  setForm,
  sedes,
}: {
  form: HorarioForm;
  setForm: React.Dispatch<React.SetStateAction<HorarioForm>>;
  sedes: Sede[];
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className={cx.label}>Sede</label>
        <select
          className={cx.select}
          value={form.sede_id}
          onChange={e => setForm(f => ({ ...f, sede_id: e.target.value ? Number(e.target.value) : '' }))}
        >
          <option value="">Seleccionar sede</option>
          {sedes.map(s => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={cx.label}>Dia de la semana</label>
        <select
          className={cx.select}
          value={form.dia_semana}
          onChange={e => setForm(f => ({ ...f, dia_semana: e.target.value !== '' ? Number(e.target.value) : '' }))}
        >
          <option value="">Seleccionar dia</option>
          {Object.entries(DIAS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={cx.label}>Hora inicio</label>
          <input
            className={cx.input}
            type="time"
            value={form.hora_inicio}
            onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))}
          />
        </div>
        <div>
          <label className={cx.label}>Hora fin</label>
          <input
            className={cx.input}
            type="time"
            value={form.hora_fin}
            onChange={e => setForm(f => ({ ...f, hora_fin: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <label className={cx.label}>Nombre de la clase</label>
        <input
          className={cx.input}
          value={form.nombre_clase}
          onChange={e => setForm(f => ({ ...f, nombre_clase: e.target.value }))}
          placeholder="Ej: Taekwondo Infantil"
        />
      </div>
      <div>
        <label className={cx.label}>Capacidad</label>
        <input
          className={cx.input}
          type="number"
          min={0}
          value={form.capacidad}
          onChange={e => setForm(f => ({ ...f, capacidad: e.target.value ? Number(e.target.value) : '' }))}
          placeholder="Maximo de alumnos"
        />
      </div>
      <div>
        <label className={cx.label}>Instructor</label>
        <input
          className={cx.input}
          value={form.instructor}
          onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))}
          placeholder="Nombre del instructor"
        />
      </div>
    </div>
  );
}
