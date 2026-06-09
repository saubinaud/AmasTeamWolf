import { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Loader2, ChevronDown } from 'lucide-react';
import { API_BASE } from '../../config/api';
import { NodoClase } from './NodoClase';
import { ProgresoBar } from './ProgresoBar';

/* ═══════════════════════════════════════════════════════════════
   MapaAventura — "Mystic Mountain Trail"

   A vertically-scrolling immersive world map.
   No custom drag/zoom. Pure native scroll. Works on every device.
   ═══════════════════════════════════════════════════════════════ */

// ── Types ─────────────────────────────────────────────────────

interface ClaseNodo {
  id: number;
  titulo: string;
  orden: number;
  estado: string;
  puntos: number;
}

interface RutaData {
  id: number;
  nombre: string;
  color: string;
  cinturon: string;
  clases: ClaseNodo[];
  progreso: { completadas: number; total: number; puntos: number };
}

interface MapaAventuraProps {
  rutaId: number;
  onSelectClase: (claseId: number) => void;
  onBack: () => void;
}

// ── Layout generation ─────────────────────────────────────────

const NODE_GAP = 180; // px between nodes
const PAD_TOP = 120;
const PAD_BOTTOM = 200;

function buildPositions(count: number, containerW: number) {
  // Serpentine: nodes alternate left ↔ right, with some variation
  const centerX = containerW / 2;
  const amplitude = Math.min(containerW * 0.28, 110); // responsive amplitude

  return Array.from({ length: count }, (_, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    return {
      x: centerX + side * amplitude,
      y: PAD_TOP + (count - 1 - i) * NODE_GAP, // bottom-to-top
    };
  });
}

// ── Stars layer (generated once) ──────────────────────────────

const STARS = Array.from({ length: 60 }, (_, i) => ({
  key: i,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  size: 1 + Math.random() * 2,
  opacity: 0.06 + Math.random() * 0.2,
  delay: Math.random() * 8,
  duration: 3 + Math.random() * 5,
}));

// ── SVG curved path between two points ────────────────────────

function CurvedPath({ from, to, completed }: { from: { x: number; y: number }; to: { x: number; y: number }; completed: boolean }) {
  const midY = (from.y + to.y) / 2;
  const d = `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`;

  return (
    <>
      <path d={d} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={4} strokeLinecap="round" />
      {completed ? (
        <path
          d={d} fill="none" strokeWidth={4} strokeLinecap="round"
          stroke="url(#trailGold)"
          style={{ filter: 'drop-shadow(0 0 8px rgba(252,169,41,0.35))' }}
        />
      ) : (
        <path d={d} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3} strokeLinecap="round" strokeDasharray="6 10" />
      )}
    </>
  );
}

// ── Component ─────────────────────────────────────────────────

