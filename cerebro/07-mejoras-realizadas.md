# 07 — Mejoras Realizadas (2026-04-07)

## Fase 1 — Seguridad
- [x] Password hardcodeado eliminado de db.js
- [x] 24 console.log/warn eliminados de 9 archivos
- [x] CORS: regex amplio → URL específica
- [x] Bug precedencia operadores en leads.js
- [x] npm audit fix: 0 vulnerabilidades
- [x] AsistenciaPage importa API_BASE de config

## Fase 2 — Calidad de Código
- [x] Respuestas error estandarizadas ({success, error} + HTTP status) en 6 routes
- [x] Validación input en torneo, renovación, leadership
- [x] Env vars validadas al arrancar servidor
- [x] Schema SQL exportado de producción (01_schema, 02_functions, 03_views)
- [x] Fetch error handling verificado

## Fase 3 — Performance
- [x] Code splitting: 16 páginas React.lazy (1MB → 375KB)
- [x] Rate limiting: 100/min general, 20/min escritura
- [x] Pool BD: max 20, timeout 10s, query timeout 30s
- [x] Aria-labels en 10 botones de solo ícono
- [x] Scripts npm: preview, type-check, lint
- [x] Eliminado index.html.backup

## Fase 4 — Colores e Inputs
- [x] #FF6700 → #FA7B21 en ~100 ocurrencias (Torneo + Showroom)
- [x] Focus ring consistente en 22 inputs
- [x] Touch targets cart: 28px → 36px
- [x] active:scale-95 en botones de CartDrawer, Matrícula, Tienda

## Fase 5 — Transitions y Cards
- [x] duration-200 en 12 transitions sin duración
- [x] Shadow CTA en submit de Showroom y Torneo
- [x] Contraste texto: white/60 → white/70

## Fase 6 — Animaciones y Nav
- [x] fadeIn CSS en 4 páginas
- [x] HeaderMain: active state naranja según currentPage
- [x] currentPage pasado desde 9 componentes

## Fases 7-8-9 — Responsive Tablet
- [x] md: breakpoints en 20 archivos
- [x] Header, Hero, Grids: scaling suave
- [x] Forms: layout 2 columnas en tablet
- [x] Modals: max-width expandido
- [x] Páginas simples: padding escalado

## Fase 10 — Mobile UX
- [x] inputMode="numeric" en todos los DNI
- [x] Checkboxes w-5→w-6
- [x] WhatsApp link Unicode fix
- [x] Close button siempre w-6
- [x] pb-28 en formularios (keyboard overlap)
- [x] Cart buttons más grandes + trash tap area

## Optimización Android / Gama Baja
- [x] Viewport: viewport-fit=cover
- [x] overscroll-behavior-y: none
- [x] touch-action: manipulation global
- [x] will-change: scroll-position
- [x] prefers-reduced-motion: desactiva animaciones
- [x] max-resolution 1.5dppx: quita backdrop-filter
- [x] Imágenes: w_400 mobile, q_40 data saver
- [x] fetchPriority en hero images
- [x] Manifest: dark theme, portrait

## Lazy Loading Completo
- [x] 16 páginas con React.lazy
- [x] 14 imágenes con loading="lazy"
- [x] 3 secciones HomePage con IntersectionObserver
- [x] ErrorBoundary para chunk loading failures
