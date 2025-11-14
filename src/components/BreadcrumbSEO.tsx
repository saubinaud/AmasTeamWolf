import { useEffect } from 'react';
import { Home, ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSEOProps {
  items: BreadcrumbItem[];
  currentPage: string;
}

export function BreadcrumbSEO({ items, currentPage }: BreadcrumbSEOProps) {
  useEffect(() => {
    // Add JSON-LD structured data for breadcrumbs
    const scriptId = 'breadcrumb-structured-data';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    const breadcrumbList = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": item.url
      }))
    };

    script.textContent = JSON.stringify(breadcrumbList);

    return () => {
      // Cleanup on unmount
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [items]);

  // No renderizar nada visual, solo los metadatos
  return null;
}

// Configuraciones de breadcrumbs para cada página
export const breadcrumbConfigs = {
  home: {
    items: [
      { name: 'Inicio', url: 'https://amasteamwolf.com/' }
    ],
    currentPage: 'Inicio'
  },
  leadership: {
    items: [
      { name: 'Inicio', url: 'https://amasteamwolf.com/' },
      { name: 'Leadership Wolf', url: 'https://amasteamwolf.com/leadership' }
    ],
    currentPage: 'Leadership Wolf'
  },
  tienda: {
    items: [
      { name: 'Inicio', url: 'https://amasteamwolf.com/' },
      { name: 'Tienda', url: 'https://amasteamwolf.com/tienda' }
    ],
    currentPage: 'Tienda'
  },
  graduacion: {
    items: [
      { name: 'Inicio', url: 'https://amasteamwolf.com/' },
      { name: 'Graduaciones', url: 'https://amasteamwolf.com/graduacion' }
    ],
    currentPage: 'Graduaciones'
  }
};
