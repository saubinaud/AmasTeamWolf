import { useEffect, useState } from 'react';

/**
 * OmYoga: una sola fuente para la landing (/om-yoga), el banner de la portada y el menú.
 * La hora de la clase va en HORA_CLASE; mientras sea null la web dice que se confirma por WhatsApp.
 */
export const OM_YOGA = {
  ruta: '/om-yoga',
  slugFormulario: 'om-yoga',
  /** Cierre de inscripciones: martes 17-nov-2026, 23:59:59 hora de Lima */
  cierre: new Date('2026-11-17T23:59:59-05:00'),
  /** Fin del día de la clase: después de esto el banner deja de hablar de la clase de prueba */
  finClase: new Date('2026-11-18T23:59:59-05:00'),
  fechaClase: 'Miércoles 18 de noviembre',
  HORA_CLASE: null as string | null,
  video: '/media/om-yoga.mp4',
  poster: '/media/om-yoga-poster.jpg',
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
