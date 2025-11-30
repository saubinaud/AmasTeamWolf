import React, { useState, useEffect, useRef } from 'react';
import { toast, Toaster } from 'sonner';
import { 
  Gift, PartyPopper, XCircle, CalendarHeart, Send, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeaderMain } from './HeaderMain';
import { FooterMain } from './FooterMain';

// --- COMPONENTES UI ---

const Label = ({ children, className = "" }) => (
  <label className={`block text-white text-sm md:text-base font-bold mb-2.5 uppercase tracking-wide ${className}`}>
    {children}
  </label>
);

const Input = ({ className = "", ...props }) => (
  <input 
    className={`w-full bg-white/95 border-2 border-zinc-300 rounded-lg px-4 py-3.5 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#FF6700] focus:ring-2 focus:ring-[#FF6700]/20 transition-all text-sm font-medium ${className}`}
    {...props}
  />
);

const Button = ({ children, className = "", disabled, onClick, variant = "primary", ...props }) => {
  const variants = {
    primary: "bg-[#FF6700] hover:bg-[#ff7a1f] text-white font-extrabold border-b-4 border-[#cc5200] active:border-b-2 shadow-xl hover:shadow-2xl",
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

// --- PÁGINA PRINCIPAL ---

export function RegistroActividadNavidadPage() {
  const topRef = useRef(null);

  const initialFormState = {
    nombre_padre: '',
    nombre_alumno: '',
    email: '',
    asistencia: '', 
    deseo_1: '',
    deseo_2: '',
    deseo_3: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleAttendance = (value) => {
    setFormData(prev => ({ ...prev, asistencia: value }));
    if (formErrors.asistencia) setFormErrors(prev => ({ ...prev, asistencia: '' }));
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
    const errors = {};
    if (!formData.nombre_padre.trim()) errors.nombre_padre = 'Requerido';
    if (!formData.nombre_alumno.trim()) errors.nombre_alumno = 'Requerido';
    if (!formData.email.trim() || !validateEmail(formData.email)) errors.email = 'Email inválido';
    if (!formData.asistencia) errors.asistencia = 'Selecciona una opción';
    
    if (formData.asistencia === 'confirmado' && (!formData.deseo_1 && !formData.deseo_2 && !formData.deseo_3)) {
      errors.deseos = 'Escribe al menos un deseo';
      toast.error('🎅 ¡Santa necesita ayuda! Escribe al menos un deseo.', { position: 'top-center' });
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Por favor completa los campos requeridos', { position: 'top-center' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('https://pallium-n8n.s6hx3x.easypanel.host/webhook/asistencia-evento-navidad', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ 
           ...formData, 
           timestamp: new Date().toISOString(), 
           source: 'landing_navidad_final' 
         }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        toast.success('¡Registro enviado con éxito! 🎄', { position: 'top-center' });
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={topRef} className="min-h-screen relative flex flex-col font-sans selection:bg-[#FF6700] selection:text-white bg-[#0a2818] text-white overflow-x-hidden">
      <Toaster position="top-center" richColors />
      
      {/* FONDO - MÓVIL Y DESKTOP DIFERENTES */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Fondo móvil */}
        <div 
          className="absolute inset-0 bg-center bg-cover md:hidden"
          style={{ 
            backgroundImage: `url('https://res.cloudinary.com/dkoocok3j/image/upload/v1764494534/4_guugpt.png')`,
            opacity: 0.9
          }} 
        />
        {/* Fondo desktop */}
        <div 
          className="absolute inset-0 bg-center bg-cover hidden md:block"
          style={{ 
            backgroundImage: `url('https://res.cloudinary.com/dkoocok3j/image/upload/v1764494534/3_dat4ln.png')`,
            opacity: 0.9
          }} 
        />
        {/* Gradiente sutil */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a2818]/20 via-transparent to-[#0a2818]/30" />
      </div>

      {/* HEADER */}
      <div className="relative z-20">
        <HeaderMain />
      </div>

      {/* CONTENIDO */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-8 md:py-12 lg:py-16 relative z-10 w-full max-w-7xl mx-auto">
        
        {/* HEADER DE PÁGINA */}
        <div className="text-center mb-6 md:mb-10 w-full max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-3 md:space-y-4"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full border border-[#FF6700]/50">
              <span className="text-base md:text-lg">🎅</span>
              <span className="text-[9px] md:text-[10px] font-bold tracking-[0.15em] uppercase text-[#FF6700]">
                Evento Fin de Año
              </span>
            </div>
            
            {/* Título */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-white leading-tight px-4">
              Gran Clausura
              <br />
              <span className="text-[#FF6700] font-black drop-shadow-[0_2px_10px_rgba(255,103,0,0.8)]">
                Navideña
              </span>
            </h1>
            
            {/* Descripción */}
            <p className="text-white text-sm md:text-base lg:text-lg max-w-md mx-auto leading-relaxed px-4 drop-shadow-lg font-medium">
              Regístrate para la gran actividad navideña.
              <span className="block text-[#FF6700] font-bold mt-1">¡Los esperamos a todos!</span>
            </p>
          </motion.div>
        </div>

        {/* FORMULARIO */}
        <div className="w-full max-w-md lg:max-w-lg mx-auto"> 
          
          {isSubmitted ? (
            // ESTADO DE ÉXITO
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white/95 backdrop-blur-xl border-4 border-[#FF6700] rounded-3xl p-6 md:p-10 text-center shadow-2xl"
            >
              <div className="mb-6 flex justify-center">
                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                  <PartyPopper className="w-12 h-12 text-white" />
                </div>
              </div>
              
              <h3 className="text-3xl md:text-4xl font-serif text-[#FF6700] mb-3 font-black">
                ¡Gracias!
              </h3>
              <p className="text-zinc-700 mb-8 text-base md:text-lg font-medium">
                Hemos registrado tu respuesta correctamente.
              </p>
              
              <Button 
                onClick={handleReset}
                variant="primary"
                className="text-base md:text-lg"
              >
                Volver al Inicio
              </Button>
            </motion.div>
          ) : (
            // FORMULARIO - FONDO MÁS OSCURO
            <motion.form
              onSubmit={handleSubmit}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-gradient-to-br from-[#0d1f16]/98 to-[#08150e]/98 backdrop-blur-2xl border-4 border-[#FF6700] rounded-3xl p-5 md:p-8 lg:p-10 shadow-2xl relative overflow-hidden"
            >
              {/* Decoración superior brillante */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#FF6700] via-[#ff8533] to-[#FF6700]" />
              
              {/* Brillo interno */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF6700]/8 via-transparent to-transparent pointer-events-none" />

              {/* DATOS PERSONALES */}
              <div className="space-y-4 md:space-y-5 mb-6 md:mb-8 relative z-10">
                <div>
                  <Label>Nombre del Apoderado</Label>
                  <Input 
                    placeholder="Ej: Juan Pérez" 
                    value={formData.nombre_padre}
                    onChange={(e) => handleInputChange('nombre_padre', e.target.value)}
                    className={formErrors.nombre_padre ? 'border-red-500 ring-4 ring-red-500/30' : ''}
                  />
                </div>
                
                <div>
                  <Label>Nombre del Alumno/a</Label>
                  <Input 
                    placeholder="Ej: Sofía Pérez"
                    value={formData.nombre_alumno}
                    onChange={(e) => handleInputChange('nombre_alumno', e.target.value)}
                    className={formErrors.nombre_alumno ? 'border-red-500 ring-4 ring-red-500/30' : ''}
                  />
                </div>

                <div>
                  <Label>Correo Electrónico</Label>
                  <Input 
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={formErrors.email ? 'border-red-500 ring-4 ring-red-500/30' : ''}
                  />
                </div>
              </div>

              {/* ASISTENCIA */}
              <div className="mb-6 md:mb-8 relative z-10">
                <Label className="text-center block mb-4 md:mb-5 text-sm md:text-base">
                  ¿Asistirán al evento?
                </Label>
                
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {/* SÍ ASISTIRÉ */}
                  <button
                    type="button"
                    onClick={() => handleAttendance('confirmado')}
                    className={`relative p-4 md:p-5 rounded-2xl border-4 flex flex-col items-center justify-center gap-2 md:gap-3 transition-all duration-200 font-bold ${
                      formData.asistencia === 'confirmado'
                        ? 'border-green-500 bg-green-500/30 text-white shadow-[0_0_30px_rgba(34,197,94,0.5)] scale-105'
                        : 'border-white/30 bg-white/10 text-white/70 hover:border-green-400 hover:bg-green-500/20 hover:text-white'
                    }`}
                  >
                    <CalendarHeart className="w-8 h-8 md:w-10 md:h-10" />
                    <span className="text-[10px] md:text-xs uppercase tracking-wider">
                      ¡Sí, vamos!
                    </span>
                  </button>

                  {/* NO ASISTIRÉ */}
                  <button
                    type="button"
                    onClick={() => handleAttendance('no_asistire')}
                    className={`relative p-4 md:p-5 rounded-2xl border-4 flex flex-col items-center justify-center gap-2 md:gap-3 transition-all duration-200 font-bold ${
                      formData.asistencia === 'no_asistire'
                        ? 'border-red-500 bg-red-500/30 text-white shadow-[0_0_30px_rgba(239,68,68,0.5)] scale-105'
                        : 'border-white/30 bg-white/10 text-white/70 hover:border-red-400 hover:bg-red-500/20 hover:text-white'
                    }`}
                  >
                    <XCircle className="w-8 h-8 md:w-10 md:h-10" />
                    <span className="text-[10px] md:text-xs uppercase tracking-wider">
                      No podré
                    </span>
                  </button>
                </div>
                
                {formErrors.asistencia && (
                  <p className="text-red-300 text-xs md:text-sm text-center mt-3 md:mt-4 bg-red-500/20 py-2 md:py-2.5 rounded-xl font-bold border-2 border-red-500">
                    ⚠️ Selecciona una opción
                  </p>
                )}
              </div>

              {/* CONTENIDO CONDICIONAL */}
              <AnimatePresence mode="wait">
                {/* NO ASISTIRÉ */}
                {formData.asistencia === 'no_asistire' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden mb-6 md:mb-8 relative z-10"
                  >
                    <div className="bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-2xl p-5 md:p-6 text-center">
                      <p className="text-white text-sm md:text-base leading-relaxed">
                        ¡Qué pena! Los extrañaremos.
                        <span className="text-[#FF6700] font-black block mt-2 text-lg md:text-xl drop-shadow-lg">
                          ¡Feliz Navidad! 🎄
                        </span>
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* SÍ ASISTIRÉ */}
                {formData.asistencia === 'confirmado' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden mb-6 md:mb-8 relative z-10"
                  >
                    {/* Info del intercambio */}
                    <div className="bg-[#FF6700]/20 border-l-4 border-[#FF6700] pl-4 pr-3 py-4 mb-5 rounded-r-xl backdrop-blur-sm">
                      <h4 className="text-[#FF6700] font-extrabold text-xs md:text-sm uppercase flex items-center gap-2 mb-1.5">
                        <Gift className="w-4 h-4 md:w-5 md:h-5" /> Intercambio de Regalos
                      </h4>
                      <p className="text-white text-xs md:text-sm leading-relaxed">
                        Ayuda al "Amigo Secreto" con ideas.{' '}
                        <span className="text-white font-black">Valor mínimo: S/ 40</span>
                      </p>
                    </div>

                    {/* Lista de deseos */}
                    <div className="space-y-3 md:space-y-4">
                      {[1, 2, 3].map((num) => (
                        <div key={num}>
                          <label className="text-white text-sm md:text-base font-bold mb-2.5 block uppercase tracking-wide">
                            Opción #{num}
                          </label>
                          <Input
                            placeholder={`Idea de regalo...`}
                            value={formData[`deseo_${num}`]}
                            onChange={(e) => handleInputChange(`deseo_${num}`, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* BOTÓN SUBMIT - MUY NOTORIO */}
              <Button 
                type="submit"
                disabled={isSubmitting}
                variant="primary"
                className="uppercase tracking-widest text-base md:text-lg lg:text-xl relative z-10 transform hover:scale-[1.03] py-5 md:py-6 shadow-[0_0_40px_rgba(255,103,0,0.6)] hover:shadow-[0_0_50px_rgba(255,103,0,0.8)]"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2 md:gap-3">
                    ENVIANDO... <Loader2 className="w-6 h-6 md:w-7 md:h-7 animate-spin"/>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2 md:gap-3">
                    ENVIAR RESPUESTA <Send className="w-6 h-6 md:w-7 md:h-7" />
                  </span>
                )}
              </Button>

            </motion.form>
          )}
        </div>

      </main>

      {/* FOOTER */}
      <div className="relative z-20">
        <FooterMain />
      </div>

    </div>
  );
}

export default RegistroActividadNavidadPage;
