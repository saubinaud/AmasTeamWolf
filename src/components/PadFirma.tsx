import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eraser, PenLine, Undo2, X } from 'lucide-react';
import { cx } from './matricula/tokens';

// Firma a pantalla completa para tablet y teléfono, en vertical u horizontal.
//
// Los trazos se guardan como puntos en un espacio "lógico" (el tamaño del lienzo
// al primer trazo). Si la pantalla gira o cambia de tamaño, el lienzo se rehace
// con el devicePixelRatio nuevo y los trazos se vuelven a dibujar escalados y
// centrados: no se pierde ni se deforma la firma. Deshacer quita el último trazo.

type Punto = { x: number; y: number };
type Trazo = Punto[];

const TINTA = '#111111';
const GROSOR = 2.6;

/** Exporta los trazos recortados a su caja, sobre blanco, en JPEG liviano. */
function exportar(trazos: Trazo[]): string {
  const pts = trazos.flat();
  const minX = Math.min(...pts.map((p) => p.x));
  const maxX = Math.max(...pts.map((p) => p.x));
  const minY = Math.min(...pts.map((p) => p.y));
  const maxY = Math.max(...pts.map((p) => p.y));
  const margen = 12;
  const ancho = Math.max(maxX - minX, 1) + margen * 2;
  const alto = Math.max(maxY - minY, 1) + margen * 2;
  const escala = Math.min(2, 800 / ancho);
  const c = document.createElement('canvas');
  c.width = Math.round(ancho * escala);
  c.height = Math.round(alto * escala);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.setTransform(escala, 0, 0, escala, (margen - minX) * escala, (margen - minY) * escala);
  pintar(ctx, trazos, GROSOR);
  return c.toDataURL('image/jpeg', 0.85);
}

