import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShoppingBag, Plus, Pencil, Trash2, Search, Package,
  Shield, Shirt, Loader2, User, Check, Clock, PackageCheck,
  Settings, X, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cx, badgeColors, statGradients } from './tokens';
import { Modal } from './Modal';
import { API_BASE } from '../../config/api';
// Date helpers — fuerzan timeZone: America/Lima
import { formatFecha } from './dateUtils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Categoria = 'arma' | 'uniforme' | 'protector' | 'polo' | 'accesorio' | 'otro';
type Origen = 'compra' | 'incluido_programa' | 'regalo' | 'promocion';
type MetodoPago = 'efectivo' | 'yape' | 'transferencia' | 'tarjeta';

interface ComprasStats {
  total: number;
  ventas_mes: number;
  pendientes_entrega: number;
  uniformes: number;
}

interface Compra {
  id: number;
  alumno_id: number;
  alumno_nombre: string;
  alumno_dni?: string;
  categoria: Categoria;
  tipo: string;
  talla?: string | null;
  precio: number;
  origen: Origen;
  metodo_pago?: MetodoPago | null;
  fecha_adquisicion: string;
  observaciones?: string | null;
  entregado: boolean;
  fecha_entrega?: string | null;
  entregado_by?: number | null;
}

interface AlumnoBusqueda {
  id: number;
  nombre: string;
  dni?: string;
}

interface CatalogoItem {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  activo: boolean;
}

interface SpaceComprasProps {
  token: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LIMIT = 20;
const SKELETON_ROWS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5'] as const;

const CATEGORIA_BADGE: Record<Categoria, string> = {
  arma: badgeColors.red,
  uniforme: badgeColors.blue,
  protector: badgeColors.violet,
  polo: badgeColors.orange,
  accesorio: badgeColors.yellow,
  otro: badgeColors.gray,
};

const CATEGORIA_LABEL: Record<Categoria, string> = {
  arma: 'Arma',
  uniforme: 'Uniforme',
  protector: 'Protector',
  polo: 'Polo',
  accesorio: 'Accesorio',
  otro: 'Otro',
};

const ORIGEN_BADGE: Record<Origen, string> = {
  compra: badgeColors.green,
  incluido_programa: badgeColors.blue,
  regalo: badgeColors.violet,
  promocion: badgeColors.orange,
};

const ORIGEN_LABEL: Record<Origen, string> = {
  compra: 'Compra',
  incluido_programa: 'Incluido',
  regalo: 'Regalo',
  promocion: 'Promocion',
};

const METODO_LABEL: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  yape: 'Yape',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
};

const CATEGORIAS: { key: Categoria | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'arma', label: 'Armas' },
  { key: 'uniforme', label: 'Uniformes' },
  { key: 'protector', label: 'Protectores' },
  { key: 'polo', label: 'Polos' },
  { key: 'accesorio', label: 'Accesorios' },
  { key: 'otro', label: 'Otros' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}


