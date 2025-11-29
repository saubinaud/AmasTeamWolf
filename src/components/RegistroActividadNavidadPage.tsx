import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'sonner';
import { 
  Gift, CheckCircle, PartyPopper, 
  XCircle, CalendarHeart, Frown, Send, Loader2, User, Sparkles, Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- IMPORTS REALES (Funcionarán en tu proyecto local) ---
import { HeaderMain } from './HeaderMain';
import { FooterMain } from './FooterMain';

// --- INTERFACES TYPESCRIPT ---
interface RegistroActividadNavidadPageProps {
  onNavigate: (page: string) => void;
}

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

// --- COMPONENTES UI LOCALES (Estilos personalizados navideños) ---

const Label = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <label className={`block text-[#d4af37] text-xs md:text-sm font-bold mb-2 uppercase tracking-widest ${className}`}>
    {children}
  </label>
);

const Input = ({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    className={`w-full bg-black/40 border border-[#d4af37]/30 rounded-xl px-4 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/50 transition-all text-base backdrop-blur-sm ${className}`}
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

// --- PÁGINA PRINCIPAL ---

export function RegistroActividadNavidadPage({ onNavigate }: RegistroActividadNavidadPageProps) {
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="min-h-screen relative flex flex-col font-sans selection:bg-[#d4af37] selection:text-black bg-[#021a0a] text-white">
      <Toaster position="top-center" richColors />
      
      {/* Estilos CSS Nieve */}
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

      {/* --- FONDO (Capa Base z-0) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url('https://res.cloudinary.com/dkoocok3j/image/upload/v1764452535/Green_Red_Festive_Christmas_Card_w0ox9n.png')`,
            opacity: 0.6 // Aumenté un poco la opacidad para que se vea más el fondo
          }} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80 backdrop-blur-[1px]" />
        
        {/* Nieve */}
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

      {/* --- CONTENEDOR PRINCIPAL (z-10) --- */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* HEADER */}
        <HeaderMain 
          onNavigate={onNavigate}
          onOpenMatricula={() => {}}
          onCartClick={() => {}}
          cartItemsCount={0}
        />

        {/* CONTENIDO SCROLLABLE */}
        <main className="flex-grow flex flex-col items-center justify-start px-4 pt-12 pb-32">
          
          {/* TITULAR (Mejorado con márgenes y tamaño) */}
          <div className="text-center mb-10 max-w-3xl mx-auto mt-8 relative z-20">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-block mb-4">
                <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-red-700 to-red-900 border border-red-500 text-white text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase shadow-[0_0_15px_rgba(220,38,38,0.6)]">
                  🎅 Evento Fin de Año
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight drop-shadow-2xl font-serif">
                Gran Clausura <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#FFD700] to-[#B8860B] drop-shadow-sm">Navideña AMAS</span>
              </h1>
              
              <p className="text-white/80 text-base md:text-xl font-medium max-w-xl mx-auto leading-relaxed px-4">
                Regístrate para la gran actividad navideña, no te la pierdas. <br className="hidden md:block"/>Los esperamos a todos.
              </p>
            </motion.div>
          </div>

          {/* --- FORMULARIO --- */}
          <div className="w-full max-w-lg relative z-30"> 
            
            {isSubmitted ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#fffbf0] border-4 border-[#d4af37] rounded-3xl p-8 text-center shadow-2xl text-[#1a0505]"
              >
                <div className="mb-6 flex justify-center">
                  {formData.asistencia === 'confirmado' ? (
                    <div className="w-24 h-24 bg-[#165b33] rounded-full flex items-center justify-center shadow-lg animate-bounce text-white">
                      <PartyPopper className="w-12 h-12" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-12 h-12 text-gray-500" />
                    </div>
                  )}
                </div>
                <h3 className="text-2xl font-serif font-bold mb-3">¡Gracias por responder!</h3>
                <p className="text-gray-600 mb-8">Hemos registrado tu respuesta correctamente.</p>
                
                <Button 
                  onClick={() => window.location.reload()}
                  className="w-full bg-[#d4af37] hover:bg-amber-500 text-black font-bold py-4 rounded-xl shadow-lg"
                >
                  Volver al Inicio
                </Button>
              </motion.div>
            ) : (
              <motion.form
                onSubmit={handleSubmit}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-black/50 backdrop-blur-xl border border-[#d4af37]/40 rounded-3xl p-6 md:p-8 shadow-[0_0_60px_rgba(0,0,0,0.6)] relative overflow-hidden"
              >
                {/* Cinta decorativa superior */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 via-[#d4af37] to-red-600" />

                {/* 1. DATOS PERSONALES */}
                <div className="space-y-5 mb-8 mt-2">
                  <div>
                    <Label>Nombre del Apoderado <User className="inline w-3 h-3 ml-1 text-[#d4af37]"/></Label>
                    <Input 
                      placeholder="Ej: Juan Pérez" 
                      value={formData.nombre_padre}
                      onChange={(e) => handleInputChange('nombre_padre', e.target.value)}
                      className={formErrors.nombre_padre ? 'border-red-500 bg-red-500/10' : ''}
                    />
                    {formErrors.nombre_padre && <span className="text-red-400 text-xs mt-1 font-bold ml-1">• Requerido</span>}
                  </div>
                  
                  <div>
                    <Label>Nombre del Alumno/a <Sparkles className="inline w-3 h-3 ml-1 text-[#d4af37]"/></Label>
                    <Input 
                      placeholder="Ej: Sofía Pérez"
                      value={formData.nombre_alumno}
                      onChange={(e) => handleInputChange('nombre_alumno', e.target.value)}
                      className={formErrors.nombre_alumno ? 'border-red-500 bg-red-500/10' : ''}
                    />
                    {formErrors.nombre_alumno && <span className="text-red-400 text-xs mt-1 font-bold ml-1">• Requerido</span>}
                  </div>

                  <div>
                    <Label>Correo Electrónico <Mail className="inline w-3 h-3 ml-1 text-[#d4af37]"/></Label>
                    <Input 
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={formErrors.email ? 'border-red-500 bg-red-500/10' : ''}
                    />
                    {formErrors.email && <span className="text-red-400 text-xs mt-1 font-bold ml-1">• Email inválido</span>}
                  </div>
                </div>

                {/* 2. ASISTENCIA - Botones con color y vida */}
                <div className="mb-8">
                  <Label className="text-center block text-lg mb-4 text-white/90">¿Asistirán al evento?</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleAttendance('confirmado')}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden group ${
                        formData.asistencia === 'confirmado'
                          ? 'border-[#d4af37] bg-[#d4af37] text-black shadow-[0_0_20px_rgba(212,175,55,0.6)] scale-[1.02]'
                          : 'border-white/20 bg-white/5 text-white/60 hover:border-[#d4af37] hover:text-white'
                      }`}
                    >
                      {/* Fondo gradiente sutil al confirmar */}
                      {formData.asistencia === 'confirmado' && (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700] to-[#B8860B] opacity-100 -z-10" />
                      )}
                      
                      <CalendarHeart className={`w-8 h-8 ${formData.asistencia === 'confirmado' ? 'text-black' : 'text-gray-400 group-hover:text-[#d4af37]'}`} />
                      <span className="font-black text-sm md:text-base uppercase tracking-wider">¡Sí, Vamos!</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAttendance('no_asistire')}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden group ${
                        formData.asistencia === 'no_asistire'
                          ? 'border-red-500 bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.6)] scale-[1.02]'
                          : 'border-white/20 bg-white/5 text-white/60 hover:border-red-500 hover:text-white'
                      }`}
                    >
                      {formData.asistencia === 'no_asistire' && (
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-800 opacity-100 -z-10" />
                      )}

                      <XCircle className={`w-8 h-8 ${formData.asistencia === 'no_asistire' ? 'text-white' : 'text-gray-400 group-hover:text-red-500'}`} />
                      <span className="font-black text-sm md:text-base uppercase tracking-wider">No podré</span>
                    </button>
                  </div>
                  {formErrors.asistencia && <p className="text-red-400 text-xs text-center mt-3 font-bold bg-red-500/10 py-1 rounded">⚠️ Selecciona una opción</p>}
                </div>

                {/* LÓGICA CONDICIONAL */}
                <AnimatePresence mode="wait">
                  {formData.asistencia === 'no_asistire' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: 10 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: 10 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center mb-6">
                        <div className="flex justify-center mb-2">
                          <Frown className="w-8 h-8 text-amber-400" />
                        </div>
                        <p className="text-white/80 text-sm leading-relaxed">
                          ¡Qué pena! Los extrañaremos mucho en la celebración. <br/>
                          <span className="text-[#d4af37] font-bold block mt-2 text-base">¡Les deseamos una Feliz Navidad! 🎄</span>
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {formData.asistencia === 'confirmado' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: 10 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: 10 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-[#d4af37]/10 border-l-4 border-[#d4af37] p-4 rounded-r-lg mb-6">
                        <h4 className="text-[#d4af37] font-bold text-sm uppercase flex items-center gap-2 mb-1">
                          <Gift className="w-4 h-4" /> Misión Intercambio
                        </h4>
                        <p className="text-white/80 text-xs leading-relaxed">
                          Ayuda a tu "Amigo Secreto" dándole 3 opciones. <br/><span className="text-white font-bold">Referencia mínima: S/ 40.</span>
                        </p>
                      </div>

                      <div className="space-y-3 mb-8">
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
                  className="w-full bg-gradient-to-r from-[#d4af37] via-[#eecf5b] to-[#b4941f] hover:brightness-110 text-black font-black text-lg py-5 rounded-xl shadow-[0_0_25px_rgba(212,175,55,0.4)] uppercase tracking-widest relative overflow-hidden group active:scale-95 transition-all"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <>Enviando... <Loader2 className="w-5 h-5 animate-spin ml-2"/></>
                    ) : (
                      <>ENVIAR RESPUESTA <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                    )}
                  </span>
                </Button>

              </motion.form>
            )}
          </div>
        </main>

        {/* --- FOOTER --- */}
        <FooterMain 
          onNavigate={onNavigate}
          onOpenMatricula={() => {}}
        />

        {/* --- LOBO ANIMADO (Pequeño, Derecha, Fijo) --- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="fixed bottom-4 right-4 z-[60] w-24 md:w-36 pointer-events-none filter drop-shadow-xl"
        >
          <img
            src="https://res.cloudinary.com/dkoocok3j/image/upload/v1764451372/lobo_sin_fondo_navidad_Mesa_de_trabajo_1_copia_5_r4cl8x.png"
            alt="Lobo Santa"
            className="w-full h-auto opacity-90"
          />
        </motion.div>
      </div>

    </div>
  );
}

// 2. Exportación POR DEFECTO
export default RegistroActividadNavidadPage;
