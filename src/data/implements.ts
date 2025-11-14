export interface Implement {
  id: string;
  name: string;
  price: number;
  icon: string;
  image: string;
  description?: string;
  longDescription?: string;
  colors?: string[];
  images?: string[]; // Array de imágenes para el carrusel
}

export const programImplements: Implement[] = [
  {
    id: 'gloves',
    name: 'Guantes',
    price: 250,
    icon: '🥊',
    image: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761562478/8_scx75o.png',
    images: [
      'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761562478/8_scx75o.png',
      'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761562478/9_lpgapy.png',
      'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761562478/10_tykvme.png'
    ],
    longDescription: 'Ligeros, cómodos y resistentes. Diseñados para ofrecer máxima protección sin limitar la movilidad. Color negro, con ajuste firme y ventilación óptima. Cumplen con las medidas y peso oficiales por edad y categoría. Ideales para entrenamientos, torneos y exhibiciones.',
    colors: ['#000000']
  },
  {
    id: 'shoes',
    name: 'Zapatos',
    price: 250,
    icon: '👟',
    image: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761562479/11_r5q6bm.png',
    images: [
      'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761562479/11_r5q6bm.png',
      'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761562478/12_rzkpic.png',
      'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761562480/13_gbyyyc.png'
    ],
    longDescription: 'Diseño ergonómico y suela especiales para un movimiento fluido y seguro. Fabricados en materiales duraderos y ligeros. Color negro, con ajuste cómodo y firme. Cumplen con las características reglamentarias según la edad y categoría del alumno. Perfectos para entrenamientos intensivos o exhibiciones.',
    colors: ['#000000']
  },
  {
    id: 'bostaff',
    name: 'Bo Staff',
    price: 180,
    icon: '⚔️',
    image: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761500577/5_daew00.png',
    images: [
      'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761500577/5_daew00.png',
      'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761500577/6_kokp8n.png',
      'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761563677/15_n17lxd.png',
      'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761563686/WhatsApp_Image_2025-10-25_at_18.31.36_yc0q8s.jpg'
    ],
    longDescription: 'Implemento tradicional de entrenamiento y exhibición. Disponible en diversos colores (consultar stock). Fabricado en materiales resistentes y equilibrados. Cumple con las medidas y peso reglamentarios según la edad y categoría del alumno. Perfecto para mejorar la técnica, el control y la precisión.',
    colors: ['#DDC40B', '#ABC3A9', '#660F56', '#97140A', '#B2DEC5']
  },
  {
    id: 'combat-weapon',
    name: 'Combat Weapon',
    price: 220,
    icon: '⚔️',
    image: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761500576/1_jnbq0i.png',
    images: [
      'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761500576/1_jnbq0i.png',
      'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761500576/2_q2khk6.png',
      'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761563676/14_hdckge.png',
      'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761563686/WhatsApp_Image_2025-10-25_at_18.31.36_yc0q8s.jpg'
    ],
    longDescription: 'Ligero, resistente y diseñado para un entrenamiento seguro y profesional. Implemento reglamentario para prácticas, torneos y exhibiciones. Disponible en azul o negro. Cumple con las medidas y peso oficiales por edad, garantizando precisión y durabilidad en cada movimiento.',
    colors: ['#080808', '#25009D']
  },
  {
    id: 'nunchaku',
    name: 'Nunchaku',
    price: 350,
    icon: '⚔️',
    image: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761500576/3_cwhjnd.png',
    images: [
      'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761500576/3_cwhjnd.png',
      'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761500576/4_stz65u.png',
      'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761563677/15_n17lxd.png'
    ],
    longDescription: 'Equilibrio perfecto entre control y velocidad. Color negro de materiales resistentes para uso constante. Cumple con las normas reglamentarias de peso y tamaño según edad y categoría. Ideal para entrenamientos técnicos, demostraciones y exhibiciones oficiales.',
    colors: ['#000000']
  },
  {
    id: 'patch',
    name: 'Parche',
    price: 15,
    icon: '🏅',
    image: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761500577/7_r4zzrq.png',
    images: [
      'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761500577/7_r4zzrq.png',
      'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761500577/7_r4zzrq.png'
    ],
    longDescription: 'Distintivo oficial del programa Leadership AMAS Team Wolf. Representa disciplina, compromiso y orgullo de pertenecer al equipo. Diseño bordado de alta calidad, resistente al uso y al lavado. Obligatorio para uniformes de entrenamiento y presentaciones oficiales.'
  },
  {
    id: 'membership',
    name: 'Membresía',
    price: 699,
    icon: '🌟',
    image: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761500578/AMAS_WOLF_LEADERSHIP_Mesa_de_trabajo_1_pdwtiu.png',
    images: [
      'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761500578/AMAS_WOLF_LEADERSHIP_Mesa_de_trabajo_1_pdwtiu.png',
      'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761500578/AMAS_WOLF_LEADERSHIP_Mesa_de_trabajo_1_pdwtiu.png'
    ],
    longDescription: 'Acceso completo al programa Leadership AMAS Team Wolf. Incluye formación continua, certificaciones y beneficios exclusivos. Exclusivo para quienes ya cuentan con todos los implementos físicos. (guantes, bo-staf, combat wepon, zapatos, nunchakus y parche) Permite avanzar en el plan de desarrollo (exclusivo del programa leadership) y acceder a actividades oficiales del programa.'
  }
];

