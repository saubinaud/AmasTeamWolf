import { useState, useRef } from 'react';
import { Upload, Loader2, Check, X } from 'lucide-react';
import { API_BASE } from '../../config/api';

interface EnviarVideoProps {
  claseId: number;
  onSuccess: () => void;
}

export function EnviarVideo({ claseId, onSuccess }: EnviarVideoProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 100 * 1024 * 1024) {
      setError('El video no puede pesar mas de 100MB');
      return;
    }

    setFile(selected);
    setError('');

    // Generate video thumbnail
    const url = URL.createObjectURL(selected);
    setPreview(url);
  };

  const clearFile = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);
    setError('');
    setProgress(0);

    try {
      // Simulate upload progress (real R2 upload will replace this)
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 15, 90));
      }, 300);

      const token = localStorage.getItem('amasToken');

      const formData = new FormData();
      formData.append('video', file);
      if (comentario.trim()) formData.append('comentario', comentario.trim());

      const res = await fetch(`${API_BASE}/clases/clase/${claseId}/enviar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || 'Error al enviar el video');
        setProgress(0);
      } else {
        setSuccess(true);
        setTimeout(() => onSuccess(), 1500);
      }
    } catch {
      setError('Error de conexion');
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
          <Check className="w-8 h-8 text-green-400" />
        </div>
        <p className="text-green-400 font-semibold text-center">Video enviado! Tu profesor lo revisara pronto.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!file ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="h-32 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 text-white/40 hover:text-white/60 hover:border-white/20 transition-all active:scale-[0.98]"
        >
          <Upload className="w-8 h-8" />
          <span className="text-sm font-medium">Toca para grabar o seleccionar video</span>
        </button>
      ) : (
        <div className="relative rounded-xl overflow-hidden bg-zinc-900 border border-white/10">
          {preview && (
            <video
              src={preview}
              className="w-full aspect-video object-cover"
              muted
              playsInline
            />
          )}
          <button
            onClick={clearFile}
            className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <div className="p-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-white/60 text-xs truncate">{file.name}</span>
            <span className="text-white/40 text-xs ml-auto">
              {(file.size / (1024 * 1024)).toFixed(1)} MB
            </span>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <textarea
        value={comentario}
        onChange={e => setComentario(e.target.value)}
        placeholder="Comentario para tu profesor (opcional)"
        rows={2}
        className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none placeholder:text-white/20 resize-none focus:border-[#FA7B21]/50 transition-colors"
      />

      {progress > 0 && progress < 100 && (
        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#FA7B21] to-[#FCA929] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && <p className="text-red-400 text-sm px-1">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!file || loading}
        className="h-14 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-[#FA7B21]/20"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Upload className="w-5 h-5" />
            Enviar mi video
          </>
        )}
      </button>
    </div>
  );
}
