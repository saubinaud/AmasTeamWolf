import { useMemo, useState } from 'react';
import { Snowflake, Loader2, Info, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { addDays, differenceInCalendarDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DayPicker, type DateRange } from 'react-day-picker';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import { cn } from '../ui/utils';
import { formatDate, pedirApi } from './utils';
import type { SolicitudCongelamiento } from '../../contexts/AuthContext';

// Congelar la membresía: la familia PIDE y la academia aprueba o rechaza en Space.
// El tope (días según el plan) y si se puede pedir los decide el API; aquí solo
// se muestran. Al descongelar, el plan se alarga los días que estuvo pausado.

const ETIQUETA: Record<SolicitudCongelamiento['estado'], { texto: string; clase: string; Icono: typeof Clock }> = {
  pendiente: { texto: 'En revisión', clase: 'text-amber-300 bg-amber-500/15', Icono: Clock },
  aprobada: { texto: 'Aprobada', clase: 'text-emerald-300 bg-emerald-500/15', Icono: CheckCircle2 },
  rechazada: { texto: 'No aprobada', clase: 'text-red-300 bg-red-500/15', Icono: XCircle },
  cancelada: { texto: 'Retirada', clase: 'text-zinc-400 bg-white/5', Icono: XCircle },
};

function EstadoSolicitud({ s }: { s: SolicitudCongelamiento }) {
  const e = ETIQUETA[s.estado];
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 px-4 py-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-white/80">{formatDate(s.fechaInicio)} al {formatDate(s.fechaFin)} · {s.dias} días</span>
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium shrink-0', e.clase)}>
          <e.Icono className="w-3 h-3" /> {e.texto}
        </span>
      </div>
      {s.respuesta && <p className="mt-1.5 text-xs text-white/50">Academia: {s.respuesta}</p>}
    </div>
  );
}

