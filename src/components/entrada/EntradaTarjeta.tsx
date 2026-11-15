import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CheckCircle2, Link2 } from 'lucide-react';
import { API_BASE } from '../../config/api';

/** Lo que devuelve el API de una entrada (GET /formularios/entrada/:token o al responder). */
export interface Entrada {
  token: string;
  titulo: string;
  nombre: string;
  evento: { dia: string; hora: string } | null;
  lugar: string | null;
  asistio_at: string | null;
  url: string;
  wallet: { apple: boolean; google: boolean };
}

/** QR dibujado en el navegador (SVG): el token no pasa por ningún servicio externo. */
function QR({ valor }: { valor: string }) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    QRCode.toString(valor, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#0A0705', light: '#FFFFFF' } })
      .then(setSvg)
      .catch(() => setSvg(''));
  }, [valor]);
  return (
    <div className="mx-auto aspect-square w-full max-w-[220px] [&>svg]:h-full [&>svg]:w-full" aria-label="Código QR de tu entrada"
      dangerouslySetInnerHTML={{ __html: svg }} />
  );
}

const esIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);

function BotonesWallet({ entrada }: { entrada: Entrada }) {
  const { apple, google } = entrada.wallet;
  if (!apple && !google) return null;
  const base = `${API_BASE}/formularios/entrada/${entrada.token}`;
  const botones = [
    apple && (
      <a key="apple" href={`${base}/apple`}
        className="flex min-h-[48px] items-center justify-center gap-2.5 rounded-xl bg-black px-4 text-sm font-semibold text-white ring-1 ring-white/15 transition-transform duration-150 active:scale-[0.98]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden><path d="M16.37 12.74c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.87-.76-1.47.02-2.83.86-3.59 2.18-1.53 2.66-.39 6.59 1.1 8.75.73 1.05 1.6 2.24 2.73 2.2 1.1-.05 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.83-1.22 1.17-2.4 1.19-2.46-.03-.01-2.28-.88-2.3-3.48zM14.2 6.28c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.65-1.05 1.68-.92 2.68.97.07 1.96-.5 2.56-1.23z" /></svg>
        Agregar a Apple Wallet
      </a>
    ),
    google && (
      <a key="google" href={`${base}/google`} target="_blank" rel="noopener noreferrer"
        className="flex min-h-[48px] items-center justify-center gap-2.5 rounded-xl bg-black px-4 text-sm font-semibold text-white ring-1 ring-white/15 transition-transform duration-150 active:scale-[0.98]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
          <path fill="#4285F4" d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5V9H3z" />
          <path fill="#34A853" d="M3 9h18v3H3z" />
          <path fill="#FBBC04" d="M3 12h18v3H3z" />
          <path fill="#EA4335" d="M3 15h18v2.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" />
        </svg>
        Guardar en Google Wallet
      </a>
    ),
  ].filter(Boolean);
  // En iPhone, Apple primero; en el resto, Google primero
  if (!esIOS()) botones.reverse();
  return <div className="grid gap-2.5">{botones}</div>;
}

/**
 * La entrada de un formulario: QR, datos del evento y los botones de Wallet.
 * La usan la confirmación del formulario y la página /entrada/:token.
 */
export function EntradaTarjeta({ entrada, mostrarEnlace = true }: { entrada: Entrada; mostrarEnlace?: boolean }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = () => {
    navigator.clipboard?.writeText(entrada.url).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 1800); });
  };

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950 text-left">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#FA7B21] via-[#E2580F] to-[#7C2D12] px-6 py-5">
        <div aria-hidden className="absolute -right-8 -top-8 h-32 w-32 rounded-full"
          style={{ background: 'radial-gradient(circle at 35% 35%, #FFF3C4 0%, #FFE08A 30%, #FCA929 65%, rgba(250,123,33,0) 72%)' }} />
        <p className="relative text-xs font-semibold uppercase tracking-[0.16em] text-white/85">Tu entrada</p>
        <p className="relative mt-1 text-xl font-bold text-white">{entrada.titulo}</p>
      </div>

      <div className="px-6 pt-6">
        <p className="text-sm text-white/45">A nombre de</p>
        <p className="text-lg font-semibold text-white">{entrada.nombre}</p>
        {(entrada.evento || entrada.lugar) && (
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            {entrada.evento && (
              <div className="col-span-2 sm:col-span-1">
                <dt className="text-white/45">Fecha</dt>
                <dd className="text-white/90 first-letter:uppercase">{entrada.evento.dia}, {entrada.evento.hora}</dd>
              </div>
            )}
            {entrada.lugar && (
              <div className="col-span-2 sm:col-span-1">
                <dt className="text-white/45">Lugar</dt>
                <dd className="text-white/90">{entrada.lugar}</dd>
              </div>
            )}
          </dl>
        )}
      </div>

      <div className="relative my-6 h-0">
        <span aria-hidden className="absolute -left-3.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full border border-white/10 bg-[#0A0705]" />
        <span aria-hidden className="absolute -right-3.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full border border-white/10 bg-[#0A0705]" />
        <div className="mx-6 border-t-2 border-dashed border-white/10" />
      </div>

      <div className="px-6 pb-6">
        {entrada.asistio_at ? (
          <p className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/10 py-8 text-emerald-300">
            <CheckCircle2 className="h-5 w-5" /> Entrada usada. ¡Gracias por venir!
          </p>
        ) : (
          <>
            <div className="rounded-2xl bg-white p-4"><QR valor={entrada.url} /></div>
            <p className="mt-3 text-center text-sm text-white/50">Muestra este código al llegar</p>
          </>
        )}

        <div className="mt-5 space-y-2.5">
          <BotonesWallet entrada={entrada} />
          {mostrarEnlace && (
            <button type="button" onClick={copiar}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/10 text-sm text-white/75 transition-colors duration-150 hover:border-white/25 hover:text-white">
              <Link2 className="h-4 w-4" /> {copiado ? 'Enlace copiado' : 'Copiar el enlace de mi entrada'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
