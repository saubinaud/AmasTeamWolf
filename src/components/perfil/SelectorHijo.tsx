import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../ui/utils';
import { getIniciales, toTitleCase } from './utils';

// Cambiar de hijo sin volver a entrar (familias con más de un alumno). Con un
// solo hijo no se muestra.
export function SelectorHijo({ alIzquierda = false }: { alIzquierda?: boolean }) {
  const { user, elegirHijo } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [cambiando, setCambiando] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierto(false); };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('touchstart', fuera);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('touchstart', fuera);
      document.removeEventListener('keydown', esc);
    };
  }, [abierto]);

  if (!user || user.hijos.length < 2) return null;

  const elegir = async (id: number) => {
    if (id === user.alumnoId) { setAbierto(false); return; }
    setCambiando(id);
    const r = await elegirHijo(id);
    setCambiando(null);
    setAbierto(false);
    if (!r.success) toast.error(r.error || 'No se pudo cambiar');
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        className="flex items-center gap-2 h-10 px-4 rounded-full border border-white/10 bg-white/5 text-sm text-white/80 hover:bg-white/10 transition-colors"
      >
        <Users className="w-4 h-4 text-[#FCA929]" />
        <span>Cambiar de hijo</span>
        <ChevronDown className={cn('w-4 h-4 transition-transform', abierto && 'rotate-180')} />
      </button>
      {abierto && (
        <div
          role="listbox"
          className={cn('absolute z-50 mt-2', alIzquierda ? 'left-0' : 'right-0', 'w-72 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-white/10 bg-zinc-900 p-1.5 shadow-2xl')}
        >
          {user.hijos.map((h) => {
            const actual = h.id === user.alumnoId;
            return (
              <button
                key={h.id}
                type="button"
                role="option"
                aria-selected={actual}
                disabled={cambiando !== null}
                onClick={() => elegir(h.id)}
                className={cn(
                  'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors disabled:opacity-60',
                  actual ? 'bg-[#FA7B21]/15' : 'hover:bg-white/5',
                )}
              >
                <span className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-[#FA7B21] to-[#FCA929] flex items-center justify-center text-xs font-bold text-white">
                  {getIniciales(h.nombre)}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-white truncate">{toTitleCase(h.nombre)}</span>
                  <span className="block text-xs text-white/50 truncate">{h.programa || h.estadoPlan || h.estado || 'Sin plan'}</span>
                </span>
                {cambiando === h.id ? <Loader2 className="w-4 h-4 animate-spin text-white/50" /> : actual ? <Check className="w-4 h-4 text-[#FCA929]" /> : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
