import { useState } from 'react';
import { FormularioRenovacion } from '../components/FormularioRenovacion';
import { HeaderMain } from '../components/HeaderMain';
import { FooterMain } from '../components/FooterMain';
import { toast } from 'sonner';

interface RenovacionPageProps {
  onNavigateHome: () => void;
  onNavigate: (page: string, sectionId?: string) => void;
  onOpenMatricula: () => void;
  onCartClick: () => void;
  cartItemsCount: number;
  onSuccess?: () => void;
}

export function RenovacionPage({
  onNavigateHome,
  onNavigate,
  onOpenMatricula,
  onCartClick,
  cartItemsCount,
  onSuccess
}: RenovacionPageProps) {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleFormSuccess = (total: number) => {
    setShowSuccessMessage(true);
    toast.success(`¡Renovación completada! Total: S/ ${total}`);

    if (onSuccess) {
      onSuccess();
    }

    setTimeout(() => {
      setShowSuccessMessage(false);
      window.location.href = 'https://amasteamwolf.com';
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <HeaderMain
        onNavigate={onNavigate}
        onOpenMatricula={onOpenMatricula}
        onCartClick={onCartClick}
        cartItemsCount={cartItemsCount}
      />

      {/* Contenido principal */}
      <div className="flex-1">
        {showSuccessMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="bg-zinc-900 border-2 border-[#FA7B21] rounded-2xl p-8 max-w-md mx-4 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-white text-2xl font-bold mb-2">
                ¡Renovación Exitosa!
              </h2>
              <p className="text-white/70 mb-4">
                Gracias por renovar tu membresía.
              </p>
              <p className="text-[#FA7B21] font-semibold text-sm mt-4">Redirigiendo al inicio...</p>
            </div>
          </div>
        )}

        <FormularioRenovacion
          onSuccess={handleFormSuccess}
        />
      </div>

      {/* Footer */}
      <FooterMain
        onNavigate={onNavigate}
        onOpenMatricula={onOpenMatricula}
      />
    </div>
  );
}