export function MapaAventura({ rutaId, onSelectClase, onBack }: MapaAventuraProps) {
  const [ruta, setRuta] = useState<RutaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(380);

  // ── Fetch ─────────────────────────────────────────────────

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const token = localStorage.getItem('amasToken');
        const res = await fetch(`${API_BASE}/clases/ruta/${rutaId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Error');
        if (cancel) return;
        const p = json.data || json;
        const r = p.ruta;
        const clases = (p.clases || []).map((c: ClaseNodo) => ({ ...c, estado: c.estado || 'bloqueado' }));
        setRuta({
          id: r.id,
          nombre: r.nombre,
          color: r.color_primario || '#FA7B21',
          cinturon: r.cinturon_asociado || '',
          clases,
          progreso: {
            completadas: clases.filter((c: ClaseNodo) => c.estado === 'completado').length,
            total: clases.length,
            puntos: p.puntosTotales || 0,
          },
        });
      } catch (e: unknown) {
        if (!cancel) setError(e instanceof Error ? e.message : 'Error');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [rutaId]);

  // ── Measure container width ───────────────────────────────

  useEffect(() => {
    if (!mapRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setContainerW(e.contentRect.width);
    });
    ro.observe(mapRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Positions ─────────────────────────────────────────────

  const positions = useMemo(
    () => ruta ? buildPositions(ruta.clases.length, containerW) : [],
    [ruta?.clases.length, containerW],
  );

  const totalHeight = useMemo(
    () => ruta ? PAD_TOP + (ruta.clases.length - 1) * NODE_GAP + PAD_BOTTOM : 0,
    [ruta?.clases.length],
  );

  // ── Auto-scroll to current node ───────────────────────────

  useEffect(() => {
    if (!ruta || !scrollRef.current || positions.length === 0) return;
    const idx = ruta.clases.findIndex(c => c.estado === 'disponible');
    if (idx < 0) return;
    const targetY = positions[idx].y;
    const viewH = scrollRef.current.clientHeight;

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: targetY - viewH / 2 + 40, behavior: 'smooth' });
    });
  }, [ruta, positions]);

  // ── Render states ─────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#060609] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-[#FA7B21] animate-spin" />
        <p className="text-white/30 text-sm">Cargando tu mundo...</p>
      </div>
    );
  }

  if (error || !ruta) {
    return (
      <div className="min-h-[100dvh] bg-[#060609] flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-red-400 text-center">{error || 'Ruta no encontrada'}</p>
        <button onClick={onBack} className="text-[#FA7B21] font-medium">Volver</button>
      </div>
    );
  }

  const currentIdx = ruta.clases.findIndex(c => c.estado === 'disponible');
  const color = ruta.color || '#FA7B21';

  return (
    <div className="h-[100dvh] flex flex-col bg-[#060609] overflow-hidden">
      {/* ═══ Header ═══ */}
      <header className="relative z-30 shrink-0 border-b border-white/[0.04]"
        style={{ background: 'linear-gradient(180deg, rgba(6,6,9,0.98) 0%, rgba(6,6,9,0.92) 100%)' }}
      >
        <div className="max-w-lg mx-auto px-4 pt-3 pb-3">
          <div className="flex items-center gap-3 mb-2.5">
            <button onClick={onBack}
              className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-white/50 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-[18px] h-[18px]" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-white/90 font-bold text-[15px] leading-tight truncate tracking-tight">
                {ruta.nombre}
              </h1>
              <p className="text-white/25 text-[11px] mt-0.5">
                {ruta.cinturon && `${ruta.cinturon} · `}{ruta.progreso.completadas} de {ruta.progreso.total} clases
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-500/[0.08] border border-amber-500/[0.1] px-3 py-1 rounded-full">
              <span className="text-amber-400 text-[11px] font-bold">★ {ruta.progreso.puntos}</span>
            </div>
          </div>
          <ProgresoBar completadas={ruta.progreso.completadas} total={ruta.progreso.total} puntos={ruta.progreso.puntos} color={color} />
        </div>
      </header>

      {/* ═══ Scrollable world ═══ */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Top fade — infinite sky illusion */}
        <div className="h-20 bg-gradient-to-b from-[#060609] to-transparent sticky top-0 z-20 pointer-events-none" />

        <div ref={mapRef} className="relative mx-auto w-full max-w-md" style={{ height: totalHeight }}>

          {/* ── Background layers ── */}

          {/* Stars field */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
            {STARS.map(s => (
              <div key={s.key} className="absolute rounded-full bg-white"
                style={{
                  left: s.left, top: s.top,
                  width: s.size, height: s.size,
                  opacity: s.opacity,
                  animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
                }}
              />
            ))}
          </div>

          {/* Distant mountains (parallax-like via CSS) */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none" aria-hidden>
            {/* Far layer */}
            <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="w-full h-32 opacity-[0.03]">
              <path d="M0 120 L0 80 Q50 20 100 60 T200 40 T300 55 T400 30 L400 120Z" fill="white" />
            </svg>
          </div>
          <div className="absolute inset-x-0 bottom-0 pointer-events-none" aria-hidden>
            {/* Near layer */}
            <svg viewBox="0 0 400 80" preserveAspectRatio="none" className="w-full h-24 opacity-[0.02]">
              <path d="M0 80 L0 50 Q60 10 120 35 T240 20 T360 40 L400 25 L400 80Z" fill="white" />
            </svg>
          </div>

          {/* Ambient glow around current node */}
          {currentIdx >= 0 && positions[currentIdx] && (
            <div className="absolute pointer-events-none"
              style={{
                left: positions[currentIdx].x - 160,
                top: positions[currentIdx].y - 160,
                width: 320, height: 320,
                background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`,
              }}
            />
          )}

          {/* ── SVG path layer ── */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="trailGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FCA929" />
                <stop offset="100%" stopColor="#FA7B21" />
              </linearGradient>
            </defs>

            {positions.map((pos, i) => {
              if (i >= positions.length - 1) return null;
              const next = positions[i + 1];
              const done = ruta.clases[i].estado === 'completado' && ruta.clases[i + 1].estado !== 'bloqueado';
              return <CurvedPath key={`path-${i}`} from={pos} to={next} completed={done} />;
            })}
          </svg>

          {/* ── Nodes layer ── */}
          {ruta.clases.map((clase, i) => (
            <NodoClase
              key={clase.id}
              clase={clase}
              color={color}
              position={positions[i]}
              onClick={() => onSelectClase(clase.id)}
              isCurrent={i === currentIdx}
            />
          ))}
        </div>

        {/* Bottom zone — "start" label + infinite ground illusion */}
        <div className="flex flex-col items-center gap-3 py-10 opacity-30">
          <ChevronDown className="w-5 h-5 text-white/30" />
          <p className="text-white/20 text-[10px] uppercase tracking-[0.2em]">Inicio de la ruta</p>
        </div>

        {/* Bottom fade */}
        <div className="h-16 bg-gradient-to-t from-[#060609] to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
