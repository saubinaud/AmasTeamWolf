// Utility for Facebook Pixel Events

type PixelEventName =
    | 'PageView'
    | 'ViewContent'
    | 'Search'
    | 'AddToCart'
    | 'InitiateCheckout'
    | 'AddPaymentInfo'
    | 'Purchase'
    | 'Lead'
    | 'CompleteRegistration'
    | 'Contact'
    | 'CustomizeProduct'
    | 'Donate'
    | 'FindLocation'
    | 'Schedule'
    | 'StartTrial'
    | 'SubmitApplication'
    | 'Subscribe';

interface PixelEventOptions {
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    content_type?: string;
    value?: number;
    currency?: string;
    search_string?: string;
    status?: string;
    [key: string]: any;
}

declare global {
    interface Window {
        fbq: (
            action: 'track' | 'trackCustom',
            eventName: PixelEventName | string,
            options?: PixelEventOptions
        ) => void;
    }
}

export const trackEvent = (eventName: PixelEventName, options?: PixelEventOptions) => {
    if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', eventName, options);
    } else {
        console.debug(`[Meta Pixel] Event '${eventName}' not tracked (fbq not found)`);
    }
};

export const trackCustomEvent = (eventName: string, options?: PixelEventOptions) => {
    if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('trackCustom', eventName, options);
    } else {
        console.debug(`[Meta Pixel] Custom Event '${eventName}' not tracked (fbq not found)`);
    }
};
