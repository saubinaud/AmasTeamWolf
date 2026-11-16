import { Award, Users, Target, Heart, MapPin, Clock, ArrowUpRight } from 'lucide-react';
import { DIRECCION, DISTRITO } from '../config/contacto';
import { HORARIO } from '../config/horario';
import { ui } from '../styles/marca';

const MAPA = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${DIRECCION}, ${DISTRITO}, Lima`)}`;

const VALORES = [
  { icono: Award, titulo: 'Disciplina', texto: 'Hábitos que se notan dentro y fuera del tatami' },
  { icono: Heart, titulo: 'Respeto', texto: 'Por los compañeros, los profesores y uno mismo' },
  { icono: Target, titulo: 'Excelencia', texto: 'Mejorar un poco en cada clase' },
  { icono: Users, titulo: 'Comunidad', texto: 'Familias que entrenan y celebran juntas' },
];

export function NosotrosSection() {
  return (
    <section id="nosotros" className={`${ui.seccion} scroll-mt-20`}>
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div>
          <p className={ui.antetitulo}>Nosotros</p>
          <h2 className={`mt-4 ${ui.h2}`}>Más que un deporte</h2>
          <p className={`mt-5 ${ui.bajada}`}>
            En Team Wolf × JMA creemos que el taekwondo es una herramienta para forjar carácter, disciplina y propósito.
            Cada entrenamiento es una oportunidad para superarse, liderar con el ejemplo y crecer como persona.
          </p>
          <p className="mt-4 leading-relaxed text-white/60">
            Guiamos a cada alumno en su desarrollo físico, mental y emocional, con valores de respeto, perseverancia y confianza.
          </p>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {VALORES.map(({ icono: Icono, titulo, texto }) => (
              <li key={titulo} className="flex items-start gap-3">
                <Icono className="mt-0.5 h-5 w-5 shrink-0 text-[#FCA929]" strokeWidth={1.75} />
                <div>
                  <p className="font-semibold text-white">{titulo}</p>
                  <p className="text-sm text-white/55">{texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Datos prácticos de la sede */}
        <div className={`${ui.card} self-start overflow-hidden`}>
          <p className="px-6 pt-6 text-sm font-semibold text-white sm:px-8 sm:pt-8">La academia</p>
          <ul className="divide-y divide-white/[0.07] px-6 pb-2 sm:px-8">
            <li>
              <a href={MAPA} target="_blank" rel="noopener noreferrer" className="group flex min-h-[56px] items-center gap-4 py-4">
                <MapPin className="h-5 w-5 shrink-0 text-[#FCA929]" strokeWidth={1.75} />
                <span className="flex-1 text-white/90">{DIRECCION}, {DISTRITO}, Lima</span>
                <ArrowUpRight className="h-4 w-4 text-white/40 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </li>
            {HORARIO.map((h) => (
              <li key={h.dias} className="flex items-center gap-4 py-4">
                <Clock className="h-5 w-5 shrink-0 text-[#FCA929]" strokeWidth={1.75} />
                <span className="w-32 shrink-0 text-sm text-white/45">{h.dias}</span>
                <span className="text-white/90">{h.horas}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
