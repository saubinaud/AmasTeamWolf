import { useState } from 'react';
import { parseBeltDisplay, darkenHex } from './utils';

let beltIdCounter = 0;

export function BeltDisplay({ name }: { name: string }) {
  const [uid] = useState(() => `belt-${++beltIdCounter}`);
  const b = parseBeltDisplay(name);

  // Stripe band position on belt body (body y=25..55, height=30)
  const sY = b.thick === 'gruesa' ? 31 : b.thick === 'delgada' ? 36 : 33;
  const sH = b.thick === 'gruesa' ? 18 : b.thick === 'delgada' ? 8 : 14;

  const outline = b.white ? 'rgba(255,255,255,0.25)' : 'transparent';
  const knot = darkenHex(b.base, b.white ? 0.06 : 0.12);
  const tail = darkenHex(b.base, b.white ? 0.1 : 0.2);

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="relative w-44 h-[88px]">
        <svg viewBox="0 0 200 100" className="w-full h-full drop-shadow-lg">
          <defs>
            <clipPath id={uid}>
              <path d="M10,25 Q5,25 5,35 L5,45 Q5,55 10,55 L190,55 Q195,55 195,45 L195,35 Q195,25 190,25 Z" />
              <path d="M88,18 L112,18 L119,60 L81,60 Z" />
              <path d="M89,48 L68,94 L80,94 L95,56 Z" />
              <path d="M111,48 L132,94 L120,94 L105,56 Z" />
            </clipPath>
            <pattern id={`${uid}-camo`} patternUnits="userSpaceOnUse" width="12" height="12">
              <rect width="12" height="12" fill="#4A7C59" />
              <path d="M0,0 L6,0 L0,6 Z" fill="#2D5016" />
              <path d="M6,0 L12,0 L12,6 Z" fill="#6B7F3E" />
              <path d="M0,6 L6,12 L0,12 Z" fill="#3D6B4F" />
              <path d="M12,6 L12,12 L6,12 Z" fill="#2D5016" />
              <circle cx="3" cy="9" r="1.5" fill="#8B7D3C" />
            </pattern>
          </defs>

          {/* Belt body */}
          <path d="M10,25 Q5,25 5,35 L5,45 Q5,55 10,55 L190,55 Q195,55 195,45 L195,35 Q195,25 190,25 Z" fill={b.base} stroke={outline} strokeWidth="1" />

          {/* Knot */}
          <path d="M88,18 L112,18 L119,60 L81,60 Z" fill={knot} />

          {/* Tails */}
          <path d="M89,48 L68,94 L80,94 L95,56 Z" fill={tail} />
          <path d="M111,48 L132,94 L120,94 L105,56 Z" fill={tail} />

          {/* Stripe band (clipped to full belt shape) */}
          {b.stripe && !('bicolor' in b && b.bicolor) && (
            <rect x="0" y={sY} width="200" height={sH} fill={b.stripe} clipPath={`url(#${uid})`} />
          )}
          {/* Bicolor stripe (rojo negro: red + black) */}
          {'bicolor' in b && b.bicolor && b.stripe && (
            <>
              <rect x="0" y={sY} width="120" height={sH} fill={b.stripe} clipPath={`url(#${uid})`} />
              <rect x="120" y={sY} width="80" height={sH} fill={b.bicolor as string} clipPath={`url(#${uid})`} />
            </>
          )}

          {/* Camo overlay (stripe or full) */}
          {b.camo && b.thick && (
            <rect x="0" y={sY} width="200" height={sH} fill={`url(#${uid}-camo)`} clipPath={`url(#${uid})`} />
          )}
          {b.camo && !b.thick && (
            <rect x="0" y="0" width="200" height="100" fill={`url(#${uid}-camo)`} clipPath={`url(#${uid})`} opacity="0.5" />
          )}

          {/* Texture lines */}
          <path d="M12,28 L85,28 M115,28 L188,28" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" fill="none" />
          <path d="M12,52 L85,52 M115,52 L188,52" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" fill="none" />

          {/* Dan gold bars on black belts */}
          {b.dan > 0 && Array.from({ length: b.dan }).map((_, i) => (
            <rect key={i} x={168 - i * 9} y="29" width="5" height="22" rx="1.5" fill="#D4AF37" opacity="0.9" />
          ))}
        </svg>
      </div>
      <span className="text-[13px] font-medium text-white/70 uppercase tracking-wider max-w-[180px] text-center leading-tight">{name}</span>
    </div>
  );
}
