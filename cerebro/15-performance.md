# 15 — Reglas de Performance

## Problemas históricos resueltos

### 1. backdrop-blur (113 instancias eliminadas)
`backdrop-blur` fuerza GPU compositing por cada elemento. Con 113 instancias, hasta un Galaxy S27 sufría lag. Solución: eliminado completamente. Usar `bg-zinc-950/95` (opacidad alta sin blur) en vez de `bg-black/80 backdrop-blur-xl`.

**REGLA: NUNCA usar backdrop-blur en este proyecto.** Si necesitas un overlay, usa opacidad alta (95%) sobre un fondo sólido.

### 2. Entry point gigante (328KB → 42KB)
App.tsx importaba 14 componentes de forma eager que se empaquetaban en un solo chunk. Solución: React.lazy() para todo excepto lo mínimo (React, sonner, types).

**REGLA: Todo componente de página debe ser lazy-loaded con React.lazy().** Solo importar eager: React, hooks, types, Toaster.

### 3. framer-motion excesivo (90+ usos en PerfilPage)
motion.div en cada elemento causa re-renders constantes y layout thrashing. 

**REGLA: Usar motion.div solo para transiciones de página y elementos interactivos (1-3 por vista). Para el resto, usar CSS transitions (`transition-all duration-200`).**

### 4. Búsquedas SQL sin índices (REPLACE en cada query)
20 queries usaban REPLACE(REPLACE(REPLACE())) forzando sequential scan.

**REGLA: Usar columnas generadas `dni_alumno_norm` / `dni_apoderado_norm` con índices.** Ver cerebro/14-reglas-arquitectura.md R2.

## Métricas objetivo

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| Entry point (gzip) | < 20 KB | 12 KB ✅ |
| backdrop-blur | 0 | 0 ✅ |
| motion.div por vista | < 5 | ~90 en Perfil (pendiente reducir) |
| Largest JS chunk (gzip) | < 70 KB | 65 KB (ui.js) ✅ |
| CSS (gzip) | < 40 KB | 33 KB ✅ |
| Primera carga 3G | < 1s | ~0.5s ✅ |

## Checklist antes de deploy

1. ¿Hay `backdrop-blur` en el código? → Eliminar
2. ¿Hay imports eager de componentes de página en App.tsx? → Convertir a lazy
3. ¿Hay más de 5 `motion.div` en un solo componente? → Reducir a CSS transitions
4. ¿Las queries SQL usan REPLACE en vez de `_norm`? → Cambiar a columnas generadas
5. ¿Hay imágenes >100KB sin lazy loading? → Añadir `loading="lazy"`

## Imágenes

Las imágenes en `src/` suman ~15MB. Optimizaciones aplicadas:
- `loading="lazy"` en todas las imágenes bajo el fold
- Cloudinary transforms (w_400, q_40) para data saver
- `fetchPriority="high"` solo en hero images
- Formato WebP preferido
- `content-visibility: auto` para secciones debajo del fold
