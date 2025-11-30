import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'sonner';
import { 
  Gift, CheckCircle, PartyPopper, 
  XCircle, CalendarHeart, Frown, Send, Loader2, User, Sparkles, Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- IMPORTS REALES (Listos para tu web) ---
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

// --- COMPONENTES UI LOCALES ---

const Label = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <label className={`block text-[#d4af37] text-xs font-bold mb-2 uppercase tracking-widest ${className}`}>
    {children}
  </label>
);

// Input con estilo Glassmorphism oscuro y borde sutil
const Input = ({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    className={`w-full bg-[#1a1a1a]/90 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all text-base shadow-inner ${className}`}
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
    <div className="min-h-screen relative flex flex-col font-sans selection:bg-[#d4af37] selection:text-black bg-[#050505] text-white">
      <Toaster position="top-center" richColors />
      
      {/* --- FONDO --- */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url('https://res.cloudinary.com/dkoocok3j/image/upload/v1764452535/Green_Red_Festive_Christmas_Card_w0ox9n.png')`,
            opacity: 0.4
          }} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/90" />
      </div>

      {/* --- HEADER --- */}
      <HeaderMain 
        onNavigate={onNavigate}
        onOpenMatricula={() => {}}
        onCartClick={() => {}}
        cartItemsCount={0}
      />

      {/* --- CONTENIDO PRINCIPAL --- */}
      {/* pt-40: Margen superior grande para que el título no toque el header */}
      {/* pb-32: Margen inferior para que el formulario no toque el footer */}
      <main className="flex-grow flex flex-col items-center justify-start px-4 pt-40 pb-32 relative z-10 w-full">
        
        {/* TITULAR GRANDE */}
        <div className="text-center mb-10 w-full max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 mb-4 bg-white/10 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
              <span className="text-lg">🎅</span>
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#d4af37]">Evento Fin de Año</span>
            </div>
            
            <h1 className="text-4xl md:text-7xl font-serif text-white mb-6 leading-tight drop-shadow-2xl">
              Gran Clausura <br />
              <span className="text-[#d4af37]">Navideña</span>
            </h1>
            
            <p className="text-white/80 text-base md:text-xl font-light max-w-xl mx-auto leading-relaxed px-4">
              Regístrate para la gran actividad navideña, no te la pierdas. Los esperamos a todos.
            </p>
          </motion.div>
        </div>

        {/* --- FORMULARIO --- */}
        <div className="w-full max-w-lg relative z-20"> 
          
          {isSubmitted ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#1a1a1a] border border-[#d4af37] rounded-3xl p-8 text-center shadow-2xl"
            >
              <div className="mb-6 flex justify-center">
                <div className="w-24 h-24 bg-[#165b33] rounded-full flex items-center justify-center shadow-[0_0_30px_#165b33] animate-bounce text-white">
                  <PartyPopper className="w-12 h-12" />
                </div>
              </div>
              <h3 className="text-3xl font-serif text-[#d4af37] mb-3">¡Gracias!</h3>
              <p className="text-gray-300 mb-8 text-lg">Hemos registrado tu respuesta correctamente.</p>
              
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
              className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden"
            >
              {/* Cinta decorativa */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-70" />

              {/* 1. DATOS PERSONALES */}
              <div className="space-y-6 mb-8 mt-2">
                <div>
                  <Label>Nombre del Apoderado</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#d4af37]" />
                    <Input 
                      placeholder="Ej: Juan Pérez" 
                      value={formData.nombre_padre}
                      onChange={(e) => handleInputChange('nombre_padre', e.target.value)}
                      className={`pl-12 ${formErrors.nombre_padre ? 'border-red-500 bg-red-900/20' : ''}`}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Nombre del Alumno/a</Label>
                  <div className="relative">
                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#d4af37]" />
                    <Input 
                      placeholder="Ej: Sofía Pérez"
                      value={formData.nombre_alumno}
                      onChange={(e) => handleInputChange('nombre_alumno', e.target.value)}
                      className={`pl-12 ${formErrors.nombre_alumno ? 'border-red-500 bg-red-900/20' : ''}`}
                    />
                  </div>
                </div>

                <div>
                  <Label>Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#d4af37]" />
                    <Input 
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`pl-12 ${formErrors.email ? 'border-red-500 bg-red-900/20' : ''}`}
                    />
                  </div>
                </div>
              </div>

              {/* 2. ASISTENCIA */}
              <div className="mb-8">
                <Label className="text-center block text-sm mb-4 text-white tracking-widest">¿Asistirán al evento?</Label>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleAttendance('confirmado')}
                    className={`relative p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 group overflow-hidden ${
                      formData.asistencia === 'confirmado'
                        ? 'border-[#d4af37] bg-[#d4af37]/20 shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                        : 'border-white/10 bg-white/5 hover:border-[#d4af37]/50'
                    }`}
                  >
                    <CalendarHeart className={`w-8 h-8 ${formData.asistencia === 'confirmado' ? 'text-[#d4af37]' : 'text-gray-400 group-hover:text-[#d4af37]'}`} />
                    <span className={`font-bold text-xs uppercase tracking-widest ${formData.asistencia === 'confirmado' ? 'text-[#d4af37]' : 'text-gray-400 group-hover:text-white'}`}>
                      ¡Sí, Vamos!
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAttendance('no_asistire')}
                    className={`relative p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 group ${
                      formData.asistencia === 'no_asistire'
                        ? 'border-red-500 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                        : 'border-white/10 bg-white/5 hover:border-red-500/50'
                    }`}
                  >
                    <XCircle className={`w-8 h-8 ${formData.asistencia === 'no_asistire' ? 'text-red-500' : 'text-gray-400 group-hover:text-red-500'}`} />
                    <span className={`font-bold text-xs uppercase tracking-widest ${formData.asistencia === 'no_asistire' ? 'text-red-500' : 'text-gray-400 group-hover:text-white'}`}>
                      No Podré
                    </span>
                  </button>
                </div>
                
                {formErrors.asistencia && (
                  <p className="text-red-400 text-xs text-center mt-3 font-bold">⚠️ Por favor confirma</p>
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
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center mb-8">
                      <p className="text-white/80 text-sm">
                        ¡Qué pena! Los extrañaremos. <br/>
                        <span className="text-[#d4af37] font-bold block mt-2">¡Feliz Navidad! 🎄</span>
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
                    <div className="bg-[#d4af37]/10 border-l-2 border-[#d4af37] pl-4 py-3 mb-6 rounded-r-lg">
                      <h4 className="text-[#d4af37] font-bold text-xs uppercase flex items-center gap-2 mb-1">
                        <Gift className="w-3 h-3" /> Misión Intercambio
                      </h4>
                      <p className="text-white/60 text-xs">
                        Ayuda al "Amigo Secreto". <span className="text-white font-bold">Mínimo S/ 40.</span>
                      </p>
                    </div>

                    <div className="space-y-4 mb-8">
                      {[1, 2, 3].map((num) => (
                        <div key={num} className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xs font-bold">#{num}</span>
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

              {/* BOTÓN SUBMIT - SÓLIDO DORADO */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#d4af37] hover:bg-[#c29f2d] text-black font-black text-lg py-5 rounded-xl shadow-lg shadow-orange-500/20 uppercase tracking-widest relative overflow-hidden group active:scale-[0.98] transition-all mt-2"
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

      {/* --- FOOTER REAL --- */}
      <div className="relative z-20">
        <FooterMain 
          onNavigate={onNavigate}
          onOpenMatricula={() => {}}
        />
      </div>

      {/* --- LOBO ANIMADO --- */}
      {/* Fixed, z-index 50 para que se vea sobre el fondo pero no tape interacciones críticas */}
      <div className="fixed bottom-0 right-0 z-50 pointer-events-none w-24 md:w-36 opacity-100 filter drop-shadow-2xl">
        <img
          src="https://res.cloudinary.com/dkoocok3j/image/upload/v1764451372/lobo_sin_fondo_navidad_Mesa_de_trabajo_1_copia_5_r4cl8x.png"
          alt="Lobo Santa"
          className="w-full h-auto"
        />
      </div>

    </div>
  );
}

// 2. Exportación POR DEFECTO
export default RegistroActividadNavidadPage;
