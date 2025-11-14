import { useState, useEffect } from 'react';

interface NetworkStatus {
  isSlowConnection: boolean;
  isSaving: boolean;
  effectiveType: string;
}

export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isSlowConnection: false,
    isSaving: false,
    effectiveType: '4g'
  });

  useEffect(() => {
    // Check if Network Information API is available
    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;

    const updateNetworkStatus = () => {
      if (connection) {
        const effectiveType = connection.effectiveType || '4g';
        const isSlowConnection = effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g';
        const isSaving = connection.saveData || false;

        setNetworkStatus({
          isSlowConnection,
          isSaving,
          effectiveType
        });
      } else {
        // Fallback: assume good connection if API not available
        setNetworkStatus({
          isSlowConnection: false,
          isSaving: false,
          effectiveType: '4g'
        });
      }
    };

    updateNetworkStatus();

    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
      return () => {
        connection.removeEventListener('change', updateNetworkStatus);
      };
    }
  }, []);

  return networkStatus;
}

// Hook for low data mode
export function useDataSaver() {
  const { isSlowConnection, isSaving } = useNetworkStatus();
  return isSlowConnection || isSaving;
}
