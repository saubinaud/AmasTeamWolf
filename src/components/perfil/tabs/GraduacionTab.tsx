import { useState, useEffect } from 'react';
import { Award, Shield, Clock, Zap, Calendar, AlertTriangle, ArrowRight, CalendarCheck } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../ui/utils';
import { BELT_COLORS, BELT_PROGRESSION, formatDate, getBeltColor, getNextBelt, getApiUrl, parseSpanishDate } from '../utils';
import { BeltDisplay } from '../BeltDisplay';

interface GraduacionTabProps {
  user: any;
  isMobile: boolean;
}

export function GraduacionTab({ user, isMobile }: GraduacionTabProps) {
  const [graduacionDate, setGraduacionDate] = useState<string | null>(null);
  const [graduationError, setGraduationError] = useState<string | null>(null);
  const [graduationLoaded, setGraduationLoaded] = useState(false);
  const [userGraduation, setUserGraduation] = useState<any>(null);

  // Fetch Graduation Date
  useEffect(() => {
    setGraduationError(null);
    const url = getApiUrl('/graduacion');
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        let dates: Date[] = [];
        const items = Array.isArray(data) ? data : (data.records || [data]);

        let foundUserItem: any = null;
        const normalize = (s: string) => s?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() || "";
        const userFullName = normalize(user.estudiante?.nombre || "");

        items.forEach((item: any) => {
          if (item.NOMBRE || item.APELLIDO) {
            const n = normalize(item.NOMBRE || "");
            const a = normalize(item.APELLIDO || "");
            if ((n && userFullName.includes(n)) || (a && userFullName.includes(a))) {
              foundUserItem = item;
            }
          }

          const d = item?.date || item?.fecha || item?.graduationDate || item?.start;

          if (item?.FECHA) {
            const parsed = parseSpanishDate(item.FECHA);
            if (parsed) dates.push(parsed);
            if (foundUserItem === item && parsed) {
              foundUserItem.parsedDate = parsed;
            }
          } else if (d) {
            const parsed = new Date(d);
            dates.push(parsed);
            if (foundUserItem === item) foundUserItem.parsedDate = parsed;
          }
        });

        if (foundUserItem) {
          setUserGraduation(foundUserItem);
          if (foundUserItem.parsedDate) {
            setGraduacionDate(foundUserItem.parsedDate.toISOString());
          }
        } else {
          setUserGraduation(null);
          dates = dates.filter(d => !isNaN(d.getTime())).sort((a, b) => a.getTime() - b.getTime());
          const now = new Date();
          const nextDate = dates.find(d => d >= now) || dates[dates.length - 1];
          if (nextDate) {
            setGraduacionDate(nextDate.toISOString());
          }
        }
        setGraduationLoaded(true);
      })
      .catch(err => {
        console.error('Error fetching graduation date:', err);
        setGraduationError(err.message);
        setGraduationLoaded(true);
      });
  }, [user.estudiante?.nombre]);

  if (isMobile) {
    return (
      <div key="graduacion" className="space-y-6 animate-fade-in-up">
        {/* Proxima Graduacion Card */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#FCA929]" />
            Tu proxima graduacion
          </h3>

          {user?.proximaGraduacion ? (
            <div className="space-y-5">
              {/* Belt transition visual */}
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="w-14 h-14 rounded-full border-4 flex items-center justify-center"
                    style={{ borderColor: BELT_COLORS[user.proximaGraduacion.cinturonDesde] ?? '#555', backgroundColor: `${BELT_COLORS[user.proximaGraduacion.cinturonDesde] ?? '#555'}20` }}
                  >
                    <Shield className="w-6 h-6" style={{ color: BELT_COLORS[user.proximaGraduacion.cinturonDesde] ?? '#555' }} />
                  </div>
                  <span className="text-xs text-zinc-400 text-center max-w-[80px] leading-tight">{user.proximaGraduacion.cinturonDesde || '-'}</span>
                </div>
                <ArrowRight className="w-6 h-6 text-[#FCA929] flex-shrink-0" />
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="w-14 h-14 rounded-full border-4 flex items-center justify-center"
                    style={{ borderColor: BELT_COLORS[user.proximaGraduacion.cinturonHasta] ?? '#FCA929', backgroundColor: `${BELT_COLORS[user.proximaGraduacion.cinturonHasta] ?? '#FCA929'}20` }}
                  >
                    <Award className="w-6 h-6" style={{ color: BELT_COLORS[user.proximaGraduacion.cinturonHasta] ?? '#FCA929' }} />
                  </div>
                  <span className="text-xs text-[#FCA929] font-medium text-center max-w-[80px] leading-tight">{user.proximaGraduacion.cinturonHasta || '-'}</span>
                </div>
              </div>

              {/* Fecha */}
              <div className="text-center">
                <p className="text-white/60 uppercase tracking-widest text-[10px] mb-1">Fecha del examen</p>
                <p className="text-2xl font-bold text-white">
                  {user.proximaGraduacion.fecha
                    ? new Date(user.proximaGraduacion.fecha).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Lima' })
                    : '-'}
                </p>
                {user.proximaGraduacion.fecha && (
                  <p className="text-[#FCA929] font-medium capitalize text-sm mt-0.5">
                    {new Date(user.proximaGraduacion.fecha).toLocaleDateString('es-PE', { weekday: 'long', timeZone: 'America/Lima' })}
                  </p>
                )}
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                {user.proximaGraduacion.horario && (
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-zinc-500 text-[10px] uppercase mb-1">Horario</p>
                    <div className="flex items-center justify-center gap-1.5 text-white font-semibold text-sm">
                      <Clock className="w-3.5 h-3.5 text-[#FCA929]" />
                      {user.proximaGraduacion.horario}
                    </div>
                  </div>
                )}
                {user.proximaGraduacion.turno && (
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-zinc-500 text-[10px] uppercase mb-1">Turno</p>
                    <div className="text-white font-semibold flex items-center justify-center gap-1.5 text-sm">
                      <Zap className="w-3.5 h-3.5 text-[#FCA929]" />
                      {user.proximaGraduacion.turno}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-4 border border-white/5">
                <Calendar className="w-10 h-10 text-zinc-600" />
              </div>
              <p className="text-zinc-400 text-sm">No tienes graduaciones programadas</p>
              <p className="text-zinc-600 text-xs mt-1">Se mostrara aqui cuando tu profesora te programe</p>
            </div>
          )}
        </div>

        {/* Mi Cinturon + Historial Timeline */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#FCA929]" />
            Mi Cinturon
          </h3>

          {/* Cinturon actual */}
          <div className="text-center mb-6">
            <div
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center border-4 mb-3"
              style={{
                borderColor: BELT_COLORS[user?.estudiante?.cinturonActual ?? 'Blanco'] ?? '#555',
                backgroundColor: `${BELT_COLORS[user?.estudiante?.cinturonActual ?? 'Blanco'] ?? '#555'}15`,
              }}
            >
              <Award className="w-10 h-10" style={{ color: BELT_COLORS[user?.estudiante?.cinturonActual ?? 'Blanco'] ?? '#FA7B21' }} />
            </div>
            <p className="text-2xl font-bold text-white">{user?.estudiante?.cinturonActual ?? 'Blanco'}</p>
            <p className="text-xs text-zinc-500 mt-1">Cinturon Actual</p>
          </div>

          {/* Historial Timeline */}
          {user?.historialCinturones && user.historialCinturones.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Camino recorrido</p>
              <div className="relative pl-6">
                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-white/20 via-[#FA7B21]/40 to-[#FA7B21]" />
                <div className="space-y-3">
                  {user.historialCinturones.map((c: any, i: number) => (
                    <div key={i} className="relative flex items-center gap-3">
                      <div
                        className="absolute -left-6 w-3.5 h-3.5 rounded-full border-2 border-black"
                        style={{ backgroundColor: BELT_COLORS[c.cinturon] ?? '#888' }}
                      />
                      <div className="flex-1 bg-white/5 rounded-xl px-4 py-3 border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: BELT_COLORS[c.cinturon] ?? '#888' }}
                          />
                          <p className="text-sm font-medium text-white">{c.cinturon}</p>
                        </div>
                        <span className="text-xs text-zinc-500">{c.fecha ? formatDate(c.fecha) : '-'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-zinc-500 text-sm">Tu primer cinturon se registrara en tu proxima graduacion</p>
            </div>
          )}
        </div>

        {/* Torneos */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#FCA929]" />
            Torneos
          </h3>
          {user?.torneos && user.torneos.length > 0 ? (
            <div className="space-y-3">
              {user.torneos.map((t: any) => {
                const tipoBadge: Record<string, string> = {
                  regional: 'bg-sky-500/15 text-sky-400',
                  nacional: 'bg-amber-500/15 text-amber-400',
                  interescuelas: 'bg-emerald-500/15 text-emerald-400',
                  panamericano: 'bg-violet-500/15 text-violet-400',
                  mundial: 'bg-red-500/15 text-red-400',
                };
                const pagoBadge: Record<string, string> = {
                  Pendiente: 'bg-amber-500/15 text-amber-400',
                  Pagado: 'bg-emerald-500/15 text-emerald-400',
                  Parcial: 'bg-[#FA7B21]/15 text-[#FA7B21]',
                };
                return (
                  <div key={t.id} className="bg-white/5 border border-white/5 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium text-sm">{t.torneoNombre || '-'}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${tipoBadge[t.tipo] ?? 'bg-zinc-800 text-zinc-400'}`}>
                            {t.tipo || '-'}
                          </span>
                          {t.fecha && <span className="text-zinc-500 text-xs">{formatDate(t.fecha)}</span>}
                          {t.lugar && <span className="text-zinc-600 text-xs">{t.lugar}</span>}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase shrink-0 ${pagoBadge[t.estadoPago] ?? 'bg-zinc-800 text-zinc-400'}`}>
                        {t.estadoPago || '-'}
                      </span>
                    </div>
                    {t.modalidad && (
                      <p className="text-zinc-400 text-xs mt-2">Modalidad: {t.modalidad}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm">No has sido seleccionado para torneos activos</p>
          )}
        </div>
      </div>
    );
  }

  // ── Desktop Graduacion ──
  return (
    <div key="graduacion" className="space-y-6 animate-fade-in-up">
      <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8">
        <h3 className="text-2xl font-semibold text-white flex items-center gap-3 mb-6">
          <Award className="w-6 h-6 text-[#FCA929]" />
          Tu Progreso
        </h3>

        {/* Graduation Card */}
        <div className="bg-gradient-to-br from-[#FA7B21]/10 to-[#FCA929]/5 border border-[#FA7B21]/20 rounded-2xl p-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FA7B21]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          {userGraduation ? (
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h4 className={cn(
                  "text-sm uppercase tracking-wider font-bold mb-2 flex items-center gap-2 justify-center md:justify-start",
                  (() => {
                    const d = graduacionDate ? new Date(graduacionDate) : new Date();
                    const now = new Date();
                    d.setHours(0, 0, 0, 0);
                    now.setHours(0, 0, 0, 0);
                    return d.getTime() < now.getTime() ? "text-zinc-400" : "text-[#FCA929]";
                  })()
                )}>
                  {(() => {
                    const d = graduacionDate ? new Date(graduacionDate) : new Date();
                    const now = new Date();
                    d.setHours(0, 0, 0, 0);
                    now.setHours(0, 0, 0, 0);
                    const isPast = d.getTime() < now.getTime();
                    const isTodayGrad = d.getTime() === now.getTime();
                    return (
                      <>
                        <Award className="w-4 h-4" />
                        {isPast ? "Ultima Graduacion" : isTodayGrad ? "Dia de la Graduacion!" : "Proxima Graduacion"}
                      </>
                    );
                  })()}
                </h4>
                <div className="flex flex-col">
                  <span className="text-4xl font-bold text-white mb-1">
                    {graduacionDate ? format(new Date(graduacionDate), "d 'de' MMMM", { locale: es }) : (graduationLoaded ? 'Sin fecha programada' : 'Cargando...')}
                  </span>
                  <span className="text-[#FCA929] text-lg capitalize font-medium">
                    {graduacionDate ? format(new Date(graduacionDate), "EEEE", { locale: es }) : ''}
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-black/20 rounded-xl p-4 border border-white/5 text-center min-w-[100px]">
                  <p className="text-white/40 text-xs uppercase mb-1">Horario</p>
                  <div className="flex items-center justify-center gap-2 font-bold text-white">
                    <Clock className="w-4 h-4 text-[#FCA929]" />
                    {userGraduation.HORARIO || '-'}
                  </div>
                </div>
                <div className="bg-black/20 rounded-xl p-4 border border-white/5 text-center min-w-[100px]">
                  <p className="text-white/40 text-xs uppercase mb-1">Turno</p>
                  <div className="flex items-center justify-center gap-2 font-bold text-white leading-tight">
                    <Zap className="w-4 h-4 text-[#FCA929]" />
                    {userGraduation.TURNO || '-'}
                  </div>
                </div>
              </div>

              {userGraduation.RANGO && (
                <div className="bg-[#FA7B21]/20 rounded-xl p-4 border border-[#FA7B21]/30">
                  <p className="text-[#FCA929] text-xs uppercase font-bold text-center">Rango</p>
                  <p className="text-white font-medium text-center">{userGraduation.RANGO}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h4 className="text-white/60 text-sm uppercase tracking-wider font-medium mb-1">Proxima Fecha General</h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">
                    {graduationError ? (
                      <span className="text-red-400 text-lg flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Error de conexion
                      </span>
                    ) : (
                      graduacionDate ? format(new Date(graduacionDate), "d 'de' MMMM", { locale: es }) : (graduationLoaded ? 'Sin fecha programada' : 'Cargando...')
                    )}
                  </span>
                </div>
                {graduacionDate && !graduationError && (
                  <p className="text-white/30 text-xs mt-1 bg-white/5 py-1 px-3 rounded-full inline-block border border-white/5">
                    No estas programado para esta fecha
                  </p>
                )}
              </div>
              <div className="w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center border border-white/5">
                <CalendarCheck className="w-7 h-7 text-zinc-500" />
              </div>
            </div>
          )}
        </div>

        {/* Belt progression */}
        {(() => {
          const currentBelt = user?.estudiante?.cinturonActual || 'Blanco';
          const currentColor = getBeltColor(currentBelt);
          const next = getNextBelt(currentBelt);
          const currentIdx = BELT_PROGRESSION.indexOf(currentBelt as any);
          const progress = currentIdx >= 0 ? Math.round((currentIdx / (BELT_PROGRESSION.length - 1)) * 100) : 0;
          return (
            <div className="space-y-6 mt-12 bg-black/20 rounded-2xl p-6 border border-white/5">
              <div className="flex items-center justify-between px-4 md:px-12">
                <div className="flex flex-col items-center gap-3">
                  <p className="text-white/40 text-xs uppercase tracking-wider">Cinturon Actual</p>
                  <BeltDisplay name={currentBelt} />
                </div>

                <div className="flex-1 px-4 md:px-8 flex flex-col items-center -mt-6">
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden relative">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full shadow-[0_0_15px_rgba(252,169,41,0.5)]"
                      style={{
                        width: `${Math.max(5, progress)}%`,
                        background: `linear-gradient(to right, ${currentColor}, ${next?.color || currentColor})`,
                      }}
                    />
                  </div>
                  <p className="text-white/40 text-xs mt-3 font-medium">En camino al siguiente nivel</p>
                </div>

                {next ? (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-white/40 text-xs uppercase tracking-wider">Siguiente Nivel</p>
                    <BeltDisplay name={next.name} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-white/40 text-xs uppercase tracking-wider">Nivel Maximo</p>
                    <BeltDisplay name={currentBelt} />
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
