import { useState, useMemo } from 'react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger,
} from '../../ui/dialog';
import {
  RefreshCw, Snowflake, AlertTriangle, Zap,
  CreditCard, Calendar, Info, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { DayPicker, DateRange } from 'react-day-picker';
import { cn } from '../../ui/utils';
import { formatDate, getApiUrl } from '../utils';
import { isDiaHabil } from '../../../shared/constants';

interface PlanTabProps {
  user: any;
  isMobile: boolean;
  onNavigate: (page: string) => void;
  onRefresh: () => Promise<void>;
}

export function PlanTab({ user, isMobile, onNavigate, onRefresh }: PlanTabProps) {
  const [freezeRange, setFreezeRange] = useState<DateRange | undefined>(undefined);
  const [isFreezing, setIsFreezing] = useState(false);
  const [isFreezeDialogOpen, setIsFreezeDialogOpen] = useState(false);

  const diasRestantes = useMemo(() => {
    if (!user?.matricula?.fechaFin) return 0;
    const fin = new Date(user.matricula.fechaFin);
    return Math.ceil((fin.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }, [user?.matricula?.fechaFin]);

  const estaVencido = diasRestantes < 0;
  const diasVencido = estaVencido ? Math.abs(diasRestantes) : 0;
  const estaPorVencer = diasRestantes >= 0 && diasRestantes <= (isMobile ? 7 : 15);
  const isPagado = user?.pagos?.estadoPago?.toLowerCase().includes('pagado');

  const getMaxFreezeDays = () => {
    const prog = user?.matricula?.programa?.toLowerCase() || '';
    if (prog.includes('3 meses') || prog.includes('trimestral')) return 15;
    if (prog.includes('6 meses') || prog.includes('semestral')) return 30;
    if (prog.includes('anual') || prog.includes('12 meses') || prog.includes('ano')) return 45;
    return 0;
  };
  const maxDiasCongelar = getMaxFreezeDays();
  const puedeCongelar = maxDiasCongelar > 0;

  const effectiveFreezeDays = useMemo(() => {
    if (!freezeRange?.from || !freezeRange?.to) return 0;
    return eachDayOfInterval({ start: freezeRange.from, end: freezeRange.to })
      .filter(d => isDiaHabil(d)).length;
  }, [freezeRange]);

  const nuevaFechaFin = useMemo(() => {
    const fechaFinStr = user?.matricula?.fechaFin;
    if (!fechaFinStr || effectiveFreezeDays <= 0) return null;

    let fechaActual = new Date(fechaFinStr);
    let diasAgregados = 0;

    while (diasAgregados < effectiveFreezeDays) {
      fechaActual = addDays(fechaActual, 1);
      if (isDiaHabil(fechaActual)) {
        diasAgregados++;
      }
    }
    return fechaActual;
  }, [user?.matricula?.fechaFin, effectiveFreezeDays]);

  const handleFreezeConfirm = async () => {
    if (!freezeRange?.from || !freezeRange?.to) {
      toast.error('Selecciona un rango de fechas');
      return;
    }
    if (effectiveFreezeDays > maxDiasCongelar) {
      toast.error(`No puedes exceder ${maxDiasCongelar} dias`);
      return;
    }

    setIsFreezing(true);
    try {
      const token = localStorage.getItem('amasToken');
      const res = await fetch(getApiUrl('/auth/congelar'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fecha_inicio: format(freezeRange.from, 'yyyy-MM-dd'),
          fecha_fin: format(freezeRange.to, 'yyyy-MM-dd'),
          dias: effectiveFreezeDays,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Congelamiento registrado');
        setIsFreezeDialogOpen(false);
        await onRefresh();
      } else {
        toast.error(data.error || 'Error al congelar');
      }
    } catch {
      toast.error('Error de conexion');
    } finally {
      setIsFreezing(false);
    }
  };

  if (isMobile) {
    return (
      <div key="plan" className="space-y-6 animate-fade-in-up">
        {/* Plan Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 p-6 border border-white/5">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#FA7B21]/10 rounded-full blur-3xl -mr-16 -mt-16" />

          <div className="flex justify-between items-start mb-6 relative">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Tu Membresia</p>
              <h3 className="text-2xl font-bold">{user.matricula?.programa}</h3>
            </div>
            <Badge className={cn(
              "px-3 py-1.5 text-[10px] font-semibold border-0 uppercase tracking-wider",
              isPagado ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
            )}>
              {user.pagos?.estadoPago}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-black/30 rounded-xl p-4">
              <p className="text-[9px] text-zinc-500 uppercase mb-1">Inicio</p>
              <p className="text-base font-medium">{formatDate(user.matricula?.fechaInicio)}</p>
            </div>
            <div className="bg-black/30 rounded-xl p-4">
              <p className="text-[9px] text-zinc-500 uppercase mb-1">Fin</p>
              <p className="text-base font-medium">{formatDate(user.matricula?.fechaFin)}</p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-5 border-t border-white/10">
            <p className="text-zinc-400">Costo total</p>
            <p className="text-3xl font-bold">S/ {user.pagos?.precioPrograma}</p>
          </div>
        </div>

        {/* Historial de pagos */}
        <div className="bg-zinc-900/40 rounded-2xl border border-white/5 p-5">
          <h4 className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-4">Historial de pagos</h4>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-300">
                Pagado: <span className="font-semibold text-white">S/ {user.pagos?.totalPagado ?? user.pagos?.precioAPagar ?? 0}</span> de S/ {user.pagos?.precioPrograma ?? 0}
              </span>
              <span className="text-xs text-zinc-500">
                {user.pagos?.precioPrograma ? Math.min(100, Math.round(((user.pagos?.totalPagado ?? user.pagos?.precioAPagar ?? 0) / (user.pagos?.precioPrograma || 1)) * 100)) : 0}%
              </span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out"
                style={{ width: `${user.pagos?.precioPrograma ? Math.min(100, Math.round(((user.pagos?.totalPagado ?? user.pagos?.precioAPagar ?? 0) / (user.pagos?.precioPrograma || 1)) * 100)) : 0}%` }}
              />
            </div>
          </div>
          {user.pagos?.historial && user.pagos.historial.length > 0 ? (
            <div className="space-y-3">
              {user.pagos.historial.map((pago: any) => (
                <div key={pago.id} className="flex items-start gap-3">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">S/ {pago.monto}</span>
                      <span className="text-[10px] text-zinc-500">
                        {pago.fecha ? new Date(pago.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Lima' }) : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-zinc-500 bg-white/5 px-2 py-0.5 rounded">{pago.metodo_pago || pago.tipo}</span>
                      {pago.observaciones && <span className="text-[10px] text-zinc-600 truncate">{pago.observaciones}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-zinc-500">Sin pagos registrados</p>
            </div>
          )}
        </div>

        {/* Freeze (mobile) */}
        {puedeCongelar && (
          <div className="bg-blue-950/30 border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Snowflake className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-blue-100">Congelar Membresia</h3>
                <p className="text-sm text-blue-300/60">Maximo {maxDiasCongelar} dias disponibles</p>
              </div>
            </div>

            <Dialog open={isFreezeDialogOpen} onOpenChange={setIsFreezeDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-blue-600/80 hover:bg-blue-500 h-12 rounded-xl text-base font-medium">
                  Solicitar Congelamiento
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#09090b] border-white/10 text-white sm:max-w-md w-[95%] rounded-3xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex-1 overflow-y-auto">
                  <div className="p-6 bg-black/20 border-b border-white/5">
                    <div className="mb-4">
                      <DialogTitle className="text-white flex items-center gap-2 mb-2">
                        <Snowflake className="w-5 h-5 text-cyan-400" />
                        Selecciona las fechas
                      </DialogTitle>
                      <DialogDescription className="text-white/60 text-xs">
                        Elige inicio y fin. Tienes <span className="text-cyan-300 font-medium">{maxDiasCongelar} dias</span>.
                      </DialogDescription>
                    </div>
                    <div className="flex justify-center bg-zinc-900 rounded-2xl p-2 border border-white/5">
                      <style>{`
                        .rdp { --rdp-accent-color: #FA7B21; --rdp-background-color: rgba(250, 123, 33, 0.2); margin: 0; }
                        .rdp-day_selected:not([disabled]) { font-weight: bold; border: 2px solid #FA7B21; }
                        .rdp-day_selected:hover:not([disabled]) { border-color: #FA7B21; color: white; }
                        .rdp-day { color: #e4e4e7; font-size: 0.85rem; width: 36px; height: 36px; }
                        .rdp-caption_label { font-size: 0.9rem; }
                        .rdp-head_cell { font-size: 0.75rem; }
                      `}</style>
                      <DayPicker
                        mode="range"
                        selected={freezeRange}
                        onSelect={setFreezeRange}
                        disabled={{ before: new Date() }}
                        numberOfMonths={1}
                        locale={es}
                        className="text-white"
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-zinc-900/80">
                    <div className="bg-gradient-to-b from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-2xl p-4 mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-cyan-200/70 text-xs font-medium">Disponible</span>
                        <Badge variant="outline" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 px-2 py-0 text-[10px]">
                          {maxDiasCongelar} dias
                        </Badge>
                      </div>
                      <div className="flex items-end justify-between">
                        <span className="text-white/60 text-xs">A consumir</span>
                        <div>
                          <span className={cn(
                            "text-2xl font-bold",
                            effectiveFreezeDays > maxDiasCongelar ? "text-red-400" : "text-white"
                          )}>
                            {effectiveFreezeDays}
                          </span>
                          <span className="text-xs text-white/40 ml-1">dias</span>
                        </div>
                      </div>
                      {effectiveFreezeDays > maxDiasCongelar && (
                        <div className="mt-3 flex items-center gap-2 text-red-300 text-[10px] bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                          Excedes el limite
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleFreezeConfirm}
                      disabled={!freezeRange?.from || !freezeRange?.to || isFreezing || effectiveFreezeDays > maxDiasCongelar}
                      className="w-full h-12 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:shadow-none transition-all"
                    >
                      {isFreezing ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      {isFreezing ? 'Procesando...' : 'Confirmar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Congelaciones historial */}
        <div className="bg-zinc-900/40 rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs text-zinc-500 font-medium uppercase tracking-wider flex items-center gap-2">
              <Snowflake className="w-3.5 h-3.5 text-blue-400" />
              Congelamientos
            </h4>
            <span className="text-sm font-semibold text-blue-300">{user?.congelaciones?.length ?? 0} usados</span>
          </div>
          {user?.congelaciones && user.congelaciones.length > 0 ? (
            <div className="space-y-2">
              {user.congelaciones.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between bg-blue-950/20 border border-blue-500/10 rounded-xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-blue-200">
                      {c.fechaInicio
                        ? new Date(c.fechaInicio).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', timeZone: 'America/Lima' })
                        : '-'}
                      {' -> '}
                      {c.fechaFin
                        ? new Date(c.fechaFin).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', timeZone: 'America/Lima' })
                        : '-'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs text-blue-300/70">{c.dias || '-'} dias</span>
                    <Badge className={cn(
                      "text-[9px] border-0 px-1.5 py-0.5",
                      c.estado === 'activo' ? "bg-blue-500/20 text-blue-300" : "bg-zinc-700/50 text-zinc-500"
                    )}>
                      {c.estado === 'activo' ? 'Activo' : 'Finalizado'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-600 text-sm text-center py-2">No has usado congelamientos</p>
          )}
        </div>

        {/* Renovar */}
        <div>
          <Button
            onClick={() => onNavigate('renovacion')}
            className="w-full h-14 bg-gradient-to-r from-[#FA7B21] to-orange-500 hover:from-[#FCA929] hover:to-orange-400 text-white rounded-2xl font-semibold text-base shadow-lg shadow-[#FA7B21]/20 transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]"
          >
            <RefreshCw className="w-5 h-5 mr-2" /> Renovar Programa
          </Button>
        </div>

        <div>
          <Button
            onClick={() => onNavigate('planes')}
            variant="outline"
            className="w-full h-14 border-white/10 bg-white/5 hover:bg-white/10 rounded-2xl font-medium text-base transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]"
          >
            <Zap className="w-5 h-5 mr-2 text-[#FA7B21]" /> Ver Todas las Membresias
          </Button>
        </div>
      </div>
    );
  }

  // ── Desktop Plan ──
  return (
    <div key="plan" className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
      {/* Plan Details */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8">
        <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-[#FCA929]" />
          Mi Plan
        </h3>

        <div className="p-6 bg-gradient-to-br from-[#FA7B21]/20 to-[#FCA929]/10 border border-[#FA7B21]/30 rounded-2xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-bold text-white">
              {user?.matricula?.programa || 'Sin programa'}
            </span>
            <Badge className={cn(
              "text-sm px-4 py-1",
              isPagado ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
            )}>
              {isPagado ? 'Pagado' : 'Pendiente'}
            </Badge>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold" style={{
              background: 'linear-gradient(135deg, #FA7B21, #FCA929)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              S/ {user?.pagos?.precioAPagar || 0}
            </span>
            {user?.pagos?.descuento > 0 && (
              <span className="text-white/40 line-through">
                S/ {user?.pagos?.precioPrograma}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-white/5">
            <span className="text-white/60">Fecha inicio</span>
            <span className="text-white font-medium">{formatDate(user?.matricula?.fechaInicio)}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-white/5">
            <span className="text-white/60">Fecha fin</span>
            <span className="text-white font-medium">{formatDate(user?.matricula?.fechaFin)}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-white/5">
            <span className="text-white/60">Dias restantes</span>
            <span className={cn(
              "font-medium",
              estaVencido ? "text-red-400" : estaPorVencer ? "text-amber-400" : "text-emerald-400"
            )}>
              {estaVencido ? `Vencido hace ${diasVencido} dias` : `${diasRestantes} dias`}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-white/5">
            <span className="text-white/60">Estado</span>
            <span className={cn(
              "font-medium",
              estaVencido ? "text-red-400" : "text-emerald-400"
            )}>
              {estaVencido ? 'Vencido' : 'Activo'}
            </span>
          </div>
          {user?.pagos?.descuento > 0 && (
            <div className="flex justify-between items-center py-3">
              <span className="text-white/60">Descuento aplicado</span>
              <span className="text-[#FCA929] font-medium">{user.pagos.descuento}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Right column: Freeze + conditional Renewal */}
      <div className="space-y-6">
        {/* Freeze Card (Desktop) */}
        {maxDiasCongelar > 0 && (
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Snowflake className="w-6 h-6 text-cyan-400" />
              <h4 className="text-lg font-semibold text-white">Congelar Programa</h4>
            </div>
            <p className="text-white/60 text-sm mb-4">
              Tienes <span className="text-cyan-400 font-semibold">{maxDiasCongelar} dias</span> disponibles para congelar
            </p>
            <Dialog open={isFreezeDialogOpen} onOpenChange={setIsFreezeDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30">
                  <Snowflake className="w-4 h-4 mr-2" />
                  Solicitar Congelamiento
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-white/10 max-w-4xl p-0 overflow-hidden gap-0 flex">
                {/* Left: Calendar Picker */}
                <div className="p-6 border-r border-white/5 bg-black/20 flex-1">
                  <div className="mb-6">
                    <DialogTitle className="text-white flex items-center gap-2 mb-2">
                      <Snowflake className="w-5 h-5 text-cyan-400" />
                      Selecciona las fechas
                    </DialogTitle>
                    <DialogDescription className="text-white/60">
                      Elige el dia de inicio y el dia de fin del congelamiento.
                    </DialogDescription>
                  </div>

                  <div className="flex justify-center bg-zinc-900 rounded-2xl p-4 border border-white/5">
                    <style>{`
                      .rdp { --rdp-accent-color: #FA7B21; --rdp-background-color: rgba(250, 123, 33, 0.2); margin: 0; }
                      .rdp-day_selected:not([disabled]) { font-weight: bold; border: 2px solid #FA7B21; }
                      .rdp-day_selected:hover:not([disabled]) { border-color: #FA7B21; color: white; }
                      .rdp-day { color: #e4e4e7; }
                      .rdp-day:hover:not([disabled]) { background-color: rgba(255,255,255,0.1); }
                    `}</style>
                    <DayPicker
                      mode="range"
                      selected={freezeRange}
                      onSelect={setFreezeRange}
                      disabled={{ before: new Date() }}
                      numberOfMonths={1}
                      locale={es}
                      className="text-white"
                    />
                  </div>
                </div>

                {/* Right: Summary & Legend */}
                <div className="w-[340px] bg-zinc-900/80 p-8 flex flex-col justify-between border-l border-white/5 shadow-2xl">
                  <div className="space-y-8">
                    <div>
                      <div className="flex items-center gap-2 mb-6">
                        <div className="h-px bg-white/10 flex-1" />
                        <span className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">Resumen</span>
                        <div className="h-px bg-white/10 flex-1" />
                      </div>

                      <div className="bg-gradient-to-b from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-2xl p-5 mb-8 shadow-[0_0_20px_rgba(6,182,212,0.05)]">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-cyan-200/70 text-sm font-medium">Disponible</span>
                          <Badge variant="outline" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 px-2 py-0.5 text-xs">
                            {maxDiasCongelar} dias
                          </Badge>
                        </div>
                        <div className="flex items-end justify-between">
                          <span className="text-white/60 text-sm">A consumir</span>
                          <div className="text-right">
                            <span className={cn(
                              "text-3xl font-bold",
                              effectiveFreezeDays > maxDiasCongelar ? "text-red-400" : "text-white"
                            )}>
                              {effectiveFreezeDays}
                            </span>
                            <span className="text-sm text-white/40 ml-1">dias</span>
                          </div>
                        </div>
                        {effectiveFreezeDays > maxDiasCongelar && (
                          <div className="mt-4 flex items-center gap-2 text-red-300 text-xs bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            Excedes el limite permitido
                          </div>
                        )}
                      </div>

                      {/* Dates Summary */}
                      <div className="space-y-6 relative">
                        <div className="absolute left-[19px] top-4 bottom-4 w-px bg-gradient-to-b from-cyan-500/20 via-white/10 to-pink-500/20"></div>

                        <div className="flex justify-between items-center group relative z-10">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#09090b] flex items-center justify-center border border-white/10 group-hover:border-cyan-500/50 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300">
                              <Calendar className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                              <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-0.5">Inicio</p>
                              <p className="text-sm font-medium text-white">
                                {freezeRange?.from ? format(freezeRange.from, "d 'de' MMM", { locale: es }) : '-'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center group relative z-10">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#09090b] flex items-center justify-center border border-white/10 group-hover:border-cyan-500/50 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300">
                              <Calendar className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                              <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-0.5">Fin</p>
                              <p className="text-sm font-medium text-white">
                                {freezeRange?.to ? format(freezeRange.to, "d 'de' MMM", { locale: es }) : '-'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center group relative z-10">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#09090b] flex items-center justify-center border border-emerald-500/30 group-hover:border-emerald-400/60 group-hover:shadow-[0_0_15px_rgba(52,211,153,0.15)] transition-all duration-300">
                              <Zap className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-[10px] text-emerald-400/60 uppercase tracking-wider font-semibold mb-0.5">Retomas</p>
                              <p className="text-sm font-bold text-emerald-400">
                                {freezeRange?.to ? format(addDays(freezeRange.to, 1), "EEEE d", { locale: es }) : '-'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center group relative z-10">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#09090b] flex items-center justify-center border border-pink-500/30 group-hover:border-pink-400/60 group-hover:shadow-[0_0_15px_rgba(244,114,182,0.15)] transition-all duration-300">
                              <Sparkles className="w-5 h-5 text-pink-400" />
                            </div>
                            <div>
                              <p className="text-[10px] text-pink-400/60 uppercase tracking-wider font-semibold mb-0.5">Nuevo Vencimiento</p>
                              <p className="text-sm font-bold text-pink-400">
                                {nuevaFechaFin ? format(nuevaFechaFin, "d 'de' MMM, yyyy", { locale: es }) : '-'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 text-xs text-white/50 flex gap-3 leading-relaxed border border-white/5">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-white/30" />
                      <p>Los domingos y feriados <strong className="text-white/70">no cuentan</strong> como dias congelados ni extienden tu fecha final.</p>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-white/5">
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setIsFreezeDialogOpen(false)}
                        className="flex-1 border-white/10 hover:bg-white/5 text-white"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleFreezeConfirm}
                        disabled={!freezeRange?.from || !freezeRange?.to || effectiveFreezeDays > maxDiasCongelar || isFreezing}
                        className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isFreezing ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : 'Confirmar'}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Renewal CTA */}
        {(estaPorVencer || estaVencido) && (
          <div className="bg-gradient-to-br from-[#FA7B21]/20 via-[#431C28]/30 to-[#FCA929]/10 border border-[#FA7B21]/30 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FA7B21] to-[#FCA929] rounded-xl flex items-center justify-center shadow-lg shadow-[#FA7B21]/30">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white">Hora de renovar!</h4>
                <p className="text-white/60 text-sm">
                  {estaVencido ? 'Tu programa ha vencido' : `Solo quedan ${diasRestantes} dias`}
                </p>
              </div>
            </div>
            <Button
              onClick={() => onNavigate('renovacion')}
              className="w-full bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white py-4 shadow-lg shadow-[#FA7B21]/30"
            >
              Renovar Programa
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
