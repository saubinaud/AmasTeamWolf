import { useState } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, type Hijo } from '../../contexts/AuthContext';
import { getIniciales, toTitleCase } from './utils';

// "¿A cuál de tus hijos?": lo primero que ve una familia con más de un alumno al
// entrar. La sesión ya abrió uno (el del DNI tecleado o el primero); elegir otro
// pide un token nuevo. Después se cambia desde la cabecera (SelectorHijo).
export function ElegirHijo() {
  const { user, elegirHijo, terminarEleccion } = useAuth();
  const [cargando, setCargando] = useState<number | null>(null);
  if (!user) return null;

  const elegir = async (h: Hijo) => {
    if (h.id !== user.alumnoId) {
      setCargando(h.id);
      const r = await elegirHijo(h.id);
      setCargando(null);
      if (!r.success) { toast.error(r.error || 'No se pudo abrir ese perfil'); return; }
    }
    terminarEleccion();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="max-w-md w-full bg-zinc-900/80 border border-white/10 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-white text-center">¿A cuál de tus hijos?</h1>
        <p className="mt-2 mb-6 text-white/60 text-sm text-center">Puedes cambiar cuando quieras desde el perfil.</p>
        <div className="space-y-3">
          {user.hijos.map((h) => (
            <button
              key={h.id}
              type="button"
              disabled={cargando !== null}
              onClick={() => elegir(h)}
              className="w-full flex items-center gap-4 p-4 bg-zinc-800/80 border border-white/10 rounded-xl text-left hover:border-[#FA7B21]/50 hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              <span className="w-11 h-11 shrink-0 rounded-full bg-gradient-to-br from-[#FA7B21] to-[#FCA929] flex items-center justify-center font-bold text-white">
                {getIniciales(h.nombre)}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-white font-semibold leading-snug break-words">{toTitleCase(h.nombre)}</span>
                <span className="block text-white/50 text-xs truncate">
                  {[h.programa, h.estadoPlan || (h.estado !== 'Activo' ? h.estado : null)].filter(Boolean).join(' · ') || 'Sin plan'}
                </span>
              </span>
              {cargando === h.id ? <Loader2 className="w-5 h-5 text-white/40 animate-spin" /> : <ChevronRight className="w-5 h-5 text-white/40" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
