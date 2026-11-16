import { Check, CalendarCheck, MapPin, Clock, Wallet, ArrowUpRight } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';
import { DIRECCION, DISTRITO } from '../../config/contacto';
import { HORARIO } from '../../config/horario';
import { ui } from '../../styles/marca';
import { useCostoClasePrueba } from './clasePrueba';

const MAPA = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${DIRECCION}, ${DISTRITO}, Lima`)}`;

const INCLUYE = [
  'Una clase de taekwondo con una profesora de la academia',
  'Conocer el tatami, los compañeros y cómo es una clase',
  'Conversar contigo sobre los programas, horarios y precios',
  'Sin compromiso: decides después, con calma',
];

interface IncluyeSectionProps {
  onOpenTrialModal: () => void;
}

/** Qué incluye la clase de prueba y los datos para llegar. El costo solo si está en el catálogo. */
export function IncluyeSection({ onOpenTrialModal }: IncluyeSectionProps) {
  const costo = useCostoClasePrueba();

  return (
    <section className={ui.seccion}>
      <ScrollReveal>
        <div className="mx-auto grid max-w-5xl items-start gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8">
          <div className={`${ui.card} ${ui.cardPad}`}>
            <p className={ui.antetitulo}>La clase de prueba</p>
            <h2 className={`mt-4 ${ui.h2}`}>Qué incluye</h2>
            <ul className="mt-6 space-y-4">
              {INCLUYE.map((t) => (
                <li key={t} className="flex items-start gap-3 text-white/85">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#FCA929]" strokeWidth={2} />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <button type="button" onClick={onOpenTrialModal} className={`mt-8 w-full sm:w-auto ${ui.btnPrimary}`}>
              <CalendarCheck className="h-5 w-5" /> Agendar clase de prueba
            </button>
          </div>

          <ul className={`${ui.card} divide-y divide-white/[0.07] px-6 py-2 sm:px-8`}>
            <li>
              <a href={MAPA} target="_blank" rel="noopener noreferrer" className="group flex min-h-[56px] items-center gap-4 py-4">
                <MapPin className="h-5 w-5 shrink-0 text-[#FCA929]" strokeWidth={1.75} />
                <span className="flex-1">
                  <span className="block text-sm text-white/45">Dónde</span>
                  <span className="text-white/90">{DIRECCION}, {DISTRITO}</span>
                </span>
                <ArrowUpRight className="h-4 w-4 text-white/40 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </li>
            <li className="flex items-center gap-4 py-4">
              <Clock className="h-5 w-5 shrink-0 text-[#FCA929]" strokeWidth={1.75} />
              <span>
                <span className="block text-sm text-white/45">Horario de la academia</span>
                {HORARIO.map((h) => <span key={h.dias} className="block text-white/90">{h.corto}</span>)}
              </span>
            </li>
            <li className="flex items-center gap-4 py-4">
              <Wallet className="h-5 w-5 shrink-0 text-[#FCA929]" strokeWidth={1.75} />
              <span>
                <span className="block text-sm text-white/45">Costo</span>
                <span className="text-white/90">
                  {costo.texto ?? (costo.cargando ? '…' : 'Te lo confirmamos por WhatsApp al agendar')}
                </span>
                {costo.nota && <span className="block text-sm text-white/55">{costo.nota}</span>}
              </span>
            </li>
          </ul>
        </div>
      </ScrollReveal>
    </section>
  );
}