function pintar(ctx: CanvasRenderingContext2D, trazos: Trazo[], grosor: number) {
  ctx.strokeStyle = TINTA;
  ctx.fillStyle = TINTA;
  ctx.lineWidth = grosor;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const t of trazos) {
    if (t.length === 1) {
      ctx.beginPath();
      ctx.arc(t[0].x, t[0].y, grosor / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(t[0].x, t[0].y);
    for (let i = 1; i < t.length; i++) ctx.lineTo(t[i].x, t[i].y);
    ctx.stroke();
  }
}

const BOTON_BARRA =
  'inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 text-[14px] font-bold text-white/80 ' +
  'hover:bg-white/10 active:bg-white/15 disabled:opacity-30';

export function PadFirma({ nombre, onCerrar, onListo }: {
  nombre?: string;
  onCerrar: () => void;
  /** Firma en data URL (JPEG) */
  onListo: (firma: string) => void;
}) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const capa = useRef<HTMLDivElement>(null);
  const trazos = useRef<Trazo[]>([]);
  const actual = useRef<Trazo | null>(null);
  const base = useRef<{ w: number; h: number } | null>(null); // espacio lógico
  const vista = useRef({ s: 1, ox: 0, oy: 0 });
  const [cuantos, setCuantos] = useState(0);

  const redibujar = useCallback(() => {
    const canvas = lienzo.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const r = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    if (!base.current || trazos.current.length === 0) base.current = { w: r.width, h: r.height };
    const s = Math.min(r.width / base.current.w, r.height / base.current.h);
    vista.current = { s, ox: (r.width - base.current.w * s) / 2, oy: (r.height - base.current.h * s) / 2 };
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * vista.current.ox, dpr * vista.current.oy);
    pintar(ctx, trazos.current, GROSOR / s);
  }, []);

  // Lienzo nítido, se rehace al girar o cambiar el tamaño
  useEffect(() => {
    const canvas = lienzo.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => redibujar());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [redibujar]);

  // Mientras está abierta: la página no se mueve, Esc cierra
  useEffect(() => {
    const html = document.documentElement;
    const antes = { overflow: document.body.style.overflow, overscroll: html.style.overscrollBehavior };
    document.body.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';
    const bloquear = (e: TouchEvent) => { if (e.cancelable) e.preventDefault(); };
    const el = capa.current;
    el?.addEventListener('touchmove', bloquear, { passive: false });
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', esc);
    return () => {
      document.body.style.overflow = antes.overflow;
      html.style.overscrollBehavior = antes.overscroll;
      el?.removeEventListener('touchmove', bloquear);
      document.removeEventListener('keydown', esc);
    };
  }, [onCerrar]);

  const aLogico = (e: React.PointerEvent<HTMLCanvasElement>): Punto => {
    const r = e.currentTarget.getBoundingClientRect();
    const { s, ox, oy } = vista.current;
    return { x: (e.clientX - r.left - ox) / s, y: (e.clientY - r.top - oy) / s };
  };

  const dibujarSegmento = (a: Punto, b: Punto) => {
    const ctx = lienzo.current?.getContext('2d');
    if (!ctx) return;
    const s = vista.current.s;
    ctx.strokeStyle = TINTA;
    ctx.lineWidth = GROSOR / s;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  };

  const empezar = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!e.isPrimary) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = aLogico(e);
    actual.current = [p];
    trazos.current.push(actual.current);
    dibujarSegmento(p, { x: p.x + 0.01, y: p.y + 0.01 });
  };
  const mover = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!actual.current || !e.isPrimary) return;
    e.preventDefault();
    // Eventos agrupados: trazo continuo con el Apple Pencil
    const eventos = typeof e.nativeEvent.getCoalescedEvents === 'function' ? e.nativeEvent.getCoalescedEvents() : [];
    const lista = eventos.length ? eventos : [e.nativeEvent];
    const r = e.currentTarget.getBoundingClientRect();
    const { s, ox, oy } = vista.current;
    for (const ev of lista) {
      const p = { x: (ev.clientX - r.left - ox) / s, y: (ev.clientY - r.top - oy) / s };
      const previo = actual.current[actual.current.length - 1];
      dibujarSegmento(previo, p);
      actual.current.push(p);
    }
  };
  const soltar = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!actual.current) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    actual.current = null;
    setCuantos(trazos.current.length);
  };

  const deshacer = () => { trazos.current.pop(); setCuantos(trazos.current.length); redibujar(); };
  const limpiar = () => { trazos.current = []; setCuantos(0); redibujar(); };
  const listo = () => { if (trazos.current.length) onListo(exportar(trazos.current)); };

  return createPortal(
    <div
      ref={capa}
      role="dialog"
      aria-modal="true"
      aria-label="Firma del apoderado"
      className={`fixed inset-0 z-[9999] flex flex-col ${cx.pagina}`}
      style={{ touchAction: 'none', height: '100dvh' }}
    >
      <div className="flex items-center gap-1 px-3 sm:px-4 py-2 bg-white/5 border-b border-white/10 shrink-0 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="min-w-0 flex-1">
          <p className={cx.h2}>Firma del apoderado</p>
          {nombre && <p className={`${cx.textoApagado} text-[13px] truncate`}>{nombre}</p>}
        </div>
        <button type="button" aria-label="Deshacer" onClick={deshacer} disabled={!cuantos} className={BOTON_BARRA}>
          <Undo2 className="h-4 w-4" /> <span className="hidden sm:inline">Deshacer</span>
        </button>
        <button type="button" aria-label="Limpiar" onClick={limpiar} disabled={!cuantos} className={BOTON_BARRA}>
          <Eraser className="h-4 w-4" /> <span className="hidden sm:inline">Limpiar</span>
        </button>
        <button type="button" onClick={onCerrar} className={`${BOTON_BARRA} w-11 justify-center px-0`} aria-label="Cerrar sin firmar">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 p-3 sm:p-6 min-h-0">
        <div className="relative h-full overflow-hidden rounded-2xl bg-white">
          <canvas
            ref={lienzo}
            data-testid="pad-firma"
            className="absolute inset-0 w-full h-full cursor-crosshair"
            style={{ touchAction: 'none' }}
            onPointerDown={empezar}
            onPointerMove={mover}
            onPointerUp={soltar}
            onPointerCancel={soltar}
          />
          <div className="pointer-events-none absolute left-6 right-6 sm:left-10 sm:right-10 bottom-[24%] border-b-2 border-dashed border-stone-200" />
          {!cuantos && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-stone-400">
              <PenLine className="h-8 w-8" />
              <span className="text-[15px]">Firma aquí con el dedo</span>
              <span className="hidden max-sm:portrait:block text-xs">Si giras el teléfono, firmas más cómodo</span>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 flex gap-3 px-4 pt-3 bg-white/5 border-t border-white/10 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button type="button" onClick={onCerrar} className={`${cx.btnSecundario} flex-1 h-14`}>Volver</button>
        <button type="button" onClick={listo} disabled={!cuantos} className={`${cx.btnPrimario} flex-[2]`}>Listo</button>
      </div>
    </div>,
    document.body,
  );
}
