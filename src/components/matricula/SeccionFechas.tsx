// Turno, fecha de inicio, días de clase y fecha de fin. Lo comparten matrícula
// y renovación. Las fechas las calcula el API (POST /api/fechas/plan): días con
// clase para su edad, feriados, cierres y la fecha de la última clase. Aquí
// solo se pinta lo que vuelve; si el API no responde se usa el respaldo de
// utils/matricula.ts y la fecha se marca como aproximada.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE } from '../../config/api';
import { cx, claseOpcion } from './tokens';
import { Chips } from './piezas';
import {
  NOMBRES_DIA,
  aYmd,
  calcularFechaFin,
  calcularHorarios,
  deYmd,
  diasPermitidos,
  etiquetaFecha,
  fechaLarga,
  obtenerFechasDisponiblesInicio,
  obtenerNombreDia,
  type PlanFechas,
  type Turno,
} from '../../utils/matricula';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const SIN_FECHA = 'no-especificado';
/** Errores que solo dicen "falta elegir": no se muestran como error. */
const INCOMPLETO = new Set(['SIN_INICIO', 'SIN_DIAS']);

interface Fin { fechaInicio: string; fechaFin: string; clasesTotales: number; semanas: number; aproximada: boolean }

export function useFechasPrograma(fechaNacimiento: string, clasesTotales: number, programaCodigo?: string | null, clasesExtra = 0) {
  const [turno, setTurno] = useState<Turno>('tarde');
  const [fechaInicio, setFechaInicio] = useState('');
  const [dias, setDias] = useState<string[]>([]);
  const [plan, setPlan] = useState<PlanFechas | null>(null);
  const [sinConexion, setSinConexion] = useState(false);
  const [cargando, setCargando] = useState(false);
  const pedido = useRef(0);

  const horarios = useMemo(() => (fechaNacimiento ? calcularHorarios(fechaNacimiento) : null), [fechaNacimiento]);
  const categoria = horarios?.categoria ?? '';
  const sinDefinir = fechaInicio === SIN_FECHA;

  // Vista previa del servidor, con pausa para no llamar en cada toque
  useEffect(() => {
    if (!programaCodigo) return;
    const n = ++pedido.current;
    setCargando(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`${API_BASE}/fechas/plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            programa: programaCodigo,
            fecha_inicio: fechaInicio && !sinDefinir ? fechaInicio : null,
            dias,
            turno,
            fecha_nacimiento: fechaNacimiento || null,
            clases_extra: clasesExtra,
            cantidad_proximas: 24,
          }),
        });
        const j = await r.json();
        if (!r.ok || !j.success) throw new Error(j.error || `Error ${r.status}`);
        if (n === pedido.current) { setPlan(j.data as PlanFechas); setSinConexion(false); }
      } catch {
        if (n === pedido.current) { setPlan(null); setSinConexion(true); }
      } finally {
        if (n === pedido.current) setCargando(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [programaCodigo, fechaInicio, sinDefinir, dias, turno, fechaNacimiento, clasesExtra]);

  // Días con clase: los dice el servidor (tabla horarios); sin conexión, la regla de respaldo
  const permitidos = useMemo(() => {
    const delServidor = plan?.dias_por_turno?.[turno];
    if (delServidor && delServidor.length) return delServidor.map((d) => NOMBRES_DIA[d]);
    return diasPermitidos(turno, categoria);
  }, [plan, turno, categoria]);

  // Al cambiar turno o categoría se quitan los días que ya no valen
  useEffect(() => {
    setDias((prev) => {
      const next = prev.filter((d) => permitidos.includes(d));
      return next.length === prev.length ? prev : next;
    });
    setFechaInicio((f) => (f && f !== SIN_FECHA && !permitidos.includes(obtenerNombreDia(deYmd(f))) ? '' : f));
  }, [permitidos]);

  const proximas = useMemo(() => {
    if (plan?.proximas_fechas?.length) return plan.proximas_fechas.filter((f) => permitidos.includes(obtenerNombreDia(deYmd(f))));
    return obtenerFechasDisponiblesInicio(24).map(aYmd).filter((f) => permitidos.includes(obtenerNombreDia(deYmd(f))));
  }, [plan, permitidos]);

  const fin = useMemo<Fin | null>(() => {
    if (!fechaInicio || sinDefinir || dias.length === 0) return null;
    if (plan) {
      if (!plan.ok || !plan.fecha_fin || !plan.fecha_inicio) return null;
      return { fechaInicio: plan.fecha_inicio, fechaFin: plan.fecha_fin, clasesTotales: plan.clases_totales ?? clasesTotales, semanas: plan.semanas ?? 0, aproximada: false };
    }
    if (!sinConexion || clasesTotales <= 0) return null;
    // RESPALDO SIN CONEXIÓN
    const r = calcularFechaFin(deYmd(fechaInicio), clasesTotales, dias);
    return { fechaInicio, fechaFin: aYmd(r.fechaFin), clasesTotales: r.clasesTotales, semanas: r.semanasAproximadas, aproximada: true };
  }, [plan, sinConexion, fechaInicio, sinDefinir, dias, clasesTotales]);

  const avisos = plan && fechaInicio && !sinDefinir ? plan.avisos.map((a) => a.mensaje) : [];
  const error = plan && fechaInicio && !sinDefinir ? plan.errores.find((e) => !INCOMPLETO.has(e.codigo))?.mensaje ?? null : null;

  const reset = useCallback(() => { setTurno('tarde'); setFechaInicio(''); setDias([]); }, []);

  return {
    turno, setTurno, fechaInicio, setFechaInicio, dias, setDias,
    horarios, categoria, permitidos, sinDefinir, fin, reset,
    proximas, avisos, error, cargando, sinConexion,
    diasPorTurno: plan?.dias_por_turno ?? null,
    /** Listo para enviar: fecha elegida y, si hay fecha, al menos un día y fin calculado. */
    completo: !!fechaInicio && (sinDefinir || (dias.length > 0 && !!fin && !error)),
  };
}

export type FechasPrograma = ReturnType<typeof useFechasPrograma>;

export function SeccionFechas({ f, hayNacimiento }: { f: FechasPrograma; hayNacimiento: boolean }) {
  const [verMas, setVerMas] = useState(false);
  const visibles = verMas ? f.proximas : f.proximas.slice(0, 6);
  const h = f.horarios;

  if (!hayNacimiento) {
    return <p className={cx.avisoAmbar}>Primero escribe la fecha de nacimiento del alumno: con ella vemos sus horarios.</p>;
  }

  const diasTurno = (t: Turno) => listaCorta((f.diasPorTurno?.[t] ?? []).map((d) => NOMBRES_DIA[d]));
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
              { valor: 'manana', etiqueta: 'Mañana', detalle: `${diasTurno('manana') || 'Mar, jue y sáb'} · ${h.horarioManana}` },
              { valor: 'tarde', etiqueta: 'Tarde', detalle: `${diasTurno('tarde') || h.diasSemana} · ${h.horarioSemana}` },
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
          {visibles.map((ymd) => {
            const e = etiquetaFecha(ymd);
            return (
              <button key={ymd} type="button" aria-pressed={f.fechaInicio === ymd} onClick={() => f.setFechaInicio(ymd)} className={`${claseOpcion(f.fechaInicio === ymd)} flex-col py-2`}>
                <span className="text-[13px] font-normal text-white/60">{e.dia}</span>
                <span>{e.fecha}</span>
              </button>
            );
          })}
          <button type="button" aria-pressed={f.sinDefinir} onClick={() => f.setFechaInicio(SIN_FECHA)} className={`${claseOpcion(f.sinDefinir)} flex-col py-2`}>
            <span className="text-[13px] font-normal text-white/60">Lo coordino</span>
            <span>Aún no sé</span>
          </button>
        </div>
        {f.proximas.length > 6 && (
          <button type="button" onClick={() => setVerMas((v) => !v)} className={`${cx.btnTexto} mt-2`}>
            {verMas ? 'Ver menos fechas' : 'Ver más fechas'}
          </button>
        )}
        <p className={cx.ayuda}>Solo días con clase: sin domingos, feriados ni cierres de la academia.</p>
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
          <p className={cx.ayuda}>Con ellos se calcula la fecha de fin: puede venir cualquier día de su horario.</p>
        </div>
      )}

      {f.error && <p className={cx.avisoError} role="alert">{f.error}</p>}

      {f.fin && (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3" aria-live="polite">
          <p className="text-[13px] text-white/55">{f.fin.aproximada ? 'Terminaría aproximadamente el' : 'Su última clase sería el'}</p>
          <p className={`${cx.display} mt-1 text-[18px] first-letter:uppercase text-white`}>{fechaLarga(f.fin.fechaFin, true)}</p>
          <p className="mt-1 text-[13px] text-white/55">
            {f.fin.clasesTotales} clases desde el {fechaLarga(f.fin.fechaInicio)} · unas {f.fin.semanas} semanas
          </p>
          {f.avisos.length > 0 && (
            <ul className="mt-3 space-y-1 border-t border-white/10 pt-3 text-[13px] text-amber-100/90">
              {f.avisos.map((a) => <li key={a}>{a}</li>)}
            </ul>
          )}
          {f.fin.aproximada && (
            <p className="mt-3 border-t border-white/10 pt-3 text-[13px] text-white/55">
              No pudimos consultar el calendario de la academia: la fecha exacta se confirma al registrar.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** ['Martes','Jueves','Sábado'] → "Mar, jue y sáb" */
function listaCorta(dias: string[]): string {
  const c = dias.map((d) => d.slice(0, 3).toLowerCase());
  if (!c.length) return '';
  const t = c.length === 1 ? c[0] : `${c.slice(0, -1).join(', ')} y ${c[c.length - 1]}`;
  return t.charAt(0).toUpperCase() + t.slice(1);
}
