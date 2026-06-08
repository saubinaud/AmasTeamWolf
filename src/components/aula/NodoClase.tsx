import { Lock, Star, Clock, Zap } from 'lucide-react';

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

  // Node size
  const r = 28;

  const fillColor = isLocked
    ? '#27272a'
    : isCompleted
    ? '#FCA929'
    : color;

  const opacity = isLocked ? 0.4 : 1;

  const handleClick = () => {
    if (!isLocked) onClick();
  };

  return (
    <g
      onClick={handleClick}
      style={{ cursor: isLocked ? 'default' : 'pointer', opacity }}
      className="transition-opacity duration-300"
    >
      {/* Glow for current/available */}
      {(isCurrent || isAvailable) && !isLocked && (
        <circle
          cx={cx}
          cy={cy}
          r={r + 10}
          fill="none"
          stroke={color}
          strokeWidth={2}
          opacity={0.3}
          className="animate-pulse-slow"
        />
      )}

      {/* Completed glow */}
      {isCompleted && (
        <circle
          cx={cx}
          cy={cy}
          r={r + 6}
          fill="none"
          stroke="#FCA929"
          strokeWidth={2}
          opacity={0.4}
          style={{ filter: 'drop-shadow(0 0 8px rgba(252, 169, 41, 0.5))' }}
        />
      )}

      {/* Main circle */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={fillColor}
        stroke={isCompleted ? '#FCA929' : isLocked ? '#3f3f46' : color}
        strokeWidth={3}
        style={
          isCompleted
            ? { filter: 'drop-shadow(0 0 10px rgba(252, 169, 41, 0.5))' }
            : isCurrent
            ? { filter: `drop-shadow(0 0 10px ${color}80)` }
            : undefined
        }
      />

      {/* Icon */}
      <foreignObject
        x={cx - 12}
        y={cy - 12}
        width={24}
        height={24}
        style={{ pointerEvents: 'none' }}
      >
        <div className="w-6 h-6 flex items-center justify-center text-white">
          {isLocked && <Lock className="w-4 h-4" />}
          {isCompleted && <Star className="w-4 h-4 fill-white" />}
          {isPending && <Clock className="w-4 h-4 animate-spin-slow" />}
          {isAvailable && <Zap className="w-4 h-4" />}
        </div>
      </foreignObject>

      {/* Order number */}
      <text
        x={cx}
        y={cy + r + 18}
        textAnchor="middle"
        fill={isLocked ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)'}
        fontSize={11}
        fontWeight={600}
        className="select-none"
      >
        {clase.orden}
      </text>

      {/* Title label (only for current or completed) */}
      {(isCurrent || isCompleted || isPending) && (
        <foreignObject
          x={cx - 60}
          y={cy + r + 24}
          width={120}
          height={36}
          style={{ pointerEvents: 'none' }}
        >
          <p className="text-[10px] text-white/50 text-center leading-tight truncate px-1">
            {clase.titulo}
          </p>
        </foreignObject>
      )}
    </g>
  );
}
