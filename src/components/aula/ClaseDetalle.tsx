import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Check, Loader2, Send, Key } from 'lucide-react';
import { API_BASE } from '../../config/api';
import { VideoPlayer } from './VideoPlayer';
import { EnviarVideo } from './EnviarVideo';
import { InputCodigo } from './InputCodigo';

interface ClaseData {
  id: number;
  titulo: string;
  descripcion: string;
  instrucciones: string;
  youtube_id: string;
  orden: number;
  puntos: number;
  estado: string;
  feedback: string | null;
  video_alumno_url: string | null;
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar clase');
      setClase(data.clase || data);
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

  const estadoLabel = {
    bloqueado: { text: 'Bloqueada', icon: <Clock className="w-4 h-4" />, color: 'text-zinc-500' },
    disponible: { text: 'Disponible', icon: <Send className="w-4 h-4" />, color: 'text-[#FA7B21]' },
    video_enviado: { text: 'Video enviado - En revision', icon: <Clock className="w-4 h-4 animate-spin-slow" />, color: 'text-amber-400' },
    completado: { text: 'Completada', icon: <Check className="w-4 h-4" />, color: 'text-green-400' },
  }[clase.estado] || { text: clase.estado, icon: null, color: 'text-white/60' };

  const canSubmitVideo = clase.estado === 'disponible';
  const canUseCodigo = clase.estado === 'disponible' || clase.estado === 'bloqueado';

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
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
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6 pb-24">
        {/* Video */}
        <VideoPlayer youtubeId={clase.youtube_id} />

        {/* Title + Description */}
        <div>
          <h1 className="text-xl font-bold text-white mb-2">{clase.titulo}</h1>
          {clase.descripcion && (
            <p className="text-white/60 text-sm leading-relaxed">{clase.descripcion}</p>
          )}
        </div>

        {/* Instructions */}
        {clase.instrucciones && (
          <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
            <h3 className="text-white/80 font-semibold text-sm mb-2 flex items-center gap-2">
              Tu tarea:
            </h3>
            <p className="text-white/50 text-sm leading-relaxed whitespace-pre-line">
              {clase.instrucciones}
            </p>
          </div>
        )}

        {/* Status */}
        <div className={`flex items-center gap-2 ${estadoLabel.color}`}>
          {estadoLabel.icon}
          <span className="text-sm font-medium">{estadoLabel.text}</span>
        </div>

        {/* Feedback from teacher */}
        {clase.feedback && (
          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
            <h3 className="text-green-400 font-semibold text-sm mb-1">Feedback del profesor:</h3>
            <p className="text-white/70 text-sm leading-relaxed">{clase.feedback}</p>
          </div>
        )}

        {/* Action buttons */}
        {canSubmitVideo && !showEnviar && !showCodigo && (
          <button
            onClick={() => setShowEnviar(true)}
            className="h-14 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#FA7B21]/20"
          >
            <Send className="w-5 h-5" />
            Enviar mi video
          </button>
        )}

        {canUseCodigo && !showEnviar && !showCodigo && (
          <button
            onClick={() => setShowCodigo(true)}
            className="h-14 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Key className="w-5 h-5" />
            Tengo un codigo
          </button>
        )}

        {/* Inline forms */}
        {showEnviar && (
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Enviar video</h3>
              <button
                onClick={() => setShowEnviar(false)}
                className="text-white/40 hover:text-white text-sm"
              >
                Cancelar
              </button>
            </div>
            <EnviarVideo claseId={claseId} onSuccess={handleVideoSent} />
          </div>
        )}

        {showCodigo && (
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Codigo de desbloqueo</h3>
              <button
                onClick={() => setShowCodigo(false)}
                className="text-white/40 hover:text-white text-sm"
              >
                Cancelar
              </button>
            </div>
            <InputCodigo onSuccess={handleCodeSuccess} />
          </div>
        )}
      </div>
    </div>
  );
}
