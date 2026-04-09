import { useState, useCallback, FormEvent } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { API_BASE } from '../../config/api';
import type { SpaceUser } from './SpaceApp';

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

  const togglePassword = useCallback(() => setShowPassword(prev => !prev), []);
  const handleEmail = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value), []);
  const handlePassword = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value), []);

  return (
    <div className="h-dvh bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-zinc-900 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-white text-2xl font-bold tracking-tight">SPACE</h1>
            <p className="text-white/40 text-sm mt-1">AMAS Team Wolf</p>
          </div>

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
                onChange={handleEmail}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#FA7B21] focus:ring-1 focus:ring-[#FA7B21]/20 transition-colors"
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
                  onChange={handlePassword}
                  className="w-full px-4 py-3 pr-12 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#FA7B21] focus:ring-1 focus:ring-[#FA7B21]/20 transition-colors"
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
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#FA7B21] text-white font-semibold rounded-lg transition-colors hover:bg-[#E56D15] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
