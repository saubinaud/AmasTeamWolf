# Fase 1 — Seguridad

> Estado: Pendiente | Prioridad: CRITICA

## Tareas

### 1.1 Quitar password hardcodeado de db.js
- **Archivo:** `api/src/db.js:8`
- **Problema:** `password: process.env.DB_PASS || 'Aubinaud2'` expone password en código
- **Fix:** Quitar fallback, requerir env var

### 1.2 Eliminar console.logs de producción
- **Archivos:**
  - `FormularioMatricula.tsx` — líneas 487-527 (debug de fechas)
  - `PerfilPage.tsx:173` — log de graduación
  - `PerfilDesktop.tsx:208,256` — webhook data
  - `App.tsx:438` — callback profile
  - `GraduacionPage.tsx:174,205` — workflow data
- **Fix:** Eliminar todos o envolver en `import.meta.env.DEV`

### 1.3 Mascarar cuentas bancarias en PopupPago
- **Archivo:** `PopupPago.tsx:164-167, 202-203`
- **Problema:** Números de cuenta completos visibles en el frontend
- **Fix:** Mostrar solo últimos 4 dígitos: `****3071`

### 1.4 Corregir CORS
- **Archivo:** `api/src/index.js:25`
- **Problema:** Regex `/\.easypanel\.host$/` acepta cualquier subdominio de easypanel
- **Fix:** Cambiar a URL específica `https://amas-api.s6hx3x.easypanel.host`

### 1.5 Fix error lógico en leads.js
- **Archivo:** `api/src/routes/leads.js:23`
- **Problema:** Precedencia de operadores: `d.campana_id || d.metadata ? JSON.stringify(d.metadata) : null`
- **Fix:** Agregar paréntesis: `d.campana_id || (d.metadata ? JSON.stringify(d.metadata) : null)`

### 1.6 npm audit fix
- **Problema:** 5 vulnerabilidades de severidad alta (lodash, vite, rollup, picomatch)
- **Fix:** `npm audit fix` + actualizar deps críticas

### 1.7 Fix AsistenciaPage API_BASE
- **Archivo:** `src/components/AsistenciaPage.tsx:13-15`
- **Problema:** Redefine API_BASE localmente en vez de importar de config
- **Fix:** `import { API_BASE } from '../config/api'`
