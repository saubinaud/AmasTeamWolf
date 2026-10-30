import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { ScrollReveal } from './ScrollReveal';
import { DIRECCION, DISTRITO } from '../../config/contacto';

const faqs = [
  {
    q: '¿Desde qué edad pueden empezar?',
    a: 'Desde 1 año de edad. Tenemos programa Baby Wolf especialmente diseñado para los más pequeños, adaptado a su desarrollo motor y cognitivo.'
  },
  {
    q: '¿Cuánto dura cada clase?',
    a: '30 minutos para niños de 1-6 años. 50 minutos para niños de 7+ años. La duración está optimizada para mantener su atención y energía.'
  },
  {
    q: '¿Es seguro para niños pequeños?',
    a: 'Totalmente seguro. Grupos reducidos (máx 12), tatami acolchado profesional, instructoras certificadas con especialización en pedagogía infantil y primeros auxilios.'
  },
  {
    q: '¿Qué pasa si mi hijo es muy tímido?',
    a: 'Es completamente normal. El 60% de nuestros alumnos empezaron siendo muy tímidos. Nuestra metodología está diseñada para respetar su proceso individual y avanzar a su ritmo, sin presión.'
  },
  {
    q: '¿Dónde están ubicados?',
    a: `${DIRECCION}, ${DISTRITO}, Lima.`
  },
  {
    q: '¿La clase de prueba tiene costo?',
    a: 'S/40, que se descuentan al 100% si decides inscribir a tu hijo. Es decir, si te matriculas la clase de prueba fue completamente GRATIS.'
  }
];

export function FAQSection() {
  return (
    <section className="relative py-16 md:py-32 px-4 bg-gradient-to-b from-black via-[#0A0A0A] to-black">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12 md:mb-16">
            <span className="inline-block bg-white/5 border border-white/10 text-white/70 px-4 py-2 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-semibold mb-4 md:mb-6">
              Todo lo que necesitas saber
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-6xl text-white mb-4 md:mb-6 font-bold px-2">
              Preguntas <span className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] bg-clip-text text-transparent">frecuentes</span>
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-8 overflow-hidden hover:border-[#FA7B21]/50 transition-all duration-300">
                <AccordionTrigger className="text-white hover:text-[#FA7B21] text-left text-base md:text-lg py-4 md:py-6 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-white/70 leading-relaxed text-sm md:text-lg pb-4 md:pb-6">
                  {faq.a}
                  {i === 4 && (
                    <div className="mt-6 w-full h-80 bg-black/20 rounded-xl overflow-hidden">
                      <iframe
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(`${DIRECCION}, ${DISTRITO}, Lima, Perú`)}&output=embed`}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        className="rounded-xl"
                      />
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollReveal>
      </div>
    </section>
  );
}
