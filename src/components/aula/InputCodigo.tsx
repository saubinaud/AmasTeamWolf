import { useState, useRef } from 'react';
import { Key, Loader2 } from 'lucide-react';
import { API_BASE } from '../../config/api';
import { AnimacionDesbloqueo } from './AnimacionDesbloqueo';

interface InputCodigoProps {
  onSuccess: () => void;
}

export function InputCodigo({ onSuccess }: InputCodigoProps) {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAnimation, setShowAnimation] = useState(false);
  const [unlockedTitle, setUnlockedTitle] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatCode = (raw: string): string => {
    // Remove WOLF prefix if user typed it (we handle it automatically)
    let clean = raw.replace(/[^A-Z0-9]/g, '');
    if (clean.startsWith('WOLF')) {
      clean = clean.slice(4);
    }
    clean = clean.slice(0, 8);
    if (clean.length > 4) {
      return `WOLF-${clean.slice(0, 4)}-${clean.slice(4)}`;
    }
    if (clean.length > 0) {
      return `WOLF-${clean}`;
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const upper = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    const raw = upper.replace(/-/g, '');
    setCodigo(formatCode(raw));
    setError('');
  };

  const handleSubmit = async () => {
    // Strip formatting: remove "WOLF-" prefix and dashes, send just the raw code
    const raw = codigo.replace(/^WOLF-?/i, '').replace(/-/g, '');
    if (raw.length < 4) {
      setError('El codigo es muy corto');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('amasToken');
      const res = await fetch(`${API_BASE}/clases/desbloquear`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codigo: raw }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Codigo invalido');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      } else {
        setUnlockedTitle(data.claseTitulo || data.titulo || 'Nueva clase');
        setShowAnimation(true);
      }
    } catch {
      setError('Error de conexion');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    {showAnimation && (
      <AnimacionDesbloqueo
        claseTitulo={unlockedTitle}
        onComplete={onSuccess}
      />
    )}

    <div className="flex flex-col gap-3">
      <div
        className={`flex items-center gap-2 bg-zinc-800/50 border border-white/10 rounded-xl px-4 h-14 transition-transform ${
          shake ? 'animate-shake' : ''
        }`}
      >
        <Key className="w-5 h-5 text-white/40 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={codigo}
          onChange={handleChange}
          placeholder="WOLF-A3K9"
          className="flex-1 bg-transparent text-white font-mono text-lg tracking-wider outline-none placeholder:text-white/20"
          maxLength={14}
          autoCapitalize="characters"
          disabled={loading}
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm px-1">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || codigo.replace(/^WOLF-?/i, '').replace(/-/g, '').length < 4}
        className="h-14 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Key className="w-5 h-5" />
            Usar codigo
          </>
        )}
      </button>
    </div>
    </>
  );
}
