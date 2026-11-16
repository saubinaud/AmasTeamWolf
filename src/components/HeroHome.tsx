import { CalendarCheck, Clock, MapPin } from 'lucide-react';
import { EnlaceInterno } from './EnlaceInterno';
import { DIRECCION, DISTRITO } from '../config/contacto';
import { HORARIO } from '../config/horario';
import { ui } from '../styles/marca';

// Foto real de la academia (alumno en clase con su profesora), recortada en
// Cloudinary para que no salga el letrero con la marca anterior.
const FOTO = (ancho: number) =>
  `https://res.cloudinary.com/dkoocok3j/image/upload/c_crop,w_0.71,h_0.66,x_0,y_0.24,g_north_west/w_${ancho},q_auto,f_auto/v1763125698/Requested_Photos_and_Videos_8660_vy633p.jpg`;

interface HeroHomeProps {
  onNavigate: (page: string, sectionId?: string) => void;
}

export function HeroHome({ onNavigate }: HeroHomeProps) {
  const verProgramas = () => document.getElementById('programas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <section id="hero" className="container mx-auto px-4 pt-24 pb-14 sm:pt-28 md:pb-20 lg:pt-32">
      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div>
          <p className={ui.antetitulo}>Team Wolf × JMA</p>
          <h1 className={`mt-4 ${ui.h1}`}>
            Taekwondo para niños en <span className={ui.resalte}>{DISTRITO}</span>
          </h1>
          <p className={`mt-5 max-w-xl ${ui.bajada}`}>
            Formamos líderes desde pequeños: disciplina, respeto y confianza a través del taekwondo, con seguimiento de su avance en cada etapa.
          </p>

          <ul className="mt-7 flex flex-col gap-2 text-sm text-white/75 sm:flex-row sm:flex-wrap">
            <li className={ui.chip}>
              <MapPin className="h-4 w-4 text-[#FCA929]" /> {DIRECCION}, {DISTRITO}
            </li>
            <li className={ui.chip}>
              <Clock className="h-4 w-4 text-[#FCA929]" /> {HORARIO.map((h) => h.corto).join(' · ')}
            </li>
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <EnlaceInterno
              page="clase-prueba"
              onNavigate={onNavigate}
              className={`${ui.btnPrimary} w-full sm:w-auto`}
              data-umami-event="Click Clase de prueba"
              data-umami-event-ubicacion="hero"
            >
              <CalendarCheck className="h-5 w-5" /> Agendar clase de prueba
            </EnlaceInterno>
            <button
              type="button"
              onClick={verProgramas}
              data-umami-event="Click Ver Programas"
              data-umami-event-ubicacion="hero"
              className={`${ui.btnSecondary} w-full sm:w-auto`}
            >
              Ver programas
            </button>
          </div>
        </div>

        <figure className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div aria-hidden className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-[#FA7B21]/15 blur-3xl" />
          <img
            src={FOTO(800)}
            srcSet={`${FOTO(480)} 480w, ${FOTO(800)} 800w, ${FOTO(1100)} 1100w`}
            sizes="(min-width: 1024px) 40vw, (min-width: 640px) 28rem, 100vw"
            alt="Alumno de Team Wolf practicando taekwondo con su profesora en la academia de San Borja"
            width={800}
            height={992}
            loading="eager"
            className="relative aspect-[4/3] w-full rounded-3xl border border-white/10 object-cover object-[50%_35%] sm:aspect-[4/5]"
          />
        </figure>
      </div>
    </section>
  );
}
