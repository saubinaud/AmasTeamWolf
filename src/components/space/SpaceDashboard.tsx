import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users, ClipboardList, DollarSign, UserPlus,
  GraduationCap, ClipboardCheck, TrendingUp, AlertTriangle,
  ArrowRight, Clock, Calendar,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import { API_BASE } from '../../config/api';
import { cx, statGradients } from './tokens';
import type { SpacePage } from './SpaceApp';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Stats {
  alumnosActivos: number;
  leadsNuevos: number;
  inscripcionesPorVencer?: number;
  ultimasAsistencias?: Array<{ nombre_alumno: string; hora: string; turno: string }>;
}

interface Analytics {
  inscripcionesMes: number;
  ingresosMes: number;
  inscripcionesDiarias: Array<{ dia: string; total: number; ingresos: number }>;
  ventasMensuales: Array<{ mes: string; nuevos: number; renovaciones: number; ingresos_nuevos: number; ingresos_renovaciones: number }>;
  porPrograma: Array<{ programa: string; total: number }>;
  porTipoCliente: Array<{ tipo: string; total: number; ingresos: number }>;
  porHora: Array<{ hora: number; total: number }>;
  topImplementos: Array<{ tipo: string; total: number }>;
  alumnosAntiguos: Array<{ id: number; nombre: string; estado: string; primera_inscripcion: string; inscripciones_count: number; total_pagado: number }>;
}

interface Props {
  token: string;
  userName?: string;
  onNavigate?: (page: SpacePage) => void;
  academia?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MESES_CORTO: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun',
  '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
};

const PIE_COLORS = ['#e8590c', '#0f766e', '#4f46e5', '#0284c7', '#d97706', '#be185d', '#7c3aed', '#64748b'];
const TIPO_COLORS: Record<string, string> = { 'Nuevo/Primer registro': '#e8590c', 'Renovación': '#0f766e' };

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#fff', border: '1px solid #e7e5e4', borderRadius: 8, fontSize: 12, color: '#1c1917' },
  labelStyle: { color: '#78716c', fontWeight: 600 as const },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const duration = 600;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{display}</>;
}

function SectionTitle({ children }: { children: string }) {
  return <h3 className="text-stone-400 text-[10px] uppercase tracking-widest font-medium mb-3">{children}</h3>;
}

