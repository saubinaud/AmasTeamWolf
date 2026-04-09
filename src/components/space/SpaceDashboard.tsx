import { useState, useEffect, useMemo, useCallback } from 'react';
import { Users, ClipboardList, CalendarCheck, UserPlus, GraduationCap, ClipboardCheck, Download } from 'lucide-react';
import { API_BASE } from '../../config/api';
import type { SpacePage } from './SpaceApp';

interface DashboardStats {
  alumnosActivos: number;
  inscripcionesActivas: number;
  asistenciasHoy: number;
  leadsNuevos: number;
}

interface SpaceDashboardProps {
  token: string;
  userName?: string;
  onNavigate?: (page: SpacePage) => void;
}

interface StatCard {
  id: string;
  label: string;
  value: number;
  icon: typeof Users;
  color: string;
  iconColor: string;
}

const SKELETON_KEYS = ['sk-1', 'sk-2', 'sk-3', 'sk-4'] as const;

export function SpaceDashboard({ token, userName, onNavigate }: SpaceDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
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

  const cards: StatCard[] = useMemo(() => {
    if (!stats) return [];
    return [
      { id: 'alumnos', label: 'Alumnos activos', value: stats.alumnosActivos, icon: Users, color: 'bg-blue-500/10', iconColor: 'text-blue-400' },
      { id: 'inscripciones', label: 'Inscripciones activas', value: stats.inscripcionesActivas, icon: ClipboardList, color: 'bg-emerald-500/10', iconColor: 'text-emerald-400' },
      { id: 'asistencia', label: 'Asistencias hoy', value: stats.asistenciasHoy, icon: CalendarCheck, color: 'bg-[#FA7B21]/10', iconColor: 'text-[#FA7B21]' },
      { id: 'leads', label: 'Leads nuevos', value: stats.leadsNuevos, icon: UserPlus, color: 'bg-violet-500/10', iconColor: 'text-violet-400' },
    ];
  }, [stats]);

  const handleNavigate = useCallback((page: SpacePage) => {
    onNavigate?.(page);
  }, [onNavigate]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {SKELETON_KEYS.map(key => (
          <div key={key} className="bg-zinc-900 rounded-xl p-5 h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-zinc-900 rounded-xl p-6 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {userName && (
        <h2 className="text-white text-lg font-semibold">
          Bienvenido, {userName}
        </h2>
      )}

      <div className="grid grid-cols-2 gap-4">
        {cards.map(({ id, label, value, icon: Icon, color, iconColor }) => (
          <div key={id} className="bg-zinc-900 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className={`${color} rounded-lg w-10 h-10 flex items-center justify-center shrink-0`}>
                <Icon size={20} className={iconColor} />
              </div>
              <div className="min-w-0">
                <p className="text-white text-2xl font-bold">{value}</p>
                <p className="text-white/50 text-sm">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-white/40 text-xs uppercase tracking-wider font-medium mb-3">Acciones rapidas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleNavigate('graduaciones')}
            className="flex items-center gap-3 bg-zinc-900 rounded-xl p-4 text-left hover:bg-zinc-800 transition-colors"
          >
            <GraduationCap size={18} className="text-white/40 shrink-0" />
            <div>
              <p className="text-white text-sm font-medium">Nueva graduacion</p>
              <p className="text-white/30 text-xs">Programar evaluacion</p>
            </div>
          </button>
          <button
            onClick={() => handleNavigate('asistencia')}
            className="flex items-center gap-3 bg-zinc-900 rounded-xl p-4 text-left hover:bg-zinc-800 transition-colors"
          >
            <ClipboardCheck size={18} className="text-white/40 shrink-0" />
            <div>
              <p className="text-white text-sm font-medium">Ver asistencia hoy</p>
              <p className="text-white/30 text-xs">Control diario</p>
            </div>
          </button>
          <button
            onClick={() => handleNavigate('alumnos')}
            className="flex items-center gap-3 bg-zinc-900 rounded-xl p-4 text-left hover:bg-zinc-800 transition-colors"
          >
            <Download size={18} className="text-white/40 shrink-0" />
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
