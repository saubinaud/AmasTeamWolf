# Fase 3 — Performance y UX

> Estado: Pendiente | Prioridad: MEDIA

## Tareas

### 3.1 Code splitting del bundle
- **Problema:** Bundle principal de 1MB, todo en un chunk
- **Fix:** Lazy loading con `React.lazy()` para páginas pesadas (Perfil, Tienda, Graduación)
- **Objetivo:** Bundle inicial <500KB

### 3.2 Rate limiting en endpoints sensibles
- **Archivos:** `api/src/index.js`
- **Problema:** Sin límite de requests — vulnerable a spam/abuso
- **Fix:** Agregar `express-rate-limit` en POST endpoints (matrícula, asistencia, QR, leads)

### 3.3 Optimizar pool de BD
- **Archivo:** `api/src/db.js`
- **Problema:** max:10 conexiones, connectionTimeout:5000ms bajo para producción
- **Fix:** max:20, connectionTimeout:10000, agregar healthcheck de pool

### 3.4 Eliminar N+1 queries en perfil
- **Archivo:** `api/src/routes/perfil.js`
- **Problema:** Fetch de perfil + fetch separado de asistencias
- **Fix:** JOIN en una sola query o usar subquery

### 3.5 Accesibilidad — aria-labels
- **Archivos:** `HeaderMain.tsx`, botones de ícono en varios componentes
- **Problema:** Botones de solo ícono sin label para screen readers
- **Fix:** Agregar `aria-label` descriptivo a cada botón

### 3.6 Limpiar archivos innecesarios
- `index.html.backup` — eliminar
- `formularios-academia-template/` — eliminar o mover a repo separado
- **Impacto:** Reduce tamaño del repo (682MB total)

### 3.7 Agregar scripts npm
- **Archivo:** `package.json`
- **Problema:** Solo tiene `dev` y `build`
- **Fix:** Agregar `preview`, `lint`, `type-check`
