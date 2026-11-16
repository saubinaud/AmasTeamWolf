import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { ScrollReveal } from './ScrollReveal';
import { DIRECCION, DISTRITO } from '../../config/contacto';
import { HORARIO } from '../../config/horario';
import { ui } from '../../styles/marca';
import { useCostoClasePrueba } from './clasePrueba';

export function FAQSection() {
  const costo = useCostoClasePrueba();

  const faqs = [
    {
      q: '¿Desde qué edad pueden empezar?',
      a: 'Desde 1 año de edad. El programa Baby Wolf está pensado para los más pequeños, adaptado a su desarrollo motor.',
    },
    {
      q: '¿Cuánto dura cada clase?',
      a: '30 minutos para niños de 1 a 6 años y 50 minutos para niños de 7 años en adelante.',
    },
    {
      q: '¿Es seguro para niños pequeños?',
      a: 'Sí. Las clases son en tatami y cada ejercicio se adapta a la edad y al nivel de cada niño.',
    },
    {
      q: '¿Qué pasa si mi hijo es muy tímido?',
      a: 'Es muy común al empezar. Respetamos su proceso y lo acompañamos a su ritmo, sin presión.',
    },
    {
      q: '¿Dónde están y en qué horario?',
      a: `${DIRECCION}, ${DISTRITO}, Lima. ${HORARIO.map((h) => `${h.dias}: ${h.horas}`).join('. ')}.`,
      mapa: true,
    },
    {
      q: '¿La clase de prueba tiene costo?',
      a: costo.texto
        ? `${costo.texto}.${costo.nota ? ` ${costo.nota}.` : ''}`
        : 'Te contamos el costo y coordinamos el día por WhatsApp cuando agendas.',
    },
  ];

  return (
    <section className={ui.seccion}>
      <ScrollReveal>
        <div className={ui.cabeceraSeccion}>
          <p className={ui.antetitulo}>Dudas</p>
          <h2 className={`mt-4 ${ui.h2}`}>Preguntas frecuentes</h2>
        </div>
      </ScrollReveal>

      <Accordion type="single" collapsible className="mx-auto max-w-3xl space-y-3">
        {faqs.map((faq, i) => (
          <AccordionItem key={faq.q} value={`item-${i}`} className={`${ui.cardChica} px-5 md:px-6 last:border-b`}>
            <AccordionTrigger className="min-h-[56px] items-center py-4 text-base text-white hover:no-underline md:text-lg">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="pb-5 text-base leading-relaxed text-white/70">
              {faq.a}
              {faq.mapa && (
                <div className="mt-5 h-72 w-full overflow-hidden rounded-xl border border-white/10">
                  <iframe
                    title={`Mapa: ${DIRECCION}, ${DISTRITO}`}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(`${DIRECCION}, ${DISTRITO}, Lima, Perú`)}&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                  />
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
