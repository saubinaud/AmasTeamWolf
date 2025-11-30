import React, { useState, useEffect, useRef } from 'react';
import { toast, Toaster } from 'sonner';
import { 
  Gift, PartyPopper, XCircle, CalendarHeart, Send, Loader2, User, Sparkles, Mail 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- COMPONENTES UI ---

const Label = ({ children, className = "" }) => (
  <label className={`block text-[#FF6700] text-[11px] font-bold mb-2 uppercase tracking-wider ${className}`}>
    {children}
  </label>
);

const Input = ({ className = "", icon: Icon, ...props }) => (
  <div className="relative">
    {Icon && (
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FF6700]/70 z-10 pointer-events-none" />
    )}
    <input 
      className={`w-full bg-zinc-900/90 border border-zinc-700/50 rounded-lg ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3.5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6700] focus:ring-2 focus:ring-[#FF6700]/30 transition-all text-sm ${className}`}
      {...props}
    />
  </div>
);

const Button = ({ children, className = "", disabled, onClick, variant = "primary", ...props }) => {
  const variants = {
    primary: "bg-[#FF6700] hover:bg-[#e55c00] text-black font-bold border-b-4 border-[#cc5200] active:border-b-0",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-white font-medium border-b-4 border-zinc-900 active:border-b-0"
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3.5 rounded-lg transition-all active:translate-y-1 ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
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
    <div ref={topRef} className="min-h-screen relative flex flex-col font-sans selection:bg-[#FF6700] selection:text-black bg-black text-white overflow-x-hidden">
      <Toaster position="top-center" richColors />
      
      {/* FONDO */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#051a0d]">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url('https://res.cloudinary.com/dkoocok3j/image/upload/v1764452535/Green_Red_Festive_Christmas_Card_w0ox9n.png')`,
            opacity: 0.4
          }} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
      </div>

      {/* CONTENIDO */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-8 md:py-16 relative z-10 w-full">
        
        {/* HEADER */}
        <div className="text-center mb-8 md:mb-12 w-full max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-full border border-[#FF6700]/30">
              <span className="text-lg">🎅</span>
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#FF6700]">
                Evento Fin de Año
              </span>
            </div>
            
            {/* Título */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif text-white leading-tight px-4">
              Gran Clausura
              <br />
              <span className="text-[#FF6700] font-black" style={{ 
                textShadow: '0 0 20px rgba(255, 103, 0, 0.5), 2px 2px 4px rgba(0,0,0,0.8)' 
              }}>
                Navideña
              </span>
            </h1>
            
            {/* Descripción */}
            <p className="text-white/90 text-sm md:text-base max-w-md mx-auto leading-relaxed px-4">
              Regístrate para la gran actividad navideña. <br className="hidden md:block" />
              <span className="text-[#FF6700] font-semibold">¡Los esperamos a todos!</span>
            </p>
          </motion.div>
        </div>

        {/* FORMULARIO */}
        <div className="w-full max-w-md mx-auto"> 
          
          {isSubmitted ? (
            // ESTADO DE ÉXITO
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-black/90 backdrop-blur-xl border-2 border-[#FF6700] rounded-2xl p-6 md:p-8 text-center shadow-2xl"
            >
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <PartyPopper className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <h3 className="text-2xl md:text-3xl font-serif text-[#FF6700] mb-2">
                ¡Gracias!
              </h3>
              <p className="text-gray-300 mb-6 text-sm md:text-base">
                Hemos registrado tu respuesta correctamente.
              </p>
              
              <Button 
                onClick={handleReset}
                variant="primary"
                className="text-sm md:text-base"
              >
                Volver al Inicio
              </Button>
            </motion.div>
          ) : (
            // FORMULARIO
            <motion.form
              onSubmit={handleSubmit}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-black/85 backdrop-blur-xl border-2 border-[#FF6700]/80 rounded-2xl p-5 md:p-7 shadow-2xl relative overflow-hidden"
            >
              {/* Decoración superior */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FF6700] to-transparent" />

              {/* DATOS PERSONALES */}
              <div className="space-y-4 mb-6">
                <div>
                  <Label>Nombre del Apoderado</Label>
                  <Input 
                    icon={User}
                    placeholder="Ej: Juan Pérez" 
                    value={formData.nombre_padre}
                    onChange={(e) => handleInputChange('nombre_padre', e.target.value)}
                    className={formErrors.nombre_padre ? 'border-red-500 ring-2 ring-red-500/30' : ''}
                  />
                </div>
                
                <div>
                  <Label>Nombre del Alumno/a</Label>
                  <Input 
                    icon={Sparkles}
                    placeholder="Ej: Sofía Pérez"
                    value={formData.nombre_alumno}
                    onChange={(e) => handleInputChange('nombre_alumno', e.target.value)}
                    className={formErrors.nombre_alumno ? 'border-red-500 ring-2 ring-red-500/30' : ''}
                  />
                </div>

                <div>
                  <Label>Correo Electrónico</Label>
                  <Input 
                    icon={Mail}
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={formErrors.email ? 'border-red-500 ring-2 ring-red-500/30' : ''}
                  />
                </div>
              </div>

              {/* ASISTENCIA */}
              <div className="mb-6">
                <Label className="text-center block mb-4">
                  ¿Asistirán al evento?
                </Label>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* SÍ ASISTIRÉ */}
                  <button
                    type="button"
                    onClick={() => handleAttendance('confirmado')}
                    className={`relative p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                      formData.asistencia === 'confirmado'
                        ? 'border-green-500 bg-green-500/20 text-white shadow-lg shadow-green-500/20'
                        : 'border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-green-500/50 hover:text-green-300'
                    }`}
                  >
                    <CalendarHeart className="w-7 h-7" />
                    <span className="font-bold text-[10px] uppercase tracking-wider">
                      ¡Sí, vamos!
                    </span>
                  </button>

                  {/* NO ASISTIRÉ */}
                  <button
                    type="button"
                    onClick={() => handleAttendance('no_asistire')}
                    className={`relative p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                      formData.asistencia === 'no_asistire'
                        ? 'border-red-500 bg-red-500/20 text-white shadow-lg shadow-red-500/20'
                        : 'border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-red-500/50 hover:text-red-300'
                    }`}
                  >
                    <XCircle className="w-7 h-7" />
                    <span className="font-bold text-[10px] uppercase tracking-wider">
                      No podré
                    </span>
                  </button>
                </div>
                
                {formErrors.asistencia && (
                  <p className="text-red-400 text-xs text-center mt-3 bg-red-500/10 py-2 rounded-lg">
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
                    className="overflow-hidden mb-6"
                  >
                    <div className="bg-zinc-900/70 border border-zinc-700/50 rounded-xl p-5 text-center">
                      <p className="text-zinc-300 text-sm leading-relaxed">
                        ¡Qué pena! Los extrañaremos.
                        <span className="text-[#FF6700] font-bold block mt-2 text-base">
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
                    className="overflow-hidden mb-6"
                  >
                    {/* Info del intercambio */}
                    <div className="bg-[#FF6700]/10 border-l-4 border-[#FF6700] pl-4 pr-3 py-3 mb-4 rounded-r-lg">
                      <h4 className="text-[#FF6700] font-bold text-xs uppercase flex items-center gap-2 mb-1">
                        <Gift className="w-3.5 h-3.5" /> Intercambio de Regalos
                      </h4>
                      <p className="text-white/80 text-xs leading-relaxed">
                        Ayuda al "Amigo Secreto" con ideas.{' '}
                        <span className="text-white font-semibold">Valor mínimo: S/ 40</span>
                      </p>
                    </div>

                    {/* Lista de deseos */}
                    <div className="space-y-3">
                      {[1, 2, 3].map((num) => (
                        <div key={num}>
                          <label className="text-zinc-400 text-[10px] font-semibold mb-1.5 block uppercase tracking-wider">
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

              {/* BOTÓN SUBMIT */}
              <Button 
                type="submit"
                disabled={isSubmitting}
                variant="primary"
                className="uppercase tracking-wider text-sm font-extrabold shadow-lg shadow-[#FF6700]/30"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    Enviando... <Loader2 className="w-4 h-4 animate-spin"/>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Enviar Respuesta <Send className="w-4 h-4" />
                  </span>
                )}
              </Button>

            </motion.form>
          )}
        </div>

        {/* Footer minimalista */}
        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-xs">
            🎄 AMAS Team Wolf © 2024
          </p>
        </div>

      </main>
    </div>
  );
}

export default RegistroActividadNavidadPage;
