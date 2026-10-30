import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { API_BASE } from '../config/api';
import { cx } from '../components/matricula/tokens';
import { CabeceraJMA } from '../components/matricula/piezas';
import { ContratoFirma } from '../components/ContratoFirma';

// /firmar/:token: el apoderado firma desde su celular el contrato de un plan que
// ya está inscrito. La academia genera el enlace en Space (ficha del alumno ▸
// Firmar contrato ▸ Enviar para firmar) y lo manda por WhatsApp.
// Es el mismo contrato y la misma firma que la inscripción (ContratoFirma): los
// datos los arma el API desde la ficha (GET /api/contratos/firmar/:token) y al
// firmar genera el PDF (POST). El enlace es de un solo uso y vence.

type Valor = string | number | null;

interface Borrador {
  firmado: boolean;
  requiere_adenda: boolean;
  anulado: boolean;
  faltan: { campo: string; texto: string; bloquea: boolean }[];
  d: Record<string, Valor>;
  expira_at: string;
}

const t = (v: Valor | undefined) => (v == null ? '' : String(v));

export function FirmarContratoPage() {
  const { token = '' } = useParams();
  const [b, setB] = useState<Borrador | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [firma, setFirma] = useState('');
  const [autorizaImagen, setAutorizaImagen] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    fetch(`${API_BASE}/contratos/firmar/${encodeURIComponent(token)}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.success) throw new Error(j.error || 'No se pudo abrir el contrato');
        return j.data as Borrador;
      })
      .then((data) => { if (vigente) setB(data); })
      .catch((e: Error) => { if (vigente) setError(e.message); });
    return () => { vigente = false; };
  }, [token]);

  const datos = useMemo(() => {
    if (!b) return null;
    const d = b.d;
    return {
      nombrePadre: t(d.nombrePadre), dniPadre: t(d.dniPadre), email: t(d.email), telefono: t(d.telefono),
      direccion: t(d.direccion), nombreAlumno: t(d.nombreAlumno), dniAlumno: t(d.dniAlumno),
      fechaNacimiento: t(d.fechaNacimiento), categoriaAlumno: t(d.categoriaAlumno), programa: t(d.programa),
      fechaInicio: t(d.fechaInicio), fechaFin: t(d.fechaFin),
      clasesTotales: d.clasesTotales != null ? Number(d.clasesTotales) : undefined,
      turnoSeleccionado: t(d.turnoSeleccionado), diasTentativos: t(d.diasTentativos),
      precioPrograma: Number(d.precioPrograma) || 0, descuentoDinero: Number(d.descuentoDinero) || 0,
      total: Number(d.total) || 0,
    };
  }, [b]);

  const onFirma = useCallback((f: string) => setFirma(f), []);

  const enviar = async () => {
    if (!firma) return;
    setEnviando(true);
    setError(null);
    try {
      const r = await fetch(`${API_BASE}/contratos/firmar/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firma, autoriza_imagen: autorizaImagen }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.success) throw new Error(j.error || 'No se pudo guardar la firma');
      setListo(j.data?.url || '');
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  const bloquea = b?.faltan.find((f) => f.bloquea);
  const yaFirmado = !!b && b.firmado && !b.requiere_adenda;

  return (
    <div className={cx.pagina}>
      <CabeceraJMA />
      <main className={`${cx.contenedor} py-8 pb-16`}>
        {listo !== null ? (
          <div className="py-8 text-center">
            <CheckCircle className="mx-auto h-14 w-14 text-emerald-400" />
            <h1 className={`${cx.h1} mt-5`}>¡Contrato firmado!</h1>
            <p className={`${cx.textoSec} mx-auto mt-3 max-w-md text-[16px] leading-relaxed`}>
              Gracias. La academia ya tiene tu contrato firmado. Puedes guardar una copia en PDF.
            </p>
            {listo && (
              <a href={listo} target="_blank" rel="noopener noreferrer" className={`${cx.btnPrimario} mx-auto mt-8 max-w-sm`}>
                Ver mi contrato <ExternalLink className="h-5 w-5" />
              </a>
            )}
          </div>
        ) : !b || !datos ? (
          error ? (
            <div className="py-8 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-amber-300" />
              <h1 className={`${cx.h2} mt-4`}>{error}</h1>
              <p className={`${cx.textoSec} mt-2 text-[15px]`}>Si crees que es un error, escríbenos por WhatsApp.</p>
            </div>
          ) : (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-white/50" /></div>
          )
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className={cx.h1}>Firma tu contrato</h1>
              <p className={`${cx.textoSec} mt-2 text-[16px]`}>
                Revisa los datos de {datos.nombreAlumno || 'tu hijo(a)'}, lee el contrato y fírmalo con el dedo.
              </p>
            </div>
            {yaFirmado ? (
              <p className={cx.avisoOk}>Este contrato ya está firmado.</p>
            ) : b.anulado ? (
              <p className={cx.avisoAmbar}>Este plan ya no está vigente. Escríbenos por WhatsApp.</p>
            ) : bloquea ? (
              <p className={cx.avisoAmbar}>{bloquea.texto}. Escríbenos por WhatsApp para completarlo.</p>
            ) : (
              <>
                <ContratoFirma
                  datos={datos}
                  onFirmaCompleta={onFirma}
                  onAutorizaImagen={setAutorizaImagen}
                  notaFirmado="Toca «Enviar firma» para terminar."
                />
                {error && <p className={cx.avisoError}>{error}</p>}
                <button type="button" onClick={enviar} disabled={!firma || enviando} className={`${cx.btnPrimario} w-full`}>
                  {enviando && <Loader2 className="h-5 w-5 animate-spin" />} Enviar firma
                </button>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
