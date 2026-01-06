import React, { useState, useEffect, memo } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Check,
  X,
  Star,
  Award,
  MessageCircle,
  ArrowRight,
  Target,
  Users,
  Heart,
  Zap,
  Shield,
  TrendingUp,
  Clock,
  CalendarCheck
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { HeaderMain } from './HeaderMain';
import { FooterMain } from './FooterMain';
import { ImageLightbox } from './ImageLightbox';
import { trackEvent } from '../utils/pixel';

interface LandingConversionProps {
  onNavigate: (page: string, sectionId?: string) => void;
  onOpenMatricula: () => void;
  onCartClick: () => void;
  cartItemsCount: number;
}

// Componente de animación al scroll mejorado
const ScrollReveal = memo(({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [elementRef, setElementRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!elementRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(elementRef);
    return () => observer.disconnect();
  }, [elementRef, delay]);

  return (
    <div
      ref={setElementRef}
      className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
    >
      {children}
    </div>
  );
});

ScrollReveal.displayName = 'ScrollReveal';

export function LandingConversion({ onNavigate, onOpenMatricula, onCartClick, cartItemsCount }: LandingConversionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombrePadre: '',
    nombreAlumno: '',
    telefono: '',
    email: '',
    fechaNacimiento: '',
    objetivo: ''
  });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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

  // Scroll suave a sección
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // WhatsApp handlers
  const openTrialModal = () => {
    setIsModalOpen(true);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.nombrePadre || !formData.nombreAlumno || !formData.telefono || !formData.email || !formData.fechaNacimiento) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Enviar a Webhook
      const response = await fetch('https://pallium-n8n.s6hx3x.easypanel.host/webhook/regsitro-showroom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_padre: formData.nombrePadre,
          nombre_alumno: formData.nombreAlumno,
          telefono: formData.telefono,
          email: formData.email,
          fecha_nacimiento: formData.fechaNacimiento,
          objetivo: formData.objetivo,
          source: 'landing_clase_prueba',
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        toast.success('¡Registro enviado con éxito! Redirigiendo a WhatsApp...');

        // 2. Abrir WhatsApp
        const message = encodeURIComponent(
          `Hola, soy ${formData.nombrePadre}. Acabo de registrarme para la clase de prueba de mi hijo/a ${formData.nombreAlumno}.`
        );

        // Track Lead Event
        trackEvent('Lead', {
          content_name: 'LandingForm',
          content_category: 'TrialClass',
          value: 0.00,
          currency: 'PEN'
        });

        window.open(`https://wa.me/51989717412?text=${message}`, '_blank');

        setIsModalOpen(false);
        setFormData({
          nombrePadre: '',
          nombreAlumno: '',
          telefono: '',
          email: '',
          fechaNacimiento: '',
          objetivo: ''
        });
      } else {
        throw new Error('Error en el servidor');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al enviar el registro. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    trackEvent('ViewContent', {
      content_name: 'LandingPage',
      content_category: 'Landing'
    });
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <HeaderMain
        onNavigate={onNavigate}
        onOpenMatricula={onOpenMatricula}
        onCartClick={onCartClick}
        cartItemsCount={cartItemsCount}
      />

      {/* 1. HERO SECTION - Optimizado para móvil */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 md:pt-0"
        style={{
          backgroundImage: `url('https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_1920/v1763124726/Academia_Medalla_Photo_copy_desesj.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'scroll'
        }}
      >
        {/* Overlay con degradado */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-black" />

        {/* Patrón de puntos */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle, #FA7B21 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />

        {/* Badge flotante mejorado - responsive */}
        <div className="absolute top-20 right-2 md:top-32 md:right-8 z-20 max-w-[45%] md:max-w-none">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] blur-xl opacity-70 animate-pulse" />
            <div className="relative bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white px-3 py-2 md:px-6 md:py-3 rounded-full text-xs md:text-sm font-bold shadow-2xl border-2 border-white/20 whitespace-nowrap">
              🔥 Últimos 15 cupos
            </div>
          </div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto py-12 md:py-0">
          <ScrollReveal>
            <div className="mb-4 md:mb-6">
              <span className="inline-block bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-semibold">
                20 años transformando vidas
              </span>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-white mb-4 md:mb-6 leading-tight font-bold px-2">
              ¿Tu hijo es <span className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] bg-clip-text text-transparent">tímido</span> o le cuesta{' '}
              <span className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] bg-clip-text text-transparent">seguir reglas</span>?
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <p className="text-lg sm:text-xl md:text-3xl text-white/90 mb-8 md:mb-12 max-w-4xl mx-auto leading-relaxed px-2">
              Transformamos niños <strong className="text-[#FA7B21]">inseguros</strong> en{' '}
              <strong className="text-[#FA7B21]">líderes seguros</strong>.
              <br className="hidden sm:block" />
              <span className="text-base sm:text-lg md:text-xl text-white/70 block mt-2">Sin gritos. Sin presión. Resultados visibles en 2 meses.</span>
            </p>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center mb-8 md:mb-12 px-2">
              <button
                onClick={openTrialModal}
                className="group relative px-8 py-4 md:px-12 md:py-6 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white text-base md:text-xl font-bold rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#FA7B21]/50 w-full sm:w-auto"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[#FCA929] to-[#FA7B21] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center justify-center gap-2 md:gap-3">
                  <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
                  <span className="whitespace-nowrap">Agendar clase de prueba</span>
                </span>
              </button>

              <button
                onClick={() => scrollToSection('problemas')}
                className="text-white/80 hover:text-white flex items-center gap-2 text-base md:text-lg transition-all duration-300 group"
              >
                <span>Ver cómo funciona</span>
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-2 transition-transform duration-300" />
              </button>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <div className="grid grid-cols-3 gap-3 sm:gap-6 md:gap-8 max-w-3xl mx-auto px-2">
              {[
                { num: '+300', label: 'Familias felices' },
                { num: '20', label: 'Años de experiencia' },
                { num: '12', label: 'Alumnos máx/grupo' }
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl sm:text-3xl md:text-5xl font-bold bg-gradient-to-r from-[#FA7B21] to-[#FCA929] bg-clip-text text-transparent mb-1 md:mb-2">
                    {stat.num}
                  </div>
                  <div className="text-white/70 text-xs sm:text-sm md:text-base leading-tight">{stat.label}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>

        {/* Indicador de scroll - solo desktop */}
        <div className="hidden md:block absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* 2. PROBLEMAS - Optimizado para móvil */}
      <section id="problemas" className="relative py-16 md:py-32 px-4 bg-gradient-to-b from-black via-[#0A0A0A] to-black overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FA7B21]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FCA929]/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal>
            <div className="text-center mb-12 md:mb-20">
              <span className="inline-block bg-white/5 backdrop-blur-sm border border-white/10 text-white/70 px-4 py-2 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-semibold mb-4 md:mb-6">
                Situaciones reales de padres
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-6xl text-white mb-4 md:mb-6 font-bold px-2">
                ¿Te suena <span className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] bg-clip-text text-transparent">familiar</span>?
              </h2>
              <p className="text-base md:text-xl text-white/60 max-w-2xl mx-auto px-2">
                Estos son los problemas que resolvemos todos los días
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                emoji: '😔',
                title: 'Niño tímido',
                desc: 'Se esconde detrás de ti, no habla en el cole, tiene miedo a todo',
                gradient: 'from-blue-500/20 to-purple-500/20'
              },
              {
                emoji: '😤',
                title: 'No obedece',
                desc: 'Tienes que repetirle las cosas 10 veces, hace berrinches, no sigue reglas',
                gradient: 'from-red-500/20 to-orange-500/20'
              },
              {
                emoji: '😰',
                title: 'Baja confianza',
                desc: 'No cree en sí mismo, dice "no puedo", se rinde fácil',
                gradient: 'from-yellow-500/20 to-red-500/20'
              }
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <div className="group relative h-full">
                  {/* Glow effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  <div className="relative h-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8 hover:border-[#FA7B21]/50 transition-all duration-500 hover:transform hover:scale-105">
                    <div className="text-5xl md:text-7xl mb-4 md:mb-6">{item.emoji}</div>
                    <h3 className="text-xl md:text-2xl text-white font-bold mb-3 md:mb-4">{item.title}</h3>
                    <p className="text-white/70 leading-relaxed text-base md:text-lg">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={300}>
            <div className="text-center mt-12 md:mt-16">
              <p className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed px-2">
                Si tu hijo tiene <strong className="text-[#FA7B21]">alguno</strong> de estos comportamientos,{' '}
                <strong className="text-[#FA7B21]">AMAS puede ayudarte</strong>.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 3. NUEVA SECCIÓN: METODOLOGÍA - Optimizado para móvil */}
      <section className="relative py-16 md:py-32 px-4 bg-gradient-to-b from-black via-[#0D0D0D] to-black overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(#FA7B21 1px, transparent 1px), linear-gradient(90deg, #FA7B21 1px, transparent 1px)',
          backgroundSize: '100px 100px'
        }} />

        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal>
            <div className="text-center mb-12 md:mb-20">
              <span className="inline-block bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white px-4 py-2 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-bold mb-4 md:mb-6">
                Nuestra metodología única
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-6xl text-white mb-4 md:mb-6 font-bold px-2">
                Así <span className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] bg-clip-text text-transparent">transformamos</span> a tu hijo
              </h2>
              <p className="text-base md:text-xl text-white/60 max-w-3xl mx-auto px-2">
                Un sistema probado durante 20 años que combina artes marciales con formación de carácter
              </p>
            </div>
          </ScrollReveal>

          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 mb-12 md:mb-20">
            {/* Paso 1 - DISCIPLINA */}
            <ScrollReveal delay={100}>
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#FA7B21]/30 to-[#FCA929]/30 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/20 rounded-2xl md:rounded-3xl p-6 md:p-10 hover:border-[#FA7B21]/50 transition-all duration-500">
                  <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#FA7B21] to-[#FCA929] flex items-center justify-center text-white text-2xl md:text-3xl font-bold shadow-2xl">
                        1
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl md:text-3xl text-white font-bold mb-3 md:mb-4 flex items-center gap-2 md:gap-3">
                        <Shield className="w-6 h-6 md:w-8 md:h-8 text-[#FA7B21]" />
                        DISCIPLINA
                      </h3>
                      <p className="text-white/80 text-base md:text-lg leading-relaxed mb-4">
                        Aprende a seguir instrucciones desde el primer día. Sin gritos, con respeto.
                      </p>
                      <ul className="space-y-2 md:space-y-3">
                        <li className="flex items-start gap-2 md:gap-3 text-white/70 text-sm md:text-base">
                          <Check className="w-4 h-4 md:w-5 md:h-5 text-[#FA7B21] flex-shrink-0 mt-1" />
                          <span>Rutinas estructuradas adaptadas a cada edad</span>
                        </li>
                        <li className="flex items-start gap-2 md:gap-3 text-white/70 text-sm md:text-base">
                          <Check className="w-4 h-4 md:w-5 md:h-5 text-[#FA7B21] flex-shrink-0 mt-1" />
                          <span>Refuerzo positivo constante</span>
                        </li>
                        <li className="flex items-start gap-2 md:gap-3 text-white/70 text-sm md:text-base">
                          <Check className="w-4 h-4 md:w-5 md:h-5 text-[#FA7B21] flex-shrink-0 mt-1" />
                          <span>Límites claros con amor y paciencia</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Paso 2 - CONFIANZA */}
            <ScrollReveal delay={200}>
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#FA7B21]/30 to-[#FCA929]/30 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/20 rounded-2xl md:rounded-3xl p-6 md:p-10 hover:border-[#FA7B21]/50 transition-all duration-500">
                  <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#FA7B21] to-[#FCA929] flex items-center justify-center text-white text-2xl md:text-3xl font-bold shadow-2xl">
                        2
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl md:text-3xl text-white font-bold mb-3 md:mb-4 flex items-center gap-2 md:gap-3">
                        <Zap className="w-6 h-6 md:w-8 md:h-8 text-[#FA7B21]" />
                        CONFIANZA
                      </h3>
                      <p className="text-white/80 text-base md:text-lg leading-relaxed mb-4">
                        Descubre que SÍ puede hacer cosas difíciles. Gana seguridad en sí mismo.
                      </p>
                      <ul className="space-y-2 md:space-y-3">
                        <li className="flex items-start gap-2 md:gap-3 text-white/70 text-sm md:text-base">
                          <Check className="w-4 h-4 md:w-5 md:h-5 text-[#FA7B21] flex-shrink-0 mt-1" />
                          <span>Retos progresivos según su nivel</span>
                        </li>
                        <li className="flex items-start gap-2 md:gap-3 text-white/70 text-sm md:text-base">
                          <Check className="w-4 h-4 md:w-5 md:h-5 text-[#FA7B21] flex-shrink-0 mt-1" />
                          <span>Celebración de cada logro</span>
                        </li>
                        <li className="flex items-start gap-2 md:gap-3 text-white/70 text-sm md:text-base">
                          <Check className="w-4 h-4 md:w-5 md:h-5 text-[#FA7B21] flex-shrink-0 mt-1" />
                          <span>Ambiente seguro para equivocarse y aprender</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Paso 3 - LIDERAZGO */}
            <ScrollReveal delay={300}>
              <div className="relative group lg:col-span-2">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#FA7B21]/30 to-[#FCA929]/30 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/20 rounded-2xl md:rounded-3xl p-6 md:p-10 hover:border-[#FA7B21]/50 transition-all duration-500">
                  <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#FA7B21] to-[#FCA929] flex items-center justify-center text-white text-2xl md:text-3xl font-bold shadow-2xl">
                        3
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl md:text-3xl text-white font-bold mb-3 md:mb-4 flex items-center gap-2 md:gap-3">
                        <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-[#FA7B21]" />
                        LIDERAZGO
                      </h3>
                      <p className="text-white/80 text-base md:text-lg leading-relaxed mb-4 md:mb-6">
                        Se convierte en ejemplo para otros. En casa, en el cole, en la vida.
                      </p>
                      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                        <div className="flex items-start gap-2 md:gap-3">
                          <Check className="w-4 h-4 md:w-5 md:h-5 text-[#FA7B21] flex-shrink-0 mt-1" />
                          <span className="text-white/70 text-sm md:text-base">Responsabilidad y autonomía</span>
                        </div>
                        <div className="flex items-start gap-2 md:gap-3">
                          <Check className="w-4 h-4 md:w-5 md:h-5 text-[#FA7B21] flex-shrink-0 mt-1" />
                          <span className="text-white/70 text-sm md:text-base">Trabajo en equipo y empatía</span>
                        </div>
                        <div className="flex items-start gap-2 md:gap-3">
                          <Check className="w-4 h-4 md:w-5 md:h-5 text-[#FA7B21] flex-shrink-0 mt-1" />
                          <span className="text-white/70 text-sm md:text-base">Mentoría entre compañeros</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Destacado */}
          <ScrollReveal delay={400}>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] rounded-2xl md:rounded-3xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-gradient-to-r from-[#FA7B21] to-[#FCA929] p-6 md:p-12 rounded-2xl md:rounded-3xl text-center">
                <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white font-bold leading-relaxed px-2">
                  No es solo taekwondo. Es <span className="underline decoration-wavy decoration-white/50">formación de carácter</span> para toda la vida.
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={500}>
            <div className="text-center mt-8 md:mt-12">
              <button
                onClick={openTrialModal}
                className="group relative px-8 py-4 md:px-12 md:py-6 bg-white text-black text-base md:text-xl font-bold rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-white/20 w-full sm:w-auto"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 group-hover:text-white transition-colors duration-300">
                  Quiero esto para mi hijo
                </span>
              </button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 4. TESTIMONIOS - Optimizado para móvil */}
      <section className="relative py-16 md:py-32 px-4 bg-gradient-to-b from-black via-[#0A0A0A] to-black overflow-hidden">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#FA7B21]/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-[#FCA929]/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal>
            <div className="text-center mb-12 md:mb-20">
              <span className="inline-block bg-white/5 backdrop-blur-sm border border-white/10 text-white/70 px-4 py-2 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-semibold mb-4 md:mb-6">
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
            {[
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
            ].map((testimonial, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <div className="group relative h-full">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
                  <div className="relative h-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8 hover:border-[#FA7B21]/50 transition-all duration-500">
                    <img
                      src={testimonial.img}
                      alt={testimonial.author}
                      className="w-full h-48 sm:h-56 md:h-64 object-cover rounded-xl md:rounded-2xl mb-4 md:mb-6 ring-4 ring-white/10"
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

      {/* 5. GALERÍA CON LIGHTBOX - Optimizado para móvil */}
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

      {/* 6. TRUST SIGNALS - Optimizado para móvil */}
      <section className="relative py-16 md:py-32 px-4 bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: <Clock className="w-8 h-8 md:w-12 md:h-12" />, num: '20', label: 'años formando alumnos' },
              { icon: <Users className="w-8 h-8 md:w-12 md:h-12" />, num: '+300', label: 'familias satisfechas' },
              { icon: <Heart className="w-8 h-8 md:w-12 md:h-12" />, num: '12', label: 'alumnos máx/grupo' },
              { icon: <Award className="w-8 h-8 md:w-12 md:h-12" />, num: '✓', label: 'Certificación internacional' }
            ].map((stat, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <div className="text-center group">
                  <div className="relative inline-block mb-3 md:mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
                    <div className="relative text-[#FA7B21] group-hover:scale-110 transition-transform duration-300">
                      {stat.icon}
                    </div>
                  </div>
                  <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-[#FA7B21] to-[#FCA929] bg-clip-text text-transparent mb-2">
                    {stat.num}
                  </div>
                  <p className="text-white/70 text-xs sm:text-sm md:text-base leading-tight px-1">{stat.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 7. COMPARATIVA - Optimizado para móvil con scroll horizontal */}
      <section className="relative py-16 md:py-32 px-4 bg-gradient-to-b from-black via-[#0A0A0A] to-black overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          <ScrollReveal>
            <div className="text-center mb-12 md:mb-20">
              <span className="inline-block bg-white/5 backdrop-blur-sm border border-white/10 text-white/70 px-4 py-2 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-semibold mb-4 md:mb-6">
                La diferencia AMAS
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-6xl text-white mb-4 md:mb-6 font-bold px-2">
                ¿Por qué elegir <span className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] bg-clip-text text-transparent">AMAS</span>?
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/20 rounded-2xl md:rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929]">
                      <th className="px-3 py-3 md:px-6 md:py-6 text-left text-white text-sm md:text-lg"></th>
                      <th className="px-3 py-3 md:px-6 md:py-6 text-center text-white/80 text-sm md:text-lg whitespace-nowrap">Otras academias</th>
                      <th className="px-3 py-3 md:px-6 md:py-6 text-center text-white text-sm md:text-lg font-bold whitespace-nowrap">AMAS Team Wolf</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Tamaño de grupos', others: '20-30 niños', amas: 'Máximo 12 alumnos' },
                      { label: 'Enfoque', others: 'Solo técnica', amas: 'Técnica + Valores + Liderazgo' },
                      { label: 'Instructoras', others: 'Variables', amas: 'Certificadas internacionalmente' },
                      { label: 'Seguimiento', others: 'No personalizado', amas: 'Cartilla individual de progreso' },
                      { label: 'Graduación', others: 'Costo adicional', amas: 'Incluida en el programa' },
                      { label: 'Experiencia', others: '2-5 años', amas: '20 años transformando vidas' }
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-white/10 hover:bg-white/5 transition-colors duration-300">
                        <td className="px-3 py-4 md:px-6 md:py-5 font-semibold text-white text-sm md:text-lg whitespace-nowrap">{row.label}</td>
                        <td className="px-3 py-4 md:px-6 md:py-5 text-center text-white/60">
                          <div className="flex items-center justify-center gap-1 md:gap-2">
                            <X className="w-4 h-4 md:w-5 md:h-5 text-red-400 flex-shrink-0" />
                            <span className="text-xs md:text-base">{row.others}</span>
                          </div>
                        </td>
                        <td className="px-3 py-4 md:px-6 md:py-5 text-center text-white">
                          <div className="flex items-center justify-center gap-1 md:gap-2 font-semibold">
                            <Check className="w-4 h-4 md:w-5 md:h-5 text-[#25D366] flex-shrink-0" />
                            <span className="text-xs md:text-base">{row.amas}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-center text-white/40 text-xs py-3 md:hidden">← Desliza para ver más →</p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 8. PROCESO - Optimizado para móvil */}
      <section className="relative py-16 md:py-32 px-4 bg-gradient-to-b from-black via-[#0D0D0D] to-black overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal>
            <div className="text-center mb-12 md:mb-20">
              <span className="inline-block bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white px-4 py-2 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-bold mb-4 md:mb-6">
                Proceso simple
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-6xl text-white mb-4 md:mb-6 font-bold px-2">
                ¿Cómo <span className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] bg-clip-text text-transparent">funciona</span>?
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-12 md:mb-16 relative">
            {/* Línea conectora - solo desktop */}
            <div className="hidden md:block absolute top-12 md:top-16 left-0 right-0 h-1 bg-gradient-to-r from-[#FA7B21] via-[#FCA929] to-[#FA7B21] opacity-20" style={{ width: '80%', margin: '0 auto' }} />

            {[
              { num: 1, icon: <CalendarCheck className="w-5 h-5 md:w-6 md:h-6" />, title: 'AGENDAS', desc: 'Clase de prueba individual', price: 'Inversión: S/40' },
              { num: 2, icon: <Users className="w-5 h-5 md:w-6 md:h-6" />, title: 'VIENES', desc: 'Conoces instalaciones y profesoras', price: 'Sin compromiso' },
              { num: 3, icon: <Heart className="w-5 h-5 md:w-6 md:h-6" />, title: 'DECIDES', desc: 'Evalúas si AMAS es para tu familia', price: 'Sin presión' },
              { num: 4, icon: <Target className="w-5 h-5 md:w-6 md:h-6" />, title: 'TE INSCRIBES', desc: 'Los S/40 se descuentan al 100%', price: '¡Clase GRATIS!' }
            ].map((step, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <div className="text-center relative z-10">
                  <div className="relative inline-block mb-4 md:mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] blur-2xl opacity-50 animate-pulse" />
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl md:rounded-3xl bg-gradient-to-br from-[#FA7B21] to-[#FCA929] flex flex-col items-center justify-center text-white shadow-2xl transform hover:scale-110 hover:rotate-3 transition-all duration-300">
                      <div className="text-3xl md:text-4xl font-bold mb-1">{step.num}</div>
                      <div className="text-white/80">{step.icon}</div>
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl text-white font-bold mb-2 md:mb-3">{step.title}</h3>
                  <p className="text-white/70 leading-relaxed mb-2 text-sm md:text-base">{step.desc}</p>
                  <p className="text-[#FA7B21] font-semibold text-sm md:text-base">{step.price}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={400}>
            <div className="text-center">
              <button
                onClick={openTrialModal}
                className="group relative px-8 py-5 md:px-16 md:py-8 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white text-lg md:text-2xl font-bold rounded-full overflow-hidden transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-[#FA7B21]/50 w-full sm:w-auto"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[#FCA929] to-[#FA7B21] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center justify-center gap-2 md:gap-3">
                  <MessageCircle className="w-6 h-6 md:w-8 md:h-8" />
                  <span className="whitespace-nowrap text-base md:text-2xl">Agendar mi clase de prueba ahora</span>
                </span>
              </button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 10. FAQ - Optimizado para móvil */}
      <section className="relative py-16 md:py-32 px-4 bg-gradient-to-b from-black via-[#0A0A0A] to-black">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12 md:mb-16">
              <span className="inline-block bg-white/5 backdrop-blur-sm border border-white/10 text-white/70 px-4 py-2 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-semibold mb-4 md:mb-6">
                Todo lo que necesitas saber
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-6xl text-white mb-4 md:mb-6 font-bold px-2">
                Preguntas <span className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] bg-clip-text text-transparent">frecuentes</span>
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <Accordion type="single" collapsible className="space-y-4">
              {[
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
                  a: 'Av. Angamos Este 2741, San Borja (A 2 cuadras de Plaza San Borja Norte). Fácil acceso, estacionamiento disponible.'
                },
                {
                  q: '¿La clase de prueba tiene costo?',
                  a: 'S/40, que se descuentan al 100% si decides inscribir a tu hijo. Es decir, si te matriculas la clase de prueba fue completamente GRATIS.'
                }
              ].map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-lg border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-8 overflow-hidden hover:border-[#FA7B21]/50 transition-all duration-300">
                  <AccordionTrigger className="text-white hover:text-[#FA7B21] text-left text-base md:text-lg py-4 md:py-6 hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-white/70 leading-relaxed text-sm md:text-lg pb-4 md:pb-6">
                    {faq.a}
                    {i === 4 && (
                      <div className="mt-6 w-full h-80 bg-black/20 rounded-xl overflow-hidden">
                        <iframe
                          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3901.3842647892637!2d-77.00711968519444!3d-12.097438991447896!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105c85b3c3c3c3d%3A0x3c3c3c3c3c3c3c3c!2sAv.%20Angamos%20Este%202741%2C%20San%20Borja%2C%20Lima!5e0!3m2!1sen!2spe!4v1234567890"
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

      {/* Modal de Registro para Clase de Prueba */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-zinc-950 border border-[#FA7B21]/30 text-white sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#FA7B21] to-[#FCA929] bg-clip-text text-transparent">
              Agendar Clase de Prueba
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Completa tus datos para coordinar tu visita.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="nombrePadre">Nombre del Padre/Madre *</Label>
              <Input
                id="nombrePadre"
                value={formData.nombrePadre}
                onChange={(e) => handleInputChange('nombrePadre', e.target.value)}
                placeholder="Tu nombre completo"
                required
                className="bg-zinc-900 border-zinc-800 focus:border-[#FA7B21]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">WhatsApp *</Label>
              <Input
                id="telefono"
                type="tel"
                value={formData.telefono}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                placeholder="999 999 999"
                required
                className="bg-zinc-900 border-zinc-800 focus:border-[#FA7B21]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombreAlumno">Nombre del Alumno/a *</Label>
              <Input
                id="nombreAlumno"
                value={formData.nombreAlumno}
                onChange={(e) => handleInputChange('nombreAlumno', e.target.value)}
                placeholder="Nombre de tu hijo/a"
                required
                className="bg-zinc-900 border-zinc-800 focus:border-[#FA7B21]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaNacimiento">Fecha de Nacimiento del Alumno/a *</Label>
              <Input
                id="fechaNacimiento"
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) => handleInputChange('fechaNacimiento', e.target.value)}
                required
                className="bg-zinc-900 border-zinc-800 focus:border-[#FA7B21]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="tu@email.com"
                required
                className="bg-zinc-900 border-zinc-800 focus:border-[#FA7B21]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="objetivo">Objetivo Principal (Opcional)</Label>
              <Textarea
                id="objetivo"
                value={formData.objetivo}
                onChange={(e) => handleInputChange('objetivo', e.target.value)}
                placeholder="Ej: Mejorar disciplina, confianza, defensa personal..."
                className="bg-zinc-900 border-zinc-800 focus:border-[#FA7B21]"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white font-bold py-6 mt-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Confirmar Clase de Prueba'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* 11. CTA FINAL - Rediseñado */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url('https://res.cloudinary.com/dkoocok3j/image/upload/q_80.w_1920/v1763124726/Academia_Medalla_Photo_copy_desesj.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#FA7B21]/80 via-[#FCA929]/70 to-[#FA7B21]/80" />

        {/* Animated circles */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <ScrollReveal>
            <h1 className="text-5xl md:text-7xl text-white mb-8 leading-tight font-bold">
              ¿Listo para <span className="underline decoration-wavy decoration-white/50">transformar</span> a tu hijo?
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <p className="text-2xl md:text-3xl text-white/95 mb-12 font-semibold">
              Únete a las +300 familias que ya confían en AMAS
            </p>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="flex flex-wrap gap-4 justify-center mb-16">
              {[
                { icon: '🔥', text: 'Últimos 15 cupos del mes' },
                { icon: '⏰', text: 'Medio mes GRATIS en Programa Full' },
                { icon: '📋', text: 'Válido hasta agotar stock de uniformes' }
              ].map((badge, i) => (
                <div key={i} className="bg-white/20 backdrop-blur-md border-2 border-white/40 px-6 py-3 rounded-full text-white font-bold shadow-2xl hover:bg-white/30 transition-all duration-300 hover:scale-105">
                  <span className="mr-2">{badge.icon}</span>
                  {badge.text}
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <button
              onClick={openTrialModal}
              className="group relative px-20 py-10 bg-white text-black text-3xl font-bold rounded-full overflow-hidden transition-all duration-300 hover:scale-110 shadow-2xl hover:shadow-white/50 mb-8"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-black to-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 group-hover:text-white transition-colors duration-300 flex items-center justify-center gap-4">
                <MessageCircle className="w-10 h-10" />
                Agendar clase de prueba AHORA
              </span>
            </button>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <div className="bg-black/30 backdrop-blur-md border border-white/30 inline-block px-8 py-4 rounded-full">
              <p className="text-white/90 text-lg">
                <span className="font-bold">📞 Respondemos en menos de 1 hora</span>
                <br />
                <span className="text-sm">Lun-Vie 9am-8pm | Sáb 9am-1pm</span>
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Botón flotante de WhatsApp - Optimizado para móvil */}
      <button
        onClick={openTrialModal}
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
          <div className="bg-black/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap">
            ¡Contáctanos ahora!
          </div>
        </div>
      </button>

      <FooterMain
        onNavigate={onNavigate}
        onOpenMatricula={onOpenMatricula}
      />
    </div>
  );
}
