import { useState, useMemo, useRef } from 'react';
import { Button } from '../../ui/button';
import {
  CheckCircle2, Clock, ChevronLeft, ChevronRight,
  AlertTriangle, Calendar, X
} from 'lucide-react';
import { format, addDays, subDays, addMonths, subMonths, isSameDay, isToday, startOfMonth, eachDayOfInterval, startOfWeek, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../ui/utils';

interface AsistenciaTabProps {
  user: any;
  isMobile: boolean;
}

export function AsistenciaTab({ user, isMobile }: AsistenciaTabProps) {
  // Mobile: day strip; Desktop: full month grid
  const [calendarCenterDate, setCalendarCenterDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const calendarContainerRef = useRef<HTMLDivElement>(null);

  // Touch handling for calendar swipe (mobile)
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setCalendarCenterDate(prev => addDays(prev, 3));
      } else {
        setCalendarCenterDate(prev => subDays(prev, 3));
      }
    }
  };

  const totalAsistencias = user?.asistencias?.filter((a: any) => a.estado === 'asistio').length || 0;

  // Mobile day strip
  const calendarDays = useMemo(() => {
    const days = [];
    const range = isMobile ? 2 : 3;
    for (let i = -range; i <= range; i++) {
      days.push(addDays(calendarCenterDate, i));
    }
    return days;
  }, [calendarCenterDate, isMobile]);

  // Desktop full calendar grid
  const calendarGrid = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = addDays(startDate, 41);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [calendarMonth]);

  const getAttendanceForDay = (day: Date) => {
    return user?.asistencias?.find((a: any) => isSameDay(new Date(a.fecha), day));
  };

  if (isMobile) {
    return (
      <div key="calendar" className="space-y-6 animate-fade-in-up">
        {/* Month Navigation */}
        <div className="flex items-center justify-between px-2">
          <button
            onClick={() => setCalendarCenterDate(subDays(calendarCenterDate, 3))}
            className="w-12 h-12 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all duration-200 hover:scale-110 active:scale-90"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <p className="text-xl font-semibold capitalize">
              {format(calendarCenterDate, 'MMMM', { locale: es })}
            </p>
            <p className="text-sm text-zinc-500">{format(calendarCenterDate, 'yyyy')}</p>
          </div>
          <button
            onClick={() => setCalendarCenterDate(addDays(calendarCenterDate, 3))}
            className="w-12 h-12 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all duration-200 hover:scale-110 active:scale-90"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Day Strip with swipe */}
        <div
          ref={calendarContainerRef}
          className="overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex justify-center gap-2">
            {calendarDays.map((day) => {
              const attendance = getAttendanceForDay(day);
              const hasAttendance = attendance?.estado === 'asistio';
              const isCurrentDay = isToday(day);
              const isCenterDay = isSameDay(day, calendarCenterDate);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setCalendarCenterDate(day)}
                  className={cn(
                    "flex-shrink-0 py-4 rounded-2xl flex flex-col items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95",
                    "w-16 min-w-16",
                    isCenterDay && "bg-gradient-to-b from-[#FA7B21] to-orange-600 shadow-lg shadow-[#FA7B21]/20",
                    !isCenterDay && isCurrentDay && "bg-white/10 ring-1 ring-[#FA7B21]/30",
                    !isCenterDay && !isCurrentDay && "bg-zinc-900/50 hover:bg-zinc-800/50"
                  )}
                >
                  <span className={cn(
                    "text-[10px] uppercase font-medium tracking-wide",
                    isCenterDay ? "text-white/80" : "text-zinc-500"
                  )}>
                    {format(day, 'EEE', { locale: es })}
                  </span>
                  <span className={cn(
                    "text-2xl font-bold",
                    isCenterDay ? "text-white" : isCurrentDay ? "text-[#FA7B21]" : "text-zinc-300"
                  )}>
                    {format(day, 'd')}
                  </span>
                  <div className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    hasAttendance ? (isCenterDay ? "bg-white" : "bg-emerald-400") : "bg-transparent"
                  )} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Detail */}
        <div className="bg-zinc-900/50 rounded-3xl p-8 border border-white/5">
          <div className="text-center mb-6">
            <p className="text-sm text-zinc-400 capitalize">{format(calendarCenterDate, 'EEEE', { locale: es })}</p>
            <p className="text-4xl font-bold mt-2">{format(calendarCenterDate, 'd MMMM', { locale: es })}</p>
          </div>

          {(() => {
            const attendance = getAttendanceForDay(calendarCenterDate);
            if (attendance?.estado === 'asistio') {
              return (
                <div className="flex items-center justify-center gap-4 py-5 px-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  <span className="text-emerald-300 font-semibold text-lg">Asistencia registrada!</span>
                </div>
              );
            }
            return (
              <div className="flex items-center justify-center gap-3 py-5 px-6 bg-zinc-800/50 rounded-2xl border border-white/5">
                <Clock className="w-6 h-6 text-zinc-500" />
                <span className="text-zinc-400">Sin registro de asistencia</span>
              </div>
            );
          })()}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900/40 rounded-2xl p-5 border border-white/5">
            <p className="text-xs text-zinc-500 mb-2">Total asistencias</p>
            <p className="text-3xl font-bold text-emerald-400">{totalAsistencias}</p>
          </div>
          <div className="bg-zinc-900/40 rounded-2xl p-5 border border-white/5">
            <p className="text-xs text-zinc-500 mb-2">Este mes</p>
            <p className="text-3xl font-bold text-zinc-300">
              {user.asistencias?.filter((a: any) => {
                const d = new Date(a.fecha);
                return d.getMonth() === calendarCenterDate.getMonth() &&
                  d.getFullYear() === calendarCenterDate.getFullYear() &&
                  a.estado === 'asistio';
              }).length || 0}
            </p>
          </div>
        </div>

        {/* Jump to Today */}
        {!isToday(calendarCenterDate) && (
          <button
            onClick={() => setCalendarCenterDate(new Date())}
            className="w-full py-4 text-sm text-[#FA7B21] hover:text-orange-300 transition-colors font-medium"
          >
            ← Volver a hoy
          </button>
        )}
      </div>
    );
  }

  // ── Desktop Calendar ──
  return (
    <div key="calendar" className="space-y-6 animate-fade-in-up">
      {/* Google Calendar Style Header */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-semibold text-white flex items-center gap-3">
              <Calendar className="w-6 h-6 text-[#FCA929]" />
              Calendario de Asistencias
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCalendarMonth(new Date())}
              className="border-[#FA7B21]/30 bg-[#FA7B21]/10 hover:bg-[#FA7B21]/20 text-[#FCA929]"
            >
              Hoy
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl h-10 w-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="text-xl font-medium text-white min-w-[180px] text-center capitalize">
              {format(calendarMonth, 'MMMM yyyy', { locale: es })}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl h-10 w-10"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Calendar Header Row */}
        <div className="flex w-full mb-0 rounded-t-lg overflow-hidden border border-white/10 border-b-0">
          {['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'].map((day) => (
            <div key={day} className="flex-1 bg-[#1a1a1a] py-3 text-center border-r border-[#333] last:border-r-0">
              <span className="text-[10px] font-bold text-white tracking-widest">{day}</span>
            </div>
          ))}
        </div>

        {/* Calendar Grid - 7 Columns */}
        <div
          className="grid w-full border-l border-t border-white/10 bg-zinc-900"
          style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}
        >
          {calendarGrid.map((day, idx) => {
            const isTodayDate = isToday(day);
            const isSelectedMonth = isSameMonth(day, calendarMonth);
            const asistencia = getAttendanceForDay(day);

            return (
              <div
                key={idx}
                className={cn(
                  "min-h-[100px] p-2 relative border-r border-b border-white/10 transition-colors",
                  !isSelectedMonth ? "bg-zinc-900/50 opacity-50" : "bg-transparent hover:bg-white/[0.02]"
                )}
              >
                <span className={cn(
                  "text-sm font-medium block mb-1 relative z-10",
                  isTodayDate
                    ? "bg-[#FA7B21] text-white w-7 h-7 rounded-full flex items-center justify-center font-bold shadow-[0_0_10px_rgba(250,123,33,0.5)] ring-2 ring-[#FA7B21]/30"
                    : isSelectedMonth ? "text-white/80" : "text-white/30"
                )}>
                  {format(day, 'd')}
                </span>

                {/* Attendance Markers */}
                {asistencia && (
                  <div className={cn(
                    "absolute bottom-2 right-2 p-1.5 rounded-full shadow-lg",
                    asistencia.estado === 'asistio' ? "bg-emerald-500/20" :
                      asistencia.estado === 'falta' ? "bg-red-500/20" : "bg-amber-500/20"
                  )}>
                    {asistencia.estado === 'asistio' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {asistencia.estado === 'falta' && <X className="w-4 h-4 text-red-400" />}
                    {asistencia.estado === 'justificada' && <Clock className="w-4 h-4 text-amber-400" />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-white/50 text-sm">Asistencias</p>
            <p className="text-2xl font-bold text-emerald-400">{totalAsistencias}</p>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-white/50 text-sm">Tardanzas</p>
            <p className="text-2xl font-bold text-amber-400">
              {user?.asistencias?.filter((a: any) => a.estado === 'tardanza').length || 0}
            </p>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5">
          <p className="text-white/50 text-sm mb-3">Leyenda</p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-500/50 border border-emerald-500"></div>
              <span className="text-white/70 text-sm">Asistencia</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-500/50 border border-amber-500"></div>
              <span className="text-white/70 text-sm">Tardanza</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded ring-2 ring-[#FCA929]"></div>
              <span className="text-white/70 text-sm">Hoy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
