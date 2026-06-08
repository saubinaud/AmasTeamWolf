import { ChevronRight, MapPin, Star } from 'lucide-react';

interface RutaResumen {
  id: number;
  nombre: string;
  color: string;
  cinturon: string;
  progreso: {
    completadas: number;
    total: number;
    puntos: number;
  };
}

interface MisRutasProps {
  rutas: RutaResumen[];
  onSelectRuta: (rutaId: number) => void;
}

export function MisRutas({ rutas, onSelectRuta }: MisRutasProps) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-md mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-1">Ruta del Guerrero</h1>
          <p className="text-white/50 text-sm">Elige tu camino de entrenamiento</p>
        </div>

        {/* Ruta cards */}
        <div className="flex flex-col gap-3">
          {rutas.map(ruta => {
            const pct = ruta.progreso.total > 0
              ? Math.round((ruta.progreso.completadas / ruta.progreso.total) * 100)
              : 0;

            return (
              <button
                key={ruta.id}
                onClick={() => onSelectRuta(ruta.id)}
                className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-4 hover:border-white/20 transition-all active:scale-[0.98] text-left group"
              >
                {/* Color dot */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${ruta.color}20` }}
                >
                  <MapPin className="w-6 h-6" style={{ color: ruta.color }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-base truncate">{ruta.nombre}</h3>
                  <p className="text-white/40 text-xs mt-0.5">{ruta.cinturon}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {/* Mini progress bar */}
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${ruta.color}, #FCA929)`,
                        }}
                      />
                    </div>
                    <span className="text-white/40 text-xs flex-shrink-0">
                      {ruta.progreso.completadas}/{ruta.progreso.total}
                    </span>
                  </div>
                </div>

                {/* Points + Arrow */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="flex items-center gap-1 text-[#FCA929] text-xs font-semibold">
                    <Star className="w-3 h-3 fill-[#FCA929]" />
                    {ruta.progreso.puntos}
                  </span>
                  <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
