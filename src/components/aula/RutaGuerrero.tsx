import { useState, useEffect } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { Loader2, LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE } from '../../config/api';
import { MisRutas } from './MisRutas';
import { MapaAventura } from './MapaAventura';
import { ClaseDetalle } from './ClaseDetalle';

interface RutaResumen {
  id: number;
  nombre: string;
  color: string;
  cinturon: string;
  mundo_id?: number | null;
  mundo_nombre?: string | null;
  mundo_color?: string | null;
  progreso: { completadas: number; total: number; puntos: number };
}

export function RutaGuerrero() {
  const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth();
  const params = useParams<{ rutaId?: string; claseId?: string }>();
  const navigate = useNavigate();

  const [rutas, setRutas] = useState<RutaResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const rutaId = params.rutaId ? Number(params.rutaId) : null;
  const claseId = params.claseId ? Number(params.claseId) : null;

  const fetchRutas = async () => {
    try {
      const token = localStorage.getItem('amasToken');
      const res = await fetch(`${API_BASE}/clases/mis-rutas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al cargar rutas');
      // API returns { success, data: [...] } — map to RutaResumen format
      const rawRutas = json.data || json.rutas || [];
      setRutas(rawRutas.map((r: Record<string, unknown>) => ({
        id: r.id as number,
        nombre: r.nombre as string,
        color: (r.color_primario as string) || '#FA7B21',
        cinturon: (r.cinturon_asociado as string) || '',
        mundo_id: r.mundo_id as number | null,
        mundo_nombre: r.mundo_nombre as string | null,
        mundo_color: r.mundo_color as string | null,
        progreso: {
          completadas: Number(r.clases_completadas) || 0,
          total: Number(r.total_clases) || 0,
          puntos: Number(r.puntos_totales) || 0,
        },
      })));
      setError('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error de conexion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchRutas();
  }, [isAuthenticated]);

  // Auto-redirect if only 1 ruta and no rutaId in URL
  useEffect(() => {
    if (!loading && rutas.length === 1 && !rutaId) {
      navigate(`/clases/${rutas[0].id}`, { replace: true });
    }
  }, [loading, rutas, rutaId, navigate]);

  // Auth guard
  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#FA7B21] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/inicio-sesion?redirect=clases" replace />;
  }

  // Loading rutas
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-[#FA7B21] animate-spin" />
          <p className="text-white/40 text-sm">Cargando tu ruta...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-red-400 text-center">{error}</p>
        <button
          onClick={() => { setLoading(true); fetchRutas(); }}
          className="px-6 py-3 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white font-semibold rounded-xl active:scale-95 transition-all"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // User bar component (reusable)
  const userName = user?.alumno_nombre || user?.nombre_alumno || 'Alumno';
  const UserBar = () => (
    <div className="bg-zinc-950 border-b border-white/5 px-4 py-3">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-[#FA7B21]/15 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-[#FA7B21]" />
          </div>
          <div className="min-w-0">
            <p className="text-white/80 text-sm font-medium truncate">{userName}</p>
            <p className="text-white/30 text-[11px]">Ruta del Guerrero</p>
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/inicio-sesion'); }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors text-xs">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </div>
  );

  if (rutas.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <UserBar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          <p className="text-white/60 text-center">No tienes rutas asignadas todavia.</p>
          <button onClick={() => navigate('/')} className="text-[#FA7B21] font-medium hover:underline">
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // Find total clases for the selected ruta
  const selectedRuta = rutas.find(r => r.id === rutaId);
  const totalClases = selectedRuta?.progreso.total || 0;

  // Route: /clases/:rutaId/:claseId → ClaseDetalle
  if (rutaId && claseId) {
    return (
      <ClaseDetalle
        claseId={claseId}
        rutaId={rutaId}
        totalClases={totalClases}
        onBack={() => navigate(`/clases/${rutaId}`)}
        onRefresh={fetchRutas}
      />
    );
  }

  // Route: /clases/:rutaId → MapaAventura
  if (rutaId) {
    return (
      <MapaAventura
        rutaId={rutaId}
        onSelectClase={(id) => navigate(`/clases/${rutaId}/${id}`)}
        onBack={() => rutas.length > 1 ? navigate('/clases') : navigate('/')}
      />
    );
  }

  // Route: /clases → MisRutas (list)
  return (
    <div className="min-h-screen bg-zinc-950">
      <UserBar />
      <MisRutas
        rutas={rutas}
        onSelectRuta={(id) => navigate(`/clases/${id}`)}
      />
    </div>
  );
}
