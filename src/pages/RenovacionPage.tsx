import { useState, useEffect } from 'react';
import { FormularioRenovacion } from '../components/FormularioRenovacion';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

interface RenovacionPageProps {
  onNavigateHome: () => void;
  onSuccess?: () => void;
}

export function RenovacionPage({ onNavigateHome, onSuccess }: RenovacionPageProps) {
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    if (!isFormOpen && !showSuccessMessage) {
      onNavigateHome();
    }
  }, [isFormOpen, showSuccessMessage, onNavigateHome]);

  const handleFormClose = () => {
    setIsFormOpen(false);
  };

  const handleFormSuccess = (total: number) => {
    setShowSuccessMessage(true);
    setIsFormOpen(false);
    toast.success(`¡Renovación completada! Total: S/ ${total}`);

    if (onSuccess) {
      onSuccess();
    }

    setTimeout(() => {
      setShowSuccessMessage(false);
      onNavigateHome();
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {showSuccessMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-zinc-900 border-2 border-[#FA7B21] rounded-2xl p-8 max-w-md mx-4 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-white text-2xl font-bold mb-2">
              ¡Renovación Exitosa!
            </h2>
            <p className="text-white/70 mb-4">
              Gracias por renovar tu membresía. Recibirás un correo con todos los detalles.
            </p>
            <div className="animate-spin w-8 h-8 border-4 border-[#FA7B21] border-t-transparent rounded-full mx-auto"></div>
            <p className="text-white/50 text-sm mt-4">Redirigiendo...</p>
          </div>
        </div>
      )}

      <FormularioRenovacion
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