// Productos adicionales de la tienda (no son del programa Leadership)
export const storeOnlyProducts: Implement[] = [
  {
    id: 'uniform',
    name: 'Uniforme Completo',
    price: 220,
    icon: '🥋',
    image: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761933232/16_nmah4x.png',
    images: [
      'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761933232/16_nmah4x.png',
      'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761933232/18_c7gkrj.png',
      'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761933232/19_xu7nmi.png',
      'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761933232/20_kpcsdy.png',
      'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761933232/21_l8mw1d.png'
      
    ],
    longDescription: 'El uniforme oficial de AMAS Team Wolf representa disciplina, respeto y orgullo por el camino marcial. Diseñado para acompañar cada etapa del aprendizaje, combina comodidad, durabilidad y elegancia. Su confección en tela ligera y resistente permite libertad de movimiento en cada técnica, manteniendo la presencia y el estándar profesional que distingue a nuestros alumnos. Disponible en tallas 2, 4, 6, 8, 10, 12, 14, S, M, L, XL.',
    colors: ['#FFFFFF']
  },
  {
    id: 'polo',
    name: 'Polo AMAS Team Wolf',
    price: 60,
    icon: '👕',
    image: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761934028/23_eimzcf.png',
    images: [
      'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761934028/23_eimzcf.png',
      'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1080/v1761934028/22_qihajf.png'
    ],
    longDescription: 'El polo oficial de AMAS Team Wolf simboliza pertenencia y compromiso. Fabricado en materiales frescos y resistentes, es ideal para uso diario o entrenamientos ligeros. Su diseño combina sobriedad y estilo, reflejando los valores del equipo dentro y fuera del tatami. Perfecto para representar con orgullo la identidad Team Wolf en todo momento. Disponible en tallas 2, 4, 6, 8, 10, 12, 14, S, M, L, XL.',
    colors: ['#FFFFFF', '#222222']
  },
];

// Todos los productos de la tienda
export const allStoreProducts: Implement[] = [
  ...programImplements,
  ...storeOnlyProducts
];

// Productos destacados para el home
export const featuredStoreProducts: Implement[] = [
  programImplements.find(p => p.id === 'combat-weapon')!,
  storeOnlyProducts.find(p => p.id === 'uniform')!,
  storeOnlyProducts.find(p => p.id === 'polo')!
];

export const TOTAL_PROGRAM_PRICE = programImplements.reduce((sum, impl) => sum + impl.price, 0);
