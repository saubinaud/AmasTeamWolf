import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { FormularioMatricula } from './FormularioMatricula';

interface RegistroMensualPageProps {
  onNavigateHome: () => void;
  onSuccess: (total: number) => void;
}

export function RegistroMensualPage({ onNavigateHome, onSuccess }: RegistroMensualPageProps) {
  const [isFormOpen, setIsFormOpen] = useState(true);

  // Scroll to top when component mounts
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const handleFormClose = () => {
    setIsFormOpen(false);
    onNavigateHome();
  };

  const handleFormSuccess = (total: number) => {
    onSuccess(total);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header
        className="border-b border-white/10 bg-black/95 backdrop-blur-sm sticky top-0"
        style={{ zIndex: 9999 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 text-white/80 hover:text-[#FA7B21] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver al inicio</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Programa Mensual
          </h1>
          <p className="text-lg text-white/60">
            Inscríbete en nuestro programa de 1 mes con todas las facilidades
          </p>
        </div>

        {/* Información del Programa */}
        <div className="bg-zinc-900 border border-[#FA7B21]/30 rounded-lg p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-semibold text-[#FA7B21] mb-4">
            ¿Qué incluye el programa mensual?
          </h2>

          <ul className="space-y-3 text-white/80">
            <li className="flex items-start gap-3">
              <span className="text-[#FA7B21] mt-1">✓</span>
              <span><strong>8 clases</strong> distribuidas según tu disponibilidad</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#FA7B21] mt-1">✓</span>
              <span>Horarios personalizados según edad del alumno</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#FA7B21] mt-1">✓</span>
              <span>Selección de días tentativos de asistencia</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#FA7B21] mt-1">✓</span>
              <span>Opción de agregar uniforme (+S/ 220)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#FA7B21] mt-1">✓</span>
              <span>Polos adicionales disponibles</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#FA7B21] mt-1">✓</span>
              <span>Sistema de códigos promocionales</span>
            </li>
          </ul>

          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#FA7B21]">S/ 330</span>
              <span className="text-white/60">precio base</span>
            </div>
          </div>
        </div>

        {/* Botón para abrir formulario (si está cerrado) */}
        {!isFormOpen && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="w-full bg-[#FA7B21] hover:bg-[#FA7B21]/90 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
          >
            Inscribirme Ahora
          </button>
        )}
      </div>

      {/* Formulario de Matrícula Mejorado */}
      <FormularioMatricula
        isOpen={isFormOpen}
        onClose={handleFormClose}
        programa="1mes"
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
