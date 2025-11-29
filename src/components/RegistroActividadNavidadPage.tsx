import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'sonner';
import { 
  Gift, 
  CheckCircle, 
  Mail, 
  User, 
  Sparkles, 
  PartyPopper, 
  XCircle, 
  CalendarHeart, 
  Frown,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- INTERFACES TYPESCRIPT ---
interface FormData {
  nombre_padre: string;
  nombre_alumno: string;
  email: string;
  asistencia: 'confirmado' | 'no_asistire' | '';
  deseo_1: string;
  deseo_2: string;
  deseo_3: string;
  [key: string]: string;
}

interface FormErrors {
  nombre_padre?: string;
  nombre_alumno?: string;
  email?: string;
  asistencia?: string;
  deseos?: string;
  [key: string]: string | undefined;
}

// --- COMPONENTES UI ---

const Label = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <label className={`block text-[#d4af37] text-sm font-bold mb-1 uppercase tracking-wider ${className}`}>
    {children}
  </label>
);

const Input = ({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    className={`w-full bg-white/10 border border-[#d4af37]/30 rounded-xl px-4 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all text-base ${className}`}
    {...props}
  />
);

const Button = ({ children, className = "", disabled, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`active:scale-95 transition-transform ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    {...props}
  >
    {children}
  </button>
);

// --- PÁGINA PRINCIPAL (LANDING) ---

export default function RegistroActividadNavidadPage() {
  const [formData, setFormData] = useState<FormData>({
    nombre_padre: '',
    nombre_alumno: '',
    email: '',
    asistencia: '', 
    deseo_1: '',
    deseo_2: '',
    deseo_3: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleAttendance = (value: 'confirmado' | 'no_asistire') => {
    setFormData(prev => ({ ...prev, asistencia: value }));
    if (formErrors.asistencia) setFormErrors(prev => ({ ...prev, asistencia: '' }));
  };

  const validateForm = () => {
    const errors: FormErrors = {};
    if (!formData.nombre_padre.trim()) errors.nombre_padre = 'Requerido';
    if (!formData.nombre_alumno.trim()) errors.nombre_alumno = 'Requerido';
    if (!formData.email.trim() || !validateEmail(formData.email)) errors.email = 'Email inválido';
    if (!formData.asistencia) errors.asistencia = 'Selecciona una opción';
    
    // Solo validamos deseos si confirma asistencia
    if (formData.asistencia === 'confirmado' && (!formData.deseo_1 && !formData.deseo_2 && !formData.deseo_3)) {
      errors.deseos = 'Escribe al menos un deseo';
      toast.error('🎅 ¡Santa necesita ayuda! Escribe al menos un deseo.', { position: 'top-center' });
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Por favor completa los campos requeridos', { position: 'top-center' });
      return;
    }

    setIsSubmitting(true);

    try {
      // --- ENVÍO DE DATOS AL WEBHOOK REAL ---
      const response = await fetch('https://pallium-n8n.s6hx3x.easypanel.host/webhook/asistencia-evento-navidad', {
         method: 'POST',
         headers: { 
           'Content-Type': 'application/json',
           // 'Accept': 'application/json' // Opcional, ayuda a veces con ciertos servidores
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Intentamos leer el error si el servidor devuelve algo
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
    <div className="min-h-screen relative overflow-x-hidden font-sans selection:bg-[#d4af37] selection:text-black bg-[#021a0a] text-white">
      <Toaster position="top-center" richColors />
      
      {/* Estilos CSS para la nieve */}
      <style>{`
        @keyframes snowfall {
          0% { transform: translateY(-10vh) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(110vh) translateX(20px); opacity: 0.3; }
        }
        .snowflake {
          position: absolute;
          top: -10vh;
          color: #fff;
          pointer-events: none;
          animation: snowfall linear infinite;
          text-shadow: 0 0 5px rgba(255,255,255,0.8);
          z-index: 1;
        }
      `}</style>

      {/* --- FONDO --- */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url('https://res.cloudinary.com/dkoocok3j/image/upload/v1764452535/Green_Red_Festive_Christmas_Card_w0ox9n.png')`,
            opacity: 0.5 
          }} 
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
        
        {/* Nieve decorativa */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="snowflake"
            style={{
              left: `${Math.random() * 100}vw`,
              animationDuration: `${Math.random() * 10 + 10}s`,
              animationDelay: `${Math.random() * 10}s`,
              fontSize: `${Math.random() * 10 + 10}px`,
              opacity: Math.random() * 0.5 + 0.3
            }}
          >
            ❄
          </div>
        ))}
      </div>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="relative z-10 flex flex-col items-center justify-center px-4 py-8 md:py-12 min-h-screen pb-40">
        
        {/* TITULAR */}
        <div className="text-center mb-6 md:mb-8 max-w-2xl mx-auto mt-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block mb-3">
              <span className="px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-gradient-to-r from-red-700 to-red-900 border border-red-500 text-white text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                🎅 Evento Fin de Año
              </span>
            </div>
            <h1 className="text-3xl md:text-6xl font-extrabold text-white mb-3 leading-tight drop-shadow-2xl font-serif">
              Gran Clausura <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#FFD700] to-[#B8860B]">Navideña AMAS</span>
            </h1>
            
            <p className="text-white/90 text-sm md:text-lg font-medium max-w-md mx-auto leading-relaxed drop-shadow-md px-2">
              Regístrate para la gran actividad navideña, no te la pierdas. Los esperamos a todos.
            </p>
          </motion.div>
        </div>

        {/* --- FORMULARIO --- */}
        <div className="w-full max-w-lg relative"> 
          
          {isSubmitted ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#fffbf0] border-4 border-[#d4af37] rounded-3xl p-6 md:p-8 text-center shadow-2xl text-[#1a0505]"
            >
              <div className="mb-6 flex justify-center">
                {formData.asistencia === 'confirmado' ? (
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-[#165b33] rounded-full flex items-center justify-center shadow-lg animate-bounce text-white">
                    <PartyPopper className="w-10 h-10 md:w-12 md:h-12" />
                  </div>
                ) : (
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-200 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-gray-500" />
                  </div>
                )}
              </div>
              <h3 className="text-xl md:text-2xl font-serif font-bold mb-2">¡Gracias por responder!</h3>
              <p className="text-gray-600 mb-6 text-sm md:text-base">Hemos registrado tu respuesta correctamente.</p>
              
              <Button 
                onClick={() => window.location.reload()}
                className="w-full bg-[#d4af37] hover:bg-amber-500 text-black font-bold py-4 rounded-xl shadow-lg touch-manipulation"
              >
                Volver al Inicio
              </Button>
            </motion.div>
          ) : (
            <motion.form
              onSubmit={handleSubmit}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-black/60 backdrop-blur-md border border-[#d4af37]/50 rounded-3xl p-5 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
              {/* Decoración Dorada */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

              {/* 1. DATOS PERSONALES */}
              <div className="space-y-4 md:space-y-5 mb-6 md:mb-8">
                <div>
                  <Label>Nombre del Apoderado <User className="inline w-4 h-4 ml-1"/></Label>
                  <Input 
                    placeholder="Ej: Juan Pérez" 
                    value={formData.nombre_padre}
                    onChange={(e) => handleInputChange('nombre_padre', e.target.value)}
                    className={formErrors.nombre_padre ? 'border-red-500 bg-red-500/10' : ''}
                  />
                  {formErrors.nombre_padre && <span className="text-red-400 text-xs mt-1 block">Requerido</span>}
                </div>
                
                <div>
                  <Label>Nombre del Alumno/a <Sparkles className="inline w-4 h-4 ml-1"/></Label>
                  <Input 
                    placeholder="Ej: Sofía Pérez"
                    value={formData.nombre_alumno}
                    onChange={(e) => handleInputChange('nombre_alumno', e.target.value)}
                    className={formErrors.nombre_alumno ? 'border-red-500 bg-red-500/10' : ''}
                  />
                  {formErrors.nombre_alumno && <span className="text-red-400 text-xs mt-1 block">Requerido</span>}
                </div>

                <div>
                  <Label>Correo Electrónico <Mail className="inline w-4 h-4 ml-1"/></Label>
                  <Input 
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={formErrors.email ? 'border-red-500 bg-red-500/10' : ''}
                  />
                  {formErrors.email && <span className="text-red-400 text-xs mt-1 block">Email inválido</span>}
                </div>
              </div>

              {/* 2. ASISTENCIA */}
              <div className="mb-6">
                <Label className="text-center block text-lg mb-4 text-white">¿Asistirán al evento?</Label>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <button
                    type="button"
                    onClick={() => handleAttendance('confirmado')}
                    className={`p-4 md:p-5 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all duration-200 touch-manipulation ${
                      formData.asistencia === 'confirmado'
                        ? 'bg-[#d4af37] border-[#d4af37] text-black shadow-[0_0_20px_rgba(212,175,55,0.4)] scale-[1.02]'
                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:border-[#d4af37]/50 hover:text-white'
                    }`}
                  >
                    <CalendarHeart className="w-8 h-8 md:w-9 md:h-9" />
                    <span className="font-bold text-xs md:text-sm uppercase">¡Sí, Vamos!</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAttendance('no_asistire')}
                    className={`p-4 md:p-5 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all duration-200 touch-manipulation ${
                      formData.asistencia === 'no_asistire'
                        ? 'bg-red-900/80 border-red-500 text-white shadow-lg scale-[1.02]'
                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:border-red-400/50 hover:text-white'
                    }`}
                  >
                    <XCircle className="w-8 h-8 md:w-9 md:h-9" />
                    <span className="font-bold text-xs md:text-sm uppercase">No podré</span>
                  </button>
                </div>
                {formErrors.asistencia && <p className="text-red-400 text-xs text-center mt-2 font-medium">⚠️ Selecciona una opción</p>}
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
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center mb-6">
                      <div className="flex justify-center mb-2">
                        <Frown className="w-8 h-8 text-amber-400" />
                      </div>
                      <p className="text-white/80 text-sm leading-relaxed">
                        ¡Qué pena! Los extrañaremos mucho. <br/>
                        <span className="text-[#d4af37] font-medium block mt-2">¡Feliz Navidad! 🎄</span>
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
                    <div className="bg-[#d4af37]/10 border-l-4 border-[#d4af37] p-4 rounded-r-lg mb-4">
                      <h4 className="text-[#d4af37] font-bold text-sm uppercase flex items-center gap-2 mb-1">
                        <Gift className="w-4 h-4" /> Misión Intercambio
                      </h4>
                      <p className="text-white/70 text-xs leading-snug">
                        Ayuda al "Amigo Secreto" con 3 opciones. <br/><span className="text-white font-bold">Ref. mínima: S/ 40.</span>
                      </p>
                    </div>

                    <div className="space-y-3 mb-6">
                      {[1, 2, 3].map((num) => (
                        <Input
                          key={num}
                          placeholder={`Opción de regalo #${num}...`}
                          value={formData[`deseo_${num}`]}
                          onChange={(e) => handleInputChange(`deseo_${num}`, e.target.value)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* BOTÓN SUBMIT */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#d4af37] to-[#b4941f] hover:brightness-110 text-black font-black text-lg py-5 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.3)] uppercase tracking-widest relative overflow-hidden group touch-manipulation"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    'Enviando...' 
                  ) : (
                    <>ENVIAR RESPUESTA <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </span>
              </Button>

            </motion.form>
          )}
        </div>
      </main>

      {/* --- LOBO ANIMADO --- */}
      <motion.div
        initial={{ y: 200 }}
        animate={{ y: [200, 0, 0, 0, 200] }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatDelay: 5,
          times: [0, 0.1, 0.8, 0.9, 1]
        }}
        // pointer-events-none: Esencial para que el lobo no bloquee clicks en el móvil
        className="fixed bottom-0 right-[-10px] md:right-10 z-50 w-36 md:w-56 pointer-events-none filter drop-shadow-2xl"
      >
        <img
          src="https://res.cloudinary.com/dkoocok3j/image/upload/v1764451372/lobo_sin_fondo_navidad_Mesa_de_trabajo_1_copia_5_r4cl8x.png"
          alt="Lobo Santa"
          className="w-full h-auto"
        />
      </motion.div>

    </div>
  );
}
