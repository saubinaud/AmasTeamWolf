import { Check, Shield, Zap, TrendingUp, CalendarCheck } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';
import { ui } from '../../styles/marca';

interface MetodologiaSectionProps {
  onOpenTrialModal: () => void;
}

const PILARES = [
  {
    icono: Shield,
    titulo: 'Disciplina',
    texto: 'Aprende a seguir instrucciones desde el primer día, con respeto y sin gritos.',
    puntos: ['Rutinas estructuradas según la edad', 'Refuerzo positivo', 'Límites claros con paciencia'],
  },
  {
    icono: Zap,
    titulo: 'Confianza',
    texto: 'Descubre que sí puede hacer cosas difíciles y gana seguridad en sí mismo.',
    puntos: ['Retos progresivos según su nivel', 'Cada logro se celebra', 'Un lugar seguro para equivocarse'],
  },
  {
    icono: TrendingUp,
    titulo: 'Liderazgo',
    texto: 'Se convierte en ejemplo para otros: en casa, en el colegio y con sus amigos.',
    puntos: ['Responsabilidad y autonomía', 'Trabajo en equipo y empatía', 'Ayuda a los compañeros nuevos'],
  },
];

export function MetodologiaSection({ onOpenTrialModal }: MetodologiaSectionProps) {
  return (
    <section className={ui.seccion}>
      <ScrollReveal>
        <div className={ui.cabeceraSeccion}>
          <p className={ui.antetitulo}>Cómo trabajamos</p>
          <h2 className={`mt-4 ${ui.h2}`}>Taekwondo con <span className={ui.resalte}>formación de carácter</span></h2>
          <p className={`mt-4 ${ui.bajada}`}>Cada clase combina técnica de artes marciales con tres pilares.</p>
        </div>
      </ScrollReveal>

      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3">
        {PILARES.map(({ icono: Icono, titulo, texto, puntos }, i) => (
          <ScrollReveal key={titulo} delay={i * 60}>
            <article className={`h-full ${ui.card} ${ui.cardPad}`}>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FA7B21]/15">
                  <Icono className="h-5 w-5 text-[#FCA929]" />
                </span>
                <h3 className={ui.h3}>{titulo}</h3>
              </div>
              <p className="mt-4 leading-relaxed text-white/75">{texto}</p>
              <ul className="mt-5 space-y-2.5">
                {puntos.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-white/65">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FCA929]" /> {p}
                  </li>
                ))}
              </ul>
            </article>
          </ScrollReveal>
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <button type="button" onClick={onOpenTrialModal} className={`${ui.btnPrimary} w-full sm:w-auto`}>
          <CalendarCheck className="h-5 w-5" /> Agendar clase de prueba
        </button>
      </div>
    </section>
  );
}
