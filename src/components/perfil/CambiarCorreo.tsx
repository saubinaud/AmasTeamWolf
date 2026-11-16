import { useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { pedirApi } from './utils';

// El correo es por donde llega el código para entrar: se cambia solo con un
// código que llega al correo NUEVO (así se sabe que es de la familia y que está
// bien escrito). Queda para todos los hijos de la familia.
export function CambiarCorreo({ actual, onCambiado }: { actual: string; onCambiado: () => Promise<void> }) {
  const [paso, setPaso] = useState<'ver' | 'correo' | 'codigo'>('ver');
  const [nuevo, setNuevo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [aviso, setAviso] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const cerrar = () => { setPaso('ver'); setNuevo(''); setCodigo(''); setAviso(''); setError(''); };

  const enviar = async () => {
    setCargando(true); setError('');
    const r = await pedirApi<{ error?: string; emailHint?: string }>('/auth/correo/solicitar', { method: 'POST', body: { correo: nuevo.trim() } });
    setCargando(false);
    if (!r.ok) { setError(r.data.error || 'No se pudo enviar el código'); return; }
    setAviso(`Te enviamos un código a ${r.data.emailHint || nuevo}. Vence en 15 minutos.`);
    setPaso('codigo');
  };

  const confirmar = async () => {
    setCargando(true); setError('');
    const r = await pedirApi<{ error?: string }>('/auth/correo/confirmar', { method: 'POST', body: { code: codigo } });
    setCargando(false);
    if (!r.ok) { setError(r.data.error || 'El código no es válido'); return; }
    toast.success('Correo actualizado');
    cerrar();
    await onCambiado();
  };

  const campo = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#FA7B21]/50';
  const boton = 'shrink-0 px-3 py-2 rounded-lg text-sm font-medium bg-[#FA7B21] text-white hover:bg-[#F36A15] disabled:opacity-50 flex items-center gap-1.5';

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
        <Mail className="w-4 h-4 text-zinc-400" />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <label className="text-[10px] text-zinc-500 uppercase tracking-wide block">Correo</label>
        {paso === 'ver' && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-white truncate">{actual || 'Sin correo'}</span>
            <button type="button" onClick={() => setPaso('correo')} className="shrink-0 text-xs font-medium text-[#FA7B21] hover:text-[#FCA929]">
              Cambiar
            </button>
          </div>
        )}
        {paso === 'correo' && (
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); enviar(); }}>
            <input type="email" autoComplete="email" value={nuevo} onChange={(e) => setNuevo(e.target.value)} placeholder="correo@nuevo.com" className={campo} autoFocus />
            <button type="submit" disabled={cargando || !nuevo.includes('@')} className={boton}>
              {cargando && <Loader2 className="w-4 h-4 animate-spin" />} Enviar código
            </button>
          </form>
        )}
        {paso === 'codigo' && (
          <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); confirmar(); }}>
            <p className="text-xs text-white/60">{aviso}</p>
            <div className="flex gap-2">
              <input
                inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000" className={`${campo} tracking-[0.4em] text-center`} autoFocus
              />
              <button type="submit" disabled={cargando || codigo.length !== 6} className={boton}>
                {cargando && <Loader2 className="w-4 h-4 animate-spin" />} Confirmar
              </button>
            </div>
          </form>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
        {paso !== 'ver' && (
          <button type="button" onClick={cerrar} className="text-xs text-zinc-500 hover:text-zinc-300">Cancelar cambio de correo</button>
        )}
      </div>
    </div>
  );
}
