import { useState, useEffect, useCallback } from 'react';
import { Clock, LogIn, LogOut, CheckCircle2, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '../config/api';

type Estado = 'sin_iniciar' | 'trabajando' | 'finalizado';

interface FichajeData {
  profesor: { id: number; nombre: string };
  estado: Estado;
  hora_entrada: string | null;
  hora_salida: string | null;
  duracion_min: number | null;
  mensaje?: string;
}

interface ProfesorAsistenciaPageProps {
  onNavigate?: (page: string) => void;
}

// "19:05:00.123" -> "7:05 p.m."
function formatHora12(time: string | null): string {
  if (!time) return '--';
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr ?? '00';
  const sufijo = h >= 12 ? 'p.m.' : 'a.m.';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${sufijo}`;
}

// minutos -> "3h 20m"
function formatDuracion(min: number | null): string {
  if (min == null) return '--';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// segundos -> "03:20:15"
function formatCrono(seg: number): string {
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
}

export function ProfesorAsistenciaPage(_props: ProfesorAsistenciaPageProps) {
  const [dni, setDni] = useState('');
  const [data, setData] = useState<FichajeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Cronómetro en vivo mientras está "trabajando".
  useEffect(() => {
    if (data?.estado !== 'trabajando' || !data.hora_entrada) return;
    const [h, m, s] = data.hora_entrada.split(':').map(Number);
    const inicio = new Date();
    inicio.setHours(h, m, Math.floor(s || 0), 0);
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - inicio.getTime()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [data?.estado, data?.hora_entrada]);

  const consultarEstado = useCallback(async (dniBuscar: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/profesores/estado?dni=${encodeURIComponent(dniBuscar)}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || 'No se encontró un profesor con ese DNI');
        return;
      }
      setData(json.data);
    } catch {
      toast.error('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fichar = useCallback(async () => {
    if (!data) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/profesores/fichar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni: dni.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || 'No se pudo registrar');
        return;
      }
      setData(json.data);
      if (json.data.accion === 'entrada') toast.success('¡Entrada registrada! 🥋');
      else if (json.data.accion === 'salida') toast.success('¡Salida registrada! Buen trabajo 💪');
    } catch {
      toast.error('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [data, dni]);

  const reset = () => { setData(null); setDni(''); setElapsed(0); };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        {/* Encabezado */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FA7B21]/15 mb-3">
            <Clock className="w-7 h-7 text-[#FA7B21]" />
          </div>
          <h1 className="text-2xl font-bold">Asistencia de profesores</h1>
          <p className="text-zinc-400 text-sm mt-1">AMAS Team Wolf</p>
        </div>

        {/* Paso 1: ingresar DNI */}
        {!data && (
          <form
            onSubmit={(e) => { e.preventDefault(); if (dni.trim()) consultarEstado(dni.trim()); }}
            className="space-y-4"
          >
            <div>
              <label className="text-sm text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <User className="w-4 h-4" /> Tu DNI
              </label>
              <input
                type="tel"
                inputMode="numeric"
                autoFocus
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                placeholder="12345678"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3.5 text-lg tracking-wide text-center focus:border-[#FA7B21] focus:outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading || dni.trim().length < 6}
              className="w-full bg-[#FA7B21] hover:bg-[#e56d15] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3.5 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continuar'}
            </button>
          </form>
        )}

        {/* Paso 2: estado del profesor */}
        {data && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-zinc-400 text-sm">Hola,</p>
              <p className="text-xl font-bold">{data.profesor.nombre} 👋</p>
            </div>

            {/* Sin iniciar → marcar entrada */}
            {data.estado === 'sin_iniciar' && (
              <button
                onClick={fichar}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-lg rounded-2xl py-6 transition-colors flex items-center justify-center gap-2.5"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><LogIn className="w-6 h-6" /> Marcar entrada</>}
              </button>
            )}

            {/* Trabajando → cronómetro + marcar salida */}
            {data.estado === 'trabajando' && (
              <>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl py-7 text-center">
                  <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">Trabajando desde {formatHora12(data.hora_entrada)}</p>
                  <p className="text-5xl font-bold font-mono tabular-nums text-emerald-400">{formatCrono(elapsed)}</p>
                </div>
                <button
                  onClick={fichar}
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-lg rounded-2xl py-6 transition-colors flex items-center justify-center gap-2.5"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><LogOut className="w-6 h-6" /> Marcar salida</>}
                </button>
              </>
            )}

            {/* Finalizado → resumen */}
            {data.estado === 'finalizado' && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <div>
                  <p className="text-zinc-400 text-sm">Jornada de hoy</p>
                  <p className="text-3xl font-bold">{formatDuracion(data.duracion_min)}</p>
                </div>
                <div className="flex justify-center gap-6 text-sm pt-2 border-t border-zinc-800">
                  <div>
                    <p className="text-zinc-500 text-xs">Entrada</p>
                    <p className="font-medium">{formatHora12(data.hora_entrada)}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">Salida</p>
                    <p className="font-medium">{formatHora12(data.hora_salida)}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={reset}
              className="w-full text-zinc-400 hover:text-white text-sm py-2 transition-colors"
            >
              {data.estado === 'finalizado' ? 'Listo' : 'Cambiar de profesor'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfesorAsistenciaPage;
