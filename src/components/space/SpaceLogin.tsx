import { useState, useCallback, type FormEvent } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { API_BASE } from '../../config/api';
import type { SpaceUser } from './SpaceApp';
import { cx } from './tokens';

interface Props {
  onLogin: (token: string, usuario: SpaceUser) => void;
}

export function SpaceLogin({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = useCallback(async (e: FormEvent) => {
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
      if (data.success && data.token) {
        onLogin(data.token, data.usuario);
      } else {
        setError(data.error || 'Credenciales incorrectas');
      }
    } catch {
      setError('Error de conexion');
    } finally {
      setLoading(false);
    }
  }, [email, password, onLogin]);

  return (
    <div className="h-dvh bg-[#0a0a0a] flex items-center justify-center px-4">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FA7B21]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#FCA929]/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Brand */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FA7B21] to-[#FCA929] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#FA7B21]/25">
              <span className="text-lg font-black text-white">S</span>
            </div>
            <h1 className="text-white text-2xl font-bold tracking-tight">SPACE</h1>
            <p className="text-white/30 text-sm mt-1">Panel administrativo AMAS</p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="sp-email" className={cx.label}>Correo</label>
              <input
                id="sp-email" type="email" required autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                className={cx.input} placeholder="admin@amasteamwolf.com"
              />
            </div>

            <div>
              <label htmlFor="sp-pass" className={cx.label}>Contraseña</label>
              <div className="relative">
                <input
                  id="sp-pass" type={show ? 'text' : 'password'} required autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  className={cx.input + ' pr-11'} placeholder="••••••••"
                />
                <button type="button" onClick={() => setShow(v => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  aria-label={show ? 'Ocultar' : 'Mostrar'}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className={cx.btnPrimary + ' w-full py-3 flex items-center justify-center gap-2 text-base'}>
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/15 text-xs mt-6">
          AMAS Team Wolf &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
