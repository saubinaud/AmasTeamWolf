import { useState, FormEvent } from 'react';
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
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
  };

  return (
    <div className="h-dvh bg-zinc-950 flex items-center justify-center px-4">
      {/* Backdrop blur decorative elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FA7B21]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-[#FCA929]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Logo / Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FA7B21] to-[#FCA929] mb-4">
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
              <input
                id="space-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder:text-white/30 focus:outline-none focus:border-[#FA7B21]/50 focus:ring-1 focus:ring-[#FA7B21]/30 transition-colors"
                placeholder="********"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#FA7B21] to-[#FCA929] text-white font-semibold rounded-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        </div>
      </div>
    </div>
  );
}
