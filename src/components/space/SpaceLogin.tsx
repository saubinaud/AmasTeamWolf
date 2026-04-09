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
    <div className="h-dvh bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-zinc-900 rounded-2xl p-7">
          {/* Brand */}
          <div className="text-center mb-8">
            <div className="w-10 h-10 rounded-lg bg-[#FA7B21] flex items-center justify-center mx-auto mb-3">
              <span className="text-sm font-black text-white">S</span>
            </div>
            <h1 className="text-white text-xl font-bold">SPACE</h1>
            <p className="text-white/40 text-sm mt-0.5">AMAS Team Wolf</p>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  aria-label={show ? 'Ocultar' : 'Mostrar'}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button type="submit" disabled={loading} className={cx.btnPrimary + ' w-full flex items-center justify-center gap-2'}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
