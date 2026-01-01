import { useLogto } from '@logto/react';
import { Loader2, Lock, ArrowLeft, LogOut } from 'lucide-react';
import { Button } from './ui/button';

interface InicioSesionPageProps {
  onNavigate: (page: string) => void;
}

export function InicioSesionPage({ onNavigate }: InicioSesionPageProps) {
  const { signIn, signOut, isAuthenticated, isLoading } = useLogto();

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

  const handleSignOut = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('amasUserSession');
      localStorage.removeItem('amasUserProfile');

      // Sign out from Logto
      await signOut('https://amasteamwolf.com');
    } catch (error) {
      console.error('Error during sign-out:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#FA7B21] animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Verificando sesión...</p>
        </div>
      </div>
    );
  }

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
              {isAuthenticated ? '¡Bienvenido de vuelta!' : 'Iniciar Sesión'}
            </h2>
            <p className="mt-2 text-white/60 text-sm">
              {isAuthenticated
                ? 'Ya has iniciado sesión en tu cuenta'
                : 'Acceso exclusivo para miembros de AMAS Team Wolf'}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {isAuthenticated ? (
              <>
                {/* Authenticated State */}
                <Button
                  onClick={() => onNavigate('perfil')}
                  className="w-full bg-gradient-to-r from-[#FA7B21] to-[#FCA929] hover:from-[#F36A15] hover:to-[#FA7B21] text-white font-semibold py-6 text-lg shadow-lg shadow-[#FA7B21]/30"
                >
                  Ir a mi Perfil
                </Button>

                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10 py-6"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <>
                {/* Sign In Button */}
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
              </>
            )}
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