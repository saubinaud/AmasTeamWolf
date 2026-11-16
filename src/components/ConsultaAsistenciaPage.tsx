import { Navigate } from 'react-router-dom';
import { ArrowLeft, CalendarCheck, Loader2, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// La consulta de asistencia por DNI era pública (cualquiera veía el nombre y las
// asistencias de un alumno con solo su DNI). Ahora las asistencias se ven en el
// perfil de la familia, con sesión: esta página lleva ahí o a iniciar sesión.

interface ConsultaAsistenciaPageProps {
  onNavigate: (page: string) => void;
}

export function ConsultaAsistenciaPage({ onNavigate }: ConsultaAsistenciaPageProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-10 h-10 text-[#FA7B21] animate-spin" />
      </div>
    );
  }
  if (isAuthenticated) return <Navigate to="/perfil" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="max-w-md w-full bg-zinc-900/80 border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#FA7B21]/15 flex items-center justify-center">
          <CalendarCheck className="w-8 h-8 text-[#FCA929]" />
        </div>
        <h1 className="text-2xl font-bold text-white">Asistencias</h1>
        <p className="mt-2 text-white/60 text-sm">
          Las asistencias, las clases que quedan y el plan de tu hijo están en el perfil de la familia.
          Entra con tu DNI de apoderado y tu contraseña.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('inicio-sesion')}
          className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FA7B21] to-[#FCA929] py-3.5 font-semibold text-white shadow-lg shadow-[#FA7B21]/30 hover:from-[#F36A15] hover:to-[#FA7B21] transition-colors"
        >
          <Lock className="w-5 h-5" /> Iniciar sesión
        </button>
        <p className="mt-3 text-xs text-white/40">¿Primera vez? En la misma pantalla puedes crear tu contraseña con un código al correo.</p>
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="mt-6 inline-flex items-center text-sm text-white/60 hover:text-[#FCA929] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al inicio
        </button>
      </div>
    </div>
  );
}
