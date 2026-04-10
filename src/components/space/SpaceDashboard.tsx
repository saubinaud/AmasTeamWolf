import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users, ClipboardList, CalendarCheck, UserPlus,
  GraduationCap, ClipboardCheck, Download, TrendingUp, AlertTriangle,
  ArrowRight, Clock,
} from 'lucide-react';
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

export function SpaceDashboard({ token, userName, onNavigate }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/space/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.stats) setStats(d.stats);
        else setError('No se pudieron cargar las estadisticas');
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

  const today = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-zinc-800 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(k => <div key={k} className="h-28 bg-zinc-800 rounded-2xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1,2,3].map(k => <div key={k} className="h-20 bg-zinc-800 rounded-2xl animate-pulse" />)}
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FA7B21]/10 via-zinc-900/80 to-zinc-900/60 border border-[#FA7B21]/10 p-5 sm:p-6">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#FA7B21]/10 rounded-full blur-3xl" />
        <div className="relative">
          <h2 className="text-white text-lg sm:text-xl font-bold">
            Hola, {userName || 'Admin'} 👋
          </h2>
          <p className="text-zinc-500 text-sm mt-1 capitalize">{today}</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(({ id, label, value, icon: Icon, gradient }) => (
          <div
            key={id}
            className={`relative overflow-hidden bg-gradient-to-br ${gradient.bg} border ${gradient.border} rounded-2xl p-4 sm:p-5 transition-all duration-200 hover:scale-[1.02]`}
          >
            <div className={`w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center mb-3`}>
              <Icon size={18} className={gradient.icon} />
            </div>
            <p className={`text-3xl font-bold ${gradient.text} leading-none`}>
              <AnimatedNumber value={value} />
            </p>
            <p className="text-zinc-500 text-xs mt-1.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Alert: inscripciones por vencer */}
      {stats?.inscripcionesPorVencer != null && stats.inscripcionesPorVencer > 0 && (
        <button
          onClick={() => go('inscripciones')}
          className="w-full flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/15 rounded-2xl text-left hover:bg-amber-500/15 transition-all duration-200 group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-amber-300 text-sm font-medium">
              {stats.inscripcionesPorVencer} inscripciones por vencer esta semana
            </p>
            <p className="text-amber-400/40 text-xs mt-0.5">Click para ver detalle</p>
          </div>
          <ArrowRight size={16} className="text-amber-400/40 group-hover:text-amber-400 transition-colors shrink-0" />
        </button>
      )}

      {/* Quick actions */}
      <div>
        <h3 className="text-zinc-600 text-[10px] uppercase tracking-widest font-medium mb-3">Acciones rapidas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { page: 'graduaciones' as SpacePage, icon: GraduationCap, title: 'Graduaciones', sub: 'Gestionar evaluaciones', color: 'text-[#FA7B21]' },
            { page: 'asistencia' as SpacePage, icon: ClipboardCheck, title: 'Asistencia', sub: 'Control del dia', color: 'text-emerald-400' },
            { page: 'alumnos' as SpacePage, icon: TrendingUp, title: 'Alumnos', sub: 'Ver listado completo', color: 'text-sky-400' },
          ].map(({ page, icon: Icon, title, sub, color }) => (
            <button
              key={page}
              onClick={() => go(page)}
              className={`${cx.card} p-4 flex items-center gap-3 text-left hover:bg-zinc-800 hover:border-zinc-700 transition-all duration-200 group`}
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                <Icon size={18} className={color} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-medium">{title}</p>
                <p className="text-white/25 text-xs mt-0.5">{sub}</p>
              </div>
              <ArrowRight size={14} className="text-zinc-700 group-hover:text-zinc-500 transition-colors shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Recent attendance */}
      {stats?.ultimasAsistencias && stats.ultimasAsistencias.length > 0 && (
        <div>
          <h3 className="text-zinc-600 text-[10px] uppercase tracking-widest font-medium mb-3">Ultimas asistencias</h3>
          <div className={`${cx.card} divide-y divide-zinc-800`}>
            {stats.ultimasAsistencias.slice(0, 5).map((a, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Clock size={14} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{a.nombre_alumno}</p>
                </div>
                <span className="text-zinc-500 text-xs shrink-0">{a.hora?.slice(0, 5)} · {a.turno}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
