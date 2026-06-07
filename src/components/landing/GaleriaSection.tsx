import { ScrollReveal } from './ScrollReveal';
import { ImageLightbox } from '../ImageLightbox';
import { useState } from 'react';

const galleryImages = [
  { src: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_800/v1763125421/Publicidad_Image_6998_1_pjw0qi.jpg', alt: 'Entrenamiento niños' },
  { src: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_800/v1763124726/Academia_Medalla_Photo_copy_desesj.jpg', alt: 'Medallas academia' },
  { src: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_800/v1763847478/Valencia_2_t8q3hl.jpg', alt: 'Clase grupo' },
  { src: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_800/v1763124491/AMAS_-_graduacio%CC%81n_profesores_pr3xtc.jpg', alt: 'Graduación' },
  { src: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_800/v1763847692/WhatsApp_Image_2025-10-25_at_18.31.36_nfl4y6.jpg', alt: 'Entrenamiento' },
  { src: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_800/v1763125422/Requested_Photos_and_Videos_8549_zpzgdf.jpg', alt: 'Clase niños' },
  { src: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_800/v1763124686/AMAS_-_graduacio%CC%81n_profesores_6_c3qvlk.jpg', alt: 'Profesores' },
  { src: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_800/v1763847922/AMAS_-_graduacio%CC%81n_profesores_3_au3zh0.jpg', alt: 'Evento' }
];

export function GaleriaSection() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  return (
    <>
      <section className="relative py-16 md:py-32 px-4 bg-gradient-to-b from-black via-[#0D0D0D] to-black">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12 md:mb-20">
              <span className="inline-block bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white px-4 py-2 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-bold mb-4 md:mb-6">
                Instalaciones y clases
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-6xl text-white mb-4 md:mb-6 font-bold px-2">
                Así son nuestras <span className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] bg-clip-text text-transparent">clases</span>
              </h2>
              <p className="text-base md:text-xl text-white/60 px-2">
                Haz clic en cualquier imagen para ampliar
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {galleryImages.map((img, i) => (
              <ScrollReveal key={i} delay={i * 50}>
                <button
                  onClick={() => {
                    setLightboxIndex(i);
                    setLightboxOpen(true);
                  }}
                  className="relative group overflow-hidden rounded-2xl aspect-square cursor-pointer"
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                  <div className="absolute inset-0 flex items-end p-4">
                    <p className="text-white text-sm font-semibold transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      {img.alt}
                    </p>
                  </div>
                  {/* Overlay hover */}
                  <div className="absolute inset-0 border-2 border-[#FA7B21] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                </button>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <ImageLightbox
        images={galleryImages}
        isOpen={lightboxOpen}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
