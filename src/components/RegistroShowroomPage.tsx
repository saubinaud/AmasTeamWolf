import React, { useState, useEffect, useRef } from 'react';
import { toast, Toaster } from 'sonner';
import {
  Send,
  Loader2,
  Star,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon
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
  <label className={`block text-gray-100 text-sm md:text-base font-medium mb-2.5 tracking-wide ${className}`}>
    {children}
  </label>
);

const Input = ({ className = "", ...props }: any) => (
  <input
    className={`w-full bg-black/20 border-2 border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-400 focus:outline-none focus:border-[#FF6700] focus:ring-2 focus:ring-[#FF6700]/30 transition-all text-base font-medium ${className}`}
    {...props}
  />
);

const Button = ({ children, className = "", disabled, onClick, variant = "primary", ...props }: any) => {
  const variants: any = {
    primary: "bg-gradient-to-r from-[#FF6700] via-[#ff7a1f] to-[#ff8800] hover:from-[#ff8800] hover:via-[#ff9933] hover:to-[#ffaa00] text-white font-black border-b-4 border-[#cc5200] active:border-b-2 shadow-[0_0_40px_rgba(255,103,0,0.9),0_0_80px_rgba(255,103,0,0.5)] hover:shadow-[0_0_60px_rgba(255,103,0,1),0_0_100px_rgba(255,103,0,0.7)]",
    secondary: "bg-white hover:bg-zinc-50 text-zinc-900 font-bold border-2 border-zinc-300 shadow-lg hover:shadow-xl"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-4 rounded-xl transition-all active:translate-y-0.5 ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// --- IMAGEN DE FONDO ---
const BG_MOBILE = "https://res.cloudinary.com/dkoocok3j/image/upload/f_auto,q_auto,w_800/v1763124726/Academia_Medalla_Photo_copy_desesj.jpg";
const BG_DESKTOP = "https://res.cloudinary.com/dkoocok3j/image/upload/f_auto,q_auto,w_1600/v1763124726/Academia_Medalla_Photo_copy_desesj.jpg";

// --- TESTIMONIOS (los mismos de clase de prueba) ---
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

// --- IMÁGENES DE GALERÍA ---
const galleryImages = [
  { src: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_800/v1763125421/Publicidad_Image_6998_1_pjw0qi.jpg', alt: 'Clase de taekwondo' },
  { src: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_800/v1763124726/Academia_Medalla_Photo_copy_desesj.jpg', alt: 'Instalaciones AMAS' },
  { src: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_800/v1763847478/Valencia_2_t8q3hl.jpg', alt: 'Alumnos practicando' },
  { src: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_800/v1763124491/AMAS_-_graduacio%CC%81n_profesores_pr3xtc.jpg', alt: 'Graduación profesores' },
  { src: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_800/v1763847692/WhatsApp_Image_2025-10-25_at_18.31.36_nfl4y6.jpg', alt: 'Entrenamiento grupo' },
  { src: 'https://res.cloudinary.com/dkoocok3j/image/upload/q_80,w_800/v1763125422/Requested_Photos_and_Videos_8549_zpzgdf.jpg', alt: 'Ceremonia' }
];

// --- COMPONENTE CARRUSEL ---
const TestimonialsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000); // Cambia cada 5 segundos

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
    <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <img
            src={currentTestimonial.img}
            alt={currentTestimonial.author}
            className="w-full h-64 sm:h-72 md:h-80 object-cover rounded-xl ring-4 ring-white/10"
          />

          <div className="flex gap-1">
            {[...Array(5)].map((_, j) => (
              <Star key={j} className="w-5 h-5 md:w-6 md:h-6 fill-[#FCA929] text-[#FCA929]" />
            ))}
          </div>

          <blockquote className="text-white/90 text-base md:text-lg leading-relaxed italic">
            "{currentTestimonial.quote}"
          </blockquote>

          <div className="border-t border-white/10 pt-4">
            <p className="text-white font-bold text-base md:text-lg">{currentTestimonial.author}</p>
            <p className="text-white/50 text-sm md:text-base">{currentTestimonial.role}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controles del carrusel */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={goToPrevious}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Anterior"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        {/* Indicadores */}
        <div className="flex gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentIndex(i);
                setIsAutoPlaying(false);
              }}
              className={`h-2 rounded-full transition-all ${
                i === currentIndex
                  ? 'w-8 bg-[#FF6700]'
                  : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Ir al testimonio ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={goToNext}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Siguiente"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Indicador de auto-play */}
      <div className="text-center mt-4">
        <button
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className="text-white/50 text-xs md:text-sm hover:text-white/70 transition-colors"
        >
          {isAutoPlaying ? '⏸ Pausar' : '▶ Reproducir'}
        </button>
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
    email: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState<any>({});

  // Track page view on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    trackEvent('Página Vista', { pagina: 'Registro Showroom' });

    // Preload images
    const imgMobile = new Image(); imgMobile.src = BG_MOBILE;
    const imgDesktop = new Image(); imgDesktop.src = BG_DESKTOP;
  }, []);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => /^[0-9]{9}$/.test(phone.replace(/\s/g, ''));

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev: any) => ({ ...prev, [field]: '' }));
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
      // Track form submission attempt
      trackEvent('Click Formulario Showroom', {
        nombre_padre: formData.nombre_padre,
        nombre_alumno: formData.nombre_alumno
      });

      const response = await fetch('https://pallium-n8n.s6hx3x.easypanel.host/webhook/regsitro-showroom', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           ...formData,
           timestamp: new Date().toISOString(),
           source: 'landing_showroom'
         }),
      });

      if (response.ok) {
        setIsSubmitted(true);

        // Track successful submission
        trackFormSubmit('Registro Showroom');

        toast.success('¡Registro enviado con éxito! 🎉', { position: 'top-center' });

        if (topRef.current) {
          topRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        console.error("Error respuesta servidor:", response.status, response.statusText);
        throw new Error('Error en la respuesta del servidor');
      }

    } catch (error) {
      console.error("Error al enviar:", error);
      toast.error('Error de conexión. Intenta nuevamente.', { position: 'top-center' });

      // Track error
      trackEvent('Error Formulario Showroom', { error: 'connection_error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={topRef} className="min-h-screen relative flex flex-col font-sans selection:bg-[#FF6700] selection:text-white bg-black text-white overflow-x-hidden">
      <Toaster position="top-center" richColors />

      {/* FONDO */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 block md:hidden"
          style={{
            backgroundImage: `url('${BG_MOBILE}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.3
          }}
        />

        <div
          className="absolute inset-0 hidden md:block"
          style={{
            backgroundImage: `url('${BG_DESKTOP}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.3
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black" />
      </div>

      {/* HEADER */}
      <div className="relative z-20">
        <HeaderMain
          onNavigate={onNavigate}
          onOpenMatricula={onOpenMatricula}
          onCartClick={onCartClick}
          cartItemsCount={cartItemsCount}
        />
      </div>

      {/* HERO + FORMULARIO */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 pt-24 pb-8 md:px-6 md:pt-32 md:pb-12 relative z-10 w-full max-w-7xl mx-auto">

        {/* TÍTULO */}
        <div className="text-center mb-8 md:mb-12 w-full max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4 md:space-y-6"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight">
              Showroom
              <br />
              <span className="bg-gradient-to-r from-[#FF6700] to-[#ff8800] bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(255,103,0,1)]">
                AMAS Team Wolf
              </span>
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-white/80 max-w-2xl mx-auto leading-relaxed font-medium">
              Conoce nuestras instalaciones y descubre cómo transformamos vidas
              <span className="block text-[#FF6700] font-bold mt-2 text-xl md:text-3xl">
                ¡Te esperamos!
              </span>
            </p>
          </motion.div>
        </div>

        {/* FORMULARIO */}
        <div className="w-full max-w-2xl mx-auto mb-16 md:mb-24">

          {isSubmitted ? (
            // --- ESTADO DE ÉXITO ---
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border-4 border-[#FF6700] rounded-3xl p-8 md:p-12 text-center shadow-2xl"
            >
              <div className="mb-6 flex justify-center">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-[#FF6700] to-[#ff8800] rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                  <svg className="w-12 h-12 md:w-16 md:h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <h3 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-[#FF6700] to-[#ff8800] bg-clip-text text-transparent mb-4">
                ¡Perfecto!
              </h3>
              <p className="text-white/90 mb-8 text-lg md:text-xl leading-relaxed">
                Hemos registrado tu asistencia al Showroom.
                <span className="block mt-2 font-bold text-[#FF6700]">
                  ¡Nos vemos pronto! 🎯
                </span>
              </p>

              <Button
                onClick={handleReset}
                variant="primary"
                className="text-lg md:text-xl max-w-md mx-auto"
              >
                Registrar otra persona
              </Button>
            </motion.div>
          ) : (
            // --- FORMULARIO ---
            <motion.form
              onSubmit={handleSubmit}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] backdrop-blur-2xl border-4 border-[#FF6700] rounded-3xl p-6 md:p-10 shadow-[0_20px_100px_rgba(255,103,0,0.5)] relative overflow-hidden"
            >
              {/* Decoración superior */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#FF6700] via-[#ff8533] to-[#FF6700] shadow-[0_0_30px_rgba(255,103,0,1)]" />

              {/* Brillo interno */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF6700]/10 via-transparent to-transparent pointer-events-none" />

              <div className="space-y-6 md:space-y-8 relative z-10">

                {/* Nombre del Padre */}
                <div className="space-y-2">
                  <Label>
                    Nombre del Padre/Madre
                  </Label>
                  <Input
                    placeholder="Ej: Juan Pérez"
                    value={formData.nombre_padre}
                    onChange={(e: any) => handleInputChange('nombre_padre', e.target.value)}
                    className={formErrors.nombre_padre ? 'border-red-500 ring-2 ring-red-500/20' : ''}
                  />
                  {formErrors.nombre_padre && (
                    <p className="text-red-400 text-sm ml-1">{formErrors.nombre_padre}</p>
                  )}
                </div>

                {/* Número de Teléfono */}
                <div className="space-y-2">
                  <Label>
                    Número de Teléfono
                  </Label>
                  <Input
                    type="tel"
                    placeholder="Ej: 987654321"
                    value={formData.telefono}
                    onChange={(e: any) => handleInputChange('telefono', e.target.value)}
                    className={formErrors.telefono ? 'border-red-500 ring-2 ring-red-500/20' : ''}
                  />
                  {formErrors.telefono && (
                    <p className="text-red-400 text-sm ml-1">{formErrors.telefono}</p>
                  )}
                </div>

                {/* Nombre del Alumno */}
                <div className="space-y-2">
                  <Label>
                    Nombre del Alumno/a
                  </Label>
                  <Input
                    placeholder="Ej: Sofía Pérez"
                    value={formData.nombre_alumno}
                    onChange={(e: any) => handleInputChange('nombre_alumno', e.target.value)}
                    className={formErrors.nombre_alumno ? 'border-red-500 ring-2 ring-red-500/20' : ''}
                  />
                  {formErrors.nombre_alumno && (
                    <p className="text-red-400 text-sm ml-1">{formErrors.nombre_alumno}</p>
                  )}
                </div>

                {/* Correo Electrónico */}
                <div className="space-y-2">
                  <Label>
                    Correo Electrónico
                  </Label>
                  <Input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={formData.email}
                    onChange={(e: any) => handleInputChange('email', e.target.value)}
                    className={formErrors.email ? 'border-red-500 ring-2 ring-red-500/20' : ''}
                  />
                  {formErrors.email && (
                    <p className="text-red-400 text-sm ml-1">{formErrors.email}</p>
                  )}
                </div>
              </div>

              {/* BOTÓN SUBMIT */}
              <div className="mt-8 md:mt-10 relative z-20">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  data-umami-event="Click Boton Showroom"
                  data-umami-event-tipo="registro"
                  className="w-full relative group overflow-hidden rounded-2xl p-[2px] focus:outline-none focus:ring-4 focus:ring-[#FF6700]/50 transition-transform active:scale-95"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-[#FF6700] via-[#ffaa00] to-[#FF6700] animate-gradient-xy" />

                  <span className="relative flex items-center justify-center gap-3 bg-gradient-to-r from-[#FF6700] to-[#ff8800] hover:from-[#ff8800] hover:to-[#ffaa00] text-white py-5 md:py-6 px-6 rounded-2xl transition-all duration-200 uppercase tracking-widest font-black text-lg md:text-xl lg:text-2xl">
                    {isSubmitting ? (
                      <>
                        ENVIANDO... <Loader2 className="w-7 h-7 md:w-8 md:h-8 animate-spin"/>
                      </>
                    ) : (
                      <>
                        SÍ, ASISTIRÉ <Send className="w-7 h-7 md:w-8 md:h-8" />
                      </>
                    )}
                  </span>
                </button>
              </div>

            </motion.form>
          )}
        </div>

        {/* SECCIÓN DE IMÁGENES */}
        <section className="w-full max-w-7xl mx-auto mb-16 md:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
              Nuestras <span className="bg-gradient-to-r from-[#FF6700] to-[#ff8800] bg-clip-text text-transparent">Instalaciones</span>
            </h2>
            <p className="text-white/70 text-lg md:text-xl">
              Conoce el espacio donde tu hijo crecerá
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {galleryImages.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative group overflow-hidden rounded-2xl aspect-square cursor-pointer"
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                <div className="absolute inset-0 border-2 border-[#FF6700] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white text-sm md:text-base font-bold transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    {img.alt}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* SECCIÓN DE REVIEWS - CARRUSEL */}
        <section className="w-full max-w-7xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
              Lo que dicen los <span className="bg-gradient-to-r from-[#FF6700] to-[#ff8800] bg-clip-text text-transparent">Padres</span>
            </h2>
            <p className="text-white/70 text-lg md:text-xl">
              Testimonios reales de familias AMAS
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            <TestimonialsCarousel />
          </motion.div>
        </section>

      </main>

      {/* FOOTER */}
      <div className="relative z-20">
        <FooterMain
          onNavigate={onNavigate}
          onOpenMatricula={onOpenMatricula}
        />
      </div>

    </div>
  );
}

export default RegistroShowroomPage;
