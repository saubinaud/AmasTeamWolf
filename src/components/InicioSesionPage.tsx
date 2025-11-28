import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Lock, Mail, Eye, EyeOff, ArrowLeft, User, Sparkles, ChevronLeft } from 'lucide-react';
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
    <div className="min-h-screen w-full bg-black text-white flex flex-col relative overflow-hidden">
      
      {/* --- BACKGROUND EFFECTS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Gradiente base sutil */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />
        
        {/* Glow naranja superior */}
        <div 
          className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[150%] h-[40vh] opacity-20 blur-[80px]"
          style={{
            background: 'radial-gradient(circle, #FA7B21 0%, transparent 70%)'
          }}
        />

        {/* Grid pattern muy sutil */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* --- HEADER / TOP BAR (Fix para botón volver) --- */}
      <div className="relative z-50 w-full px-4 py-4 sm:py-6 flex justify-start">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-white/70 hover:text-[#FA7B21] transition-colors py-2 px-1 active:scale-95"
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="text-base font-medium">Volver al inicio</span>
        </button>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12 relative z-10">
        
        {/* Logo & Branding */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="relative inline-block mb-4">
            {/* Glow detrás del logo */}
            <div className="absolute inset-0 bg-[#FA7B21] blur-xl opacity-20 rounded-full"></div>
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FA7B21] to-[#E65C0F] flex items-center justify-center shadow-lg shadow-orange-900/40">
              <User className="h-10 w-10 text-white" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            AMAS Team Wolf
          </h1>
          <p className="text-white/50 text-sm">
            Portal exclusivo para familias
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Glow detrás de la tarjeta */}
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-b from-[#FA7B21]/30 to-transparent rounded-2xl blur-md opacity-50"></div>
            
            <Card className="relative bg-[#0F0F0F] border-white/10 shadow-2xl backdrop-blur-xl rounded-2xl overflow-hidden">
              <CardHeader className="pb-2 pt-6">
                <CardTitle className="text-xl sm:text-2xl text-white text-center font-semibold">
                  {isFirstTime ? 'Crear Cuenta' : 'Iniciar Sesión'}
                </CardTitle>
                <CardDescription className="text-center text-white/40 text-sm">
                  {isFirstTime 
                    ? 'Establece tu contraseña segura' 
                    : 'Ingresa tus credenciales para continuar'}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  
                  {/* Email Input */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/80 text-sm pl-1">
                      Correo electrónico
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none flex items-center justify-center">
                        <Mail className="h-5 w-5" />
                      </div>
                      <Input
                        id="email"
                        type="email"
                        placeholder="ejemplo@correo.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#FA7B21] focus:ring-[#FA7B21]/20 rounded-xl transition-all ${
                          error && !formData.email ? 'border-red-500/50' : ''
                        }`}
                        disabled={isLoading}
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white/80 text-sm pl-1">
                      {isFirstTime ? 'Nueva contraseña' : 'Contraseña'}
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none flex items-center justify-center">
                        <Lock className="h-5 w-5" />
                      </div>
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`pl-10 pr-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#FA7B21] focus:ring-[#FA7B21]/20 rounded-xl transition-all ${
                          error ? 'border-red-500/50' : ''
                        }`}
                        disabled={isLoading}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 top-0 bottom-0 px-3 text-white/40 hover:text-white hover:bg-white/5 rounded-r-xl transition-colors flex items-center justify-center"
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
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword" className="text-white/80 text-sm pl-1">
                            Confirmar contraseña
                          </Label>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none flex items-center justify-center">
                              <Lock className="h-5 w-5" />
                            </div>
                            <Input
                              id="confirmPassword"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Repite tu contraseña"
                              value={formData.confirmPassword}
                              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                              className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#FA7B21] focus:ring-[#FA7B21]/20 rounded-xl transition-all"
                              disabled={isLoading}
                              required
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Error Alert */}
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                      <div className="text-red-400 mt-0.5">⚠️</div>
                      <p className="text-red-200 text-sm leading-snug">{error}</p>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-[#FA7B21] to-[#E65C0F] hover:from-[#F36A15] hover:to-[#D9540E] text-white font-semibold text-base shadow-lg shadow-[#FA7B21]/20 rounded-xl transition-all duration-300 active:scale-[0.98] mt-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Procesando...</span>
                      </div>
                    ) : (
                      isFirstTime ? 'Crear Cuenta' : 'Ingresar al Portal'
                    )}
                  </Button>
                </form>

                {/* Toggle Link */}
                <div className="mt-6 pt-6 border-t border-white/5 text-center">
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-sm text-white/50 hover:text-[#FCA929] transition-colors py-2 px-4 rounded-lg hover:bg-white/5 active:bg-white/10"
                  >
                    {isFirstTime 
                      ? '¿Ya tienes cuenta? Inicia sesión' 
                      : '¿Es tu primera vez? Crea tu contraseña'}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Footer Info */}
        <div className="mt-8 text-center px-6">
          <p className="text-white/30 text-xs max-w-xs mx-auto leading-relaxed">
            Si tienes problemas para acceder, por favor contacta a la administración en la academia.
          </p>
        </div>

      </div>
    </div>
  );
}
