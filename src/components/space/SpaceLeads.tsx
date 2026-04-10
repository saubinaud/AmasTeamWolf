import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { UserPlus, Search, Download, Filter, Phone, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '../../config/api';
import { cx, badgeColors, statGradients } from './tokens';
import { Modal } from './Modal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Lead {
  id: number;
  nombre_alumno: string;
  nombre_apoderado?: string;
  telefono?: string;
  correo?: string;
  estado: string;
  plataforma?: string;
  campana?: string;
  observaciones?: string;
  fecha: string;
}

interface LeadStats {
  total: number;
  nuevos: number;
  contactados: number;
  matriculados: number;
}

interface EditForm {
  estado: string;
  telefono: string;
  correo: string;
  observaciones: string;
}

interface SpaceLeadsProps {
  token: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ESTADOS = ['Nuevo', 'Contactado', 'Interesado', 'Matriculado', 'Descartado'] as const;

const ESTADO_BADGE: Record<string, string> = {
  Nuevo: badgeColors.orange,
  Contactado: badgeColors.blue,
  Interesado: badgeColors.yellow,
  Matriculado: badgeColors.green,
  Descartado: badgeColors.red,
};

const LIMIT = 20;
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
    });
  } catch {
    return iso;
  }
}

function leadToCsvRow(l: Lead): string {
  const escape = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`;
  return [
    escape(l.nombre_alumno),
    escape(l.nombre_apoderado ?? ''),
    escape(l.estado),
    escape(l.plataforma ?? ''),
    escape(l.campana ?? ''),
    escape(l.telefono ?? ''),
    escape(l.correo ?? ''),
    escape(l.observaciones ?? ''),
    escape(formatFecha(l.fecha)),
  ].join(',');
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatsBar({ stats, loading }: { stats: LeadStats; loading: boolean }) {
  const items = [
    { label: 'Total leads', value: stats.total, gradient: statGradients.blue, icon: <UserPlus size={18} /> },
    { label: 'Nuevos', value: stats.nuevos, gradient: statGradients.orange, icon: <Filter size={18} /> },
    { label: 'Contactados', value: stats.contactados, gradient: statGradients.violet, icon: <Phone size={18} /> },
    { label: 'Matriculados', value: stats.matriculados, gradient: statGradients.green, icon: <UserPlus size={18} /> },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
          <div className={cx.skeleton + ' h-4 w-32'} />
          <div className={cx.skeleton + ' h-4 w-24 hidden sm:block'} />
          <div className={cx.skeleton + ' h-4 w-16'} />
          <div className={cx.skeleton + ' h-4 w-20 hidden md:block'} />
          <div className={cx.skeleton + ' h-4 w-20 hidden lg:block'} />
          <div className={cx.skeleton + ' h-4 w-16 hidden lg:block'} />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className={cx.card + ' py-16 text-center'}>
      <UserPlus size={40} className="mx-auto text-zinc-700 mb-3" />
      <p className="text-zinc-400 mb-1">Sin leads</p>
      <p className="text-zinc-500 text-sm">
        No se encontraron leads con los filtros actuales
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit Modal
// ---------------------------------------------------------------------------

function EditLeadModal({
  lead,
  open,
  onClose,
  onSaved,
  token,
}: {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  token: string;
}) {
  const [form, setForm] = useState<EditForm>({
    estado: '',
    telefono: '',
    correo: '',
    observaciones: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lead) {
      setForm({
        estado: lead.estado ?? 'Nuevo',
        telefono: lead.telefono ?? '',
        correo: lead.correo ?? '',
        observaciones: lead.observaciones ?? '',
      });
    }
  }, [lead]);

  const handleChange = useCallback(
    (field: keyof EditForm) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
      },
    [],
  );

  const handleSave = useCallback(async () => {
    if (!lead) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/space/leads/${lead.id}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        toast.error(data.message ?? 'Error al guardar cambios');
        return;
      }
      toast.success('Lead actualizado correctamente');
      onSaved();
      onClose();
    } catch {
      toast.error('Error de conexion al guardar');
    } finally {
      setSaving(false);
    }
  }, [lead, form, token, onSaved, onClose]);

  const footer = (
    <>
      <button onClick={onClose} className={cx.btnSecondary}>
        Cancelar
      </button>
      <button onClick={handleSave} disabled={saving} className={cx.btnPrimary + ' flex items-center gap-2'}>
        {saving && <Loader2 size={14} className="animate-spin" />}
        Guardar
      </button>
    </>
  );

  return (
    <Modal open={open} onClose={onClose} title="Editar Lead" footer={footer}>
      {lead && (
        <div className="space-y-5">
          {/* Read-only info */}
          <div className="bg-zinc-900 rounded-xl p-4 space-y-2 border border-zinc-800">
            <div className="flex justify-between">
              <span className="text-zinc-500 text-sm">Alumno</span>
              <span className="text-white text-sm font-medium">{lead.nombre_alumno}</span>
            </div>
            {lead.nombre_apoderado && (
              <div className="flex justify-between">
                <span className="text-zinc-500 text-sm">Apoderado</span>
                <span className="text-white text-sm">{lead.nombre_apoderado}</span>
              </div>
            )}
            {lead.plataforma && (
              <div className="flex justify-between">
                <span className="text-zinc-500 text-sm">Plataforma</span>
                <span className="text-white text-sm">{lead.plataforma}</span>
              </div>
            )}
          </div>

          {/* Estado */}
          <div>
            <label className={cx.label}>Estado</label>
            <select value={form.estado} onChange={handleChange('estado')} className={cx.select}>
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>

          {/* Telefono */}
          <div>
            <label className={cx.label}>
              <span className="inline-flex items-center gap-1.5">
                <Phone size={12} /> Telefono
              </span>
            </label>
            <input
              type="tel"
              value={form.telefono}
              onChange={handleChange('telefono')}
              placeholder="999 999 999"
              className={cx.input}
            />
          </div>

          {/* Correo */}
          <div>
            <label className={cx.label}>
              <span className="inline-flex items-center gap-1.5">
                <Mail size={12} /> Correo
              </span>
            </label>
            <input
              type="email"
              value={form.correo}
              onChange={handleChange('correo')}
              placeholder="correo@ejemplo.com"
              className={cx.input}
            />
          </div>

          {/* Observaciones */}
          <div>
            <label className={cx.label}>Observaciones</label>
            <textarea
              value={form.observaciones}
              onChange={handleChange('observaciones')}
              rows={3}
              placeholder="Notas sobre el lead..."
              className={cx.input + ' resize-none'}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SpaceLeads({ token }: SpaceLeadsProps) {
  // Data
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<LeadStats>({ total: 0, nuevos: 0, contactados: 0, matriculados: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // UI state
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // Edit modal
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  const debouncedRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -----------------------------------------------------------------------
  // Fetch stats
  // -----------------------------------------------------------------------

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/space/leads/stats`, {
        headers: authHeaders(token),
      });
      const data = await res.json();
      if (data.success !== false) {
        const s = data.stats ?? data.data ?? data;
        setStats({
          total: s.total ?? 0,
          nuevos: s.nuevos ?? 0,
          contactados: s.contactados ?? 0,
          matriculados: s.matriculados ?? 0,
        });
      }
    } catch {
      toast.error('Error al cargar estadisticas de leads');
    } finally {
      setStatsLoading(false);
    }
  }, [token]);

  // -----------------------------------------------------------------------
  // Fetch leads
  // -----------------------------------------------------------------------

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterEstado) params.set('estado', filterEstado);
      params.set('page', String(page));
      params.set('limit', String(LIMIT));
      const qs = params.toString();
      const res = await fetch(`${API_BASE}/space/leads?${qs}`, {
        headers: authHeaders(token),
      });
      const data = await res.json();
      if (data.success !== false) {
        setLeads(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
        setTotal(data.total ?? data.data?.length ?? 0);
      }
    } catch {
      toast.error('Error al cargar leads');
    } finally {
      setLoading(false);
    }
  }, [token, search, filterEstado, page]);

  // -----------------------------------------------------------------------
  // Effects
  // -----------------------------------------------------------------------

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Debounced search
  useEffect(() => {
    if (debouncedRef.current) clearTimeout(debouncedRef.current);
    debouncedRef.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => {
      if (debouncedRef.current) clearTimeout(debouncedRef.current);
    };
  }, [searchInput]);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value),
    [],
  );

  const handleEstadoFilter = useCallback((value: string) => {
    setFilterEstado((prev) => (prev === value ? '' : value));
    setPage(1);
  }, []);

  const handleRowClick = useCallback((lead: Lead) => {
    setEditLead(lead);
    setModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setEditLead(null);
  }, []);

  const handleLeadSaved = useCallback(() => {
    fetchLeads();
    fetchStats();
  }, [fetchLeads, fetchStats]);

  const handlePrevPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const handleNextPage = useCallback(() => setPage((p) => p + 1), []);

  // -----------------------------------------------------------------------
  // Export CSV
  // -----------------------------------------------------------------------

  const handleExport = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterEstado) params.set('estado', filterEstado);
      params.set('page', '1');
      params.set('limit', '10000');
      const qs = params.toString();
      const res = await fetch(`${API_BASE}/space/leads?${qs}`, {
        headers: authHeaders(token),
      });
      const data = await res.json();
      const allLeads: Lead[] = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];

      if (allLeads.length === 0) {
        toast.error('No hay leads para exportar');
        return;
      }

      const header = 'Nombre Alumno,Apoderado,Estado,Plataforma,Campana,Telefono,Correo,Observaciones,Fecha';
      const rows = allLeads.map(leadToCsvRow);
      const csv = [header, ...rows].join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${allLeads.length} leads exportados`);
    } catch {
      toast.error('Error al exportar leads');
    }
  }, [token, search, filterEstado]);

  // -----------------------------------------------------------------------
  // Computed
  // -----------------------------------------------------------------------

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / LIMIT)), [total]);
  const showingFrom = useMemo(() => (total === 0 ? 0 : (page - 1) * LIMIT + 1), [page, total]);
  const showingTo = useMemo(() => Math.min(page * LIMIT, total), [page, total]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold">Leads</h1>
          <p className="text-white/40 text-xs mt-1">{total} leads registrados</p>
        </div>
        <button onClick={handleExport} className={cx.btnSecondary + ' flex items-center gap-2'}>
          <Download size={14} />
          <span className="hidden sm:inline">Exportar CSV</span>
        </button>
      </div>

      {/* Stats */}
      <StatsBar stats={stats} loading={statsLoading} />

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {ESTADOS.map((e) => (
          <button
            key={e}
            onClick={() => handleEstadoFilter(e)}
            className={`transition-all duration-200 ${cx.chip(filterEstado === e)}`}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchInput}
            onChange={handleSearchChange}
            className={cx.input + ' pl-9'}
          />
        </div>
        <p className="text-white/30 text-xs">
          Mostrando {showingFrom}\u2013{showingTo} de {total} leads
        </p>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : leads.length === 0 ? (
        <EmptyState />
      ) : (
        <div className={cx.card + ' overflow-hidden'}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className={cx.th}>Nombre Alumno</th>
                  <th className={cx.th + ' hidden sm:table-cell'}>Apoderado</th>
                  <th className={cx.th}>Estado</th>
                  <th className={cx.th + ' hidden md:table-cell'}>Plataforma</th>
                  <th className={cx.th + ' hidden lg:table-cell'}>Campana</th>
                  <th className={cx.th + ' hidden lg:table-cell'}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => handleRowClick(l)}
                    className={cx.tr + ' cursor-pointer'}
                  >
                    <td className={cx.td + ' text-white font-medium whitespace-nowrap'}>
                      {l.nombre_alumno}
                    </td>
                    <td className={cx.td + ' text-zinc-400 hidden sm:table-cell'}>
                      {l.nombre_apoderado || '\u2014'}
                    </td>
                    <td className={cx.td}>
                      <span className={cx.badge(ESTADO_BADGE[l.estado] ?? badgeColors.gray)}>
                        {l.estado}
                      </span>
                    </td>
                    <td className={cx.td + ' text-zinc-400 hidden md:table-cell'}>
                      {l.plataforma || '\u2014'}
                    </td>
                    <td className={cx.td + ' text-zinc-400 hidden lg:table-cell'}>
                      {l.campana || '\u2014'}
                    </td>
                    <td className={cx.td + ' text-zinc-400 hidden lg:table-cell'}>
                      {formatFecha(l.fecha)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevPage}
            disabled={page <= 1}
            className={cx.btnSecondary + ' disabled:opacity-30'}
          >
            Anterior
          </button>
          <span className="text-white/40 text-sm">
            Pagina {page} de {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={page >= totalPages}
            className={cx.btnSecondary + ' disabled:opacity-30'}
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Edit modal */}
      <EditLeadModal
        lead={editLead}
        open={modalOpen}
        onClose={handleModalClose}
        onSaved={handleLeadSaved}
        token={token}
      />
    </div>
  );
}
