import { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Loader2, Plus, Minus, Locate } from 'lucide-react';
import { API_BASE } from '../../config/api';
import { NodoClase } from './NodoClase';
import { ProgresoBar } from './ProgresoBar';

/* ═══════════════════════════════════════════════════════════════
   MapaAventura — Google Maps-style drag & pinch zoom.

   - Drag: single pointer (touch or mouse)
   - Pinch zoom: two fingers on mobile
   - Wheel zoom: desktop scroll
   - Nodes: HTML divs (not SVG foreignObject — Android compat)
   - Paths: SVG bezier curves
   ═══════════════════════════════════════════════════════════════ */

// ── Types ─────────────────────────────────────────────────────

interface ClaseNodo { id: number; titulo: string; orden: number; estado: string; puntos: number }

interface RutaData {
  id: number; nombre: string; color: string; cinturon: string;
  clases: ClaseNodo[];
  progreso: { completadas: number; total: number; puntos: number };
}

interface Props { rutaId: number; onSelectClase: (id: number) => void; onBack: () => void }

// ── Constants ─────────────────────────────────────────────────

const SCALE_MIN = 0.4;
const SCALE_MAX = 2;
const NODE_GAP = 180;
const CANVAS_W = 600;

function clamp(v: number, lo: number, hi: number) { return Math.min(hi, Math.max(lo, v)); }

function buildPositions(n: number) {
  const h = Math.max(900, n * NODE_GAP + 400);
  const pts = Array.from({ length: n }, (_, i) => {
    const t = n <= 1 ? 0.5 : i / (n - 1);
    return {
      x: CANVAS_W / 2 + Math.sin(t * Math.PI * 2.2) * 140,
      y: h - 180 - t * (h - 360),
    };
  });
  return { pts, h };
}

// ── Stars ─────────────────────────────────────────────────────

const STARS = Array.from({ length: 50 }, (_, i) => ({
  k: i, x: Math.random() * CANVAS_W, y: Math.random() * 3000,
  r: 0.6 + Math.random() * 1.5, o: 0.05 + Math.random() * 0.2, d: 3 + Math.random() * 5,
}));

// ── SVG Path ──────────────────────────────────────────────────

function Trail({ from, to, done }: { from: { x: number; y: number }; to: { x: number; y: number }; done: boolean }) {
  const m = (from.y + to.y) / 2;
  const d = `M${from.x},${from.y} C${from.x},${m} ${to.x},${m} ${to.x},${to.y}`;
  return (
    <g>
      <path d={d} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={4} strokeLinecap="round" />
      {done ? (
        <path d={d} fill="none" stroke="url(#gld)" strokeWidth={4} strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 8px rgba(252,169,41,0.3))' }} />
      ) : (
        <path d={d} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3}
          strokeLinecap="round" strokeDasharray="5 9" />
      )}
    </g>
  );
}

// ── Component ─────────────────────────────────────────────────

