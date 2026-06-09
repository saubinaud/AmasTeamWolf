import { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Loader2, Plus, Minus, Locate } from 'lucide-react';
import { API_BASE } from '../../config/api';
import { NodoClase } from './NodoClase';
import { ProgresoBar } from './ProgresoBar';

/* ═══════════════════════════════════════════════════════════════
   MapaAventura — AMAS Team Wolf visual identity.

   Google Maps-style drag + zoom.
   Orange/gold atmosphere. Vibrant, not empty.
   Click detection: only fire click if pointer moved < 8px.
   ═══════════════════════════════════════════════════════════════ */

interface ClaseNodo { id: number; titulo: string; orden: number; estado: string; puntos: number }
interface RutaData { id: number; nombre: string; color: string; cinturon: string; clases: ClaseNodo[]; progreso: { completadas: number; total: number; puntos: number } }
interface Props { rutaId: number; onSelectClase: (id: number) => void; onBack: () => void }

const SCALE_MIN = 0.4;
const SCALE_MAX = 2;
const CANVAS_W = 600;
const NODE_GAP = 200;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function buildPositions(n: number) {
  const h = Math.max(1000, n * NODE_GAP + 500);
  const pts = Array.from({ length: n }, (_, i) => {
    const t = n <= 1 ? 0.5 : i / (n - 1);
    return { x: CANVAS_W / 2 + Math.sin(t * Math.PI * 2.2) * 150, y: h - 220 - t * (h - 440) };
  });
  return { pts, h };
}

// Stars
const STARS = Array.from({ length: 45 }, (_, i) => ({
  k: i, x: Math.random() * CANVAS_W, y: Math.random() * 3000,
  r: 0.5 + Math.random() * 1.5, o: 0.05 + Math.random() * 0.15, d: 3 + Math.random() * 5,
}));

// SVG trail
function Trail({ from, to, done }: { from: { x: number; y: number }; to: { x: number; y: number }; done: boolean }) {
  const m = (from.y + to.y) / 2;
  const d = `M${from.x},${from.y} C${from.x},${m} ${to.x},${m} ${to.x},${to.y}`;
  return (
    <g>
      <path d={d} fill="none" stroke="rgba(250,123,33,0.06)" strokeWidth={5} strokeLinecap="round" />
      {done ? (
        <path d={d} fill="none" stroke="url(#gld)" strokeWidth={5} strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 10px rgba(252,169,41,0.35))' }} />
      ) : (
        <path d={d} fill="none" stroke="rgba(250,123,33,0.1)" strokeWidth={4} strokeLinecap="round" strokeDasharray="6 12" />
      )}
    </g>
  );
}

