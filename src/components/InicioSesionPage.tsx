import { useState } from 'react';
import { Lock, ArrowLeft, Eye, EyeOff, Loader2, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth, type PropositoCodigo } from '../contexts/AuthContext';

// Crear la primera contraseña y "Olvidé mi contraseña" siguen el mismo camino:
// DNI → código que llega al correo del apoderado → contraseña nueva. Sin el
// código, el API no deja poner contraseña.
type Step = 'login' | 'codigo' | 'set-password';

interface InicioSesionPageProps {
  onNavigate: (page: string) => void;
}

export function InicioSesionPage({ onNavigate }: InicioSesionPageProps) {
  const { login, requestCode, verifyCode, setPassword } = useAuth();

  const [step, setStep] = useState<Step>('login');
  const [dni, setDni] = useState('');
  const [password, setPassword_] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [proposito, setProposito] = useState<PropositoCodigo>('crear');
  const [codigo, setCodigo] = useState('');
  const [emailHint, setEmailHint] = useState('');
  const [sinCorreo, setSinCorreo] = useState(false);

  /** Pasa al paso del código y lo pide (crear la primera contraseña o recuperarla). */
  const irACodigo = async (p: PropositoCodigo, hasEmail = true) => {
    setProposito(p);
    setCodigo('');
    setEmailHint('');
    setError('');
    setStep('codigo');
    setSinCorreo(!hasEmail);
    if (hasEmail) await enviarCodigo(p);
  };

  const enviarCodigo = async (p: PropositoCodigo = proposito) => {
    if (!dni) { setError('Ingresa tu DNI'); return; }
    setLoading(true);
    setError('');
    const r = await requestCode(dni, p);
    setLoading(false);
    if (r.success) {
      setEmailHint(r.emailHint || '');
      setSinCorreo(false);
    } else {
      setError(r.error || 'No pudimos enviar el código');
    }
  };

  const handleVerificar = async () => {
    if (!/^\d{6}$/.test(codigo)) { setError('El código tiene 6 dígitos'); return; }
    setLoading(true);
    setError('');
    const r = await verifyCode(dni, codigo);
    setLoading(false);
    if (r.success) setStep('set-password');
    else setError(r.error || 'Código inválido');
  };

  const handleLogin = async () => {
    if (!dni) { setError('Ingresa tu DNI'); return; }

    setLoading(true);
    setError('');

    if (!password) {
      // Sin contraseña: verificar si existe y si necesita crearla
      const result = await login(dni, '');
      setLoading(false);
      if (result.needsPassword) {
        await irACodigo('crear', result.hasEmail !== false);
        return;
      }
      setError('Ingresa tu contraseña');
      return;
    }

    const result = await login(dni, password);
    setLoading(false);

    if (result.needsPassword) {
      await irACodigo('crear', result.hasEmail !== false);
      return;
    }

    if (result.success) {
      // Store credentials for browser auto-fill (fingerprint/Face ID)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).PasswordCredential && password) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cred = new (window as any).PasswordCredential({ id: dni, password, name: `JMA ${dni}` });
          await navigator.credentials.store(cred);
        } catch { /* silent */ }
      }
      // Redirect to /clases if came from there, otherwise perfil
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get('redirect');
      if (redirectTo === 'clases') {
        window.location.href = '/clases';
      } else {
        onNavigate('perfil');
      }
    } else {
      setError(result.error || 'Error al iniciar sesión');
    }
  };

  const handleSetPassword = async () => {
    if (newPassword.length < 6) { setError('Mínimo 6 caracteres'); return; }
    if (newPassword !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }

    setLoading(true);
    setError('');
    const result = await setPassword(dni, codigo, newPassword, proposito);
    setLoading(false);

    if (result.success) {
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get('redirect');
      if (redirectTo === 'clases') {
        window.location.href = '/clases';
      } else {
        onNavigate('perfil');
      }
    } else {
      setError(result.error || 'No se pudo guardar la contraseña');
      // Código vencido o ya usado: se vuelve a pedir
      if (/código/i.test(result.error || '')) { setCodigo(''); setStep('codigo'); }
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
        <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-[#FA7B21] to-[#FCA929] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#FA7B21]/30">
              <span className="text-4xl">🐺</span>
            </div>
            <h2 className="text-2xl font-bold text-white">
              {step === 'login' ? 'Iniciar Sesión'
                : step === 'codigo' ? (proposito === 'recuperar' ? 'Recupera tu contraseña' : 'Confirma que eres tú')
                : proposito === 'recuperar' ? 'Nueva contraseña' : 'Crea tu contraseña'}
            </h2>
            <p className="mt-2 text-white/60 text-sm">
              {step === 'login'
                ? 'Ingresa con tu DNI de apoderado'
                : step === 'codigo'
                  ? `Te enviamos un código de 6 dígitos al correo registrado del DNI ${dni}.`
                  : 'Elige una contraseña de al menos 6 caracteres.'}
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
            <form onSubmit={e => { e.preventDefault(); handleLogin(); }} className="space-y-4" autoComplete="on">
              <div>
                <label htmlFor="login-dni" className="block text-white/70 text-sm mb-1.5">DNI del apoderado</label>
                <input
                  id="login-dni"
                  name="username"
                  type="text"
                  inputMode="numeric"
                  maxLength={15}
                  autoComplete="username"
                  value={dni}
                  onChange={e => setDni(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ej: 12345678"
                  className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#FA7B21]/50 focus:ring-1 focus:ring-[#FA7B21]/30 transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="login-pass" className="block text-white/70 text-sm mb-1.5">Contraseña</label>
                <div className="relative">
                  <input
                    id="login-pass"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword_(e.target.value)}
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
                type="submit"
                disabled={loading || !dni}
                className="w-full bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white font-semibold py-6 text-lg shadow-lg shadow-[#FA7B21]/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Lock className="w-5 h-5 mr-2" />}
                Entrar
              </Button>

              <div className="flex items-center justify-between gap-3 pt-2 text-xs">
                <span className="text-white/40">¿Primera vez? Ingresa tu DNI y presiona Entrar</span>
                <button
                  type="button"
                  onClick={() => (dni ? irACodigo('recuperar') : setError('Ingresa tu DNI para recuperar tu contraseña'))}
                  className="shrink-0 text-[#FCA929] hover:text-[#FA7B21] font-medium transition-colors"
                >
                  Olvidé mi contraseña
                </button>
              </div>
            </form>
          )}

          {/* Step: Código del correo */}
          {step === 'codigo' && (
            <form onSubmit={e => { e.preventDefault(); handleVerificar(); }} className="space-y-4">
              {sinCorreo ? (
                <div className="p-3 bg-[#FA7B21]/10 border border-[#FA7B21]/20 rounded-lg text-sm text-white/80 text-center">
                  No hay un correo registrado para este DNI. Escríbenos por WhatsApp y lo actualizamos.
                </div>
              ) : (
                <>
                  {emailHint && (
                    <div className="flex items-center justify-center gap-2 p-3 bg-[#FA7B21]/10 border border-[#FA7B21]/20 rounded-lg text-sm text-white/80">
                      <Mail className="w-4 h-4 shrink-0 text-[#FCA929]" />
                      Revisa {emailHint} (y la carpeta de spam). Vence en 15 minutos.
                    </div>
                  )}
                  <div>
                    <label htmlFor="codigo" className="block text-white/70 text-sm mb-1.5">Código</label>
                    <input
                      id="codigo"
                      name="one-time-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={codigo}
                      onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white text-center text-2xl tracking-[0.5em] placeholder-white/20 focus:outline-none focus:border-[#FA7B21]/50 focus:ring-1 focus:ring-[#FA7B21]/30 transition-colors"
                      autoFocus
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || codigo.length !== 6}
                    className="w-full bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white font-semibold py-6 text-lg shadow-lg shadow-[#FA7B21]/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Lock className="w-5 h-5 mr-2" />}
                    Continuar
                  </Button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => enviarCodigo()}
                    className="w-full text-center text-[#FCA929] hover:text-[#FA7B21] text-sm transition-colors disabled:opacity-50"
                  >
                    Enviar otro código
                  </button>
                </>
              )}

              <button type="button" onClick={() => { setStep('login'); setError(''); }} className="w-full text-center text-white/50 hover:text-white/70 text-sm transition-colors">
                Volver al login
              </button>
            </form>
          )}

          {/* Step: Create Password */}
          {step === 'set-password' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#FA7B21]/10 border border-[#FA7B21]/20 rounded-lg text-sm text-white/80 text-center">
                Código confirmado. {proposito === 'recuperar' ? 'Elige tu nueva contraseña.' : 'Crea una contraseña para acceder a tu cuenta.'}
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-1.5">Nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    autoComplete="new-password"
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
                  autoComplete="new-password"
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
                {proposito === 'recuperar' ? 'Guardar y entrar' : 'Crear contraseña y entrar'}
              </Button>

              <button onClick={() => { setStep('login'); setError(''); }} className="w-full text-center text-white/50 hover:text-white/70 text-sm transition-colors">
                Volver al login
              </button>
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
          ¿Problemas para acceder? Contáctanos por WhatsApp
        </p>
      </div>
    </div>
  );
}
