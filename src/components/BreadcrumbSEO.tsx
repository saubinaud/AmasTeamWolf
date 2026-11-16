import { useEffect } from 'react';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSEOProps {
  items: BreadcrumbItem[];
  currentPage: string;
}

export function BreadcrumbSEO({ items }: BreadcrumbSEOProps) {
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
      { name: 'Inicio', url: 'https://teamwolfxjma.com/' }
    ],
    currentPage: 'Inicio'
  },
  leadership: {
    items: [
      { name: 'Inicio', url: 'https://teamwolfxjma.com/' },
      { name: 'Leadership Wolf', url: 'https://teamwolfxjma.com/leadership' }
    ],
    currentPage: 'Leadership Wolf'
  },
  tienda: {
    items: [
      { name: 'Inicio', url: 'https://teamwolfxjma.com/' },
      { name: 'Tienda', url: 'https://teamwolfxjma.com/tienda' }
    ],
    currentPage: 'Tienda'
  },
  graduacion: {
    items: [
      { name: 'Inicio', url: 'https://teamwolfxjma.com/' },
      { name: 'Graduaciones', url: 'https://teamwolfxjma.com/graduacion' }
    ],
    currentPage: 'Graduaciones'
  }
};
