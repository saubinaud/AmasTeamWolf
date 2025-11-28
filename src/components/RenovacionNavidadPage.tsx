import { useState, useEffect } from 'react';
import { HeaderMain } from './HeaderMain';
import { FooterMain } from './FooterMain';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { Calendar, Gift, Rocket, Dumbbell, CheckCircle, Mail, Phone as PhoneIcon, MessageSquare } from 'lucide-react';

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
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
                    <span className="text-white/70">Información de tus días extras de diciembre</span>
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
                  className="bg-gradient-to-r from-red-700 to-yellow-600 hover:from-red-800 hover:to-yellow-700 text-white font-bold px-8 py-6 text-lg shadow-xl shadow-red-900/30"
                >
                  Renovar ahora
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
                <div className="text-center mb-8">
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                    Separa tu cupo ahora
                  </h2>
                  <p className="text-lg text-white/70">
                    Completa estos datos y nos contactaremos contigo <br />
                    en las próximas 24 horas para confirmar todo.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-zinc-900/80 backdrop-blur-sm border border-[#FA7B21]/30 rounded-xl p-6 sm:p-8">
                  <div className="space-y-6">
                    {/* Nombre del padre */}
                    <div>
                      <label htmlFor="nombre_padre" className="block text-white font-medium mb-2">
                        Nombre del padre/tutor <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="nombre_padre"
                        type="text"
                        placeholder="Ej: María González"
                        value={formData.nombre_padre}
                        onChange={(e) => handleInputChange('nombre_padre', e.target.value)}
                        className={`bg-zinc-800 border-zinc-700 text-white placeholder:text-white/40 ${
                          formErrors.nombre_padre ? 'border-red-500' : ''
                        }`}
                        disabled={isSubmitting}
                      />
                      {formErrors.nombre_padre && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.nombre_padre}</p>
                      )}
                    </div>

                    {/* Nombre del alumno */}
                    <div>
                      <label htmlFor="nombre_alumno" className="block text-white font-medium mb-2">
                        Nombre del alumno <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="nombre_alumno"
                        type="text"
                        placeholder="Ej: Sebastián González"
                        value={formData.nombre_alumno}
                        onChange={(e) => handleInputChange('nombre_alumno', e.target.value)}
                        className={`bg-zinc-800 border-zinc-700 text-white placeholder:text-white/40 ${
                          formErrors.nombre_alumno ? 'border-red-500' : ''
                        }`}
                        disabled={isSubmitting}
                      />
                      {formErrors.nombre_alumno && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.nombre_alumno}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-white font-medium mb-2">
                        Correo electrónico <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Ej: maria.gonzalez@gmail.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`bg-zinc-800 border-zinc-700 text-white placeholder:text-white/40 ${
                          formErrors.email ? 'border-red-500' : ''
                        }`}
                        disabled={isSubmitting}
                      />
                      {formErrors.email && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                      )}
                    </div>

                    {/* Plan */}
                    <div>
                      <label htmlFor="plan" className="block text-white font-medium mb-2">
                        ¿Qué plan te interesa renovar? <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={formData.plan}
                        onValueChange={(value) => handleInputChange('plan', value)}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger
                          className={`bg-zinc-800 border-zinc-700 text-white ${
                            formErrors.plan ? 'border-red-500' : ''
                          }`}
                        >
                          <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3-meses">3 meses</SelectItem>
                          <SelectItem value="6-meses">6 meses</SelectItem>
                          <SelectItem value="no-decido">Aún no decido</SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors.plan && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.plan}</p>
                      )}
                    </div>

                    {/* Experiencia (opcional) */}
                    <div>
                      <label htmlFor="experiencia" className="block text-white font-medium mb-2">
                        ¿Cómo ha sido tu experiencia hasta ahora?
                      </label>
                      <Select
                        value={formData.experiencia}
                        onValueChange={(value) => handleInputChange('experiencia', value)}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excelente">Excelente</SelectItem>
                          <SelectItem value="buena">Buena</SelectItem>
                          <SelectItem value="podria-mejorar">Podría mejorar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Comentario (opcional) */}
                    <div>
                      <label htmlFor="comentario" className="block text-white font-medium mb-2">
                        ¿Tienes algún comentario o sugerencia de mejora?
                      </label>
                      <Textarea
                        id="comentario"
                        placeholder="Escribe aquí si hay algo que quieras compartir con nosotros..."
                        value={formData.comentario}
                        onChange={(e) => handleInputChange('comentario', e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-white/40 min-h-[100px]"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-red-700 to-yellow-600 hover:from-red-800 hover:to-yellow-700 text-white font-bold py-6 text-lg shadow-xl shadow-red-900/30"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Enviando...' : 'Asegurar mi renovación'}
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
