import { MessageCircle } from 'lucide-react';
import { enlaceWhatsApp } from '../../config/contacto';

/** Botón flotante de WhatsApp: abre el chat de la academia (antes abría el formulario). */
export function WhatsAppButton() {
  return (
    <a
      href={enlaceWhatsApp('Hola, quiero información de la clase de prueba')}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 group"
      aria-label="Escribir por WhatsApp"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-[#25D366] rounded-full blur-xl opacity-70 animate-pulse" />
        <div className="relative w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-full flex items-center justify-center shadow-2xl transition-transform duration-150 hover:scale-110 ring-2 md:ring-4 ring-white/20">
          <MessageCircle className="w-7 h-7 md:w-8 md:h-8 text-white" />
        </div>
      </div>
      <div className="hidden md:block absolute bottom-full right-0 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
        <div className="bg-black/90 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap">Escríbenos por WhatsApp</div>
      </div>
    </a>
  );
}
