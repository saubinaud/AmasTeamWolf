import { useState, useEffect } from 'react';
import { HeaderMain } from './HeaderMain';
import { FooterMain } from './FooterMain';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Gift, CheckCircle, Mail, User, Sparkles, PartyPopper, XCircle, CalendarHeart, Star, Frown } from 'lucide-react';
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
      errors.deseos = 'Escribe al menos un deseo';
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
        body: JSON.stringify({ ...formData, timestamp: new Date().toISOString(), source: 'landing_navidad_final_v6' }),
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

  // Nieve CSS
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
      z-index: 1;
    }
  `;

  return (
    <div className="min-h-screen relative overflow-x-hidden font-sans selection:bg-[#d4af37] selection:text-black bg-[#021a0a]">
      <style>{snowStyles}</style>
      
      {/* --- FONDO --- */}
      <div className="fixed inset-0 z-0">
        {/* Imagen de fondo */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://res.cloudinary.com/dkoocok3j/image/upload/v1764452535/Green_Red_Festive_Christmas_Card_w0ox9n.png')`,
          }}
        />
        {/* Capa oscura para legibilidad */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
        
        {/* Nieve CSS */}
        {[...Array(40)].map((_, i) => (
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

      {/* --- LOBO ANIMADO (CORREGIDO: Z-INDEX ALTO Y POSICIÓN FIJA) --- */}
      <motion.div
        initial={{ y: 200 }}
        animate={{ 
          y: [200, 0, 0, 0, 200], // Sube, espera, baja
        }}
        transition={{ 
          duration: 15, 
          repeat: Infinity, 
          repeatDelay: 3,
          times: [0, 0.1, 0.8, 0.9, 1]
        }}
        // Z-50 para asegurar que esté encima de todo, pero pointer-events-none para no bloquear clics
        className="fixed bottom-0 right-[-20px] z-50 w-40 md:w-56 pointer-events-none filter drop-shadow-2xl"
      >
        <img 
          src="https://res.cloudinary.com/dkoocok3j/image/upload/v1764451372/lobo_sin_fondo_navidad_Mesa_de_trabajo_1_copia_5_r4cl8x.png" 
          alt="Lobo Santa" 
          className="w-full h-auto"
        />
      </motion.div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <HeaderMain
          onNavigate={onNavigate}
          onOpenMatricula={() => onNavigate('registro-leadership')}
          onCartClick={() => {}}
          cartItemsCount={0}
        />

        {/* Padding bottom extra grande para que el lobo no tape el botón final */}
        <main className="flex-grow flex flex-col items-center justify-center px-4 pt-28 pb-48">
          
          {/* --- CABECERA DE TEXTO --- */}
          <div className="text-center mb-8 max-w-2xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-block mb-4">
                <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-red-800 border border-red-400 text-white text-xs font-bold tracking-[0.2em] uppercase shadow-lg">
                  🎅 Evento Fin de Año
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-tight drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]" 
                  style={{ fontFamily: 'serif' }}>
                Gran Clausura <br/>
                <span className="text-[#FFD700]">Navideña AMAS</span>
              </h1>
              <p className="text-white/90 text-base md:text-xl font-medium max-w-md mx-auto leading-relaxed drop-shadow-md">
                Celebremos juntos el esfuerzo de la manada.
              </p>
            </motion.div>
          </div>

          {isSubmitted ? (
            // --- VISTA CONFIRMACIÓN ---
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md bg-[#fffbf0] border-4 border-[#d4af37] rounded-3xl p-8 text-center shadow-2xl text-[#1a0505]"
            >
              <div className="mb-6 flex justify-center">
                {formData.asistencia === 'confirmado' ? (
                  <div className="w-20 h-20 bg-[#165b33] rounded-full flex items-center justify-center shadow-lg animate-bounce text-white">
                    <PartyPopper className="w-10 h-10" />
                  </div>
                ) : (
                   <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center shadow-lg">
                     <CheckCircle className="w-10 h-10 text-gray-500" />
                   </div>
                )}
              </div>

              <h2 className="text-2xl font-bold text-[#c41e3a] mb-3 font-serif">
                {formData.asistencia === 'confirmado' ? '¡Confirmado!' : 'Gracias por avisar'}
              </h2>

              <p className="text-gray-700 mb-8 text-lg leading-relaxed">
                {formData.asistencia === 'confirmado' 
                  ? 'Tu lugar en la manada está reservado. ¡Te esperamos para celebrar!'
                  : 'Entendido. Te extrañaremos en esta ocasión.'}
              </p>

              <Button
                onClick={() => onNavigate('home')}
                className="w-full bg-[#d4af37] hover:bg-amber-500 text-black font-bold py-4 rounded-xl shadow-lg transition-all"
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
              // Cambiamos el fondo a algo más sólido y claro (tipo carta) para contraste máximo
              className="w-full max-w-md bg-[#1a1a1a]/95 backdrop-blur-md border-2 border-[#d4af37] rounded-3xl p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden"
            >
              {/* Cinta decorativa superior */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-[#d4af37] to-red-600" />

              <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                
                {/* 1. DATOS */}
                <div className="space-y-5">
                   <h3 className="text-[#d4af37] font-bold text-sm uppercase tracking-widest border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" /> Datos de Registro
                  </h3>
                  
                  <div className="grid gap-4">
                    <div>
                      <Label className="text-white/80 mb-1.5 block text-sm font-medium ml-1">Nombre del Alumno</Label>
                      <Input
                        placeholder="Ej: Sebastián González"
                        value={formData.nombre_alumno}
                        onChange={(e) => handleInputChange('nombre_alumno', e.target.value)}
                        className={`bg-white/5 border-white/10 text-white h-12 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] rounded-xl placeholder:text-white/30 ${formErrors.nombre_alumno ? 'border-red-500/80' : ''}`}
                      />
                    </div>

                    <div>
                      <Label className="text-white/80 mb-1.5 block text-sm font-medium ml-1">Nombre del Apoderado</Label>
                      <Input
                        placeholder="Tu nombre completo"
                        value={formData.nombre_padre}
                        onChange={(e) => handleInputChange('nombre_padre', e.target.value)}
                        className={`bg-white/5 border-white/10 text-white h-12 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] rounded-xl placeholder:text-white/30 ${formErrors.nombre_padre ? 'border-red-500/80' : ''}`}
                      />
                    </div>

                    <div>
                      <Label className="text-white/80 mb-1.5 block text-sm font-medium ml-1">Correo Electrónico</Label>
                      <Input
                        type="email"
                        placeholder="contacto@email.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`bg-white/5 border-white/10 text-white h-12 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] rounded-xl placeholder:text-white/30 ${formErrors.email ? 'border-red-500/80' : ''}`}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. ASISTENCIA (BOTONES VIBRANTES) */}
                <div className="pt-2">
                  <Label className="text-[#d4af37] text-lg font-bold block text-center mb-4 uppercase tracking-wide">
                    ¿Asistirán al evento?
                  </Label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* BOTÓN SÍ: Dorado Vibrante */}
                    <button
                      type="button"
                      onClick={() => handleAttendance('confirmado')}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 active:scale-95 ${
                        formData.asistencia === 'confirmado'
                          ? 'bg-[#d4af37] border-[#d4af37] text-black shadow-[0_0_20px_rgba(212,175,55,0.5)] transform scale-105'
                          : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10 hover:border-[#d4af37] hover:text-white'
                      }`}
                    >
                      <div className={`p-2 rounded-full ${formData.asistencia === 'confirmado' ? 'bg-black/10' : 'bg-transparent'}`}>
                        <CalendarHeart className="w-7 h-7" />
                      </div>
                      <span className="font-black text-sm sm:text-base uppercase">¡SÍ, VAMOS!</span>
                    </button>

                    {/* BOTÓN NO: Blanco/Gris Sutil */}
                    <button
                      type="button"
                      onClick={() => handleAttendance('no_asistire')}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 active:scale-95 ${
                        formData.asistencia === 'no_asistire'
                          ? 'bg-white border-white text-red-600 shadow-lg'
                          : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10 hover:border-white hover:text-white'
                      }`}
                    >
                      <div className={`p-2 rounded-full ${formData.asistencia === 'no_asistire' ? 'bg-red-100' : 'bg-transparent'}`}>
                        <XCircle className="w-7 h-7" />
                      </div>
                      <span className="font-black text-sm sm:text-base uppercase">NO PODRÉ</span>
                    </button>
                  </div>
                  {formErrors.asistencia && <p className="text-red-400 text-xs text-center mt-2 font-medium">⚠️ Por favor selecciona una opción</p>}
                </div>

                {/* MENSAJE "NO PODRÉ" (Con margen corregido) */}
                <AnimatePresence>
                  {formData.asistencia === 'no_asistire' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 24 }} // mt-6 = 24px
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
                        <div className="flex justify-center mb-2">
                          <Frown className="w-8 h-8 text-amber-400" />
                        </div>
                        <p className="text-white/90 text-sm leading-relaxed">
                          ¡Qué pena que no puedan acompañarnos! <br/>
                          Nos hubiera encantado verlos ahí. <br/>
                          <span className="text-[#d4af37] font-medium block mt-2">¡Les deseamos una muy feliz Navidad! 🎄</span>
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 3. DESEOS (Solo si confirma) */}
                <AnimatePresence>
                  {formData.asistencia === 'confirmado' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 32 }} // mt-8
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="overflow-hidden pt-2 border-t border-white/10"
                    >
                      <div className="bg-[#d4af37]/10 border-l-4 border-[#d4af37] p-4 rounded-r-lg mb-4">
                        <h4 className="text-[#d4af37] font-bold text-sm uppercase flex items-center gap-2 mb-1">
                          <Gift className="w-4 h-4" /> Misión Intercambio
                        </h4>
                        <p className="text-white/80 text-xs">
                          Ayuda al "Amigo Secreto" con 3 opciones. <span className="text-white font-bold">Ref. mínima: S/ 40.</span>
                        </p>
                      </div>

                      <div className="space-y-3">
                        {[1, 2, 3].map((num) => (
                          <div key={num} className="relative">
                            <Star className="absolute left-3 top-3.5 w-4 h-4 text-[#d4af37]/60" />
                            <Input
                              placeholder={`Opción de regalo ${num}...`}
                              value={formData[`deseo_${num}` as keyof typeof formData]}
                              onChange={(e) => handleInputChange(`deseo_${num}`, e.target.value)}
                              className="bg-white/5 border-white/10 text-white focus:border-[#d4af37] h-11 pl-10 text-sm rounded-xl placeholder:text-white/20"
                            />
                          </div>
                        ))}
                      </div>
                      {formErrors.deseos && <p className="text-red-400 text-xs text-center mt-2">⚠️ {formErrors.deseos}</p>}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* BOTÓN DE ENVÍO (NUEVO DISEÑO ROJO/DORADO) */}
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black text-lg py-7 rounded-xl shadow-lg shadow-amber-500/20 uppercase tracking-widest transition-all hover:scale-[1.02] mt-6 border-b-4 border-orange-800 active:border-b-0 active:translate-y-1 relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting ? 'Enviando...' : 'ENVIAR RESPUESTA'}
                  </span>
                </Button>

              </form>
            </motion.div>
          )}

          <div className="mt-12 text-center z-10">
            <p className="text-[#d4af37]/50 text-[10px] font-bold uppercase tracking-[0.2em]">
              AMAS Team Wolf • Navidad 2025
            </p>
          </div>

        </main>

        <FooterMain
          onNavigate={onNavigate}
          onOpenMatricula={() => onNavigate('registro-leadership')}
        />
      </div>
    </div>
  );
}
