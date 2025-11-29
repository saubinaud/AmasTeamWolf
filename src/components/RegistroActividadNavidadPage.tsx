import { useState, useEffect } from 'react';
import { HeaderMain } from './HeaderMain';
import { FooterMain } from './FooterMain';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Gift, CheckCircle, Mail, User, Sparkles, PartyPopper, XCircle, CalendarHeart, Star, Trophy } from 'lucide-react';
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
    <div className="min-h-screen bg-[#0f0505] relative overflow-x-hidden font-sans selection:bg-red-500 selection:text-white">
      
      {/* --- FONDOS NAVIDEÑOS MÁGICOS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#2a0a0a] via-[#1a0505] to-black" />
        
        {/* Luces del árbol (Blur spots) */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-red-600/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-amber-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Nieve cayendo */}
        <div className="absolute inset-0 opacity-20" 
             style={{ 
               backgroundImage: `radial-gradient(circle at 50% 50%, white 2px, transparent 2.5px)`,
               backgroundSize: '50px 50px',
               backgroundPosition: '0 0'
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
          // --- CONFIRMACIÓN ---
          <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-md w-full bg-gradient-to-b from-[#1a0505] to-black border-2 border-[#d4af37] rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(212,175,55,0.2)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-[#d4af37] rounded-tl-3xl opacity-50" />
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-[#d4af37] rounded-br-3xl opacity-50" />

              <div className="mb-6 relative inline-block">
                {formData.asistencia === 'confirmado' ? (
                  <div className="w-20 h-20 bg-gradient-to-br from-[#d4af37] to-amber-700 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
                    <PartyPopper className="w-10 h-10 text-white" />
                  </div>
                ) : (
                   <CheckCircle className="w-20 h-20 text-zinc-500 mx-auto" />
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#d4af37] mb-4 uppercase tracking-wide">
                {formData.asistencia === 'confirmado' ? '¡Registro Confirmado!' : 'Gracias por avisar'}
              </h2>

              <p className="text-white/80 mb-8 text-base leading-relaxed">
                {formData.asistencia === 'confirmado' 
                  ? 'Tu pase para la Gran Clausura Navideña está listo. Revisa tu correo para más detalles.'
                  : 'Esperamos verte en el próximo evento de la manada.'}
              </p>

              <Button
                onClick={() => onNavigate('home')}
                className="w-full bg-gradient-to-r from-[#d4af37] to-amber-600 hover:from-amber-400 hover:to-amber-700 text-black font-bold py-6 rounded-xl shadow-lg transition-all"
              >
                Volver al Inicio
              </Button>
            </motion.div>
          </div>
        ) : (
          // --- FORMULARIO ---
          <div className="container mx-auto max-w-2xl px-4 pt-24 pb-20">
            <div className="text-center mb-10 relative">
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="inline-flex items-center gap-2 bg-red-900/30 border border-red-500/30 rounded-full px-5 py-2 mb-6 backdrop-blur-md"
              >
                <Sparkles className="w-4 h-4 text-[#d4af37]" />
                <span className="text-[#d4af37] text-xs font-bold uppercase tracking-widest">Evento Exclusivo 2025</span>
              </motion.div>
              
              <motion.h1 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight"
              >
                Gran Clausura <br />
                <span className="bg-gradient-to-r from-red-500 via-[#d4af37] to-amber-500 bg-clip-text text-transparent drop-shadow-sm">
                   Navideña Wolf
                </span>
              </motion.h1>
              
              <p className="text-base sm:text-lg text-white/70 max-w-lg mx-auto leading-relaxed">
                Celebra el esfuerzo de todo el año. Premiación, show en vivo y el gran intercambio de regalos.
              </p>
            </div>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-[#120505]/90 backdrop-blur-xl border border-red-900/50 rounded-3xl overflow-hidden shadow-2xl shadow-red-900/20"
            >
              <div className="h-2 w-full bg-gradient-to-r from-red-700 via-[#d4af37] to-red-700" />

              <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">
                
                <div className="space-y-5">
                  <h3 className="text-[#d4af37] font-bold text-lg uppercase tracking-wider flex items-center gap-2">
                    <User className="w-5 h-5" /> Datos del Alumno
                  </h3>
                  
                  <div className="grid gap-5">
                    <div>
                      <Label className="text-white/90 mb-2 block">Nombre del Alumno</Label>
                      <Input
                        placeholder="Ej: Sebastián González"
                        value={formData.nombre_alumno}
                        onChange={(e) => handleInputChange('nombre_alumno', e.target.value)}
                        className={`bg-white/5 border-white/10 text-white h-12 focus:border-[#d4af37] rounded-xl ${formErrors.nombre_alumno ? 'border-red-500' : ''}`}
                      />
                      {formErrors.nombre_alumno && <p className="text-red-400 text-xs mt-1">{formErrors.nombre_alumno}</p>}
                    </div>

                    <div>
                      <Label className="text-white/90 mb-2 block">Nombre del Apoderado</Label>
                      <Input
                        placeholder="Tu nombre completo"
                        value={formData.nombre_padre}
                        onChange={(e) => handleInputChange('nombre_padre', e.target.value)}
                        className={`bg-white/5 border-white/10 text-white h-12 focus:border-[#d4af37] rounded-xl ${formErrors.nombre_padre ? 'border-red-500' : ''}`}
                      />
                      {formErrors.nombre_padre && <p className="text-red-400 text-xs mt-1">{formErrors.nombre_padre}</p>}
                    </div>

                    <div>
                      <Label className="text-white/90 mb-2 block">Correo Electrónico</Label>
                      <Input
                        type="email"
                        placeholder="Para enviar tu pase"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`bg-white/5 border-white/10 text-white h-12 focus:border-[#d4af37] rounded-xl ${formErrors.email ? 'border-red-500' : ''}`}
                      />
                      {formErrors.email && <p className="text-red-400 text-xs mt-1">{formErrors.email}</p>}
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Label className="text-white text-lg font-bold block text-center mb-6">
                    ¿Confirmas la asistencia de tu hijo?
                  </Label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleAttendance('confirmado')}
                      className={`relative p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-3 group ${
                        formData.asistencia === 'confirmado'
                          ? 'bg-gradient-to-br from-[#d4af37]/20 to-amber-900/20 border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.15)]'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#d4af37]/50'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                        formData.asistencia === 'confirmado' ? 'bg-[#d4af37] text-black' : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        <CalendarHeart className="w-7 h-7" />
                      </div>
                      <div className="text-center">
                        <span className={`block font-bold text-lg ${formData.asistencia === 'confirmado' ? 'text-[#d4af37]' : 'text-white'}`}>¡Sí, vamos!</span>
                        <span className="text-xs text-white/50">No nos lo perdemos</span>
                      </div>
                      {formData.asistencia === 'confirmado' && (
                        <div className="absolute top-3 right-3 text-[#d4af37]"><CheckCircle className="w-6 h-6" /></div>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAttendance('no_asistire')}
                      className={`relative p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-3 group ${
                        formData.asistencia === 'no_asistire'
                          ? 'bg-red-900/20 border-red-500/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-red-500/30'
                      }`}
                    >
                       <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                        formData.asistencia === 'no_asistire' ? 'bg-red-800 text-white' : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        <XCircle className="w-7 h-7" />
                      </div>
                      <div className="text-center">
                        <span className={`block font-bold text-lg ${formData.asistencia === 'no_asistire' ? 'text-red-400' : 'text-zinc-400'}`}>No asistiré</span>
                        <span className="text-xs text-zinc-600">Una lástima :(</span>
                      </div>
                    </button>
                  </div>
                  {formErrors.asistencia && <p className="text-red-400 text-sm text-center mt-2">{formErrors.asistencia}</p>}
                </div>

                {formData.asistencia === 'confirmado' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-6 pt-6 border-t border-white/10"
                  >
                    <div className="bg-gradient-to-r from-[#d4af37]/10 to-transparent border-l-4 border-[#d4af37] p-4 rounded-r-lg">
                      <h3 className="text-[#d4af37] font-bold text-lg flex items-center gap-2">
                        <Gift className="w-5 h-5" /> Misión Secreta: El Intercambio
                      </h3>
                      <p className="text-white/70 text-sm mt-1">
                        Ayuda al "Amigo Secreto" con 3 opciones de regalo (Referencia mínima: S/ 40).
                      </p>
                    </div>

                    <div className="space-y-4">
                      {[1, 2, 3].map((num) => (
                        <div key={num}>
                          <Label className="text-white/60 mb-1.5 text-sm ml-1">Opción {num}</Label>
                          <Input
                            placeholder={`Ej: Set de Lego, Pelota, Libro...`}
                            value={formData[`deseo_${num}` as keyof typeof formData]}
                            onChange={(e) => handleInputChange(`deseo_${num}`, e.target.value)}
                            className="bg-black/40 border-white/10 text-white h-11 focus:border-[#d4af37] rounded-lg"
                          />
                        </div>
                      ))}
                      {formErrors.deseos && <p className="text-red-400 text-sm">{formErrors.deseos}</p>}
                    </div>
                  </motion.div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#d4af37] to-amber-600 hover:from-amber-400 hover:to-amber-700 text-black font-bold text-lg py-6 rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] mt-4"
                >
                  {isSubmitting ? 'Enviando...' : (formData.asistencia === 'confirmado' ? '✨ Confirmar Asistencia' : 'Enviar Respuesta')}
                </Button>

              </form>
            </motion.div>
            
            <p className="text-center text-white/30 text-sm mt-8">
              AMAS Team Wolf - San Borja <br />
              ¡La manada te espera!
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
