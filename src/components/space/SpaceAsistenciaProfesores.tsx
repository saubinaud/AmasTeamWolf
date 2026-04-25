import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Loader2, CalendarCheck, ClipboardCheck, UserCheck, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '../../config/api';
import { cx, badgeColors } from './tokens';
import { formatHora, hoyLima } from './dateUtils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AsistenciaHoy {
  id: number;
  nombre: string;
  dni: string;
  hora_entrada: string;
}

interface Profesor {
  id: number;
  nombre: string;
  dni: string | null;
  activo: boolean;
}

interface ResumenMes {
  mes: string;
  dias_asistidos: number;
  dias_esperados: number;
  porcentaje: number;
}

interface DiaAsistencia {
  fecha: string;
  asistio: boolean;
}

interface SpaceAsistenciaProfesoresProps {
  token: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function buildCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1; // Mon=0
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SpaceAsistenciaProfesores({ token }: SpaceAsistenciaProfesoresProps) {
  // Quick attendance
  const [dniInput, setDniInput] = useState('');
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceResult, setAttendanceResult] = useState<{ nombre: string; ya_registrado: boolean } | null>(null);

  // Today's list
  const [asistenciasHoy, setAsistenciasHoy] = useState<AsistenciaHoy[]>([]);
  const [hoyLoading, setHoyLoading] = useState(true);

