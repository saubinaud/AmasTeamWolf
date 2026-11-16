import { CalendarCheck, MessageCircle } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';
import { enlaceWhatsApp } from '../../config/contacto';
import { HORARIO } from '../../config/horario';
import { ui } from '../../styles/marca';

interface CTAFinalSectionProps {
  onOpenTrialModal: () => void;
}

export function CTAFinalSection({ onOpenTrialModal }: CTAFinalSectionProps) {
  return (
    <section className="container mx-auto px-4 pb-24 pt-8 md:pb-28">
      <ScrollReveal>
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950 px-6 py-12 text-center sm:px-10 md:py-16">
          <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-[#FA7B21]/25 blur-3xl" />
          <div className="relative">
            <h2 className={ui.h2}>Ven a conocernos con tu hijo</h2>
            <p className={`mx-auto mt-4 max-w-xl ${ui.bajada}`}>
              Agenda la clase de prueba y te escribimos por WhatsApp para confirmar el día.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button type="button" onClick={onOpenTrialModal} className={`${ui.btnPrimary} w-full sm:w-auto`}>
                <CalendarCheck className="h-5 w-5" /> Agendar clase de prueba
              </button>
              <a
                href={enlaceWhatsApp('Hola, quiero información de la clase de prueba')}
                target="_blank"
                rel="noopener noreferrer"
                className={`${ui.btnSecondary} w-full sm:w-auto`}
              >
                <MessageCircle className="h-5 w-5" /> Escribir por WhatsApp
              </a>
            </div>
            <p className="mt-6 text-sm text-white/45">{HORARIO.map((h) => h.corto).join(' · ')}</p>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
