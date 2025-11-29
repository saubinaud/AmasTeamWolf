import { useState, useEffect } from 'react';
import { HeaderMain } from './HeaderMain';
import { FooterMain } from './FooterMain';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Gift, CheckCircle, Mail, User, Sparkles, PartyPopper, XCircle, CalendarHeart, Star, Snowflake } from 'lucide-react';
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
    <div className="min-h-screen relative overflow-x-hidden font-sans selection:bg-[#d4af37] selection:text-black bg-[#0a0f0d]">
      <style>{snowStyles}</style>
      
      {/* --- FONDO MÁGICO --- */}
      <div className="fixed inset-0 z-0">
        {/* Imagen de fondo optimizada */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://res.cloudinary.com/dkoocok3j/image/upload/v1764452535/Green_Red_Festive_Christmas_Card_w0ox9n.png')`,
          }}
        />
        
        {/* Capa de viñeta oscura (Gradiente radial) para centrar la atención */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.8)_100%)]" />
        
        {/* Capa extra oscura inferior para que el footer y el lobo resalten */}
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black/90 to-transparent" />

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

      {/* --- LOBO ANIMADO (PEEK-A-BOO) --- 
          Se asoma desde la esquina inferior derecha */}
      <motion.div
        initial={{ y: 300, rotate: 10 }} // Empieza escondido abajo
        animate={{ 
          y: [300, 0, 0, 0, 300], // Sube (0), se queda, baja (300)
          rotate: [10, -5, 5, -5, 10] // Saluda
        }}
        transition={{ 
          duration: 15, // Ciclo largo para no distraer
          repeat: Infinity, 
          repeatDelay: 2, // Pequeña pausa escondido
          times: [0, 0.1, 0.8, 0.9, 1],
          ease: "easeInOut"
        }}
        className="fixed -bottom-4 -right-4 z-50 w-40 md:w-64 pointer-events-none filter drop-shadow-2xl"
      >
        <img 
          src="https://res.cloudinary.com/dkoocok3j/image/upload/v1764451372/lobo_sin_fondo_navidad_Mesa_de_trabajo_1_copia_5_r4cl8x.png" 
          alt="Lobo Santa" 
          className="w-full h-auto"
        />
      </motion.div>

      <div className="relative z-10">
        <HeaderMain
          onNavigate={onNavigate}
          onOpenMatricula={() => onNavigate('registro-leadership')}
          onCartClick={() => {}}
          cartItemsCount={0}
        />

        <div className="container mx-auto px-4 pt-32 pb-32 flex flex-col items-center min-h-screen">
          
          {/* --- TÍTULO MÁGICO --- */}
          <div className="text-center mb-10 max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <div className="inline-block mb-4">
                <span className="px-4 py-1.5 rounded-full border border-[#d4af37]/40 bg-[#0a0f0d]/60 text-[#d4af37] text-xs md:text-sm font-bold tracking-[0.2em] uppercase backdrop-blur-md shadow-lg">
                  Evento Exclusivo 2025
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-4 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]" 
                  style={{ fontFamily: 'serif', textShadow: '0 0 20px rgba(212, 175, 55, 0.3)' }}>
                <span className="block text-3xl md:text-4xl font-sans font-light mb-2 opacity-90">La Gran Clausura</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-[#d4af37] via-[#fcd34d] to-[#b45309]">
                  Navideña Wolf
                </span>
              </h1>
              <p className="text-white/90 text-lg md:text-xl font-medium tracking-wide drop-shadow-md max-w-2xl mx-auto">
                Celebremos juntos un año lleno de fuerza, honor y espíritu de manada.
              </p>
            </motion.div>
          </div>

          {isSubmitted ? (
            // --- VISTA CONFIRMACIÓN ---
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-lg w-full bg-[#1a0505]/80 backdrop-blur-xl border-2 border-[#d4af37] rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[#d4af37]/5 to-transparent pointer-events-none" />
              
              <div className="mb-6 relative inline-block">
                {formData.asistencia === 'confirmado' ? (
                  <div className="w-20 h-20 bg-[#d4af37] rounded-full flex items-center justify-center mx-auto shadow-lg shadow-[#d4af37]/30 animate-bounce">
                    <PartyPopper className="w-10 h-10 text-[#1a0505]" />
                  </div>
                ) : (
                   <CheckCircle className="w-20 h-20 text-zinc-500 mx-auto" />
                )}
              </div>

              <h2 className="text-3xl font-bold text-[#d4af37] mb-4 font-serif">
                {formData.asistencia === 'confirmado' ? '¡Confirmado!' : 'Gracias'}
              </h2>

              <p className="text-white/90 mb-8 text-lg font-light leading-relaxed">
                {formData.asistencia === 'confirmado' 
                  ? 'Tu lugar en la mesa de la manada está reservado. ¡Nos vemos en la celebración!'
                  : 'Te extrañaremos. ¡Que tengas unas fiestas increíbles!'}
              </p>

              <Button
                onClick={() => onNavigate('home')}
                className="w-full bg-gradient-to-r from-[#d4af37] to-[#b45309] hover:from-[#fcd34d] hover:to-[#d97706] text-[#1a0505] font-bold py-6 rounded-xl shadow-lg transition-all"
              >
                Volver al Inicio
              </Button>
            </motion.div>
          ) : (
            // --- FORMULARIO INTEGRADO (TARJETA DE CRISTAL) ---
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="w-full max-w-xl bg-[#0f172a]/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 md:p-10 shadow-2xl relative overflow-hidden"
            >
              {/* Decoración Borde Brillante */}
              <div className="absolute inset-0 rounded-[2rem] border border-[#d4af37]/30 pointer-events-none" />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-50" />

              <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                
                {/* 1. DATOS (Inputs legibles) */}
                <div className="space-y-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1 bg-white/10"></div>
                    <span className="text-[#d4af37] font-bold text-xs uppercase tracking-widest">Tus Datos</span>
                    <div className="h-px flex-1 bg-white/10"></div>
                  </div>
                  
                  <div className="grid gap-4">
                    <div>
                      <Label className="text-white/80 mb-1.5 block text-sm ml-1">Nombre del Alumno</Label>
                      <Input
                        placeholder="Ej: Sebastián González"
                        value={formData.nombre_alumno}
                        onChange={(e) => handleInputChange('nombre_alumno', e.target.value)}
                        className={`bg-black/40 border-white/10 text-white h-12 focus:border-[#d4af37] focus:ring-[#d4af37]/20 rounded-xl placeholder:text-white/20 backdrop-blur-sm ${formErrors.nombre_alumno ? 'border-red-500/50' : ''}`}
                      />
                    </div>

                    <div>
                      <Label className="text-white/80 mb-1.5 block text-sm ml-1">Nombre del Apoderado</Label>
                      <Input
                        placeholder="Tu nombre completo"
                        value={formData.nombre_padre}
                        onChange={(e) => handleInputChange('nombre_padre', e.target.value)}
                        className={`bg-black/40 border-white/10 text-white h-12 focus:border-[#d4af37] focus:ring-[#d4af37]/20 rounded-xl placeholder:text-white/20 backdrop-blur-sm ${formErrors.nombre_padre ? 'border-red-500/50' : ''}`}
                      />
                    </div>

                    <div>
                      <Label className="text-white/80 mb-1.5 block text-sm ml-1">Correo Electrónico</Label>
                      <Input
                        type="email"
                        placeholder="Para la confirmación"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`bg-black/40 border-white/10 text-white h-12 focus:border-[#d4af37] focus:ring-[#d4af37]/20 rounded-xl placeholder:text-white/20 backdrop-blur-sm ${formErrors.email ? 'border-red-500/50' : ''}`}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. ASISTENCIA */}
                <div className="pt-4">
                  <Label className="text-[#d4af37] text-xl font-bold block text-center mb-6 font-serif tracking-wide">
                    ¿Nos acompañarás?
                  </Label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleAttendance('confirmado')}
                      className={`p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2 group relative overflow-hidden ${
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
                      className={`p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2 group ${
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

                {/* 3. DESEOS (Lista de Santa) */}
                <AnimatePresence>
                  {formData.asistencia === 'confirmado' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-5 pt-6 overflow-hidden"
                    >
                      <div className="bg-[#d4af37]/10 p-4 rounded-xl border border-[#d4af37]/30 flex gap-3 items-start backdrop-blur-sm">
                        <Gift className="w-6 h-6 text-[#d4af37] mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-[#d4af37] font-bold text-sm uppercase mb-1">Misión Intercambio</h4>
                          <p className="text-white/80 text-xs leading-relaxed">
                            Ayuda a tu "Amigo Secreto" sugiriendo 3 regalos. <br/>
                            <span className="text-white font-bold">Referencia mínima: S/ 40.</span>
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
                              className="bg-black/40 border-white/10 text-white pl-10 h-11 focus:border-[#d4af37] rounded-xl placeholder:text-white/20 text-sm backdrop-blur-sm"
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
                  className="w-full bg-gradient-to-r from-[#d4af37] via-[#fcd34d] to-[#b45309] hover:from-[#fcd34d] hover:to-[#d97706] text-[#0f172a] font-black text-lg py-6 rounded-2xl shadow-lg shadow-[#d4af37]/20 uppercase tracking-widest transition-all hover:scale-[1.02] mt-4 border-b-4 border-[#b45309] active:border-b-0 active:translate-y-1"
                >
                  {isSubmitting ? 'Enviando...' : (formData.asistencia === 'confirmado' ? 'Confirmar Asistencia' : 'Enviar Respuesta')}
                </Button>

              </form>
            </motion.div>
          )}

          {/* Footer Texto */}
          <div className="mt-8 text-center relative z-20">
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
