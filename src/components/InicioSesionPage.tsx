import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Lock, Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

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
          toast.success('¡Bienvenido! Sesión iniciada correctamente');
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
          // Usuario existe pero no tiene contraseña, cambiar a modo registro
          setIsFirstTime(true);
          setFormData({ ...formData, password: '', confirmPassword: '' });
          toast.info('Por favor establece tu contraseña');
        } else {
          // Login exitoso
          toast.success('¡Bienvenido! Sesión iniciada correctamente');
          onNavigate('perfil');
        }
      } else {
        setError(result.message || 'Email o contraseña incorrectos');
      }
    }

    setIsLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setError(''); // Limpiar error al escribir
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradients - igual que el resto del sitio */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(circle at 20% 50%, rgba(250, 123, 33, 0.15) 0%, transparent 50%)'
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(circle at 80% 50%, rgba(252, 169, 41, 0.2) 0%, transparent 60%)'
          }}
        />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Botón volver */}
        <Button
          onClick={() => onNavigate('home')}
          variant="ghost"
          className="absolute top-8 left-8 text-white/80 hover:text-[#FCA929] hover:bg-[#FA7B21]/10"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver
        </Button>

        {/* Logo y título */}
        <div className="text-center mb-8">
          <h1
            className="text-4xl sm:text-5xl font-bold mb-3"
            style={{
              background: 'linear-gradient(135deg, #FA7B21 0%, #FCA929 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            AMAS Team Wolf
          </h1>
          <p className="text-white/70 text-lg">
            {isFirstTime ? 'Establece tu contraseña' : 'Acceso a familias'}
          </p>
        </div>

        {/* Card de login/registro */}
        <Card className="w-full max-w-md bg-black/60 backdrop-blur-xl border-[#FA7B21]/30 shadow-2xl shadow-[#FA7B21]/10">
          <CardHeader>
            <CardTitle className="text-2xl text-white">
              {isFirstTime ? 'Primera vez' : 'Iniciar sesión'}
            </CardTitle>
            <CardDescription className="text-white/60">
              {isFirstTime
                ? 'Crea una contraseña segura para tu cuenta'
                : 'Ingresa con tu correo electrónico registrado'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/90">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@correo.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10 bg-black/40 border-white/20 text-white placeholder:text-white/30 focus:border-[#FA7B21] focus:ring-[#FA7B21]"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/90">
                  {isFirstTime ? 'Nueva contraseña' : 'Contraseña'}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isFirstTime ? 'Mínimo 6 caracteres' : '••••••••'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-10 pr-10 bg-black/40 border-white/20 text-white placeholder:text-white/30 focus:border-[#FA7B21] focus:ring-[#FA7B21]"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (solo primera vez) */}
              {isFirstTime && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white/90">
                    Confirmar contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Repite tu contraseña"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="pl-10 bg-black/40 border-white/20 text-white placeholder:text-white/30 focus:border-[#FA7B21] focus:ring-[#FA7B21]"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/50 text-red-400">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white shadow-lg shadow-[#FA7B21]/30 hover:shadow-[#FA7B21]/50 transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando...
                  </div>
                ) : (
                  isFirstTime ? 'Establecer contraseña e ingresar' : 'Iniciar sesión'
                )}
              </Button>

              {/* Toggle primera vez */}
              {!isFirstTime && (
                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFirstTime(true);
                      setFormData({ ...formData, password: '', confirmPassword: '' });
                      setError('');
                    }}
                    className="text-sm text-white/60 hover:text-[#FCA929] transition-colors"
                  >
                    ¿Primera vez? Establece tu contraseña aquí
                  </button>
                </div>
              )}

              {isFirstTime && (
                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFirstTime(false);
                      setFormData({ ...formData, password: '', confirmPassword: '' });
                      setError('');
                    }}
                    className="text-sm text-white/60 hover:text-[#FCA929] transition-colors"
                  >
                    ¿Ya tienes contraseña? Inicia sesión aquí
                  </button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Footer info */}
        <p className="text-white/40 text-sm text-center mt-8 max-w-md">
          Si no tienes acceso o has olvidado tu contraseña, contacta con la administración
        </p>
      </div>
    </div>
  );
}
