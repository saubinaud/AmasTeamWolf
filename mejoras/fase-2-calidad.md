# Fase 2 — Calidad de Código

> Estado: Pendiente | Prioridad: ALTA

## Tareas

### 2.1 Estandarizar respuestas de error en backend
- **Archivos:** Todos los routes en `api/src/routes/`
- **Problema:** Mezcla de `{error}`, `{success:false, error}`, status codes inconsistentes
- **Fix:** Formato único: `{ success: boolean, data?: any, error?: string }` con HTTP status correcto

### 2.2 Validación de input en endpoints
- **Archivos:** Todos los routes
- **Problema:** req.body/params se usan directamente sin validar
- **Fix:** Validar campos requeridos, tipos, longitud antes de queries

### 2.3 Habilitar TypeScript strict
- **Archivo:** `tsconfig.json`
- **Problema:** `strict: false`, `noUnusedLocals: false`, `noUnusedParameters: false`
- **Fix:** Activar gradualmente: primero `strictNullChecks`, luego `strict: true`

### 2.4 Fix tipos `any`
- **Archivos:**
  - `App.tsx:193,227` — handleAddToCart usa `any` para producto
  - `PerfilPage.tsx` — datos de graduación sin tipo
- **Fix:** Crear interfaces apropiadas

### 2.5 Validar env vars al arrancar servidor
- **Archivo:** `api/src/index.js`
- **Problema:** Si faltan env vars (DB_HOST, NOTIFUSE_TOKEN, etc.) el servidor arranca pero falla al usarlas
- **Fix:** Verificar vars requeridas en startup, fallar rápido si faltan

### 2.6 Actualizar archivos SQL del repo
- **Archivos:** `database/01_schema.sql`, `database/02_views.sql`
- **Problema:** No reflejan el estado real de la BD en producción
- **Fix:** Exportar schema actual de producción y reemplazar archivos

### 2.7 Mejorar error handling en fetch calls (frontend)
- **Archivos:** `PopupPago.tsx`, `AsistenciaPage.tsx`, `FormularioMatricula.tsx`
- **Problema:** No verifican `response.ok` antes de parsear JSON
- **Fix:** Agregar `if (!response.ok) throw new Error(...)` antes de `.json()`

### 2.8 Corregir promesas fire-and-forget de email
- **Archivos:** `matricula.js:95`, `renovacion.js:83`, `torneo.js:74`
- **Problema:** Emails fallan silenciosamente, usuario no sabe
- **Fix:** Log estructurado del error + retry o notificación al admin
