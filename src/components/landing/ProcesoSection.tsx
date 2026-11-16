import { CalendarCheck, Users, Heart, Target } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';
import { ui } from '../../styles/marca';

interface ProcesoSectionProps {
  onOpenTrialModal: () => void;
}

const PASOS = [
  { icono: CalendarCheck, titulo: 'Agendas', texto: 'Dejas tus datos y te escribimos por WhatsApp para confirmar el día y la hora.' },
  { icono: Users, titulo: 'Vienes', texto: 'Tu hijo toma la clase y tú conoces la academia y a las profesoras.' },
  { icono: Heart, titulo: 'Decides', texto: 'Te contamos los programas y precios. Sin presión.' },
  { icono: Target, titulo: 'Te inscribes', texto: 'Si les gustó, eliges el programa y lo matriculas en línea.' },
];

export function ProcesoSection({ onOpenTrialModal }: ProcesoSectionProps) {
  return (
    <section className={ui.seccion}>
      <ScrollReveal>
        <div className={ui.cabeceraSeccion}>
          <p className={ui.antetitulo}>Paso a paso</p>
          <h2 className={`mt-4 ${ui.h2}`}>¿Cómo funciona?</h2>
        </div>
      </ScrollReveal>

      <ol className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PASOS.map(({ icono: Icono, titulo, texto }, i) => (
          <li key={titulo}>
            <ScrollReveal delay={i * 60}>
              <div className={`h-full ${ui.card} p-6`}>
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-bold tabular-nums text-white/15">{i + 1}</span>
                  <Icono className="h-6 w-6 text-[#FCA929]" strokeWidth={1.75} />
                </div>
                <h3 className={`mt-4 ${ui.h3}`}>{titulo}</h3>
                <p className="mt-2 leading-relaxed text-white/65">{texto}</p>
              </div>
            </ScrollReveal>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex justify-center">
        <button type="button" onClick={onOpenTrialModal} className={`${ui.btnPrimary} w-full sm:w-auto`}>
          <CalendarCheck className="h-5 w-5" /> Agendar mi clase de prueba
        </button>
      </div>
    </section>
  );
}
