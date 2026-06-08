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
  viewWidth: number;
}

export function NodoClase({ clase, color, position, onClick, isCurrent, viewWidth }: NodoClaseProps) {
  const isLocked = clase.estado === 'bloqueado';
  const isCompleted = clase.estado === 'completado';
  const isPending = clase.estado === 'video_enviado';
  const isAvailable = clase.estado === 'disponible';

  const cx = (position.x / 100) * viewWidth;
  const cy = position.y;

  // Size varies by state: current is larger, locked is smaller
  const r = isCurrent ? 32 : isLocked ? 24 : 28;

  const fillColor = isLocked
    ? '#27272a'
    : isCompleted
    ? '#FCA929'
    : isPending
    ? color
    : color;

  const strokeColor = isCompleted
    ? '#FFD700'
    : isLocked
    ? '#3f3f46'
    : isPending
    ? color
    : color;

  const opacity = isLocked ? 0.35 : 1;

  const handleClick = () => {
    if (!isLocked) onClick();
  };

  return (
    <g
      id={`nodo-${clase.id}`}
      onClick={handleClick}
      style={{ cursor: isLocked ? 'default' : 'pointer', opacity, pointerEvents: isLocked ? 'none' : 'auto' }}
      className="transition-opacity duration-300"
    >
      {/* Pulsing glow for current/available node */}
      {isCurrent && (
        <>
          <circle
            cx={cx}
            cy={cy}
            r={r + 14}
            fill="none"
            stroke={color}
            strokeWidth={2}
            opacity={0.2}
            className="animate-pulse-glow-svg"
          />
          <circle
            cx={cx}
            cy={cy}
            r={r + 8}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            opacity={0.4}
            className="animate-pulse-glow-svg"
          />
        </>
      )}

      {/* Available but not current — subtle ring */}
      {isAvailable && !isCurrent && (
        <circle
          cx={cx}
          cy={cy}
          r={r + 8}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          opacity={0.25}
          className="animate-pulse-slow"
        />
      )}

      {/* Completed golden glow ring */}
      {isCompleted && (
        <circle
          cx={cx}
          cy={cy}
          r={r + 6}
          fill="none"
          stroke="#FFD700"
          strokeWidth={2}
          opacity={0.5}
          style={{ filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.5))' }}
        />
      )}

      {/* Pending — belt color ring with dashes */}
      {isPending && (
        <circle
          cx={cx}
          cy={cy}
          r={r + 6}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeDasharray="6 4"
          opacity={0.5}
          className="animate-spin-slow"
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
      )}

      {/* Main circle */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isCompleted ? 3.5 : isCurrent ? 3.5 : 2.5}
        style={
          isCompleted
            ? { filter: 'drop-shadow(0 0 12px rgba(255, 215, 0, 0.5))' }
            : isCurrent
            ? { filter: `drop-shadow(0 0 14px ${color}90)` }
            : undefined
        }
      />

      {/* Icon in the center */}
      <foreignObject
        x={cx - 12}
        y={cy - 12}
        width={24}
        height={24}
        style={{ pointerEvents: 'none' }}
      >
        <div className="w-6 h-6 flex items-center justify-center text-white">
          {isLocked && <Lock className="w-4 h-4 opacity-60" />}
          {isCompleted && <Check className="w-5 h-5 text-white drop-shadow-sm" />}
          {isPending && <Clock className="w-4 h-4 animate-spin-slow" />}
          {isAvailable && <Zap className="w-5 h-5" />}
        </div>
      </foreignObject>

      {/* Completed badge — small star at top-right */}
      {isCompleted && (
        <foreignObject
          x={cx + r * 0.5}
          y={cy - r - 4}
          width={20}
          height={20}
          style={{ pointerEvents: 'none' }}
        >
          <div className="w-5 h-5 rounded-full bg-[#FFD700] flex items-center justify-center shadow-lg">
            <Star className="w-3 h-3 text-white fill-white" />
          </div>
        </foreignObject>
      )}

      {/* Order number */}
      <text
        x={cx}
        y={cy + r + 18}
        textAnchor="middle"
        fill={isLocked ? 'rgba(255,255,255,0.15)' : isCompleted ? '#FFD700' : 'rgba(255,255,255,0.7)'}
        fontSize={11}
        fontWeight={700}
        className="select-none"
      >
        {clase.orden}
      </text>

      {/* Title label (for current, completed, pending) */}
      {(isCurrent || isCompleted || isPending) && (
        <foreignObject
          x={cx - 65}
          y={cy + r + 24}
          width={130}
          height={36}
          style={{ pointerEvents: 'none' }}
        >
          <p
            className="text-[10px] text-center leading-tight truncate px-1 font-medium"
            style={{
              color: isCompleted ? '#FCA929' : isCurrent ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)',
            }}
          >
            {clase.titulo}
          </p>
        </foreignObject>
      )}
    </g>
  );
}