export function MapaAventura({ rutaId, onSelectClase, onBack }: Props) {
  const [ruta, setRuta] = useState<RutaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Transform state
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [sc, setSc] = useState(0.65);

  // Refs
  const vpRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, sx: 0, sy: 0, otx: 0, oty: 0, moved: false });
  const pinchRef = useRef({ d0: 0, sc0: 0.65 });

  // ── Fetch ─────────────────────────────────────────────────

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
        setRuta({
          id: p.ruta.id, nombre: p.ruta.nombre,
          color: p.ruta.color_primario || '#FA7B21', cinturon: p.ruta.cinturon_asociado || '',
          clases: cls,
          progreso: { completadas: cls.filter((x: ClaseNodo) => x.estado === 'completado').length, total: cls.length, puntos: p.puntosTotales || 0 },
        });
      } catch (e: unknown) { if (!c) setError(e instanceof Error ? e.message : 'Error'); }
      finally { if (!c) setLoading(false); }
    })();
    return () => { c = true; };
  }, [rutaId]);

  const layout = useMemo(() => ruta ? buildPositions(ruta.clases.length) : null, [ruta?.clases.length]);

  // ── Center on node ────────────────────────────────────────

  const centerOn = (idx: number, s?: number) => {
    if (!layout || !vpRef.current) return;
    const pos = layout.pts[idx];
    if (!pos) return;
    const rect = vpRef.current.getBoundingClientRect();
    const ns = s ?? sc;
    setSc(ns);
    setTx(rect.width / 2 - pos.x * ns);
    setTy(rect.height / 2 - pos.y * ns);
  };

  const centerCurrent = () => {
    if (!ruta || !layout) return;
    const i = ruta.clases.findIndex(c => c.estado === 'disponible');
    centerOn(i >= 0 ? i : ruta.clases.length - 1, 0.65);
  };

  // Auto-center on load
  useEffect(() => {
    if (ruta && layout) setTimeout(centerCurrent, 50);
  }, [ruta, layout]);

  // ── Drag via native pointer events ────────────────────────
  // We attach these to the viewport div via onPointer* props.
  // Nodes inside call e.stopPropagation() on click so they don't trigger drag.

  const onPDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    // Ignore if target is a button (zoom controls)
    if ((e.target as HTMLElement).closest('[data-controls]')) return;
    dragRef.current = { active: true, sx: e.clientX, sy: e.clientY, otx: tx, oty: ty, moved: false };
    vpRef.current?.setPointerCapture(e.pointerId);
  };

  const onPMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.active) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;
    setTx(d.otx + dx);
    setTy(d.oty + dy);
  };

  const onPUp = (e: React.PointerEvent) => {
    dragRef.current.active = false;
    vpRef.current?.releasePointerCapture(e.pointerId);
  };

  // ── Pinch zoom via touch events ───────────────────────────

  useEffect(() => {
    const el = vpRef.current;
    if (!el) return;

    const onTS = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchRef.current = { d0: Math.hypot(dx, dy), sc0: sc };
      }
    };

    const onTM = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const ratio = Math.hypot(dx, dy) / (pinchRef.current.d0 || 1);
        setSc(clamp(pinchRef.current.sc0 * ratio, SCALE_MIN, SCALE_MAX));
      }
    };

    el.addEventListener('touchstart', onTS, { passive: true });
    el.addEventListener('touchmove', onTM, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTS);
      el.removeEventListener('touchmove', onTM);
    };
  }, [sc]);

  // ── Wheel zoom ────────────────────────────────────────────

  useEffect(() => {
    const el = vpRef.current;
    if (!el) return;
    const h = (e: WheelEvent) => {
      e.preventDefault();
      setSc(s => clamp(s * (e.deltaY > 0 ? 0.93 : 1.07), SCALE_MIN, SCALE_MAX));
    };
    el.addEventListener('wheel', h, { passive: false });
    return () => el.removeEventListener('wheel', h);
  }, []);

  // ── Render ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="h-[100dvh] bg-[#060609] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-[#FA7B21] animate-spin" />
        <p className="text-white/30 text-sm">Cargando tu mundo...</p>
      </div>
    );
  }

  if (error || !ruta || !layout) {
    return (
      <div className="h-[100dvh] bg-[#060609] flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-red-400 text-center">{error || 'Ruta no encontrada'}</p>
        <button onClick={onBack} className="text-[#FA7B21] font-medium">Volver</button>
      </div>
    );
  }

  const curIdx = ruta.clases.findIndex(c => c.estado === 'disponible');
  const color = ruta.color || '#FA7B21';
  const { pts, h: canvasH } = layout;

  return (
    <div className="h-[100dvh] flex flex-col bg-[#060609] overflow-hidden select-none">
      {/* ═══ Header ═══ */}
      <header className="relative z-40 shrink-0 border-b border-white/[0.04]"
        style={{ background: 'linear-gradient(180deg, rgba(6,6,9,0.98), rgba(6,6,9,0.92))' }}>
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={onBack}
              className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-white/50 hover:text-white transition-colors">
              <ArrowLeft className="w-[18px] h-[18px]" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-white/90 font-bold text-[15px] leading-tight truncate">{ruta.nombre}</h1>
              <p className="text-white/25 text-[11px] mt-0.5">
                {ruta.cinturon && `${ruta.cinturon} · `}{ruta.progreso.completadas} de {ruta.progreso.total} clases
              </p>
            </div>
            <div className="bg-amber-500/[0.08] border border-amber-500/[0.1] px-3 py-1 rounded-full">
              <span className="text-amber-400 text-[11px] font-bold">★ {ruta.progreso.puntos}</span>
            </div>
          </div>
          <ProgresoBar completadas={ruta.progreso.completadas} total={ruta.progreso.total} puntos={ruta.progreso.puntos} color={color} />
        </div>
      </header>

      {/* ═══ Map viewport — pointer events for drag ═══ */}
      <div ref={vpRef}
        className="flex-1 relative overflow-hidden"
        style={{
          touchAction: 'none',
          cursor: dragRef.current.active ? 'grabbing' : 'grab',
          background: 'radial-gradient(ellipse at 50% 20%, #12122a 0%, #0a0a16 50%, #060609 100%)',
        }}
        onPointerDown={onPDown}
        onPointerMove={onPMove}
        onPointerUp={onPUp}
        onPointerCancel={onPUp}
      >
        {/* Transformed canvas */}
        <div style={{ transform: `translate(${tx}px,${ty}px) scale(${sc})`, transformOrigin: '0 0', willChange: 'transform', position: 'relative', width: CANVAS_W, height: canvasH }}>

          {/* ── Background stars ── */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${CANVAS_W} ${canvasH}`}>
            {STARS.map(s => (
              <circle key={s.k} cx={s.x} cy={s.y % canvasH} r={s.r} fill="white" opacity={s.o}>
                <animate attributeName="opacity" values={`${s.o};${s.o * 0.2};${s.o}`} dur={`${s.d}s`} repeatCount="indefinite" />
              </circle>
            ))}
            {/* Mountains */}
            <path d={`M0,${canvasH * 0.8} Q${CANVAS_W * 0.2},${canvasH * 0.6} ${CANVAS_W * 0.4},${canvasH * 0.72} T${CANVAS_W},${canvasH * 0.68} L${CANVAS_W},${canvasH} L0,${canvasH}Z`}
              fill="rgba(255,255,255,0.015)" />
            <path d={`M0,${canvasH * 0.88} Q${CANVAS_W * 0.3},${canvasH * 0.75} ${CANVAS_W * 0.6},${canvasH * 0.82} T${CANVAS_W},${canvasH * 0.78} L${CANVAS_W},${canvasH} L0,${canvasH}Z`}
              fill="rgba(255,255,255,0.008)" />
          </svg>

          {/* ── Current node ambient glow ── */}
          {curIdx >= 0 && pts[curIdx] && (
            <div className="absolute rounded-full pointer-events-none"
              style={{ left: pts[curIdx].x - 150, top: pts[curIdx].y - 150, width: 300, height: 300,
                background: `radial-gradient(circle, ${color}15 0%, transparent 70%)` }} />
          )}

          {/* ── SVG paths ── */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${CANVAS_W} ${canvasH}`} style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="gld" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FCA929" />
                <stop offset="100%" stopColor="#FA7B21" />
              </linearGradient>
            </defs>
            {pts.map((p, i) => {
              if (i >= pts.length - 1) return null;
              const done = ruta.clases[i].estado === 'completado' && ruta.clases[i + 1].estado !== 'bloqueado';
              return <Trail key={i} from={p} to={pts[i + 1]} done={done} />;
            })}
          </svg>

          {/* ── Nodes (HTML divs) ── */}
          {ruta.clases.map((cls, i) => (
            <NodoClase key={cls.id} clase={cls} color={color} position={pts[i]}
              onClick={() => { if (!dragRef.current.moved) onSelectClase(cls.id); }}
              isCurrent={i === curIdx} />
          ))}
        </div>

        {/* ═══ Controls — outside canvas, won't be dragged ═══ */}
        <div data-controls className="absolute bottom-6 right-4 flex flex-col gap-2 z-50"
          onPointerDown={e => e.stopPropagation()}>
          <button onClick={() => setSc(s => clamp(s * 1.4, SCALE_MIN, SCALE_MAX))}
            className="w-12 h-12 rounded-2xl bg-zinc-800/90 backdrop-blur border border-white/10 flex items-center justify-center text-white hover:bg-zinc-700 active:scale-90 transition-all shadow-xl">
            <Plus className="w-5 h-5" />
          </button>
          <button onClick={() => setSc(s => clamp(s / 1.4, SCALE_MIN, SCALE_MAX))}
            className="w-12 h-12 rounded-2xl bg-zinc-800/90 backdrop-blur border border-white/10 flex items-center justify-center text-white hover:bg-zinc-700 active:scale-90 transition-all shadow-xl">
            <Minus className="w-5 h-5" />
          </button>
          <div className="h-1" />
          <button onClick={centerCurrent}
            className="w-12 h-12 rounded-2xl bg-[#FA7B21]/90 backdrop-blur border border-[#FCA929]/30 flex items-center justify-center text-white hover:bg-[#FA7B21] active:scale-90 transition-all shadow-xl shadow-[#FA7B21]/20">
            <Locate className="w-5 h-5" />
          </button>
        </div>

        {/* Hint */}
        <p className="absolute bottom-6 left-4 z-50 text-white/15 text-[10px] pointer-events-none">
          Arrastra para moverte · Pellizca para zoom
        </p>
      </div>
    </div>
  );
}
