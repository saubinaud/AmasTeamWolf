import { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Loader2, Plus, Minus, Locate } from 'lucide-react';
import { API_BASE } from '../../config/api';
import { NodoClase } from './NodoClase';
import { ProgresoBar } from './ProgresoBar';

/* ═══════════════════════════════════════════════════════════════
   MapaAventura — "Montaña del Guerrero"

   Immersive world map with decorative elements:
   - Torches with animated fire along the trail
   - Wolf paw prints on the path
   - Torii gates marking sections
   - Floating fire particles
   - Rock/stone formations
   - Bamboo stalks
   - Fog layers
   - Mountain landscape
   ═══════════════════════════════════════════════════════════════ */

interface ClaseNodo { id: number; titulo: string; orden: number; estado: string; puntos: number }
interface RutaData { id: number; nombre: string; color: string; cinturon: string; clases: ClaseNodo[]; progreso: { completadas: number; total: number; puntos: number } }
interface Props { rutaId: number; onSelectClase: (id: number) => void; onBack: () => void }

const SCALE_MIN = 0.3;
const SCALE_MAX = 3;
const NODE_GAP = 350; // big gap = room for decorations
const CW = 2000; // huge world
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function buildPositions(n: number) {
  const h = Math.max(2000, n * NODE_GAP + 800);
  const pts = Array.from({ length: n }, (_, i) => {
    const t = n <= 1 ? 0.5 : i / (n - 1);
    return { x: CW / 2 + Math.sin(t * Math.PI * 2.2) * 350, y: h - 400 - t * (h - 800) };
  });
  return { pts, h };
}

// ── Decorative SVG elements ──────────────────────────────────

// Torch with animated flame
function Torch({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      {/* Pole */}
      <rect x={-3} y={0} width={6} height={28} rx={2} fill="#5a3e1b" />
      <rect x={-4} y={-2} width={8} height={6} rx={2} fill="#8b6914" />
      {/* Fire glow */}
      <circle cx={0} cy={-8} r={18} fill="rgba(250,123,33,0.08)">
        <animate attributeName="r" values="16;22;16" dur="1.5s" repeatCount="indefinite" />
      </circle>
      {/* Flame layers */}
      <ellipse cx={0} cy={-10} rx={7} ry={12} fill="#FA7B21" opacity={0.9}>
        <animate attributeName="ry" values="11;14;10;13;11" dur="0.8s" repeatCount="indefinite" />
        <animate attributeName="rx" values="6;8;5;7;6" dur="0.6s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx={0} cy={-12} rx={4} ry={8} fill="#FCA929" opacity={0.9}>
        <animate attributeName="ry" values="7;10;6;9;7" dur="0.7s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx={0} cy={-14} rx={2} ry={5} fill="#FFE4B5" opacity={0.8}>
        <animate attributeName="ry" values="4;6;3;5;4" dur="0.5s" repeatCount="indefinite" />
      </ellipse>
    </g>
  );
}

// Torii gate (Japanese arch)
function ToriiGate({ x, y, w = 70 }: { x: number; y: number; w?: number }) {
  const hw = w / 2;
  return (
    <g opacity={0.12}>
      {/* Pillars */}
      <rect x={x - hw} y={y} width={5} height={50} fill="#FA7B21" />
      <rect x={x + hw - 5} y={y} width={5} height={50} fill="#FA7B21" />
      {/* Top beam */}
      <rect x={x - hw - 8} y={y - 4} width={w + 16} height={6} rx={2} fill="#FA7B21" />
      {/* Second beam */}
      <rect x={x - hw + 5} y={y + 10} width={w - 10} height={4} rx={1} fill="#FA7B21" />
    </g>
  );
}

// Stone/rock
function Rock({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={0.08}>
      <ellipse cx={0} cy={0} rx={18} ry={12} fill="#FCA929" />
      <ellipse cx={-5} cy={-2} rx={12} ry={9} fill="#FA7B21" />
    </g>
  );
}

