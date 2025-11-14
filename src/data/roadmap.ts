export interface RoadmapStage {
  number: number;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  achievements: string[];
}

export const roadmapStages: RoadmapStage[] = [
  {
    number: 1,
    icon: '🥋',
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
    icon: '🎯',
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
    icon: '👥',
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
    icon: '⭐',
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
    icon: '✨',
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
    icon: '💼',
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
    icon: '🏅',
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
