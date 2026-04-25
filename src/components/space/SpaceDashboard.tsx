import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users, ClipboardList, CalendarCheck, UserPlus,
  GraduationCap, ClipboardCheck, Download, TrendingUp, AlertTriangle,
  ArrowRight, Clock, ShoppingBag,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid,
} from 'recharts';
import { API_BASE } from '../../config/api';
import { cx, statGradients } from './tokens';
import type { SpacePage } from './SpaceApp';

interface Stats {
  alumnosActivos: number;
  inscripcionesActivas: number;
  asistenciasHoy: number;
  leadsNuevos: number;
  inscripcionesPorVencer?: number;
  ultimasAsistencias?: Array<{ nombre_alumno: string; hora: string; turno: string }>;
}

interface HeatmapEntry {
  dia_semana: number; // 0=Sun, 1=Mon, ..., 6=Sat
  clase: string;
  total: number;
}

interface TrendEntry { mes: string; total: number }
interface DailyEntry { dia: string; total: number }
interface ImplEntry { tipo: string; total: number }

interface Props {
  token: string;
  userName?: string;
  onNavigate?: (page: SpacePage) => void;
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const duration = 600;
    const start = Date.now();
    const from = 0;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{display}</>;
}

// ---------------------------------------------------------------------------
// Heatmap constants
// ---------------------------------------------------------------------------

