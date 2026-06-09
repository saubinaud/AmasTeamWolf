// ── Belt Visual Component ──
// Renders a visual representation of martial arts belts using pure CSS.
// Supports all 27 belt types from the AMAS database.

interface BeltVisualProps {
  nombre: string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

// ── Color map ──
const STRIPE_COLORS: Record<string, string> = {
  dorada: '#D4AF37',
  naranja: '#F97316',
  amarilla: '#EAB308',
  verde: '#22C55E',
  violeta: '#8B5CF6',
  azul: '#3B82F6',
  'marrón': '#8B6914',
  rojo: '#EF4444',
  roja: '#EF4444',
};

const FULL_BELT_COLORS: Record<string, string> = {
  blanco: '#FFFFFF',
  amarillo: '#EAB308',
  naranja: '#F97316',
  verde: '#22C55E',
  azul: '#3B82F6',
  rojo: '#EF4444',
  negro: '#1C1917',
};

const CAMO_GRADIENT = 'repeating-linear-gradient(135deg, #4A7C59 0px, #4A7C59 4px, #2D5016 4px, #2D5016 8px, #8B7D3C 8px, #8B7D3C 12px, #3D6B4F 12px, #3D6B4F 16px)';

// ── Parser ──
interface ParsedBelt {
  baseColor: string;
  stripeColor?: string;
  stripeHeight?: string; // '33%' delgada, '50%' gruesa
  isCamo: boolean;
  danLevel?: number;
  background?: string; // CSS gradient for camo
}

function parseBelt(nombre: string): ParsedBelt {
  if (!nombre) return { baseColor: '#FFFFFF', isCamo: false };

  const lower = nombre.toLowerCase().trim();

  // Negro N Dan
  const danMatch = lower.match(/^negro\s+(\d+)\s+dan$/);
  if (danMatch) {
    return { baseColor: '#1C1917', isCamo: false, danLevel: parseInt(danMatch[1]) };
  }

  // Full color camuflado: "Amarillo Camuflado", "Naranja Camuflado", etc.
  const camoMatch = lower.match(/^(\w+)\s+camuflado$/);
  if (camoMatch) {
    const base = FULL_BELT_COLORS[camoMatch[1]] || '#FFFFFF';
    return { baseColor: base, isCamo: true, background: CAMO_GRADIENT };
  }

  // Full color belts: "Amarillo", "Naranja", "Verde", etc.
  if (FULL_BELT_COLORS[lower]) {
    return { baseColor: FULL_BELT_COLORS[lower], isCamo: false };
  }

  // Striped belts: "Blanco con tira {color(s)} {delgada|gruesa}"
  const stripeMatch = lower.match(/^blanco\s+con\s+tira\s+(.+)\s+(delgada|gruesa)$/);
  const stripeNoThick = !stripeMatch && lower.match(/^blanco\s+con\s+tira\s+(.+)$/);
  const colorName = stripeMatch?.[1]?.trim() || stripeNoThick?.[1]?.trim();
  const thickness = stripeMatch?.[2];
  if (colorName) {
    // "camuflada" stripe
    if (colorName === 'camuflada') {
      return {
        baseColor: '#FFFFFF',
        isCamo: false,
        stripeColor: undefined,
        stripeHeight: thickness === 'gruesa' ? '50%' : '33%',
        background: CAMO_GRADIENT,
      };
    }

    // "rojo negro" bicolor stripe
    if (colorName === 'rojo negro') {
      return {
        baseColor: '#FFFFFF',
        isCamo: false,
        stripeColor: '#EF4444',
        stripeHeight: thickness === 'gruesa' ? '50%' : thickness === 'delgada' ? '33%' : '40%',
        background: 'linear-gradient(to right, #EF4444 60%, #1C1917 60%)',
      };
    }

    const stripeColor = STRIPE_COLORS[colorName] || '#D4AF37';
    return {
      baseColor: '#FFFFFF',
      isCamo: false,
      stripeColor,
      stripeHeight: thickness === 'gruesa' ? '50%' : thickness === 'delgada' ? '33%' : '40%',
    };
  }

  // Fallback
  return { baseColor: '#FFFFFF', isCamo: false };
}

// ── Sizes ──
const SIZES = {
  sm: { width: 80, height: 12, radius: 3, labelClass: 'text-[10px]' },
  md: { width: 128, height: 20, radius: 4, labelClass: 'text-xs' },
};

export function BeltVisual({ nombre, size = 'sm', showLabel = false }: BeltVisualProps) {
  const parsed = parseBelt(nombre);
  const dim = SIZES[size];
  const isWhiteBase = parsed.baseColor === '#FFFFFF';

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <div
        className="relative overflow-hidden"
        style={{
          width: dim.width,
          height: dim.height,
          borderRadius: dim.radius,
          backgroundColor: parsed.baseColor,
          border: isWhiteBase ? '1px solid #D6D3D1' : '1px solid transparent',
        }}
      >
        {/* Camo full belt background */}
        {parsed.isCamo && parsed.background && (
          <div
            className="absolute inset-0"
            style={{ background: parsed.background, opacity: 0.7 }}
          />
        )}

        {/* Stripe for "Blanco con tira..." */}
        {parsed.stripeColor && parsed.stripeHeight && (
          <div
            className="absolute left-0 right-0"
            style={{
              height: parsed.stripeHeight,
              top: '50%',
              transform: 'translateY(-50%)',
              ...(parsed.background
                ? { background: parsed.background }
                : { backgroundColor: parsed.stripeColor }),
            }}
          />
        )}

        {/* Camo stripe for "Blanco con tira camuflada..." */}
        {!parsed.stripeColor && parsed.stripeHeight && parsed.background && (
          <div
            className="absolute left-0 right-0"
            style={{
              height: parsed.stripeHeight,
              top: '50%',
              transform: 'translateY(-50%)',
              background: parsed.background,
            }}
          />
        )}

        {/* Dan gold stripes for black belts */}
        {parsed.danLevel && (
          <div className="absolute right-1 top-0 bottom-0 flex items-center gap-[2px]">
            {Array.from({ length: parsed.danLevel }).map((_, i) => (
              <div
                key={i}
                className="h-[60%] rounded-sm"
                style={{ width: size === 'sm' ? 2 : 3, backgroundColor: '#D4AF37' }}
              />
            ))}
          </div>
        )}
      </div>

      {showLabel && (
        <span className={`text-stone-500 ${dim.labelClass}`}>{nombre || 'Blanco'}</span>
      )}
    </div>
  );
}
