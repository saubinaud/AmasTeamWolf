import { useEffect, useState } from 'react';

/**
 * OmYoga: una sola fuente para la landing (/om-yoga), el banner de la portada y el menú.
 * Los precios NO van aquí: salen del catálogo (Space ▸ Catálogo, códigos de PLANES).
 */
export const OM_YOGA = {
  ruta: '/om-yoga',
  slugFormulario: 'om-yoga',
  /** Cierre de inscripciones: martes 17-nov-2026, 23:59:59 hora de Lima */
  cierre: new Date('2026-11-17T23:59:59-05:00'),
  /** Fin de la clase de prueba (8:00 a 9:00 p. m.): desde aquí la landing muestra los planes */
  finClase: new Date('2026-11-18T21:00:00-05:00'),
  fechaClase: 'Miércoles 18 de noviembre',
  HORA_CLASE: '8:00 p. m.' as string | null,
  horario: 'Lunes y miércoles, 8:00 p. m.',
  /** Planes en el catálogo (precio, beneficios y cinta se editan en Space ▸ Catálogo) */
  PLANES: ['omyoga-mensual', 'omyoga-trimestral'],
  video: '/media/om-yoga-v2.mp4',
  poster: '/media/om-yoga-v2-poster.jpg',
  fotoInstructora: '/media/om-yoga-celeste.jpg',
};

/**
 * Etiquetas de los campos del formulario en Space ▸ Formularios (slug om-yoga).
 * El API recibe las respuestas por id de bloque: la landing los busca por estas etiquetas.
 */
export const CAMPOS = {
  nombre: 'Nombre y apellido',
  whatsapp: 'WhatsApp',
  correo: 'Correo',
  experiencia: '¿Has practicado yoga antes?',
  condicion: '¿Alguna lesión o condición que debamos saber?',
} as const;

export const EXPERIENCIAS = ['Nunca', 'Alguna vez', 'Practico con frecuencia'];

export interface Restante {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
  terminado: boolean;
}

function calcular(hasta: Date): Restante {
  const ms = Math.max(0, hasta.getTime() - Date.now());
  const s = Math.floor(ms / 1000);
  return {
    dias: Math.floor(s / 86400),
    horas: Math.floor((s % 86400) / 3600),
    minutos: Math.floor((s % 3600) / 60),
    segundos: s % 60,
    terminado: ms === 0,
  };
}

/** Cuenta regresiva que se actualiza cada segundo y se detiene al llegar a cero. */
export function useCuentaRegresiva(hasta: Date): Restante {
  const [r, setR] = useState(() => calcular(hasta));
  useEffect(() => {
    if (r.terminado) return;
    const id = window.setInterval(() => {
      const n = calcular(hasta);
      setR(n);
      if (n.terminado) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, [hasta, r.terminado]);
  return r;
}

export const dos = (n: number) => String(n).padStart(2, '0');

export type Fase = 'inscripcion' | 'cerrado' | 'programa';

/** En qué momento está OmYoga: inscribiendo a la clase de prueba, cerrado, o ya con planes. */
export function useFase(): Fase {
  const cierre = useCuentaRegresiva(OM_YOGA.cierre);
  const clase = useCuentaRegresiva(OM_YOGA.finClase);
  if (clase.terminado) return 'programa';
  return cierre.terminado ? 'cerrado' : 'inscripcion';
}
