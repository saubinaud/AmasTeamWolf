import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  onClick: () => void;
}

export function WhatsAppButton({ onClick }: WhatsAppButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 group"
      aria-label="Contactar por WhatsApp"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-[#25D366] rounded-full blur-xl opacity-70 animate-pulse" />
        <div className="relative w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 ring-2 md:ring-4 ring-white/20">
          <MessageCircle className="w-7 h-7 md:w-10 md:h-10 text-white" />
        </div>
      </div>
      {/* Tooltip - solo desktop */}
      <div className="hidden md:block absolute bottom-full right-0 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="bg-black/90 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap">
          ¡Contáctanos ahora!
        </div>
      </div>
    </button>
  );
}
