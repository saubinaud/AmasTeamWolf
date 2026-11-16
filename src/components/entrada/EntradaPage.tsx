import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { API_BASE } from '../../config/api';
import { enlaceWhatsApp } from '../../config/contacto';
import { EntradaTarjeta, type Entrada } from './EntradaTarjeta';

/**
 * teamwolfxjma.com/entrada/:token — la entrada de un formulario. Es la URL que va
 * dentro del QR (web y correo): quien la abre ve su entrada; el equipo
 * la valida desde Space ▸ Validar entradas.
 */
export function EntradaPage() {
  const { token = '' } = useParams<{ token: string }>();
  const [entrada, setEntrada] = useState<Entrada | null>(null);
  const [estado, setEstado] = useState<'cargando' | 'lista' | 'no-existe'>('cargando');

  useEffect(() => {
    let vivo = true;
    fetch(`${API_BASE}/formularios/entrada/${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => { if (vivo) { setEntrada({ token, ...j.data }); setEstado('lista'); } })
      .catch(() => vivo && setEstado('no-existe'));
    return () => { vivo = false; };
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#0A0705] px-4 py-10 text-white">
      <a href="/" className="mb-8">
        <img src="/marca/logo-completo-oscuro-800.png" alt="Team Wolf, centro de entrenamiento × JMA" width={800} height={258} className="h-11 w-auto" />
      </a>
      <div className="w-full max-w-sm">
        {estado === 'cargando' && <Loader2 className="mx-auto mt-20 h-8 w-8 animate-spin text-[#FA7B21]" />}
        {estado === 'lista' && entrada && <EntradaTarjeta entrada={entrada} mostrarEnlace={false} />}
        {estado === 'no-existe' && (
          <div className="mt-10 text-center">
            <p className="text-xl font-semibold">No encontramos esta entrada</p>
            <p className="mt-2 text-white/60">Revisa el enlace o escríbenos y te ayudamos.</p>
            <a href={enlaceWhatsApp('Hola, no encuentro mi entrada')} target="_blank" rel="noopener noreferrer"
              className="mt-6 inline-flex min-h-[44px] items-center rounded-xl border border-white/15 px-5 text-sm text-white/85">
              Escribir por WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
