import { useState, useEffect } from 'react';
import { HeaderMain } from './HeaderMain';
import { FooterMain } from './FooterMain';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Gift, CheckCircle, Mail, User, Sparkles, PartyPopper, XCircle, CalendarHeart, Star, Trophy } from 'lucide-react';

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

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAttendance = (value: 'confirmado' | 'no_asistire') => {
    setFormData(prev => ({ ...prev, asistencia: value }));
    if (formErrors.asistencia) {
      setFormErrors(prev => ({ ...prev, asistencia: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.nombre_padre.trim()) errors.nombre_padre = 'Requerido para el ingreso';
    if (!formData.nombre_alumno.trim()) errors.nombre_alumno = 'Requerido para el certificado';
    
    if (!formData.email.trim()) {
      errors.email = 'Requerido';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (!formData.asistencia) {
      errors.asistencia = 'Por favor confirma tu asistencia para continuar';
    }

    // Si confirma asistencia, validamos deseos para asegurar el intercambio
    if (formData.asistencia === 'confirmado') {
      if (!formData.deseo_1 && !formData.deseo_2 && !formData.deseo_3) {
        errors.deseos = 'Por favor agrega al menos una opción de regalo';
        toast.error('¡Ayuda a Santa! Escribe al menos un deseo para el intercambio.');
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor completa los campos requeridos');
      const firstError = document.querySelector('.text-red-400');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);

    try {
      const webhookData = {
        ...formData,
        timestamp: new Date().toISOString(),
        source: 'landing_navidad_actividad_v2'
      };

      // WEBHOOK ACTUALIZADO
      const response = await fetch('https://pallium-n8n.s6hx3x.easypanel.host/webhook/asistencia-evento-navidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData),
      });

      if (response.ok) {
        setIsSubmitted(true);
        toast.success('¡Registro completado exitosamente!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error('Error al enviar');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Hubo un error de conexión. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* --- Background Effects (Navideño Dark Premium) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#1a0505] to-black" />
        {/* Luces navideñas abstractas (Blur) */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FA7B21]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Patrón sutil de nieve/estrellas */}
        <div className="absolute inset-0 opacity-10" 
          style={{
            backgroundImage: `radial-gradient(white 1px, transparent 1px), radial-gradient(#FA7B21 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            backgroundPosition: '0 0, 25px 25px'
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
          // --- VISTA DE CONFIRMACIÓN (ÉXITO) ---
          <div className="min-h-[80vh] flex items-center justify-center px-4 py-20">
            <div className="max-w-lg w-full bg-zinc-900/90 backdrop-blur-xl border border-[#FA7B21]/30 rounded-2xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
              {/* Confetti Effect background (simulado) */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#FA7B21]/5 to-transparent pointer-events-none" />
              
              <div className="mb-8 relative inline-block">
                <div className="absolute inset-0 bg-[#FA7B21] blur-2xl opacity-30 rounded-full animate-pulse"></div>
                {formData.asistencia === 'confirmado' ? (
                  <div className="w-24 h-24 bg-gradient-to-br from-[#FA7B21] to-red-600 rounded-full flex items-center justify-center mx-auto shadow-lg relative z-10">
                    <PartyPopper className="w-12 h-12 text-white" />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mx-auto shadow-lg relative z-10">
                    <CheckCircle className="w-12 h-12 text-zinc-400" />
                  </div>
                )}
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
                {formData.asistencia === 'confirmado' 
                  ? '¡Registro Confirmado!' 
                  : 'Gracias por avisarnos'}
              </h2>

              <p className="text-white/70 mb-8 text-lg leading-relaxed">
                {formData.asistencia === 'confirmado' 
                  ? <>
                      Tu lugar en la <span className="text-[#FCA929] font-semibold">Gran Clausura Navideña</span> está asegurado. 
                      <br/><br/>
                      <span className="text-sm bg-white/5 py-1 px-3 rounded-full border border-white/10">
                        📧 Te hemos enviado los detalles por correo
                      </span>
                    </>
                  : 'Lamentamos que no puedas acompañarnos esta vez. ¡Nos vemos en el próximo entrenamiento!'}
              </p>

              <Button
                onClick={() => onNavigate('home')}
                className="bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white px-10 py-7 text-lg w-full rounded-xl shadow-lg shadow-orange-900/20"
              >
                Volver al inicio
              </Button>
            </div>
          </div>
        ) : (
          // --- VISTA DE FORMULARIO (VENTA DEL EVENTO) ---
          <div className="container mx-auto max-w-3xl px-4 pt-28 pb-20">
            
            {/* 1. HERO TEXT: Persuasión emocional */}
            <div className="text-center mb-12 relative">
              <div className="inline-flex items-center gap-2 bg-[#FA7B21]/10 border border-[#FA7B21]/30 rounded-full px-4 py-1.5 mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
                <Sparkles className="w-4 h-4 text-[#FCA929]" />
                <span className="text-[#FCA929] text-sm font-bold uppercase tracking-wider">Evento de Fin de Año</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
                La Gran Clausura <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-red-500 via-[#FA7B21] to-[#FCA929] bg-clip-text text-transparent">
                   Navideña AMAS
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed mb-8">
                Más que una fiesta, es el momento de celebrar el esfuerzo, la disciplina y 
                el crecimiento de tu pequeño lobo en este 2025. 
                <span className="block mt-2 text-white font-medium">¡No dejes que se pierda esta experiencia inolvidable!</span>
              </p>

              {/* Benefits Grid (Mini Sales Pitch) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
                {[
                  { icon: <Trophy className="w-5 h-5 text-[#FCA929]" />, text: "Reconocimientos" },
                  { icon: <Gift className="w-5 h-5 text-[#FCA929]" />, text: "Intercambio" },
                  { icon: <PartyPopper className="w-5 h-5 text-[#FCA929]" />, text: "Show en Vivo" },
                  { icon: <Star className="w-5 h-5 text-[#FCA929]" />, text: "Sorpresas" },
                ].map((item, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3 flex flex-col items-center justify-center gap-2 text-center">
                    {item.icon}
                    <span className="text-white/80 text-sm font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. FORM CARD */}
            <div className="bg-zinc-900/80 backdrop-blur-xl border-2 border-[#FA7B21]/20 rounded-2xl p-6 sm:p-10 shadow-2xl shadow-orange-900/20 relative">
              {/* Glow decorativo en la esquina */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#FA7B21]/20 rounded-full blur-[80px] pointer-events-none" />

              <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
                
                {/* SECCIÓN 1: DATOS */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl">📝</div>
                    <div>
                      <h3 className="text-white font-bold text-xl">Registro de Asistencia</h3>
                      <p className="text-white/50 text-sm">Asegura el ingreso de tu familia</p>
                    </div>
                  </div>

                  <div className="grid gap-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="nombre_alumno" className="text-white/90 text-base">Nombre del Alumno</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                          <Input
                            id="nombre_alumno"
                            placeholder="Ej: Sebastián González"
                            value={formData.nombre_alumno}
                            onChange={(e) => handleInputChange('nombre_alumno', e.target.value)}
                            className={`pl-10 h-12 bg-black/40 border-white/20 text-white focus:border-[#FA7B21] focus:ring-[#FA7B21]/20 ${formErrors.nombre_alumno ? 'border-red-500' : ''}`}
                          />
                        </div>
                        {formErrors.nombre_alumno && <p className="text-red-400 text-sm mt-1">{formErrors.nombre_alumno}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nombre_padre" className="text-white/90 text-base">Apoderado Responsable</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                          <Input
                            id="nombre_padre"
                            placeholder="Tu nombre completo"
                            value={formData.nombre_padre}
                            onChange={(e) => handleInputChange('nombre_padre', e.target.value)}
                            className={`pl-10 h-12 bg-black/40 border-white/20 text-white focus:border-[#FA7B21] focus:ring-[#FA7B21]/20 ${formErrors.nombre_padre ? 'border-red-500' : ''}`}
                          />
                        </div>
                        {formErrors.nombre_padre && <p className="text-red-400 text-sm mt-1">{formErrors.nombre_padre}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white/90 text-base">Correo Electrónico</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Para enviarte el pase de ingreso"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={`pl-10 h-12 bg-black/40 border-white/20 text-white focus:border-[#FA7B21] focus:ring-[#FA7B21]/20 ${formErrors.email ? 'border-red-500' : ''}`}
                        />
                      </div>
                      {formErrors.email && <p className="text-red-400 text-sm mt-1">{formErrors.email}</p>}
                    </div>
                  </div>
                </div>

                {/* SECCIÓN 2: DECISIÓN (EL CORAZÓN DE LA VENTA) */}
                <div className="space-y-6 pt-2">
                  <div className="text-center mb-2">
                    <Label className="text-white text-xl font-bold block mb-1">¿Confirmas la asistencia de tu hijo?</Label>
                    <p className="text-white/50 text-sm">Es importante para organizar los grupos y regalos</p>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
                    {/* Botón SÍ - Optimizado para conversión */}
                    <button
                      type="button"
                      onClick={() => handleAttendance('confirmado')}
                      className={`relative group p-6 md:p-8 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-4 overflow-hidden ${
                        formData.asistencia === 'confirmado'
                          ? 'bg-gradient-to-br from-[#FA7B21]/20 to-red-900/20 border-[#FA7B21] shadow-[0_0_40px_rgba(250,123,33,0.3)] scale-[1.02]'
                          : 'bg-zinc-800/30 border-zinc-700 hover:border-[#FA7B21]/50 hover:bg-zinc-800/50'
                      }`}
                    >
                      {/* Efecto de selección */}
                      {formData.asistencia === 'confirmado' && (
                        <div className="absolute top-3 right-3 bg-[#FA7B21] text-white rounded-full p-1 animate-in zoom-in duration-300">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      )}
                      
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-lg ${
                        formData.asistencia === 'confirmado' 
                          ? 'bg-gradient-to-br from-[#FA7B21] to-red-500 text-white scale-110' 
                          : 'bg-zinc-700 text-zinc-400 group-hover:bg-[#FA7B21]/20 group-hover:text-[#FA7B21]'
                      }`}>
                        <CalendarHeart className="w-8 h-8" />
                      </div>
                      
                      <div className="text-center">
                        <span className={`block font-bold text-xl mb-1 ${formData.asistencia === 'confirmado' ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                          ¡Sí, vamos!
                        </span>
                        <span className={`text-sm ${formData.asistencia === 'confirmado' ? 'text-[#FCA929]' : 'text-zinc-500'}`}>
                          No nos lo perdemos 🐺
                        </span>
                      </div>
                    </button>

                    {/* Botón NO - Sutil */}
                    <button
                      type="button"
                      onClick={() => handleAttendance('no_asistire')}
                      className={`relative group p-6 md:p-8 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-4 ${
                        formData.asistencia === 'no_asistire'
                          ? 'bg-red-900/10 border-red-500/50 shadow-none'
                          : 'bg-zinc-800/30 border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50 grayscale opacity-70 hover:opacity-100'
                      }`}
                    >
                       <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                        formData.asistencia === 'no_asistire' ? 'bg-red-900/30 text-red-400' : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        <XCircle className="w-8 h-8" />
                      </div>
                      <div className="text-center">
                        <span className={`block font-bold text-xl mb-1 ${formData.asistencia === 'no_asistire' ? 'text-red-400' : 'text-zinc-500'}`}>
                          No podremos asistir
                        </span>
                        <span className="text-zinc-600 text-sm">
                          Una lástima :(
                        </span>
                      </div>
                    </button>
                  </div>
                  {formErrors.asistencia && <p className="text-red-400 text-sm text-center animate-pulse">{formErrors.asistencia}</p>}
                </div>

                {/* SECCIÓN 3: INTERCAMBIO (EL GANCHO) */}
                {formData.asistencia === 'confirmado' && (
                  <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-top-8 duration-700">
                    
                    {/* Info Box */}
                    <div className="bg-gradient-to-r from-red-900/20 to-[#FA7B21]/10 border border-[#FA7B21]/30 rounded-xl p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                      <div className="w-12 h-12 rounded-full bg-[#FA7B21]/20 flex items-center justify-center text-2xl flex-shrink-0 border border-[#FA7B21]/30">
                        🎁
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">Misión Secreta: El Intercambio</h3>
                        <p className="text-white/70 text-sm mt-1">
                          Para asegurar que todos reciban un regalo increíble, hemos establecido una 
                          <strong className="text-[#FCA929]"> referencia mínima de S/ 40</strong>. 
                          Ayúdanos con 3 opciones que le gustarían a tu hijo/a para guiar al "Amigo Secreto".
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 bg-black/20 p-6 rounded-2xl border border-white/5">
                      <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#FCA929]" /> Lista de Deseos (Opciones sugeridas)
                      </h4>
                      
                      {[1, 2, 3].map((num) => (
                        <div key={num} className="relative">
                          <Label className="text-white/50 absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium pointer-events-none">
                            Opción {num}:
                          </Label>
                          <Input
                            placeholder={`Ej: Set de Lego, Pelota de fútbol, Libro de arte...`}
                            value={formData[`deseo_${num}` as keyof typeof formData]}
                            onChange={(e) => handleInputChange(`deseo_${num}`, e.target.value)}
                            className="bg-zinc-800/80 border-zinc-700 text-white h-12 pl-24 focus:border-[#FA7B21] focus:ring-[#FA7B21]/20 transition-all"
                          />
                        </div>
                      ))}
                      {formErrors.deseos && <p className="text-red-400 text-sm ml-1">{formErrors.deseos}</p>}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full h-auto py-6 text-xl font-bold rounded-xl transition-all duration-300 shadow-2xl ${
                      formData.asistencia === 'confirmado'
                        ? 'bg-gradient-to-r from-[#FA7B21] via-orange-500 to-[#FCA929] hover:scale-[1.02] shadow-orange-500/20 text-white'
                        : formData.asistencia === 'no_asistire'
                        ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        : 'bg-zinc-800 text-white/50 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enviando...
                      </span>
                    ) : (
                      formData.asistencia === 'confirmado' ? '🎄 Confirmar y Guardar Cupo' : 'Enviar Respuesta'
                    )}
                  </Button>
                  
                  {formData.asistencia === 'confirmado' && (
                    <p className="text-center text-white/30 text-sm mt-4">
                      Al confirmar, te comprometes a participar en el intercambio de regalos.
                    </p>
                  )}
                </div>

              </form>
            </div>
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
