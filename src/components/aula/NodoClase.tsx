import { Lock, Star, Clock, Zap, Check } from 'lucide-react';

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

  const cx = position.x;
  const cy = position.y;

  // Larger game-like nodes — current is biggest, locked smallest
  const r = isCurrent ? 36 : isLocked ? 26 : 30;

  const fillColor = isLocked
    ? '#1c1c20'
    : isCompleted
      ? '#FCA929'
      : color;

  const strokeColor = isCompleted
    ? '#FFD700'
    : isLocked
      ? '#2a2a30'
      : color;

  const opacity = isLocked ? 0.32 : 1;

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click from triggering if it was really a drag
    e.stopPropagation();
    if (!isLocked) onClick();
  };

  return (
    <g
      id={`nodo-${clase.id}`}
      onClick={handleClick}
      style={{
        cursor: isLocked ? 'default' : 'pointer',
        opacity,
        pointerEvents: isLocked ? 'none' : 'auto',
      }}
    >
      {/* === Outer effects === */}

      {/* Current node: double pulsing glow rings */}
      {isCurrent && (
        <>
          <circle
            cx={cx} cy={cy} r={r + 18}
            fill="none" stroke={color} strokeWidth={1.5}
            opacity={0.15}
            className="animate-pulse-glow-svg"
          />
          <circle
            cx={cx} cy={cy} r={r + 10}
            fill="none" stroke={color} strokeWidth={2.5}
            opacity={0.35}
            className="animate-pulse-glow-svg"
          />
        </>
      )}

      {/* Available (not current): subtle breathing ring */}
      {isAvailable && !isCurrent && (
        <circle
          cx={cx} cy={cy} r={r + 10}
          fill="none" stroke={color} strokeWidth={1.5}
          opacity={0.2}
          className="animate-pulse-slow"
        />
      )}

      {/* Completed: golden halo */}
      {isCompleted && (
        <circle
          cx={cx} cy={cy} r={r + 8}
          fill="none" stroke="#FFD700" strokeWidth={2}
          opacity={0.45}
          style={{ filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))' }}
        />
      )}

      {/* Pending: spinning dashed ring */}
      {isPending && (
        <circle
          cx={cx} cy={cy} r={r + 8}
          fill="none" stroke={color} strokeWidth={2}
          strokeDasharray="7 5"
          opacity={0.5}
          className="animate-spin-slow"
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
      )}

      {/* Locked: chain-link dashed ring */}
      {isLocked && (
        <circle
          cx={cx} cy={cy} r={r + 6}
          fill="none" stroke="#27272a" strokeWidth={1.5}
          strokeDasharray="3 5"
          opacity={0.3}
        />
      )}

      {/* === Main circle === */}
      <circle
        cx={cx} cy={cy} r={r}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isCompleted || isCurrent ? 3.5 : 2.5}
        style={
          isCompleted
            ? { filter: 'drop-shadow(0 0 14px rgba(255, 215, 0, 0.5))' }
            : isCurrent
              ? { filter: `drop-shadow(0 0 16px ${color}90)` }
              : undefined
        }
      />

      {/* Inner darker ring for depth on active nodes */}
      {!isLocked && (
        <circle
          cx={cx} cy={cy} r={r - 5}
          fill="none"
          stroke="rgba(0,0,0,0.2)"
          strokeWidth={1}
        />
      )}

      {/* === Icon area === */}
      <foreignObject
        x={cx - 14} y={cy - 14}
        width={28} height={28}
        style={{ pointerEvents: 'none' }}
      >
        <div className="w-7 h-7 flex items-center justify-center text-white">
          {isLocked && <Lock className="w-4 h-4 opacity-50" />}
          {isCompleted && <Check className="w-5 h-5 text-white drop-shadow-sm" strokeWidth={3} />}
          {isPending && <Clock className="w-5 h-5 animate-pulse-slow" />}
          {isAvailable && <Zap className="w-5 h-5" />}
        </div>
      </foreignObject>

      {/* === Order number — prominent below the node === */}
      <text
        x={cx} y={cy + r + 20}
        textAnchor="middle"
        fill={
          isLocked
            ? 'rgba(255,255,255,0.1)'
            : isCompleted
              ? '#FFD700'
              : 'rgba(255,255,255,0.75)'
        }
        fontSize={13}
        fontWeight={800}
        fontFamily="system-ui, sans-serif"
        className="select-none"
      >
        {clase.orden}
      </text>

      {/* === Title label — always visible for non-locked === */}
      {!isLocked && (
        <foreignObject
          x={cx - 70} y={cy + r + 28}
          width={140} height={36}
          style={{ pointerEvents: 'none' }}
        >
          <p
            className="text-[11px] text-center leading-tight px-1 font-semibold select-none"
            style={{
              color: isCompleted
                ? '#FCA929'
                : isCurrent
                  ? 'rgba(255,255,255,0.85)'
                  : isPending
                    ? 'rgba(255,255,255,0.55)'
                    : 'rgba(255,255,255,0.5)',
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
            }}
          >
            {clase.titulo}
          </p>
        </foreignObject>
      )}

      {/* === Completed badge: gold star === */}
      {isCompleted && (
        <foreignObject
          x={cx + r * 0.5} y={cy - r - 6}
          width={22} height={22}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className="w-[22px] h-[22px] rounded-full bg-[#FFD700] flex items-center justify-center"
            style={{ boxShadow: '0 0 10px rgba(255, 215, 0, 0.6)' }}
          >
            <Star className="w-3.5 h-3.5 text-white fill-white" />
          </div>
        </foreignObject>
      )}
    </g>
  );
}
