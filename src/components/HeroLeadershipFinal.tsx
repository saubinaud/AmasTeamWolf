import { useState } from 'react';
import { ArrowDown, ChevronDown } from 'lucide-react';
import { PrecioLeadership, useLeadership } from './LeadershipProgramCard';
import { ui } from '../styles/marca';

interface HeroLeadershipFinalProps {
  onEnrollClick: () => void;
}

/** Arriba de todo: qué es Leadership, su precio (del catálogo) y el botón para inscribirse. */
export function HeroLeadershipFinal({ onEnrollClick }: HeroLeadershipFinalProps) {
  const [info, setInfo] = useState(false);
  const { w, lineas } = useLeadership();
  const verCamino = () => document.getElementById('timeline')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <section id="hero" className="container mx-auto px-4 pt-24 pb-12 sm:pt-28 md:pb-16 lg:pt-32">
      <div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <div>
          <p className={ui.antetitulo}>Programa avanzado</p>
          <h1 className={`mt-4 ${ui.h1}`}>
            Programa <span className={ui.resalte}>Leadership</span>
          </h1>
          <p className={`mt-5 max-w-xl ${ui.bajada}`}>
            Para los alumnos comprometidos: implementos específicos, entrenamiento especializado y un plan de
            12 hitos que fortalece su carácter, disciplina y autoestima.
          </p>
          <p className="mt-3 max-w-xl text-white/55">
            No reemplaza su programa actual: lo complementa mientras sigue con sus clases habituales.
          </p>

          <button type="button" onClick={() => setInfo((v) => !v)} aria-expanded={info} className={`mt-5 ${ui.btnGhost} -ml-2`}>
            Qué incluye
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${info ? 'rotate-180' : ''}`} />
          </button>
          {info && lineas.length > 0 && (
            <ul className="mt-2 grid max-w-xl gap-2 sm:grid-cols-2">
              {lineas.map((t) => (
                <li key={t} className="flex items-center gap-2 text-white/75">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#FCA929]" /> {t}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Precio y acción arriba, antes de los hitos */}
        <div className={`${ui.cardDestacada} ${ui.cardPad}`}>
          {w?.sello && <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-white/45">{w.sello}</p>}
          <PrecioLeadership grande />
          <button type="button" onClick={onEnrollClick} className={`mt-6 w-full ${ui.btnPrimary}`} data-umami-event="Click Inscribirme Leadership" data-umami-event-ubicacion="hero">
            Inscribirme
          </button>
          <button type="button" onClick={verCamino} className={`mt-3 w-full ${ui.btnSecondary}`}>
            Ver los 12 hitos <ArrowDown className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
