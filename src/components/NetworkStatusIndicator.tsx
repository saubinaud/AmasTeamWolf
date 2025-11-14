import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, WifiOff } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export function NetworkStatusIndicator() {
  const { isSlowConnection, isSaving } = useNetworkStatus();
  const [showIndicator, setShowIndicator] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Show indicator if slow connection detected
    if ((isSlowConnection || isSaving) && !hasShown) {
      setShowIndicator(true);
      setHasShown(true);
      
      // Hide after 5 seconds
      const timer = setTimeout(() => {
        setShowIndicator(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isSlowConnection, isSaving, hasShown]);

  if (!isSlowConnection && !isSaving) return null;

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-zinc-900/95 backdrop-blur-md border border-[#FA7B21]/30 rounded-full px-4 py-2 shadow-2xl flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-[#FCA929]" />
            <span className="text-white text-sm">
              Modo ahorro de datos activado
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
