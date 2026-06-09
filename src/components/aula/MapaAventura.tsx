import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ArrowLeft, Loader2, Plus, Minus, Crosshair } from 'lucide-react';
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

interface RutaApiResponse {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string;
  cinturon_asociado: string;
  imagen_portada: string;
  color_primario: string;
}

interface MapaAventuraProps {
  rutaId: number;
  onSelectClase: (claseId: number) => void;
  onBack: () => void;
}

// ── Background stars (static, generated once) ──────────────────

const BG_STARS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  cx: Math.random() * 1200,
  cy: Math.random() * 2000,
  r: 0.8 + Math.random() * 1.5,
  opacity: 0.08 + Math.random() * 0.2,
  dur: 3 + Math.random() * 5,
}));

// ── Zoom bounds ────────────────────────────────────────────────

const SCALE_MIN = 0.35;
const SCALE_MAX = 2.5;
const clampScale = (s: number) => Math.min(SCALE_MAX, Math.max(SCALE_MIN, s));

// ── Path generation ────────────────────────────────────────────

function generateMapLayout(count: number) {
  const CANVAS_W = 1000;
  const CANVAS_H = Math.max(900, count * 160 + 300);
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i < count; i++) {
    const progress = count <= 1 ? 0.5 : i / (count - 1);
    // Winding sine wave path going upward through the canvas
    const x = CANVAS_W / 2 + Math.sin(progress * Math.PI * 2.5) * (CANVAS_W * 0.28);
    const y = CANVAS_H - 150 - progress * (CANVAS_H - 300);
    points.push({ x, y });
  }

  return { points, canvasW: CANVAS_W, canvasH: CANVAS_H };
}

// ── Mountain silhouettes (SVG paths) ───────────────────────────

function MountainSilhouettes({ w, h }: { w: number; h: number }) {
  const h80 = h * 0.8;
  const h85 = h * 0.85;
  const h90 = h * 0.9;
  return (
    <g>
      <path
        d={`M0,${h80} Q${w * 0.15},${h * 0.6} ${w * 0.3},${h * 0.72} T${w * 0.6},${h * 0.68} T${w},${h * 0.75} L${w},${h} L0,${h} Z`}
        fill="rgba(255,255,255,0.018)"
      />
      <path
        d={`M0,${h85} Q${w * 0.25},${h * 0.7} ${w * 0.45},${h * 0.78} T${w * 0.75},${h * 0.73} T${w},${h * 0.8} L${w},${h} L0,${h} Z`}
        fill="rgba(255,255,255,0.012)"
      />
      <path
        d={`M0,${h90} Q${w * 0.35},${h * 0.82} ${w * 0.55},${h * 0.86} T${w * 0.85},${h * 0.83} T${w},${h * 0.88} L${w},${h} L0,${h} Z`}
        fill="rgba(255,255,255,0.008)"
      />
    </g>
  );
}

// ── Component ──────────────────────────────────────────────────

