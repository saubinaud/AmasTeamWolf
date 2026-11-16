import { ArrowDown, CalendarCheck, Clock, MapPin } from 'lucide-react';
import { DIRECCION, DISTRITO } from '../../config/contacto';
import { HORARIO } from '../../config/horario';
import { ui } from '../../styles/marca';
import { FOTO_CLASE } from './clasePrueba';

interface HeroSectionProps {
  onOpenTrialModal: () => void;
  onScrollToSection: (id: string) => void;
}

export function HeroSection({ onOpenTrialModal, onScrollToSection }: HeroSectionProps) {
  return (
    <section className="container mx-auto px-4 pt-24 pb-14 sm:pt-28 md:pb-20 lg:pt-32">
      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div>
          <p className={ui.antetitulo}>Clase de prueba · Taekwondo para niños</p>
          <h1 className={`mt-4 ${ui.h1}`}>
            ¿Tu hijo es <span className={ui.resalte}>tímido</span> o le cuesta <span className={ui.resalte}>seguir reglas</span>?
          </h1>
          <p className={`mt-5 max-w-xl ${ui.bajada}`}>
            En el taekwondo aprende a seguir instrucciones, a confiar en sí mismo y a respetar a los demás, sin gritos y sin presión.
            Ven a una clase de prueba y conoce la academia.
          </p>

          <ul className="mt-7 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <li className={ui.chip}><MapPin className="h-4 w-4 text-[#FCA929]" /> {DIRECCION}, {DISTRITO}</li>
            <li className={ui.chip}><Clock className="h-4 w-4 text-[#FCA929]" /> {HORARIO.map((h) => h.corto).join(' · ')}</li>
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={onOpenTrialModal} className={`${ui.btnPrimary} w-full sm:w-auto`}>
              <CalendarCheck className="h-5 w-5" /> Agendar clase de prueba
            </button>
            <button type="button" onClick={() => onScrollToSection('problemas')} className={`${ui.btnSecondary} w-full sm:w-auto`}>
              Ver cómo funciona <ArrowDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        <figure className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div aria-hidden className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-[#FA7B21]/15 blur-3xl" />
          <img
            src={FOTO_CLASE(800)}
            srcSet={`${FOTO_CLASE(480)} 480w, ${FOTO_CLASE(800)} 800w, ${FOTO_CLASE(1100)} 1100w`}
            sizes="(min-width: 1024px) 40vw, (min-width: 640px) 28rem, 100vw"
            alt="Alumno de Team Wolf en una clase de taekwondo con su profesora"
            width={800}
            height={992}
            className="relative aspect-[4/3] w-full rounded-3xl border border-white/10 object-cover object-[50%_35%] sm:aspect-[4/5]"
          />
        </figure>
      </div>
    </section>
  );
}
