import { useState, useEffect } from 'react';
import { HeaderMain } from './HeaderMain';
import { FooterMain } from './FooterMain';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Gift, CheckCircle, Mail, User, Sparkles, PartyPopper, XCircle, CalendarHeart, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RegistroActividadNavidadPageProps {
  onNavigate: (page: string) => void;
}

export function RegistroActividadNavidadPage({ onNavigate }: RegistroActividadNavidadPageProps) {
  const [formData, setFormData] = useState({
    nombre_padre: '',
    nombre_alumno: '',
    email: '',
    asistencia: '' as 'confirmado' | 'no_asistire' | '',
    deseo_1: '',
    deseo_2: '',
    deseo_3: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
    const errors: Record<string, string> = {};
    if (!formData.nombre_padre.trim()) errors.nombre_padre = 'Requerido';
    if (!formData.nombre_alumno.trim()) errors.nombre_alumno = 'Requerido';
    if (!formData.email.trim() || !validateEmail(formData.email)) errors.email = 'Email inválido';
    if (!formData.asistencia) errors.asistencia = 'Selecciona una opción';
    
    if (formData.asistencia === 'confirmado' && (!formData.deseo_1 && !formData.deseo_2 && !formData.deseo_3)) {
      errors.deseos = 'Agrega al menos un deseo';
      toast.error('🎅 ¡Santa necesita ayuda! Escribe al menos un deseo.');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('https://pallium-n8n.s6hx3x.easypanel.host/webhook/asistencia-evento-navidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, timestamp: new Date().toISOString(), source: 'landing_navidad_v4_fixed' }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        toast.success('¡Registro enviado con éxito! 🎄');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error('Error al enviar');
      }
    } catch (error) {
      toast.error('Error de conexión. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Estilos CSS para la nieve (sutil y elegante)
  const snowStyles = `
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
    }
  `;

  return (
    <div className="min-h-screen relative overflow-x-hidden font-sans selection:bg-[#d4af37] selection:text-black bg-black">
      <style>{snowStyles}</style>
      
      {/* --- FONDO CORREGIDO --- */}
      <div className="fixed inset-0 z-0">
        {/* Imagen de fondo: Más alejada y centrada */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
          style={{
            backgroundImage: `url('https://res.cloudinary.com/dkoocok3j/image/upload/v1764452535/Green_Red_Festive_Christmas_Card_w0ox9n.png')`,
            // Esto asegura que la imagen cubra todo pero manteniendo proporciones razonables
            backgroundSize: 'cover', 
            backgroundPosition: 'center top'
          }}
        />
        
        {/* Capa oscura para legibilidad (Gradiente sutil) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/90" />

        {/* Nieve CSS */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="snowflake"
            style={{
              left: `${Math.random() * 100}vw`,
              animationDuration: `${Math.random() * 10 + 15}s`,
              animationDelay: `${Math.random() * 10}s`,
              fontSize: `${Math.random() * 8 + 6}px`,
              opacity: Math.random() * 0.5 + 0.2
            }}
          >
            ❄
          </div>
        ))}
      </div>

      {/* --- LOBO ANIMADO (PEEK-A-BOO) --- */}
      <motion.div
        initial={{ y: 200, rotate: 10 }}
        animate={{ 
          y: [200, 0, 0, 0, 200],
          rotate: [10, -5, 5, -5, 10]
        }}
        transition={{ 
          duration: 12, 
          repeat: Infinity, 
          repeatDelay: 5,
          times: [0, 0.1, 0.8, 0.9, 1] 
        }}
        className="fixed bottom-0 right-4 z-40 w-40 md:w-56 pointer-events-none"
      >
        <img 
          src="https://res.cloudinary.com/dkoocok3j/image/upload/v1764451372/lobo_sin_fondo_navidad_Mesa_de_trabajo_1_copia_5_r4cl8x.png" 
          alt="Lobo Santa" 
          className="w-full h-auto drop-shadow-2xl"
        />
      </motion.div>

      <div className="relative z-10">
        <HeaderMain
          onNavigate={onNavigate}
          onOpenMatricula={() => onNavigate('registro-leadership')}
          onCartClick={() => {}}
          cartItemsCount={0}
        />

        <div className="container mx-auto px-4 pt-32 pb-24 flex flex-col items-center min-h-screen">
          
          {/* --- TÍTULO MÁGICO --- */}
          <div className="text-center mb-12 max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-[#d4af37] to-[#8a6d1f] mb-4 drop-shadow-[0_2px_10px_rgba(212,175,55,0.3)]" 
                  style={{ fontFamily: 'serif' }}>
                ¡Feliz Navidad, Manada!
              </h1>
              <p className="text-white/90 text-lg md:text-xl font-light tracking-wide">
                Celebremos juntos un año lleno de fuerza, honor y espíritu Wolf.
              </p>
            </motion.div>
          </div>

          {isSubmitted ? (
            // --- VISTA CONFIRMACIÓN ---
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-lg w-full bg-black/60 backdrop-blur-xl border border-[#d4af37]/50 rounded-3xl p-8 text-center shadow-[0_0_40px_rgba(212,175,55,0.15)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[#d4af37]/5 to-transparent pointer-events-none" />
              
              <div className="mb-6 relative inline-block">
                {formData.asistencia === 'confirmado' ? (
                  <div className="w-20 h-20 bg-[#d4af37] rounded-full flex items-center justify-center mx-auto shadow-lg shadow-[#d4af37]/30 animate-bounce">
                    <PartyPopper className="w-10 h-10 text-black" />
                  </div>
                ) : (
                   <CheckCircle className="w-20 h-20 text-zinc-500 mx-auto" />
                )}
              </div>

              <h2 className="text-3xl font-bold text-[#d4af37] mb-4 font-serif">
                {formData.asistencia === 'confirmado' ? '¡Confirmado!' : 'Gracias'}
              </h2>

              <p className="text-white/80 mb-8 text-lg font-light">
                {formData.asistencia === 'confirmado' 
                  ? 'Tu lugar en la mesa de la manada está reservado. ¡Nos vemos en la celebración!'
                  : 'Te extrañaremos. ¡Que tengas unas fiestas increíbles!'}
              </p>

              <Button
                onClick={() => onNavigate('home')}
                className="w-full bg-gradient-to-r from-[#d4af37] to-amber-600 hover:from-[#e6c200] hover:to-amber-500 text-black font-bold py-6 rounded-xl shadow-lg transition-all"
              >
                Volver al Inicio
              </Button>
            </motion.div>
          ) : (
            // --- FORMULARIO INTEGRADO (DARK GLASS) ---
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="w-full max-w-2xl bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 md:p-10 shadow-2xl relative"
            >
              {/* Decoración borde brillante sutil */}
              <div className="absolute inset-0 rounded-[2rem] border border-[#d4af37]/20 pointer-events-none" />

              <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                
                {/* 1. DATOS (Inputs oscuros y limpios) */}
                <div className="space-y-5">
                  <h3 className="text-[#d4af37] font-bold text-sm uppercase tracking-widest border-b border-[#d4af37]/20 pb-2 mb-4">
                    Información del Invitado
                  </h3>
                  
                  <div className="grid gap-4">
                    <div>
                      <Label className="text-white/70 mb-1.5 block text-sm ml-1">Nombre del Alumno</Label>
                      <Input
                        placeholder="Ej: Sebastián González"
                        value={formData.nombre_alumno}
                        onChange={(e) => handleInputChange('nombre_alumno', e.target.value)}
                        className={`bg-black/50 border-white/10 text-white h-12 focus:border-[#d4af37] focus:ring-[#d4af37]/20 rounded-xl placeholder:text-white/20 ${formErrors.nombre_alumno ? 'border-red-500/50' : ''}`}
                      />
                    </div>

                    <div>
                      <Label className="text-white/70 mb-1.5 block text-sm ml-1">Nombre del Apoderado</Label>
                      <Input
                        placeholder="Tu nombre completo"
                        value={formData.nombre_padre}
                        onChange={(e) => handleInputChange('nombre_padre', e.target.value)}
                        className={`bg-black/50 border-white/10 text-white h-12 focus:border-[#d4af37] focus:ring-[#d4af37]/20 rounded-xl placeholder:text-white/20 ${formErrors.nombre_padre ? 'border-red-500/50' : ''}`}
                      />
                    </div>

                    <div>
                      <Label className="text-white/70 mb-1.5 block text-sm ml-1">Correo Electrónico</Label>
                      <Input
                        type="email"
                        placeholder="Para la confirmación"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`bg-black/50 border-white/10 text-white h-12 focus:border-[#d4af37] focus:ring-[#d4af37]/20 rounded-xl placeholder:text-white/20 ${formErrors.email ? 'border-red-500/50' : ''}`}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. ASISTENCIA (Botones Elegantes) */}
                <div className="pt-2">
                  <Label className="text-white/90 text-lg font-medium block text-center mb-4 font-serif">
                    ¿Nos acompañarás en esta noche especial?
                  </Label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleAttendance('confirmado')}
                      className={`p-5 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 group relative overflow-hidden ${
                        formData.asistencia === 'confirmado'
                          ? 'bg-[#d4af37]/20 border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#d4af37]/40'
                      }`}
                    >
                      {formData.asistencia === 'confirmado' && (
                         <div className="absolute top-2 right-2 text-[#d4af37]"><CheckCircle className="w-5 h-5" /></div>
                      )}
                      <CalendarHeart className={`w-8 h-8 ${formData.asistencia === 'confirmado' ? 'text-[#d4af37]' : 'text-zinc-400'}`} />
                      <span className={`font-bold text-base uppercase tracking-wide ${formData.asistencia === 'confirmado' ? 'text-[#d4af37]' : 'text-zinc-300'}`}>¡Sí, Asistiré!</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAttendance('no_asistire')}
                      className={`p-5 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 group ${
                        formData.asistencia === 'no_asistire'
                          ? 'bg-red-900/20 border-red-500/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-red-500/30'
                      }`}
                    >
                      <XCircle className={`w-8 h-8 ${formData.asistencia === 'no_asistire' ? 'text-red-400' : 'text-zinc-400'}`} />
                      <span className={`font-bold text-base uppercase tracking-wide ${formData.asistencia === 'no_asistire' ? 'text-red-400' : 'text-zinc-300'}`}>No podré ir</span>
                    </button>
                  </div>
                  {formErrors.asistencia && <p className="text-red-400 text-sm text-center mt-2">⚠️ Por favor selecciona una opción</p>}
                </div>

                {/* 3. DESEOS (Aparece suavemente) */}
                <AnimatePresence>
                  {formData.asistencia === 'confirmado' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-5 pt-4 overflow-hidden"
                    >
                      <div className="bg-[#d4af37]/10 p-4 rounded-lg border border-[#d4af37]/30 flex gap-3 items-start">
                        <Gift className="w-5 h-5 text-[#d4af37] mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-[#d4af37] font-bold text-sm uppercase mb-1">Misión Intercambio</h4>
                          <p className="text-white/70 text-xs leading-relaxed">
                            Ayuda a tu "Amigo Secreto" sugiriendo 3 regalos. <br/>
                            <span className="text-white font-medium">Referencia mínima: S/ 40.</span>
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {[1, 2, 3].map((num) => (
                          <div key={num} className="relative">
                            <Star className="absolute left-3 top-3.5 w-4 h-4 text-[#d4af37]/50" />
                            <Input
                              placeholder={`Opción de regalo ${num}...`}
                              value={formData[`deseo_${num}` as keyof typeof formData]}
                              onChange={(e) => handleInputChange(`deseo_${num}`, e.target.value)}
                              className="bg-black/50 border-white/10 text-white pl-10 h-11 focus:border-[#d4af37] rounded-lg placeholder:text-white/20 text-sm"
                            />
                          </div>
                        ))}
                        {formErrors.deseos && <p className="text-red-400 text-xs pl-1">⚠️ {formErrors.deseos}</p>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#d4af37] to-[#b39220] hover:from-[#e6c200] hover:to-[#d4af37] text-black font-bold text-lg py-6 rounded-xl shadow-lg shadow-[#d4af37]/20 uppercase tracking-widest transition-all hover:scale-[1.02] mt-4"
                >
                  {isSubmitting ? 'Enviando...' : (formData.asistencia === 'confirmado' ? 'Confirmar Asistencia' : 'Enviar Respuesta')}
                </Button>

              </form>
            </motion.div>
          )}

          {/* Footer Texto */}
          <div className="mt-10 text-center">
            <p className="text-[#d4af37]/60 text-xs font-medium uppercase tracking-[0.2em]">
              AMAS Team Wolf • Navidad 2025
            </p>
          </div>

        </div>

        <FooterMain
          onNavigate={onNavigate}
          onOpenMatricula={() => onNavigate('registro-leadership')}
        />
      </div>
    </div>
  );
}