// Bamboo stalk
function Bamboo({ x, y, h = 80 }: { x: number; y: number; h?: number }) {
  return (
    <g opacity={0.06}>
      <rect x={x} y={y - h} width={4} height={h} rx={2} fill="#FCA929" />
      {/* Segments */}
      {Array.from({ length: Math.floor(h / 20) }, (_, i) => (
        <rect key={i} x={x - 1} y={y - h + i * 20} width={6} height={2} rx={1} fill="#FCA929" />
      ))}
      {/* Leaves */}
      <ellipse cx={x + 12} cy={y - h + 10} rx={10} ry={3} fill="#FCA929" transform={`rotate(-30 ${x + 12} ${y - h + 10})`} />
      <ellipse cx={x - 8} cy={y - h + 25} rx={8} ry={2.5} fill="#FCA929" transform={`rotate(25 ${x - 8} ${y - h + 25})`} />
    </g>
  );
}

// Wolf paw print
function PawPrint({ x, y, rot = 0, s = 1 }: { x: number; y: number; rot?: number; s?: number }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} opacity={0.07}>
      {/* Main pad */}
      <ellipse cx={0} cy={2} rx={6} ry={7} fill="#FCA929" />
      {/* Toes */}
      <circle cx={-5} cy={-5} r={3} fill="#FCA929" />
      <circle cx={0} cy={-7} r={3} fill="#FCA929" />
      <circle cx={5} cy={-5} r={3} fill="#FCA929" />
      <circle cx={-8} cy={-1} r={2.5} fill="#FCA929" />
    </g>
  );
}

// Fire particle (floating ember)
function Ember({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <circle cx={x} cy={y} r={1.5} fill="#FA7B21" opacity={0}>
      <animate attributeName="cy" values={`${y};${y - 60}`} dur="3s" begin={`${delay}s`} repeatCount="indefinite" />
      <animate attributeName="opacity" values="0;0.6;0.3;0" dur="3s" begin={`${delay}s`} repeatCount="indefinite" />
      <animate attributeName="cx" values={`${x};${x + 8};${x - 5};${x + 3}`} dur="3s" begin={`${delay}s`} repeatCount="indefinite" />
    </circle>
  );
}

// Stars across the entire world
const STARS = Array.from({ length: 100 }, (_, i) => ({
  k: i, x: Math.random() * CW, y: Math.random() * 6000,
  r: 0.5 + Math.random() * 2, o: 0.04 + Math.random() * 0.15, d: 3 + Math.random() * 6,
}));

// Fire embers everywhere
const EMBERS = Array.from({ length: 40 }, (_, i) => ({
  k: i, x: Math.random() * CW, y: 200 + Math.random() * 4000, delay: Math.random() * 5,
}));

// SVG trail between nodes
function Trail({ from, to, done }: { from: { x: number; y: number }; to: { x: number; y: number }; done: boolean }) {
  const m = (from.y + to.y) / 2;
  const d = `M${from.x},${from.y} C${from.x},${m} ${to.x},${m} ${to.x},${to.y}`;
  return (
    <g>
      {/* Wide ground shadow */}
      <path d={d} fill="none" stroke="rgba(250,123,33,0.03)" strokeWidth={24} strokeLinecap="round" />
      {/* Main trail */}
      <path d={d} fill="none" stroke={done ? 'url(#gld)' : 'rgba(250,123,33,0.08)'} strokeWidth={done ? 6 : 5}
        strokeLinecap="round" strokeDasharray={done ? 'none' : '8 14'}
        style={done ? { filter: 'drop-shadow(0 0 12px rgba(252,169,41,0.3))' } : undefined} />
      {/* Sparkle dots on completed trail */}
      {done && (
        <>
          {[0.25, 0.5, 0.75].map((t, i) => {
            const u = 1 - t;
            const sx = u * u * u * from.x + 3 * u * u * t * from.x + 3 * u * t * t * to.x + t * t * t * to.x;
            const sy = u * u * u * from.y + 3 * u * u * t * m + 3 * u * t * t * m + t * t * t * to.y;
            return (
              <circle key={i} cx={sx} cy={sy} r={3} fill="#FFD700" opacity={0.5}>
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" />
              </circle>
            );
          })}
        </>
      )}
    </g>
  );
}

