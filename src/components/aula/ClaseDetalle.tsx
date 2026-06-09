import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Check, Loader2, Send, Key, BookOpen, AlertTriangle, Trophy } from 'lucide-react';
import { API_BASE } from '../../config/api';
import { VideoPlayer } from './VideoPlayer';
import { EnviarVideo } from './EnviarVideo';
import { InputCodigo } from './InputCodigo';

interface ClaseData {
  id: number;
  titulo: string;
  descripcion: string;
  instrucciones: string;
  video_youtube_id: string;
  duracion_minutos: number;
  orden: number;
  puntos: number;
  requiere_video: boolean;
  ruta_id: number;
  ruta_nombre: string;
  color_primario: string;
}

interface ProgresoData {
  estado: string;
  completado_at?: string;
  puntos_ganados?: number;
}

interface EnvioData {
  id: number;
  estado: string;
  feedback_profesor: string | null;
  created_at: string;
}

interface ClaseDetalleProps {
  claseId: number;
  rutaId: number;
  totalClases: number;
  onBack: () => void;
  onRefresh: () => void;
}

export function ClaseDetalle({ claseId, rutaId, totalClases, onBack, onRefresh }: ClaseDetalleProps) {
  const [clase, setClase] = useState<ClaseData | null>(null);
  const [progreso, setProgreso] = useState<ProgresoData | null>(null);
  const [envio, setEnvio] = useState<EnvioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEnviar, setShowEnviar] = useState(false);
  const [showCodigo, setShowCodigo] = useState(false);

  const fetchClase = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('amasToken');
      const res = await fetch(`${API_BASE}/clases/clase/${claseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al cargar clase');
      const data = json.data || json;
      setClase(data.clase);
      setProgreso(data.progreso || { estado: 'disponible' });
      setEnvio(data.envio || null);
      setError('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error de conexion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClase();
  }, [claseId]);

  const handleVideoSent = () => {
    setShowEnviar(false);
    fetchClase();
    onRefresh();
  };

  const handleCodeSuccess = () => {
    setShowCodigo(false);
    fetchClase();
    onRefresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#FA7B21] animate-spin" />
      </div>
    );
  }

  if (error || !clase) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-red-400 text-center">{error || 'Clase no encontrada'}</p>
        <button
          onClick={onBack}
          className="text-[#FA7B21] font-medium hover:underline"
        >
          Volver al mapa
        </button>
      </div>
    );
  }

  const estado = progreso?.estado || 'disponible';
  const canSubmitVideo = estado === 'disponible';
  const canUseCodigo = estado === 'disponible';
  const isVertical = clase.video_orientacion === 'vertical';

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors min-h-[44px] min-w-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Mapa</span>
          </button>
          <span className="text-white/40 text-sm font-medium">
            CLASE {clase.orden}/{totalClases}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className={`mx-auto px-4 py-6 pb-24 ${isVertical ? 'max-w-5xl' : 'max-w-2xl'}`}>

        {/* Completed celebration banner */}
        {estado === 'completado' && (
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-5 flex items-center gap-4 animate-fade-in mb-6">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-green-400 font-bold text-sm">Clase completada!</h3>
              <p className="text-green-400/60 text-xs mt-0.5">
                {progreso?.puntos_ganados ? `+${progreso.puntos_ganados} puntos ganados` : 'Buen trabajo, guerrero!'}
              </p>
            </div>
          </div>
        )}

        {/* Layout: vertical video = 2 cols on desktop, horizontal = single col */}
        <div className={isVertical
          ? 'grid grid-cols-1 lg:grid-cols-[minmax(280px,400px)_1fr] gap-6 items-start'
          : 'flex flex-col gap-6'
        }>
          {/* LEFT: Video + title */}
          <div className={isVertical ? 'lg:sticky lg:top-20' : ''}>
            <div className="rounded-2xl overflow-hidden border border-white/5 shadow-lg shadow-black/20">
              <VideoPlayer youtubeId={clase.video_youtube_id} videoUrl={clase.video_url} orientacion={clase.video_orientacion} />
            </div>
            <div className="mt-4">
              <h1 className="text-xl font-bold text-white">{clase.titulo}</h1>
              {clase.descripcion && (
                <p className="text-white/60 text-sm leading-relaxed mt-2">{clase.descripcion}</p>
              )}
            </div>
          </div>

          {/* RIGHT: Everything else */}
          <div className="flex flex-col gap-5">
            {/* Instructions */}
            {clase.instrucciones && (
              <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-5">
                <h3 className="text-white/80 font-semibold text-sm mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#FA7B21]" />
                  Tu tarea:
                </h3>
                <p className="text-white/50 text-sm leading-relaxed whitespace-pre-line">
                  {clase.instrucciones}
                </p>
              </div>
            )}
            {/* --- All remaining content goes in right column --- */}

        {/* Status section */}
        <div className="rounded-2xl overflow-hidden">
          {estado === 'video_enviado' && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-amber-400 animate-spin-slow" />
              </div>
              <div>
                <p className="text-amber-400 text-sm font-semibold">Esperando revision</p>
                <p className="text-amber-400/50 text-xs mt-0.5">Tu profesor revisara tu video pronto</p>
              </div>
            </div>
          )}

          {estado === 'disponible' && (
            <div className="flex items-center gap-2 text-[#FA7B21]">
              <Send className="w-4 h-4" />
              <span className="text-sm font-medium">Disponible — completa tu tarea!</span>
            </div>
          )}

          {estado === 'rechazado' && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-red-400 text-sm font-semibold">Necesita mejorar</p>
                <p className="text-red-400/50 text-xs mt-0.5">Lee el feedback de tu profesor y vuelve a intentar</p>
              </div>
            </div>
          )}
        </div>

        {/* Teacher feedback */}
        {envio?.feedback_profesor && (
          <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-5">
            <h3 className="text-green-400 font-semibold text-sm mb-2 flex items-center gap-2">
              <Check className="w-4 h-4" />
              Feedback del profesor:
            </h3>
            <p className="text-white/70 text-sm leading-relaxed">{envio.feedback_profesor}</p>
          </div>
        )}

        {/* Action buttons — visually distinct */}
        {canSubmitVideo && !showEnviar && !showCodigo && (
          <button
            onClick={() => setShowEnviar(true)}
            className="h-14 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#FA7B21]/20"
          >
            <Send className="w-5 h-5" />
            Enviar mi video
          </button>
        )}

        {canUseCodigo && !showEnviar && !showCodigo && (
          <button
            onClick={() => setShowCodigo(true)}
            className="h-14 bg-zinc-800/80 hover:bg-zinc-700 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] border border-white/5"
          >
            <Key className="w-5 h-5 text-[#FCA929]" />
            Tengo un codigo
          </button>
        )}

        {/* Inline forms — visually distinct containers */}
        {showEnviar && (
          <div className="bg-zinc-900 border border-[#FA7B21]/20 rounded-2xl p-5 shadow-lg shadow-[#FA7B21]/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Send className="w-4 h-4 text-[#FA7B21]" />
                Enviar video
              </h3>
              <button
                onClick={() => setShowEnviar(false)}
                className="text-white/40 hover:text-white text-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                Cancelar
              </button>
            </div>
            <EnviarVideo claseId={claseId} onSuccess={handleVideoSent} />
          </div>
        )}

        {showCodigo && (
          <div className="bg-zinc-900 border border-[#FCA929]/20 rounded-2xl p-5 shadow-lg shadow-[#FCA929]/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Key className="w-4 h-4 text-[#FCA929]" />
                Codigo de desbloqueo
              </h3>
              <button
                onClick={() => setShowCodigo(false)}
                className="text-white/40 hover:text-white text-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                Cancelar
              </button>
            </div>
            <InputCodigo onSuccess={handleCodeSuccess} />
          </div>
        )}

          </div>{/* close right column */}
        </div>{/* close grid/flex layout */}
      </div>{/* close max-w container */}
    </div>
  );
}
