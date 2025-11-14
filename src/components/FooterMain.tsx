import { Facebook, Instagram, Mail, MapPin, Phone, Clock, Award } from 'lucide-react';
import { Button } from './ui/button';

interface FooterMainProps {
  onNavigate: (page: string) => void;
  onOpenMatricula: () => void;
}

export function FooterMain({ onNavigate, onOpenMatricula }: FooterMainProps) {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer id="contacto" className="bg-black border-t border-white/10">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-12">
          {/* Logo and Description */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex flex-col">
                <span 
                  className="text-xl tracking-wider"
                  style={{
                    background: 'linear-gradient(135deg, #FA7B21 0%, #FCA929 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  AMAS
                </span>
                <span className="text-white text-sm -mt-1 tracking-wide">Team Wolf</span>
              </div>
            </div>
            <p className="text-white/60 text-sm mb-4">
              Formando líderes a través de las artes marciales. Disciplina, respeto y crecimiento personal.
            </p>
            {/* Social Media */}
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/profile.php?id=100077646492633"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center text-white/60 hover:text-[#FCA929] hover:bg-[#FA7B21]/10 transition-all"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/amas_teamwolf/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center text-white/60 hover:text-[#FCA929] hover:bg-[#FA7B21]/10 transition-all"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white mb-4 text-lg">Enlaces rápidos</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => scrollToSection('hero')}
                  className="text-white/60 hover:text-[#FCA929] transition-colors text-sm"
                >
                  Inicio
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('programas')}
                  className="text-white/60 hover:text-[#FCA929] transition-colors text-sm"
                >
                  Programas
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('leadership')}
                  className="text-white/60 hover:text-[#FCA929] transition-colors text-sm"
                >
                  Leadership
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('graduacion')}
                  className="text-white/60 hover:text-[#FCA929] transition-colors text-sm"
                >
                  Graduaciones
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('tienda')}
                  className="text-white/60 hover:text-[#FCA929] transition-colors text-sm"
                >
                  Tienda
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenMatricula();
                  }}
                  className="text-white/60 hover:text-[#FCA929] transition-colors text-sm"
                  style={{
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  Matrícula
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white mb-4 text-lg">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-white/60 text-sm">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#FCA929]" />
                <span>Av. Angamos Este 2741, San Borja, Lima, Perú</span>
              </li>
              <li className="flex items-start gap-2 text-white/60 text-sm">
                <Phone className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#FCA929]" />
                <a href="tel:+51987654321" className="hover:text-[#FCA929] transition-colors">
                  ‪+51 989 717 412‬
                </a>
              </li>
              <li className="flex items-start gap-2 text-white/60 text-sm">
                <Mail className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#FCA929]" />
                <a href="mailto:info@amasteamwolf.com" className="hover:text-[#FCA929] transition-colors">
                  amasteamwolf@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Schedule */}
          <div>
            <h3 className="text-white mb-4 text-lg">Horarios</h3>
            <ul className="space-y-2 text-white/60 text-sm">
              <li className="flex items-start gap-2">
                <Clock className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#FCA929]" />
                <div>
                  <p>Lunes a Viernes:</p>
                  <p className="text-white">3:00 PM - 8:30 PM</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#FCA929]" />
                <div>
                  <p>Sábados:</p>
                  <p className="text-white">9:00 AM - 1:00 PM</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Botón destacado de Graduaciones */}
        <div className="mb-8">
          <Button
            onClick={() => onNavigate('graduacion')}
            className="w-full sm:w-auto mx-auto flex items-center justify-center gap-2 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white shadow-lg shadow-[#FA7B21]/30 hover:shadow-[#FA7B21]/50 transition-all duration-300 px-8 py-6 text-base sm:text-lg"
            style={{
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <Award className="w-5 h-5" />
            Ver Graduaciones Recientes
          </Button>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-white/40 text-sm">
            © 2025 AMAS Team Wolf. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}