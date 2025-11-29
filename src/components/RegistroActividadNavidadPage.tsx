import { useState, useEffect } from 'react';
import { HeaderMain } from './HeaderMain';
import { FooterMain } from './FooterMain';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Gift, CheckCircle, Mail, User, Sparkles, PartyPopper, XCircle, CalendarHeart, Star, Snowflake } from 'lucide-react';
import { motion } from 'motion/react';

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
        body: JSON.stringify({ ...formData, timestamp: new Date().toISOString(), source: 'landing_navidad_card_v3' }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        toast.success('¡Registro enviado a Polo Norte! 🎄');
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

  // Estilos para la nieve CSS
  const snowStyles = `
    @keyframes snowfall {
      0% { transform: translateY(-10vh); }
      100% { transform: translateY(110vh); }
    }
    .snowflake {
      position: absolute;
      top: -10vh;
      color: #fff;
      opacity: 0.8;
      pointer-events: none;
      animation: snowfall linear infinite;
    }
  `;

  return (
    <div className="min-h-screen bg-[#1a0505] relative overflow-x-hidden font-sans selection:bg-[#d4af37] selection:text-black">
      <style>{snowStyles}</style>
      
      {/* --- FONDOS Y EFECTOS DE NIEVE --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Fondo base oscuro */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2a0a0a] via-[#3a0a0a] to-black" />
        
        {/* Destellos de luces rojas y doradas */}
        <div className="absolute top-[-20%] left-[-20%] w-[70vw] h-[70vw] bg-red-600/20 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[70vw] h-[70vw] bg-[#d4af37]/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '3s' }} />

        {/* Capas de Nieve CSS */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="snowflake"
            style={{
              left: `${Math.random() * 100}vw`,
              animationDuration: `${Math.random() * 10 + 10}s`,
              animationDelay: `${Math.random() * 5}s`,
              fontSize: `${Math.random() * 10 + 10}px`,
              opacity: Math.random() * 0.5 + 0.3
            }}
          >
            ❄
          </div>
        ))}
        {[...Array(15)].map((_, i) => (
          <div
            key={`small-${i}`}
            className="snowflake text-amber-200/50"
            style={{
              left: `${Math.random() * 100}vw`,
              animationDuration: `${Math.random() * 15 + 15}s`,
              animationDelay: `${Math.random() * 5}s`,
              fontSize: `${Math.random() * 5 + 5}px`,
            }}
          >
            .
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

        <div className="container mx-auto px-4 pt-32 pb-20 flex justify-center">
          
          {/* --- CONTENEDOR TIPO TARJETA --- */}
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative max-w-2xl w-full"
          >
            {/* IMAGEN DEL LOBO SANTA (ASOMÁNDOSE) */}
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-64 md:w-72 z-20 pointer-events-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
              <img 
                src="https://res.cloudinary.com/dkoocok3j/image/upload/v1764451372/lobo_sin_fondo_navidad_Mesa_de_trabajo_1_copia_5_r4cl8x.png" 
                alt="Santa Wolf" 
                className="w-full h-auto animate-in slide-in-from-bottom-10 duration-1000"
              />
            </div>

            {/* CUERPO DE LA TARJETA */}
            <div className="bg-gradient-to-b from-[#5a0a0a] to-[#2a0a0a] border-[8px] border-[#d4af37] rounded-[3rem] shadow-[0_20px_60px_rgba(212,175,55,0.2),inset_0_0_30px_rgba(0,0,0,0.5)] overflow-hidden relative pt-36 px-6 sm:px-10 pb-10">
              
              {/* Decoración de esquinas internas */}
              <div className="absolute top-4 left-4 text-[#d4af37]/30"><Sparkles /></div>
              <div className="absolute top-4 right-4 text-[#d4af37]/30"><Sparkles /></div>
              <div className="absolute bottom-4 left-4 text-[#d4af37]/30"><Snowflake /></div>
              <div className="absolute bottom-4 right-4 text-[#d4af37]/30"><Snowflake /></div>

              {isSubmitted ? (
                // --- VISTA CONFIRMACIÓN (DENTRO DE LA TARJETA) ---
                <div className="text-center animate-in fade-in duration-500">
                  <div className="mb-6 inline-block relative">
                    <div className="absolute inset-0 bg-[#d4af37] blur-xl opacity-30 animate-pulse" />
                    {formData.asistencia === 'confirmado' ? (
                      <PartyPopper className="w-20 h-20 text-[#d4af37] relative z-10" />
                    ) : (
                      <CheckCircle className="w-20 h-20 text-zinc-400 relative z-10" />
                    )}
                  </div>

                  <h2 className="text-3xl sm:text-4xl font-extrabold text-[#d4af37] mb-4 uppercase tracking-wide" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    {formData.asistencia === 'confirmado' ? '¡Registro Confirmado!' : 'Gracias por avisar'}
                  </h2>

                  <p className="text-white/90 mb-8 text-lg font-medium leading-relaxed">
                    {formData.asistencia === 'confirmado' 
                      ? 'Tu pase para la Gran Clausura Navideña está listo. ¡Ho ho ho, nos vemos pronto!'
                      : 'Esperamos verte en el próximo evento de la manada. ¡Felices fiestas!'}
                  </p>

                  <Button
                    onClick={() => onNavigate('home')}
                    className="w-full bg-gradient-to-r from-[#d4af37] to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black font-bold py-6 rounded-2xl shadow-lg shadow-[#d4af37]/20 transition-all"
                  >
                    Volver al Inicio
                  </Button>
                </div>
              ) : (
                // --- FORMULARIO (DENTRO DE LA TARJETA) ---
                <div className="text-center">
                  <h1 className="text-4xl sm:text-5xl font-extrabold text-[#d4af37] mb-4 uppercase tracking-tight" style={{ textShadow: '0 3px 6px rgba(0,0,0,0.5)' }}>
                    Gran Clausura <br />
                    Navideña
                  </h1>
                  <div className="w-24 h-1 bg-[#d4af37] mx-auto rounded-full mb-6" />
                  <p className="text-white/90text-lg mb-10 font-medium">
                    Celebra el cierre del año con la manada. Premiación, show y el gran intercambio.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-8 text-left">
                    
                    {/* Datos */}
                    <div className="space-y-5 bg-black/30 p-6 rounded-2xl border border-[#d4af37]/30">
                      <h3 className="text-[#d4af37] font-bold text-lg flex items-center gap-2 mb-4">
                        <User className="w-5 h-5" /> Datos de Registro
                      </h3>
                      <div className="grid gap-4">
                        <div>
                          <Input
                            placeholder="Nombre del Alumno"
                            value={formData.nombre_alumno}
                            onChange={(e) => handleInputChange('nombre_alumno', e.target.value)}
                            className={`bg-[#2a0a0a] border-[#d4af37]/50 text-white h-12 focus:border-[#d4af37] rounded-xl placeholder:text-white/40 text-center font-medium ${formErrors.nombre_alumno ? 'border-red-500' : ''}`}
                          />
                        </div>
                        <div>
                          <Input
                            placeholder="Nombre del Apoderado"
                            value={formData.nombre_padre}
                            onChange={(e) => handleInputChange('nombre_padre', e.target.value)}
                            className={`bg-[#2a0a0a] border-[#d4af37]/50 text-white h-12 focus:border-[#d4af37] rounded-xl placeholder:text-white/40 text-center font-medium ${formErrors.nombre_padre ? 'border-red-500' : ''}`}
                          />
                        </div>
                        <div>
                          <Input
                            type="email"
                            placeholder="Correo Electrónico"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className={`bg-[#2a0a0a] border-[#d4af37]/50 text-white h-12 focus:border-[#d4af37] rounded-xl placeholder:text-white/40 text-center font-medium ${formErrors.email ? 'border-red-500' : ''}`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Asistencia */}
                    <div className="pt-2">
                      <Label className="text-[#d4af37] text-xl font-bold block text-center mb-6 flex justify-center items-center gap-2">
                        <Sparkles className="w-5 h-5" /> ¿Asistirán al evento? <Sparkles className="w-5 h-5" />
                      </Label>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => handleAttendance('confirmado')}
                          className={`relative p-5 rounded-2xl border-4 transition-all duration-300 flex flex-col items-center gap-2 group ${
                            formData.asistencia === 'confirmado'
                              ? 'bg-[#d4af37] border-[#d4af37] text-black shadow-[0_0_25px_rgba(212,175,55,0.5)] scale-[1.02]'
                              : 'bg-black/40 border-[#d4af37]/50 hover:bg-black/60 hover:border-[#d4af37]'
                          }`}
                        >
                          <CalendarHeart className={`w-10 h-10 ${formData.asistencia === 'confirmado' ? 'text-black' : 'text-[#d4af37]'}`} />
                          <span className={`block font-black text-xl uppercase ${formData.asistencia === 'confirmado' ? 'text-black' : 'text-[#d4af37]'}`}>¡Sí, vamos!</span>
                          {formData.asistencia === 'confirmado' && (
                             <div className="absolute top-2 right-2 text-black"><CheckCircle className="w-6 h-6" /></div>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAttendance('no_asistire')}
                          className={`relative p-5 rounded-2xl border-4 transition-all duration-300 flex flex-col items-center gap-2 group ${
                            formData.asistencia === 'no_asistire'
                              ? 'bg-red-900 border-red-600 text-white'
                              : 'bg-black/40 border-red-900/50 hover:bg-black/60 hover:border-red-700'
                          }`}
                        >
                          <XCircle className={`w-10 h-10 ${formData.asistencia === 'no_asistire' ? 'text-white' : 'text-red-500'}`} />
                          <span className={`block font-black text-xl uppercase ${formData.asistencia === 'no_asistire' ? 'text-white' : 'text-red-500'}`}>No podré</span>
                        </button>
                      </div>
                      {formErrors.asistencia && <p className="text-red-400 text-sm text-center mt-3 bg-red-950/80 py-1 rounded font-medium">{formErrors.asistencia}</p>}
                    </div>

                    {/* Deseos */}
                    {formData.asistencia === 'confirmado' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-5 pt-6 border-t-2 border-[#d4af37]/30"
                      >
                        <div className="bg-[#d4af37]/20 p-4 rounded-xl border-l-4 border-[#d4af37]">
                          <h3 className="text-[#d4af37] font-bold text-lg flex items-center gap-2 mb-1">
                            <Gift className="w-6 h-6" /> Misión: Intercambio
                          </h3>
                          <p className="text-white/90 text-sm font-medium">
                            Ayuda al "Amigo Secreto" con 3 opciones. <span className="text-[#d4af37] font-bold block">Ref. mínima: S/ 40.</span>
                          </p>
                        </div>

                        <div className="space-y-4">
                          {[1, 2, 3].map((num) => (
                            <div key={num} className="relative">
                              <Star className="absolute left-3 top-3.5 w-5 h-5 text-[#d4af37]" />
                              <Input
                                placeholder={`Opción de regalo ${num}...`}
                                value={formData[`deseo_${num}` as keyof typeof formData]}
                                onChange={(e) => handleInputChange(`deseo_${num}`, e.target.value)}
                                className="bg-[#2a0a0a] border-[#d4af37]/50 text-white pl-10 h-12 focus:border-[#d4af37] rounded-xl placeholder:text-white/40 font-medium"
                              />
                            </div>
                          ))}
                          {formErrors.deseos && <p className="text-red-400 text-sm pl-2 font-medium">{formErrors.deseos}</p>}
                        </div>
                      </motion.div>
                    )}

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-[#d4af37] to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black font-black text-xl py-7 rounded-2xl shadow-lg shadow-[#d4af37]/30 transition-all hover:scale-[1.02] mt-6 border-2 border-[#d4af37]/50 uppercase tracking-wider"
                    >
                      {isSubmitting ? 'Enviando a Santa...' : (formData.asistencia === 'confirmado' ? '🎄 Confirmar Asistencia' : 'Enviar Respuesta')}
                    </Button>

                  </form>
                </div>
              )}
            </div>
             <p className="text-center text-[#d4af37]/60 text-sm mt-8 font-bold uppercase tracking-widest">
              AMAS Team Wolf • Navidad 2025
            </p>
          </motion.div>
        </div>

        <FooterMain
          onNavigate={onNavigate}
          onOpenMatricula={() => onNavigate('registro-leadership')}
        />
      </div>
    </div>
  );
}
