import { useState, useEffect } from 'react';
import { HeaderMain } from './HeaderMain';
import { FooterMain } from './FooterMain';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Gift, CheckCircle, Mail, User, Sparkles, PartyPopper, XCircle, CalendarHeart, Star, Trophy, Snowflake } from 'lucide-react';
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
      toast.error('¡Ayuda a Santa! Escribe al menos un deseo.');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('https://pallium-n8n.s6hx3x.easypanel.host/webhook/asistencia-evento-navidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, timestamp: new Date().toISOString(), source: 'landing_navidad_v2' }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        toast.success('¡Registro exitoso! 🎄');
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

  return (
    <div className="min-h-screen bg-red-950 relative overflow-x-hidden font-sans selection:bg-amber-500 selection:text-black">
      
      {/* --- FONDOS NAVIDEÑOS ÉPICOS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Imagen de fondo principal (basada en tus referencias) */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay"
          style={{
            // Puedes usar la URL de tu imagen de fondo aquí si la subes, o usar este degradado festivo
            backgroundImage: `url('https://res.cloudinary.com/dkoocok3j/image/upload/v1732975640/Gemini_Generated_Image_6_upscayl_2x_digital-art-4x_f82fdd12-156a-425e-ba38-90d643b19785.jpg')`,
            // Opcional: si no tienes la imagen subida, usa este degradado rojo festivo
            // background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #dc2626 100%)'
          }}
        />

        {/* Capa de color y efectos */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/80 via-red-950/90 to-black" />
        
        {/* Luces doradas y rojas (Blur spots animados) */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-amber-500/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-red-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Nieve cayendo y destellos */}
        <div className="absolute inset-0 opacity-30" 
             style={{ 
               backgroundImage: `
                 radial-gradient(circle at 50% 50%, rgba(255,255,255,0.8) 1px, transparent 1.5px),
                 radial-gradient(circle at 20% 30%, rgba(255,215,0,0.8) 1px, transparent 1.5px),
                 radial-gradient(circle at 80% 70%, rgba(255,255,255,0.8) 1px, transparent 1.5px)
               `,
               backgroundSize: '60px 60px, 90px 90px, 70px 70px',
               backgroundPosition: '0 0, 30px 30px, 15px 15px',
               animation: 'snowfall 20s linear infinite'
             }} 
        />
      </div>

      <div className="relative z-10">
        <HeaderMain
          onNavigate={onNavigate}
          onOpenMatricula={() => onNavigate('registro-leadership')}
          onCartClick={() => {}}
          cartItemsCount={0}
        />

        {isSubmitted ? (
          // --- VISTA DE CONFIRMACIÓN (ESTILO TARJETA DE REGALO) ---
          <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-md w-full bg-gradient-to-b from-red-900 to-red-950 border-4 border-amber-500 rounded-3xl p-8 text-center shadow-[0_0_60px_rgba(251,191,36,0.4)] relative overflow-hidden"
            >
              {/* Decoración esquinas doradas y lazos */}
              <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-l-4 border-amber-500 rounded-tl-3xl opacity-70" />
              <div className="absolute bottom-0 right-0 w-20 h-20 border-b-4 border-r-4 border-amber-500 rounded-br-3xl opacity-70" />
              {/* Lazo superior */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-8 bg-amber-500 rounded-b-lg shadow-lg" />

              <div className="mb-6 relative inline-block">
                {formData.asistencia === 'confirmado' ? (
                  <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-amber-500/50 border-2 border-white/20">
                    <PartyPopper className="w-12 h-12 text-white" />
                  </div>
                ) : (
                   <CheckCircle className="w-24 h-24 text-white/50 mx-auto" />
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-amber-400 mb-4 uppercase tracking-wide flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6" />
                {formData.asistencia === 'confirmado' ? '¡Registro Confirmado!' : 'Gracias por avisar'}
                <Sparkles className="w-6 h-6" />
              </h2>

              <p className="text-white/90 mb-8 text-base leading-relaxed font-medium">
                {formData.asistencia === 'confirmado' 
                  ? 'Tu pase para la Gran Clausura Navideña está listo. ¡Prepárate para una noche mágica! Revisa tu correo para más detalles.'
                  : 'Entendemos. Esperamos verte en el próximo evento de la manada. ¡Felices fiestas!'}
              </p>

              <Button
                onClick={() => onNavigate('home')}
                className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black font-bold py-6 rounded-xl shadow-lg shadow-amber-500/20 transition-all border-2 border-amber-300/50"
              >
                Volver al Inicio
              </Button>
            </motion.div>
          </div>
        ) : (
          // --- VISTA DE FORMULARIO (DISEÑO FESTIVO PREMIUM) ---
          <div className="container mx-auto max-w-2xl px-4 pt-24 pb-20 relative">
            
            {/* Elemento Decorativo: Lobo Navideño (Flotante) */}
            <div className="absolute -top-10 -right-20 w-64 h-64 pointer-events-none opacity-40 hidden md:block">
              <img src="https://res.cloudinary.com/dkoocok3j/image/upload/v1732975640/Gemini_Generated_Image_7_upscayl_4x_digital-art-4x_85a0d7f9-bab6-4084-bc12-23fcb1ed71b9.jpg" alt="Lobo Navideño" className="w-full h-full object-cover rounded-full blur-sm" />
            </div>

            {/* Hero Header */}
            <div className="text-center mb-10 relative z-10">
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="inline-flex items-center gap-2 bg-red-900/50 border-2 border-amber-500/50 rounded-full px-5 py-2 mb-6 backdrop-blur-md shadow-lg shadow-red-900/30"
              >
                <Snowflake className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">Evento Exclusivo 2025</span>
                <Snowflake className="w-4 h-4 text-amber-400" />
              </motion.div>
              
              <motion.h1 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg"
              >
                Gran Clausura <br />
                <span className="bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(251,191,36,0.4)]">
                   Navideña Wolf
                </span>
              </motion.h1>
              
              <p className="text-base sm:text-lg text-white/80 max-w-lg mx-auto leading-relaxed font-medium">
                Celebra el esfuerzo de todo el año en una noche mágica. Premiación, show en vivo y el gran intercambio de regalos.
              </p>
            </div>

            {/* Tarjeta Principal del Formulario (Estilo Regalo) */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-b from-red-900/90 to-red-950/95 backdrop-blur-xl border-4 border-amber-500 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(220,38,38,0.3)] relative z-10"
            >
              {/* Cinta Decorativa Superior */}
              <div className="h-3 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 shadow-md" />

              <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">
                
                {/* SECCIÓN 1: DATOS DEL LOBO */}
                <div className="space-y-5">
                  <h3 className="text-amber-400 font-bold text-xl uppercase tracking-wider flex items-center gap-2 border-b-2 border-amber-500/30 pb-3">
                    <User className="w-6 h-6" /> Datos del Alumno
                  </h3>
                  
                  <div className="grid gap-5">
                    <div>
                      <Label className="text-white/90 mb-2 block font-medium">Nombre del Alumno</Label>
                      <Input
                        placeholder="Ej: Sebastián González"
                        value={formData.nombre_alumno}
                        onChange={(e) => handleInputChange('nombre_alumno', e.target.value)}
                        className={`bg-red-950/50 border-2 border-red-800/50 text-white h-12 focus:border-amber-500 rounded-xl placeholder:text-white/40 ${formErrors.nombre_alumno ? 'border-red-500' : ''}`}
                      />
                      {formErrors.nombre_alumno && <p className="text-red-300 text-xs mt-1 font-medium">{formErrors.nombre_alumno}</p>}
                    </div>

                    <div>
                      <Label className="text-white/90 mb-2 block font-medium">Nombre del Apoderado</Label>
                      <Input
                        placeholder="Tu nombre completo"
                        value={formData.nombre_padre}
                        onChange={(e) => handleInputChange('nombre_padre', e.target.value)}
                        className={`bg-red-950/50 border-2 border-red-800/50 text-white h-12 focus:border-amber-500 rounded-xl placeholder:text-white/40 ${formErrors.nombre_padre ? 'border-red-500' : ''}`}
                      />
                      {formErrors.nombre_padre && <p className="text-red-300 text-xs mt-1 font-medium">{formErrors.nombre_padre}</p>}
                    </div>

                    <div>
                      <Label className="text-white/90 mb-2 block font-medium">Correo Electrónico</Label>
                      <Input
                        type="email"
                        placeholder="Para enviar tu pase"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`bg-red-950/50 border-2 border-red-800/50 text-white h-12 focus:border-amber-500 rounded-xl placeholder:text-white/40 ${formErrors.email ? 'border-red-500' : ''}`}
                      />
                      {formErrors.email && <p className="text-red-300 text-xs mt-1 font-medium">{formErrors.email}</p>}
                    </div>
                  </div>
                </div>

                {/* SECCIÓN 2: CONFIRMACIÓN (Botones Dorados) */}
                <div className="pt-6">
                  <Label className="text-white text-xl font-bold block text-center mb-6 flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    ¿Confirmas la asistencia de tu hijo?
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </Label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleAttendance('confirmado')}
                      className={`relative p-6 rounded-2xl border-4 transition-all duration-300 flex flex-col items-center gap-3 group ${
                        formData.asistencia === 'confirmado'
                          ? 'bg-gradient-to-br from-amber-500/20 to-red-900/40 border-amber-500 shadow-[0_0_30px_rgba(251,191,36,0.3)] scale-[1.02]'
                          : 'bg-red-950/30 border-red-800/50 hover:bg-red-900/40 hover:border-amber-500/50'
                      }`}
                    >
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-lg ${
                        formData.asistencia === 'confirmado' ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white border-2 border-white/20' : 'bg-red-900/50 text-white/50 border-2 border-white/10'
                      }`}>
                        <CalendarHeart className="w-8 h-8" />
                      </div>
                      <div className="text-center">
                        <span className={`block font-bold text-lg ${formData.asistencia === 'confirmado' ? 'text-amber-400' : 'text-white'}`}>¡Sí, vamos!</span>
                        <span className="text-xs text-white/60 font-medium">No nos lo perdemos</span>
                      </div>
                      {formData.asistencia === 'confirmado' && (
                        <div className="absolute top-3 right-3 text-amber-400 bg-white/10 rounded-full p-1"><CheckCircle className="w-6 h-6" /></div>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAttendance('no_asistire')}
                      className={`relative p-6 rounded-2xl border-4 transition-all duration-300 flex flex-col items-center gap-3 group ${
                        formData.asistencia === 'no_asistire'
                          ? 'bg-red-950/50 border-red-500 shadow-inner'
                          : 'bg-red-950/30 border-red-800/50 hover:bg-red-900/40 hover:border-red-500/30'
                      }`}
                    >
                       <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-lg ${
                        formData.asistencia === 'no_asistire' ? 'bg-red-800 text-white border-2 border-white/10' : 'bg-red-900/50 text-white/50 border-2 border-white/10'
                      }`}>
                        <XCircle className="w-8 h-8" />
                      </div>
                      <div className="text-center">
                        <span className={`block font-bold text-lg ${formData.asistencia === 'no_asistire' ? 'text-red-300' : 'text-white/60'}`}>No asistiré</span>
                        <span className="text-xs text-white/40 font-medium">Una lástima :(</span>
                      </div>
                    </button>
                  </div>
                  {formErrors.asistencia && <p className="text-red-300 text-sm text-center mt-3 font-medium bg-red-900/50 py-1 rounded-lg">{formErrors.asistencia}</p>}
                </div>

                {/* SECCIÓN 3: INTERCAMBIO (ANIMADA) */}
                {formData.asistencia === 'confirmado' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-6 pt-8 border-t-2 border-amber-500/30"
                  >
                    <div className="bg-gradient-to-r from-amber-500/20 to-transparent border-l-4 border-amber-500 p-5 rounded-r-xl shadow-sm">
                      <h3 className="text-amber-400 font-bold text-xl flex items-center gap-3 mb-2">
                        <Gift className="w-7 h-7" /> Misión Secreta: El Intercambio
                      </h3>
                      <p className="text-white/90 text-base font-medium">
                        Ayuda al "Amigo Secreto" con 3 opciones de regalo. <span className="text-amber-300 font-bold block mt-1">Referencia mínima: S/ 40.</span>
                      </p>
                    </div>

                    <div className="space-y-5">
                      {[1, 2, 3].map((num) => (
                        <div key={num}>
                          <Label className="text-white/70 mb-2 text-sm ml-1 font-medium flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-500/70" /> Opción {num}
                          </Label>
                          <Input
                            placeholder={`Ej: Set de Lego, Pelota, Libro...`}
                            value={formData[`deseo_${num}` as keyof typeof formData]}
                            onChange={(e) => handleInputChange(`deseo_${num}`, e.target.value)}
                            className="bg-red-950/50 border-2 border-red-800/50 text-white h-12 focus:border-amber-500 rounded-xl placeholder:text-white/40"
                          />
                        </div>
                      ))}
                      {formErrors.deseos && <p className="text-red-300 text-sm font-medium bg-red-900/50 py-1 px-2 rounded-lg">{formErrors.deseos}</p>}
                    </div>
                  </motion.div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black font-extrabold text-xl py-7 rounded-xl shadow-lg shadow-amber-500/30 transition-all hover:scale-[1.02] mt-6 border-2 border-amber-300/50 relative overflow-hidden group"
                >
                  {/* Efecto de brillo en el botón */}
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  <span className="relative flex items-center justify-center gap-2">
                    {isSubmitting ? 'Enviando...' : (formData.asistencia === 'confirmado' ? (<><Sparkles className="w-5 h-5"/> Confirmar Asistencia <Sparkles className="w-5 h-5"/></>) : 'Enviar Respuesta')}
                  </span>
                </Button>

              </form>
            </motion.div>
            
            {/* Footer Text */}
            <p className="text-center text-white/50 text-sm mt-10 font-medium relative z-10">
              AMAS Team Wolf - San Borja <br />
              ¡La manada te espera para celebrar! 🎄🐺
            </p>
          </div>
        )}

        <FooterMain
          onNavigate={onNavigate}
          onOpenMatricula={() => onNavigate('registro-leadership')}
        />
      </div>
    </div>
  );
}