// Generate decorations based on node positions
function generateDecorations(pts: { x: number; y: number }[], CH: number) {
  const decorations: JSX.Element[] = [];

  pts.forEach((pos, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const midY = i < pts.length - 1 ? (pos.y + pts[i + 1].y) / 2 : pos.y - 100;

    // Torches flanking each node
    decorations.push(
      <Torch key={`torch-l-${i}`} x={pos.x - 55 * (side > 0 ? 1 : -1)} y={pos.y - 15} scale={0.8} />,
      <Torch key={`torch-r-${i}`} x={pos.x + 55 * (side > 0 ? 1 : -1)} y={pos.y - 15} scale={0.8} />,
    );

    // Rocks scattered near nodes
    if (i % 2 === 0) {
      decorations.push(<Rock key={`rock-${i}`} x={pos.x + side * 120} y={pos.y + 20} s={0.8 + Math.random() * 0.5} />);
    }

    // Bamboo on alternating sides
    if (i % 3 === 0) {
      decorations.push(<Bamboo key={`bamboo-${i}`} x={pos.x - side * 140} y={pos.y + 30} h={60 + Math.random() * 40} />);
    }

    // Paw prints between nodes
    if (i < pts.length - 1) {
      const angle = Math.atan2(pts[i + 1].y - pos.y, pts[i + 1].x - pos.x) * (180 / Math.PI);
      decorations.push(
        <PawPrint key={`paw-a-${i}`} x={(pos.x + pts[i + 1].x) / 2 - 15} y={midY - 5} rot={angle - 90} s={0.7} />,
        <PawPrint key={`paw-b-${i}`} x={(pos.x + pts[i + 1].x) / 2 + 15} y={midY + 15} rot={angle - 90} s={0.6} />,
      );
    }
  });

  // Torii gate at the start
  if (pts.length > 0) {
    const last = pts[pts.length - 1]; // bottom of map = start
    decorations.push(<ToriiGate key="torii-start" x={last.x} y={last.y + 70} w={90} />);
  }

  // Torii gate mid-way
  if (pts.length > 3) {
    const mid = pts[Math.floor(pts.length / 2)];
    decorations.push(<ToriiGate key="torii-mid" x={mid.x} y={mid.y + 80} w={80} />);
  }

  return decorations;
}

// ── Component ─────────────────────────────────────────────────