export function MapaAventura({ rutaId, onSelectClase, onBack }: MapaAventuraProps) {
  const [ruta, setRuta] = useState<RutaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pan & Zoom state
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const hasDragged = useRef(false);

  // Pinch zoom tracking
  const pinchRef = useRef({ dist: 0, scale: 1 });

  // ── Data fetching ──────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    const fetchRuta = async () => {
      try {
        const token = localStorage.getItem('amasToken');
        const res = await fetch(`${API_BASE}/clases/ruta/${rutaId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Error al cargar ruta');
        if (cancelled) return;
        const payload = json.data || json;
        const apiRuta: RutaApiResponse = payload.ruta;
        const apiClases: ClaseNodo[] = (payload.clases || []).map((c: ClaseNodo) => ({
          ...c,
          estado: c.estado || 'bloqueado',
        }));
        const puntosTotales: number = payload.puntosTotales || 0;

        setRuta({
          id: apiRuta.id,
          nombre: apiRuta.nombre,
          color: apiRuta.color_primario || '#FA7B21',
          cinturon: apiRuta.cinturon_asociado || '',
          clases: apiClases,
          progreso: {
            completadas: apiClases.filter((c: ClaseNodo) => c.estado === 'completado').length,
            total: apiClases.length,
            puntos: puntosTotales,
          },
        });
        setError('');
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error de conexion');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchRuta();
    return () => { cancelled = true; };
  }, [rutaId]);

  // ── Layout ─────────────────────────────────────────────────

  const layout = useMemo(
    () => ruta ? generateMapLayout(ruta.clases.length) : null,
    [ruta?.clases.length],
  );

  // ── Center on current node ─────────────────────────────────

  const centerOnCurrent = useCallback(() => {
    if (!ruta || !layout || !containerRef.current) return;
    const idx = ruta.clases.findIndex(c => c.estado === 'disponible');
    const target = idx >= 0 ? layout.points[idx] : layout.points[layout.points.length - 1];
    if (!target) return;

    const rect = containerRef.current.getBoundingClientRect();
    const s = clampScale(0.7);
    setScale(s);
    setOffset({
      x: rect.width / 2 - target.x * s,
      y: rect.height / 2 - target.y * s,
    });
  }, [ruta, layout]);

  // Auto-center on first load
  useEffect(() => {
    if (ruta && layout) {
      // Small delay so the container has dimensions
      requestAnimationFrame(centerOnCurrent);
    }
  }, [ruta, layout, centerOnCurrent]);

  // ── Pointer events (drag) ─────────────────────────────────

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only handle primary button / single touch
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    setIsDragging(true);
    hasDragged.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [offset]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged.current = true;
    setOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // ── Touch events (pinch zoom) ─────────────────────────────

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.hypot(dx, dy), scale };
    }
  }, [scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.hypot(dx, dy);
      const ratio = newDist / (pinchRef.current.dist || 1);
      setScale(clampScale(pinchRef.current.scale * ratio));
    }
  }, []);

  // ── Wheel zoom ────────────────────────────────────────────

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.92 : 1.08;
      setScale(s => clampScale(s * factor));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // ── Zoom buttons ──────────────────────────────────────────

  const zoomIn = useCallback(() => setScale(s => clampScale(s * 1.3)), []);
  const zoomOut = useCallback(() => setScale(s => clampScale(s * 0.7)), []);

  // ── Render ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#FA7B21] animate-spin" />
      </div>
    );
  }

  if (error || !ruta) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-red-400 text-center">{error || 'Ruta no encontrada'}</p>
        <button onClick={onBack} className="text-[#FA7B21] font-medium hover:underline">
          Volver
        </button>
      </div>
    );
  }

  const currentIdx = ruta.clases.findIndex(c => c.estado === 'disponible');
  const rutaColor = ruta.color || '#FA7B21';
  const { points, canvasW, canvasH } = layout!;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-md mx-auto px-4 py-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors min-h-[44px] min-w-[44px]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-white font-bold text-base">{ruta.nombre}</h1>
            <div className="w-11" />
          </div>
          <ProgresoBar
            completadas={ruta.progreso.completadas}
            total={ruta.progreso.total}
            puntos={ruta.progreso.puntos}
            color={rutaColor}
          />
        </div>
      </div>

      {/* ── Map viewport ── */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden select-none"
        style={{
          touchAction: 'none',
          background: 'radial-gradient(ellipse at 50% 30%, #1a1a2e 0%, #0a0a0f 70%, #050508 100%)',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {/* Transformed canvas */}
        <div
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            willChange: 'transform',
          }}
        >
          <svg
            width={canvasW}
            height={canvasH}
            viewBox={`0 0 ${canvasW} ${canvasH}`}
            className="block"
          >
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FCA929" />
                <stop offset="100%" stopColor="#FA7B21" />
              </linearGradient>
              <radialGradient id="fogGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={rutaColor} stopOpacity={0.12} />
                <stop offset="100%" stopColor={rutaColor} stopOpacity={0} />
              </radialGradient>
              <filter id="goldGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Mountain silhouettes */}
            <MountainSilhouettes w={canvasW} h={canvasH} />

            {/* Background twinkling stars */}
            {BG_STARS.map(star => (
              <circle
                key={star.id}
                cx={star.cx % canvasW}
                cy={star.cy % canvasH}
                r={star.r}
                fill="white"
                opacity={star.opacity}
                className="animate-pulse-slow"
                style={{ animationDuration: `${star.dur}s`, animationDelay: `${star.dur * 0.3}s` }}
              />
            ))}

            {/* Ambient fog glow near current node */}
            {currentIdx >= 0 && (
              <circle
                cx={points[currentIdx].x}
                cy={points[currentIdx].y}
                r={120}
                fill="url(#fogGlow)"
              />
            )}

            {/* Paths between nodes */}
            {points.map((pos, i) => {
              if (i >= points.length - 1) return null;
              const nextPos = points[i + 1];
              const isCompletedPath =
                ruta.clases[i].estado === 'completado' &&
                ruta.clases[i + 1].estado !== 'bloqueado';
              return (
                <CaminoAnimado
                  key={`path-${i}`}
                  from={pos}
                  to={nextPos}
                  completado={isCompletedPath}
                />
              );
            })}

            {/* Nodes */}
            {ruta.clases.map((clase, i) => (
              <NodoClase
                key={clase.id}
                clase={clase}
                color={rutaColor}
                position={points[i]}
                onClick={() => {
                  if (!hasDragged.current) onSelectClase(clase.id);
                }}
                isCurrent={i === currentIdx}
              />
            ))}
          </svg>
        </div>

        {/* ── Zoom controls ── */}
        <div className="absolute bottom-24 right-4 flex flex-col gap-2 z-30">
          <button
            onClick={zoomIn}
            className="w-11 h-11 rounded-full bg-zinc-800/80 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-zinc-700/80 active:scale-95 transition-all"
            aria-label="Acercar"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={zoomOut}
            className="w-11 h-11 rounded-full bg-zinc-800/80 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-zinc-700/80 active:scale-95 transition-all"
            aria-label="Alejar"
          >
            <Minus className="w-5 h-5" />
          </button>
          <button
            onClick={centerOnCurrent}
            className="w-11 h-11 rounded-full bg-zinc-800/80 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-zinc-700/80 active:scale-95 transition-all"
            aria-label="Centrar en clase actual"
          >
            <Crosshair className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
