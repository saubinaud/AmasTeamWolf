import { Lock, Star, Clock, Zap, Check, Trophy } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   NodoClase — Game-like node following AMAS visual identity.
   Orange/gold gradients, bold, vibrant, child-friendly.
   ═══════════════════════════════════════════════════════════════ */

interface ClaseNodo { id: number; titulo: string; orden: number; estado: string; puntos: number }

interface Props {
  clase: ClaseNodo;
  color: string;
  position: { x: number; y: number };
  onClick: () => void;
  isCurrent: boolean;
}

export function NodoClase({ clase, color, position, onClick, isCurrent }: Props) {
  const locked = clase.estado === 'bloqueado';
  const done = clase.estado === 'completado';
  const pending = clase.estado === 'video_enviado';
  const available = clase.estado === 'disponible';

  const size = isCurrent ? 80 : locked ? 58 : 68;

  return (
    <div
      id={`nodo-${clase.id}`}
      className="absolute flex flex-col items-center"
      style={{ left: position.x - size / 2, top: position.y - size / 2, width: size, zIndex: isCurrent ? 10 : locked ? 1 : 5 }}
    >
      {/* ── Beacon rings for current ── */}
      {isCurrent && (
        <>
          <div className="absolute inset-[-24px] rounded-full" style={{ border: `2px solid ${color}`, opacity: 0.2, animation: 'beacon 2s ease-out infinite' }} />
          <div className="absolute inset-[-14px] rounded-full" style={{ border: `2.5px solid ${color}`, opacity: 0.35, animation: 'beacon 2s ease-out 0.5s infinite' }} />
        </>
      )}

      {/* ── Gold halo for completed ── */}
      {done && (
        <div className="absolute inset-[-10px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(252,169,41,0.2) 40%, transparent 70%)' }} />
      )}

      {/* ── Spinning dashes for pending ── */}
      {pending && (
        <div className="absolute inset-[-8px] rounded-full"
          style={{ border: `2.5px dashed ${color}`, opacity: 0.5, animation: 'spin 8s linear infinite' }} />
      )}

      {/* ── Main button ── */}
      <button
        onClick={locked ? undefined : (e) => { e.stopPropagation(); onClick(); }}
        disabled={locked}
        className="relative rounded-full flex items-center justify-center transition-transform duration-150 active:scale-90"
        style={{
          width: size, height: size,
          background: locked
            ? 'linear-gradient(145deg, #1a1a1f, #111115)'
            : done
              ? 'linear-gradient(145deg, #f59e0b, #d97706)'
              : `linear-gradient(145deg, #FA7B21, #e06510)`,
          boxShadow: locked
            ? '0 2px 8px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.03)'
            : done
              ? '0 0 30px rgba(245,158,11,0.4), 0 4px 20px rgba(245,158,11,0.25), inset 0 2px 4px rgba(255,255,255,0.2)'
              : isCurrent
                ? `0 0 35px ${color}55, 0 4px 24px ${color}35, inset 0 2px 4px rgba(255,255,255,0.15)`
                : `0 4px 16px ${color}30, inset 0 2px 4px rgba(255,255,255,0.1)`,
          border: locked
            ? '2.5px solid rgba(255,255,255,0.06)'
            : done
              ? '3px solid #fbbf24'
              : isCurrent
                ? `3.5px solid rgba(255,255,255,0.25)`
                : `2.5px solid rgba(255,255,255,0.15)`,
          cursor: locked ? 'default' : 'pointer',
          opacity: locked ? 0.3 : 1,
        }}
      >
        {/* Inner shine */}
        {!locked && (
          <div className="absolute inset-[3px] rounded-full pointer-events-none"
            style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.2) 0%, transparent 50%)' }} />
        )}

        {/* Icon */}
        <div className="relative text-white">
          {locked && <Lock className="w-5 h-5 opacity-40" />}
          {done && <Trophy className="w-7 h-7 drop-shadow-lg" />}
          {pending && <Clock className="w-6 h-6" style={{ animation: 'pulse 2s ease-in-out infinite' }} />}
          {available && <Zap className="w-7 h-7 drop-shadow-lg" />}
        </div>

        {/* Order badge */}
        <span className="absolute -top-1.5 -left-1.5 min-w-[24px] h-[24px] rounded-full flex items-center justify-center text-[11px] font-black leading-none"
          style={{
            background: locked ? '#18181b' : done ? '#FFD700' : '#1a1a2e',
            color: done ? '#1a1a2e' : locked ? 'rgba(255,255,255,0.2)' : 'white',
            border: locked ? '2px solid rgba(255,255,255,0.05)' : done ? '2px solid #fbbf24' : '2px solid rgba(255,255,255,0.12)',
            boxShadow: done ? '0 0 10px rgba(255,215,0,0.4)' : '0 2px 6px rgba(0,0,0,0.6)',
          }}
        >
          {clase.orden}
        </span>

        {/* Completed star */}
        {done && (
          <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-lg animate-star-appear"
            style={{ background: 'linear-gradient(145deg, #FFD700, #f59e0b)', boxShadow: '0 0 12px rgba(255,215,0,0.5)' }}>
            <Star className="w-4 h-4 text-white fill-white" />
          </div>
        )}
      </button>

      {/* ── Label ── */}
      <div className="mt-3 text-center w-[130px]">
        <p className="text-[12px] font-bold leading-tight"
          style={{
            color: locked ? 'rgba(255,255,255,0.12)' : done ? '#fbbf24' : isCurrent ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)',
            textShadow: locked ? 'none' : '0 2px 8px rgba(0,0,0,0.8)',
          }}>
          {clase.titulo}
        </p>
        {done && <p className="text-[10px] text-amber-400/70 mt-0.5 font-semibold">+{clase.puntos} pts ✓</p>}
        {pending && <p className="text-[10px] text-white/30 mt-0.5">⏳ Esperando revisión</p>}
        {isCurrent && (
          <div className="mt-1.5 inline-flex items-center gap-1 bg-[#FA7B21]/20 border border-[#FA7B21]/30 rounded-full px-3 py-1">
            <span className="text-[10px] font-bold text-[#FCA929] uppercase tracking-wide">¡Empezar!</span>
          </div>
        )}
      </div>
    </div>
  );
}
