import { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { API_BASE } from '../../config/api';
import { NodoClase } from './NodoClase';
import { CaminoAnimado } from './CaminoAnimado';
import { ProgresoBar } from './ProgresoBar';

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
  progreso: {
    completadas: number;
    total: number;
    puntos: number;
  };
}

interface MapaAventuraProps {
  rutaId: number;
  onSelectClase: (claseId: number) => void;
  onBack: () => void;
}

const NODE_SPACING = 120;
const TOP_PADDING = 140;
const BOTTOM_PADDING = 100;

function generatePositions(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    x: i % 2 === 0 ? 30 : 70,
    y: BOTTOM_PADDING + (count - 1 - i) * NODE_SPACING + TOP_PADDING,
  }));
}

export function MapaAventura({ rutaId, onSelectClase, onBack }: MapaAventuraProps) {
  const [ruta, setRuta] = useState<RutaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchRuta = async () => {
    try {
      const token = localStorage.getItem('amasToken');
      const res = await fetch(`${API_BASE}/clases/ruta/${rutaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar ruta');
      setRuta(data.ruta || data);
      setError('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error de conexion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuta();
  }, [rutaId]);

  // Auto-scroll to current node
  useEffect(() => {
    if (!ruta || !scrollRef.current) return;
    const currentIdx = ruta.clases.findIndex(c => c.estado === 'disponible');
    if (currentIdx < 0) return;

    const positions = generatePositions(ruta.clases.length);
    const targetY = positions[currentIdx].y;
    const containerH = scrollRef.current.clientHeight;

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: targetY - containerH / 2,
        behavior: 'smooth',
      });
    });
  }, [ruta]);

  const positions = useMemo(
    () => ruta ? generatePositions(ruta.clases.length) : [],
    [ruta?.clases.length]
  );

  const svgHeight = useMemo(
    () => ruta ? (ruta.clases.length - 1) * NODE_SPACING + TOP_PADDING + BOTTOM_PADDING * 2 + 60 : 0,
    [ruta?.clases.length]
  );

  const viewWidth = 360;

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

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-md mx-auto px-4 py-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors min-h-[44px] min-w-[44px]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-white font-bold text-base">{ruta.nombre}</h1>
            <div className="w-11" /> {/* spacer */}
          </div>
          <ProgresoBar
            completadas={ruta.progreso.completadas}
            total={ruta.progreso.total}
            puntos={ruta.progreso.puntos}
            color={rutaColor}
          />
        </div>
      </div>

      {/* Map */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-y-contain">
        <div className="max-w-md mx-auto relative">
          <svg
            viewBox={`0 0 ${viewWidth} ${svgHeight}`}
            className="w-full"
            style={{ minHeight: svgHeight }}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FCA929" />
                <stop offset="100%" stopColor="#FA7B21" />
              </linearGradient>
            </defs>

            {/* Paths between nodes */}
            {positions.map((pos, i) => {
              if (i === positions.length - 1) return null;
              const nextPos = positions[i + 1];
              const isCompletedPath =
                ruta.clases[i].estado === 'completado' &&
                ruta.clases[i + 1].estado !== 'bloqueado';

              return (
                <CaminoAnimado
                  key={`path-${i}`}
                  from={pos}
                  to={nextPos}
                  completado={isCompletedPath}
                  viewWidth={viewWidth}
                />
              );
            })}

            {/* Nodes */}
            {ruta.clases.map((clase, i) => (
              <NodoClase
                key={clase.id}
                clase={clase}
                color={rutaColor}
                position={positions[i]}
                onClick={() => onSelectClase(clase.id)}
                isCurrent={i === currentIdx}
                viewWidth={viewWidth}
              />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
