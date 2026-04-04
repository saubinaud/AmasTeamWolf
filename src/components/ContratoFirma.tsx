import { useState, useRef, useEffect, useCallback } from 'react';
import { FileText, Eraser, CheckCircle, ChevronDown, ChevronUp, User, GraduationCap, Calendar, DollarSign, Pen } from 'lucide-react';
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
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [firmado, setFirmado] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [aceptado, setAceptado] = useState(false);
  const [clausulasAbiertas, setClausulasAbiertas] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  // ── CANVAS SETUP (High-DPI) ──
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => {
    initCanvas();
    // Re-init on resize (orientation change on mobile)
    window.addEventListener('resize', initCanvas);
    return () => window.removeEventListener('resize', initCanvas);
  }, [initCanvas]);

  // ── BLOCK PAGE SCROLL WHILE SIGNING ──
  // This is critical on mobile: when user draws on canvas, page must not scroll
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const preventScroll = (e: TouchEvent) => {
      if (isDrawing) {
        e.preventDefault();
      }
    };

    // Must be non-passive to be able to preventDefault
    container.addEventListener('touchmove', preventScroll, { passive: false });
    return () => container.removeEventListener('touchmove', preventScroll);
  }, [isDrawing]);

  // Also lock body scroll while drawing
  useEffect(() => {
    if (isDrawing) {
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
  }, [isDrawing]);

  // ── DRAWING HANDLERS ──
  const getPos = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  }, []);

  const startDrawing = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || firmado) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  }, [getPos, firmado]);

  const draw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasStrokes(true);
  }, [isDrawing, getPos]);

  const stopDrawing = useCallback((e?: React.TouchEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsDrawing(false);
  }, []);

  const limpiarFirma = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasStrokes(false);
    setFirmado(false);
  };

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
    'POLÍTICA DE NO CANCELACIONES Y NO REEMBOLSOS. Una vez realizado el pago, no se aceptarán cancelaciones ni se realizarán devoluciones. La inasistencia no genera derecho a clases de recuperación.',
    'EXCEPCIONES. AMAS Team Wolf podrá ofrecer congelamiento temporal por razones de salud con certificado médico, sujeto a aprobación de la dirección.',
    'HORARIOS. La academia puede modificar horarios con al menos 48 horas de anticipación.',
    'ESTADO DE SALUD. El apoderado declara que el alumno se encuentra apto para la práctica de artes marciales.',
    'AUTORIZACIÓN DE IMAGEN. Se autoriza el uso de fotografías y videos del menor para fines institucionales y promocionales.',
    'RESPONSABILIDAD. La academia no se responsabiliza por objetos olvidados en las instalaciones.',
    'CONFIDENCIALIDAD. El apoderado se compromete a no divulgar la metodología ni información interna de AMAS Team Wolf.',
    'LEY APLICABLE. Las partes se someten a la legislación civil peruana y tribunales de Lima.',
  ];

  return (
    <div className="space-y-3">
      {/* ── HEADER ── */}
      <div className="flex items-center gap-2.5 pb-1">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FA7B21] to-[#FCA929] flex items-center justify-center">
          <FileText className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-white text-sm font-semibold">Contrato de Inscripción</h3>
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
            <p className="text-white text-sm font-medium truncate">{d.nombrePadre || '—'}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-white/50 text-[11px]">
              <span>DNI: {d.dniPadre || '—'}</span>
              {d.telefono && <span>Tel: {d.telefono}</span>}
            </div>
          </div>
        </div>

        {/* Alumno */}
        <div className="p-3 flex items-start gap-3">
          <GraduationCap className="w-4 h-4 text-[#FCA929] mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Alumno</p>
            <p className="text-white text-sm font-medium truncate">{d.nombreAlumno || '—'}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-white/50 text-[11px]">
              <span>DNI: {d.dniAlumno || '—'}</span>
              {d.categoriaAlumno && <span>{d.categoriaAlumno}</span>}
            </div>
          </div>
        </div>

        {/* Programa */}
        <div className="p-3 flex items-start gap-3">
          <Calendar className="w-4 h-4 text-[#FCA929] mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Programa</p>
            <p className="text-white text-sm font-medium">{d.programa || '—'}</p>
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
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Inversión</p>
            <div className="flex items-baseline gap-2">
              <span className="text-white text-lg font-bold">S/ {d.total || d.precioPrograma || '0'}</span>
              {d.descuentoDinero != null && d.descuentoDinero > 0 && (
                <span className="text-green-400 text-xs">(-S/ {d.descuentoDinero} desc.)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── CLÁUSULAS (colapsable) ── */}
      <button
        type="button"
        onClick={() => setClausulasAbiertas(!clausulasAbiertas)}
        className="w-full flex items-center justify-between bg-zinc-800/30 border border-white/5 rounded-lg px-3 py-2.5 text-left group"
      >
        <span className="text-white/50 text-xs group-hover:text-white/70 transition-colors">
          Ver términos y condiciones ({clausulas.length} cláusulas)
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

      {/* ── DECLARACIÓN ── */}
      <div className="bg-zinc-800/30 border border-white/10 rounded-xl p-3">
        <p className="text-white/60 text-xs leading-relaxed">
          Yo, <strong className="text-white">{d.nombrePadre || '___'}</strong>, con DNI{' '}
          <strong className="text-white">{d.dniPadre || '___'}</strong>, declaro haber leído y aceptado
          todas las condiciones del presente contrato, incluyendo la <strong className="text-amber-400">Cláusula 4
          (no cancelaciones y no reembolsos)</strong>, para la inscripción de{' '}
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
          He leído y acepto los términos y condiciones del contrato.
        </span>
      </label>

      {/* ── PAD DE FIRMA ── */}
      {aceptado && !firmado && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Pen className="w-3.5 h-3.5 text-[#FCA929]" />
              <span className="text-white text-xs font-semibold">Firma del apoderado</span>
            </div>
            {hasStrokes && (
              <button
                type="button"
                onClick={limpiarFirma}
                className="flex items-center gap-1 text-white/40 hover:text-red-400 text-[11px] transition-colors"
              >
                <Eraser className="w-3 h-3" /> Limpiar
              </button>
            )}
          </div>

          <div
            ref={canvasContainerRef}
            className="relative rounded-xl overflow-hidden border-2 border-dashed border-[#FA7B21]/40 bg-white"
            style={{ touchAction: 'none' }}
          >
            <canvas
              ref={canvasRef}
              className="w-full cursor-crosshair"
              style={{ height: '200px', touchAction: 'none' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasStrokes && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <Pen className="w-6 h-6 text-zinc-300 mb-2" />
                <span className="text-zinc-400 text-sm">Firma aquí con tu dedo</span>
              </div>
            )}
          </div>

          <Button
            type="button"
            onClick={confirmarFirma}
            disabled={!hasStrokes}
            className="w-full h-12 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white text-sm font-semibold disabled:opacity-30"
          >
            Confirmar firma y generar contrato
          </Button>
        </div>
      )}

      {/* ── ESTADO FIRMADO ── */}
      {firmado && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
          <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-green-400 text-sm font-semibold">
            {generandoPDF ? 'Generando contrato PDF...' : 'Contrato firmado correctamente'}
          </p>
          <p className="text-white/40 text-[11px] mt-1">El PDF se enviará a tu correo con la confirmación</p>
        </div>
      )}
    </div>
  );
}
