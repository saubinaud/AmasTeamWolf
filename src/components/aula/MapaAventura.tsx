import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ArrowLeft, Loader2, Plus, Minus, Locate } from 'lucide-react';
import { API_BASE } from '../../config/api';
import { NodoClase } from './NodoClase';
import { CaminoAnimado } from './CaminoAnimado';
import { ProgresoBar } from './ProgresoBar';

// ── Types ──────────────────────────────────────────────────────

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

// ── Constants ──────────────────────────────────────────────────

const SCALE_MIN = 0.3;
const SCALE_MAX = 2.5;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// ── Background stars ───────────────────────────────────────────

const STARS = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  cx: Math.random() * 1200,
  cy: Math.random() * 2400,
  r: 0.5 + Math.random() * 1.8,
  opacity: 0.05 + Math.random() * 0.25,
  dur: 2 + Math.random() * 6,
}));

// ── Path generation (winding mountain trail) ──────────────────

function generateLayout(count: number) {
  const W = 1000;
  const H = Math.max(900, count * 170 + 400);
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i < count; i++) {
    const t = count <= 1 ? 0.5 : i / (count - 1);
    const x = W / 2 + Math.sin(t * Math.PI * 2) * (W * 0.25);
    const y = H - 180 - t * (H - 360);
    points.push({ x, y });
  }
  return { points, W, H };
}

// ── Component ──────────────────────────────────────────────────

