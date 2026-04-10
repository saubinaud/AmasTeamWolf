import { useState, useEffect, useCallback, useMemo } from 'react';
import { CalendarCheck, Download, Users, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '../../config/api';
import { cx, badgeColors, statGradients } from './tokens';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AsistenciaHoy {
  id: number;
  alumno_nombre: string;
  alumno_apellido: string;
  hora: string;
  turno: string;
  programa: string;
  asistio: boolean;
}

interface AsistenciaStats {
  asistencias_hoy: number;
  alumnos_unicos_hoy: number;
  asistencias_semana: number;
}

interface ResumenDiario {
  fecha: string;
  total: number;
  presentes: number;
}

interface SpaceAsistenciaProps {
  token: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SKELETON_KEYS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5'] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function formatFecha(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function formatHora(hora: string | undefined): string {
  if (!hora) return '—';
  try {
    if (hora.includes('T')) {
      return new Date(hora).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    }
    return hora;
  } catch {
    return hora;
  }
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  gradient: typeof statGradients.blue;
}) {
  return (
    <div className={`${cx.card} p-4 sm:p-5 bg-gradient-to-br ${gradient.bg} border ${gradient.border}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">{label}</span>
        <Icon size={18} className={gradient.icon} />
      </div>
      <p className={`text-2xl font-bold ${gradient.text}`}>{value}</p>
    </div>
  );
}

function AsistenciaTableSkeleton() {
  return (
    <div className={cx.card + ' overflow-hidden'}>
      {SKELETON_KEYS.map(sk => (
        <div key={sk} className={'flex gap-4 px-4 py-4 ' + cx.tr}>
          <div className={cx.skeleton + ' h-4 w-32'} />
          <div className={cx.skeleton + ' h-4 w-16'} />
          <div className={cx.skeleton + ' h-4 w-20 hidden sm:block'} />
          <div className={cx.skeleton + ' h-4 w-20 hidden md:block'} />
          <div className={cx.skeleton + ' h-4 w-12'} />
        </div>
      ))}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className={cx.card + ' p-4 sm:p-5'}>
          <div className={cx.skeleton + ' h-3 w-24 mb-3'} />
          <div className={cx.skeleton + ' h-7 w-16'} />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SpaceAsistencia({ token }: SpaceAsistenciaProps) {
  // Stats
  const [stats, setStats] = useState<AsistenciaStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Today's attendance
  const [asistencias, setAsistencias] = useState<AsistenciaHoy[]>([]);
  const [totalHoy, setTotalHoy] = useState(0);
  const [pageHoy, setPageHoy] = useState(1);
  const [loadingHoy, setLoadingHoy] = useState(true);

  // Date filters
  const [desde, setDesde] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return toISODate(d);
  });
  const [hasta, setHasta] = useState(() => toISODate(new Date()));

  // Daily summary
  const [resumen, setResumen] = useState<ResumenDiario[]>([]);
  const [loadingResumen, setLoadingResumen] = useState(true);

  // Export
  const [exporting, setExporting] = useState(false);

  const limit = 20;

  // -----------------------------------------------------------------------
  // Fetch
  // -----------------------------------------------------------------------

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/space/asistencia/stats`, { headers: authHeaders(token) });
      const data = await res.json();
      if (data.success !== false) {
        setStats(data.stats ?? data.data ?? data);
      }
    } catch {
      toast.error('Error al cargar estadisticas');
    } finally {
      setStatsLoading(false);
    }
  }, [token]);

  const fetchHoy = useCallback(async () => {
    setLoadingHoy(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(pageHoy));
      params.set('limit', String(limit));
      const res = await fetch(`${API_BASE}/space/asistencia/hoy?${params.toString()}`, { headers: authHeaders(token) });
      const data = await res.json();
      if (data.success !== false) {
        setAsistencias(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
        setTotalHoy(data.total ?? data.data?.length ?? 0);
      }
    } catch {
      toast.error('Error al cargar asistencias de hoy');
    } finally {
      setLoadingHoy(false);
    }
  }, [token, pageHoy]);

  const fetchResumen = useCallback(async () => {
    setLoadingResumen(true);
    try {
      const params = new URLSearchParams();
      if (desde) params.set('desde', desde);
      if (hasta) params.set('hasta', hasta);
      const res = await fetch(`${API_BASE}/space/asistencia/por-fecha?${params.toString()}`, { headers: authHeaders(token) });
      const data = await res.json();
      if (data.success !== false) {
        setResumen(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
      }
    } catch {
      toast.error('Error al cargar resumen diario');
    } finally {
      setLoadingResumen(false);
    }
  }, [token, desde, hasta]);

  useEffect(() => {
    fetchStats();
    fetchHoy();
  }, [fetchStats, fetchHoy]);

  useEffect(() => {
    fetchResumen();
  }, [fetchResumen]);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (desde) params.set('desde', desde);
      if (hasta) params.set('hasta', hasta);
      const res = await fetch(`${API_BASE}/space/asistencia/exportar?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        toast.error('Error al exportar');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `asistencia_${desde}_${hasta}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Archivo exportado');
    } catch {
      toast.error('Error al exportar asistencias');
    } finally {
      setExporting(false);
    }
  }, [token, desde, hasta]);

  const handleDesdeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDesde(e.target.value);
  }, []);

  const handleHastaChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setHasta(e.target.value);
  }, []);

  const handlePrevPage = useCallback(() => setPageHoy(p => Math.max(1, p - 1)), []);
  const handleNextPage = useCallback(() => setPageHoy(p => p + 1), []);

  // -----------------------------------------------------------------------
  // Computed
  // -----------------------------------------------------------------------

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalHoy / limit)), [totalHoy]);
  const showingFrom = useMemo(() => totalHoy === 0 ? 0 : (pageHoy - 1) * limit + 1, [pageHoy, totalHoy]);
  const showingTo = useMemo(() => Math.min(pageHoy * limit, totalHoy), [pageHoy, totalHoy]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-white text-xl font-bold">Asistencia</h1>
        <p className="text-zinc-500 text-xs mt-1">Control de asistencia de alumnos</p>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <StatsSkeleton />
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Asistencias hoy"
            value={stats.asistencias_hoy}
            icon={CalendarCheck}
            gradient={statGradients.blue}
          />
          <StatCard
            label="Alumnos unicos hoy"
            value={stats.alumnos_unicos_hoy}
            icon={Users}
            gradient={statGradients.green}
          />
          <StatCard
            label="Asistencias esta semana"
            value={stats.asistencias_semana}
            icon={Clock}
            gradient={statGradients.orange}
          />
        </div>
      ) : null}

      {/* Date filters + Export */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div>
          <label className={cx.label}>Desde</label>
          <input
            type="date"
            value={desde}
            onChange={handleDesdeChange}
            className={cx.input + ' w-auto'}
          />
        </div>
        <div>
          <label className={cx.label}>Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={handleHastaChange}
            className={cx.input + ' w-auto'}
          />
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className={cx.btnPrimary + ' flex items-center gap-2 disabled:opacity-50'}
        >
          <Download size={15} />
          {exporting ? 'Exportando...' : 'Exportar CSV'}
        </button>
      </div>

      {/* Today's attendance table */}
      <div>
        <h2 className="text-white text-sm font-semibold mb-3">Asistencias de hoy</h2>
        <p className="text-zinc-500 text-xs mb-3">
          Mostrando {showingFrom}–{showingTo} de {totalHoy} registros
        </p>

        {loadingHoy ? (
          <AsistenciaTableSkeleton />
        ) : asistencias.length === 0 ? (
          <div className={cx.card + ' py-16 text-center'}>
            <CalendarCheck size={40} className="mx-auto text-zinc-700 mb-3" />
            <p className="text-zinc-400 mb-1">Sin asistencias hoy</p>
            <p className="text-zinc-500 text-sm">No se registraron asistencias para el dia de hoy</p>
          </div>
        ) : (
          <div className={cx.card + ' overflow-hidden'}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className={cx.th}>Alumno</th>
                    <th className={cx.th}>Hora</th>
                    <th className={cx.th + ' hidden sm:table-cell'}>Turno</th>
                    <th className={cx.th + ' hidden md:table-cell'}>Programa</th>
                    <th className={cx.th}>Asistio</th>
                  </tr>
                </thead>
                <tbody>
                  {asistencias.map(a => (
                    <tr key={a.id} className={cx.tr}>
                      <td className={cx.td + ' text-white font-medium whitespace-nowrap'}>
                        {a.alumno_nombre} {a.alumno_apellido}
                      </td>
                      <td className={cx.td + ' text-zinc-400'}>{formatHora(a.hora)}</td>
                      <td className={cx.td + ' text-zinc-400 hidden sm:table-cell'}>{a.turno || '—'}</td>
                      <td className={cx.td + ' text-zinc-400 hidden md:table-cell'}>{a.programa || '—'}</td>
                      <td className={cx.td}>
                        <span className={cx.badge(a.asistio ? badgeColors.green : badgeColors.red)}>
                          {a.asistio ? 'Si' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalHoy > limit && (
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={handlePrevPage}
              disabled={pageHoy <= 1}
              className={cx.btnSecondary + ' disabled:opacity-30'}
            >
              Anterior
            </button>
            <span className="text-zinc-500 text-sm">
              Pagina {pageHoy} de {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={pageHoy >= totalPages}
              className={cx.btnSecondary + ' disabled:opacity-30'}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* Daily summary */}
      <div>
        <h2 className="text-white text-sm font-semibold mb-3">Resumen diario</h2>

        {loadingResumen ? (
          <AsistenciaTableSkeleton />
        ) : resumen.length === 0 ? (
          <div className={cx.card + ' py-12 text-center'}>
            <Clock size={32} className="mx-auto text-zinc-700 mb-3" />
            <p className="text-zinc-400 text-sm">Sin datos para el rango seleccionado</p>
          </div>
        ) : (
          <div className={cx.card + ' overflow-hidden'}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className={cx.th}>Fecha</th>
                    <th className={cx.th}>Total</th>
                    <th className={cx.th}>Presentes</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.map(r => (
                    <tr key={r.fecha} className={cx.tr}>
                      <td className={cx.td + ' text-white font-medium'}>{formatFecha(r.fecha)}</td>
                      <td className={cx.td + ' text-zinc-400'}>{r.total}</td>
                      <td className={cx.td}>
                        <span className={cx.badge(badgeColors.green)}>{r.presentes}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
