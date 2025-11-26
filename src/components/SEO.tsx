import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

export function SEO({
  title = 'AMAS Team Wolf - Academia de Artes Marciales | Leadership Program',
  description = 'AMAS Team Wolf: Academia líder en artes marciales en San Borja, Lima. Programas de Taekwondo, Leadership Wolf, Combat, Bo Staff y más. Formamos líderes con disciplina, respeto y valores. Matrícula abierta para niños y jóvenes.',
  keywords = 'AMAS Team Wolf, artes marciales Lima, taekwondo San Borja, leadership program, leadership wolf, academia artes marciales Perú, clases taekwondo niños, combat, bo staff, nunchaku, formación integral, disciplina, respeto, valores, matrícula artes marciales, gimnasio San Borja, defensa personal Lima',
  image = 'https://amasteamwolf.com/og-image.jpg',
  url = 'https://amasteamwolf.com',
  type = 'website'
}: SEOProps) {
  
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('author', 'AMAS Team Wolf');
    updateMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    
    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', 'AMAS Team Wolf', true);
    updateMetaTag('og:locale', 'es_PE', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);

    // Additional SEO tags
    updateMetaTag('theme-color', '#FA7B21');
    updateMetaTag('apple-mobile-web-app-capable', 'yes');
    updateMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');
    updateMetaTag('apple-mobile-web-app-title', 'AMAS Team Wolf');
    updateMetaTag('format-detection', 'telephone=no');
    updateMetaTag('mobile-web-app-capable', 'yes');

    // Geo tags for local SEO
    updateMetaTag('geo.region', 'PE-LIM');
    updateMetaTag('geo.placename', 'San Borja, Lima');
    updateMetaTag('geo.position', '-12.097438;-77.004928');
    updateMetaTag('ICBM', '-12.097438, -77.004928');

    // Business/Organization
    updateMetaTag('og:phone_number', '+51989717412', true);
    updateMetaTag('og:email', 'amasteamwolf@gmail.com', true);
    updateMetaTag('og:street-address', 'Av. Angamos Este 2741', true);
    updateMetaTag('og:locality', 'San Borja', true);
    updateMetaTag('og:region', 'Lima', true);
    updateMetaTag('og:postal-code', '15036', true);
    updateMetaTag('og:country-name', 'Perú', true);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    // JSON-LD Structured Data
    const scriptId = 'structured-data';
    let script = document.getElementById(scriptId);
    
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SportsActivityLocation",
          "@id": "https://amasteamwolf.com/#organization",
          "name": "AMAS Team Wolf",
          "alternateName": ["AMAS Team Wolf Academy", "Academia AMAS Team Wolf"],
          "url": "https://amasteamwolf.com",
          "logo": "https://amasteamwolf.com/logo.png",
          "image": image,
          "description": description,
          "priceRange": "S/ 330 - S/ 1,964",
          "telephone": "+51989717412",
          "email": "amasteamwolf@gmail.com",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Av. Angamos Este 2741",
            "addressLocality": "San Borja",
            "addressRegion": "Lima",
            "postalCode": "15036",
            "addressCountry": "PE"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": "-12.097438",
            "longitude": "-77.004928"
          },
          "openingHoursSpecification": [
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
              "opens": "15:00",
              "closes": "20:30"
            },
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": "Saturday",
              "opens": "09:00",
              "closes": "13:00"
            }
          ],
          "sameAs": [
            "https://www.facebook.com/profile.php?id=100077646492633",
            "https://www.instagram.com/amas_teamwolf/"
          ]
        },
        {
          "@type": "WebSite",
          "@id": "https://amasteamwolf.com/#website",
          "url": "https://amasteamwolf.com",
          "name": "AMAS Team Wolf",
          "description": description,
          "publisher": {
            "@id": "https://amasteamwolf.com/#organization"
          },
          "inLanguage": "es-PE"
        },
        {
          "@type": "Course",
          "name": "Leadership Wolf Program",
          "description": "Programa completo de liderazgo y artes marciales para niños y jóvenes. Incluye formación en Taekwondo, Combat, Bo Staff, Nunchaku y desarrollo de valores.",
          "provider": {
            "@id": "https://amasteamwolf.com/#organization"
          },
          "educationalLevel": "Todos los niveles",
          "availableLanguage": "es",
          "offers": {
            "@type": "Offer",
            "price": "1299",
            "priceCurrency": "PEN",
            "availability": "https://schema.org/InStock",
            "url": "https://amasteamwolf.com/leadership",
            "validFrom": "2024-01-01"
          }
        },
        {
          "@type": "Course",
          "name": "Programa Full 3 Meses",
          "description": "Programa integral de artes marciales de 3 meses. Incluye uniforme completo, graduación, certificado oficial y seguimiento personalizado.",
          "provider": {
            "@id": "https://amasteamwolf.com/#organization"
          },
          "educationalLevel": "Todos los niveles",
          "availableLanguage": "es",
          "offers": {
            "@type": "Offer",
            "price": "869",
            "priceCurrency": "PEN",
            "availability": "https://schema.org/InStock",
            "url": "https://amasteamwolf.com",
            "validFrom": "2024-01-01"
          }
        },
        {
          "@type": "LocalBusiness",
          "name": "AMAS Team Wolf - Academia de Artes Marciales",
          "image": image,
          "@id": "https://amasteamwolf.com",
          "url": "https://amasteamwolf.com",
          "telephone": "+51989717412",
          "priceRange": "S/ 330 - S/ 1,964",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Av. Angamos Este 2741",
            "addressLocality": "San Borja",
            "addressRegion": "Lima",
            "postalCode": "15036",
            "addressCountry": "PE"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": -12.097438,
            "longitude": -77.004928
          },
          "openingHoursSpecification": [
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
              "opens": "15:00",
              "closes": "20:30"
            },
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": "Saturday",
              "opens": "09:00",
              "closes": "13:00"
            }
          ],
          "sameAs": [
            "https://www.facebook.com/profile.php?id=100077646492633",
            "https://www.instagram.com/amas_teamwolf/"
          ]
        }
      ]
    };

    script.textContent = JSON.stringify(structuredData);

  }, [title, description, keywords, image, url, type]);

  return null;
}

