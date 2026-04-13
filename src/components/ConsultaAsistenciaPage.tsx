import React, { useState } from 'react';
import { Search, User, Award, BookOpen, CheckCircle, XCircle, Clock, ArrowLeft, Loader2 } from 'lucide-react';

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '/api'
  : 'https://amas-api.s6hx3x.easypanel.host/api';

interface Asistencia {
  fecha: string;
  turno: string;
  asistio: 'Sí' | 'No' | 'Tardanza';
}

interface ConsultaData {
  nombre_alumno: string;
  cinturon_actual: string;
  programa: string | null;
  clases_totales: number;
  clases_asistidas: number;
  clases_restantes: number;
  estado: string;
  asistencias: Asistencia[];
}

interface ConsultaAsistenciaPageProps {
  onNavigate: (page: string) => void;
}

const BELT_COLORS: Record<string, string> = {
  'Blanco': '#FFFFFF',
  'Amarillo': '#FFD700',
  'Verde': '#22C55E',
  'Azul': '#3B82F6',
  'Rojo': '#EF4444',
  'Negro': '#000000',
};

function formatFechaLima(fechaStr: string): string {
  try {
    // fecha comes as YYYY-MM-DD from Postgres
    const [y, m, d] = fechaStr.split('T')[0].split('-').map(Number);
    const date = new Date(y, m - 1, d, 12, 0, 0); // noon to avoid TZ shifts
    return date.toLocaleDateString('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return fechaStr;
  }
}

function AsistenciaBadge({ asistio }: { asistio: string }) {
  if (asistio === 'Sí') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
        <CheckCircle className="w-3 h-3" />
        Presente
      </span>
    );
  }
  if (asistio === 'Tardanza') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
        <Clock className="w-3 h-3" />
        Tardanza
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
      <XCircle className="w-3 h-3" />
      Falta
    </span>
  );
}

export function ConsultaAsistenciaPage({ onNavigate }: ConsultaAsistenciaPageProps) {
  const [dni, setDni] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ConsultaData | null>(null);

  const handleSearch = async () => {
    const dniClean = dni.replace(/[\s\-.]/g, '').trim();
    if (!dniClean || dniClean.length < 4) {
      setError('Ingresa un DNI válido');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`${API_URL}/consulta-asistencia?dni=${encodeURIComponent(dniClean)}`);
      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'No se encontró el alumno');
      } else {
        setData(json.data);
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const progressPct = data && data.clases_totales > 0
    ? Math.min(100, Math.round((data.clases_asistidas / data.clases_totales) * 100))
    : 0;

  const beltColor = data ? (BELT_COLORS[data.cinturon_actual] || '#FFFFFF') : '#FFFFFF';

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-950 border-b border-zinc-800">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 -ml-2 rounded-lg hover:bg-zinc-800 transition-colors"
            aria-label="Volver al inicio"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold">Consulta de Asistencia</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#FA7B21]/10 border border-[#FA7B21]/20 mb-4">
            <BookOpen className="w-8 h-8 text-[#FA7B21]" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Consulta tu asistencia</h2>
          <p className="text-zinc-400 text-sm">
            Ingresa el DNI del alumno para ver su registro de asistencias
          </p>
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              inputMode="numeric"
              placeholder="DNI del alumno"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={15}
              style={{ fontSize: '16px' }}
              className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#FA7B21]/50 focus:border-[#FA7B21] transition-colors"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-5 py-3 bg-[#FA7B21] hover:bg-[#e06c1a] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors active:scale-95 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Buscar
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center mb-6">
            {error}
          </div>
        )}

        {/* Results */}
        {data && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Student Info Card */}
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                  <User className="w-6 h-6 text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold truncate">{data.nombre_alumno}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-4 h-4 rounded-full border-2 border-zinc-600"
                      style={{ backgroundColor: beltColor }}
                    />
                    <span className="text-sm text-zinc-400">Cinturón {data.cinturon_actual}</span>
                  </div>
                  {data.programa && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <Award className="w-4 h-4 text-[#FA7B21]" />
                      <span className="text-sm text-zinc-300">{data.programa}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Card */}
            {data.estado === 'activo' && data.clases_totales > 0 && (
              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-zinc-300">Progreso de clases</span>
                  <span className="text-sm font-bold text-[#FA7B21]">
                    {data.clases_asistidas} / {data.clases_totales}
                  </span>
                </div>
                <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${progressPct}%`,
                      background: 'linear-gradient(90deg, #FA7B21, #FCA929)',
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-zinc-500">{progressPct}% completado</span>
                  <span className="text-xs text-zinc-500">{data.clases_restantes} restantes</span>
                </div>
              </div>
            )}

            {data.estado === 'sin inscripción' && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-sm text-center">
                No tiene inscripción activa
              </div>
            )}

            {/* Attendance List */}
            {data.asistencias.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-zinc-800">
                  <h4 className="text-sm font-semibold text-zinc-300">
                    Historial de asistencias
                  </h4>
                </div>
                <div className="divide-y divide-zinc-800/50 max-h-[400px] overflow-y-auto">
                  {data.asistencias.map((a, i) => (
                    <div key={i} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {formatFechaLima(a.fecha)}
                        </p>
                        {a.turno && (
                          <p className="text-xs text-zinc-500 mt-0.5">{a.turno}</p>
                        )}
                      </div>
                      <AsistenciaBadge asistio={a.asistio} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.asistencias.length === 0 && (
              <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl text-center">
                <p className="text-zinc-500 text-sm">No hay asistencias registradas</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default ConsultaAsistenciaPage;
