interface CaminoAnimadoProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  completado: boolean;
  viewWidth: number;
}

export function CaminoAnimado({ from, to, completado, viewWidth }: CaminoAnimadoProps) {
  const x1 = (from.x / 100) * viewWidth;
  const y1 = from.y;
  const x2 = (to.x / 100) * viewWidth;
  const y2 = to.y;

  // Control point for the bezier curve — creates an S-shape
  const midY = (y1 + y2) / 2;
  const cpx1 = x1;
  const cpy1 = midY;
  const cpx2 = x2;
  const cpy2 = midY;

  const d = `M ${x1} ${y1} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${x2} ${y2}`;

  return (
    <g>
      {/* Background path (always visible, dim) */}
      <path
        d={d}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={4}
        strokeLinecap="round"
      />
      {/* Foreground path (colored if completed) */}
      {completado && (
        <path
          d={d}
          fill="none"
          stroke="url(#goldGradient)"
          strokeWidth={4}
          strokeLinecap="round"
          className="animate-draw-path"
          style={{
            filter: 'drop-shadow(0 0 6px rgba(252, 169, 41, 0.4))',
          }}
        />
      )}
    </g>
  );
}
