import { EyeOff, Ear, Frown } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';
import { ui } from '../../styles/marca';

const SITUACIONES = [
  { icono: EyeOff, titulo: 'Le cuesta soltarse', texto: 'Se esconde detrás de ti, no habla en el colegio o le da miedo probar cosas nuevas.' },
  { icono: Ear, titulo: 'No escucha', texto: 'Hay que repetirle las cosas varias veces, hace berrinches o no sigue las reglas.' },
  { icono: Frown, titulo: 'Se rinde rápido', texto: 'Dice "no puedo", no cree en sí mismo y abandona cuando algo le cuesta.' },
];

export function ProblemasSection() {
  return (
    <section id="problemas" className={`${ui.seccion} scroll-mt-20`}>
      <ScrollReveal>
        <div className={ui.cabeceraSeccion}>
          <p className={ui.antetitulo}>Situaciones de todos los días</p>
          <h2 className={`mt-4 ${ui.h2}`}>¿Te suena familiar?</h2>
        </div>
      </ScrollReveal>

      <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
        {SITUACIONES.map(({ icono: Icono, titulo, texto }, i) => (
          <ScrollReveal key={titulo} delay={i * 60}>
            <article className={`h-full ${ui.card} ${ui.cardPad}`}>
              <Icono className="h-7 w-7 text-[#FCA929]" strokeWidth={1.75} />
              <h3 className={`mt-5 ${ui.h3}`}>{titulo}</h3>
              <p className="mt-2 leading-relaxed text-white/65">{texto}</p>
            </article>
          </ScrollReveal>
        ))}
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-lg text-white/80">
        Si tu hijo pasa por alguna de estas situaciones, <strong className="font-semibold text-white">el taekwondo puede ayudarlo</strong>.
      </p>
    </section>
  );
}
