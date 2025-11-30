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
  <label className={`block text-gray-100 text-sm md:text-base font-medium mb-2.5 tracking-wide ${className}`}>
    {children}
  </label>
);

const Input = ({ className = "", ...props }) => (
  <input 
    className={`w-full bg-black/20 border-2 border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#FF6700] focus:ring-2 focus:ring-[#FF6700]/30 transition-all text-base font-medium ${className}`}
    {...props}
  />
);

const Button = ({ children, className = "", disabled, onClick, variant = "primary", ...props }) => {
  // Nota: Este componente se usa para el botón "Volver al Inicio" en el mensaje de éxito.
  // El botón principal del formulario tiene estilos específicos inline para el efecto de brillo.
  const variants = {
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
      
      {/* FONDO - ZOOM OUT PARA VER MÁS IMAGEN */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* FONDO MÓVIL */}
        <div 
          className="absolute inset-0 block md:hidden"
          style={{ 
            backgroundImage: `url('https://res.cloudinary.com/dkoocok3j/image/upload/v1764494534/4_guugpt.png')`,
            backgroundSize: '120% auto',
            backgroundPosition: 'top center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.85
          }} 
        />
        
        {/* FONDO DESKTOP */}
        <div 
          className="absolute inset-0 hidden md:block"
          style={{ 
            backgroundImage: `url('https://res.cloudinary.com/dkoocok3j/image/upload/v1764494534/3_dat4ln.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.85
          }} 
        />
        
        {/* Gradiente para crear más profundidad */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a2818]/40 via-transparent to-[#0a2818]/60" />
      </div>

      {/* HEADER */}
      <div className="relative z-20">
        <HeaderMain />
      </div>
      
      {/* CONTENIDO - CON MÁS MARGEN SUPERIOR PARA EVITAR SOLAPAMIENTO */}
      <main className="flex-grow flex flex-col items-center justify-center px-5 pt-24 pb-8 md:px-6 md:pt-32 md:pb-12 lg:pt-40 lg:pb-16 relative z-10 w-full max-w-7xl mx-auto">
        
        {/* HEADER DE PÁGINA (TÍTULO) */}
        <div className="text-center mb-8 md:mb-10 w-full max-w-2xl mx-auto mt-4 md:mt-0">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-3 md:space-y-4"
          >
            {/* Título */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-white leading-tight px-4">
              Gran Clausura
              <br />
              <span className="text-[#FF6700] font-black drop-shadow-[0_4px_15px_rgba(255,103,0,1)]">
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

        {/* CONTENEDOR DEL FORMULARIO */}
        <div className="w-full max-w-md lg:max-w-lg mx-auto px-2"> 
          
          {isSubmitted ? (
            // --- ESTADO DE ÉXITO ---
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
            // --- FORMULARIO DE REGISTRO ---
            <motion.form
              onSubmit={handleSubmit}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-[#0a1510]/98 backdrop-blur-2xl border-4 border-[#FF6700] rounded-3xl p-6 md:p-8 lg:p-10 shadow-[0_20px_80px_rgba(0,0,0,0.9)] relative overflow-hidden"
            >
              {/* Decoración superior brillante */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#FF6700] via-[#ff8533] to-[#FF6700] shadow-[0_0_20px_rgba(255,103,0,0.8)]" />
              
              {/* Brillo interno sutil */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF6700]/5 via-transparent to-transparent pointer-events-none" />
   
              {/* DATOS PERSONALES */}
              <div className="space-y-6 md:space-y-7 mb-8 md:mb-10 relative z-10">
                
                {/* Nombre Apoderado */}
                <div className="space-y-2">
                  <Label className="text-gray-100 font-medium text-sm md:text-base ml-1 bg-transparent block">
                    Nombre del Apoderado
                  </Label>
                  <Input 
                    placeholder="Ej: Juan Pérez" 
                    value={formData.nombre_padre}
                    onChange={(e) => handleInputChange('nombre_padre', e.target.value)}
                    className={`bg-black/20 border-white/20 text-white placeholder:text-gray-500 focus:border-[#FF6700] focus:ring-[#FF6700]/50 h-12 rounded-xl ${
                      formErrors.nombre_padre ? 'border-red-500 ring-2 ring-red-500/20' : ''
                    }`}
                  />
                </div>
                
                {/* Nombre Alumno */}
                <div className="space-y-2">
                  <Label className="text-gray-100 font-medium text-sm md:text-base ml-1 bg-transparent block">
                    Nombre del Alumno/a
                  </Label>
                  <Input 
                    placeholder="Ej: Sofía Pérez"
                    value={formData.nombre_alumno}
                    onChange={(e) => handleInputChange('nombre_alumno', e.target.value)}
                    className={`bg-black/20 border-white/20 text-white placeholder:text-gray-500 focus:border-[#FF6700] focus:ring-[#FF6700]/50 h-12 rounded-xl ${
                      formErrors.nombre_alumno ? 'border-red-500 ring-2 ring-red-500/20' : ''
                    }`}
                  />
                </div>
   
                {/* Correo */}
                <div className="space-y-2">
                  <Label className="text-gray-100 font-medium text-sm md:text-base ml-1 bg-transparent block">
                    Correo Electrónico
                  </Label>
                  <Input 
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`bg-black/20 border-white/20 text-white placeholder:text-gray-500 focus:border-[#FF6700] focus:ring-[#FF6700]/50 h-12 rounded-xl ${
                      formErrors.email ? 'border-red-500 ring-2 ring-red-500/20' : ''
                    }`}
                  />
                </div>
              </div>
   
              {/* ASISTENCIA */}
              <div className="mb-8 md:mb-10 relative z-10 border-t border-white/10 pt-8">
                <Label className="text-center block mb-6 md:mb-7 text-white text-lg font-serif tracking-wide bg-transparent">
                  ¿Asistirán al evento?
                </Label>
                
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                  {/* SÍ ASISTIRÉ */}
                  <button
                    type="button"
                    onClick={() => handleAttendance('confirmado')}
                    className={`relative p-5 md:p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300 group ${
                      formData.asistencia === 'confirmado'
                        ? 'border-[#FF6700] bg-[#FF6700]/20 text-white shadow-[0_0_20px_rgba(255,103,0,0.4)] scale-[1.02]'
                        : 'border-white/20 bg-white/5 text-gray-300 hover:border-[#FF6700]/50 hover:bg-[#FF6700]/10 hover:text-white'
                    }`}
                  >
                    <CalendarHeart className={`w-8 h-8 md:w-10 md:h-10 transition-colors ${
                       formData.asistencia === 'confirmado' ? 'text-[#FF6700]' : 'text-gray-400 group-hover:text-[#FF6700]'
                    }`} />
                    <span className="text-xs md:text-sm uppercase font-bold tracking-wider">
                      ¡Sí, vamos!
                    </span>
                  </button>
   
                  {/* NO ASISTIRÉ */}
                  <button
                    type="button"
                    onClick={() => handleAttendance('no_asistire')}
                    className={`relative p-5 md:p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300 group ${
                      formData.asistencia === 'no_asistire'
                        ? 'border-red-500 bg-red-500/20 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] scale-[1.02]'
                        : 'border-white/20 bg-white/5 text-gray-300 hover:border-red-400/50 hover:bg-red-500/10 hover:text-white'
                    }`}
                  >
                    <XCircle className={`w-8 h-8 md:w-10 md:h-10 transition-colors ${
                       formData.asistencia === 'no_asistire' ? 'text-red-500' : 'text-gray-400 group-hover:text-red-400'
                    }`} />
                    <span className="text-xs md:text-sm uppercase font-bold tracking-wider">
                      No podré
                    </span>
                  </button>
                </div>
                
                {formErrors.asistencia && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-300 text-xs md:text-sm text-center mt-5 bg-red-500/10 py-2 rounded-lg border border-red-500/30"
                  >
                    ⚠️ Por favor selecciona una opción
                  </motion.p>
                )}
              </div>
   
              {/* CONTENIDO CONDICIONAL (Inputs o Mensaje despedida) */}
              <AnimatePresence mode="wait">
                {/* NO ASISTIRÉ - TEXTO NUEVO */}
                {formData.asistencia === 'no_asistire' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden relative z-10"
                  >
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 text-center mx-1">
                      <p className="text-gray-200 text-sm md:text-base leading-relaxed font-light">
                        ¡Qué pena que no puedan asistir! Nos hubiera encantado verlos ahí.
                        <span className="text-[#FF6700] font-bold block mt-3 text-lg md:text-xl drop-shadow-md font-serif">
                          ¡Feliz Navidad! 🎄
                        </span>
                      </p>
                    </div>
                  </motion.div>
                )}
   
                {/* SÍ ASISTIRÉ */}
                {formData.asistencia === 'confirmado' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden relative z-10"
                  >
                    {/* Info del intercambio */}
                    <div className="bg-gradient-to-r from-[#FF6700]/20 to-[#FF6700]/5 border-l-4 border-[#FF6700] p-5 mb-6 rounded-r-xl backdrop-blur-sm">
                      <h4 className="text-[#FF6700] font-bold text-sm md:text-base uppercase flex items-center gap-2 mb-2">
                        <Gift className="w-5 h-5" /> Intercambio de Regalos
                      </h4>
                      <p className="text-gray-200 text-sm leading-relaxed">
                        Ayuda al "Amigo Secreto" con ideas.
                        <span className="block mt-1 font-bold text-white">Valor mínimo sugerido: S/ 40</span>
                      </p>
                    </div>
   
                    {/* Lista de deseos */}
                    <div className="space-y-5">
                      {[1, 2, 3].map((num) => (
                        <div key={num} className="space-y-2">
                          <Label className="text-gray-300 text-sm ml-1 bg-transparent">
                            Opción #{num}
                          </Label>
                          <Input
                            placeholder={`Idea de regalo ${num}...`}
                            value={formData[`deseo_${num}`]}
                            onChange={(e) => handleInputChange(`deseo_${num}`, e.target.value)}
                            className="bg-black/20 border-white/20 text-white placeholder:text-gray-500 focus:border-[#FF6700] focus:ring-[#FF6700]/50 h-11 rounded-xl"
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
   
              {/* BOTÓN SUBMIT - DENTRO DEL FORMULARIO Y CORRECTAMENTE ESTRUCTURADO */}
              <div className="mt-8 md:mt-10 relative z-20">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full relative group overflow-hidden rounded-2xl p-[2px] focus:outline-none focus:ring-4 focus:ring-[#FF6700]/50 transition-transform active:scale-95"
                >
                  {/* Borde degradado animado */}
                  <span className="absolute inset-0 bg-gradient-to-r from-[#FF6700] via-[#ffaa00] to-[#FF6700] animate-gradient-xy" />
                  
                  {/* Contenido del botón */}
                  <span className="relative flex items-center justify-center gap-3 bg-[#0a1510] hover:bg-[#0a1510]/90 text-white py-4 md:py-5 px-6 rounded-2xl transition-all duration-200 uppercase tracking-widest font-bold text-base md:text-lg lg:text-xl">
                    {isSubmitting ? (
                      <>
                        ENVIANDO... <Loader2 className="w-6 h-6 md:w-7 md:h-7 animate-spin text-[#FF6700]"/>
                      </>
                    ) : (
                      <>
                        ENVIAR RESPUESTA <Send className="w-6 h-6 md:w-7 md:h-7 text-[#FF6700]" />
                      </>
                    )}
                  </span>
                </button>
              </div>
   
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
