import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Lock, Mail, Eye, EyeOff, ArrowLeft, User, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface InicioSesionPageProps {
  onNavigate: (page: string) => void;
}

export function InicioSesionPage({ onNavigate }: InicioSesionPageProps) {
  const { login, register } = useAuth();
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validaciones básicas
    if (!formData.email || !formData.password) {
      setError('Por favor completa todos los campos');
      setIsLoading(false);
      return;
    }

    try {
      if (isFirstTime) {
        // Modo registro (primera vez)
        if (formData.password !== formData.confirmPassword) {
          setError('Las contraseñas no coinciden');
          setIsLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres');
          setIsLoading(false);
          return;
        }

        const result = await register(formData.email, formData.password);

        if (result.success) {
          toast.success('Contraseña establecida correctamente');
          // Intentar login automático
          const loginResult = await login(formData.email, formData.password);
          if (loginResult.success) {
            toast.success('¡Bienvenido a la familia Wolf!');
            onNavigate('perfil');
          } else {
            setIsFirstTime(false);
            setFormData({ ...formData, password: '', confirmPassword: '' });
          }
        } else {
          setError(result.message || 'Error al establecer contraseña');
        }
      } else {
        // Modo login normal
        const result = await login(formData.email, formData.password);

        if (result.success) {
          if (result.requirePasswordChange) {
            setIsFirstTime(true);
            setFormData({ ...formData, password: '', confirmPassword: '' });
            toast.info('Por favor establece tu contraseña por primera vez');
          } else {
            toast.success('¡Bienvenido de nuevo!');
            onNavigate('perfil');
          }
        } else {
          setError(result.message || 'Email o contraseña incorrectos');
        }
      }
    } catch (err) {
      setError('Ocurrió un error inesperado. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (error) setError('');
  };

  const toggleMode = () => {
    setIsFirstTime(!isFirstTime);
    setError('');
    setFormData({ ...formData, password: '', confirmPassword: '' });
  };

  return (
    <div className="min-h-[100dvh] relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-6 bg-black">
      {/* Background gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black" />
        <div
          className="absolute top-0 left-0 w-full h-[50vh] opacity-30"
          style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(250, 123, 33, 0.2) 0%, transparent 70%)'
          }}
        />
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col">
        {/* Botón volver flotante */}
        <div className="absolute -top-16 left-0 sm:fixed sm:top-8 sm:left-8">
          <Button
            onClick={() => onNavigate('home')}
            variant="ghost"
            className="text-white/60 hover:text-[#FCA929] hover:bg-[#FA7B21]/10 gap-2 pl-2"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Volver al inicio</span>
          </Button>
        </div>

        {/* Logo y título */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FA7B21] to-[#FCA929] shadow-lg shadow-orange-500/20 mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            AMAS Team Wolf
          </h1>
          <p className="text-white/60 text-sm sm:text-base">
            Portal exclusivo para familias
          </p>
        </motion.div>

        {/* Card Principal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="border-[#FA7B21]/20 bg-zinc-900/60 backdrop-blur-xl shadow-2xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl text-white text-center flex items-center justify-center gap-2">
                {isFirstTime ? (
                  <>
                    <Sparkles className="h-5 w-5 text-[#FA7B21]" />
                    Crear Contraseña
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </CardTitle>
              <CardDescription className="text-center text-white/50">
                {isFirstTime
                  ? 'Establece una contraseña segura para tu cuenta'
                  : 'Ingresa con tu correo registrado'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/80 text-sm font-medium ml-1">
                    Correo electrónico
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 group-focus-within:text-[#FA7B21] transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="ejemplo@correo.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`pl-12 h-12 bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:border-[#FA7B21] focus:ring-[#FA7B21]/20 rounded-xl transition-all ${
                        error && !formData.email ? 'border-red-500/50 bg-red-500/5' : ''
                      }`}
                      disabled={isLoading}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <Label htmlFor="password" className="text-white/80 text-sm font-medium">
                      {isFirstTime ? 'Nueva contraseña' : 'Contraseña'}
                    </Label>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 group-focus-within:text-[#FA7B21] transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={isFirstTime ? 'Mínimo 6 caracteres' : '••••••••'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`pl-12 pr-12 h-12 bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:border-[#FA7B21] focus:ring-[#FA7B21]/20 rounded-xl transition-all ${
                        error ? 'border-red-500/50 bg-red-500/5' : ''
                      }`}
                      disabled={isLoading}
                      required
                      autoComplete={isFirstTime ? 'new-password' : 'current-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-0 bottom-0 px-4 text-white/40 hover:text-white hover:bg-white/5 rounded-r-xl transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password (Animated) */}
                <AnimatePresence>
                  {isFirstTime && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2 pt-2">
                        <Label htmlFor="confirmPassword" className="text-white/80 text-sm font-medium ml-1">
                          Confirmar contraseña
                        </Label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 group-focus-within:text-[#FA7B21] transition-colors" />
                          <Input
                            id="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Repite tu contraseña"
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            className="pl-12 h-12 bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:border-[#FA7B21] focus:ring-[#FA7B21]/20 rounded-xl transition-all"
                            disabled={isLoading}
                            required
                            autoComplete="new-password"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400 py-3 rounded-lg">
                        <AlertDescription className="flex items-center gap-2 text-sm">
                          <span className="text-lg">⚠️</span> {error}
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white font-semibold text-base shadow-lg shadow-[#FA7B21]/20 hover:shadow-[#FA7B21]/40 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Procesando...</span>
                    </div>
                  ) : (
                    isFirstTime ? 'Guardar y Acceder' : 'Ingresar al Portal'
                  )}
                </Button>

                {/* Toggle Mode */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-sm text-white/50 hover:text-[#FCA929] transition-colors py-2 px-4 rounded-lg hover:bg-white/5"
                  >
                    {isFirstTime 
                      ? '¿Ya tienes una contraseña? Inicia sesión' 
                      : '¿Es tu primera vez? Crea tu contraseña'}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer info */}
        <p className="text-white/30 text-xs text-center mt-8 max-w-xs mx-auto">
          Si tienes problemas para acceder, contacta a administración en la academia.
        </p>
      </div>
    </div>
  );
}