export function MapaAventura({ rutaId, onSelectClase, onBack }: MapaAventuraProps) {
  const [ruta, setRuta] = useState<RutaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pan & zoom
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.6);
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Drag tracking
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const moved = useRef(false);

  // Pinch tracking
  const pinch = useRef({ dist: 0, startScale: 0.6 });

  // ── Fetch data ─────────────────────────────────────────────

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

  const layout = useMemo(() => ruta ? generateLayout(ruta.clases.length) : null, [ruta?.clases.length]);

  // ── Center on current node ─────────────────────────────────

  const centerOnCurrent = useCallback(() => {
    if (!ruta || !layout || !viewportRef.current) return;
    const idx = ruta.clases.findIndex(c => c.estado === 'disponible');
    const pos = idx >= 0 ? layout.points[idx] : layout.points[layout.points.length - 1];
    if (!pos) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const s = 0.6;
    setScale(s);
    setOffset({ x: rect.width / 2 - pos.x * s, y: rect.height / 2 - pos.y * s });
  }, [ruta, layout]);

  useEffect(() => {
    if (ruta && layout) requestAnimationFrame(centerOnCurrent);
  }, [ruta, layout, centerOnCurrent]);

  // ── Drag (on canvas div, NOT viewport) ─────────────────────

  const onDragStart = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging.current = true;
    moved.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [offset]);

  const onDragMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved.current = true;
    setOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
  }, []);

  const onDragEnd = useCallback(() => { dragging.current = false; }, []);

  // ── Pinch zoom ─────────────────────────────────────────────

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinch.current = { dist: Math.hypot(dx, dy), startScale: scale };
    }
  }, [scale]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const d = Math.hypot(dx, dy);
      setScale(clamp(pinch.current.startScale * (d / (pinch.current.dist || 1)), SCALE_MIN, SCALE_MAX));
    }
  }, []);

  // ── Wheel zoom ─────────────────────────────────────────────

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const h = (e: WheelEvent) => {
      e.preventDefault();
      setScale(s => clamp(s * (e.deltaY > 0 ? 0.92 : 1.08), SCALE_MIN, SCALE_MAX));
    };
    el.addEventListener('wheel', h, { passive: false });
    return () => el.removeEventListener('wheel', h);
  }, []);

  // ── Zoom buttons ───────────────────────────────────────────

  const zoomIn = () => setScale(s => clamp(s * 1.35, SCALE_MIN, SCALE_MAX));
  const zoomOut = () => setScale(s => clamp(s * 0.65, SCALE_MIN, SCALE_MAX));

  // ── Render ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#FA7B21] animate-spin" />
      </div>
    );
  }

  if (error || !ruta || !layout) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-red-400 text-center">{error || 'Ruta no encontrada'}</p>
        <button onClick={onBack} className="text-[#FA7B21] font-medium">Volver</button>
      </div>
    );
  }

  const currentIdx = ruta.clases.findIndex(c => c.estado === 'disponible');
  const color = ruta.color || '#FA7B21';
  const { points, W, H } = layout;

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col">
      {/* ── Header ── */}
      <div className="relative z-40 bg-zinc-950/95 backdrop-blur-xl border-b border-white/5 safe-area-top">
        <div className="max-w-lg mx-auto px-4 py-3 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-bold text-sm truncate">{ruta.nombre}</h1>
              <p className="text-white/30 text-[11px]">{ruta.cinturon || 'Ruta del Guerrero'} · {ruta.progreso.completadas}/{ruta.progreso.total} clases</p>
            </div>
            <div className="flex items-center gap-1 bg-[#FA7B21]/10 px-3 py-1.5 rounded-full">
              <span className="text-[#FCA929] text-xs font-bold">⭐ {ruta.progreso.puntos}</span>
            </div>
          </div>
          <ProgresoBar
            completadas={ruta.progreso.completadas}
            total={ruta.progreso.total}
            puntos={ruta.progreso.puntos}
            color={color}
          />
        </div>
      </div>

      {/* ── Map viewport ── */}
      <div
        ref={viewportRef}
        className="flex-1 relative overflow-hidden"
        style={{
          touchAction: 'none',
          background: 'radial-gradient(ellipse at 50% 20%, #1c1c3a 0%, #0d0d1a 50%, #060609 100%)',
        }}
      >
        {/* Draggable canvas — pointer events HERE (not on viewport) */}
        <div
          ref={canvasRef}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            willChange: 'transform',
            touchAction: 'none',
          }}
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
        >
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block">
            <defs>
              <linearGradient id="goldPath" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FCA929" />
                <stop offset="100%" stopColor="#FA7B21" />
              </linearGradient>
              <radialGradient id="currentGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </radialGradient>
            </defs>

            {/* Mountain silhouettes */}
            <path
              d={`M0,${H * 0.78} Q${W * 0.15},${H * 0.58} ${W * 0.3},${H * 0.7} T${W * 0.6},${H * 0.65} T${W},${H * 0.72} L${W},${H} L0,${H} Z`}
              fill="rgba(255,255,255,0.015)"
            />
            <path
              d={`M0,${H * 0.85} Q${W * 0.3},${H * 0.72} ${W * 0.5},${H * 0.79} T${W * 0.8},${H * 0.74} T${W},${H * 0.82} L${W},${H} L0,${H} Z`}
              fill="rgba(255,255,255,0.01)"
            />

            {/* Background stars */}
            {STARS.map(s => (
              <circle key={s.id} cx={s.cx % W} cy={s.cy % H} r={s.r} fill="white" opacity={s.opacity}>
                <animate attributeName="opacity" values={`${s.opacity};${s.opacity * 0.3};${s.opacity}`} dur={`${s.dur}s`} repeatCount="indefinite" />
              </circle>
            ))}

            {/* Glow around current node */}
            {currentIdx >= 0 && (
              <circle cx={points[currentIdx].x} cy={points[currentIdx].y} r={140} fill="url(#currentGlow)" />
            )}

            {/* Paths */}
            {points.map((pos, i) => {
              if (i >= points.length - 1) return null;
              const completed = ruta.clases[i].estado === 'completado' && ruta.clases[i + 1].estado !== 'bloqueado';
              return <CaminoAnimado key={`p-${i}`} from={pos} to={points[i + 1]} completado={completed} />;
            })}

            {/* Nodes */}
            {ruta.clases.map((clase, i) => (
              <NodoClase
                key={clase.id}
                clase={clase}
                color={color}
                position={points[i]}
                onClick={() => { if (!moved.current) onSelectClase(clase.id); }}
                isCurrent={i === currentIdx}
              />
            ))}
          </svg>
        </div>

        {/* ── Zoom controls (OUTSIDE draggable canvas, inside viewport) ── */}
        <div className="absolute bottom-6 right-4 flex flex-col gap-2 z-50">
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={zoomIn}
            className="w-12 h-12 rounded-2xl bg-zinc-800/90 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-zinc-700 active:scale-90 transition-all shadow-xl"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={zoomOut}
            className="w-12 h-12 rounded-2xl bg-zinc-800/90 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-zinc-700 active:scale-90 transition-all shadow-xl"
          >
            <Minus className="w-5 h-5" />
          </button>
          <div className="h-1" />
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={centerOnCurrent}
            className="w-12 h-12 rounded-2xl bg-[#FA7B21]/90 backdrop-blur-md border border-[#FCA929]/30 flex items-center justify-center text-white hover:bg-[#FA7B21] active:scale-90 transition-all shadow-xl shadow-[#FA7B21]/20"
          >
            <Locate className="w-5 h-5" />
          </button>
        </div>

        {/* Hint text */}
        <div className="absolute bottom-6 left-4 z-50 pointer-events-none">
          <p className="text-white/20 text-[10px]">Arrastra para mover · Pellizca para zoom</p>
        </div>
      </div>
    </div>
  );
}
