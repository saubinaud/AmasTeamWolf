import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CheckCircle2, Link2 } from 'lucide-react';

/** Lo que devuelve el API de una entrada (GET /formularios/entrada/:token o al responder). */
export interface Entrada {
  token: string;
  titulo: string;
  nombre: string;
  evento: { dia: string; hora: string } | null;
  lugar: string | null;
  asistio_at: string | null;
  url: string;
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

/**
 * La entrada de un formulario: QR y datos del evento.
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
