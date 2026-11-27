import { Facebook, Instagram, Mail, MapPin, Phone, Clock, CalendarCheck, BookOpen } from 'lucide-react';
import { TELEFONO, TELEFONO_VISIBLE, CORREO, DIRECCION, DISTRITO } from '../config/contacto';
import { EnlaceInterno } from './EnlaceInterno';
import { HORARIO } from '../config/horario';
import { ui } from '../styles/marca';

interface FooterMainProps {
  onNavigate: (page: string, sectionId?: string) => void;
  onOpenMatricula: () => void;
  /** Acción principal del pie: la clase de prueba de taekwondo, o ninguna (p. ej. en OmYoga, que es para adultos) */
  accion?: 'clase-prueba' | 'ninguna';
}

const ENLACES: { page: string; section?: string; texto: string }[] = [
  { page: 'home', texto: 'Inicio' },
  { page: 'home', section: 'programas', texto: 'Programas' },
  { page: 'clase-prueba', texto: 'Clase de prueba' },
  { page: 'leadership', texto: 'Leadership' },
  { page: 'graduacion', texto: 'Graduaciones' },
  { page: 'tienda', texto: 'Tienda' },
  { page: 'renovacion', texto: 'Renovar membresía' },
];

const redes = 'flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-white/60 transition-colors duration-150 hover:border-white/25 hover:text-[#FCA929]';
const tituloColumna = 'mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-white/45';
const enlaceLista = `inline-flex min-h-[40px] items-center text-sm ${ui.enlace}`;

export function FooterMain({ onNavigate, onOpenMatricula, accion = 'clase-prueba' }: FooterMainProps) {
  return (
    <footer id="contacto" className="border-t border-white/10 bg-black">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="mb-12 grid gap-10 sm:gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <img
              src="/marca/logo-completo-oscuro-800.png"
              alt="Team Wolf, centro de entrenamiento × JMA"
              width={800}
              height={258}
              loading="lazy"
              className="mb-4 h-14 w-auto"
            />
            <p className="mb-5 text-sm text-white/60">
              Taekwondo y formación para niños en {DISTRITO}. Disciplina, respeto y confianza en cada clase.
            </p>
            <div className="flex gap-2">
              <a href="https://www.facebook.com/profile.php?id=100077646492633" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={redes}>
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/amas_teamwolf/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={redes}>
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          <nav aria-label="Enlaces del pie">
            <h3 className={tituloColumna}>Enlaces</h3>
            <ul>
              {ENLACES.map((e) => (
                <li key={e.texto}>
                  <EnlaceInterno page={e.page} section={e.section} onNavigate={onNavigate} className={enlaceLista}>
                    {e.texto}
                  </EnlaceInterno>
                </li>
              ))}
              <li>
                <button type="button" onClick={() => onOpenMatricula()} className={enlaceLista}>
                  Matrícula
                </button>
              </li>
            </ul>
          </nav>

          <div>
            <h3 className={tituloColumna}>Contacto</h3>
            <ul className="space-y-3 text-sm text-white/60">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#FCA929]" />
                <span>{DIRECCION}, {DISTRITO}, Lima, Perú</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#FCA929]" />
                <a href={`tel:${TELEFONO}`} className={ui.enlace} data-umami-event="Click Telefono" data-umami-event-ubicacion="footer">
                  {TELEFONO_VISIBLE}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#FCA929]" />
                <a href={`mailto:${CORREO}`} className={`${ui.enlace} break-all`} data-umami-event="Click Email" data-umami-event-ubicacion="footer">
                  {CORREO}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={tituloColumna}>Horarios</h3>
            <ul className="space-y-3 text-sm text-white/60">
              {HORARIO.map((h) => (
                <li key={h.dias} className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#FCA929]" />
                  <div>
                    <p>{h.dias}</p>
                    <p className="text-white">{h.horas}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {accion === 'clase-prueba' && (
          <div className="mb-10 flex justify-center">
            <EnlaceInterno
              page="clase-prueba"
              onNavigate={onNavigate}
              className={`${ui.btnPrimary} w-full sm:w-auto`}
              data-umami-event="Click Clase de prueba"
              data-umami-event-ubicacion="footer"
            >
              <CalendarCheck className="h-5 w-5" />
              Agendar clase de prueba
            </EnlaceInterno>
          </div>
        )}

        <div className="flex flex-col items-center justify-center gap-2 border-t border-white/10 pt-8 text-center sm:flex-row sm:gap-4">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} Team Wolf × JMA. Todos los derechos reservados.
          </p>
          <EnlaceInterno page="terminos" onNavigate={onNavigate} className={`py-2 text-sm underline underline-offset-4 ${ui.enlace}`}>
            Términos y condiciones
          </EnlaceInterno>
          {/* Aviso del Libro de Reclamaciones: visible en la web (DS 011-2011-PCM) */}
          <EnlaceInterno page="reclamaciones" onNavigate={onNavigate} className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-white/20 px-3 text-sm font-bold text-white hover:border-white/40`}>
            <BookOpen className="h-4 w-4 text-[#FA7B21]" />
            Libro de Reclamaciones
          </EnlaceInterno>
        </div>
      </div>
    </footer>
  );
}
