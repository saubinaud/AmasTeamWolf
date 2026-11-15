import { OM_YOGA, useCuentaRegresiva, dos } from './datos';

interface Props {
  /** compacta: una línea para el banner de la portada */
  compacta?: boolean;
}

/** Cuenta regresiva hasta el cierre de inscripciones de OmYoga (martes 17, 23:59). */
export function CuentaRegresiva({ compacta = false }: Props) {
  const r = useCuentaRegresiva(OM_YOGA.cierre);

  if (r.terminado) {
    return <p className="text-white/70 text-sm">Inscripciones cerradas</p>;
  }

  const partes = [
    { valor: r.dias, nombre: r.dias === 1 ? 'día' : 'días' },
    { valor: r.horas, nombre: 'horas' },
    { valor: r.minutos, nombre: 'min' },
    { valor: r.segundos, nombre: 'seg' },
  ];

  if (compacta) {
    return (
      <span className="font-mono tabular-nums text-white" aria-label="Tiempo para inscribirse">
        {r.dias > 0 && `${r.dias}d `}{dos(r.horas)}:{dos(r.minutos)}:{dos(r.segundos)}
      </span>
    );
  }

  return (
    <div className="flex gap-2 sm:gap-3" role="timer" aria-label="Tiempo para inscribirse">
      {partes.map((p) => (
        <div
          key={p.nombre}
          className="flex-1 min-w-0 sm:flex-none sm:w-20 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur px-2 py-3 text-center"
        >
          <div className="text-2xl sm:text-3xl font-semibold tabular-nums text-white leading-none">{dos(p.valor)}</div>
          <div className="mt-1.5 text-[11px] uppercase tracking-[0.14em] text-white/50">{p.nombre}</div>
        </div>
      ))}
    </div>
  );
}