  // Calendar view
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [selectedProfesorId, setSelectedProfesorId] = useState<number | null>(null);
  const [calendarData, setCalendarData] = useState<DiaAsistencia[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  // Calendar month navigation
  const hoy = hoyLima();
  const [calYear, setCalYear] = useState(() => parseInt(hoy.slice(0, 4), 10));
  const [calMonth, setCalMonth] = useState(() => parseInt(hoy.slice(5, 7), 10) - 1);

  // -----------------------------------------------------------------------
  // Fetch
  // -----------------------------------------------------------------------

  const fetchAsistenciasHoy = useCallback(async () => {
    setHoyLoading(true);
    try {
      const res = await fetch(`${API_BASE}/space/profesores/asistencia/hoy`, { headers: authHeaders(token) });
      const data = await res.json();
      if (data.success) setAsistenciasHoy(data.data || []);
    } catch { /* silent */ } finally {
      setHoyLoading(false);
    }
  }, [token]);

  const fetchProfesores = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/space/profesores`, { headers: authHeaders(token) });
      const data = await res.json();
      if (data.success) {
        const activos = (data.data || []).filter((p: Profesor) => p.activo);
        setProfesores(activos);
      }
    } catch { /* silent */ }
  }, [token]);

  const fetchResumen = useCallback(async (id: number) => {
    setCalendarLoading(true);
    try {
      const res = await fetch(`${API_BASE}/space/profesores/asistencia/resumen/${id}`, { headers: authHeaders(token) });
      const data = await res.json();
      if (data.success && data.data) {
        // Convert monthly summary to individual days for the calendar
        // We'll build a set of attended dates from the resumen data
        // For a more accurate view, we query the detailed attendance
        setCalendarData([]);
      }
    } catch { /* silent */ } finally {
      setCalendarLoading(false);
    }
  }, [token]);

  // Fetch detailed attendance for a professor for a given month
  const fetchCalendarMonth = useCallback(async (profId: number, year: number, month: number) => {
    setCalendarLoading(true);
    try {
      const mm = String(month + 1).padStart(2, '0');
      const desde = `${year}-${mm}-01`;
      const hasta = `${year}-${mm}-${new Date(year, month + 1, 0).getDate()}`;
      const res = await fetch(
        `${API_BASE}/space/profesores/asistencia/detalle/${profId}?desde=${desde}&hasta=${hasta}`,
        { headers: authHeaders(token) },
      );
      const data = await res.json();
      if (data.success) {
        setCalendarData(data.data || []);
      }
    } catch { /* silent */ } finally {
      setCalendarLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAsistenciasHoy();
    fetchProfesores();
  }, [fetchAsistenciasHoy, fetchProfesores]);

  useEffect(() => {
    if (selectedProfesorId) {
      fetchCalendarMonth(selectedProfesorId, calYear, calMonth);
    }
  }, [selectedProfesorId, calYear, calMonth, fetchCalendarMonth]);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const handleRegisterAttendance = useCallback(async () => {
    if (!dniInput.trim()) return;
    setAttendanceLoading(true);
    setAttendanceResult(null);
    try {
      const res = await fetch(`${API_BASE}/space/profesores/asistencia`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ dni: dniInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setAttendanceResult({ nombre: data.data.profesor, ya_registrado: data.data.ya_registrado });
        if (data.data.ya_registrado) {
          toast.info(data.message);
        } else {
          toast.success(data.message);
        }
        setDniInput('');
        fetchAsistenciasHoy();
      } else {
        toast.error(data.error || 'Error al registrar');
      }
    } catch {
      toast.error('Error de conexion');
    } finally {
      setAttendanceLoading(false);
    }
  }, [token, dniInput, fetchAsistenciasHoy]);

  const handlePrevMonth = useCallback(() => {
    setCalMonth((m) => {
      if (m === 0) { setCalYear((y) => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setCalMonth((m) => {
      if (m === 11) { setCalYear((y) => y + 1); return 0; }
      return m + 1;
    });
  }, []);

  // -----------------------------------------------------------------------
  // Calendar data lookup
  // -----------------------------------------------------------------------

  const attendedDates = useMemo(() => {
    const set = new Set<string>();
    for (const d of calendarData) {
      if (d.asistio) set.add(d.fecha);
    }
    return set;
  }, [calendarData]);

  const calendarCells = useMemo(() => buildCalendarDays(calYear, calMonth), [calYear, calMonth]);

  const todayStr = hoyLima();

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-stone-900 text-xl font-bold flex items-center gap-2">
          <UserCheck size={22} className="text-[var(--accent)]" />
          Asistencia de profesores
        </h1>
        <p className="text-stone-400 text-xs mt-1">Registrar y consultar asistencia diaria</p>
      </div>

      {/* Quick DNI input */}
      <div className={cx.card + ' p-4 space-y-3'}>
        <h2 className="text-stone-900 text-sm font-semibold flex items-center gap-2">
          <ClipboardCheck size={16} className="text-[var(--accent)]" />
          Registrar asistencia
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="DNI del profesor..."
            value={dniInput}
            onChange={(e) => setDniInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRegisterAttendance()}
            className={cx.input + ' flex-1'}
          />
          <button
            onClick={handleRegisterAttendance}
            disabled={attendanceLoading || !dniInput.trim()}
            className={cx.btnPrimary + ' flex items-center gap-2 whitespace-nowrap'}
          >
            {attendanceLoading ? <Loader2 size={15} className="animate-spin" /> : <CalendarCheck size={15} />}
            Registrar
          </button>
        </div>
        {attendanceResult && (
          <div className={`text-sm p-3 rounded-xl border ${attendanceResult.ya_registrado ? 'bg-amber-50 border-amber-200 text-amber-400' : 'bg-emerald-50 border-emerald-200 text-emerald-400'}`}>
            {attendanceResult.ya_registrado
              ? `${attendanceResult.nombre} ya tiene asistencia registrada hoy`
              : `Asistencia registrada para ${attendanceResult.nombre}`}
          </div>
        )}
      </div>

      {/* Today section */}
      <div className={cx.card + ' p-4'}>
        <h2 className="text-stone-900 text-sm font-semibold mb-3">Hoy</h2>
        {hoyLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={20} className="animate-spin text-[var(--accent)]" />
          </div>
        ) : asistenciasHoy.length === 0 ? (
          <p className="text-stone-400 text-sm">Ningun profesor ha registrado asistencia hoy</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {asistenciasHoy.map((a) => (
              <span key={a.id} className={cx.badge(badgeColors.green)}>
                {a.nombre} -- {formatHora(a.hora_entrada)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Monthly calendar view */}
      <div className={cx.card + ' p-4 space-y-4'}>
        <h2 className="text-stone-900 text-sm font-semibold">Vista mensual</h2>

        {/* Professor selector */}
        <select
          value={selectedProfesorId ?? ''}
          onChange={(e) => setSelectedProfesorId(e.target.value ? Number(e.target.value) : null)}
          className={cx.select + ' max-w-xs'}
        >
          <option value="">Seleccionar profesor...</option>
          {profesores.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>

        {selectedProfesorId && (
          <>
            {/* Month navigation */}
            <div className="flex items-center gap-3">
              <button onClick={handlePrevMonth} className={cx.btnIcon}>
                <ChevronLeft size={18} />
              </button>
              <span className="text-stone-900 text-sm font-medium min-w-[140px] text-center">
                {MONTH_NAMES[calMonth]} {calYear}
              </span>
              <button onClick={handleNextMonth} className={cx.btnIcon}>
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Calendar grid */}
            {calendarLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-[var(--accent)]" />
              </div>
            ) : (
              <div>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map((d) => (
                    <div key={d} className="text-center text-stone-300 text-[10px] font-medium uppercase tracking-wider py-1">
                      {d}
                    </div>
                  ))}
                </div>
                {/* Day cells */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarCells.map((day, i) => {
                    if (day === null) {
                      return <div key={`empty-${i}`} className="h-9" />;
                    }
                    const mm = String(calMonth + 1).padStart(2, '0');
                    const dd = String(day).padStart(2, '0');
                    const dateStr = `${calYear}-${mm}-${dd}`;
                    const attended = attendedDates.has(dateStr);
                    const isToday = dateStr === todayStr;

                    return (
                      <div
                        key={dateStr}
                        className={`h-9 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                          attended
                            ? 'bg-emerald-50 text-emerald-400 border border-emerald-200'
                            : 'bg-stone-50 text-stone-400 border border-stone-200'
                        } ${isToday ? 'ring-1 ring-[var(--accent)]/40' : ''}`}
                        title={attended ? 'Asistio' : 'No asistio'}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-emerald-50 border border-emerald-200" />
                    <span className="text-stone-400 text-[10px]">Asistio</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-stone-50 border border-stone-200" />
                    <span className="text-stone-400 text-[10px]">No asistio</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
