import { useState } from 'react';
import { Lock, ArrowLeft, Mail, KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';

type Step = 'login' | 'request-code' | 'verify-code' | 'set-password';

interface InicioSesionPageProps {
  onNavigate: (page: string) => void;
}

export function InicioSesionPage({ onNavigate }: InicioSesionPageProps) {
  const { login, requestCode, verifyCode, setPassword } = useAuth();

  const [step, setStep] = useState<Step>('login');
  const [dni, setDni] = useState('');
  const [password, setPassword_] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailHint, setEmailHint] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!dni) { setError('Ingresa tu DNI'); return; }
    if (step === 'login' && !password) {
      // First try without password to check if they need to create one
      setLoading(true);
      setError('');
      const result = await login(dni, '');
      setLoading(false);

      if (result.needsPassword) {
        if (result.hasEmail) {
          setStep('request-code');
          setError('');
        } else {
          setError('No tienes correo registrado. Contacta a la academia por WhatsApp.');
        }
        return;
      }
      // If they do have a password, show error asking for it
      setError('Ingresa tu contraseña');
      return;
    }

    setLoading(true);
    setError('');
    const result = await login(dni, password);
    setLoading(false);

    if (result.needsPassword) {
      if (result.hasEmail) {
        setStep('request-code');
        setError('');
      } else {
        setError('No tienes correo registrado. Contacta a la academia por WhatsApp.');
      }
      return;
    }

    if (result.success) {
      onNavigate('perfil');
    } else {
      setError(result.error || 'Error al iniciar sesión');
    }
  };

  const handleRequestCode = async () => {
    setLoading(true);
    setError('');
    const result = await requestCode(dni);
    setLoading(false);

    if (result.success) {
      setEmailHint(result.emailHint || '');
      setStep('verify-code');
    } else {
      setError(result.error || 'Error al enviar código');
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) { setError('Ingresa el código de 6 dígitos'); return; }
    setLoading(true);
    setError('');
    const result = await verifyCode(dni, code);
    setLoading(false);

    if (result.success) {
      setStep('set-password');
      setError('');
    } else {
      setError(result.error || 'Código inválido');
    }
  };

  const handleSetPassword = async () => {
    if (newPassword.length < 6) { setError('Mínimo 6 caracteres'); return; }
    if (newPassword !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }

    setLoading(true);
    setError('');
    const result = await setPassword(dni, code, newPassword);
    setLoading(false);

    if (result.success) {
      onNavigate('perfil');
    } else {
      setError(result.error || 'Error al crear contraseña');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') action();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 py-12 px-4 sm:px-6 md:px-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[400px] h-[400px] bg-[#FA7B21]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-[#FCA929]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-md w-full">
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-[#FA7B21] to-[#FCA929] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#FA7B21]/30">
              <span className="text-4xl">🐺</span>
            </div>
            <h2 className="text-2xl font-bold text-white">
              {step === 'login' && 'Iniciar Sesión'}
              {step === 'request-code' && 'Crear tu acceso'}
              {step === 'verify-code' && 'Verificar correo'}
              {step === 'set-password' && 'Crear contraseña'}
            </h2>
            <p className="mt-2 text-white/60 text-sm">
              {step === 'login' && 'Ingresa con tu DNI de apoderado'}
              {step === 'request-code' && 'Te enviaremos un código a tu correo registrado'}
              {step === 'verify-code' && `Ingresa el código enviado a ${emailHint}`}
              {step === 'set-password' && 'Elige una contraseña para tu cuenta'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Step: Login */}
          {step === 'login' && (
            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-1.5">DNI del apoderado</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={15}
                  value={dni}
                  onChange={e => setDni(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => handleKeyDown(e, handleLogin)}
                  placeholder="Ej: 12345678"
                  className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#FA7B21]/50 focus:ring-1 focus:ring-[#FA7B21]/30 transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-1.5">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword_(e.target.value)}
                    onKeyDown={e => handleKeyDown(e, handleLogin)}
                    placeholder="Tu contraseña"
                    className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#FA7B21]/50 focus:ring-1 focus:ring-[#FA7B21]/30 transition-colors pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                onClick={handleLogin}
                disabled={loading || !dni}
                className="w-full bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white font-semibold py-6 text-lg shadow-lg shadow-[#FA7B21]/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Lock className="w-5 h-5 mr-2" />}
                Entrar
              </Button>

              <button
                onClick={() => {
                  if (!dni) { setError('Primero ingresa tu DNI'); return; }
                  setError('');
                  setStep('request-code');
                }}
                className="w-full text-center text-[#FCA929]/80 hover:text-[#FCA929] text-sm transition-colors pt-2"
              >
                Primera vez? Crear mi acceso
              </button>
            </div>
          )}

          {/* Step: Request Code */}
          {step === 'request-code' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#FA7B21]/10 border border-[#FA7B21]/20 rounded-lg">
                <p className="text-white/80 text-sm">
                  <Mail className="w-4 h-4 inline mr-2 text-[#FCA929]" />
                  Enviaremos un código de verificación al correo registrado para el DNI <strong className="text-white">{dni}</strong>.
                </p>
              </div>

              <Button
                onClick={handleRequestCode}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white font-semibold py-6 text-lg shadow-lg shadow-[#FA7B21]/30 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Mail className="w-5 h-5 mr-2" />}
                Enviar código
              </Button>

              <button onClick={() => { setStep('login'); setError(''); }} className="w-full text-center text-white/50 hover:text-white/70 text-sm transition-colors">
                Volver al login
              </button>
            </div>
          )}

          {/* Step: Verify Code */}
          {step === 'verify-code' && (
            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-1.5">Código de verificación</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => handleKeyDown(e, handleVerifyCode)}
                  placeholder="123456"
                  className="w-full px-4 py-4 bg-zinc-800 border border-white/10 rounded-lg text-white text-center text-2xl tracking-[0.5em] placeholder-white/20 focus:outline-none focus:border-[#FA7B21]/50 focus:ring-1 focus:ring-[#FA7B21]/30 transition-colors font-mono"
                  autoFocus
                />
              </div>

              <Button
                onClick={handleVerifyCode}
                disabled={loading || code.length !== 6}
                className="w-full bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white font-semibold py-6 text-lg shadow-lg shadow-[#FA7B21]/30 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <KeyRound className="w-5 h-5 mr-2" />}
                Verificar
              </Button>

              <button onClick={handleRequestCode} disabled={loading} className="w-full text-center text-[#FCA929]/70 hover:text-[#FCA929] text-sm transition-colors">
                Reenviar código
              </button>
            </div>
          )}

          {/* Step: Set Password */}
          {step === 'set-password' && (
            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-1.5">Nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    onKeyDown={e => handleKeyDown(e, handleSetPassword)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#FA7B21]/50 focus:ring-1 focus:ring-[#FA7B21]/30 transition-colors pr-12"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-1.5">Confirmar contraseña</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => handleKeyDown(e, handleSetPassword)}
                  placeholder="Repite tu contraseña"
                  className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#FA7B21]/50 focus:ring-1 focus:ring-[#FA7B21]/30 transition-colors"
                />
              </div>

              <Button
                onClick={handleSetPassword}
                disabled={loading || newPassword.length < 6}
                className="w-full bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white font-semibold py-6 text-lg shadow-lg shadow-[#FA7B21]/30 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Lock className="w-5 h-5 mr-2" />}
                Crear contraseña y entrar
              </Button>
            </div>
          )}

          {/* Back to home */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center justify-center w-full text-white/60 hover:text-[#FCA929] transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Inicio
            </button>
          </div>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          Problemas para acceder? Contáctanos por WhatsApp
        </p>
      </div>
    </div>
  );
}