export function MapaAventura({ rutaId, onSelectClase, onBack }: Props) {
  const [ruta, setRuta] = useState<RutaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [sc, setSc] = useState(1);

  const vpRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ on: false, sx: 0, sy: 0, otx: 0, oty: 0 });
  const pinch = useRef({ d0: 0, sc0: 1 });

  // Fetch
  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const tk = localStorage.getItem('amasToken');
        const r = await fetch(`${API_BASE}/clases/ruta/${rutaId}`, { headers: { Authorization: `Bearer ${tk}` } });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Error');
        if (c) return;
        const p = j.data || j;
        const cls = (p.clases || []).map((x: ClaseNodo) => ({ ...x, estado: x.estado || 'bloqueado' }));
        setRuta({ id: p.ruta.id, nombre: p.ruta.nombre, color: p.ruta.color_primario || '#FA7B21', cinturon: p.ruta.cinturon_asociado || '',
          clases: cls, progreso: { completadas: cls.filter((x: ClaseNodo) => x.estado === 'completado').length, total: cls.length, puntos: p.puntosTotales || 0 } });
      } catch (e: unknown) { if (!c) setError(e instanceof Error ? e.message : 'Error'); }
      finally { if (!c) setLoading(false); }
    })();
    return () => { c = true; };
  }, [rutaId]);

  const layout = useMemo(() => ruta ? buildPositions(ruta.clases.length) : null, [ruta?.clases.length]);
  const decorations = useMemo(() => layout ? generateDecorations(layout.pts, layout.h) : [], [layout]);

  // Center — zoom in close to the current node (immersive, not overview)
  const centerCurrent = () => {
    if (!ruta || !layout || !vpRef.current) return;
    const i = ruta.clases.findIndex(c => c.estado === 'disponible');
    const pos = layout.pts[i >= 0 ? i : ruta.clases.length - 1];
    if (!pos) return;
    const rect = vpRef.current.getBoundingClientRect();
    // Scale so viewport width shows ~500px of the 2000px canvas = close-up view
    const idealScale = clamp(rect.width / 500, 0.6, 1.5);
    setSc(idealScale);
    setTx(rect.width / 2 - pos.x * idealScale);
    setTy(rect.height / 2 - pos.y * idealScale);
  };
  useEffect(() => { if (ruta && layout) setTimeout(centerCurrent, 80); }, [ruta, layout]);

  // Drag
  const onPDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if ((e.target as HTMLElement).closest('[data-controls]')) return;
    if ((e.target as HTMLElement).closest('button')) return;
    drag.current = { on: true, sx: e.clientX, sy: e.clientY, otx: tx, oty: ty };
    vpRef.current?.setPointerCapture(e.pointerId);
  };
  const onPMove = (e: React.PointerEvent) => {
    if (!drag.current.on) return;
    setTx(drag.current.otx + (e.clientX - drag.current.sx));
    setTy(drag.current.oty + (e.clientY - drag.current.sy));
  };
  const onPUp = (e: React.PointerEvent) => {
    drag.current.on = false;
    vpRef.current?.releasePointerCapture(e.pointerId);
  };

  // Pinch
  useEffect(() => {
    const el = vpRef.current; if (!el) return;
    const onTS = (e: TouchEvent) => { if (e.touches.length === 2) { const dx = e.touches[0].clientX - e.touches[1].clientX; const dy = e.touches[0].clientY - e.touches[1].clientY; pinch.current = { d0: Math.hypot(dx, dy), sc0: sc }; } };
    const onTM = (e: TouchEvent) => { if (e.touches.length === 2) { e.preventDefault(); const dx = e.touches[0].clientX - e.touches[1].clientX; const dy = e.touches[0].clientY - e.touches[1].clientY; setSc(clamp(pinch.current.sc0 * (Math.hypot(dx, dy) / (pinch.current.d0 || 1)), SCALE_MIN, SCALE_MAX)); } };
    el.addEventListener('touchstart', onTS, { passive: true });
    el.addEventListener('touchmove', onTM, { passive: false });
    return () => { el.removeEventListener('touchstart', onTS); el.removeEventListener('touchmove', onTM); };
  }, [sc]);

  // Wheel
  useEffect(() => {
    const el = vpRef.current; if (!el) return;
    const h = (e: WheelEvent) => { e.preventDefault(); setSc(s => clamp(s * (e.deltaY > 0 ? 0.93 : 1.07), SCALE_MIN, SCALE_MAX)); };
    el.addEventListener('wheel', h, { passive: false });
    return () => el.removeEventListener('wheel', h);
  }, []);

  if (loading) return (
    <div className="h-[100dvh] bg-black flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <Loader2 className="w-12 h-12 text-[#FA7B21] animate-spin" />
        <div className="absolute inset-0 blur-xl bg-[#FA7B21]/20 rounded-full" />
      </div>
      <p className="text-[#FCA929]/50 text-sm font-medium">Entrando al mundo...</p>
    </div>
  );

  if (error || !ruta || !layout) return (
    <div className="h-[100dvh] bg-black flex flex-col items-center justify-center gap-4 px-6">
      <p className="text-red-400 text-center">{error || 'Ruta no encontrada'}</p>
      <button onClick={onBack} className="text-[#FA7B21] font-medium">Volver</button>
    </div>
  );

  const curIdx = ruta.clases.findIndex(c => c.estado === 'disponible');
  const color = ruta.color || '#FA7B21';
  const { pts, h: CH } = layout;

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden select-none" style={{ background: '#030305' }}>
      {/* Header */}
      <header className="relative z-40 shrink-0 border-b border-[#FA7B21]/10"
        style={{ background: 'linear-gradient(180deg, #08080c, rgba(8,8,12,0.95))' }}>
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={onBack} className="w-9 h-9 rounded-xl bg-[#FA7B21]/10 hover:bg-[#FA7B21]/20 flex items-center justify-center text-[#FA7B21] transition-colors">
              <ArrowLeft className="w-[18px] h-[18px]" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-[15px] leading-tight truncate"
                style={{ background: 'linear-gradient(135deg, #FA7B21, #FCA929)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {ruta.nombre}
              </h1>
              <p className="text-white/25 text-[11px] mt-0.5">{ruta.cinturon && `${ruta.cinturon} · `}{ruta.progreso.completadas}/{ruta.progreso.total} clases</p>
            </div>
            <div className="bg-[#FA7B21]/10 border border-[#FA7B21]/20 px-3 py-1.5 rounded-full">
              <span className="text-[#FCA929] text-[11px] font-bold">★ {ruta.progreso.puntos}</span>
            </div>
          </div>
          <ProgresoBar completadas={ruta.progreso.completadas} total={ruta.progreso.total} puntos={ruta.progreso.puntos} color={color} />
        </div>
      </header>

      {/* Map viewport */}
      <div ref={vpRef} className="flex-1 relative overflow-hidden"
        style={{ touchAction: 'none', cursor: 'grab' }}
        onPointerDown={onPDown} onPointerMove={onPMove} onPointerUp={onPUp} onPointerCancel={onPUp}
      >
        {/* Fixed atmospheric background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 70%, rgba(250,123,33,0.07) 0%, transparent 60%)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 20%, rgba(252,169,41,0.04) 0%, transparent 50%)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 85% 40%, rgba(250,123,33,0.035) 0%, transparent 40%)' }} />
          {/* Subtle AMAS grid */}
          <div className="absolute inset-0 opacity-[0.012]" style={{
            backgroundImage: 'linear-gradient(rgba(252,169,41,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(252,169,41,0.6) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>

        {/* Transformed world canvas */}
        <div style={{ transform: `translate(${tx}px,${ty}px) scale(${sc})`, transformOrigin: '0 0', willChange: 'transform', position: 'relative', width: CW, height: CH }}>

          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${CW} ${CH}`} style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="gld" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FCA929" /><stop offset="100%" stopColor="#FA7B21" />
              </linearGradient>
              <radialGradient id="fogA" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FA7B21" stopOpacity={0.06} /><stop offset="100%" stopColor="#FA7B21" stopOpacity={0} />
              </radialGradient>
            </defs>

            {/* ── Deep background mountains ── */}
            <path d={`M-50,${CH * 0.6} Q${CW * 0.1},${CH * 0.35} ${CW * 0.25},${CH * 0.48} T${CW * 0.5},${CH * 0.4} T${CW * 0.75},${CH * 0.45} T${CW + 50},${CH * 0.38} L${CW + 50},${CH + 50} L-50,${CH + 50}Z`}
              fill="rgba(250,123,33,0.018)" />
            <path d={`M-50,${CH * 0.72} Q${CW * 0.2},${CH * 0.55} ${CW * 0.4},${CH * 0.64} T${CW * 0.65},${CH * 0.58} T${CW + 50},${CH * 0.62} L${CW + 50},${CH + 50} L-50,${CH + 50}Z`}
              fill="rgba(250,123,33,0.012)" />
            <path d={`M-50,${CH * 0.85} Q${CW * 0.3},${CH * 0.72} ${CW * 0.55},${CH * 0.78} T${CW + 50},${CH * 0.74} L${CW + 50},${CH + 50} L-50,${CH + 50}Z`}
              fill="rgba(250,123,33,0.008)" />

            {/* ── Stars ── */}
            {STARS.map(s => (
              <circle key={s.k} cx={s.x} cy={s.y % CH} r={s.r} fill="#FCA929" opacity={s.o}>
                <animate attributeName="opacity" values={`${s.o};${s.o * 0.15};${s.o}`} dur={`${s.d}s`} repeatCount="indefinite" />
              </circle>
            ))}

            {/* ── Fog layers ── */}
            {[0.3, 0.5, 0.7].map((t, i) => (
              <ellipse key={`fog-${i}`} cx={CW * (0.3 + i * 0.2)} cy={CH * t} rx={300} ry={80} fill="url(#fogA)">
                <animate attributeName="cx" values={`${CW * (0.2 + i * 0.2)};${CW * (0.4 + i * 0.2)};${CW * (0.2 + i * 0.2)}`}
                  dur={`${8 + i * 3}s`} repeatCount="indefinite" />
              </ellipse>
            ))}

            {/* ── Current node big glow ── */}
            {curIdx >= 0 && pts[curIdx] && (
              <>
                <circle cx={pts[curIdx].x} cy={pts[curIdx].y} r={200} fill="url(#fogA)">
                  <animate attributeName="r" values="180;220;180" dur="4s" repeatCount="indefinite" />
                </circle>
                <circle cx={pts[curIdx].x} cy={pts[curIdx].y} r={100} fill="rgba(250,123,33,0.04)">
                  <animate attributeName="r" values="90;120;90" dur="3s" repeatCount="indefinite" />
                </circle>
              </>
            )}

            {/* ── Decorative elements ── */}
            {decorations}

            {/* ── Fire particles / embers ── */}
            {EMBERS.map(e => <Ember key={e.k} x={e.x} y={e.y % CH} delay={e.delay} />)}

            {/* ── Trails between nodes ── */}
            {pts.map((p, i) => {
              if (i >= pts.length - 1) return null;
              const done = ruta.clases[i].estado === 'completado' && ruta.clases[i + 1].estado !== 'bloqueado';
              return <Trail key={`t-${i}`} from={p} to={pts[i + 1]} done={done} />;
            })}
          </svg>

          {/* HTML Nodes */}
          {ruta.clases.map((cls, i) => (
            <NodoClase key={cls.id} clase={cls} color={color} position={pts[i]}
              onClick={() => onSelectClase(cls.id)} isCurrent={i === curIdx} />
          ))}
        </div>

        {/* Controls */}
        <div data-controls className="absolute bottom-6 right-4 flex flex-col gap-2 z-50" onPointerDown={e => e.stopPropagation()}>
          <button onClick={() => setSc(s => clamp(s * 1.4, SCALE_MIN, SCALE_MAX))}
            className="w-12 h-12 rounded-2xl bg-black/80 backdrop-blur border border-[#FA7B21]/20 flex items-center justify-center text-[#FA7B21] hover:bg-[#FA7B21]/20 active:scale-90 transition-all shadow-xl">
            <Plus className="w-5 h-5" />
          </button>
          <button onClick={() => setSc(s => clamp(s / 1.4, SCALE_MIN, SCALE_MAX))}
            className="w-12 h-12 rounded-2xl bg-black/80 backdrop-blur border border-[#FA7B21]/20 flex items-center justify-center text-[#FA7B21] hover:bg-[#FA7B21]/20 active:scale-90 transition-all shadow-xl">
            <Minus className="w-5 h-5" />
          </button>
          <div className="h-1" />
          <button onClick={centerCurrent}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FA7B21] to-[#FCA929] flex items-center justify-center text-white active:scale-90 transition-all shadow-xl shadow-[#FA7B21]/30">
            <Locate className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
