import { useState, useRef, useEffect, useCallback } from 'react';
import { FileText, Eraser, Download, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [firmado, setFirmado] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [aceptado, setAceptado] = useState(false);
  const [contratoAbierto, setContratoAbierto] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    // Style
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
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
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  }, [getPos]);

  const draw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasStrokes(true);
  }, [isDrawing, getPos]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const limpiarFirma = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
    setFirmado(false);
  };

  const confirmarFirma = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokes) return;

    const firmaBase64 = canvas.toDataURL('image/png');
    setFirmado(true);
    onFirmaCompleta(firmaBase64);

    // Generar PDF
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

  const clausulas = [
    'Respetar los horarios establecidos y comunicar inasistencias con anticipación.',
    'La matrícula incluye uso de instalaciones durante clases programadas.',
    'No se realizan devoluciones por retiro voluntario. Las clases no son transferibles.',
    'La academia puede modificar horarios con 48 horas de anticipación.',
    'Se autoriza el uso de fotografías y videos para fines institucionales.',
    'La academia no se responsabiliza por objetos olvidados en las instalaciones.',
    'El apoderado declara que el alumno está en condiciones de salud aptas para artes marciales.',
    'El contrato tiene vigencia desde la fecha de inicio hasta el fin del programa.',
  ];

  return (
    <div className="space-y-4">
      {/* Toggle contrato */}
      <button
        type="button"
        onClick={() => setContratoAbierto(!contratoAbierto)}
        className="w-full flex items-center justify-between bg-zinc-800/60 border border-white/10 rounded-xl px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#FCA929]" />
          <span className="text-white text-sm font-medium">Contrato de inscripción</span>
        </div>
        {contratoAbierto
          ? <ChevronUp className="w-4 h-4 text-white/50" />
          : <ChevronDown className="w-4 h-4 text-white/50" />
        }
      </button>

      {/* Cláusulas (colapsable) */}
      {contratoAbierto && (
        <div className="bg-zinc-800/40 border border-white/10 rounded-xl p-4 max-h-48 overflow-y-auto">
          <h4 className="text-white/80 text-xs font-bold mb-2 uppercase tracking-wider">Términos y condiciones</h4>
          <ol className="space-y-2 text-white/60 text-xs list-decimal list-inside">
            {clausulas.map((c, i) => (
              <li key={i} className="leading-relaxed">{c}</li>
            ))}
          </ol>
          <div className="mt-3 pt-3 border-t border-white/10 text-white/70 text-xs">
            <p>
              Yo, <strong className="text-white">{datos.nombrePadre || '___'}</strong>, con DNI{' '}
              <strong className="text-white">{datos.dniPadre || '___'}</strong>, acepto inscribir a{' '}
              <strong className="text-white">{datos.nombreAlumno || '___'}</strong> en el programa{' '}
              <strong className="text-white">{datos.programa || '___'}</strong> de AMAS Team Wolf.
            </p>
          </div>
        </div>
      )}

      {/* Pad de firma */}
      <div className="bg-zinc-800/60 border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/70 text-xs font-medium">Firma del apoderado</span>
          {hasStrokes && !firmado && (
            <button
              type="button"
              onClick={limpiarFirma}
              className="flex items-center gap-1 text-white/40 hover:text-white/70 text-xs transition-colors"
            >
              <Eraser className="w-3 h-3" /> Limpiar
            </button>
          )}
        </div>

        <div className={`relative rounded-lg overflow-hidden border-2 border-dashed ${
          firmado ? 'border-green-500/50 bg-green-500/5' : 'border-white/20 bg-white'
        }`}>
          <canvas
            ref={canvasRef}
            className={`w-full touch-none ${firmado ? 'opacity-70 pointer-events-none' : 'cursor-crosshair'}`}
            style={{ height: '120px' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {!hasStrokes && !firmado && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-zinc-400 text-sm">Dibuja tu firma aquí</span>
            </div>
          )}
          {firmado && (
            <div className="absolute top-2 right-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          )}
        </div>
      </div>

      {/* Checkbox acepto */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={aceptado}
          onChange={(e) => setAceptado(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-white/30 bg-zinc-800 text-[#FA7B21] focus:ring-[#FA7B21]/50"
        />
        <span className="text-white/70 text-xs leading-relaxed">
          He leído y acepto los términos y condiciones del contrato de inscripción de AMAS Team Wolf.
        </span>
      </label>

      {/* Botón confirmar firma */}
      {!firmado && (
        <Button
          type="button"
          onClick={confirmarFirma}
          disabled={!hasStrokes || !aceptado}
          className="w-full h-11 bg-zinc-700 hover:bg-zinc-600 text-white text-sm disabled:opacity-30"
        >
          Confirmar firma
        </Button>
      )}

      {firmado && (
        <div className="flex items-center gap-2 text-green-400 text-sm justify-center py-1">
          <CheckCircle className="w-4 h-4" />
          <span>{generandoPDF ? 'Generando contrato PDF...' : 'Contrato firmado'}</span>
        </div>
      )}
    </div>
  );
}
