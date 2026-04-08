# 06 — Decisiones Técnicas

## Arquitectura

| Decisión | Razón |
|----------|-------|
| SPA (no Next.js) | Simple, no necesita SSR. SEO con meta tags estáticos es suficiente. |
| Estado con useState (no Redux) | App simple, no amerita state manager global. |
| currentPage string (no React Router) | Sebastien lo armó así desde Figma. Funciona. No migrar a menos que sea necesario. |
| Express (no Fastify) | Sebastien ya lo tenía con n8n. Express es lo que conoce el equipo. |
| PostgreSQL 17 | Ya estaba en Contabo. Funciones SQL para lógica de negocio (registrar_asistencia). |
| Horarios hardcodeados en frontend | La tabla `horarios` en BD existe pero no se usa activamente. Los horarios cambian raramente. Si escalan, mover a BD. |

## Performance

| Decisión | Razón |
|----------|-------|
| React.lazy + code splitting | Bundle pasó de 1MB a 375KB. 16 páginas lazy. |
| LazySection con IntersectionObserver | Secciones below-the-fold no renderizan hasta scrollear. |
| Cloudinary con q_40 w_400 en data saver | Padres en Perú usan Android gama baja con datos limitados. |
| prefers-reduced-motion desactiva todo | Celulares baratos no aguantan animaciones + blur. |
| backdrop-filter removido en baja resolución | GPU pesada, innecesario en pantallas de baja calidad. |
| QR expira en 2 horas (no 4) | Más específico a cada clase, evita reutilización. |

## Seguridad

| Decisión | Razón |
|----------|-------|
| Rate limiting 100/min general, 20/min POST | Prevenir spam de matrículas/leads. |
| CORS con URL específica (no regex) | El regex *.easypanel.host era demasiado amplio. |
| Password de BD sin fallback hardcodeado | El fallback 'Aubinaud2' estaba en git. Eliminado. |
| Env vars validadas al startup | Warn si faltan, no crash (para permitir arranque parcial). |

## UX

| Decisión | Razón |
|----------|-------|
| ErrorBoundary en Suspense | Lazy loading puede fallar en redes malas. Botón "Reintentar" mejor que pantalla blanca. |
| inputMode="numeric" en DNI | Muestra teclado numérico automáticamente. Los DNI en Perú son 8 dígitos. |
| touch-action: manipulation global | Elimina el delay de 300ms en Android Chrome. |
| overscroll-behavior-y: none | Previene pull-to-refresh accidental que recarga la página. |
| Checkboxes w-6 h-6 (no w-5) | Padres con manos grandes necesitan targets más amplios. |
