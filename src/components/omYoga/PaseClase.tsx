import { Clock, MapPin, Users, ArrowUpRight } from 'lucide-react';
import { OM_YOGA } from './datos';

const MAPA = 'https://www.google.com/maps/search/?api=1&query=Av.+San+Luis+2083,+San+Borja,+Lima';

/** Muesca del pase: un círculo del color de la página que "muerde" el borde. */
function Muesca({ lado }: { lado: 'izq' | 'der' }) {
  return (
    <span
      aria-hidden
      className={`absolute top-1/2 h-7 w-7 -translate-y-1/2 rounded-full border border-white/10 bg-[#0A0705] ${
        lado === 'izq' ? '-left-3.5' : '-right-3.5'
      }`}
    />
  );
}

/**
 * La clase de prueba como un pase de entrada: arriba qué y cuándo, y tras la línea
 * troquelada los datos prácticos, en una lista con divisores (no una tarjeta por dato).
 */
export function PaseClase() {
  const filas = [
    { icono: Clock, nombre: 'Hora', valor: OM_YOGA.HORA_CLASE ?? 'Te la confirmamos por WhatsApp' },
    { icono: Users, nombre: 'Para', valor: 'Adultos, con o sin experiencia' },
  ];

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950">
      {/* Cabecera del pase */}
      <div className="relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FA7B21] via-[#E2580F] to-[#7C2D12]" />
        <div aria-hidden className="absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-90"
          style={{ background: 'radial-gradient(circle at 35% 35%, #FFF3C4 0%, #FFE08A 30%, #FCA929 65%, rgba(250,123,33,0) 72%)' }} />
        <div className="relative">
          <p className="text-sm font-medium text-white/85">Clase de prueba · Hatha Yoga</p>
          <p className="mt-1 text-4xl font-bold tracking-tight text-white sm:text-5xl">OM Yoga</p>
          <span className="mt-5 inline-flex items-center rounded-full bg-white px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-[#C2410C]">
            Gratis
          </span>
        </div>
      </div>

      {/* Fecha */}
      <div className="flex items-center gap-5 px-6 pt-6 pb-7 sm:px-8">
        <div className="flex w-20 shrink-0 flex-col items-center rounded-2xl bg-white py-2.5 text-center shadow-lg shadow-black/40">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FA7B21]">Mié</span>
          <span className="text-4xl font-bold leading-none text-zinc-900">18</span>
          <span className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Nov</span>
        </div>
        <div>
          <p className="text-lg font-semibold text-white">{OM_YOGA.fechaClase}</p>
          <p className="mt-0.5 text-white/55">Con Celeste, instructora principal</p>
        </div>
      </div>

      {/* Troquel */}
      <div className="relative h-0">
        <Muesca lado="izq" />
        <Muesca lado="der" />
        <div className="mx-6 border-t-2 border-dashed border-white/10" />
      </div>

      {/* Datos prácticos */}
      <ul className="divide-y divide-white/[0.07] px-6 py-2 sm:px-8">
        {filas.map(({ icono: Icono, nombre, valor }) => (
          <li key={nombre} className="flex items-center gap-4 py-4">
            <Icono className="h-5 w-5 shrink-0 text-[#FCA929]" strokeWidth={1.75} />
            <span className="w-12 shrink-0 text-sm text-white/45">{nombre}</span>
            <span className="text-white/90">{valor}</span>
          </li>
        ))}
        <li>
          <a href={MAPA} target="_blank" rel="noopener noreferrer"
            className="group flex items-center gap-4 py-4">
            <MapPin className="h-5 w-5 shrink-0 text-[#FCA929]" strokeWidth={1.75} />
            <span className="w-12 shrink-0 text-sm text-white/45">Lugar</span>
            <span className="flex-1 text-white/90">Av. San Luis 2083, San Borja</span>
            <ArrowUpRight className="h-4 w-4 text-white/40 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </li>
      </ul>
    </div>
  );
}
