import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CuentaRegresiva } from './CuentaRegresiva';
import { OM_YOGA, useCuentaRegresiva } from './datos';

/**
 * Franja de la portada. Antes del cierre invita a la clase de prueba con la cuenta regresiva;
 * después queda como presentación del programa.
 */
export function BannerOmYoga() {
  const navigate = useNavigate();
  const { terminado } = useCuentaRegresiva(OM_YOGA.cierre);

  return (
    <section className="container mx-auto px-4 py-8 sm:py-10">
      <button
        type="button"
        onClick={() => navigate(OM_YOGA.ruta)}
        className="group relative block w-full overflow-hidden rounded-3xl border border-[#FA7B21]/25 bg-zinc-950 text-left transition hover:border-[#FA7B21]/50"
      >
        <img src={OM_YOGA.poster} alt="" aria-hidden loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-right opacity-40 transition duration-700 group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/30" />
        <div className="relative flex flex-col gap-5 p-6 sm:p-8 md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#FA7B21] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
              Nuevo
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              OM <span className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] bg-clip-text text-transparent">Yoga</span>
            </h2>
            <p className="mt-2 max-w-md text-white/70">
              {terminado
                ? 'Hatha Yoga para adultos con Celeste, en San Borja.'
                : `Hatha Yoga para adultos. Clase de prueba gratis el ${OM_YOGA.fechaClase.toLowerCase()}.`}
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            {!terminado && (
              <p className="text-sm text-white/55">
                Inscripciones cierran en <CuentaRegresiva compacta />
              </p>
            )}
            <span className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FA7B21] to-[#FCA929] px-6 py-3 font-semibold text-white shadow-lg shadow-[#FA7B21]/30">
              {terminado ? 'Conocer el programa' : 'Reservar mi clase gratis'}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </button>
    </section>
  );
}
