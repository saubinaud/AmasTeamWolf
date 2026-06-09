import { Lock, Star, Clock, Zap, Check, Trophy } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   NodoClase — A game-like node on the adventure map.

   Pure HTML/CSS positioned absolute (no SVG foreignObject).
   States: bloqueado | disponible | video_enviado | completado
   ═══════════════════════════════════════════════════════════════ */

interface ClaseNodo {
  id: number;
  titulo: string;
  orden: number;
  estado: string;
  puntos: number;
}

interface NodoClaseProps {
  clase: ClaseNodo;
  color: string;
  position: { x: number; y: number };
  onClick: () => void;
  isCurrent: boolean;
}

export function NodoClase({ clase, color, position, onClick, isCurrent }: NodoClaseProps) {
  const isLocked = clase.estado === 'bloqueado';
  const isCompleted = clase.estado === 'completado';
  const isPending = clase.estado === 'video_enviado';
  const isAvailable = clase.estado === 'disponible';

  const size = isCurrent ? 72 : isLocked ? 56 : 64;
  const half = size / 2;

  return (
    <div
      id={`nodo-${clase.id}`}
      className="absolute flex flex-col items-center"
      style={{
        left: position.x - half,
        top: position.y - half,
        width: size,
        zIndex: isCurrent ? 10 : isLocked ? 1 : 5,
      }}
    >
      {/* ── Beacon pulse for current node ── */}
      {isCurrent && (
        <>
          <div className="absolute rounded-full"
            style={{
              width: size + 40, height: size + 40,
              left: -20, top: -20,
              border: `2px solid ${color}`,
              opacity: 0.15,
              animation: 'beacon 2s ease-out infinite',
            }}
          />
          <div className="absolute rounded-full"
            style={{
              width: size + 24, height: size + 24,
              left: -12, top: -12,
              border: `2.5px solid ${color}`,
              opacity: 0.3,
              animation: 'beacon 2s ease-out 0.4s infinite',
            }}
          />
        </>
      )}

      {/* ── Completed glow halo ── */}
      {isCompleted && (
        <div className="absolute rounded-full"
          style={{
            width: size + 16, height: size + 16,
            left: -8, top: -8,
            background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)',
          }}
        />
      )}

      {/* ── Pending spinner ring ── */}
      {isPending && (
        <div className="absolute rounded-full"
          style={{
            width: size + 12, height: size + 12,
            left: -6, top: -6,
            border: `2px dashed ${color}`,
            opacity: 0.4,
            animation: 'spin 8s linear infinite',
          }}
        />
      )}

      {/* ── Main circle button ── */}
      <button
        onClick={isLocked ? undefined : onClick}
        disabled={isLocked}
        className="relative rounded-full flex items-center justify-center transition-transform active:scale-90"
        style={{
          width: size,
          height: size,
          background: isLocked
            ? 'linear-gradient(145deg, #18181b, #0f0f12)'
            : isCompleted
              ? 'linear-gradient(145deg, #f59e0b, #d97706)'
              : `linear-gradient(145deg, ${color}, ${color}cc)`,
          boxShadow: isLocked
            ? 'inset 0 2px 4px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)'
            : isCompleted
              ? '0 0 24px rgba(245,158,11,0.35), inset 0 2px 4px rgba(255,255,255,0.15)'
              : isCurrent
                ? `0 0 28px ${color}50, inset 0 2px 4px rgba(255,255,255,0.12)`
                : `0 4px 16px ${color}25, inset 0 2px 4px rgba(255,255,255,0.08)`,
          border: isLocked
            ? '2px solid rgba(255,255,255,0.04)'
            : isCompleted
              ? '3px solid #fbbf24'
              : isCurrent
                ? `3px solid ${color}`
                : `2.5px solid ${color}90`,
          cursor: isLocked ? 'default' : 'pointer',
          opacity: isLocked ? 0.35 : 1,
        }}
      >
        {/* Inner icon */}
        <div className="text-white">
          {isLocked && <Lock className="w-5 h-5 opacity-50" />}
          {isCompleted && <Trophy className="w-6 h-6 text-white drop-shadow-md" />}
          {isPending && <Clock className="w-6 h-6" style={{ animation: 'pulse 2s ease-in-out infinite' }} />}
          {isAvailable && <Zap className="w-6 h-6 drop-shadow-sm" />}
        </div>

        {/* Order badge — top-left */}
        {!isLocked && (
          <span className="absolute -top-1 -left-1 min-w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-black"
            style={{
              background: isCompleted ? '#FFD700' : '#1a1a2e',
              color: isCompleted ? '#1a1a2e' : 'white',
              border: isCompleted ? '2px solid #fbbf24' : '2px solid rgba(255,255,255,0.1)',
              boxShadow: isCompleted ? '0 0 8px rgba(255,215,0,0.4)' : '0 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            {clase.orden}
          </span>
        )}

        {/* Completed star badge — top-right */}
        {isCompleted && (
          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center shadow-lg"
            style={{ boxShadow: '0 0 10px rgba(255,215,0,0.5)' }}
          >
            <Star className="w-3.5 h-3.5 text-white fill-white" />
          </div>
        )}
      </button>

      {/* ── Label ── */}
      <div className="mt-2 text-center max-w-[120px]" style={{ opacity: isLocked ? 0.15 : 1 }}>
        <p className="text-[11px] font-semibold leading-tight"
          style={{
            color: isCompleted ? '#fbbf24'
              : isCurrent ? 'rgba(255,255,255,0.9)'
              : isPending ? 'rgba(255,255,255,0.5)'
              : isLocked ? 'rgba(255,255,255,0.2)'
              : 'rgba(255,255,255,0.6)',
            textShadow: '0 1px 6px rgba(0,0,0,0.8)',
          }}
        >
          {clase.titulo}
        </p>
        {isCompleted && (
          <p className="text-[9px] text-amber-400/60 mt-0.5 font-medium">+{clase.puntos} pts</p>
        )}
        {isPending && (
          <p className="text-[9px] text-white/30 mt-0.5">Esperando revisión</p>
        )}
        {isCurrent && (
          <p className="text-[9px] mt-1 font-bold uppercase tracking-wider"
            style={{ color, textShadow: `0 0 12px ${color}60` }}
          >
            ¡Toca para empezar!
          </p>
        )}
      </div>
    </div>
  );
}
