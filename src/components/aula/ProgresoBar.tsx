import { Star } from 'lucide-react';

interface ProgresoBarProps {
  completadas: number;
  total: number;
  puntos: number;
  color: string;
}

export function ProgresoBar({ completadas, total, puntos, color }: ProgresoBarProps) {
  const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/60">
          {completadas} de {total} clases completadas
        </span>
        <span className="flex items-center gap-1 text-[#FCA929] font-semibold">
          <Star className="w-4 h-4 fill-[#FCA929]" />
          {puntos} puntos
        </span>
      </div>
      <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${porcentaje}%`,
            background: `linear-gradient(90deg, ${color}, #FCA929)`,
          }}
        />
      </div>
    </div>
  );
}
