import { useState, useEffect } from 'react';
import { Users, ClipboardList, CalendarCheck, UserPlus } from 'lucide-react';
import { API_BASE } from '../../config/api';

interface DashboardStats {
  alumnosActivos: number;
  inscripcionesActivas: number;
  asistenciasHoy: number;
  leadsNuevos: number;
}

interface SpaceDashboardProps {
  token: string;
}

export function SpaceDashboard({ token }: SpaceDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/space/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.stats) {
          setStats(d.stats);
        } else {
          setError('No se pudieron cargar las estadisticas');
        }
      })
      .catch(() => setError('Error de conexion'))
      .finally(() => setLoading(false));
  }, [token]);

  const cards = [
    {
      label: 'Alumnos activos',
      value: stats?.alumnosActivos ?? 0,
      icon: Users,
      color: 'blue' as const,
    },
    {
      label: 'Inscripciones activas',
      value: stats?.inscripcionesActivas ?? 0,
      icon: ClipboardList,
      color: 'green' as const,
    },
    {
      label: 'Asistencias hoy',
      value: stats?.asistenciasHoy ?? 0,
      icon: CalendarCheck,
      color: 'orange' as const,
    },
    {
      label: 'Leads nuevos',
      value: stats?.leadsNuevos ?? 0,
      icon: UserPlus,
      color: 'violet' as const,
    },
  ];

  const colorMap = {
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      icon: 'text-blue-400',
      accent: 'bg-blue-500/20',
    },
    green: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      icon: 'text-emerald-400',
      accent: 'bg-emerald-500/20',
    },
    orange: {
      bg: 'bg-[#FA7B21]/10',
      border: 'border-[#FA7B21]/20',
      icon: 'text-[#FA7B21]',
      accent: 'bg-[#FA7B21]/20',
    },
    violet: {
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20',
      icon: 'text-violet-400',
      accent: 'bg-violet-500/20',
    },
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />
        ))}
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
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => {
          const c = colorMap[color];
          return (
            <div
              key={label}
              className={`${c.bg} border ${c.border} rounded-2xl p-5 flex items-center gap-4`}
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

      {/* Welcome message */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <p className="text-white/70 text-sm">
          Bienvenido al panel de administracion SPACE. Desde aqui podras gestionar la academia, revisar estadisticas y controlar todas las operaciones.
        </p>
      </div>
    </div>
  );
}