export function CongelarPlan({ user, onRefresh }: { user: any; onRefresh: () => Promise<void> }) {
  const info = user?.congelamiento;
  const [abierto, setAbierto] = useState(false);
  const [rango, setRango] = useState<DateRange | undefined>();
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);

  const dias = useMemo(
    () => (rango?.from && rango?.to ? differenceInCalendarDays(rango.to, rango.from) + 1 : 0),
    [rango],
  );
  if (!info) return null;
  const tope: number = info.topeDias || 0;
  const solicitudes: SolicitudCongelamiento[] = info.solicitudes || [];
  const pendiente = solicitudes.find((s) => s.estado === 'pendiente');
  const ultima = solicitudes.find((s) => s.estado !== 'pendiente');
  const excede = dias > tope;

  // Sin nada que mostrar: plan sin congelamiento y nunca pidió
  if (!info.puede && !pendiente && !ultima && tope <= 0) return null;

  const enviar = async () => {
    if (!rango?.from || !rango?.to) { toast.error('Elige el día de inicio y el de fin'); return; }
    setEnviando(true);
    const r = await pedirApi<{ error?: string }>('/auth/congelamiento', {
      method: 'POST',
      body: { fecha_inicio: format(rango.from, 'yyyy-MM-dd'), fecha_fin: format(rango.to, 'yyyy-MM-dd'), motivo: motivo.trim() || undefined },
    });
    setEnviando(false);
    if (!r.ok) { toast.error(r.data.error || 'No se pudo enviar la solicitud'); return; }
    toast.success('Solicitud enviada. La academia la revisará.');
    setAbierto(false);
    setRango(undefined);
    setMotivo('');
    await onRefresh();
  };

  const retirar = async (id: number) => {
    setEnviando(true);
    const r = await pedirApi<{ error?: string }>(`/auth/congelamiento/${id}`, { method: 'DELETE' });
    setEnviando(false);
    if (!r.ok) { toast.error(r.data.error || 'No se pudo retirar'); return; }
    toast.success('Solicitud retirada');
    await onRefresh();
  };

  const hoy = new Date();
  return (
    <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-3xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center">
          <Snowflake className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h4 className="text-lg font-semibold text-white">Congelar membresía</h4>
          {tope > 0 && <p className="text-sm text-cyan-200/60">Tu plan permite hasta {tope} días</p>}
        </div>
      </div>

      {pendiente ? (
        <>
          <EstadoSolicitud s={pendiente} />
          <p className="text-xs text-white/50">La academia revisa tu solicitud y te avisará. Mientras tanto, tu plan sigue igual.</p>
          <Button
            variant="outline"
            disabled={enviando}
            onClick={() => retirar(pendiente.id)}
            className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white"
          >
            Retirar solicitud
          </Button>
        </>
      ) : info.puede ? (
        <>
          <p className="text-sm text-white/60">
            Pide las fechas y la academia lo aprueba. Al terminar el congelamiento, tu plan se alarga los días que estuvo pausado.
          </p>
          <Button onClick={() => setAbierto(true)} className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30">
            <Snowflake className="w-4 h-4 mr-2" /> Solicitar congelamiento
          </Button>
        </>
      ) : (
        info.motivo && <p className="text-sm text-white/60">{info.motivo}</p>
      )}

      {ultima && (
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-white/40">Última solicitud</p>
          <EstadoSolicitud s={ultima} />
        </div>
      )}

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white sm:max-w-md w-[95%] rounded-3xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div>
              <DialogTitle className="text-white flex items-center gap-2 mb-1">
                <Snowflake className="w-5 h-5 text-cyan-400" /> Elige las fechas
              </DialogTitle>
              <DialogDescription className="text-white/60 text-sm">
                Hasta {tope} días, empezando como máximo en {info.anticipacionMaxDias} días.
              </DialogDescription>
            </div>
            <div className="flex justify-center bg-black/30 rounded-2xl p-2 border border-white/5">
              <style>{`
                .rdp { --rdp-accent-color: #FA7B21; --rdp-background-color: rgba(250, 123, 33, 0.2); margin: 0; }
                .rdp-day { color: #e4e4e7; }
              `}</style>
              <DayPicker
                mode="range"
                selected={rango}
                onSelect={setRango}
                disabled={{ before: hoy, after: addDays(hoy, info.anticipacionMaxDias + tope) }}
                numberOfMonths={1}
                locale={es}
                className="text-white"
              />
            </div>
            <div className="flex items-end justify-between rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
              <div className="text-sm text-white/60">
                {rango?.from ? format(rango.from, "d 'de' MMM", { locale: es }) : '—'} al {rango?.to ? format(rango.to, "d 'de' MMM", { locale: es }) : '—'}
              </div>
              <div className={cn('text-2xl font-bold', excede ? 'text-red-400' : 'text-white')}>
                {dias} <span className="text-sm font-normal text-white/40">de {tope} días</span>
              </div>
            </div>
            <div>
              <label htmlFor="motivo-congelar" className="block text-white/60 text-sm mb-1.5">Motivo (opcional)</label>
              <textarea
                id="motivo-congelar"
                value={motivo}
                maxLength={300}
                rows={2}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Viaje, salud…"
                className="w-full resize-none rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#FA7B21]/50"
              />
            </div>
            <div className="flex gap-3 rounded-xl border border-white/5 bg-white/5 p-3 text-xs text-white/50">
              <Info className="w-4 h-4 shrink-0 text-white/30" />
              <p>Es una solicitud: la academia la aprueba según las condiciones de tu contrato. Se cuentan los días del calendario.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setAbierto(false)} className="flex-1 border-white/10 hover:bg-white/5 text-white">
                Cancelar
              </Button>
              <Button
                onClick={enviar}
                disabled={!rango?.from || !rango?.to || excede || enviando}
                className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black font-semibold disabled:opacity-50"
              >
                {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar solicitud'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
