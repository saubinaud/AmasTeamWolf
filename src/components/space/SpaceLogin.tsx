import { useState, useCallback, FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { API_BASE } from '../../config/api';

interface SpaceUser {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'profesor';
}

interface SpaceLoginProps {
  onLogin: (token: string, usuario: SpaceUser) => void;
}

export function SpaceLogin({ onLogin }: SpaceLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/space/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success && data.token && data.usuario) {
        onLogin(data.token, data.usuario);
      } else {
        setError(data.error || 'Credenciales incorrectas');
      }
    } catch {
      setError('Error de conexion. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [email, password, onLogin]);

  const togglePassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  return (
    <div className="h-dvh bg-zinc-950 flex items-center justify-center px-4">
      {/* Backdrop blur decorative elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FA7B21]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-[#FCA929]/10 rounded-full blur-3xl" />
      </div>

      <div
        className="relative w-full max-w-sm animate-[fadeInUp_0.5s_ease-out]"
        style={{ animationFillMode: 'backwards' }}
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 ring-1 ring-[#FA7B21]/20 rounded-2xl p-8 shadow-2xl">
          {/* Logo / Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FA7B21] to-[#FCA929] mb-4 shadow-lg shadow-[#FA7B21]/20">
              <span className="text-2xl font-black text-white">S</span>
            </div>
            <h1 className="text-white text-xl font-bold">SPACE</h1>
            <p className="text-white/40 text-sm mt-1">AMAS Team Wolf</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="space-email" className="block text-white/60 text-sm mb-1.5">
                Correo electronico
              </label>
              <input
                id="space-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder:text-white/30 focus:outline-none focus:border-[#FA7B21]/50 focus:ring-1 focus:ring-[#FA7B21]/30 transition-colors"
                placeholder="admin@amasteamwolf.com"
              />
            </div>

            <div>
              <label htmlFor="space-password" className="block text-white/60 text-sm mb-1.5">
                Contrasena
              </label>
              <div className="relative">
                <input
                  id="space-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder:text-white/30 focus:outline-none focus:border-[#FA7B21]/50 focus:ring-1 focus:ring-[#FA7B21]/30 transition-colors"
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={togglePassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#FA7B21] hover:bg-[#E56D15] text-white font-semibold rounded-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          {/* Forgot password */}
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-white/30 text-sm hover:text-[#FA7B21]/70 transition-colors"
            >
              Olvide mi contrasena
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