// Page-specific SEO configurations
export const seoConfigs = {
  home: {
    title: 'AMAS Team Wolf - Academia de Artes Marciales en San Borja | Taekwondo Lima',
    description: 'Academia de artes marciales AMAS Team Wolf en San Borja, Lima. Programas de Taekwondo, Leadership Wolf y Combat para niños y jóvenes. Formación integral con valores. ¡Matrícula abierta! ☎ +51 989 717 412',
    keywords: 'AMAS Team Wolf, artes marciales Lima, taekwondo San Borja, academia artes marciales Perú, clases taekwondo niños Lima, gimnasio artes marciales San Borja, defensa personal niños, formación integral Lima, valores niños, disciplina respeto, mejor academia taekwondo Lima, escuela artes marciales San Borja',
    url: 'https://amasteamwolf.com'
  },
  leadership: {
    title: 'Leadership Wolf Program - AMAS Team Wolf | Programa de Liderazgo y Artes Marciales',
    description: 'Leadership Wolf: Programa exclusivo de liderazgo y artes marciales. Incluye Taekwondo, Combat, Bo Staff, Nunchaku y formación en valores. 12 hitos de desarrollo personal. Desde S/ 1,299 con descuento de lanzamiento. ¡Inscríbete ahora!',
    keywords: 'leadership wolf, leadership program, programa liderazgo Lima, liderazgo artes marciales, AMAS leadership, taekwondo leadership, combat training, bo staff, nunchaku, formación líderes niños, desarrollo personal niños, programa integral artes marciales, programa avanzado artes marciales, curso liderazgo juvenil Lima',
    url: 'https://amasteamwolf.com/leadership'
  },
  tienda: {
    title: 'Tienda AMAS Team Wolf - Uniformes y Equipamiento de Artes Marciales',
    description: 'Tienda oficial AMAS Team Wolf. Uniformes de Taekwondo, equipamiento Combat, Bo Staff, Nunchaku y más. Productos de calidad para artes marciales. Envío disponible en Lima.',
    keywords: 'tienda artes marciales Lima, uniformes taekwondo, dobok, combat gear, bo staff comprar, nunchaku Lima, equipamiento artes marciales Perú, AMAS Team Wolf tienda, comprar uniforme taekwondo Lima, venta dobok San Borja',
    url: 'https://amasteamwolf.com/tienda'
  },
  graduacion: {
    title: 'Graduaciones AMAS Team Wolf - Ceremonias y Logros de Nuestros Estudiantes',
    description: 'Conoce las graduaciones y ceremonias de AMAS Team Wolf. Galería de logros de nuestros estudiantes en artes marciales. Celebramos el esfuerzo y dedicación con certificados oficiales.',
    keywords: 'graduaciones taekwondo, ceremonias artes marciales Lima, graduación AMAS Team Wolf, certificados taekwondo, cinturones taekwondo, logros estudiantes artes marciales, exámenes de grado taekwondo Lima, ceremonia cinturones artes marciales San Borja',
    url: 'https://amasteamwolf.com/graduacion'
  },
  clasePrueba: {
    title: 'Clase de Prueba Taekwondo S/ 40 | AMAS Team Wolf San Borja - Niños desde 1 año',
    description: '¡Reserva tu clase de prueba de Taekwondo por S/ 40 (GRATIS al inscribirse)! Para niños desde 1 año. Desarrolla confianza, disciplina y respeto. 20 años formando líderes en San Borja, Lima. ☎ +51 989 717 412',
    keywords: 'clase prueba taekwondo Lima, clase de prueba artes marciales San Borja, taekwondo para niños Lima, clases taekwondo niños San Borja, academia infantil artes marciales, formación niños disciplina, confianza niños Lima, taekwondo niños tímidos, disciplina niños berrinches, baby wolf, taekwondo bebés Lima, primera clase taekwondo gratis',
    url: 'https://amasteamwolf.com/clase-prueba'
  }
};