const HEATMAP_CLASES_DISPLAY = ['Súper Baby Wolf', 'Baby Wolf', 'Little Wolf', 'Junior Wolf', 'Adolescentes Wolf'];
// Patterns to match turno field — order matters (Súper before Baby), normalize tildes
const HEATMAP_CLASES_PATTERNS = ['per baby', 'baby wolf', 'little', 'junior', 'adolescente'];
// Also catch "Tarde"/"Mañana" (legacy QR registrations) — map to nearest class or ignore
function normalizeClase(clase: string): string {
  return clase.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
const HEATMAP_DIAS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
// Map column index (0=Lun..5=Sab) to PostgreSQL DOW (1=Mon..6=Sat)
const COL_TO_DOW = [1, 2, 3, 4, 5, 6];

function heatColor(count: number): string {
  if (count === 0) return 'bg-stone-100 text-stone-400';
  if (count <= 5) return 'bg-emerald-100 text-emerald-700';
  if (count <= 15) return 'bg-emerald-200 text-emerald-800';
  if (count <= 30) return 'bg-emerald-400 text-white';
  return 'bg-emerald-500 text-white';
}

export function SpaceDashboard({ token, userName, onNavigate }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [heatmap, setHeatmap] = useState<HeatmapEntry[]>([]);
  const [trend, setTrend] = useState<TrendEntry[]>([]);
  const [daily, setDaily] = useState<DailyEntry[]>([]);
  const [topImpl, setTopImpl] = useState<ImplEntry[]>([]);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    const safeJson = (url: string) => fetch(url, { headers }).then(r => r.json()).catch(() => ({ success: false }));
    Promise.all([
      safeJson(`${API_BASE}/space/dashboard/stats`),
      safeJson(`${API_BASE}/space/dashboard/heatmap`),
      safeJson(`${API_BASE}/space/dashboard/inscripciones-trend`),
      safeJson(`${API_BASE}/space/dashboard/inscripciones-diarias`),
      safeJson(`${API_BASE}/space/dashboard/top-implementos`),
    ])
      .then(([statsData, heatmapData, trendData, dailyData, implData]) => {
        if (statsData.success && statsData.stats) setStats(statsData.stats);
        else setError('No se pudieron cargar las estadisticas');
        if (heatmapData.success) setHeatmap(heatmapData.heatmap || []);
        if (trendData.success) setTrend(trendData.data || []);
        if (dailyData.success) setDaily(dailyData.data || []);
        if (implData.success) setTopImpl(implData.data || []);
      })
      .catch(() => setError('Error de conexion'))
      .finally(() => setLoading(false));
  }, [token]);

  const cards = useMemo(() => {
    if (!stats) return [];
    return [
      { id: 'al', label: 'Alumnos activos', value: stats.alumnosActivos, icon: Users, gradient: statGradients.blue },
      { id: 'in', label: 'Inscripciones', value: stats.inscripcionesActivas, icon: ClipboardList, gradient: statGradients.green },
      { id: 'as', label: 'Asistencias hoy', value: stats.asistenciasHoy, icon: CalendarCheck, gradient: statGradients.orange },
      { id: 'le', label: 'Leads nuevos', value: stats.leadsNuevos, icon: UserPlus, gradient: statGradients.violet },
    ];
  }, [stats]);

  const go = useCallback((page: SpacePage) => onNavigate?.(page), [onNavigate]);

  // Process monthly trend — format labels
  const trendChart = useMemo(() => {
    const MESES_CORTO: Record<string, string> = {
      '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun',
      '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
    };
    return trend.map(t => ({
      label: MESES_CORTO[t.mes.split('-')[1]] || t.mes,
      total: t.total,
    }));
  }, [trend]);

  // Process daily data — split into current month and previous month
  const dailyChart = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth(); // 0-indexed
    const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();

    const curMap = new Map<number, number>();
    const prevMap = new Map<number, number>();

    for (const d of daily) {
      const date = new Date(d.dia);
      const day = date.getUTCDate();
      if (date.getUTCMonth() === curMonth && date.getUTCFullYear() === curYear) {
        curMap.set(day, (curMap.get(day) || 0) + d.total);
      } else {
        prevMap.set(day, (prevMap.get(day) || 0) + d.total);
      }
    }

    return Array.from({ length: daysInMonth }, (_, i) => ({
      dia: i + 1,
      actual: curMap.get(i + 1) || 0,
      anterior: prevMap.get(i + 1) || 0,
    }));
  }, [daily]);

  const today = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Lima' });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-stone-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(k => <div key={k} className="h-28 bg-stone-100 rounded-2xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1,2,3].map(k => <div key={k} className="h-20 bg-stone-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${cx.card} p-8 text-center`}>
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-50 via-white to-white border border-stone-200 p-5 sm:p-6">
        <div className="relative">
          <h2 className="text-stone-900 text-lg sm:text-xl font-bold">
            Hola, {userName || 'Admin'} 👋
          </h2>
          <p className="text-stone-400 text-sm mt-1 capitalize">{today}</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(({ id, label, value, icon: Icon, gradient }) => (
          <div
            key={id}
            className={`relative overflow-hidden bg-gradient-to-br ${gradient.bg} border ${gradient.border} rounded-2xl p-4 sm:p-5 transition-all duration-200`}
          >
            <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-3`}>
              <Icon size={18} className={gradient.icon} />
            </div>
            <p className={`text-3xl font-bold ${gradient.text} leading-none`}>
              <AnimatedNumber value={value} />
            </p>
            <p className="text-stone-500 text-xs mt-1.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Heatmap de asistencias */}
      {heatmap.length > 0 && (
        <div>
          <h3 className="text-stone-400 text-[10px] uppercase tracking-widest font-medium mb-3">Asistencias ultimos 30 dias</h3>
          <div className={`${cx.card} p-4 sm:p-5 overflow-x-auto`}>
            <table className="w-full text-left text-xs">
              <thead>
                <tr>
                  <th className="py-2 pr-3 text-stone-400 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap">Clase</th>
                  {HEATMAP_DIAS.map((d) => (
                    <th key={d} className="py-2 px-1 text-center text-stone-400 text-[10px] font-semibold uppercase tracking-wider">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HEATMAP_CLASES_DISPLAY.map((clase, claseIdx) => (
                  <tr key={clase}>
                    <td className="py-1.5 pr-3 text-stone-600 text-xs whitespace-nowrap">{clase}</td>
                    {COL_TO_DOW.map((dow, ci) => {
                      const pattern = HEATMAP_CLASES_PATTERNS[claseIdx];
                      const matches = heatmap.filter(
                        (h) => h.dia_semana === dow && normalizeClase(h.clase).includes(pattern)
                      );
                      const count = matches.reduce((sum, m) => sum + m.total, 0);
                      return (
                        <td key={ci} className="py-1.5 px-1">
                          <div className={`w-full min-w-[36px] h-9 flex items-center justify-center rounded-lg text-xs font-medium ${heatColor(count)}`}>
                            {count}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Legend */}
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-stone-200">
              <span className="text-stone-400 text-[10px]">Intensidad:</span>
              {[
                { label: '0', cls: 'bg-stone-100' },
                { label: '1-5', cls: 'bg-emerald-100' },
                { label: '6-15', cls: 'bg-emerald-200' },
                { label: '16-30', cls: 'bg-emerald-400' },
                { label: '30+', cls: 'bg-emerald-500' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded ${l.cls}`} />
                  <span className="text-stone-400 text-[10px]">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Charts: Inscripciones */}
      {(trendChart.length > 0 || dailyChart.length > 0) && (
        <div>
          <h3 className="text-stone-400 text-[10px] uppercase tracking-widest font-medium mb-3">Inscripciones</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Monthly trend */}
            {trendChart.length > 0 && (
              <div className={`${cx.card} p-5`}>
                <p className="text-stone-900 text-sm font-semibold mb-4">Inscripciones mensuales</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trendChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e7e5e4', borderRadius: 8, fontSize: 12, color: '#1c1917' }}
                      labelStyle={{ color: '#78716c', fontWeight: 600 }}
                    />
                    <Line type="monotone" dataKey="total" stroke="#e8590c" strokeWidth={2.5} dot={{ r: 4, fill: '#e8590c' }} activeDot={{ r: 6 }} name="Inscripciones" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Daily: this month vs previous */}
            {dailyChart.length > 0 && (
              <div className={`${cx.card} p-5`}>
                <p className="text-stone-900 text-sm font-semibold mb-1">Este mes vs anterior</p>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-[#e8590c] rounded-full" />
                    <span className="text-stone-400 text-[10px]">Este mes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-stone-300 rounded-full" />
                    <span className="text-stone-400 text-[10px]">Mes anterior</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dailyChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                    <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} interval={4} />
                    <YAxis tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} allowDecimals={false} width={20} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e7e5e4', borderRadius: 8, fontSize: 12, color: '#1c1917' }}
                      labelFormatter={(v) => `Día ${v}`}
                    />
                    <Line type="monotone" dataKey="actual" stroke="#e8590c" strokeWidth={2} dot={false} name="Este mes" />
                    <Line type="monotone" dataKey="anterior" stroke="#d6d3d1" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Mes anterior" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chart: Top implementos */}
      {topImpl.length > 0 && (
        <div>
          <h3 className="text-stone-400 text-[10px] uppercase tracking-widest font-medium mb-3">Implementos mas vendidos</h3>
          <div className={`${cx.card} p-5`}>
            <ResponsiveContainer width="100%" height={Math.max(180, topImpl.length * 36)}>
              <BarChart data={topImpl} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="tipo" tick={{ fontSize: 12, fill: '#57534e' }} axisLine={false} tickLine={false} width={110} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e7e5e4', borderRadius: 8, fontSize: 12, color: '#1c1917' }}
                  cursor={{ fill: '#f5f5f4' }}
                />
                <Bar dataKey="total" fill="#e8590c" radius={[0, 4, 4, 0]} barSize={20} name="Vendidos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Alert: inscripciones por vencer */}
      {stats?.inscripcionesPorVencer != null && stats.inscripcionesPorVencer > 0 && (
        <button
          onClick={() => {
            // Navigate to inscripciones with vencimientos filter
            sessionStorage.setItem('space_insc_filter', 'por_vencer');
            go('inscripciones');
          }}
          className="w-full flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left hover:bg-amber-100 transition-all duration-200 group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-amber-700 text-sm font-medium">
              {stats.inscripcionesPorVencer} inscripciones por vencer esta semana
            </p>
            <p className="text-amber-700/50 text-xs mt-0.5">Click para ver detalle</p>
          </div>
          <ArrowRight size={16} className="text-amber-700/40 group-hover:text-amber-700 transition-colors shrink-0" />
        </button>
      )}

      {/* Quick actions */}
      <div>
        <h3 className="text-stone-400 text-[10px] uppercase tracking-widest font-medium mb-3">Acciones rapidas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { page: 'graduaciones' as SpacePage, icon: GraduationCap, title: 'Graduaciones', sub: 'Gestionar evaluaciones', color: 'text-[#e8590c]' },
            { page: 'asistencia' as SpacePage, icon: ClipboardCheck, title: 'Asistencia', sub: 'Control del dia', color: 'text-emerald-400' },
            { page: 'alumnos' as SpacePage, icon: TrendingUp, title: 'Alumnos', sub: 'Ver listado completo', color: 'text-sky-400' },
          ].map(({ page, icon: Icon, title, sub, color }) => (
            <button
              key={page}
              onClick={() => go(page)}
              className={`${cx.card} p-4 flex items-center gap-3 text-left hover:bg-stone-50 transition-all duration-200 group`}
            >
              <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center shrink-0 group-hover:bg-stone-100 transition-colors">
                <Icon size={18} className={color} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-stone-900 text-sm font-medium">{title}</p>
                <p className="text-stone-400 text-xs mt-0.5">{sub}</p>
              </div>
              <ArrowRight size={14} className="text-stone-300 group-hover:text-stone-500 transition-colors shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Recent attendance */}
      {stats?.ultimasAsistencias && stats.ultimasAsistencias.length > 0 && (
        <div>
          <h3 className="text-stone-400 text-[10px] uppercase tracking-widest font-medium mb-3">Ultimas asistencias</h3>
          <div className={`${cx.card} divide-y divide-stone-100`}>
            {stats.ultimasAsistencias.slice(0, 5).map((a, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <Clock size={14} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-stone-900 text-sm truncate">{a.nombre_alumno}</p>
                </div>
                <span className="text-stone-400 text-xs shrink-0">{a.hora?.slice(0, 5)} · {a.turno}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
