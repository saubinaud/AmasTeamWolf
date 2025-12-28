import React, { useState, useEffect, useRef } from 'react';
import { toast, Toaster } from 'sonner';
import {
  Send,
  Loader2,
  Star,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Calendar,
  Gift,
  Users,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeaderMain } from './HeaderMain';
import { FooterMain } from './FooterMain';
import { useUmami } from '../hooks/useUmami';

// --- INTERFAZ DE PROPS ---
interface RegistroShowroomProps {
  onNavigate: (page: string, sectionId?: string) => void;
  onOpenMatricula: () => void;
  onCartClick: () => void;
  cartItemsCount: number;
}

// --- COMPONENTES UI ---
const Label = ({ children, className = "" }: any) => (
  <label className={`block text-white text-sm md:text-base font-bold mb-2 tracking-wide ${className}`}>
    {children}
  </label>
);

const Input = ({ className = "", ...props }: any) => (
  <input
    className={`w-full bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-2xl px-5 py-4 text-white placeholder:text-white/50 focus:outline-none focus:border-[#FF6700] focus:ring-4 focus:ring-[#FF6700]/30 focus:bg-white/20 transition-all text-base font-medium ${className}`}
    {...props}
  />
);

// --- IMAGEN HERO ---
const HERO_IMG = "https://res.cloudinary.com/dkoocok3j/image/upload/f_auto,q_auto,w_1200/v1763125421/Publicidad_Image_6998_1_pjw0qi.jpg";

// --- TESTIMONIOS ---
const testimonials = [
  {
    img: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_400/v1763125421/Publicidad_Image_6998_1_pjw0qi.jpg',
    quote: "Mi hijo está más disciplinado en casa. Ya no tengo que repetirle las cosas 5 veces. El cambio fue en 2 meses.",
    author: 'María G.',
    role: 'mamá de Mateo (3 años)',
    rating: 5
  },
  {
    img: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_400/v1763125698/Requested_Photos_and_Videos_8660_vy633p.jpg',
    quote: "En el cole su profesora notó el cambio. Más seguro, participativo y concentrado. Sus notas subieron.",
    author: 'Carlos P.',
    role: 'papá de Santiago (8 años)',
    rating: 5
  },
  {
    img: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_400/v1763124491/AMAS_-_graduacio%CC%81n_profesores_pr3xtc.jpg',
    quote: "Mi hija ganó confianza en todo. Hasta en matemáticas mejoró porque ya no tiene miedo a equivocarse.",
    author: 'Ana L.',
    role: 'mamá de Valentina (3 años)',
    rating: 5
  }
];

