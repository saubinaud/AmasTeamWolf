import { useEffect } from 'react';

interface AnalyticsProps {
  trackingId?: string; // Google Analytics ID (ej: G-XXXXXXXXXX)
}

export function Analytics({ trackingId }: AnalyticsProps) {
  useEffect(() => {
    // Solo cargar si hay tracking ID configurado
    if (!trackingId || typeof window === 'undefined') return;

    // Google Analytics 4
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${trackingId}', {
        page_path: window.location.pathname,
        send_page_view: true
      });
    `;
    document.head.appendChild(script2);

    return () => {
      // Cleanup on unmount
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, [trackingId]);

  return null;
}

// Hook para trackear eventos personalizados
export function useAnalytics() {
  const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, parameters);
    }
  };

  const trackPageView = (url: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: url,
      });
    }
  };

  const trackPurchase = (value: number, items: any[]) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'purchase', {
        value: value,
        currency: 'PEN',
        items: items
      });
    }
  };

  const trackEnrollment = (programName: string, value: number) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'sign_up', {
        method: programName,
        value: value,
        currency: 'PEN'
      });
    }
  };

  const trackAddToCart = (productName: string, value: number) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'add_to_cart', {
        currency: 'PEN',
        value: value,
        items: [{
          item_name: productName,
          price: value
        }]
      });
    }
  };

  return {
    trackEvent,
    trackPageView,
    trackPurchase,
    trackEnrollment,
    trackAddToCart
  };
}

// Ejemplo de uso:
// 
// En App.tsx:
// import { Analytics } from './components/Analytics';
// 
// function App() {
//   return (
//     <>
//       <Analytics trackingId="G-XXXXXXXXXX" />
//       {/* resto del código */}
//     </>
//   );
// }
//
// En componentes:
// import { useAnalytics } from './components/Analytics';
//
// function MyComponent() {
//   const { trackEnrollment } = useAnalytics();
//   
//   const handleEnroll = () => {
//     trackEnrollment('Leadership Program', 1499);
//     // resto del código
//   };
// }

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}
