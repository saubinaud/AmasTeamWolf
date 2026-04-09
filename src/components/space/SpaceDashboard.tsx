import { useState, useEffect, useMemo, useCallback } from 'react';
import { Users, ClipboardList, CalendarCheck, UserPlus, GraduationCap, ClipboardCheck, Download } from 'lucide-react';
import { API_BASE } from '../../config/api';
import { cx, badgeColors } from './tokens';
import type { SpacePage } from './SpaceApp';

// ── Types ──

interface Stats {
  alumnosActivos: number;
  inscripcionesActivas: number;
  asistenciasHoy: number;
  leadsNuevos: number;
}

interface Props {
  token: string;
  userName?: string;
  onNavigate?: (page: SpacePage) => void;
}

// ── Component ──

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
      { id: 'al', label: 'Alumnos activos', value: stats.alumnosActivos, icon: Users, color: badgeColors.blue },
      { id: 'in', label: 'Inscripciones', value: stats.inscripcionesActivas, icon: ClipboardList, color: badgeColors.green },
      { id: 'as', label: 'Asistencias hoy', value: stats.asistenciasHoy, icon: CalendarCheck, color: badgeColors.orange },
      { id: 'le', label: 'Leads nuevos', value: stats.leadsNuevos, icon: UserPlus, color: badgeColors.violet },
    ];
  }, [stats]);

  const go = useCallback((page: SpacePage) => onNavigate?.(page), [onNavigate]);

  // Loading
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {['s1','s2','s3','s4'].map(k => (
          <div key={k} className={`${cx.card} h-24 ${cx.skeleton}`} />
        ))}
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className={`${cx.card} p-6 text-center`}>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      {userName && (
        <div>
          <h2 className="text-white text-lg font-semibold">Bienvenido, {userName}</h2>
          <p className="text-white/30 text-sm mt-0.5">
            {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(({ id, label, value, icon: Icon, color }) => (
          <div key={id} className={`${cx.card} p-4`}>
            <div className={`w-9 h-9 rounded-lg ${color.split(' ')[0]} flex items-center justify-center mb-3`}>
              <Icon size={18} className={color.split(' ')[1]} />
            </div>
            <p className="text-white text-2xl font-bold leading-none">{value}</p>
            <p className="text-white/40 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-white/30 text-xs uppercase tracking-wider font-medium mb-3">Acciones rapidas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { page: 'graduaciones' as SpacePage, icon: GraduationCap, title: 'Graduaciones', sub: 'Gestionar evaluaciones' },
            { page: 'asistencia' as SpacePage, icon: ClipboardCheck, title: 'Asistencia hoy', sub: 'Control diario' },
            { page: 'alumnos' as SpacePage, icon: Download, title: 'Exportar datos', sub: 'Descargar reportes' },
          ].map(({ page, icon: Icon, title, sub }) => (
            <button key={page} onClick={() => go(page)}
              className={`${cx.card} p-4 flex items-center gap-3 text-left hover:bg-zinc-800/80 transition-colors`}>
              <Icon size={18} className="text-white/30 shrink-0" />
              <div className="min-w-0">
                <p className="text-white text-sm font-medium">{title}</p>
                <p className="text-white/30 text-xs">{sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
