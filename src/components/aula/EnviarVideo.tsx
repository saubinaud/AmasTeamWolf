import { useState, useRef } from 'react';
import { Upload, Loader2, Check, X, Link2, Video } from 'lucide-react';
import { API_BASE } from '../../config/api';

interface EnviarVideoProps {
  claseId: number;
  onSuccess: () => void;
}

type InputMode = 'select' | 'link' | 'file';

export function EnviarVideo({ claseId, onSuccess }: EnviarVideoProps) {
  const [mode, setMode] = useState<InputMode>('select');
  const [videoUrl, setVideoUrl] = useState('');
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

    if (selected.size > 100 * 1024 * 1024) {
      setError('El video no puede pesar mas de 100MB');
      return;
    }

    setFile(selected);
    setError('');

    const url = URL.createObjectURL(selected);
    setPreview(url);
  };

  const clearFile = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const isValidUrl = (url: string): boolean => {
    try {
      const u = new URL(url.trim());
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const canSubmit = mode === 'link'
    ? isValidUrl(videoUrl)
    : mode === 'file'
    ? !!file
    : false;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setLoading(true);
    setError('');
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('amasToken');

      if (mode === 'link') {
        // Link flow — JSON body
        const res = await fetch(`${API_BASE}/clases/clase/${claseId}/enviar`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            video_url: videoUrl.trim(),
            comentario: comentario.trim() || undefined,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || 'Error al enviar el video');
        } else {
          setSuccess(true);
          setTimeout(() => onSuccess(), 1500);
        }
        setLoading(false);
      } else if (file) {
        // File upload — multipart FormData with progress
        const formData = new FormData();
        formData.append('video', file);
        if (comentario.trim()) formData.append('comentario', comentario.trim());

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}/clases/clase/${claseId}/upload-video`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status === 200 && data.success) {
              setSuccess(true);
              setTimeout(() => onSuccess(), 1500);
            } else {
              setError(data.error || 'Error al subir');
            }
          } catch {
            setError('Error procesando respuesta');
          }
          setLoading(false);
        };

        xhr.onerror = () => {
          setError('Error de conexion');
          setLoading(false);
        };

        xhr.send(formData);
        return; // Don't set loading=false yet (xhr handles it)
      }
    } catch {
      setError('Error de conexion');
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

  // Mode selection
  if (mode === 'select') {
    return (
      <div className="flex flex-col gap-3">
        <button
          onClick={() => setMode('link')}
          className="h-16 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center gap-3 text-white/50 hover:text-white/70 hover:border-[#FA7B21]/30 transition-all active:scale-[0.98]"
        >
          <Link2 className="w-6 h-6" />
          <div className="text-left">
            <span className="text-sm font-medium block">Pegar enlace de video</span>
            <span className="text-[11px] text-white/30">YouTube, Google Drive, etc.</span>
          </div>
        </button>
        <button
          onClick={() => { setMode('file'); setTimeout(() => inputRef.current?.click(), 100); }}
          className="h-16 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center gap-3 text-white/50 hover:text-white/70 hover:border-[#FA7B21]/30 transition-all active:scale-[0.98]"
        >
          <Video className="w-6 h-6" />
          <div className="text-left">
            <span className="text-sm font-medium block">Grabar o subir video</span>
            <span className="text-[11px] text-white/30">Desde tu dispositivo</span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Link mode */}
      {mode === 'link' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-zinc-800/50 border border-white/10 rounded-xl px-4 h-14 focus-within:border-[#FA7B21]/50 transition-colors">
            <Link2 className="w-5 h-5 text-white/40 flex-shrink-0" />
            <input
              type="url"
              value={videoUrl}
              onChange={e => { setVideoUrl(e.target.value); setError(''); }}
              placeholder="https://drive.google.com/file/..."
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/20"
              autoFocus
            />
            {videoUrl && (
              <button onClick={() => setVideoUrl('')} className="text-white/30 hover:text-white/60">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-white/30 text-[11px] px-1">
            Sube tu video a Google Drive y pega el enlace compartido
          </p>
        </div>
      )}

      {/* File mode */}
      {mode === 'file' && (
        <>
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
        </>
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

      {loading && mode === 'file' && uploadProgress > 0 && (
        <div className="flex flex-col gap-1">
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-white/40 text-xs text-center">
            {uploadProgress < 100 ? `Subiendo... ${uploadProgress}%` : 'Procesando...'}
          </p>
        </div>
      )}

      {error && <p className="text-red-400 text-sm px-1">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={() => { setMode('select'); clearFile(); setVideoUrl(''); setError(''); }}
          className="h-14 px-4 bg-zinc-800 hover:bg-zinc-700 text-white/60 font-medium rounded-xl transition-all active:scale-[0.98]"
        >
          Atras
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          className="flex-1 h-14 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-[#FA7B21]/20"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Enviar
            </>
          )}
        </button>
      </div>
    </div>
  );
}
