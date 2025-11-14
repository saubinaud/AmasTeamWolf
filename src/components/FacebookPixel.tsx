import { useEffect } from 'react';

interface FacebookPixelProps {
  pixelId?: string; // Tu Facebook Pixel ID (ej: 123456789012345)
}

export function FacebookPixel({ pixelId }: FacebookPixelProps) {
  useEffect(() => {
    // Solo cargar si hay pixel ID configurado
    if (!pixelId || typeof window === 'undefined') return;

    // Facebook Pixel Code
    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);

    // Noscript fallback
    const noscript = document.createElement('noscript');
    noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1" />`;
    document.body.appendChild(noscript);

    return () => {
      // Cleanup on unmount
      document.head.removeChild(script);
      document.body.removeChild(noscript);
    };
  }, [pixelId]);

  return null;
}

// Hook para trackear eventos personalizados
export function useFacebookPixel() {
  const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', eventName, parameters);
    }
  };

  const trackViewContent = (contentName: string, value?: number) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'ViewContent', {
        content_name: contentName,
        value: value,
        currency: 'PEN'
      });
    }
  };

  const trackLead = () => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Lead');
    }
  };

  const trackContact = () => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Contact');
    }
  };

  const trackSchedule = () => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Schedule');
    }
  };

  const trackInitiateCheckout = (value: number) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'InitiateCheckout', {
        value: value,
        currency: 'PEN'
      });
    }
  };

  const trackPurchase = (value: number) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Purchase', {
        value: value,
        currency: 'PEN'
      });
    }
  };

  return {
    trackEvent,
    trackViewContent,
    trackLead,
    trackContact,
    trackSchedule,
    trackInitiateCheckout,
    trackPurchase
  };
}

// Ejemplo de uso:
// 
// En App.tsx o LandingConversion.tsx:
// import { FacebookPixel } from './components/FacebookPixel';
// 
// function App() {
//   return (
//     <>
//       <FacebookPixel pixelId="TU_PIXEL_ID_AQUI" />
//       {/* resto del código */}
//     </>
//   );
// }
//
// En componentes:
// import { useFacebookPixel } from './components/FacebookPixel';
//
// function MyComponent() {
//   const { trackLead } = useFacebookPixel();
//   
//   const handleSubmit = () => {
//     trackLead(); // Trackear cuando envían formulario
//     // resto del código
//   };
// }

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}
