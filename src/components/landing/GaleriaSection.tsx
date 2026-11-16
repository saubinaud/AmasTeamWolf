import { useState } from 'react';
import { ScrollReveal } from './ScrollReveal';
import { ImageLightbox } from '../ImageLightbox';
import { ui } from '../../styles/marca';

const foto = (v: string, ancho: number) => `https://res.cloudinary.com/dkoocok3j/image/upload/q_auto,f_auto,w_${ancho}/${v}`;

const FOTOS = [
  { v: 'v1763125421/Publicidad_Image_6998_1_pjw0qi.jpg', alt: 'Alumno pequeño en clase con su profesora' },
  { v: 'v1763124726/Academia_Medalla_Photo_copy_desesj.jpg', alt: 'Alumnos con sus medallas' },
  { v: 'v1763847478/Valencia_2_t8q3hl.jpg', alt: 'Clase temática con disfraces' },
  { v: 'v1763124491/AMAS_-_graduacio%CC%81n_profesores_pr3xtc.jpg', alt: 'Ceremonia de graduación' },
  { v: 'v1763847692/WhatsApp_Image_2025-10-25_at_18.31.36_nfl4y6.jpg', alt: 'Alumno con sus implementos' },
  { v: 'v1763125422/Requested_Photos_and_Videos_8549_zpzgdf.jpg', alt: 'Alumnos saludando al inicio de la clase' },
  { v: 'v1763124686/AMAS_-_graduacio%CC%81n_profesores_6_c3qvlk.jpg', alt: 'Alumna con su certificado y su familia' },
  { v: 'v1763847922/AMAS_-_graduacio%CC%81n_profesores_3_au3zh0.jpg', alt: 'Evento de la academia' },
];

const grandes = FOTOS.map((f) => ({ src: foto(f.v, 1400), alt: f.alt }));

export function GaleriaSection() {
  const [abierta, setAbierta] = useState(false);
  const [indice, setIndice] = useState(0);

  return (
    <section className={ui.seccion}>
      <ScrollReveal>
        <div className={ui.cabeceraSeccion}>
          <p className={ui.antetitulo}>La academia</p>
          <h2 className={`mt-4 ${ui.h2}`}>Así son nuestras clases</h2>
        </div>
      </ScrollReveal>

      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {FOTOS.map((f, i) => (
          <button
            key={f.v}
            type="button"
            onClick={() => { setIndice(i); setAbierta(true); }}
            aria-label={`Ampliar: ${f.alt}`}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FCA929]"
          >
            <img
              src={foto(f.v, 600)}
              alt={f.alt}
              width={600}
              height={600}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          </button>
        ))}
      </div>

      <ImageLightbox images={grandes} isOpen={abierta} currentIndex={indice} onClose={() => setAbierta(false)} />
    </section>
  );
}
