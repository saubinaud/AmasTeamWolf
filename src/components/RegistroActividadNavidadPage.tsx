import React, { useState, useEffect, useRef } from 'react';
import { toast, Toaster } from 'sonner';
import { 
  Gift, CheckCircle, PartyPopper, 
  XCircle, CalendarHeart, Frown, Send, Loader2, User, Sparkles, Mail 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- COMPONENTES UI LOCALES ---

const Label = ({ children, className = "" }) => (
  <label className={`block text-[#FF6700] text-xs font-extrabold mb-2 uppercase tracking-widest ${className}`}>
    {children}
  </label>
);

const Input = ({ className = "", ...props }) => (
  <input 
    className={`w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6700] focus:ring-1 focus:ring-[#FF6700] transition-all text-base shadow-sm ${className}`}
    {...props}
  />
);

const Button = ({ children, className = "", disabled, onClick, ...props }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`active:scale-95 transition-transform ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    {...props}
  >
    {children}
  </button>
);

// --- PÁGINA PRINCIPAL ---

function RegistroActividadNavidadPage() {
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
    // Scroll inicial como en tu código original
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
      // --- TU WEBHOOK ORIGINAL ---
      const response = await fetch('https://pallium-n8n.s6hx3x.easypanel.host/webhook/asistencia-evento-navidad', {
         method: 'POST',
         headers: { 
           'Content-Type': 'application/json',
         },
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
    <div ref={topRef} className="min-h-screen relative flex flex-col font-sans selection:bg-[#FF6700] selection:text-black bg-black text-white overflow-x-hidden">
      <Toaster position="top-center" richColors />
      
      {/* --- FONDO CLARO --- */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#051a0d]">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            // --- TU IMAGEN ORIGINAL ---
            backgroundImage: `url('https://res.cloudinary.com/dkoocok3j/image/upload/v1764452535/Green_Red_Festive_Christmas_Card_w0ox9n.png')`,
            opacity: 1 
          }} 
        />
        {/* Capa sutil para asegurar legibilidad del texto sin oscurecer demasiado tu imagen */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 pt-24 pb-20 relative z-10 w-full">
        
        {/* TITULAR */}
        <div className="text-center mb-10 w-full max-w-4xl mx-auto relative z-20">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 mb-4 bg-black/80 px-5 py-2 rounded-full border border-[#FF6700] shadow-lg">
              <span className="text-xl">🎅</span>
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#FF6700]">Evento Fin de Año</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-serif text-white mb-4 leading-tight drop-shadow-[0_4px_4px_rgba(0,0,0,0.9)]">
              Gran Clausura <br />
              <span className="text-[#FF6700] font-black drop-shadow-md" style={{ textShadow: '2px 2px 0px #000' }}>Navideña</span>
            </h1>
            
            <p className="text-white text-lg md:text-xl font-medium max-w-lg mx-auto leading-relaxed px-4 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
              Regístrate para la gran actividad navideña, no te la pierdas. Los esperamos a todos.
            </p>
          </motion.div>
        </div>

        {/* --- FORMULARIO --- */}
        <div className="w-full max-w-lg relative z-20 mb-10"> 
          
          {isSubmitted ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-black/90 border-2 border-[#FF6700] rounded-3xl p-8 text-center shadow-2xl backdrop-blur-md"
            >
              <div className="mb-6 flex justify-center">
                <div className="w-24 h-24 bg-[#165b33] rounded-full flex items-center justify-center shadow-[0_0_30px_#165b33] animate-bounce text-white">
                  <PartyPopper className="w-12 h-12" />
                </div>
              </div>
              <h3 className="text-3xl font-serif text-[#FF6700] mb-3">¡Gracias!</h3>
              <p className="text-gray-300 mb-8 text-lg">Hemos registrado tu respuesta correctamente.</p>
              
              <Button 
                onClick={handleReset}
                className="w-full bg-[#FF6700] hover:bg-[#e55c00] text-black font-bold py-4 rounded-xl shadow-lg"
              >
                Volver al Inicio
              </Button>
            </motion.div>
          ) : (
            <motion.form
              onSubmit={handleSubmit}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              // Borde Naranja Forzado (border-2 border-[#FF6700])
              className="bg-black/85 backdrop-blur-xl border-2 border-[#FF6700] rounded-[2rem] p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden"
            >
              {/* Cinta decorativa */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-[#FF6700] to-transparent" />

              {/* 1. DATOS PERSONALES */}
              <div className="space-y-6 mb-8 mt-4">
                <div>
                  <Label>Nombre del Apoderado</Label>
                  <div className="relative">
                    {/* Ícono dentro del input */}
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FF6700] z-10 pointer-events-none" />
                    <Input 
                      placeholder="Ej: Juan Pérez" 
                      value={formData.nombre_padre}
                      onChange={(e) => handleInputChange('nombre_padre', e.target.value)}
                      className={formErrors.nombre_padre ? 'border-red-500' : ''}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Nombre del Alumno/a</Label>
                  <div className="relative">
                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FF6700] z-10 pointer-events-none" />
                    <Input 
                      placeholder="Ej: Sofía Pérez"
                      value={formData.nombre_alumno}
                      onChange={(e) => handleInputChange('nombre_alumno', e.target.value)}
                      className={formErrors.nombre_alumno ? 'border-red-500' : ''}
                    />
                  </div>
                </div>

                <div>
                  <Label>Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FF6700] z-10 pointer-events-none" />
                    <Input 
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={formErrors.email ? 'border-red-500' : ''}
                    />
                  </div>
                </div>
              </div>

              {/* 2. ASISTENCIA */}
              <div className="mb-10">
                <Label className="text-center block text-sm mb-6 text-white font-bold tracking-widest uppercase">¿Asistirán al evento?</Label>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleAttendance('confirmado')}
                    className={`relative p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 group ${
                      formData.asistencia === 'confirmado'
                        ? 'border-green-500 bg-green-900/40 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]'
                        : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-green-500 hover:text-green-400'
                    }`}
                  >
                    <CalendarHeart className="w-8 h-8" />
                    <span className="font-bold text-xs uppercase tracking-widest">
                      ¡SÍ, VAMOS!
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAttendance('no_asistire')}
                    className={`relative p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 group ${
                      formData.asistencia === 'no_asistire'
                        ? 'border-red-600 bg-red-900/40 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]'
                        : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-red-500 hover:text-red-400'
                    }`}
                  >
                    <XCircle className="w-8 h-8" />
                    <span className="font-bold text-xs uppercase tracking-widest">
                      NO PODRÉ
                    </span>
                  </button>
                </div>
                
                {formErrors.asistencia && (
                  <p className="text-red-400 text-xs text-center mt-3 font-bold bg-red-500/10 py-1 rounded">⚠️ Selecciona una opción</p>
                )}
              </div>

              {/* LÓGICA CONDICIONAL */}
              <AnimatePresence mode="wait">
                {formData.asistencia === 'no_asistire' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 text-center mb-8">
                      <p className="text-zinc-300 text-sm">
                        ¡Qué pena! Los extrañaremos. <br/>
                        <span className="text-[#FF6700] font-bold block mt-2">¡Feliz Navidad! 🎄</span>
                      </p>
                    </div>
                  </motion.div>
                )}

                {formData.asistencia === 'confirmado' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-[#FF6700]/10 border-l-4 border-[#FF6700] pl-4 py-3 mb-6 rounded-r-lg">
                      <h4 className="text-[#FF6700] font-bold text-xs uppercase flex items-center gap-2 mb-1">
                        <Gift className="w-3 h-3" /> Misión Intercambio
                      </h4>
                      <p className="text-white/80 text-xs">
                        Ayuda al "Amigo Secreto". <span className="text-white font-bold">Mínimo S/ 40.</span>
                      </p>
                    </div>

                    <div className="space-y-4 mb-8">
                      {[1, 2, 3].map((num) => (
                        <div key={num} className="relative w-full">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF6700] text-xs font-bold z-10">#{num}</span>
                          <Input
                            placeholder={`Opción de regalo...`}
                            value={formData[`deseo_${num}`]}
                            onChange={(e) => handleInputChange(`deseo_${num}`, e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* BOTÓN SUBMIT - NARANJA SÓLIDO (bg-[#FF6700]) */}
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#FF6700] hover:bg-[#e55c00] text-black font-black text-lg py-5 rounded-xl shadow-lg shadow-orange-500/30 uppercase tracking-[0.2em] relative overflow-hidden group active:scale-[0.98] transition-all mt-4 border-b-4 border-[#cc5200] active:border-b-0 active:translate-y-1"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>Enviando... <Loader2 className="w-5 h-5 animate-spin"/></>
                  ) : (
                    <>ENVIAR RESPUESTA <Send className="w-5 h-5" /></>
                  )}
                </span>
              </Button>

            </motion.form>
          )}
        </div>
      </main>

    </div>
  );
}

// 2. Exportación POR DEFECTO
export default RegistroActividadNavidadPage;
