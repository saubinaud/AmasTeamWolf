import { ChevronRight, MapPin, Star, Trophy } from 'lucide-react';

interface RutaResumen {
  id: number;
  nombre: string;
  color: string;
  cinturon: string;
  mundo_id?: number | null;
  mundo_nombre?: string | null;
  mundo_color?: string | null;
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

interface MundoGroup {
  nombre: string;
  color: string | null;
  rutas: RutaResumen[];
}

function RutaCard({ ruta, index, onSelectRuta }: { ruta: RutaResumen; index: number; onSelectRuta: (id: number) => void }) {
  const pct = ruta.progreso.total > 0
    ? Math.round((ruta.progreso.completadas / ruta.progreso.total) * 100)
    : 0;
  const isComplete = pct === 100;

  return (
    <button
      key={ruta.id}
      onClick={() => onSelectRuta(ruta.id)}
      className="w-full bg-zinc-900/80 rounded-2xl p-5 flex items-center gap-4 transition-all active:scale-[0.98] text-left group animate-fade-in"
      style={{
        animationDelay: `${index * 0.08}s`,
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: isComplete ? '#FFD700' : `${ruta.color}30`,
      }}
    >
      {/* Icon with belt color background */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
        style={{ backgroundColor: `${ruta.color}15` }}
      >
        {isComplete ? (
          <Trophy className="w-7 h-7" style={{ color: '#FFD700' }} />
        ) : (
          <MapPin className="w-7 h-7" style={{ color: ruta.color }} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-bold text-base truncate">{ruta.nombre}</h3>
        <p className="text-white/40 text-xs mt-0.5 capitalize">{ruta.cinturon}</p>

        {/* Progress bar */}
        <div className="flex items-center gap-3 mt-2.5">
          <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${pct}%`,
                background: isComplete
                  ? 'linear-gradient(90deg, #FFD700, #FCA929)'
                  : `linear-gradient(90deg, ${ruta.color}, #FCA929)`,
              }}
            />
          </div>
        </div>

        {/* Progress text */}
        <p className="text-white/30 text-xs mt-1.5">
          {ruta.progreso.completadas} de {ruta.progreso.total} clases completadas
        </p>
      </div>

      {/* Points + Arrow */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="flex items-center gap-1 text-[#FCA929] text-xs font-bold">
          <Star className="w-3.5 h-3.5 fill-[#FCA929]" />
          {ruta.progreso.puntos}
        </span>
        <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  );
}

export function MisRutas({ rutas, onSelectRuta }: MisRutasProps) {
  // Group rutas by mundo
  const mundoGroups = rutas.reduce<Record<string, MundoGroup>>((acc, ruta) => {
    const key = ruta.mundo_id ? String(ruta.mundo_id) : 'sin_mundo';
    if (!acc[key]) {
      acc[key] = {
        nombre: ruta.mundo_nombre || 'Rutas Individuales',
        color: ruta.mundo_color || null,
        rutas: [],
      };
    }
    acc[key].rutas.push(ruta);
    return acc;
  }, {});

  const groupKeys = Object.keys(mundoGroups);
  const hasMundos = groupKeys.some(k => k !== 'sin_mundo');

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-md mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <p className="text-3xl mb-2">🐺</p>
          <h1 className="text-2xl font-bold text-white mb-1">Ruta del Guerrero</h1>
          <p className="text-white/50 text-sm">Elige tu camino de entrenamiento</p>
        </div>

        {/* Ruta cards — grouped by mundo if any */}
        {hasMundos ? (
          <div className="flex flex-col gap-8">
            {groupKeys.map(key => {
              const group = mundoGroups[key];
              return (
                <div key={key}>
                  {/* Mundo section header */}
                  <div className="flex items-center gap-3 mb-4">
                    {group.color && (
                      <div className="w-2 h-8 rounded-full" style={{ backgroundColor: group.color }} />
                    )}
                    <div>
                      <h2 className="text-white font-bold text-lg">{group.nombre}</h2>
                      <p className="text-white/30 text-xs">
                        {group.rutas.length} ruta{group.rutas.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    {group.rutas.map((ruta, index) => (
                      <RutaCard key={ruta.id} ruta={ruta} index={index} onSelectRuta={onSelectRuta} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {rutas.map((ruta, index) => (
              <RutaCard key={ruta.id} ruta={ruta} index={index} onSelectRuta={onSelectRuta} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