export function MapaAventura({ rutaId, onSelectClase, onBack }: Props) {
  const [ruta, setRuta] = useState<RutaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [sc, setSc] = useState(0.6);

  const vpRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ on: false, sx: 0, sy: 0, otx: 0, oty: 0 });
  const pinch = useRef({ d0: 0, sc0: 0.6 });

  // ── Fetch ──
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
        setRuta({ id: p.ruta.id, nombre: p.ruta.nombre, color: p.ruta.color_primario || '#FA7B21', cinturon: p.ruta.cinturon_asociado || '', clases: cls,
          progreso: { completadas: cls.filter((x: ClaseNodo) => x.estado === 'completado').length, total: cls.length, puntos: p.puntosTotales || 0 } });
      } catch (e: unknown) { if (!c) setError(e instanceof Error ? e.message : 'Error'); }
      finally { if (!c) setLoading(false); }
    })();
    return () => { c = true; };
  }, [rutaId]);

  const layout = useMemo(() => ruta ? buildPositions(ruta.clases.length) : null, [ruta?.clases.length]);

  // ── Center ──
  const centerCurrent = () => {
    if (!ruta || !layout || !vpRef.current) return;
    const i = ruta.clases.findIndex(c => c.estado === 'disponible');
    const pos = layout.pts[i >= 0 ? i : ruta.clases.length - 1];
    if (!pos) return;
    const rect = vpRef.current.getBoundingClientRect();
    setSc(0.6);
    setTx(rect.width / 2 - pos.x * 0.6);
    setTy(rect.height / 2 - pos.y * 0.6);
  };

  useEffect(() => { if (ruta && layout) setTimeout(centerCurrent, 80); }, [ruta, layout]);

  // ── Drag — only on the viewport background, NOT on nodes ──
  // Nodes handle their own click via stopPropagation.
  // We track total distance moved to distinguish drag vs click-on-background.

  const onPDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if ((e.target as HTMLElement).closest('[data-controls]')) return;
    if ((e.target as HTMLElement).closest('button')) return; // don't drag on node buttons
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

  // ── Pinch zoom (native touch) ──
  useEffect(() => {
    const el = vpRef.current;
    if (!el) return;
    const onTS = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinch.current = { d0: Math.hypot(dx, dy), sc0: sc };
      }
    };
    const onTM = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        setSc(clamp(pinch.current.sc0 * (Math.hypot(dx, dy) / (pinch.current.d0 || 1)), SCALE_MIN, SCALE_MAX));
      }
    };
    el.addEventListener('touchstart', onTS, { passive: true });
    el.addEventListener('touchmove', onTM, { passive: false });
    return () => { el.removeEventListener('touchstart', onTS); el.removeEventListener('touchmove', onTM); };
  }, [sc]);

  // ── Wheel zoom ──
  useEffect(() => {
    const el = vpRef.current;
    if (!el) return;
    const h = (e: WheelEvent) => { e.preventDefault(); setSc(s => clamp(s * (e.deltaY > 0 ? 0.93 : 1.07), SCALE_MIN, SCALE_MAX)); };
    el.addEventListener('wheel', h, { passive: false });
    return () => el.removeEventListener('wheel', h);
  }, []);

  // ── Loading / error ──
  if (loading) return (
    <div className="h-[100dvh] bg-black flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 text-[#FA7B21] animate-spin" />
      <p className="text-white/30 text-sm">Cargando tu ruta...</p>
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
    <div className="h-[100dvh] flex flex-col overflow-hidden select-none" style={{ background: '#050508' }}>
      {/* ═══ Header ═══ */}
      <header className="relative z-40 shrink-0 border-b border-[#FA7B21]/10"
        style={{ background: 'linear-gradient(180deg, #0a0a0f 0%, rgba(10,10,15,0.95) 100%)' }}>
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
              <p className="text-white/30 text-[11px] mt-0.5">{ruta.cinturon && `${ruta.cinturon} · `}{ruta.progreso.completadas}/{ruta.progreso.total} clases</p>
            </div>
            <div className="bg-[#FA7B21]/10 border border-[#FA7B21]/20 px-3 py-1.5 rounded-full">
              <span className="text-[#FCA929] text-[11px] font-bold">★ {ruta.progreso.puntos}</span>
            </div>
          </div>
          <ProgresoBar completadas={ruta.progreso.completadas} total={ruta.progreso.total} puntos={ruta.progreso.puntos} color={color} />
        </div>
      </header>

      {/* ═══ Map viewport ═══ */}
      <div ref={vpRef} className="flex-1 relative overflow-hidden"
        style={{ touchAction: 'none', cursor: 'grab' }}
        onPointerDown={onPDown} onPointerMove={onPMove} onPointerUp={onPUp} onPointerCancel={onPUp}
      >
        {/* ── Atmospheric background (AMAS style) ── */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 80%, rgba(250,123,33,0.08) 0%, transparent 60%)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 30%, rgba(252,169,41,0.05) 0%, transparent 50%)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 80% 20%, rgba(250,123,33,0.04) 0%, transparent 40%)' }} />
          {/* Subtle grid (same as AMAS hero) */}
          <div className="absolute inset-0 opacity-[0.015]" style={{
            backgroundImage: 'linear-gradient(rgba(252,169,41,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(252,169,41,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        </div>

        {/* Transformed canvas */}
        <div style={{ transform: `translate(${tx}px,${ty}px) scale(${sc})`, transformOrigin: '0 0', willChange: 'transform', position: 'relative', width: CANVAS_W, height: CH }}>

          {/* SVG background + paths */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${CANVAS_W} ${CH}`} style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="gld" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FCA929" />
                <stop offset="100%" stopColor="#FA7B21" />
              </linearGradient>
            </defs>

            {/* Stars */}
            {STARS.map(s => (
              <circle key={s.k} cx={s.x} cy={s.y % CH} r={s.r} fill="#FCA929" opacity={s.o}>
                <animate attributeName="opacity" values={`${s.o};${s.o * 0.15};${s.o}`} dur={`${s.d}s`} repeatCount="indefinite" />
              </circle>
            ))}

            {/* Mountains */}
            <path d={`M0,${CH * 0.82} Q${CANVAS_W * 0.2},${CH * 0.65} ${CANVAS_W * 0.4},${CH * 0.74} T${CANVAS_W},${CH * 0.7} L${CANVAS_W},${CH} L0,${CH}Z`}
              fill="rgba(250,123,33,0.02)" />
            <path d={`M0,${CH * 0.9} Q${CANVAS_W * 0.35},${CH * 0.78} ${CANVAS_W * 0.6},${CH * 0.84} T${CANVAS_W},${CH * 0.8} L${CANVAS_W},${CH} L0,${CH}Z`}
              fill="rgba(250,123,33,0.012)" />

            {/* Ambient glow around current node */}
            {curIdx >= 0 && pts[curIdx] && (
              <circle cx={pts[curIdx].x} cy={pts[curIdx].y} r={180} fill="none"
                style={{ filter: `drop-shadow(0 0 80px ${color}30)` }}>
                <animate attributeName="r" values="160;200;160" dur="4s" repeatCount="indefinite" />
              </circle>
            )}

            {/* Trails */}
            {pts.map((p, i) => {
              if (i >= pts.length - 1) return null;
              const done = ruta.clases[i].estado === 'completado' && ruta.clases[i + 1].estado !== 'bloqueado';
              return <Trail key={i} from={p} to={pts[i + 1]} done={done} />;
            })}
          </svg>

          {/* Nodes (HTML) */}
          {ruta.clases.map((cls, i) => (
            <NodoClase key={cls.id} clase={cls} color={color} position={pts[i]}
              onClick={() => onSelectClase(cls.id)} isCurrent={i === curIdx} />
          ))}
        </div>

        {/* ═══ Controls ═══ */}
        <div data-controls className="absolute bottom-6 right-4 flex flex-col gap-2 z-50" onPointerDown={e => e.stopPropagation()}>
          <button onClick={() => setSc(s => clamp(s * 1.4, SCALE_MIN, SCALE_MAX))}
            className="w-12 h-12 rounded-2xl bg-black/70 backdrop-blur border border-[#FA7B21]/20 flex items-center justify-center text-[#FA7B21] hover:bg-[#FA7B21]/20 active:scale-90 transition-all shadow-xl">
            <Plus className="w-5 h-5" />
          </button>
          <button onClick={() => setSc(s => clamp(s / 1.4, SCALE_MIN, SCALE_MAX))}
            className="w-12 h-12 rounded-2xl bg-black/70 backdrop-blur border border-[#FA7B21]/20 flex items-center justify-center text-[#FA7B21] hover:bg-[#FA7B21]/20 active:scale-90 transition-all shadow-xl">
            <Minus className="w-5 h-5" />
          </button>
          <div className="h-1" />
          <button onClick={centerCurrent}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FA7B21] to-[#FCA929] flex items-center justify-center text-white active:scale-90 transition-all shadow-xl shadow-[#FA7B21]/30">
            <Locate className="w-5 h-5" />
          </button>
        </div>

        <p className="absolute bottom-6 left-4 z-50 text-[#FA7B21]/20 text-[10px] pointer-events-none">
          Arrastra · Pellizca para zoom
        </p>
      </div>
    </div>
  );
}
