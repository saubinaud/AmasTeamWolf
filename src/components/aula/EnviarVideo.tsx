import { useState, useRef } from 'react';
import { Video, Loader2, Check, X } from 'lucide-react';
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith('video/')) {
      setError('Por favor selecciona un archivo de video');
      return;
    }

    if (selected.size > 100 * 1024 * 1024) {
      setError('El video no puede pesar mas de 100MB');
      return;
    }

    setFile(selected);
    setError('');
    setPreview(URL.createObjectURL(selected));
  };

  const clearFile = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleSubmit = () => {
    if (!file || loading) return;

    setLoading(true);
    setError('');
    setUploadProgress(0);

    const token = localStorage.getItem('amasToken');
    const formData = new FormData();
    formData.append('video', file);
    if (comentario.trim()) formData.append('comentario', comentario.trim());

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/clases/clase/${claseId}/upload-video`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      setLoading(false);
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status === 200 && data.success) {
          setSuccess(true);
          setTimeout(() => onSuccess(), 1500);
        } else {
          setError(data.error || 'Error al subir el video');
        }
      } catch {
        setError('Error procesando respuesta');
      }
    };

    xhr.onerror = () => {
      setLoading(false);
      setError('Error de conexion. Verifica tu internet e intenta de nuevo.');
    };

    xhr.send(formData);
  };

  // --- Success state ---
  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
          <Check className="w-8 h-8 text-green-400" />
        </div>
        <p className="text-green-400 font-semibold text-center">
          Video enviado! Tu profesor lo revisara pronto 🐺
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Hidden file input - opens camera on mobile */}
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* No file selected yet */}
      {!file && (
        <button
          onClick={() => inputRef.current?.click()}
          className="h-36 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 text-white/40 hover:text-white/60 hover:border-[#FA7B21]/30 transition-all active:scale-[0.98]"
        >
          <div className="w-14 h-14 rounded-full bg-[#FA7B21]/10 flex items-center justify-center">
            <Video className="w-7 h-7 text-[#FA7B21]" />
          </div>
          <div className="text-center">
            <span className="text-sm font-medium text-white/60 block">Grabar o seleccionar video</span>
            <span className="text-[11px] text-white/30">Max 100MB</span>
          </div>
        </button>
      )}

      {/* File selected - show preview */}
      {file && (
        <div className="relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/10">
          {preview && (
            <video
              src={preview}
              className="w-full aspect-video object-cover"
              controls
              playsInline
            />
          )}
          <button
            onClick={clearFile}
            disabled={loading}
            className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors disabled:opacity-30"
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

      {/* Upload progress */}
      {loading && (
        <div className="space-y-2">
          <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] h-3 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-white/40 text-xs text-center">
            {uploadProgress < 100
              ? `Subiendo... ${uploadProgress}%`
              : 'Procesando...'}
          </p>
        </div>
      )}

      {/* Optional comment */}
      {file && !loading && (
        <textarea
          value={comentario}
          onChange={e => setComentario(e.target.value)}
          placeholder="Comentario para tu profesor (opcional)"
          rows={2}
          className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none placeholder:text-white/20 resize-none focus:border-[#FA7B21]/50 transition-colors"
        />
      )}

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      {/* Submit button */}
      {file && !loading && (
        <button
          onClick={handleSubmit}
          className="w-full h-14 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#FA7B21]/20"
        >
          <Video className="w-5 h-5" />
          Enviar video a mi profesor
        </button>
      )}

      {loading && (
        <p className="text-white/30 text-[11px] text-center">
          No cierres la app mientras se sube el video
        </p>
      )}
    </div>
  );
}