function formatSoles(n: number): string {
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatFechaCorta(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Lima' });
  } catch { return iso; }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SpaceDashboard({ token, userName, onNavigate, academia }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Date range — default: first day of current month to today
  const [desde, setDesde] = useState(() => {
    const d = new Date();
    return toISODate(new Date(d.getFullYear(), d.getMonth(), 1));
  });
  const [hasta, setHasta] = useState(() => toISODate(new Date()));

  // Initial load — stats (no date filter, refetch on academia change)
  useEffect(() => {
    setLoading(true);
    setStats(null);
    setAnalytics(null);
    setError('');
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${API_BASE}/space/dashboard/stats`, { headers })
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.stats); else setError('No se pudieron cargar las estadísticas'); })
      .catch(() => setError('Error de conexión'))
      .finally(() => setLoading(false));
  }, [token, academia]);

  // Analytics — refetch on date change WITHOUT full page reload
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const r = await fetch(`${API_BASE}/space/dashboard/analytics?desde=${desde}&hasta=${hasta}`, { headers });
      const d = await r.json();
      if (d.success) setAnalytics(d.data);
    } catch { /* silent */ }
    finally { setAnalyticsLoading(false); }
  }, [token, desde, hasta, academia]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const go = useCallback((page: SpacePage) => onNavigate?.(page), [onNavigate]);

  const today = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Lima' });

  // Year/month selector
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<Set<number>>(() => new Set([new Date().getMonth()]));

  const toggleMonth = useCallback((m: number) => {
    setSelectedMonths(prev => {
      const next = new Set(prev);
      if (next.has(m)) { if (next.size > 1) next.delete(m); } else next.add(m);
      // Update desde/hasta from selected range
      const months = Array.from(next).sort((a, b) => a - b);
      const firstMonth = months[0];
      const lastMonth = months[months.length - 1];
      const y = selectedYear;
      setDesde(toISODate(new Date(y, firstMonth, 1)));
      const lastDay = new Date(y, lastMonth + 1, 0);
      const today = new Date();
      setHasta(toISODate(lastDay > today ? today : lastDay));
      return next;
    });
  }, [selectedYear]);

  const selectAllYear = useCallback(() => {
    const all = new Set(Array.from({ length: 12 }, (_, i) => i));
    setSelectedMonths(all);
    setDesde(toISODate(new Date(selectedYear, 0, 1)));
    const dec31 = new Date(selectedYear, 11, 31);
    const today = new Date();
    setHasta(toISODate(dec31 > today ? today : dec31));
  }, [selectedYear]);

  const changeYear = useCallback((y: number) => {
    setSelectedYear(y);
    const today = new Date();
    const curMonth = y === today.getFullYear() ? today.getMonth() : 0;
    setSelectedMonths(new Set([curMonth]));
    setDesde(toISODate(new Date(y, curMonth, 1)));
    const lastDay = new Date(y, curMonth + 1, 0);
    setHasta(toISODate(lastDay > today ? today : lastDay));
  }, []);

  // Processed chart data
  const ventasChart = useMemo(() => {
    if (!analytics) return [];
    return analytics.ventasMensuales.map(v => ({
      label: MESES_CORTO[v.mes.split('-')[1]] || v.mes,
      Nuevos: Number(v.ingresos_nuevos),
      Renovaciones: Number(v.ingresos_renovaciones),
      total: Number(v.ingresos_nuevos) + Number(v.ingresos_renovaciones),
    }));
  }, [analytics]);

  const dailyChart = useMemo(() => {
    if (!analytics) return [];
    return analytics.inscripcionesDiarias.map(d => ({
      dia: new Date(d.dia).getDate(),
      total: d.total,
      ingresos: Number(d.ingresos),
    }));
  }, [analytics]);

  const horaChart = useMemo(() => {
    if (!analytics) return [];
    // Fill all hours 0-23 with 0s
    const map = new Map(analytics.porHora.map(h => [h.hora, h.total]));
    return Array.from({ length: 24 }, (_, i) => ({
      hora: `${i}h`,
      total: map.get(i) || 0,
    })).filter(h => h.total > 0 || (parseInt(h.hora) >= 7 && parseInt(h.hora) <= 22));
  }, [analytics]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-stone-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(k => <div key={k} className="h-28 bg-stone-100 rounded-2xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {[1, 2].map(k => <div key={k} className="h-52 bg-stone-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${cx.card} p-8 text-center`}>
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
        <p className="text-rose-600 text-sm">{error}</p>
      </div>
    );
  }

  const a = analytics;

  return (
    <div className="space-y-6">
      {/* Welcome header + date filter */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-50 via-white to-white border border-stone-200 p-5 sm:p-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-stone-900 text-lg sm:text-xl font-bold">Hola, {userName || 'Admin'}</h2>
              <p className="text-stone-400 text-sm mt-0.5 capitalize">{today}</p>
            </div>
            {analyticsLoading && (
              <div className="w-5 h-5 border-2 border-[#e8590c] border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          {/* Year selector */}
          <div className="flex items-center gap-2">
            {[2025, 2026].map(y => (
              <button key={y} onClick={() => changeYear(y)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedYear === y ? 'bg-[var(--accent)] text-white' : 'bg-white border border-stone-200 text-stone-500 hover:text-stone-800'
                }`}
              >{y}</button>
            ))}
            <button onClick={selectAllYear}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-stone-200 text-stone-400 hover:text-stone-700 transition-colors"
            >Todo el año</button>
            {analyticsLoading && <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin ml-2" />}
          </div>
          {/* Month grid */}
          <div className="flex flex-wrap gap-1">
            {Object.entries(MESES_CORTO).map(([num, label]) => {
              const m = parseInt(num, 10) - 1;
              const active = selectedMonths.has(m) && selectedYear === selectedYear;
              const isFuture = selectedYear === new Date().getFullYear() && m > new Date().getMonth();
              return (
                <button key={num} onClick={() => !isFuture && toggleMonth(m)} disabled={isFuture}
                  className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                    isFuture ? 'text-stone-300 cursor-not-allowed' :
                    active ? 'bg-[var(--accent)] text-white' : 'bg-white border border-stone-200 text-stone-500 hover:border-[var(--accent)] hover:text-stone-800'
                  }`}
                >{label}</button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { id: 'al', label: 'Alumnos activos', value: stats?.alumnosActivos ?? 0, icon: Users, gradient: statGradients.blue },
          { id: 'in', label: 'Inscripciones', value: a?.inscripcionesMes ?? 0, icon: ClipboardList, gradient: statGradients.green },
          { id: 'rev', label: 'Ingresos', value: a?.ingresosMes ?? 0, icon: DollarSign, gradient: statGradients.orange, isMoney: true },
          { id: 'le', label: 'Leads nuevos', value: stats?.leadsNuevos ?? 0, icon: UserPlus, gradient: statGradients.violet },
        ].map(({ id, label, value, icon: Icon, gradient, isMoney }) => (
          <div key={id} className={`relative overflow-hidden bg-gradient-to-br ${gradient.bg} border ${gradient.border} rounded-2xl p-4 sm:p-5`}>
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-3">
              <Icon size={18} className={gradient.icon} />
            </div>
            <p className={`text-2xl sm:text-3xl font-bold ${gradient.text} leading-none`}>
              {isMoney ? <>S/ <AnimatedNumber value={value} /></> : <AnimatedNumber value={value} />}
            </p>
            <p className="text-stone-500 text-xs mt-1.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Alert: inscripciones por vencer */}
      {stats?.inscripcionesPorVencer != null && stats.inscripcionesPorVencer > 0 && (
        <button
          onClick={() => { sessionStorage.setItem('space_insc_filter', 'por_vencer'); go('inscripciones'); }}
          className="w-full flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left hover:bg-amber-100 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-amber-700 text-sm font-medium">{stats.inscripcionesPorVencer} inscripciones por vencer esta semana</p>
          </div>
          <ArrowRight size={16} className="text-amber-400 group-hover:text-amber-700 transition-colors shrink-0" />
        </button>
      )}

      {/* Row 1: Daily inscriptions + Daily revenue */}
      {a && dailyChart.length > 0 && (
        <div>
          <SectionTitle>Detalle diario</SectionTitle>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Daily inscriptions */}
            <div className={`${cx.card} p-5`}>
              <p className="text-stone-900 text-sm font-semibold mb-4">Inscripciones por día</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                  <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} interval={2} />
                  <YAxis tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} allowDecimals={false} width={25} />
                  <Tooltip {...TOOLTIP_STYLE} labelFormatter={v => `Día ${v}`} />
                  <Bar dataKey="total" fill="#e8590c" radius={[4, 4, 0, 0]} barSize={16} name="Inscripciones" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Daily revenue */}
            <div className={`${cx.card} p-5`}>
              <p className="text-stone-900 text-sm font-semibold mb-4">Ingresos diarios (S/)</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                  <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} interval={2} />
                  <YAxis tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} width={45} tickFormatter={v => `${v}`} />
                  <Tooltip {...TOOLTIP_STYLE} labelFormatter={v => `Día ${v}`} formatter={(v: number) => [`S/ ${v}`, 'Ingresos']} />
                  <Bar dataKey="ingresos" fill="#0f766e" radius={[4, 4, 0, 0]} barSize={16} name="S/" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Row 2: Monthly sales — stacked bars (ingresos) + line (cantidad) */}
      {a && ventasChart.length > 0 && (
        <div>
          <SectionTitle>Ventas mes a mes</SectionTitle>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Ingresos mensuales — barras stacked */}
            <div className={`${cx.card} p-5`}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-stone-900 text-sm font-semibold">Ingresos mensuales (S/)</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#e8590c]" /><span className="text-stone-400 text-[10px]">Nuevos</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#0f766e]" /><span className="text-stone-400 text-[10px]">Renovaciones</span></div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ventasChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} width={45} tickFormatter={v => `${v}`} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: number, name: string) => [`S/ ${v.toLocaleString()}`, name]} />
                  <Bar dataKey="Nuevos" stackId="a" fill="#e8590c" radius={[0, 0, 0, 0]} barSize={24} name="Nuevos" />
                  <Bar dataKey="Renovaciones" stackId="a" fill="#0f766e" radius={[4, 4, 0, 0]} barSize={24} name="Renovaciones" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Cantidad de inscripciones mensuales — líneas */}
            <div className={`${cx.card} p-5`}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-stone-900 text-sm font-semibold">Inscripciones mensuales</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded-full bg-[#e8590c]" /><span className="text-stone-400 text-[10px]">Nuevos</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded-full bg-[#0f766e]" /><span className="text-stone-400 text-[10px]">Renovaciones</span></div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={analytics!.ventasMensuales.map(v => ({ label: MESES_CORTO[v.mes.split('-')[1]] || v.mes, Nuevos: v.nuevos, Renovaciones: v.renovaciones }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} allowDecimals={false} width={25} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="Nuevos" stroke="#e8590c" strokeWidth={2.5} dot={{ r: 4, fill: '#e8590c' }} name="Nuevos" />
                  <Line type="monotone" dataKey="Renovaciones" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 4, fill: '#0f766e' }} name="Renovaciones" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Row 3: Donut charts — Programas + Tipo cliente */}
      {a && (a.porPrograma.length > 0 || a.porTipoCliente.length > 0) && (
        <div>
          <SectionTitle>Distribución</SectionTitle>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Programas donut */}
            {a.porPrograma.length > 0 && (
              <div className={`${cx.card} p-5`}>
                <p className="text-stone-900 text-sm font-semibold mb-2">Por programa</p>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={a.porPrograma} dataKey="total" nameKey="programa" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} strokeWidth={0}>
                        {a.porPrograma.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e7e5e4', borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    {a.porPrograma.map((p, i) => (
                      <div key={p.programa} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-stone-600 text-xs truncate flex-1">{p.programa}</span>
                        <span className="text-stone-900 text-xs font-semibold">{p.total}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tipo cliente donut */}
            {a.porTipoCliente.length > 0 && (
              <div className={`${cx.card} p-5`}>
                <p className="text-stone-900 text-sm font-semibold mb-2">Nuevos vs Renovaciones</p>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={a.porTipoCliente} dataKey="total" nameKey="tipo" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} strokeWidth={0}>
                        {a.porTipoCliente.map((entry) => (
                          <Cell key={entry.tipo} fill={TIPO_COLORS[entry.tipo] || '#64748b'} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e7e5e4', borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2 min-w-0">
                    {a.porTipoCliente.map(t => (
                      <div key={t.tipo}>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: TIPO_COLORS[t.tipo] || '#64748b' }} />
                          <span className="text-stone-600 text-xs truncate flex-1">{t.tipo}</span>
                          <span className="text-stone-900 text-xs font-semibold">{t.total}</span>
                        </div>
                        <p className="text-stone-400 text-[10px] ml-[18px]">{formatSoles(Number(t.ingresos))}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Row 4: Hora de inscripción */}
      {a && horaChart.length > 0 && (
        <div>
          <SectionTitle>Hora de inscripción</SectionTitle>
          <div className={`${cx.card} p-5`}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={horaChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                <XAxis dataKey="hora" tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} allowDecimals={false} width={25} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="total" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} name="Inscripciones" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Row 5: Top implementos + Alumnos LTV */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Top implementos */}
        {a && a.topImplementos.length > 0 && (
          <div>
            <SectionTitle>Implementos más vendidos</SectionTitle>
            <div className={`${cx.card} p-5`}>
              <ResponsiveContainer width="100%" height={Math.max(160, a.topImplementos.length * 36)}>
                <BarChart data={a.topImplementos} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="tipo" tick={{ fontSize: 12, fill: '#57534e' }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: '#f5f5f4' }} />
                  <Bar dataKey="total" fill="#e8590c" radius={[0, 4, 4, 0]} barSize={18} name="Vendidos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Alumnos LTV */}
        {a && a.alumnosAntiguos.length > 0 && (
          <div>
            <SectionTitle>Top alumnos por valor (LTV)</SectionTitle>
            <div className={`${cx.card} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-100">
                      <th className={cx.th}>Alumno</th>
                      <th className={cx.th}>Desde</th>
                      <th className={cx.th}>Insc.</th>
                      <th className={cx.th + ' text-right'}>Total S/</th>
                    </tr>
                  </thead>
                  <tbody>
                    {a.alumnosAntiguos.map((al) => (
                      <tr key={al.id} className={cx.tr}>
                        <td className={cx.td}>
                          <p className="text-stone-900 font-medium text-xs">{al.nombre}</p>
                          <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${al.estado === 'activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-400'}`}>
                            {al.estado}
                          </span>
                        </td>
                        <td className={cx.td + ' text-stone-500 text-xs'}>{formatFechaCorta(al.primera_inscripcion)}</td>
                        <td className={cx.td + ' text-stone-500 text-xs text-center'}>{al.inscripciones_count}</td>
                        <td className={cx.td + ' text-right'}>
                          <span className="text-stone-900 text-xs font-bold">{formatSoles(Number(al.total_pagado))}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <SectionTitle>Acciones rapidas</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { page: 'graduaciones' as SpacePage, icon: GraduationCap, title: 'Graduaciones', sub: 'Gestionar evaluaciones', color: 'text-[#e8590c]' },
            { page: 'asistencia' as SpacePage, icon: ClipboardCheck, title: 'Asistencia', sub: 'Control del día', color: 'text-emerald-500' },
            { page: 'alumnos' as SpacePage, icon: TrendingUp, title: 'Alumnos', sub: 'Ver listado completo', color: 'text-sky-500' },
          ].map(({ page, icon: Icon, title, sub, color }) => (
            <button
              key={page}
              onClick={() => go(page)}
              className={`${cx.card} p-4 flex items-center gap-3 text-left hover:bg-stone-50 transition-colors group`}
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
          <SectionTitle>Últimas asistencias hoy</SectionTitle>
          <div className={`${cx.card} divide-y divide-stone-100`}>
            {stats.ultimasAsistencias.slice(0, 5).map((at, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <Clock size={14} className="text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-stone-900 text-sm truncate">{at.nombre_alumno}</p>
                </div>
                <span className="text-stone-400 text-xs shrink-0">{at.hora?.slice(0, 5)} · {at.turno}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