// --- IMÁGENES DE GALERÍA ---
const galleryImages = [
  { src: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_600/v1763125421/Publicidad_Image_6998_1_pjw0qi.jpg', alt: 'Clase de taekwondo' },
  { src: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_600/v1763124726/Academia_Medalla_Photo_copy_desesj.jpg', alt: 'Instalaciones AMAS' },
  { src: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_600/v1763847478/Valencia_2_t8q3hl.jpg', alt: 'Alumnos practicando' },
  { src: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_600/v1763124491/AMAS_-_graduacio%CC%81n_profesores_pr3xtc.jpg', alt: 'Graduación profesores' },
  { src: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_600/v1763847692/WhatsApp_Image_2025-10-25_at_18.31.36_nfl4y6.jpg', alt: 'Entrenamiento grupo' },
  { src: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_600/v1763125422/Requested_Photos_and_Videos_8549_zpzgdf.jpg', alt: 'Ceremonia' },
  { src: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_600/v1763847922/AMAS_-_graduacio%CC%81n_profesores_3_au3zh0.jpg', alt: 'Formación' },
  { src: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_600/v1763125698/Requested_Photos_and_Videos_8660_vy633p.jpg', alt: 'Estudiantes' }
];

// --- CARRUSEL INFINITO DE GALERÍA ---
const InfiniteGalleryCarousel = () => {
  const [isPaused, setIsPaused] = useState(false);

  // Duplicar las imágenes para el efecto infinito
  const duplicatedImages = [...galleryImages, ...galleryImages, ...galleryImages];

  return (
    <div className="relative overflow-hidden py-4">
      <div
        className={`flex gap-4 ${isPaused ? '' : 'animate-scroll-infinite'}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{
          width: 'max-content'
        }}
      >
        {duplicatedImages.map((img, i) => (
          <div
            key={i}
            className="relative flex-shrink-0 w-64 h-80 sm:w-72 sm:h-96 rounded-2xl overflow-hidden group cursor-pointer shadow-xl"
          >
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
            <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-white text-sm md:text-base font-bold drop-shadow-lg">
                {img.alt}
              </p>
            </div>
            <div className="absolute inset-0 border-2 border-[#FF6700] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
          </div>
        ))}
      </div>

      {/* Indicador de deslizar */}
      <div className="text-center mt-6">
        <p className="text-white/40 text-xs md:text-sm flex items-center justify-center gap-2">
          <ChevronLeft className="w-4 h-4 animate-pulse" />
          Desliza para ver más
          <ChevronRight className="w-4 h-4 animate-pulse" />
        </p>
      </div>

      <style>{`
        @keyframes scroll-infinite {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-288px * ${galleryImages.length}));
          }
        }

        .animate-scroll-infinite {
          animation: scroll-infinite 40s linear infinite;
        }

        .animate-scroll-infinite:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

// --- COMPONENTE TESTIMONIOS MEJORADO ---
const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute -inset-4 bg-gradient-to-r from-[#FF6700]/20 to-[#ff8800]/20 rounded-3xl blur-3xl" />

        <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-2 border-[#FF6700]/50 rounded-3xl p-6 md:p-10 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6700]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#ff8800]/10 rounded-full blur-3xl" />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="relative z-10"
            >
              {/* Rating stars */}
              <div className="flex justify-center gap-2 mb-6">
                {[...Array(currentTestimonial.rating)].map((_, j) => (
                  <Star key={j} className="w-6 h-6 md:w-8 md:h-8 fill-[#FCA929] text-[#FCA929] drop-shadow-lg" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-white text-lg md:text-2xl leading-relaxed text-center mb-8 font-medium italic px-4">
                "{currentTestimonial.quote}"
              </blockquote>

              {/* Author info */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FF6700] to-[#ff8800] rounded-full blur-lg opacity-50" />
                  <img
                    src={currentTestimonial.img}
                    alt={currentTestimonial.author}
                    className="relative w-20 h-20 md:w-24 md:h-24 rounded-full object-cover ring-4 ring-[#FF6700]/50"
                  />
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-lg md:text-xl">{currentTestimonial.author}</p>
                  <p className="text-white/60 text-sm md:text-base">{currentTestimonial.role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation controls */}
          <div className="relative z-10 flex items-center justify-center gap-6 mt-8">
            <button
              onClick={goToPrevious}
              className="p-3 rounded-full bg-white/10 hover:bg-[#FF6700] transition-all duration-300 hover:scale-110"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </button>

            {/* Dots */}
            <div className="flex gap-3">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentIndex(i);
                    setIsAutoPlaying(false);
                  }}
                  className={`transition-all duration-300 rounded-full ${
                    i === currentIndex
                      ? 'w-10 h-3 bg-gradient-to-r from-[#FF6700] to-[#ff8800]'
                      : 'w-3 h-3 bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Ir al testimonio ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={goToNext}
              className="p-3 rounded-full bg-white/10 hover:bg-[#FF6700] transition-all duration-300 hover:scale-110"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </button>
          </div>

          {/* Auto-play toggle */}
          <div className="text-center mt-4">
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="text-white/40 text-xs md:text-sm hover:text-white/70 transition-colors flex items-center gap-2 mx-auto"
            >
              {isAutoPlaying ? '⏸ Pausar' : '▶ Reproducir'} automático
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- PÁGINA PRINCIPAL ---
export function RegistroShowroomPage({
  onNavigate,
  onOpenMatricula,
  onCartClick,
  cartItemsCount
}: RegistroShowroomProps) {

  const topRef = useRef<HTMLDivElement>(null);
  const { trackEvent, trackFormSubmit } = useUmami();

  const initialFormState = {
    nombre_padre: '',
    telefono: '',
    nombre_alumno: '',
    fecha_nacimiento: '',
    email: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState<any>({});
  const [horario, setHorario] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    trackEvent('Página Vista', { pagina: 'Registro Showroom' });
  }, []);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => /^[0-9]{9}$/.test(phone.replace(/\s/g, ''));

  // Calcular horario basado en fecha de nacimiento
  const calcularHorario = (fechaNacimiento: string) => {
    if (!fechaNacimiento) {
      setHorario(null);
      return;
    }

    const hoy = new Date();
    const fechaNac = new Date(fechaNacimiento);

    // Calcular la diferencia en años y meses
    let años = hoy.getFullYear() - fechaNac.getFullYear();
    let meses = hoy.getMonth() - fechaNac.getMonth();

    // Ajustar si el mes actual es anterior al mes de nacimiento
    if (meses < 0) {
      años--;
      meses += 12;
    }

    // Ajustar si el día actual es anterior al día de nacimiento
    if (hoy.getDate() < fechaNac.getDate()) {
      meses--;
      if (meses < 0) {
        años--;
        meses += 12;
      }
    }

    // Convertir todo a meses para facilitar la comparación
    const edadEnMeses = (años * 12) + meses;

    if (edadEnMeses < 12) {
      // Menor de 1 año, no mostrar horario
      setHorario(null);
      return;
    }

    if (edadEnMeses >= 12 && edadEnMeses <= 29) {
      // De 1 año a 2 años y 5 meses (12-29 meses)
      setHorario('11:00 AM');
    } else if (edadEnMeses >= 30 && edadEnMeses <= 47) {
      // De 2 años y 6 meses a 3 años y 11 meses (30-47 meses)
      setHorario('11:30 AM');
    } else if (edadEnMeses >= 48) {
      // De 4 años a más (48+ meses)
      setHorario('12:00 PM');
    } else {
      setHorario(null);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev: any) => ({ ...prev, [field]: '' }));

    // Si es el campo de fecha de nacimiento, calcular horario
    if (field === 'fecha_nacimiento') {
      calcularHorario(value);
    }
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setIsSubmitted(false);
    setFormErrors({});
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const validateForm = () => {
    const errors: any = {};
    if (!formData.nombre_padre.trim()) errors.nombre_padre = 'Requerido';
    if (!formData.nombre_alumno.trim()) errors.nombre_alumno = 'Requerido';
    if (!formData.fecha_nacimiento.trim()) {
      errors.fecha_nacimiento = 'Requerido';
    } else {
      const fechaNac = new Date(formData.fecha_nacimiento);
      const hoy = new Date();
      if (fechaNac >= hoy) {
        errors.fecha_nacimiento = 'Fecha inválida';
      }
    }
    if (!formData.telefono.trim() || !validatePhone(formData.telefono)) {
      errors.telefono = 'Teléfono inválido (9 dígitos)';
    }
    if (!formData.email.trim() || !validateEmail(formData.email)) {
      errors.email = 'Email inválido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor completa todos los campos correctamente', { position: 'top-center' });
      return;
    }

    setIsSubmitting(true);

    try {
      trackEvent('Click Formulario Showroom', {
        nombre_padre: formData.nombre_padre,
        nombre_alumno: formData.nombre_alumno
      });

      const response = await fetch('https://pallium-n8n.s6hx3x.easypanel.host/webhook/regsitro-showroom', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           ...formData,
           horario: horario,
           timestamp: new Date().toISOString(),
           source: 'landing_showroom'
         }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        trackFormSubmit('Registro Showroom');
        toast.success('¡Registro enviado con éxito! 🎉', { position: 'top-center' });

        if (topRef.current) {
          topRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        throw new Error('Error en la respuesta del servidor');
      }

    } catch (error) {
      console.error("Error al enviar:", error);
      toast.error('Error de conexión. Intenta nuevamente.', { position: 'top-center' });
      trackEvent('Error Formulario Showroom', { error: 'connection_error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={topRef} className="min-h-screen relative flex flex-col font-sans selection:bg-[#FF6700] selection:text-white bg-black text-white overflow-x-hidden">
      <Toaster position="top-center" richColors />

      {/* HEADER */}
      <div className="relative z-20">
        <HeaderMain
          onNavigate={onNavigate}
          onOpenMatricula={onOpenMatricula}
          onCartClick={onCartClick}
          cartItemsCount={cartItemsCount}
        />
      </div>

      {/* HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-20 pb-12 px-4">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={HERO_IMG}
            alt="AMAS Team Wolf"
            className="w-full h-full object-cover scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black" />
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 z-0 opacity-30">
          <div className="absolute top-20 left-10 w-2 h-2 bg-[#FF6700] rounded-full animate-ping" style={{ animationDelay: '0s' }} />
          <div className="absolute top-40 right-20 w-2 h-2 bg-[#ff8800] rounded-full animate-ping" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-40 left-1/4 w-2 h-2 bg-[#FCA929] rounded-full animate-ping" style={{ animationDelay: '2s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#FF6700] to-[#ff8800] px-6 py-3 rounded-full shadow-2xl border-2 border-white/20">
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white animate-pulse" />
              <span className="text-white font-black text-sm md:text-lg uppercase tracking-wider">
                Inscripciones Abiertas
              </span>
            </div>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight"
          >
            Clase de Prueba
            <br />
            <span className="bg-gradient-to-r from-[#FF6700] via-[#ff8800] to-[#FCA929] bg-clip-text text-transparent drop-shadow-2xl">
              Especial Showroom
            </span>
          </motion.h1>

          {/* Date Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-3 bg-black/60 backdrop-blur-md px-8 py-4 rounded-2xl border-2 border-[#FF6700]/50 shadow-xl">
              <Calendar className="w-6 h-6 md:w-8 md:h-8 text-[#FF6700]" />
              <span className="text-white font-bold text-xl md:text-3xl">
                4 de Enero
              </span>
            </div>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg sm:text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed px-4"
          >
            Desarrolla la <span className="font-bold text-[#FF6700]">seguridad física y emocional</span> que tu hijo necesita.
            <br className="hidden sm:block" />
            <span className="text-base md:text-lg text-white/70 block mt-3">
              Desde 1 año · Cupos limitados · Descuento exclusivo para asistentes
            </span>
          </motion.p>

          {/* Benefits badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-8"
          >
            {[
              { icon: Gift, text: 'Sorpresa exclusiva' },
              { icon: Users, text: 'Grupos reducidos' },
              { icon: MapPin, text: 'Te Quiero Fuerte y Claro' }
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20"
              >
                <item.icon className="w-4 h-4 md:w-5 md:h-5 text-[#FF6700]" />
                <span className="text-white text-xs md:text-sm font-semibold">
                  {item.text}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12"
          >
            <p className="text-white/60 text-sm md:text-base mb-3">
              Inscríbete gratis ahora
            </p>
            <div className="w-6 h-10 border-2 border-white/30 rounded-full mx-auto flex justify-center">
              <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-bounce" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* FORMULARIO */}
      <main className="relative z-10 px-4 py-16 md:py-24 max-w-7xl mx-auto w-full">
        <div className="max-w-2xl mx-auto">

          {isSubmitted ? (
            // --- ESTADO DE ÉXITO ---
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-[#FF6700]/30 to-[#ff8800]/30 rounded-3xl blur-3xl" />

              <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-4 border-[#FF6700] rounded-3xl p-8 md:p-12 text-center shadow-2xl overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#FF6700]/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#ff8800]/20 rounded-full blur-3xl" />

                <div className="relative z-10">
                  <div className="mb-8 flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#FF6700] to-[#ff8800] rounded-full blur-2xl opacity-50 animate-pulse" />
                      <div className="relative w-28 h-28 md:w-36 md:h-36 bg-gradient-to-br from-[#FF6700] to-[#ff8800] rounded-full flex items-center justify-center shadow-2xl">
                        <svg className="w-14 h-14 md:w-20 md:h-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-[#FF6700] to-[#ff8800] bg-clip-text text-transparent mb-4">
                    ¡Perfecto!
                  </h3>
                  <p className="text-white/90 mb-3 text-lg md:text-xl leading-relaxed">
                    Tu cupo está reservado para el
                  </p>
                  <p className="text-[#FF6700] text-2xl md:text-3xl font-black mb-8">
                    4 de Enero
                  </p>
                  <p className="text-white/70 text-base md:text-lg mb-8">
                    Te enviaremos todos los detalles por correo.
                    <br />
                    ¡Nos vemos pronto! 🎯
                  </p>

                  <button
                    onClick={handleReset}
                    className="group relative px-8 py-4 bg-gradient-to-r from-[#FF6700] to-[#ff8800] text-white text-base md:text-lg font-bold rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 shadow-xl"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-[#ff8800] to-[#FCA929] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative z-10">Registrar otra persona</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            // --- FORMULARIO ---
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-[#FF6700]/20 to-[#ff8800]/20 rounded-3xl blur-3xl" />

              <form
                onSubmit={handleSubmit}
                className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-2 border-[#FF6700]/50 rounded-3xl p-6 md:p-10 shadow-2xl overflow-hidden"
              >
                {/* Decorative top bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF6700] via-[#ff8800] to-[#FCA929]" />

                {/* Decorative elements */}
                <div className="absolute top-10 right-10 w-32 h-32 bg-[#FF6700]/10 rounded-full blur-3xl" />
                <div className="absolute bottom-10 left-10 w-32 h-32 bg-[#ff8800]/10 rounded-full blur-3xl" />

                <div className="relative z-10">
                  {/* Form title */}
                  <div className="text-center mb-8">
                    <h2 className="text-2xl md:text-4xl font-black text-white mb-3">
                      Reserva tu Cupo
                    </h2>
                    <p className="text-white/60 text-sm md:text-base">
                      Completa el formulario y asegura tu lugar
                    </p>
                  </div>

                  <div className="space-y-6 md:space-y-8">

                    {/* Nombre del Padre */}
                    <div className="space-y-2">
                      <Label>
                        Nombre del Padre/Madre *
                      </Label>
                      <Input
                        placeholder="Ej: Juan Pérez"
                        value={formData.nombre_padre}
                        onChange={(e: any) => handleInputChange('nombre_padre', e.target.value)}
                        className={formErrors.nombre_padre ? 'border-red-500 ring-4 ring-red-500/30' : ''}
                      />
                      {formErrors.nombre_padre && (
                        <p className="text-red-400 text-sm ml-2 flex items-center gap-1">
                          <span>⚠</span> {formErrors.nombre_padre}
                        </p>
                      )}
                    </div>

                    {/* Número de Teléfono */}
                    <div className="space-y-2">
                      <Label>
                        Número de WhatsApp *
                      </Label>
                      <Input
                        type="tel"
                        placeholder="Ej: 987654321"
                        value={formData.telefono}
                        onChange={(e: any) => handleInputChange('telefono', e.target.value)}
                        className={formErrors.telefono ? 'border-red-500 ring-4 ring-red-500/30' : ''}
                      />
                      {formErrors.telefono && (
                        <p className="text-red-400 text-sm ml-2 flex items-center gap-1">
                          <span>⚠</span> {formErrors.telefono}
                        </p>
                      )}
                    </div>

                    {/* Nombre del Alumno */}
                    <div className="space-y-2">
                      <Label>
                        Nombre del Niño/a *
                      </Label>
                      <Input
                        placeholder="Ej: Sofía Pérez"
                        value={formData.nombre_alumno}
                        onChange={(e: any) => handleInputChange('nombre_alumno', e.target.value)}
                        className={formErrors.nombre_alumno ? 'border-red-500 ring-4 ring-red-500/30' : ''}
                      />
                      {formErrors.nombre_alumno && (
                        <p className="text-red-400 text-sm ml-2 flex items-center gap-1">
                          <span>⚠</span> {formErrors.nombre_alumno}
                        </p>
                      )}
                    </div>

                    {/* Fecha de Nacimiento del Alumno */}
                    <div className="space-y-2">
                      <Label>
                        Fecha de Nacimiento del Niño/a *
                      </Label>
                      <Input
                        type="date"
                        value={formData.fecha_nacimiento}
                        onChange={(e: any) => handleInputChange('fecha_nacimiento', e.target.value)}
                        className={formErrors.fecha_nacimiento ? 'border-red-500 ring-4 ring-red-500/30' : ''}
                        max={new Date().toISOString().split('T')[0]}
                      />
                      {formErrors.fecha_nacimiento && (
                        <p className="text-red-400 text-sm ml-2 flex items-center gap-1">
                          <span>⚠</span> {formErrors.fecha_nacimiento}
                        </p>
                      )}

                      {/* Mostrar horario dinámicamente */}
                      <AnimatePresence>
                        {horario && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className="relative"
                          >
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#FF6700] to-[#ff8800] rounded-2xl blur opacity-30" />
                            <div className="relative bg-gradient-to-r from-[#FF6700]/20 to-[#ff8800]/20 border-2 border-[#FF6700]/50 rounded-2xl p-4 backdrop-blur-sm">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                  <Calendar className="w-6 h-6 text-[#FF6700]" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-white/80 text-xs md:text-sm font-medium">
                                    Tu horario asignado:
                                  </p>
                                  <p className="text-white text-lg md:text-xl font-black">
                                    {horario}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Correo Electrónico */}
                    <div className="space-y-2">
                      <Label>
                        Correo Electrónico *
                      </Label>
                      <Input
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={formData.email}
                        onChange={(e: any) => handleInputChange('email', e.target.value)}
                        className={formErrors.email ? 'border-red-500 ring-4 ring-red-500/30' : ''}
                      />
                      {formErrors.email && (
                        <p className="text-red-400 text-sm ml-2 flex items-center gap-1">
                          <span>⚠</span> {formErrors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* BOTÓN SUBMIT */}
                  <div className="mt-14 md:mt-16">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      data-umami-event="Click Boton Showroom"
                      data-umami-event-tipo="registro"
                      className="group relative w-full overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {/* Animated gradient background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#FF6700] via-[#ff8800] to-[#FCA929] animate-gradient-xy" />

                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

                      <span className="relative flex items-center justify-center gap-3 px-8 py-5 md:py-6 text-white text-lg md:text-2xl font-black uppercase tracking-wider">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-7 h-7 md:w-8 md:h-8 animate-spin"/>
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="w-7 h-7 md:w-8 md:h-8 group-hover:translate-x-1 transition-transform" />
                            Sí, Quiero mi Cupo Gratis
                          </>
                        )}
                      </span>
                    </button>

                    {/* Trust badge */}
                    <p className="text-center text-white/40 text-xs md:text-sm mt-4">
                      🔒 Tus datos están seguros · Sin compromiso
                    </p>
                  </div>
                </div>

                <style>{`
                  @keyframes gradient-xy {
                    0%, 100% {
                      background-position: 0% 50%;
                    }
                    50% {
                      background-position: 100% 50%;
                    }
                  }

                  .animate-gradient-xy {
                    background-size: 200% 200%;
                    animation: gradient-xy 3s ease infinite;
                  }
                `}</style>
              </form>
            </motion.div>
          )}
        </div>
      </main>

      {/* SECCIÓN DE GALERÍA - CARRUSEL INFINITO */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
              Nuestras
            </h2>
            <p className="text-white/70 text-lg md:text-xl">
              El espacio perfecto para el crecimiento de tu hijo
            </p>
          </motion.div>
        </div>

        <InfiniteGalleryCarousel />
      </section>

      {/* SECCIÓN DE TESTIMONIOS */}
      <section className="relative py-16 md:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
              Familias
            </h2>
            <p className="text-white/70 text-lg md:text-xl">
              Testimonios reales de padres que confiaron en AMAS
            </p>
          </motion.div>

          <TestimonialsSection />
        </div>
      </section>

      {/* FOOTER */}
      <div className="relative z-20 mt-16">
        <FooterMain
          onNavigate={onNavigate}
          onOpenMatricula={onOpenMatricula}
        />
      </div>

    </div>
  );
}

export default RegistroShowroomPage;
