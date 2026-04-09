import { useState, useEffect, useMemo, useCallback } from 'react';
import { Users, ClipboardList, CalendarCheck, UserPlus, GraduationCap, ClipboardCheck, Download } from 'lucide-react';
import { API_BASE } from '../../config/api';

interface DashboardStats {
  alumnosActivos: number;
  inscripcionesActivas: number;
  asistenciasHoy: number;
  leadsNuevos: number;
}

interface SpaceDashboardProps {
  token: string;
  userName?: string;
  onNavigate?: (page: string) => void;
}

const STAT_CARD_COLORS = {
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    leftBorder: 'border-l-blue-500',
    icon: 'text-blue-400',
    accent: 'bg-blue-500/20',
  },
  green: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    leftBorder: 'border-l-emerald-500',
    icon: 'text-emerald-400',
    accent: 'bg-emerald-500/20',
  },
  orange: {
    bg: 'bg-[#FA7B21]/10',
    border: 'border-[#FA7B21]/20',
    leftBorder: 'border-l-[#FA7B21]',
    icon: 'text-[#FA7B21]',
    accent: 'bg-[#FA7B21]/20',
  },
  violet: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    leftBorder: 'border-l-violet-500',
    icon: 'text-violet-400',
    accent: 'bg-violet-500/20',
  },
} as const;

type CardColor = keyof typeof STAT_CARD_COLORS;

function formatDate(): string {
  return new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTimestamp(): string {
  return new Date().toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const SKELETON_KEYS = ['sk-1', 'sk-2', 'sk-3', 'sk-4'] as const;

export function SpaceDashboard({ token, userName, onNavigate }: SpaceDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/space/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.stats) {
          setStats(d.stats);
          setLastUpdated(formatTimestamp());
        } else {
          setError('No se pudieron cargar las estadisticas');
        }
      })
      .catch(() => setError('Error de conexion'))
      .finally(() => setLoading(false));
  }, [token]);

  const cards = useMemo(() => {
    if (!stats) return [];
    return [
      { id: 'alumnos', label: 'Alumnos activos', value: stats.alumnosActivos, icon: Users, color: 'blue' as CardColor },
      { id: 'inscripciones', label: 'Inscripciones activas', value: stats.inscripcionesActivas, icon: ClipboardList, color: 'green' as CardColor },
      { id: 'asistencia', label: 'Asistencias hoy', value: stats.asistenciasHoy, icon: CalendarCheck, color: 'orange' as CardColor },
      { id: 'leads', label: 'Leads nuevos', value: stats.leadsNuevos, icon: UserPlus, color: 'violet' as CardColor },
    ];
  }, [stats]);

  const todayFormatted = useMemo(() => formatDate(), []);

  const handleQuickAction = useCallback((page: string) => {
    onNavigate?.(page);
  }, [onNavigate]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Welcome skeleton */}
        <div className="h-24 bg-white/5 rounded-2xl animate-pulse" />
        {/* Stat card skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SKELETON_KEYS.map(key => (
            <div key={key} className="h-28 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-[#FA7B21]/5 border border-[#FA7B21]/10 rounded-2xl p-6">
        <h2 className="text-white text-xl font-bold mb-1">
          Bienvenido{userName ? `, ${userName}` : ''}
        </h2>
        <p className="text-white/40 text-sm capitalize">{todayFormatted}</p>
        {stats && (
          <div className="flex gap-6 mt-3 text-sm">
            <span className="text-white/50">
              <span className="text-white font-semibold">{stats.alumnosActivos}</span> alumnos
            </span>
            <span className="text-white/50">
              <span className="text-white font-semibold">{stats.asistenciasHoy}</span> asistencias hoy
            </span>
            <span className="text-white/50">
              <span className="text-white font-semibold">{stats.leadsNuevos}</span> leads nuevos
            </span>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map(({ id, label, value, icon: Icon, color }) => {
          const c = STAT_CARD_COLORS[color];
          return (
            <div
              key={id}
              className={`${c.bg} border ${c.border} border-l-4 ${c.leftBorder} rounded-2xl p-5 flex items-center gap-4`}
            >
              <div className={`${c.accent} rounded-xl w-12 h-12 flex items-center justify-center shrink-0`}>
                <Icon size={22} className={c.icon} />
              </div>
              <div>
                <p className="text-white text-2xl font-bold">{value}</p>
                <p className="text-white/50 text-sm">{label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Last updated */}
      {lastUpdated && (
        <p className="text-white/20 text-xs text-right">
          Ultima actualizacion: {lastUpdated}
        </p>
      )}

      {/* Quick actions */}
      <div>
        <h3 className="text-white/50 text-xs uppercase tracking-wider font-medium mb-3">Acciones rapidas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleQuickAction('graduaciones')}
            className="flex items-center gap-3 p-4 bg-white/[0.03] border border-white/10 rounded-xl hover:bg-white/[0.06] hover:border-white/15 transition-colors duration-150 text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-[#FA7B21]/10 flex items-center justify-center shrink-0">
              <GraduationCap size={18} className="text-[#FA7B21]" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Nueva graduacion</p>
              <p className="text-white/30 text-xs">Programar evaluacion</p>
            </div>
          </button>
          <button
            onClick={() => handleQuickAction('asistencia')}
            className="flex items-center gap-3 p-4 bg-white/[0.03] border border-white/10 rounded-xl hover:bg-white/[0.06] hover:border-white/15 transition-colors duration-150 text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <ClipboardCheck size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Ver asistencia hoy</p>
              <p className="text-white/30 text-xs">Control diario</p>
            </div>
          </button>
          <button
            onClick={() => handleQuickAction('alumnos')}
            className="flex items-center gap-3 p-4 bg-white/[0.03] border border-white/10 rounded-xl hover:bg-white/[0.06] hover:border-white/15 transition-colors duration-150 text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Download size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Exportar datos</p>
              <p className="text-white/30 text-xs">Descargar reportes</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