function formatPrecio(n: number | string | null | undefined): string {
  const v = typeof n === 'number' ? n : parseFloat(String(n ?? 0));
  if (Number.isNaN(v)) return 'S/ 0.00';
  return `S/ ${v.toFixed(2)}`;
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

function StatsBar({ stats, loading, onPendientesClick }: { stats: ComprasStats; loading: boolean; onPendientesClick: () => void }) {
  const items = [
    {
      label: 'Total compras',
      value: String(stats.total),
      gradient: statGradients.blue,
      icon: <ShoppingBag size={18} />,
      onClick: undefined as (() => void) | undefined,
    },
    {
      label: 'Ventas este mes',
      value: formatPrecio(stats.ventas_mes),
      gradient: statGradients.orange,
      icon: <PackageCheck size={18} />,
      onClick: undefined as (() => void) | undefined,
    },
    {
      label: 'Pendientes entrega',
      value: String(stats.pendientes_entrega),
      gradient: statGradients.violet,
      icon: <Clock size={18} />,
      onClick: onPendientesClick,
    },
    {
      label: 'Uniformes',
      value: String(stats.uniformes),
      gradient: statGradients.green,
      icon: <Shirt size={18} />,
      onClick: undefined as (() => void) | undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item) => {
        const baseCls = `bg-gradient-to-br ${item.gradient.bg} border ${item.gradient.border} rounded-2xl p-4 text-left`;
        const interactiveCls = item.onClick ? ' hover:brightness-125 transition-all active:scale-[0.98] cursor-pointer' : '';
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
        if (item.onClick) {
          return (
            <button key={item.label} onClick={item.onClick} className={baseCls + interactiveCls}>
              {content}
            </button>
          );
        }
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
      <Package size={40} className="mx-auto text-zinc-700 mb-3" />
      <p className="text-zinc-400 mb-1">Sin compras</p>
      <p className="text-zinc-500 text-sm">
        No se encontraron compras con los filtros actuales
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create / Edit Modal
// ---------------------------------------------------------------------------

interface CompraFormState {
  alumno_id: number | null;
  alumno_nombre: string;
  categoria: Categoria;
  tipo: string;
  talla: string;
  precio: string;
  origen: Origen;
  metodo_pago: MetodoPago;
  fecha_adquisicion: string;
  observaciones: string;
  entregado: boolean;
}

function emptyForm(): CompraFormState {
  return {
    alumno_id: null,
    alumno_nombre: '',
    categoria: 'arma',
    tipo: '',
    talla: '',
    precio: '',
    origen: 'compra',
    metodo_pago: 'efectivo',
    fecha_adquisicion: todayISO(),
    observaciones: '',
    entregado: false,
  };
}

function CompraFormModal({
  open,
  onClose,
  onSaved,
  editing,
  token,
  catalogo,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing: Compra | null;
  token: string;
  catalogo: CatalogoItem[];
}) {
  const [form, setForm] = useState<CompraFormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AlumnoBusqueda[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [useCustomTipo, setUseCustomTipo] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Items from catálogo filtered by current categoria
  const catalogoFiltered = catalogo.filter((c) => c.categoria === form.categoria);
  // Check if current tipo matches a catalog item
  const isCatalogoTipo = catalogoFiltered.some((c) => c.nombre === form.tipo);

  // Load editing data or reset
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        alumno_id: editing.alumno_id,
        alumno_nombre: editing.alumno_nombre,
        categoria: editing.categoria,
        tipo: editing.tipo,
        talla: editing.talla ?? '',
        precio: String(editing.precio ?? ''),
        origen: editing.origen,
        metodo_pago: editing.metodo_pago ?? 'efectivo',
        fecha_adquisicion: (editing.fecha_adquisicion ?? todayISO()).slice(0, 10),
        observaciones: editing.observaciones ?? '',
        entregado: Boolean(editing.entregado),
      });
      setSearchQuery(editing.alumno_nombre);
      // If the editing tipo is not in catalogo for that category, show free text
      const matchesCatalog = catalogo.some(
        (c) => c.categoria === editing.categoria && c.nombre === editing.tipo
      );
      setUseCustomTipo(!matchesCatalog);
    } else {
      setForm(emptyForm());
      setSearchQuery('');
      setUseCustomTipo(false);
    }
    setSearchResults([]);
    setShowResults(false);
  }, [editing, open, catalogo]);

  // Debounced alumno search
  useEffect(() => {
    if (!open) return;
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    // Skip search if we already have selected alumno matching query
    if (form.alumno_id && form.alumno_nombre === searchQuery) {
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
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, open, token, form.alumno_id, form.alumno_nombre]);

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

  const handleSelectAlumno = useCallback((a: AlumnoBusqueda) => {
    setForm((f) => ({ ...f, alumno_id: a.id, alumno_nombre: a.nombre }));
    setSearchQuery(a.nombre);
    setShowResults(false);
    setSearchResults([]);
  }, []);

  const handleClose = useCallback(() => {
    setForm(emptyForm());
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    onClose();
  }, [onClose]);

  const canSave =
    form.alumno_id !== null &&
    form.tipo.trim().length > 0 &&
    form.precio.trim().length > 0 &&
    !Number.isNaN(parseFloat(form.precio)) &&
    parseFloat(form.precio) >= 0;

  const handleSave = useCallback(async () => {
    if (!canSave) {
      toast.error('Completa los campos requeridos');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        alumno_id: form.alumno_id,
        categoria: form.categoria,
        tipo: form.tipo.trim(),
        talla: form.talla.trim() || null,
        precio: parseFloat(form.precio),
        origen: form.origen,
        fecha_adquisicion: form.fecha_adquisicion,
        observaciones: form.observaciones.trim() || null,
      };
      if (!editing) {
        body.entregado = form.entregado;
      }
      if (form.origen === 'compra') {
        body.metodo_pago = form.metodo_pago;
      } else {
        body.metodo_pago = null;
      }

      const url = editing
        ? `${API_BASE}/space/compras/${editing.id}`
        : `${API_BASE}/space/compras`;
      const method = editing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders(token),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        toast.error(data?.error ?? data?.message ?? 'Error al guardar compra');
        return;
      }
      toast.success(editing ? 'Compra actualizada' : 'Compra registrada');
      onSaved();
      handleClose();
    } catch {
      toast.error('Error de conexion al guardar');
    } finally {
      setSaving(false);
    }
  }, [canSave, form, editing, token, onSaved, handleClose]);

  const footer = (
    <>
      <button onClick={handleClose} className={cx.btnSecondary}>
        Cancelar
      </button>
      <button
        onClick={handleSave}
        disabled={saving || !canSave}
        className={cx.btnPrimary + ' flex items-center gap-2'}
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <ShoppingBag size={14} />}
        {editing ? 'Guardar cambios' : 'Registrar compra'}
      </button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={editing ? 'Editar compra' : 'Nueva compra'}
      footer={footer}
      size="lg"
    >
      <div className="space-y-5">
        {/* Alumno autocomplete */}
        <div className="relative" ref={resultsRef}>
          <label className={cx.label}>Alumno</label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setForm((f) => ({ ...f, alumno_id: null, alumno_nombre: '' }));
              }}
              placeholder="Buscar alumno por nombre o DNI..."
              className={cx.input}
            />
            {searching && (
              <Loader2
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 animate-spin"
              />
            )}
          </div>
          {form.alumno_id && form.alumno_nombre && (
            <p className="text-xs text-emerald-400 mt-1.5">
              Seleccionado: {form.alumno_nombre}
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

        {/* Categoria + Tipo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={cx.label}>Categoria</label>
            <select
              value={form.categoria}
              onChange={(e) => {
                const newCat = e.target.value as Categoria;
                setForm((f) => ({ ...f, categoria: newCat, tipo: '', precio: '' }));
                setUseCustomTipo(false);
              }}
              className={cx.select}
            >
              <option value="arma">Arma</option>
              <option value="uniforme">Uniforme</option>
              <option value="protector">Protector</option>
              <option value="polo">Polo</option>
              <option value="accesorio">Accesorio</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className={cx.label}>Tipo</label>
            {useCustomTipo ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.tipo}
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                  placeholder="Nombre del implemento..."
                  className={cx.input}
                />
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomTipo(false);
                    setForm((f) => ({ ...f, tipo: '', precio: '' }));
                  }}
                  className={cx.btnGhost + ' shrink-0'}
                  title="Volver al catalogo"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <select
                value={form.tipo}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__otro__') {
                    setUseCustomTipo(true);
                    setForm((f) => ({ ...f, tipo: '', precio: '' }));
                    return;
                  }
                  const item = catalogoFiltered.find((c) => c.nombre === val);
                  setForm((f) => ({
                    ...f,
                    tipo: val,
                    precio: item ? String(item.precio) : f.precio,
                  }));
                }}
                className={cx.select}
              >
                <option value="">-- Seleccionar --</option>
                {catalogoFiltered.map((item) => (
                  <option key={item.id} value={item.nombre}>
                    {item.nombre} — S/ {Number(item.precio).toFixed(2)}
                  </option>
                ))}
                <option value="__otro__">Otro (texto libre)</option>
              </select>
            )}
          </div>
        </div>

        {/* Talla + Precio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={cx.label}>Talla (opcional)</label>
            <input
              type="text"
              value={form.talla}
              onChange={(e) => setForm((f) => ({ ...f, talla: e.target.value }))}
              placeholder="Ej: M, S, 8, 1.5m"
              className={cx.input}
            />
          </div>
          <div>
            <label className={cx.label}>Precio (S/)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.precio}
              onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))}
              placeholder="0.00"
              className={cx.input}
            />
          </div>
        </div>

        {/* Origen + Metodo pago */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={cx.label}>Origen</label>
            <select
              value={form.origen}
              onChange={(e) => setForm((f) => ({ ...f, origen: e.target.value as Origen }))}
              className={cx.select}
            >
              <option value="compra">Compra</option>
              <option value="incluido_programa">Incluido en programa</option>
              <option value="regalo">Regalo</option>
              <option value="promocion">Promocion</option>
            </select>
          </div>
          {form.origen === 'compra' && (
            <div>
              <label className={cx.label}>Metodo de pago</label>
              <select
                value={form.metodo_pago}
                onChange={(e) => setForm((f) => ({ ...f, metodo_pago: e.target.value as MetodoPago }))}
                className={cx.select}
              >
                <option value="efectivo">Efectivo</option>
                <option value="yape">Yape</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </div>
          )}
        </div>

        {/* Fecha */}
        <div>
          <label className={cx.label}>Fecha de adquisicion</label>
          <input
            type="date"
            value={form.fecha_adquisicion}
            onChange={(e) => setForm((f) => ({ ...f, fecha_adquisicion: e.target.value }))}
            className={cx.input}
          />
        </div>

        {/* Observaciones */}
        <div>
          <label className={cx.label}>Observaciones</label>
          <textarea
            value={form.observaciones}
            onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
            placeholder="Notas adicionales..."
            rows={3}
            className={cx.input + ' resize-none'}
          />
        </div>

        {/* Entrega (solo al crear) */}
        {!editing && (
          <label className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-3 cursor-pointer hover:bg-zinc-800/50 transition-colors">
            <input
              type="checkbox"
              checked={form.entregado}
              onChange={(e) => setForm((f) => ({ ...f, entregado: e.target.checked }))}
              className="w-4 h-4 accent-[#FA7B21]"
            />
            <div className="flex-1">
              <div className="text-white text-sm font-medium">Entregar ahora</div>
              <div className="text-zinc-500 text-xs">
                Marcar como entregado en el momento del registro. Si no, quedará pendiente.
              </div>
            </div>
          </label>
        )}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Catalogo Management Modal
// ---------------------------------------------------------------------------

function CatalogoModal({
  open,
  onClose,
  token,
  catalogo,
  onRefresh,
}: {
  open: boolean;
  onClose: () => void;
  token: string;
  catalogo: CatalogoItem[];
  onRefresh: () => void;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrecio, setEditPrecio] = useState('');
  const [editNombre, setEditNombre] = useState('');
  const [adding, setAdding] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newCategoria, setNewCategoria] = useState<Categoria>('arma');
  const [newPrecio, setNewPrecio] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = useCallback((item: CatalogoItem) => {
    setEditingId(item.id);
    setEditPrecio(String(item.precio));
    setEditNombre(item.nombre);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditPrecio('');
    setEditNombre('');
  }, []);

  const saveEdit = useCallback(async () => {
    if (editingId === null) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/space/compras/catalogo/${editingId}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({ nombre: editNombre.trim(), precio: parseFloat(editPrecio) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        toast.error(data?.error ?? 'Error al actualizar');
        return;
      }
      toast.success('Item actualizado');
      cancelEdit();
      onRefresh();
    } catch {
      toast.error('Error de conexion');
    } finally {
      setSaving(false);
    }
  }, [editingId, editNombre, editPrecio, token, cancelEdit, onRefresh]);

  const handleDeactivate = useCallback(async (id: number) => {
    if (!window.confirm('Desactivar este item del catalogo?')) return;
    try {
      const res = await fetch(`${API_BASE}/space/compras/catalogo/${id}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        toast.error(data?.error ?? 'Error al desactivar');
        return;
      }
      toast.success('Item desactivado');
      onRefresh();
    } catch {
      toast.error('Error de conexion');
    }
  }, [token, onRefresh]);

  const handleAdd = useCallback(async () => {
    if (!newNombre.trim() || !newPrecio) {
      toast.error('Completa nombre y precio');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/space/compras/catalogo`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({
          nombre: newNombre.trim(),
          categoria: newCategoria,
          precio: parseFloat(newPrecio),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        toast.error(data?.error ?? 'Error al crear');
        return;
      }
      toast.success('Item agregado al catalogo');
      setNewNombre('');
      setNewPrecio('');
      setAdding(false);
      onRefresh();
    } catch {
      toast.error('Error de conexion');
    } finally {
      setSaving(false);
    }
  }, [newNombre, newCategoria, newPrecio, token, onRefresh]);

  // Group catalogo by categoria
  const grouped: Record<string, CatalogoItem[]> = {};
  for (const item of catalogo) {
    if (!grouped[item.categoria]) grouped[item.categoria] = [];
    grouped[item.categoria].push(item);
  }

  const footer = (
    <button onClick={onClose} className={cx.btnSecondary}>Cerrar</button>
  );

  return (
    <Modal open={open} onClose={onClose} title="Gestionar catalogo" footer={footer} size="lg">
      <div className="space-y-4">
        {/* Add new item */}
        {adding ? (
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 space-y-3">
            <p className="text-white text-sm font-medium">Nuevo item</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={newNombre}
                onChange={(e) => setNewNombre(e.target.value)}
                placeholder="Nombre..."
                className={cx.input}
              />
              <select
                value={newCategoria}
                onChange={(e) => setNewCategoria(e.target.value as Categoria)}
                className={cx.select}
              >
                <option value="arma">Arma</option>
                <option value="uniforme">Uniforme</option>
                <option value="protector">Protector</option>
                <option value="polo">Polo</option>
                <option value="accesorio">Accesorio</option>
                <option value="otro">Otro</option>
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newPrecio}
                onChange={(e) => setNewPrecio(e.target.value)}
                placeholder="Precio S/"
                className={cx.input}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAdding(false)} className={cx.btnGhost + ' text-xs'}>
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                disabled={saving}
                className={cx.btnPrimary + ' text-xs flex items-center gap-1.5'}
              >
                {saving && <Loader2 size={12} className="animate-spin" />}
                Agregar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className={cx.btnSecondary + ' flex items-center gap-2 text-xs'}
          >
            <Plus size={14} /> Agregar item
          </button>
        )}

        {/* Items grouped by categoria */}
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-widest mb-2">
              {CATEGORIA_LABEL[cat as Categoria] ?? cat}
            </p>
            <div className="space-y-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5"
                >
                  {editingId === item.id ? (
                    <>
                      <input
                        type="text"
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                        className={cx.input + ' flex-1 !py-1.5 text-xs'}
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editPrecio}
                        onChange={(e) => setEditPrecio(e.target.value)}
                        className={cx.input + ' w-24 !py-1.5 text-xs'}
                      />
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                      >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1.5 text-zinc-400 hover:bg-zinc-700 rounded-lg transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-white text-sm flex-1">{item.nombre}</span>
                      <span className="text-zinc-400 text-sm font-medium">
                        S/ {Number(item.precio).toFixed(2)}
                      </span>
                      <button
                        onClick={() => startEdit(item)}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeactivate(item.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Desactivar"
                      >
                        <ToggleLeft size={14} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {catalogo.length === 0 && (
          <p className="text-zinc-500 text-sm text-center py-6">
            No hay items en el catalogo
          </p>
        )}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function SpaceCompras({ token }: SpaceComprasProps) {
  const [stats, setStats] = useState<ComprasStats>({
    total: 0,
    ventas_mes: 0,
    pendientes_entrega: 0,
    uniformes: 0,
  });
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [categoriaFilter, setCategoriaFilter] = useState<Categoria | 'all'>('all');
  const [entregaFilter, setEntregaFilter] = useState<'all' | 'pendiente' | 'entregado'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Compra | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [entregandoId, setEntregandoId] = useState<number | null>(null);
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([]);
  const [catalogoOpen, setCatalogoOpen] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  // Debounce search input
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  // Reset page when category or entrega filter changes
  useEffect(() => {
    setPage(1);
  }, [categoriaFilter, entregaFilter]);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(`${API_BASE}/space/compras/stats`, {
        headers: authHeaders(token),
      });
      const data = await res.json();
      const s = data?.data ?? data ?? {};
      // Backend returns total_compras, total_ventas_mes, pendientes_entrega, por_categoria[]
      const porCat: Array<{ categoria: string; total: number }> = Array.isArray(s.por_categoria) ? s.por_categoria : [];
      const uniformesCount = porCat.find((c) => c.categoria === 'uniforme')?.total ?? 0;
      setStats({
        total: Number(s.total_compras ?? s.total ?? 0),
        ventas_mes: Number(s.total_ventas_mes ?? s.ventas_mes ?? 0),
        pendientes_entrega: Number(s.pendientes_entrega ?? 0),
        uniformes: Number(uniformesCount),
      });
    } catch {
      toast.error('Error al cargar estadisticas');
    } finally {
      setLoadingStats(false);
    }
  }, [token]);

  const fetchCatalogo = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/space/compras/catalogo`, {
        headers: authHeaders(token),
      });
      const data = await res.json();
      const list = Array.isArray(data?.data) ? data.data : [];
      setCatalogo(list.map((r: Record<string, unknown>) => ({
        id: Number(r.id),
        nombre: String(r.nombre ?? ''),
        categoria: String(r.categoria ?? ''),
        precio: Number(r.precio ?? 0),
        activo: Boolean(r.activo),
      })));
    } catch {
      // Silently fail — catalogo is optional convenience
    }
  }, [token]);

  const fetchCompras = useCallback(async () => {
    setLoadingTable(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(LIMIT));
      if (categoriaFilter !== 'all') params.set('categoria', categoriaFilter);
      if (entregaFilter === 'pendiente') params.set('entregado', 'false');
      else if (entregaFilter === 'entregado') params.set('entregado', 'true');
      if (debouncedSearch) params.set('search', debouncedSearch);

      const res = await fetch(`${API_BASE}/space/compras?${params.toString()}`, {
        headers: authHeaders(token),
      });
      const data = await res.json();
      const inner = data?.data ?? data;
      const list = Array.isArray(inner?.compras)
        ? inner.compras
        : Array.isArray(inner)
          ? inner
          : [];
      // Normalize from backend row shape (nombre_alumno, dni_alumno)
      const normalized: Compra[] = list.map((r: Record<string, unknown>) => ({
        id: Number(r.id),
        alumno_id: Number(r.alumno_id),
        alumno_nombre: String(r.alumno_nombre ?? r.nombre_alumno ?? r.alumno_nombre ?? ''),
        alumno_dni: (r.alumno_dni ?? r.dni_alumno) as string | undefined,
        categoria: r.categoria as Categoria,
        tipo: String(r.tipo ?? ''),
        talla: (r.talla ?? null) as string | null,
        precio: Number(r.precio ?? 0),
        origen: (r.origen ?? 'compra') as Origen,
        metodo_pago: (r.metodo_pago ?? null) as MetodoPago | null,
        fecha_adquisicion: String(r.fecha_adquisicion ?? ''),
        observaciones: (r.observaciones ?? null) as string | null,
        entregado: Boolean(r.entregado),
        fecha_entrega: (r.fecha_entrega ?? null) as string | null,
        entregado_by: (r.entregado_by ?? null) as number | null,
      }));
      setCompras(normalized);
      setTotal(
        Number(
          data?.total ?? inner?.total ?? inner?.pagination?.total ?? list.length,
        ),
      );
    } catch {
      toast.error('Error al cargar compras');
    } finally {
      setLoadingTable(false);
    }
  }, [token, page, categoriaFilter, entregaFilter, debouncedSearch]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchCatalogo();
  }, [fetchCatalogo]);

  useEffect(() => {
    fetchCompras();
  }, [fetchCompras]);

  const handleSaved = useCallback(() => {
    fetchStats();
    fetchCompras();
  }, [fetchStats, fetchCompras]);

  const handleEdit = useCallback((c: Compra) => {
    setEditing(c);
    setFormOpen(true);
  }, []);

  const handleCreate = useCallback(() => {
    setEditing(null);
    setFormOpen(true);
  }, []);

  const handleToggleEntrega = useCallback(
    async (c: Compra) => {
      if (entregandoId !== null) return;
      const marcarEntregado = !c.entregado;
      if (marcarEntregado) {
        const ok = window.confirm(
          `Marcar como entregado: ${c.tipo} de ${c.alumno_nombre}?`,
        );
        if (!ok) return;
      }
      setEntregandoId(c.id);
      try {
        const res = await fetch(`${API_BASE}/space/compras/${c.id}/entregar`, {
          method: 'PATCH',
          headers: authHeaders(token),
          body: JSON.stringify({ entregado: marcarEntregado }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.success === false) {
          toast.error(data?.error ?? 'Error al marcar entrega');
          return;
        }
        toast.success(marcarEntregado ? 'Marcado como entregado' : 'Entrega revertida');
        fetchStats();
        fetchCompras();
      } catch {
        toast.error('Error de conexion');
      } finally {
        setEntregandoId(null);
      }
    },
    [entregandoId, token, fetchStats, fetchCompras],
  );

  const handlePendientesShortcut = useCallback(() => {
    setEntregaFilter('pendiente');
    setCategoriaFilter('all');
  }, []);

  const handleDelete = useCallback(
    async (c: Compra) => {
      if (deletingId !== null) return;
      const ok = window.confirm(
        `Eliminar la compra de ${c.alumno_nombre} (${c.tipo})? Esta accion no se puede deshacer.`,
      );
      if (!ok) return;
      setDeletingId(c.id);
      try {
        const res = await fetch(`${API_BASE}/space/compras/${c.id}`, {
          method: 'DELETE',
          headers: authHeaders(token),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.success === false) {
          toast.error(data?.error ?? data?.message ?? 'Error al eliminar compra');
          return;
        }
        toast.success('Compra eliminada');
        fetchStats();
        fetchCompras();
      } catch {
        toast.error('Error de conexion al eliminar');
      } finally {
        setDeletingId(null);
      }
    },
    [deletingId, token, fetchStats, fetchCompras],
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold">Registro de Compras</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Control de equipamiento, armas y uniformes de alumnos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCatalogoOpen(true)}
            className={cx.btnIcon}
            title="Gestionar catalogo"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={handleCreate}
            className={cx.btnPrimary + ' flex items-center gap-2'}
          >
            <Plus size={16} />
            Nueva compra
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsBar stats={stats} loading={loadingStats} onPendientesClick={handlePendientesShortcut} />

      {/* Filter chips categoría */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIAS.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategoriaFilter(c.key)}
            className={cx.chip(categoriaFilter === c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Filter chips entrega */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-zinc-500 text-xs uppercase tracking-wider mr-1">Entrega:</span>
        <button onClick={() => setEntregaFilter('all')} className={cx.chip(entregaFilter === 'all')}>
          Todas
        </button>
        <button onClick={() => setEntregaFilter('pendiente')} className={cx.chip(entregaFilter === 'pendiente')}>
          <Clock size={12} className="inline mr-1" /> Pendientes
        </button>
        <button onClick={() => setEntregaFilter('entregado')} className={cx.chip(entregaFilter === 'entregado')}>
          <Check size={12} className="inline mr-1" /> Entregadas
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
        />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por nombre de alumno..."
          className={cx.input + ' pl-9'}
        />
      </div>

      {/* Table */}
      {loadingTable ? (
        <TableSkeleton />
      ) : compras.length === 0 ? (
        <EmptyState />
      ) : (
        <div className={cx.card + ' overflow-hidden'}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className={cx.th}>Alumno</th>
                  <th className={cx.th + ' hidden sm:table-cell'}>Categoria</th>
                  <th className={cx.th}>Tipo</th>
                  <th className={cx.th}>Precio</th>
                  <th className={cx.th + ' hidden md:table-cell'}>Origen</th>
                  <th className={cx.th + ' hidden lg:table-cell'}>Fecha compra</th>
                  <th className={cx.th}>Entrega</th>
                  <th className={cx.th + ' text-right'}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {compras.map((c) => (
                  <tr key={c.id} className={cx.tr}>
                    <td className={cx.td}>
                      <div className="flex flex-col">
                        <span className="text-white text-sm truncate max-w-[180px]">
                          {c.alumno_nombre}
                        </span>
                        {c.alumno_dni && (
                          <span className="text-zinc-500 text-xs">{c.alumno_dni}</span>
                        )}
                      </div>
                    </td>
                    <td className={cx.td + ' hidden sm:table-cell'}>
                      <span
                        className={cx.badge(
                          CATEGORIA_BADGE[c.categoria] ?? badgeColors.gray,
                        )}
                      >
                        {CATEGORIA_LABEL[c.categoria] ?? c.categoria}
                      </span>
                    </td>
                    <td className={cx.td}>
                      <div className="flex flex-col">
                        <span className="text-white text-sm truncate max-w-[180px]">
                          {c.tipo}
                        </span>
                        {c.talla && (
                          <span className="text-zinc-500 text-xs">Talla: {c.talla}</span>
                        )}
                      </div>
                    </td>
                    <td className={cx.td}>
                      <span className="text-white font-medium text-sm">
                        {formatPrecio(c.precio)}
                      </span>
                      {c.origen === 'compra' && c.metodo_pago && (
                        <div className="text-zinc-500 text-xs">
                          {METODO_LABEL[c.metodo_pago]}
                        </div>
                      )}
                    </td>
                    <td className={cx.td + ' hidden md:table-cell'}>
                      <span
                        className={cx.badge(
                          ORIGEN_BADGE[c.origen] ?? badgeColors.gray,
                        )}
                      >
                        {ORIGEN_LABEL[c.origen] ?? c.origen}
                      </span>
                    </td>
                    <td className={cx.td + ' hidden lg:table-cell text-zinc-500 text-xs'}>
                      {formatFecha(c.fecha_adquisicion)}
                    </td>
                    <td className={cx.td}>
                      <div className="space-y-2">
                        {/* Toggle buttons */}
                        <div className="flex rounded-lg overflow-hidden border border-zinc-700">
                          <button
                            onClick={async () => {
                              if (c.entregado) return; // ya está pendiente → nada
                              setEntregandoId(c.id);
                              try {
                                const res = await fetch(`${API_BASE}/space/compras/${c.id}/entregar`, {
                                  method: 'PATCH',
                                  headers: authHeaders(token),
                                  body: JSON.stringify({ entregado: false }),
                                });
                                if (res.ok) { toast.success('Marcado como pendiente'); fetchStats(); fetchCompras(); }
                                else toast.error('Error al cambiar estado');
                              } catch { toast.error('Error de conexión'); }
                              finally { setEntregandoId(null); }
                            }}
                            disabled={entregandoId === c.id || !c.entregado}
                            className={`flex-1 px-2.5 py-2 text-[11px] font-semibold transition-all ${
                              !c.entregado
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
                            } disabled:opacity-50`}
                          >
                            Pendiente
                          </button>
                          <button
                            onClick={async () => {
                              if (!c.entregado) {
                                setEntregandoId(c.id);
                                try {
                                  const res = await fetch(`${API_BASE}/space/compras/${c.id}/entregar`, {
                                    method: 'PATCH',
                                    headers: authHeaders(token),
                                    body: JSON.stringify({ entregado: true }),
                                  });
                                  if (res.ok) { toast.success('Marcado como entregado'); fetchStats(); fetchCompras(); }
                                  else toast.error('Error al cambiar estado');
                                } catch { toast.error('Error de conexión'); }
                                finally { setEntregandoId(null); }
                              }
                            }}
                            disabled={entregandoId === c.id || c.entregado}
                            className={`flex-1 px-2.5 py-2 text-[11px] font-semibold transition-all ${
                              c.entregado
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
                            } disabled:opacity-50`}
                          >
                            Entregado
                          </button>
                        </div>
                        {/* Fecha entrega (solo si entregado) */}
                        {c.entregado && (
                          <input
                            type="date"
                            value={c.fecha_entrega ? c.fecha_entrega.slice(0, 10) : ''}
                            onChange={async (e) => {
                              const fecha = e.target.value;
                              if (!fecha) return;
                              try {
                                const res = await fetch(`${API_BASE}/space/compras/${c.id}/entregar`, {
                                  method: 'PATCH',
                                  headers: authHeaders(token),
                                  body: JSON.stringify({ entregado: true, fecha_entrega: fecha }),
                                });
                                const data = await res.json().catch(() => ({}));
                                if (res.ok && data?.success !== false) {
                                  toast.success('Fecha actualizada');
                                  fetchCompras();
                                } else {
                                  toast.error(data?.error ?? 'Error actualizando fecha');
                                }
                              } catch { toast.error('Error de conexión'); }
                            }}
                            className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-300 focus:border-[#FA7B21] focus:outline-none transition-colors"
                          />
                        )}
                        {entregandoId === c.id && (
                          <Loader2 size={12} className="animate-spin text-zinc-500 mx-auto" />
                        )}
                      </div>
                    </td>
                    <td className={cx.td + ' text-right'}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(c)}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          disabled={deletingId === c.id}
                          className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Eliminar"
                        >
                          {deletingId === c.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
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
                Pagina {page} de {totalPages} ({total} compras)
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

      {/* Form Modal */}
      <CompraFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
        editing={editing}
        token={token}
        catalogo={catalogo}
      />

      {/* Catalogo Management Modal */}
      <CatalogoModal
        open={catalogoOpen}
        onClose={() => setCatalogoOpen(false)}
        token={token}
        catalogo={catalogo}
        onRefresh={fetchCatalogo}
      />
    </div>
  );
}
