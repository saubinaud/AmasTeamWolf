import { useState, useEffect } from 'react';
import { HeaderMain } from './HeaderMain';
import { FooterMain } from './FooterMain';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { Calendar, Gift, Rocket, Dumbbell, CheckCircle, Mail, Phone as PhoneIcon, MessageSquare, Clock, Users, Sparkles } from 'lucide-react';

interface RenovacionNavidadPageProps {
  onNavigate: (page: string) => void;
}

export function RenovacionNavidadPage({ onNavigate }: RenovacionNavidadPageProps) {
  const [formData, setFormData] = useState({
    nombre_padre: '',
    nombre_alumno: '',
    email: '',
    plan: '',
    experiencia: '',
    comentario: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.nombre_padre.trim()) {
      errors.nombre_padre = 'Este campo es obligatorio';
    }

    if (!formData.nombre_alumno.trim()) {
      errors.nombre_alumno = 'Este campo es obligatorio';
    }

    if (!formData.email.trim()) {
      errors.email = 'Este campo es obligatorio';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Por favor ingresa un email válido';
    }

    if (!formData.plan) {
      errors.plan = 'Por favor selecciona un plan';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    setIsSubmitting(true);

    try {
      const webhookData = {
        nombre_padre: formData.nombre_padre,
        nombre_alumno: formData.nombre_alumno,
        email: formData.email,
        plan: formData.plan,
        experiencia: formData.experiencia || 'No especificado',
        comentario: formData.comentario || 'Sin comentarios',
        timestamp: new Date().toISOString(),
        source: 'landing_renovacion_navidad'
      };

      const response = await fetch('https://pallium-n8n.s6hx3x.easypanel.host/webhook/renovaciones-navidad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      });

      if (response.ok) {
        setIsSubmitted(true);
        toast.success('¡Renovación pre-registrada exitosamente!');
        // Scroll to confirmation section
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      } else {
        throw new Error('Error al enviar el formulario');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Hubo un error al enviar el formulario. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToForm = () => {
    const formElement = document.getElementById('formulario-renovacion');
    if (formElement) {
      const yOffset = -100; // Offset para el header
      const y = formElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with Christmas gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950/30 to-black" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(circle at 20% 50%, rgba(139, 0, 0, 0.3) 0%, transparent 50%)'
          }}
        />
        <div
          className="absolute inset-0 opacity-25"
          style={{
            background: 'radial-gradient(circle at 80% 50%, rgba(218, 165, 32, 0.25) 0%, transparent 60%)'
          }}
        />
        {/* Snowflakes effect - subtle */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              radial-gradient(2px 2px at 20% 30%, white, transparent),
              radial-gradient(2px 2px at 60% 70%, white, transparent),
              radial-gradient(1px 1px at 50% 50%, white, transparent),
              radial-gradient(1px 1px at 80% 10%, white, transparent),
              radial-gradient(2px 2px at 90% 60%, white, transparent)
            `,
            backgroundSize: '200px 200px, 300px 300px, 250px 250px, 400px 400px, 350px 350px'
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
          // Confirmation Section
          <div className="min-h-screen flex items-center justify-center px-4 py-20">
            <div className="max-w-2xl w-full bg-zinc-900/80 backdrop-blur-sm border border-green-500/30 rounded-2xl p-8 sm:p-12 text-center">
              <div className="mb-6">
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                ¡Listo! Tu renovación está pre-registrada
              </h2>

              <div className="bg-black/40 rounded-lg p-6 mb-6 text-left">
                <p className="text-white/80 mb-4">En las próximas 24 horas recibirás:</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-[#FCA929] mt-0.5 flex-shrink-0" />
                    <span className="text-white/70">Confirmación por email con detalle de tu plan</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <PhoneIcon className="w-5 h-5 text-[#FCA929] mt-0.5 flex-shrink-0" />
                    <span className="text-white/70">Mensaje de WhatsApp para coordinar el pago</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Gift className="w-5 h-5 text-[#FCA929] mt-0.5 flex-shrink-0" />
                    <span className="text-white/70">Información de tus días de regalo</span>
                  </div>
                </div>
              </div>

              <p className="text-white/50 text-sm mb-6">
                Revisa tu bandeja de correo (y spam, por las dudas).
              </p>

              <Button
                onClick={() => onNavigate('home')}
                className="bg-[#FA7B21] hover:bg-[#FA7B21]/90 text-white px-8 py-6 text-lg"
              >
                Volver al inicio
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <section className="pt-32 pb-16 px-4">
              <div className="container mx-auto max-w-4xl text-center">
                {/* Christmas Wolf Icon - placeholder */}
                <div className="mb-8 relative inline-block">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-red-900 to-yellow-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-red-900/50">
                    <span className="text-6xl sm:text-7xl">🐺</span>
                  </div>
                  {/* Christmas hat decoration */}
                  <div className="absolute -top-2 -right-2">
                    <span className="text-4xl">🎅</span>
                  </div>
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
                  🎄 Gracias por ser parte de <br />
                  <span
                    className="inline-block mt-2"
                    style={{
                      background: 'linear-gradient(135deg, #FA7B21 0%, #FCA929 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    AMAS Team Wolf
                  </span>
                </h1>

                <p className="text-xl sm:text-2xl text-white/80 mb-4">
                  La Navidad llega antes para quienes entrenan con nosotros.
                </p>

                <p className="text-lg sm:text-xl text-white/70 mb-8">
                  Renueva ahora y recibe días extras que solo verás esta temporada.
                </p>

                <Button
                  onClick={scrollToForm}
                  size="lg"
                  className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-bold px-10 py-7 text-xl shadow-2xl shadow-red-600/50 border-2 border-red-400/30 animate-pulse hover:animate-none transition-all hover:scale-105"
                >
                  🎁 Renovar ahora
                </Button>
              </div>
            </section>

            {/* Why Renew Section */}
            <section className="py-16 px-4 bg-black/30">
              <div className="container mx-auto max-w-6xl">
                <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-12">
                  ¿Por qué renovar ahora?
                </h2>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Block 1 */}
                  <div className="bg-zinc-900/80 backdrop-blur-sm border border-[#FA7B21]/30 rounded-xl p-6 text-center hover:border-[#FA7B21]/60 transition-all">
                    <div className="mb-4">
                      <Calendar className="w-12 h-12 text-[#FCA929] mx-auto" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">
                      Aseguras tu horario preferido
                    </h3>
                    <p className="text-white/70">
                      No todos los cupos estarán disponibles en enero.
                    </p>
                  </div>

                  {/* Block 2 */}
                  <div className="bg-zinc-900/80 backdrop-blur-sm border border-[#FA7B21]/30 rounded-xl p-6 text-center hover:border-[#FA7B21]/60 transition-all">
                    <div className="mb-4">
                      <Gift className="w-12 h-12 text-[#FCA929] mx-auto" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">
                      Días extras que no se repetirán
                    </h3>
                    <p className="text-white/70">
                      Esta promoción es única de temporada navideña.
                    </p>
                  </div>

                  {/* Block 3 */}
                  <div className="bg-zinc-900/80 backdrop-blur-sm border border-[#FA7B21]/30 rounded-xl p-6 text-center hover:border-[#FA7B21]/60 transition-all">
                    <div className="mb-4">
                      <Rocket className="w-12 h-12 text-[#FCA929] mx-auto" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">
                      Evitas el proceso de reinscripción
                    </h3>
                    <p className="text-white/70">
                      Sin trámites en temporada alta.
                    </p>
                  </div>

                  {/* Block 4 */}
                  <div className="bg-zinc-900/80 backdrop-blur-sm border border-[#FA7B21]/30 rounded-xl p-6 text-center hover:border-[#FA7B21]/60 transition-all">
                    <div className="mb-4">
                      <Dumbbell className="w-12 h-12 text-[#FCA929] mx-auto" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">
                      Continuidad en su desarrollo
                    </h3>
                    <p className="text-white/70">
                      Tu hijo/a no pierde el ritmo de su progreso.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Form Section */}
            <section id="formulario-renovacion" className="py-16 px-4">
              <div className="container mx-auto max-w-2xl">
                {/* Urgency badges */}
                <div className="flex flex-wrap justify-center gap-3 mb-6">
                  <div className="bg-red-600/20 border border-red-500/50 rounded-full px-4 py-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-red-400" />
                    <span className="text-red-300 text-sm font-semibold">Promoción válida hasta fin de mes</span>
                  </div>
                  <div className="bg-yellow-600/20 border border-yellow-500/50 rounded-full px-4 py-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-300 text-sm font-semibold">Cupos limitados</span>
                  </div>
                </div>

                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600/30 to-orange-600/30 border border-red-500/40 rounded-lg px-4 py-2 mb-4">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-300 font-bold text-sm uppercase tracking-wide">Acceso Exclusivo</span>
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                    Separa tu cupo ahora
                  </h2>
                  <p className="text-lg text-white/70">
                    Completa estos datos y nos contactaremos contigo <br />
                    en las próximas 24 horas para confirmar todo.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-zinc-900/95 backdrop-blur-sm border-2 border-[#FA7B21]/50 rounded-xl p-6 sm:p-8 shadow-2xl shadow-red-900/30">
                  <div className="space-y-8">
                    {/* Datos del Tutor */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                        <div className="text-2xl">👤</div>
                        <h3 className="text-[#FCA929] font-bold text-lg">Datos del Tutor</h3>
                      </div>

                      <div>
                        <Label htmlFor="nombre_padre" className="text-white mb-2 block text-base">
                          Nombre del padre/tutor <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="nombre_padre"
                          type="text"
                          placeholder="Ej: María González"
                          value={formData.nombre_padre}
                          onChange={(e) => handleInputChange('nombre_padre', e.target.value)}
                          className={`bg-zinc-800/80 border-zinc-700 text-white placeholder:text-white/40 h-12 ${
                            formErrors.nombre_padre ? 'border-red-500' : ''
                          }`}
                          disabled={isSubmitting}
                        />
                        {formErrors.nombre_padre && (
                          <p className="text-red-400 text-sm mt-1.5 flex items-center gap-1">
                            <span>⚠️</span>
                            {formErrors.nombre_padre}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="email" className="text-white mb-2 block text-base">
                          Correo electrónico <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Ej: maria.gonzalez@gmail.com"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={`bg-zinc-800/80 border-zinc-700 text-white placeholder:text-white/40 h-12 ${
                            formErrors.email ? 'border-red-500' : ''
                          }`}
                          disabled={isSubmitting}
                        />
                        {formErrors.email && (
                          <p className="text-red-400 text-sm mt-1.5 flex items-center gap-1">
                            <span>⚠️</span>
                            {formErrors.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Datos del Alumno */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                        <div className="text-2xl">🥋</div>
                        <h3 className="text-[#FCA929] font-bold text-lg">Datos del Alumno</h3>
                      </div>

                      <div>
                        <Label htmlFor="nombre_alumno" className="text-white mb-2 block text-base">
                          Nombre del alumno <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="nombre_alumno"
                          type="text"
                          placeholder="Ej: Sebastián González"
                          value={formData.nombre_alumno}
                          onChange={(e) => handleInputChange('nombre_alumno', e.target.value)}
                          className={`bg-zinc-800/80 border-zinc-700 text-white placeholder:text-white/40 h-12 ${
                            formErrors.nombre_alumno ? 'border-red-500' : ''
                          }`}
                          disabled={isSubmitting}
                        />
                        {formErrors.nombre_alumno && (
                          <p className="text-red-400 text-sm mt-1.5 flex items-center gap-1">
                            <span>⚠️</span>
                            {formErrors.nombre_alumno}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Plan de Renovación */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                        <div className="text-2xl">🎁</div>
                        <h3 className="text-[#FCA929] font-bold text-lg">Plan de Renovación</h3>
                      </div>

                      <div>
                        <div className="text-white mb-4 block text-base font-semibold">
                          ¿Qué plan te interesa renovar? <span className="text-red-500">*</span>
                        </div>
                        <div className="space-y-3">
                          {/* Plan 3 Meses */}
                          <button
                            type="button"
                            onClick={() => handleInputChange('plan', '3-meses')}
                            disabled={isSubmitting}
                            className={`w-full text-left p-5 rounded-lg border-2 transition-all ${
                              formData.plan === '3-meses'
                                ? 'bg-[#FA7B21]/20 border-[#FA7B21] shadow-lg shadow-[#FA7B21]/30'
                                : 'bg-zinc-800/80 border-zinc-700 hover:border-[#FA7B21]/50 hover:bg-zinc-800'
                            } ${formErrors.plan ? 'border-red-500' : ''}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex flex-col gap-2 flex-1">
                                <span className="font-bold text-[#FCA929] text-lg">Plan 3 Meses - S/ 869</span>
                                <span className="text-sm text-white/80 flex items-center gap-2">
                                  <Gift className="w-4 h-4" />
                                  + 15 días de regalo
                                </span>
                              </div>
                              {formData.plan === '3-meses' && (
                                <CheckCircle className="w-6 h-6 text-[#FA7B21] flex-shrink-0" />
                              )}
                            </div>
                          </button>

                          {/* Plan 6 Meses */}
                          <button
                            type="button"
                            onClick={() => handleInputChange('plan', '6-meses')}
                            disabled={isSubmitting}
                            className={`w-full text-left p-5 rounded-lg border-2 transition-all ${
                              formData.plan === '6-meses'
                                ? 'bg-[#FA7B21]/20 border-[#FA7B21] shadow-lg shadow-[#FA7B21]/30'
                                : 'bg-zinc-800/80 border-zinc-700 hover:border-[#FA7B21]/50 hover:bg-zinc-800'
                            } ${formErrors.plan ? 'border-red-500' : ''}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex flex-col gap-2 flex-1">
                                <span className="font-bold text-[#FCA929] text-lg">Plan 6 Meses - S/ 1,620</span>
                                <div className="space-y-1">
                                  <span className="text-sm text-white/80 flex items-center gap-2">
                                    <Gift className="w-4 h-4" />
                                    + 30 días de regalo
                                  </span>
                                  <span className="text-sm text-green-400 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    + Implemento de regalo
                                  </span>
                                </div>
                              </div>
                              {formData.plan === '6-meses' && (
                                <CheckCircle className="w-6 h-6 text-[#FA7B21] flex-shrink-0" />
                              )}
                            </div>
                          </button>

                          {/* Aún no decido */}
                          <button
                            type="button"
                            onClick={() => handleInputChange('plan', 'no-decido')}
                            disabled={isSubmitting}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                              formData.plan === 'no-decido'
                                ? 'bg-[#FA7B21]/20 border-[#FA7B21] shadow-lg shadow-[#FA7B21]/30'
                                : 'bg-zinc-800/80 border-zinc-700 hover:border-[#FA7B21]/50 hover:bg-zinc-800'
                            } ${formErrors.plan ? 'border-red-500' : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-white/70">Aún no decido</span>
                              {formData.plan === 'no-decido' && (
                                <CheckCircle className="w-5 h-5 text-[#FA7B21]" />
                              )}
                            </div>
                          </button>
                        </div>
                        {formErrors.plan && (
                          <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                            <span>⚠️</span>
                            {formErrors.plan}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Feedback Opcional */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                        <div className="text-2xl">💭</div>
                        <h3 className="text-[#FCA929] font-bold text-lg">Tu Opinión (Opcional)</h3>
                      </div>

                      <div>
                        <div className="text-white mb-4 block text-base font-semibold">
                          ¿Cómo ha sido tu experiencia hasta ahora?
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Excelente */}
                          <button
                            type="button"
                            onClick={() => handleInputChange('experiencia', 'excelente')}
                            disabled={isSubmitting}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              formData.experiencia === 'excelente'
                                ? 'bg-[#FA7B21]/20 border-[#FA7B21] shadow-lg shadow-[#FA7B21]/30'
                                : 'bg-zinc-800/80 border-zinc-700 hover:border-[#FA7B21]/50 hover:bg-zinc-800'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <span className="text-yellow-400 text-xl">⭐⭐⭐⭐⭐</span>
                              <span className="text-white text-sm font-medium">Excelente</span>
                            </div>
                          </button>

                          {/* Buena */}
                          <button
                            type="button"
                            onClick={() => handleInputChange('experiencia', 'buena')}
                            disabled={isSubmitting}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              formData.experiencia === 'buena'
                                ? 'bg-[#FA7B21]/20 border-[#FA7B21] shadow-lg shadow-[#FA7B21]/30'
                                : 'bg-zinc-800/80 border-zinc-700 hover:border-[#FA7B21]/50 hover:bg-zinc-800'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <span className="text-yellow-400 text-xl">⭐⭐⭐⭐</span>
                              <span className="text-white text-sm font-medium">Buena</span>
                            </div>
                          </button>

                          {/* Podría mejorar */}
                          <button
                            type="button"
                            onClick={() => handleInputChange('experiencia', 'podria-mejorar')}
                            disabled={isSubmitting}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              formData.experiencia === 'podria-mejorar'
                                ? 'bg-[#FA7B21]/20 border-[#FA7B21] shadow-lg shadow-[#FA7B21]/30'
                                : 'bg-zinc-800/80 border-zinc-700 hover:border-[#FA7B21]/50 hover:bg-zinc-800'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <span className="text-yellow-400 text-xl">⭐⭐⭐</span>
                              <span className="text-white text-sm font-medium">Podría mejorar</span>
                            </div>
                          </button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="comentario" className="text-white mb-2 block text-base">
                          ¿Tienes algún comentario o sugerencia de mejora?
                        </Label>
                        <Textarea
                          id="comentario"
                          placeholder="Escribe aquí si hay algo que quieras compartir con nosotros..."
                          value={formData.comentario}
                          onChange={(e) => handleInputChange('comentario', e.target.value)}
                          className="bg-zinc-800/80 border-zinc-700 text-white placeholder:text-white/40 min-h-[120px]"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-bold py-7 text-xl shadow-2xl shadow-red-600/50 border-2 border-red-400/30 hover:scale-105 transition-all"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? '⏳ Enviando...' : '🎁 Asegurar mi renovación'}
                    </Button>

                    {/* Legal text */}
                    <p className="text-white/50 text-sm text-center">
                      Al enviar este formulario, autorizas a AMAS Team Wolf
                      a contactarte para coordinar tu renovación.
                    </p>
                  </div>
                </form>
              </div>
            </section>
          </>
        )}

        <FooterMain
          onNavigate={onNavigate}
          onOpenMatricula={() => onNavigate('registro-leadership')}
        />
      </div>
    </div>
  );
}
