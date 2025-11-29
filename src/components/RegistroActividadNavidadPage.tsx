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

  // Scroll al inicio al cargar
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
        body: JSON.stringify({ ...formData, timestamp: new Date().toISOString(), source: 'landing_navidad_v3_festiva' }),
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

  // Estilos CSS para la nieve (optimizado para móviles)
  const snowStyles = `
    @keyframes snowfall {
      0% { transform: translateY(-10vh) translateX(0); opacity: 1; }
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
    <div className="min-h-screen relative overflow-x-hidden font-sans selection:bg-red-200 selection:text-red-900">
      <style>{snowStyles}</style>
      
      {/* --- FONDO NAVIDEÑO --- */}
      <div className="fixed inset-0 z-0">
        {/* Imagen de fondo proporcionada */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://res.cloudinary.com/dkoocok3j/image/upload/v1764452535/Green_Red_Festive_Christmas_Card_w0ox9n.png')`,
          }}
        />
        {/* Overlay suave para mejorar legibilidad */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

        {/* Capas de Nieve CSS (Ligera y rápida) */}
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="snowflake"
            style={{
              left: `${Math.random() * 100}vw`,
              animationDuration: `${Math.random() * 5 + 10}s`, // Más lento para ser relajante
              animationDelay: `${Math.random() * 5}s`,
              fontSize: `${Math.random() * 10 + 8}px`,
              opacity: Math.random() * 0.6 + 0.4
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

        <div className="container mx-auto px-4 pt-28 pb-20 flex justify-center items-center min-h-screen">
          
          {isSubmitted ? (
            // --- VISTA DE CONFIRMACIÓN (Estilo Carta) ---
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-md w-full bg-[#fdfbf7] border-4 border-[#c41e3a] rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden"
            >
              {/* Decoración esquina */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#c41e3a] rounded-bl-full opacity-20" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-[#165b33] rounded-tr-full opacity-20" />

              <div className="mb-6 relative inline-block">
                {formData.asistencia === 'confirmado' ? (
                  <div className="w-20 h-20 bg-[#165b33] rounded-full flex items-center justify-center mx-auto shadow-lg text-white animate-bounce">
                    <PartyPopper className="w-10 h-10" />
                  </div>
                ) : (
                   <CheckCircle className="w-20 h-20 text-gray-400 mx-auto" />
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#c41e3a] mb-4 font-serif">
                {formData.asistencia === 'confirmado' ? '¡Registro Confirmado!' : 'Gracias por avisar'}
              </h2>

              <p className="text-gray-700 mb-8 text-base leading-relaxed font-medium">
                {formData.asistencia === 'confirmado' 
                  ? 'Tu pase para la Gran Clausura Navideña está listo. ¡Prepárate para la magia! 🎄🐺'
                  : 'Entendido. ¡Esperamos verte en el próximo evento de la manada!'}
              </p>

              <Button
                onClick={() => onNavigate('home')}
                className="w-full bg-[#c41e3a] hover:bg-[#a01830] text-white font-bold py-6 rounded-xl shadow-lg transition-all uppercase tracking-wider"
              >
                Volver al Inicio
              </Button>
            </motion.div>
          ) : (
            // --- VISTA DE FORMULARIO (Estilo Carta Navideña) ---
            <div className="w-full max-w-xl">
              
              {/* Lobo Santa Flotante (Animación suave) */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="relative z-20 -mb-12 mx-auto w-48 sm:w-56 drop-shadow-2xl"
              >
                <img 
                  src="https://res.cloudinary.com/dkoocok3j/image/upload/v1764451372/lobo_sin_fondo_navidad_Mesa_de_trabajo_1_copia_5_r4cl8x.png" 
                  alt="Lobo Santa" 
                  className="w-full h-auto"
                />
              </motion.div>

              {/* Tarjeta Principal */}
              <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-[#fdfbf7] rounded-[2rem] shadow-2xl border-t-8 border-[#c41e3a] relative overflow-hidden"
              >
                {/* Borde decorativo interno */}
                <div className="absolute inset-2 border-2 border-[#d4af37] rounded-[1.5rem] pointer-events-none opacity-50" />
                
                <div className="pt-16 pb-8 px-6 sm:px-10 relative z-10">
                  
                  <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-[#c41e3a] mb-2 font-serif">
                      Gran Clausura Navideña
                    </h1>
                    <p className="text-[#165b33] font-medium text-sm sm:text-base uppercase tracking-widest">
                      AMAS Team Wolf • 2025
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* SECCIÓN 1: DATOS (Estilo limpio) */}
                    <div className="space-y-4 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                      <h3 className="text-[#d4af37] font-bold text-sm uppercase tracking-wider flex items-center gap-2 mb-3">
                        <User className="w-4 h-4" /> Datos de Registro
                      </h3>
                      
                      <div className="space-y-3">
                        <div>
                          <Label className="text-gray-600 text-xs font-bold ml-1 uppercase">Alumno</Label>
                          <Input
                            placeholder="Nombre del Alumno"
                            value={formData.nombre_alumno}
                            onChange={(e) => handleInputChange('nombre_alumno', e.target.value)}
                            className={`bg-gray-50 border-gray-200 text-gray-800 h-11 focus:ring-[#c41e3a] focus:border-[#c41e3a] rounded-lg ${formErrors.nombre_alumno ? 'border-red-400 bg-red-50' : ''}`}
                          />
                        </div>
                        <div>
                          <Label className="text-gray-600 text-xs font-bold ml-1 uppercase">Apoderado</Label>
                          <Input
                            placeholder="Tu nombre completo"
                            value={formData.nombre_padre}
                            onChange={(e) => handleInputChange('nombre_padre', e.target.value)}
                            className={`bg-gray-50 border-gray-200 text-gray-800 h-11 focus:ring-[#c41e3a] focus:border-[#c41e3a] rounded-lg ${formErrors.nombre_padre ? 'border-red-400 bg-red-50' : ''}`}
                          />
                        </div>
                        <div>
                          <Label className="text-gray-600 text-xs font-bold ml-1 uppercase">Correo</Label>
                          <Input
                            type="email"
                            placeholder="correo@ejemplo.com"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className={`bg-gray-50 border-gray-200 text-gray-800 h-11 focus:ring-[#c41e3a] focus:border-[#c41e3a] rounded-lg ${formErrors.email ? 'border-red-400 bg-red-50' : ''}`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECCIÓN 2: ASISTENCIA (Botones Claros) */}
                    <div>
                      <Label className="text-[#165b33] font-bold block text-center mb-3 text-lg">
                        ¿Asistirán al evento?
                      </Label>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => handleAttendance('confirmado')}
                          className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all duration-200 ${
                            formData.asistencia === 'confirmado'
                              ? 'bg-[#165b33] border-[#165b33] text-white shadow-lg transform scale-[1.02]'
                              : 'bg-white border-gray-200 text-gray-400 hover:border-[#165b33] hover:text-[#165b33]'
                          }`}
                        >
                          <CalendarHeart className="w-6 h-6" />
                          <span className="font-bold text-sm sm:text-base">¡SÍ, VAMOS!</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAttendance('no_asistire')}
                          className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all duration-200 ${
                            formData.asistencia === 'no_asistire'
                              ? 'bg-[#c41e3a] border-[#c41e3a] text-white shadow-lg'
                              : 'bg-white border-gray-200 text-gray-400 hover:border-[#c41e3a] hover:text-[#c41e3a]'
                          }`}
                        >
                          <XCircle className="w-6 h-6" />
                          <span className="font-bold text-sm sm:text-base">NO PODRÉ</span>
                        </button>
                      </div>
                      {formErrors.asistencia && <p className="text-red-500 text-xs text-center mt-2 font-medium">⚠️ Selecciona una opción</p>}
                    </div>

                    {/* SECCIÓN 3: DESEOS (Fondo Dorado Suave) */}
                    {formData.asistencia === 'confirmado' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-[#fffcf0] border border-[#d4af37]/30 rounded-xl p-5 shadow-sm"
                      >
                        <div className="flex items-center gap-2 mb-3 text-[#d4af37]">
                          <Gift className="w-5 h-5" />
                          <h3 className="font-bold text-sm uppercase tracking-wider">Misión Intercambio</h3>
                        </div>
                        <p className="text-gray-600 text-xs mb-4">
                          Ayuda al "Amigo Secreto" con 3 opciones. <br/>
                          <span className="font-bold text-[#c41e3a]">Referencia mínima: S/ 40.</span>
                        </p>

                        <div className="space-y-3">
                          {[1, 2, 3].map((num) => (
                            <div key={num} className="relative">
                              <Star className="absolute left-3 top-3 w-4 h-4 text-[#d4af37]" />
                              <Input
                                placeholder={`Opción de regalo ${num}...`}
                                value={formData[`deseo_${num}` as keyof typeof formData]}
                                onChange={(e) => handleInputChange(`deseo_${num}`, e.target.value)}
                                className="bg-white border-gray-200 text-gray-800 pl-9 h-10 focus:ring-[#d4af37] focus:border-[#d4af37] rounded-lg text-sm placeholder:text-gray-400"
                              />
                            </div>
                          ))}
                          {formErrors.deseos && <p className="text-red-500 text-xs pl-1 font-medium">⚠️ {formErrors.deseos}</p>}
                        </div>
                      </motion.div>
                    )}

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-[#c41e3a] to-[#a01830] hover:from-[#a01830] hover:to-[#801326] text-white font-bold text-lg py-6 rounded-xl shadow-xl shadow-red-900/20 uppercase tracking-wider transition-transform hover:scale-[1.02]"
                    >
                      {isSubmitting ? 'Enviando a Santa...' : (formData.asistencia === 'confirmado' ? '🎄 Confirmar Asistencia' : 'Enviar Respuesta')}
                    </Button>

                  </form>
                </div>
                
                {/* Decoración inferior */}
                <div className="absolute bottom-0 left-0 w-full h-3 bg-[repeating-linear-gradient(45deg,#165b33,#165b33_10px,#c41e3a_10px,#c41e3a_20px)] opacity-50" />
              </motion.div>
            </div>
          )}
        </div>

        <FooterMain
          onNavigate={onNavigate}
          onOpenMatricula={() => onNavigate('registro-leadership')}
        />
      </div>
    </div>
  );
}
