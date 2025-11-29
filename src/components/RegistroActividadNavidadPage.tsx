import { useState, useEffect } from 'react';
import { HeaderMain } from './HeaderMain';
import { FooterMain } from './FooterMain';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Gift, CheckCircle, Mail, User, Sparkles, PartyPopper, XCircle, CalendarHeart, Star, Heart } from 'lucide-react';
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
      const errorEl = document.querySelector('.text-red-400');
      errorEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('https://pallium-n8n.s6hx3x.easypanel.host/webhook/asistencia-evento-navidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, timestamp: new Date().toISOString(), source: 'landing_navidad_v6_mobile_fix' }),
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

  // Estilos CSS para la nieve
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
    <div className="min-h-screen relative overflow-x-hidden font-sans selection:bg-[#d4af37] selection:text-black bg-[#020a06]">
      <style>{snowStyles}</style>
      
      {/* --- FONDO --- */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://res.cloudinary.com/dkoocok3j/image/upload/v1764452535/Green_Red_Festive_Christmas_Card_w0ox9n.png')`,
          }}
        />
        {/* Capa oscura ajustada para que resalte el contenido */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px]" />
        
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

      <div className="relative z-10">
        <HeaderMain
          onNavigate={onNavigate}
          onOpenMatricula={() => onNavigate('registro-leadership')}
          onCartClick={() => {}}
          cartItemsCount={0}
        />

        <div className="container mx-auto px-4 pt-28 pb-24 flex flex-col items-center min-h-screen">
          
          {/* --- CABECERA DE TEXTO --- */}
          <div className="text-center mb-8 max-w-2xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-block mb-4">
                <span className="px-4 py-1.5 rounded-full border border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37] text-xs font-bold tracking-[0.2em] uppercase backdrop-blur-md shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                  Navidad 2025
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
                Gran Clausura <br/>
                <span className="text-[#d4af37] drop-shadow-[0_0_25px_rgba(212,175,55,0.5)]">AMAS Team Wolf</span>
              </h1>
              <p className="text-white/90 text-base md:text-xl font-medium max-w-md mx-auto leading-relaxed">
                Celebra el esfuerzo de todo el año con la premiación y el gran intercambio de regalos.
              </p>
            </motion.div>
          </div>

          {isSubmitted ? (
            // --- VISTA CONFIRMACIÓN ---
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md bg-black/80 backdrop-blur-xl border-2 border-[#d4af37] rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(212,175,55,0.15)]"
            >
              <div className="mb-6 flex justify-center">
                {formData.asistencia === 'confirmado' ? (
                  <div className="w-20 h-20 bg-[#d4af37] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.5)] animate-bounce">
                    <PartyPopper className="w-10 h-10 text-black" />
                  </div>
                ) : (
                   <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center shadow-lg">
                     <Heart className="w-10 h-10 text-zinc-400" />
                   </div>
                )}
              </div>

              <h2 className="text-2xl font-bold text-[#d4af37] mb-3">
                {formData.asistencia === 'confirmado' ? '¡Confirmado!' : 'Gracias por responder'}
              </h2>

              <p className="text-white/90 mb-8 text-base leading-relaxed">
                {formData.asistencia === 'confirmado' 
                  ? 'Tu lugar en la manada está reservado. ¡Te esperamos para celebrar!'
                  : 'Que pena que no puedas venir. Nos gustaría verte ahí. ¡Esperamos que tengan una bonita Navidad!'}
              </p>

              <Button
                onClick={() => onNavigate('home')}
                className="w-full bg-[#d4af37] hover:bg-[#fbbf24] text-black font-bold py-4 rounded-xl shadow-lg transition-all"
              >
                Volver al Inicio
              </Button>
            </motion.div>
          ) : (
            // --- FORMULARIO ---
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full max-w-md bg-[#121212]/80 backdrop-blur-xl border-2 border-[#d4af37]/40 rounded-3xl p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)] relative overflow-hidden"
            >
              {/* Brillo superior */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-70" />

              <form onSubmit={handleSubmit} className="space-y-7 relative z-10">
                
                {/* 1. DATOS */}
                <div className="space-y-5">
                   <h3 className="text-white font-bold text-sm uppercase tracking-widest border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#d4af37]" /> Tus Datos
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-[#d4af37] text-xs uppercase font-bold tracking-wide ml-1 mb-1 block">Nombre del Alumno</Label>
                      <Input
                        placeholder="Ej: Sebastián González"
                        value={formData.nombre_alumno}
                        onChange={(e) => handleInputChange('nombre_alumno', e.target.value)}
                        className={`bg-black/40 border-white/20 text-white h-12 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] rounded-xl placeholder:text-white/30 ${formErrors.nombre_alumno ? 'border-red-500' : ''}`}
                      />
                    </div>

                    <div>
                      <Label className="text-[#d4af37] text-xs uppercase font-bold tracking-wide ml-1 mb-1 block">Nombre del Apoderado</Label>
                      <Input
                        placeholder="Tu nombre completo"
                        value={formData.nombre_padre}
                        onChange={(e) => handleInputChange('nombre_padre', e.target.value)}
                        className={`bg-black/40 border-white/20 text-white h-12 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] rounded-xl placeholder:text-white/30 ${formErrors.nombre_padre ? 'border-red-500' : ''}`}
                      />
                    </div>

                    <div>
                      <Label className="text-[#d4af37] text-xs uppercase font-bold tracking-wide ml-1 mb-1 block">Correo Electrónico</Label>
                      <Input
                        type="email"
                        placeholder="contacto@email.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`bg-black/40 border-white/20 text-white h-12 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] rounded-xl placeholder:text-white/30 ${formErrors.email ? 'border-red-500' : ''}`}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. ASISTENCIA (MEJORADA) */}
                <div className="pt-2">
                  <Label className="text-white text-lg font-bold block text-center mb-4">
                    ¿Asistirán al evento?
                  </Label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* BOTÓN SÍ: Vibrante y Llamativo */}
                    <button
                      type="button"
                      onClick={() => handleAttendance('confirmado')}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
                        formData.asistencia === 'confirmado'
                          ? 'bg-[#d4af37] border-[#d4af37] text-black shadow-[0_0_25px_rgba(212,175,55,0.4)] scale-[1.03]'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-[#d4af37]/50 hover:text-[#d4af37]'
                      }`}
                    >
                      <div className={`p-2 rounded-full ${formData.asistencia === 'confirmado' ? 'bg-black/10' : 'bg-white/5'}`}>
                        <CalendarHeart className="w-6 h-6" />
                      </div>
                      <span className="font-black text-sm sm:text-base uppercase tracking-wide">¡SÍ, VAMOS!</span>
                    </button>

                    {/* BOTÓN NO: Sutil pero claro */}
                    <button
                      type="button"
                      onClick={() => handleAttendance('no_asistire')}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
                        formData.asistencia === 'no_asistire'
                          ? 'bg-red-900/80 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] scale-[1.03]'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-red-500/50 hover:text-red-400'
                      }`}
                    >
                      <div className={`p-2 rounded-full ${formData.asistencia === 'no_asistire' ? 'bg-black/20' : 'bg-white/5'}`}>
                        <XCircle className="w-6 h-6" />
                      </div>
                      <span className="font-black text-sm sm:text-base uppercase tracking-wide">NO PODRÉ</span>
                    </button>
                  </div>
                  {formErrors.asistencia && <p className="text-red-400 text-xs text-center mt-2 font-medium bg-red-900/20 py-1 rounded">⚠️ Selecciona una opción</p>}
                </div>

                {/* MENSAJE "NO PODRÉ" (Nuevo) */}
                <AnimatePresence>
                  {formData.asistencia === 'no_asistire' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                        <p className="text-white/90 text-sm leading-relaxed">
                          😔 Qué pena que no puedas venir. Nos gustaría mucho verlos ahí. <br/>
                          <span className="text-[#d4af37] font-medium">¡Esperamos que tengan una bonita Navidad!</span>
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 3. DESEOS (Expandible) */}
                <AnimatePresence>
                  {formData.asistencia === 'confirmado' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 pt-2 overflow-hidden"
                    >
                      <div className="bg-[#d4af37]/10 border border-[#d4af37]/30 p-4 rounded-xl flex gap-3 items-start">
                        <Gift className="w-8 h-8 text-[#d4af37] mt-1" />
                        <div>
                           <h4 className="text-[#d4af37] font-bold text-sm uppercase mb-0.5">Misión Intercambio</h4>
                           <p className="text-white/80 text-xs leading-snug">
                            Ayuda al "Amigo Secreto" con 3 opciones (Min. S/ 40).
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {[1, 2, 3].map((num) => (
                          <div key={num} className="relative">
                            <Star className="absolute left-3 top-3.5 w-4 h-4 text-[#d4af37]/70" />
                            <Input
                              placeholder={`Opción de regalo ${num}...`}
                              value={formData[`deseo_${num}` as keyof typeof formData]}
                              onChange={(e) => handleInputChange(`deseo_${num}`, e.target.value)}
                              className="bg-black/40 border-white/10 text-white focus:border-[#d4af37] h-11 pl-10 text-sm rounded-xl"
                            />
                          </div>
                        ))}
                      </div>
                      {formErrors.deseos && <p className="text-red-400 text-xs text-center font-medium">⚠️ {formErrors.deseos}</p>}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* BOTÓN DE ENVÍO (NUEVO DISEÑO) */}
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black text-lg py-6 rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.3)] uppercase tracking-widest transition-all hover:scale-[1.02] mt-4 border-b-4 border-amber-700 active:border-b-0 active:translate-y-1"
                >
                  {isSubmitting ? 'Enviando...' : 'ENVIAR RESPUESTA'}
                </Button>

              </form>
            </motion.div>
          )}

          <div className="mt-12 text-center z-10">
            <p className="text-[#d4af37]/50 text-[10px] font-bold uppercase tracking-[0.2em]">
              AMAS Team Wolf • Navidad 2025
            </p>
          </div>

        </div>

        <FooterMain
          onNavigate={onNavigate}
          onOpenMatricula={() => onNavigate('registro-leadership')}
        />
      </div>
      
      {/* Lobo Fijo (Menos intrusivo) */}
      <motion.div
        initial={{ y: 150 }}
        animate={{ y: 0 }}
        transition={{ delay: 1, duration: 1, type: 'spring' }}
        className="fixed bottom-0 right-0 z-50 w-32 md:w-48 pointer-events-none"
      >
        <img 
          src="https://res.cloudinary.com/dkoocok3j/image/upload/v1764451372/lobo_sin_fondo_navidad_Mesa_de_trabajo_1_copia_5_r4cl8x.png" 
          alt="Lobo Santa" 
          className="w-full h-auto drop-shadow-2xl filter brightness-110"
        />
      </motion.div>
    </div>
  );
}
