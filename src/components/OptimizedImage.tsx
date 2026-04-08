import { useState, useEffect } from 'react';
import { useDataSaver } from '../hooks/useNetworkStatus';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain';
}

export function OptimizedImage({ 
  src, 
  alt, 
  className = '', 
  priority = false,
  aspectRatio = '1/1',
  objectFit = 'cover'
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const isDataSaver = useDataSaver();

  // Generate low-quality placeholder from Cloudinary URL
  const getLowQualityPlaceholder = (url: string): string => {
    if (url.includes('cloudinary.com')) {
      // Replace quality and width parameters for placeholder
      return url.replace(/q_\d+,w_\d+/, 'q_10,w_50,e_blur:1000');
    }
    return url;
  };

  // Optimize image URL based on connection and device
  const getOptimizedUrl = (url: string): string => {
    if (url.includes('cloudinary.com')) {
      if (isDataSaver) {
        return url.replace(/q_\d+/, 'q_40').replace(/w_\d+/, 'w_400');
      }
      // Smaller images for small screens
      if (typeof window !== 'undefined' && window.innerWidth <= 640) {
        return url.replace(/w_\d+/, 'w_400');
      }
    }
    return url;
  };

  const placeholderSrc = getLowQualityPlaceholder(src);
  const optimizedSrc = getOptimizedUrl(src);

  useEffect(() => {
    // Preload image
    const img = new Image();
    img.src = optimizedSrc;
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setHasError(true);
  }, [optimizedSrc]);

  if (hasError) {
    return (
      <div 
        className={`${className} bg-zinc-800 flex items-center justify-center`}
        style={{ aspectRatio }}
      >
        <span className="text-white/30 text-xs">Error al cargar</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Placeholder/Blur */}
      {!isLoaded && (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          className={`${className} absolute inset-0 blur-xl scale-110`}
          style={{ 
            objectFit,
            aspectRatio
          }}
        />
      )}
      
      {/* Main Image */}
      <img
        src={optimizedSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        className={`${className} transition-opacity duration-500 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          objectFit,
          aspectRatio
        }}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
      
      {/* Loading skeleton */}
      {!isLoaded && (
        <div 
          className={`${className} absolute inset-0 bg-zinc-800/50 animate-pulse`}
          style={{ aspectRatio }}
        />
      )}
    </div>
  );
}
