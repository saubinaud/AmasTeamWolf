interface CaminoAnimadoProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  completado: boolean;
}

export function CaminoAnimado({ from, to, completado }: CaminoAnimadoProps) {
  const x1 = from.x;
  const y1 = from.y;
  const x2 = to.x;
  const y2 = to.y;

  // S-curve bezier between the two nodes
  const midY = (y1 + y2) / 2;
  const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

  // Sparkle dots along completed paths
  const sparkles = completado
    ? Array.from({ length: 3 }, (_, i) => {
        const t = (i + 1) / 4;
        // Approximate point on cubic bezier
        const u = 1 - t;
        const sx = u * u * u * x1 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x2;
        const sy = u * u * u * y1 + 3 * u * u * t * midY + 3 * u * t * t * midY + t * t * t * y2;
        return { x: sx, y: sy, delay: i * 0.6 };
      })
    : [];

  return (
    <g>
      {/* Background path — always visible, dim */}
      <path
        d={d}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={completado ? 'none' : '8 10'}
      />

      {/* Completed: golden gradient path */}
      {completado && (
        <path
          d={d}
          fill="none"
          stroke="url(#goldGradient)"
          strokeWidth={5}
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 6px rgba(252, 169, 41, 0.4))' }}
        />
      )}

      {/* Sparkle dots along completed path */}
      {sparkles.map((sp, i) => (
        <circle
          key={i}
          cx={sp.x}
          cy={sp.y}
          r={2.5}
          fill="#FFD700"
          opacity={0.7}
          className="animate-pulse-slow"
          style={{ animationDelay: `${sp.delay}s` }}
        />
      ))}
    </g>
  );
}
