import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { RefreshCw, Snowflake, Zap, CreditCard, Sparkles } from 'lucide-react';
import { cn } from '../../ui/utils';
import { formatDate, estadoDelPlan } from '../utils';
import { CongelarPlan } from '../CongelarPlan';

interface PlanTabProps {
  user: any;
  isMobile: boolean;
  onNavigate: (page: string) => void;
  onRefresh: () => Promise<void>;
}

export function PlanTab({ user, isMobile, onNavigate, onRefresh }: PlanTabProps) {
  // Estado del plan: lo que dice el API (v_plan_alumno)
  const plan = estadoDelPlan(user);
  const estaVencido = plan.vencido;
  const estaPorVencer = plan.porVencer;
  const diasVencido = plan.diasDesdeVencimiento ?? 0;
  const isPagado = user?.pagos?.estadoPago?.toLowerCase().includes('pagado');

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

        <CongelarPlan user={user} onRefresh={onRefresh} />

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
            onClick={() => onNavigate('renovacion')}
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
              {estaVencido
                ? (diasVencido > 0 ? `Vencido hace ${diasVencido} dias` : 'Vencido')
                : plan.diasParaVencer !== null ? `${plan.diasParaVencer} dias` : 'Sin fecha de fin'}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-white/5">
            <span className="text-white/60">Estado</span>
            <span className={cn(
              "font-medium",
              estaVencido ? "text-red-400" : estaPorVencer ? "text-amber-400" : plan.tono === 'congelado' ? "text-cyan-300" : "text-emerald-400"
            )}>
              {plan.etiqueta}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-white/5">
            <span className="text-white/60">Clases</span>
            <span className="text-white font-medium">
              {user?.matricula?.clasesAsistidas ?? 0} de {user?.matricula?.clasesTotales ?? 0} · quedan {user?.matricula?.clasesRestantes ?? 0}
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
        <CongelarPlan user={user} onRefresh={onRefresh} />

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
                  {estaVencido
                    ? 'Tu programa ha vencido'
                    : plan.diasParaVencer !== null ? `Solo quedan ${plan.diasParaVencer} dias` : `Quedan ${user?.matricula?.clasesRestantes ?? 0} clases`}
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
