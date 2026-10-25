// Turno, fecha de inicio, días tentativos y fecha de fin estimada. Lo comparten
// matrícula y renovación. Las clases vienen del catálogo (más las de regalo del
// código), nunca de una tabla del front.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { cx, claseOpcion } from './tokens';
import { Chips } from './piezas';
import {
  aYmd,
  calcularFechaFin,
  calcularHorarios,
  diasPermitidos,
  fechaLarga,
  obtenerFechasDisponiblesInicio,
  obtenerNombreDia,
  deYmd,
  type Turno,
} from '../../utils/matricula';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const SIN_FECHA = 'no-especificado';

export function useFechasPrograma(fechaNacimiento: string, clasesTotales: number) {
  const [turno, setTurno] = useState<Turno>('tarde');
  const [fechaInicio, setFechaInicio] = useState('');
  const [dias, setDias] = useState<string[]>([]);

  const horarios = useMemo(() => (fechaNacimiento ? calcularHorarios(fechaNacimiento) : null), [fechaNacimiento]);
  const categoria = horarios?.categoria ?? '';
  const permitidos = useMemo(() => diasPermitidos(turno, categoria), [turno, categoria]);

  // Al cambiar turno o categoría se quitan los días que ya no valen
  useEffect(() => {
    setDias((prev) => prev.filter((d) => permitidos.includes(d)));
    setFechaInicio((f) => (f && f !== SIN_FECHA && !permitidos.includes(obtenerNombreDia(deYmd(f))) ? '' : f));
  }, [permitidos]);

  const sinDefinir = fechaInicio === SIN_FECHA;
  const fin = useMemo(() => {
    if (!fechaInicio || sinDefinir || dias.length === 0 || clasesTotales <= 0) return null;
    const r = calcularFechaFin(deYmd(fechaInicio), clasesTotales, dias);
    return { fechaFin: aYmd(r.fechaFin), clasesTotales: r.clasesTotales, semanas: r.semanasAproximadas };
  }, [fechaInicio, sinDefinir, dias, clasesTotales]);

  const reset = useCallback(() => { setTurno('tarde'); setFechaInicio(''); setDias([]); }, []);

  return {
    turno, setTurno, fechaInicio, setFechaInicio, dias, setDias,
    horarios, categoria, permitidos, sinDefinir, fin, reset,
    /** Listo para enviar: fecha elegida y, si hay fecha, al menos un día y fin calculado. */
    completo: !!fechaInicio && (sinDefinir || (dias.length > 0 && !!fin)),
  };
}

export type FechasPrograma = ReturnType<typeof useFechasPrograma>;

export function SeccionFechas({ f, hayNacimiento }: { f: FechasPrograma; hayNacimiento: boolean }) {
  const [verMas, setVerMas] = useState(false);
  const fechas = useMemo(
    () => obtenerFechasDisponiblesInicio(24).filter((d) => f.permitidos.includes(obtenerNombreDia(d))),
    [f.permitidos],
  );
  const visibles = verMas ? fechas : fechas.slice(0, 6);
  const h = f.horarios;

  if (!hayNacimiento) {
    return <p className={cx.avisoAmbar}>Primero escribe la fecha de nacimiento del alumno: con ella vemos sus horarios.</p>;
  }

  return (
    <div className="space-y-6">
      {h?.horarioSemana && (
        <div>
          <p className={cx.label}>Turno</p>
          <Chips<Turno>
            etiqueta="Turno"
            columnas="grid-cols-2"
            valor={f.turno}
            onCambio={f.setTurno}
            opciones={[
              { valor: 'manana', etiqueta: 'Mañana', detalle: `Mar, jue y sáb · ${h.horarioManana}` },
              { valor: 'tarde', etiqueta: 'Tarde', detalle: `${h.diasSemana} · ${h.horarioSemana}` },
            ]}
          />
          <p className={cx.ayuda}>
            {h.categoria ? `Categoría ${h.categoria}. ` : ''}Sábados: {h.horarioSabado}.
          </p>
        </div>
      )}

      <div>
        <p className={cx.label}>¿Cuándo empieza?</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {visibles.map((d) => {
            const ymd = aYmd(d);
            const activa = f.fechaInicio === ymd;
            return (
              <button key={ymd} type="button" onClick={() => f.setFechaInicio(ymd)} className={`${claseOpcion(activa)} flex-col py-2`}>
                <span className="text-[13px] font-normal capitalize text-white/60">{obtenerNombreDia(d)}</span>
                <span>{d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}</span>
              </button>
            );
          })}
          <button type="button" onClick={() => f.setFechaInicio(SIN_FECHA)} className={`${claseOpcion(f.sinDefinir)} flex-col py-2`}>
            <span className="text-[13px] font-normal text-white/60">Lo coordino</span>
            <span>Aún no sé</span>
          </button>
        </div>
        {fechas.length > 6 && (
          <button type="button" onClick={() => setVerMas((v) => !v)} className={`${cx.btnTexto} mt-2`}>
            {verMas ? 'Ver menos fechas' : 'Ver más fechas'}
          </button>
        )}
      </div>

      {f.fechaInicio && !f.sinDefinir && (
        <div>
          <p className={cx.label}>Días que vendría</p>
          <div className="grid grid-cols-3 gap-2">
            {DIAS.map((d) => {
              const bloq = !f.permitidos.includes(d);
              const activo = f.dias.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  disabled={bloq}
                  aria-pressed={activo}
                  onClick={() => f.setDias(activo ? f.dias.filter((x) => x !== d) : [...f.dias, d])}
                  className={claseOpcion(activo, bloq)}
                >
                  {d}
                </button>
              );
            })}
          </div>
          <p className={cx.ayuda}>Solo sirve para estimar la fecha de fin: puede venir cualquier día de su horario.</p>
        </div>
      )}

      {f.fin && (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <p className="text-[13px] text-white/55">Terminaría aproximadamente el</p>
          <p className={`${cx.display} mt-1 text-[18px] capitalize text-white`}>{fechaLarga(f.fin.fechaFin, true)}</p>
          <p className="mt-1 text-[13px] text-white/55">{f.fin.clasesTotales} clases · unas {f.fin.semanas} semanas, sin contar feriados ni cierres.</p>
        </div>
      )}
    </div>
  );
}
