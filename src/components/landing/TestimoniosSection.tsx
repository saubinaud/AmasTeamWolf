import { Star } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

const testimonials = [
  {
    img: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_400/v1763125421/Publicidad_Image_6998_1_pjw0qi.jpg',
    quote: "Mi hijo está más disciplinado en casa. Ya no tengo que repetirle las cosas 5 veces. Ahora se baña solo, hace su tarea sin pelear. El cambio fue en 2 meses.",
    author: 'María G.',
    role: 'mamá de Mateo (3 años)'
  },
  {
    img: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_400/v1763125698/Requested_Photos_and_Videos_8660_vy633p.jpg',
    quote: "En el cole su profesora notó el cambio. Más seguro, participativo y concentrado. Sus notas subieron sin que yo se lo pidiera.",
    author: 'Carlos P.',
    role: 'papá de Santiago (8 años)'
  },
  {
    img: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_400/v1763124491/AMAS_-_graduacio%CC%81n_profesores_pr3xtc.jpg',
    quote: "Pensé que era solo deporte, pero mi hija ganó confianza en todo. Hasta en matemáticas mejoró porque ya no tiene miedo a equivocarse.",
    author: 'Ana L.',
    role: 'mamá de Valentina (3 años)'
  }
];

export function TestimoniosSection() {
  return (
    <section className="relative py-16 md:py-32 px-4 bg-gradient-to-b from-black via-[#0A0A0A] to-black overflow-hidden">
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#FA7B21]/5 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-[#FCA929]/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto relative z-10">
        <ScrollReveal>
          <div className="text-center mb-12 md:mb-20">
            <span className="inline-block bg-white/5 border border-white/10 text-white/70 px-4 py-2 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-semibold mb-4 md:mb-6">
              Historias reales
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-6xl text-white mb-4 md:mb-6 font-bold px-2">
              Lo que dicen los <span className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] bg-clip-text text-transparent">papás</span>
            </h2>
            <p className="text-base md:text-xl text-white/60 px-2">
              Resultados visibles después de 3 meses
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial, i) => (
            <ScrollReveal key={i} delay={i * 100}>
              <div className="group relative h-full">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
                <div className="relative h-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8 hover:border-[#FA7B21]/50 transition-all duration-500">
                  <img
                    src={testimonial.img}
                    alt={testimonial.author}
                    className="w-full h-48 sm:h-56 md:h-64 object-cover rounded-xl md:rounded-2xl mb-4 md:mb-6 ring-4 ring-white/10"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="flex gap-1 mb-4 md:mb-6">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 md:w-5 md:h-5 fill-[#FCA929] text-[#FCA929]" />
                    ))}
                  </div>
                  <blockquote className="text-white/90 mb-4 md:mb-6 leading-relaxed text-base md:text-lg italic">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-white font-bold text-sm md:text-base">{testimonial.author}</p>
                    <p className="text-white/50 text-xs md:text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
