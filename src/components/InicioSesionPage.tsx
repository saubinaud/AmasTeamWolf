import { useLogto } from '@logto/react';
import { Lock, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

interface InicioSesionPageProps {
  onNavigate: (page: string) => void;
}

export function InicioSesionPage({ onNavigate }: InicioSesionPageProps) {
  const { signIn } = useLogto();

  // Determine callback URL based on environment
  const callbackUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5173/callback'
    : 'https://amasteamwolf.com/callback';

  const handleSignIn = async () => {
    try {
      await signIn(callbackUrl);
    } catch (error) {
      console.error('Error during sign-in:', error);
    }
  };

  // AuthGuard handles redirecting authenticated users
  // This component only shows the login form

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[400px] h-[400px] bg-[#FA7B21]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-[#FCA929]/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-md w-full">
        {/* Card */}
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-[#FA7B21] to-[#FCA929] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#FA7B21]/30">
              <span className="text-4xl">🐺</span>
            </div>
            <h2 className="text-2xl font-bold text-white">
              Iniciar Sesión
            </h2>
            <p className="mt-2 text-white/60 text-sm">
              Acceso exclusivo para miembros de AMAS Team Wolf
            </p>
          </div>

          {/* Sign In Button */}
          <div className="space-y-4">
            <Button
              onClick={handleSignIn}
              className="w-full bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white font-semibold py-6 text-lg shadow-lg shadow-[#FA7B21]/30 transition-all hover:scale-[1.02]"
            >
              <Lock className="w-5 h-5 mr-2" />
              Entrar con mi cuenta
            </Button>

            <p className="text-center text-white/50 text-xs">
              Al iniciar sesión, serás redirigido a nuestra página de autenticación segura
            </p>
          </div>

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

        {/* Footer text */}
        <p className="text-center text-white/40 text-xs mt-6">
          ¿Problemas para acceder? Contáctanos por WhatsApp
        </p>
      </div>
    </div>
  );
}