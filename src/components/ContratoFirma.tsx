import { useState, useRef, useEffect, useCallback } from 'react';
import { FileText, Eraser, CheckCircle, ChevronDown, ChevronUp, User, GraduationCap, Calendar, DollarSign, Pen, Maximize2, X } from 'lucide-react';
import { Button } from './ui/button';
import { API_BASE } from '../config/api';

interface ContratoFirmaProps {
  datos: {
    nombrePadre: string;
    dniPadre: string;
    email: string;
    telefono?: string;
    direccion?: string;
    nombreAlumno: string;
    dniAlumno: string;
    fechaNacimiento?: string;
    categoriaAlumno?: string;
    programa: string;
    fechaInicio?: string;
    fechaFin?: string;
    clasesTotales?: number;
    turnoSeleccionado?: string;
    diasTentativos?: string;
    precioPrograma?: number;
    descuentoDinero?: number;
    total?: number;
  };
  onFirmaCompleta: (firmaBase64: string) => void;
  onContratoGenerado?: (pdfBase64: string) => void;
}

export function ContratoFirma({ datos, onFirmaCompleta, onContratoGenerado }: ContratoFirmaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fullscreenCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [firmado, setFirmado] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [aceptado, setAceptado] = useState(false);
  const [clausulasAbiertas, setClausulasAbiertas] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);

  // Track which canvas is active (inline vs fullscreen)
  const activeCanvasRef = useCallback(() => {
    return fullscreenMode ? fullscreenCanvasRef.current : canvasRef.current;
  }, [fullscreenMode]);

  // ── CANVAS SETUP (High-DPI) ──
  const initCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Set the internal resolution to match the CSS size * DPR
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Scale the context so drawing operations use CSS pixel coordinates
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const initInlineCanvas = useCallback(() => {
    initCanvas(canvasRef.current);
  }, [initCanvas]);

  const initFullscreenCanvas = useCallback(() => {
    initCanvas(fullscreenCanvasRef.current);
  }, [initCanvas]);

  // Init inline canvas on mount and resize
  useEffect(() => {
    initInlineCanvas();
    window.addEventListener('resize', initInlineCanvas);
    return () => window.removeEventListener('resize', initInlineCanvas);
  }, [initInlineCanvas]);

  // Init fullscreen canvas when fullscreen mode opens
  useEffect(() => {
    if (fullscreenMode) {
      // Use a rAF to ensure the DOM has laid out the fullscreen overlay
      const frameId = requestAnimationFrame(() => {
        initFullscreenCanvas();
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [fullscreenMode, initFullscreenCanvas]);

  // ── BLOCK PAGE SCROLL WHILE SIGNING ──
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const preventScroll = (e: TouchEvent) => {
      if (isDrawing) {
        e.preventDefault();
      }
    };

    container.addEventListener('touchmove', preventScroll, { passive: false });
    return () => container.removeEventListener('touchmove', preventScroll);
  }, [isDrawing]);

  // Lock body scroll while drawing or in fullscreen mode
  useEffect(() => {
    if (isDrawing || fullscreenMode) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isDrawing, fullscreenMode]);

  // ── POINTER EVENT DRAWING HANDLERS ──
  // Using Pointer Events instead of Touch/Mouse events fixes Apple Pencil offset
  const getPos = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const startDrawing = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const canvas = e.currentTarget;
    // Capture pointer so moves outside the canvas still register
    canvas.setPointerCapture(e.pointerId);
    const ctx = canvas.getContext('2d');
    if (!ctx || firmado) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  }, [getPos, firmado]);

  const draw = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDrawing) return;
    const canvas = e.currentTarget;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasStrokes(true);
  }, [isDrawing, getPos]);

  const stopDrawing = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const canvas = e.currentTarget;
    canvas.releasePointerCapture(e.pointerId);
    setIsDrawing(false);
  }, []);

  const limpiarFirma = useCallback(() => {
    // Clear both canvases
    [canvasRef.current, fullscreenCanvasRef.current].forEach((canvas) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    });
    setHasStrokes(false);
    setFirmado(false);
  }, []);

  // ── FULLSCREEN MODE ──
  const openFullscreen = useCallback(() => {
    setFullscreenMode(true);
  }, []);

  const closeFullscreen = useCallback(() => {
    // Copy fullscreen canvas content to inline canvas
    const fsCanvas = fullscreenCanvasRef.current;
    const inlineCanvas = canvasRef.current;
    if (fsCanvas && inlineCanvas) {
      const inlineCtx = inlineCanvas.getContext('2d');
      if (inlineCtx) {
        const dpr = window.devicePixelRatio || 1;
        // Re-init the inline canvas to reset its state
        initCanvas(inlineCanvas);
        // Draw the fullscreen canvas content scaled into the inline canvas
        const inlineW = inlineCanvas.width / dpr;
        const inlineH = inlineCanvas.height / dpr;
        inlineCtx.drawImage(fsCanvas, 0, 0, fsCanvas.width, fsCanvas.height, 0, 0, inlineW, inlineH);
      }
    }
    setFullscreenMode(false);
  }, [initCanvas]);

  const confirmarFirmaFromFullscreen = useCallback(() => {
    const canvas = fullscreenCanvasRef.current;
    if (!canvas || !hasStrokes) return;

    const firmaBase64 = canvas.toDataURL('image/png');
    setFullscreenMode(false);
    setFirmado(true);
    onFirmaCompleta(firmaBase64);

    setGenerandoPDF(true);
    fetch(`${API_BASE}/contratos/generar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ datos, firma_base64: firmaBase64 }),
    })
      .then((resp) => resp.json())
      .then((result) => {
        if (result.success && onContratoGenerado) {
          onContratoGenerado(result.pdf_base64);
        }
      })
      .catch((err) => {
        console.error('Error generando PDF:', err);
      })
      .finally(() => {
        setGenerandoPDF(false);
      });
  }, [hasStrokes, datos, onFirmaCompleta, onContratoGenerado]);

  const confirmarFirma = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokes) return;

    const firmaBase64 = canvas.toDataURL('image/png');
    setFirmado(true);
    onFirmaCompleta(firmaBase64);

    setGenerandoPDF(true);
    try {
      const resp = await fetch(`${API_BASE}/contratos/generar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datos, firma_base64: firmaBase64 }),
      });
      const result = await resp.json();
      if (result.success && onContratoGenerado) {
        onContratoGenerado(result.pdf_base64);
      }
    } catch (err) {
      console.error('Error generando PDF:', err);
    } finally {
      setGenerandoPDF(false);
    }
  };

  const d = datos;
  const hoy = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });

  const clausulas = [
    'OBJETO DEL CONTRATO. AMAS Team Wolf se compromete a brindar al alumno los servicios de enseñanza de Taekwondo conforme al programa seleccionado.',
    'VIGENCIA. El contrato tiene vigencia desde la fecha de inicio hasta la fecha de fin del programa contratado.',
    'PAGO. El monto total deberá abonarse antes del inicio de clases. No se iniciará ningún programa sin confirmación del pago.',
    'POLITICA DE NO CANCELACIONES Y NO REEMBOLSOS. Una vez realizado el pago, no se aceptarán cancelaciones ni se realizarán devoluciones. La inasistencia no genera derecho a clases de recuperación.',
    'EXCEPCIONES. AMAS Team Wolf podrá ofrecer congelamiento temporal por razones de salud con certificado médico, sujeto a aprobación de la dirección.',
    'HORARIOS. La academia puede modificar horarios con al menos 48 horas de anticipación.',
    'ESTADO DE SALUD. El apoderado declara que el alumno se encuentra apto para la práctica de artes marciales.',
    'AUTORIZACION DE IMAGEN. Se autoriza el uso de fotografías y videos del menor para fines institucionales y promocionales.',
    'RESPONSABILIDAD. La academia no se responsabiliza por objetos olvidados en las instalaciones.',
    'CONFIDENCIALIDAD. El apoderado se compromete a no divulgar la metodología ni información interna de AMAS Team Wolf.',
    'LEY APLICABLE. Las partes se someten a la legislación civil peruana y tribunales de Lima.',
  ];

  // Shared canvas props for pointer events
  const canvasPointerProps = {
    onPointerDown: startDrawing,
    onPointerMove: draw,
    onPointerUp: stopDrawing,
    onPointerCancel: stopDrawing,
  };

  return (
    <div className="space-y-3">
      {/* ── HEADER ── */}
      <div className="flex items-center gap-2.5 pb-1">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FA7B21] to-[#FCA929] flex items-center justify-center">
          <FileText className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-white text-sm font-semibold">Contrato de Inscripcion</h3>
          <p className="text-white/40 text-[10px]">Lima, {hoy}</p>
        </div>
      </div>

      {/* ── RESUMEN DE DATOS (auto-llenado) ── */}
      <div className="bg-zinc-800/50 rounded-xl border border-white/10 divide-y divide-white/5">
        {/* Apoderado */}
        <div className="p-3 flex items-start gap-3">
          <User className="w-4 h-4 text-[#FCA929] mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Apoderado</p>
            <p className="text-white text-sm font-medium truncate">{d.nombrePadre || '\u2014'}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-white/50 text-[11px]">
              <span>DNI: {d.dniPadre || '\u2014'}</span>
              {d.telefono && <span>Tel: {d.telefono}</span>}
            </div>
          </div>
        </div>

        {/* Alumno */}
        <div className="p-3 flex items-start gap-3">
          <GraduationCap className="w-4 h-4 text-[#FCA929] mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Alumno</p>
            <p className="text-white text-sm font-medium truncate">{d.nombreAlumno || '\u2014'}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-white/50 text-[11px]">
              <span>DNI: {d.dniAlumno || '\u2014'}</span>
              {d.categoriaAlumno && <span>{d.categoriaAlumno}</span>}
            </div>
          </div>
        </div>

        {/* Programa */}
        <div className="p-3 flex items-start gap-3">
          <Calendar className="w-4 h-4 text-[#FCA929] mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Programa</p>
            <p className="text-white text-sm font-medium">{d.programa || '\u2014'}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-white/50 text-[11px]">
              {d.fechaInicio && <span>Inicio: {d.fechaInicio}</span>}
              {d.fechaFin && <span>Fin: {d.fechaFin}</span>}
              {d.turnoSeleccionado && <span>Turno: {d.turnoSeleccionado}</span>}
              {d.clasesTotales && <span>{d.clasesTotales} clases</span>}
            </div>
          </div>
        </div>

        {/* Precio */}
        <div className="p-3 flex items-start gap-3">
          <DollarSign className="w-4 h-4 text-[#FCA929] mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Inversion</p>
            <div className="flex items-baseline gap-2">
              <span className="text-white text-lg font-bold">S/ {d.total || d.precioPrograma || '0'}</span>
              {d.descuentoDinero != null && d.descuentoDinero > 0 && (
                <span className="text-green-400 text-xs">(-S/ {d.descuentoDinero} desc.)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── CLAUSULAS (colapsable) ── */}
      <button
        type="button"
        onClick={() => setClausulasAbiertas(!clausulasAbiertas)}
        className="w-full flex items-center justify-between bg-zinc-800/30 border border-white/5 rounded-lg px-3 py-2.5 text-left group"
      >
        <span className="text-white/50 text-xs group-hover:text-white/70 transition-colors">
          Ver terminos y condiciones ({clausulas.length} clausulas)
        </span>
        {clausulasAbiertas
          ? <ChevronUp className="w-3.5 h-3.5 text-white/30" />
          : <ChevronDown className="w-3.5 h-3.5 text-white/30" />
        }
      </button>

      {clausulasAbiertas && (
        <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-4 max-h-56 overflow-y-auto space-y-2">
          {clausulas.map((c, i) => {
            const [titulo, ...resto] = c.split('. ');
            return (
              <div key={i} className="text-xs leading-relaxed">
                <span className="text-white/70 font-semibold">{i + 1}. {titulo}.</span>{' '}
                <span className="text-white/45">{resto.join('. ')}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── DECLARACION ── */}
      <div className="bg-zinc-800/30 border border-white/10 rounded-xl p-3">
        <p className="text-white/60 text-xs leading-relaxed">
          Yo, <strong className="text-white">{d.nombrePadre || '___'}</strong>, con DNI{' '}
          <strong className="text-white">{d.dniPadre || '___'}</strong>, declaro haber leido y aceptado
          todas las condiciones del presente contrato, incluyendo la <strong className="text-amber-400">Clausula 4
          (no cancelaciones y no reembolsos)</strong>, para la inscripcion de{' '}
          <strong className="text-white">{d.nombreAlumno || '___'}</strong> en el programa{' '}
          <strong className="text-white">{d.programa || '___'}</strong> de AMAS Team Wolf.
        </p>
      </div>

      {/* ── CHECKBOX ── */}
      <label className="flex items-center gap-3 cursor-pointer py-1">
        <div className="relative flex-shrink-0">
          <input
            type="checkbox"
            checked={aceptado}
            onChange={(e) => setAceptado(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-5 h-5 rounded border-2 border-white/30 bg-zinc-800 peer-checked:bg-[#FA7B21] peer-checked:border-[#FA7B21] transition-all flex items-center justify-center">
            {aceptado && <CheckCircle className="w-3.5 h-3.5 text-white" />}
          </div>
        </div>
        <span className="text-white/70 text-xs leading-snug">
          He leido y acepto los terminos y condiciones del contrato.
        </span>
      </label>

      {/* ── BOTÓN FIRMAR (abre fullscreen) ── */}
      {aceptado && !firmado && (
        <Button
          type="button"
          onClick={openFullscreen}
          className="w-full h-14 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white text-base font-semibold"
        >
          <Pen className="w-5 h-5 mr-2" />
          Firmar contrato
        </Button>
      )}

      {/* Canvas oculto para almacenar la firma (necesario para toDataURL) */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* ── FULLSCREEN SIGNATURE OVERLAY ── */}
      {fullscreenMode && (
        <div
          className="fixed inset-0 z-[9999] bg-white flex flex-col"
          style={{ touchAction: 'none' }}
        >
          {/* Fullscreen header */}
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Pen className="w-4 h-4 text-[#FCA929]" />
              <span className="text-white text-sm font-semibold">Firma del apoderado</span>
            </div>
            <div className="flex items-center gap-3">
              {hasStrokes && (
                <button
                  type="button"
                  onClick={limpiarFirma}
                  className="flex items-center gap-1 text-white/60 hover:text-red-400 text-xs transition-colors"
                >
                  <Eraser className="w-3.5 h-3.5" /> Limpiar
                </button>
              )}
              <button
                type="button"
                onClick={closeFullscreen}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Fullscreen canvas area */}
          <div className="flex-1 relative overflow-hidden">
            <canvas
              ref={fullscreenCanvasRef}
              className="w-full h-full cursor-crosshair absolute inset-0"
              style={{ touchAction: 'none' }}
              {...canvasPointerProps}
            />
            {!hasStrokes && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <Pen className="w-10 h-10 text-zinc-300 mb-3" />
                <span className="text-zinc-400 text-base">Firma aqui</span>
              </div>
            )}
          </div>

          {/* Fullscreen footer */}
          <div className="flex-shrink-0 px-4 py-4 bg-zinc-900" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={closeFullscreen}
                className="flex-1 h-12 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-semibold"
              >
                Volver
              </Button>
              <Button
                type="button"
                onClick={confirmarFirmaFromFullscreen}
                disabled={!hasStrokes}
                className="flex-1 h-12 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white text-sm font-semibold disabled:opacity-30"
              >
                Confirmar firma
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── ESTADO FIRMADO ── */}
      {firmado && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
          <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-green-400 text-sm font-semibold">
            {generandoPDF ? 'Generando contrato PDF...' : 'Contrato firmado correctamente'}
          </p>
          <p className="text-white/40 text-[11px] mt-1">El PDF se enviara a tu correo con la confirmacion</p>
        </div>
      )}
    </div>
  );
}
