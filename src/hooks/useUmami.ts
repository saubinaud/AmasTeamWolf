// Hook para usar Umami Analytics
// El script de Umami ya está cargado en index.html

export function useUmami() {
  const trackEvent = (eventName: string, data?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).umami) {
      if (data) {
        (window as any).umami.track(eventName, data);
      } else {
        (window as any).umami.track(eventName);
      }
    }
  };

  const trackPurchase = (productName: string, value: number, currency: string = 'PEN') => {
    trackEvent('Compra Finalizada', {
      producto: productName,
      valor: value,
      moneda: currency
    });
  };

  const trackEnrollment = (programName: string, value: number, duration: string) => {
    trackEvent('Inscripción Programa', {
      programa: programName,
      valor: value,
      moneda: 'PEN',
      duracion: duration
    });
  };

  const trackAddToCart = (productName: string, value: number) => {
    trackEvent('Agregar al Carrito', {
      producto: productName,
      valor: value,
      moneda: 'PEN'
    });
  };

  const trackFormSubmit = (formName: string, value?: number) => {
    if (value) {
      trackEvent('Formulario Enviado', {
        formulario: formName,
        valor: value,
        moneda: 'PEN'
      });
    } else {
      trackEvent('Formulario Enviado', {
        formulario: formName
      });
    }
  };

  const trackPaymentMethod = (method: string, value: number) => {
    trackEvent('Método de Pago Seleccionado', {
      metodo: method,
      valor: value,
      moneda: 'PEN'
    });
  };

  return {
    trackEvent,
    trackPurchase,
    trackEnrollment,
    trackAddToCart,
    trackFormSubmit,
    trackPaymentMethod
  };
}

// Extender el tipo Window para incluir umami
declare global {
  interface Window {
    umami?: {
      track: (eventName: string, data?: Record<string, any>) => void;
    };
  }
}
