import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Card, CardContent } from './ui/card';
import { CheckCircle } from 'lucide-react';

interface RoadmapStage {
  number: number;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  achievements: string[];
}

const stages: RoadmapStage[] = [
  {
    number: 1,
    emoji: '🥋',
    title: 'DOMINIO Y CONFIANZA',
    subtitle: 'De sostener el arma a dominarla con naturalidad',
    description: 'Aprende a manejar cada implemento con seguridad, fluidez y control total. La base de todo maestro.',
    achievements: [
      'Manejo seguro de todos los implementos',
      'Movimientos fluidos y naturales',
      'Confianza en la ejecución',
      'Control corporal avanzado'
    ]
  },
  {
    number: 2,
    emoji: '🎯',
    title: 'PRECISIÓN CON PROPÓSITO',
    subtitle: 'Cada movimiento tiene una razón de ser',
    description: 'Los golpes se vuelven precisos, el timing perfecto, cada técnica tiene intención y efectividad.',
    achievements: [
      'Golpes precisos y controlados',
      'Timing y distancia correctos',
      'Comprensión de cada técnica',
      'Ejecución efectiva'
    ]
  },
  {
    number: 3,
    emoji: '👥',
    title: 'TRABAJO EN EQUIPO',
    subtitle: 'Entrenar juntos, crecer juntos',
    description: 'Ejercicios por parejas y grupos que desarrollan comunicación, sincronización y conciencia espacial.',
    achievements: [
      'Coordinación con compañeros',
      'Sentido del ritmo grupal',
      'Comunicación no verbal',
      'Conciencia espacial'
    ]
  },
  {
    number: 4,
    emoji: '⭐',
    title: 'LIDERAZGO EN ACCIÓN',
    subtitle: 'No solo hacer, sino enseñar',
    description: 'Aprende a guiar ejercicios, ayudar a compañeros y liderar con el ejemplo dentro y fuera del tatami.',
    achievements: [
      'Capacidad de instruir',
      'Liderazgo positivo',
      'Mentoría de pares',
      'Autoridad natural'
    ]
  },
  {
    number: 5,
    emoji: '✨',
    title: 'ESTILO PERSONAL',
    subtitle: 'Tu firma en el arte marcial',
    description: 'Crea tu propia secuencia que refleja tu personalidad, creatividad y estilo único. Tu kata personal.',
    achievements: [
      'Secuencia personalizada',
      'Expresión individual',
      'Creatividad técnica',
      'Presencia escénica'
    ]
  },
  {
    number: 6,
    emoji: '💼',
    title: 'MENTALIDAD PROFESIONAL',
    subtitle: 'Piensa como un maestro',
    description: 'Adopta los estándares profesionales: cuidado del equipo, seguridad avanzada y criterio técnico.',
    achievements: [
      'Mantenimiento de implementos',
      'Protocolos de seguridad',
      'Criterio profesional',
      'Responsabilidad total'
    ]
  },
  {
    number: 7,
    emoji: '🏅',
    title: 'DEMOSTRACIÓN DE MAESTRÍA',
    subtitle: 'El momento de brillar',
    description: 'Exhibición formal donde demuestras todo lo aprendido. Certificación oficial y reconocimiento público.',
    achievements: [
      'Presentación pública',
      'Certificación Leadership',
      'Reconocimiento formal',
      'Símbolo de tu progreso'
    ]
  }
];

export function LeadershipRoadmap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  });

  const pathProgress = useTransform(scrollYProgress, [0, 1], [0, pathLength]);

  useEffect(() => {
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength();
      setPathLength(length);
    }
  }, []);

  return (
    <section id="roadmap" ref={containerRef} className="py-20 bg-gradient-to-b from-black to-zinc-900 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-white mb-4">🏆 EL CAMINO LEADERSHIP en 7 Etapas</h2>
          <p className="text-white/70 text-xl max-w-3xl mx-auto">
            Un viaje estructurado donde cada etapa prepara la siguiente
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto relative">
          {/* SVG Path - El camino animado */}
          <svg
            className="absolute left-0 right-0 w-full h-full pointer-events-none hidden md:block"
            style={{ top: '0' }}
          >
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FA7B21" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#FCA929" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <path
              ref={pathRef}
              d="M 100 50 Q 200 100, 100 200 T 100 400 T 100 600 T 100 800 T 100 1000 T 100 1200 T 100 1400"
              stroke="url(#pathGradient)"
              strokeWidth="3"
              fill="none"
              strokeDasharray={pathLength}
              strokeDashoffset={pathLength}
              style={{
                strokeDashoffset: useTransform(pathProgress, (v) => pathLength - v).get()
              }}
            />
          </svg>

          {/* Bolita animada que sigue el scroll */}
          <motion.div
            className="absolute w-8 h-8 bg-[#FA7B21] rounded-full border-4 border-white shadow-lg hidden md:block z-20"
            style={{
              left: '84px',
              top: useTransform(scrollYProgress, [0, 1], ['0px', `${stages.length * 220}px`]),
              boxShadow: '0 0 20px rgba(250, 123, 33, 0.6)'
            }}
          >
            <div className="absolute inset-0 bg-[#FA7B21] rounded-full animate-ping opacity-75" />
          </motion.div>

          {/* Etapas */}
          <div className="space-y-12 relative z-10">
            {stages.map((stage, index) => (
              <motion.div
                key={stage.number}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className={`flex items-center gap-8 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
              >
                {/* Marcador numérico */}
                <div className="hidden md:flex w-24 h-24 rounded-full bg-gradient-to-br from-[#FA7B21] to-[#E65C0F] items-center justify-center flex-shrink-0 border-4 border-white shadow-xl relative">
                  <span className="text-white text-2xl">{stage.number}</span>
                  <div className="absolute -bottom-2 -right-2 text-4xl">{stage.emoji}</div>
                </div>

                {/* Contenido de la etapa */}
                <Card className="flex-1 bg-zinc-800/50 border-white/10 hover:border-[#FA7B21]/50 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4 md:hidden">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FA7B21] to-[#E65C0F] flex items-center justify-center flex-shrink-0 border-2 border-white">
                        <span className="text-white">{stage.number}</span>
                      </div>
                      <span className="text-4xl">{stage.emoji}</span>
                    </div>

                    <h3 className="text-white mb-2">{stage.title}</h3>
                    <p className="text-[#FCA929] italic mb-4">"{stage.subtitle}"</p>
                    <p className="text-white/80 mb-6">{stage.description}</p>

                    <div className="grid gap-2">
                      {stage.achievements.map((achievement, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4 text-[#FCA929] flex-shrink-0" />
                          <span className="text-white/70 text-sm">{achievement}</span>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Información final */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 bg-gradient-to-r from-[#431C28]/50 to-zinc-900/50 border border-[#FA7B21]/30 rounded-lg p-8 text-center"
          >
            <div className="grid md:grid-cols-2 gap-8 mb-6">
              <div>
                <p className="text-white/70 mb-2">⏱️ DURACIÓN TOTAL</p>
                <p className="text-white text-xl">18-24 MESES</p>
              </div>
              <div>
                <p className="text-white/70 mb-2">🎯 RESULTADO FINAL</p>
                <p className="text-white text-xl">Liderazgo y Maestría</p>
              </div>
            </div>
            <p className="text-white/80 max-w-2xl mx-auto">
              No solo técnica marcial, sino liderazgo, disciplina, 
              creatividad y la confianza para destacar en cualquier área.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
