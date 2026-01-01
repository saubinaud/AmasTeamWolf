import { useHandleSignInCallback } from '@logto/react';
import { useEffect } from 'react';

interface CallbackPageProps {
  onSuccess: () => void;
}

export function CallbackPage({ onSuccess }: CallbackPageProps) {
  const { isLoading } = useHandleSignInCallback(() => {
    // Cuando Logto termina de procesar el login, ejecutamos esto:
    onSuccess();
  });

  // Efecto visual de carga estilo "Wolf" mientras procesa
  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 border-4 border-[#FA7B21] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-white/50 text-sm animate-pulse">Autenticando en el portal Wolf...</p>
    </div>
  );
}