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
      // Scroll al error
      const errorElement = document.querySelector('.text-red-400');
      errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('https://pallium-n8n.s6hx3x.easypanel.host/webhook/asistencia-evento-navidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, timestamp: new Date().toISOString(), source: 'landing_navidad_v5_final' }),
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
    }
  `;

  return (
    <div className="min-h-screen relative overflow-x-hidden font-sans selection:bg-[#d4af37] selection:text-black bg-[#051810]">
      <style>{snowStyles}</style>
      
      {/* --- FONDO CONTROLADO --- */}
      <div className="fixed inset-0 z-0">
        {/* Imagen de fondo */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://res.cloudinary.com/dkoocok3j/image/upload/v1764452535/Green_Red_Festive_Christmas_Card_w0ox9n.png')`,
          }}
        />
        {/* Capa oscura para legibilidad */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
        
        {/* Nieve */}
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

        <div className="container mx-auto px-4 pt-24 pb-24 flex flex-col items-center min-h-screen">
          
          {/* --- 1. LOBO (HEADER CENTRADO) --- 
              Tamaño controlado, no tapa nada, actúa como "Logo del evento"
          */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-6 relative z-20 w-40 h-40 md:w-48 md:h-48"
          >
             <img 
                src="https://res.cloudinary.com/dkoocok3j/image/upload/v1764451372/lobo_sin_fondo_navidad_Mesa_de_trabajo_1_copia_5_r4cl8x.png" 
                alt="Lobo Santa" 
                className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(255,215,0,0.4)]"
              />
          </motion.div>

          {/* --- 2. TEXTO DE BIENVENIDA (La referencia que pediste) --- */}
          <div className="text-center mb-8 max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Gracias por ser parte de <br/>
              <span className="text-[#d4af37]">AMAS Team Wolf</span>
            </h1>
            <p className="text-white/80 text-lg md:text-xl font-medium">
              La Navidad llega antes para quienes entrenan con nosotros.
            </p>
            <p className="text-white/60 text-sm md:text-base mt-2">
              Celebra el cierre del año con la premiación, show en vivo y el gran intercambio de regalos.
            </p>
          </div>

          {isSubmitted ? (
            /* --- CONFIRMACIÓN --- */
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-md w-full bg-[#0f172a]/90 backdrop-blur-xl border border-[#d4af37] rounded-2xl p-8 text-center shadow-2xl"
            >
              <div className="mb-6 flex justify-center">
                {formData.asistencia === 'confirmado' ? (
                  <div className="w-16 h-16 bg-[#d4af37] rounded-full flex items-center justify-center text-black">
                    <PartyPopper className="w-8 h-8" />
                  </div>
                ) : (
                   <CheckCircle className="w-16 h-16 text-zinc-500" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-[#d4af37] mb-3">
                {formData.asistencia === 'confirmado' ? '¡Confirmado!' : 'Gracias'}
              </h2>
              <p className="text-white/80 mb-6">
                {formData.asistencia === 'confirmado' 
                  ? 'Tu registro ha sido exitoso. ¡Nos vemos en la fiesta!'
                  : 'Entendido. Te extrañaremos en esta ocasión.'}
              </p>
              <Button onClick={() => onNavigate('home')} className="w-full bg-[#d4af37] text-black hover:bg-amber-500">
                Volver al Inicio
              </Button>
            </motion.div>
          ) : (
            /* --- 3. FORMULARIO OPTIMIZADO (Cuadrado y Centrado) --- */
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              // max-w-lg hace que no sea tan ancho, se ve más cuadrado y elegante
              className="w-full max-w-lg bg-black/60 backdrop-blur-md border border-[#d4af37]/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
            >
              {/* Detalle decorativo superior */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-80" />

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Datos (Inputs) */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-white/90 text-sm ml-1 mb-1.5 block">Nombre del Alumno</Label>
                    <Input
                      placeholder="Ej: Sebastián González"
                      value={formData.nombre_alumno}
                      onChange={(e) => handleInputChange('nombre_alumno', e.target.value)}
                      className={`bg-white/5 border-white/10 text-white focus:border-[#d4af37] rounded-xl h-11 ${formErrors.nombre_alumno ? 'border-red-500' : ''}`}
                    />
                  </div>
                  <div>
                    <Label className="text-white/90 text-sm ml-1 mb-1.5 block">Nombre del Apoderado</Label>
                    <Input
                      placeholder="Tu nombre completo"
                      value={formData.nombre_padre}
                      onChange={(e) => handleInputChange('nombre_padre', e.target.value)}
                      className={`bg-white/5 border-white/10 text-white focus:border-[#d4af37] rounded-xl h-11 ${formErrors.nombre_padre ? 'border-red-500' : ''}`}
                    />
                  </div>
                  <div>
                    <Label className="text-white/90 text-sm ml-1 mb-1.5 block">Correo Electrónico</Label>
                    <Input
                      type="email"
                      placeholder="Para la confirmación"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`bg-white/5 border-white/10 text-white focus:border-[#d4af37] rounded-xl h-11 ${formErrors.email ? 'border-red-500' : ''}`}
                    />
                  </div>
                </div>

                {/* Asistencia */}
                <div>
                  <Label className="text-[#d4af37] text-base font-bold text-center block mb-4 uppercase tracking-wider">
                    ¿Asistirán al evento?
                  </Label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleAttendance('confirmado')}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                        formData.asistencia === 'confirmado'
                          ? 'bg-[#d4af37] border-[#d4af37] text-black shadow-lg scale-[1.02]'
                          : 'bg-transparent border-white/20 text-white/60 hover:border-[#d4af37]/50'
                      }`}
                    >
                      <CalendarHeart className="w-6 h-6" />
                      <span className="font-bold text-sm">¡SÍ, VAMOS!</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAttendance('no_asistire')}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                        formData.asistencia === 'no_asistire'
                          ? 'bg-red-900/50 border-red-500 text-white'
                          : 'bg-transparent border-white/20 text-white/60 hover:border-red-500/50'
                      }`}
                    >
                      <XCircle className="w-6 h-6" />
                      <span className="font-bold text-sm">NO PODRÉ</span>
                    </button>
                  </div>
                  {formErrors.asistencia && <p className="text-red-400 text-xs text-center mt-2">⚠️ Selecciona una opción</p>}
                </div>

                {/* Deseos (Expandible) */}
                <AnimatePresence>
                  {formData.asistencia === 'confirmado' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 pt-2 overflow-hidden"
                    >
                      <div className="bg-[#d4af37]/10 border border-[#d4af37]/20 p-3 rounded-lg flex gap-3 items-center">
                        <Gift className="w-8 h-8 text-[#d4af37]" />
                        <p className="text-white/80 text-xs leading-tight">
                          <strong className="text-[#d4af37] block mb-0.5">Misión Intercambio</strong>
                          Ayuda al "Amigo Secreto" con 3 opciones (Min. S/ 40).
                        </p>
                      </div>

                      <div className="space-y-2">
                        {[1, 2, 3].map((num) => (
                          <Input
                            key={num}
                            placeholder={`Opción de regalo ${num}...`}
                            value={formData[`deseo_${num}` as keyof typeof formData]}
                            onChange={(e) => handleInputChange(`deseo_${num}`, e.target.value)}
                            className="bg-white/5 border-white/10 text-white focus:border-[#d4af37] h-10 text-sm rounded-lg"
                          />
                        ))}
                      </div>
                      {formErrors.deseos && <p className="text-red-400 text-xs text-center">⚠️ {formErrors.deseos}</p>}
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#d4af37] to-amber-600 hover:from-[#e6c200] hover:to-amber-700 text-black font-bold text-lg py-6 rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
                >
                  {isSubmitting ? 'Enviando...' : 'ENVIAR RESPUESTA'}
                </Button>

              </form>
            </motion.div>
          )}

          <div className="mt-8 text-center z-10">
            <p className="text-[#d4af37]/40 text-xs font-medium uppercase tracking-widest">
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
