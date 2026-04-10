# 07 — Mejoras Realizadas

## Sesión 2026-04-07 (grande)

### Migración Auth: Logto → JWT propio
- [x] Eliminado LogtoProvider de main.tsx
- [x] AuthContext reescrito con DNI+password + JWT
- [x] Backend `/api/auth` con bcrypt + jsonwebtoken
- [x] Tabla `verification_codes` para verificación email
- [x] `cargarPerfil()` carga asistencias, inscripciones, pagos, contratos, mensajes
- [x] Endpoint `/api/auth/congelar` para congelar inscripciones
- [x] Reset password y verificación funcionando

### Tailwind v4 dinámico (CRÍTICO)
- [x] Descubrimiento: `src/index.css` era archivo pre-compilado de 6640 líneas estático
- [x] Instalado `tailwindcss` + `@tailwindcss/vite`
- [x] `vite.config.ts` usa plugin `tailwindcss()`
- [x] `src/index.css` ahora solo: `@import "tailwindcss"` + `@import "./styles/globals.css"`
- [x] Clases se generan dinámicamente al compilar — ya no hay clases "inexistentes"

### PDFs contratos: Cloudinary → bytea + disco
- [x] Cloudinary tenía restricción (401 en downloads). Migrado a BD.
- [x] `contratos.pdf_bytea` (columna nueva) + `/opt/amas-contratos/` en disco
- [x] Endpoints `/api/auth/contrato/:id/ver` y `/descargar` sirven desde bytea
- [x] Solucionó PDFs corruptos que no se podían descargar/ver

### Space S1 — Auth + Layout + Dashboard
- [x] `space-auth.js`, `spaceAuth` middleware, `requireAdmin`
- [x] SpaceLogin, SpaceLayout (sidebar 9 ítems), SpaceDashboard
- [x] `space_usuarios` con bcrypt + JWT

### Space S2 — Graduaciones CRUD
- [x] CRUD graduaciones
- [x] Aprobar graduación → actualiza `alumno.cinturon_actual` + inserta `historial_cinturones`
- [x] Tabla `graduacion_correcciones` (reemplaza hack de leads)
- [x] Modal graduación muestra `alumnoArmas` (integración con compras)

### Space S3 — Alumnos + Inscripciones
- [x] Lista paginada con LATERAL JOIN (programa, clases, cinturon)
- [x] Detalle con implementos + histórico de asistencias
- [x] Modal edición alumno
- [x] Inscripciones CRUD con `allowedFields` corregidos (sin monto/horario/sede_id)

### Space S4 — Asistencia + Leads
- [x] 6 endpoints asistencia (stats, hoy, por-fecha, por-alumno, exportar, resumen-semanal)
- [x] Fix crítico: `asistio = 'Sí'` (VARCHAR) no `asistio = true`
- [x] Botón "Tomar asistencia" redirige a panel profesora
- [x] Fix interface: `nombre_alumno`/`dni_alumno` (no `alumno_nombre`)
- [x] Leads: stats, list, embudo, exportar
- [x] Columna `observaciones` agregada a leads (ALTER TABLE)

### Space S5 — Configuración
- [x] 14 endpoints en `space-config.js` (usuarios/sedes/horarios)
- [x] SpaceConfig.tsx con 3 tabs
- [x] Protegido con `requireAdmin`
- [x] CRUD usuarios con cambio de password

### Space S6 — Mensajes (Space ↔ Perfil)
- [x] Tablas `mensajes` + `mensajes_leidos` (auto-creadas)
- [x] Tipos: difusion, programa, individual
- [x] `cargarPerfil()` retorna `mensajes[]` con flag `leido`
- [x] PerfilPage lista mensajes con badge no-leídos + click para expandir + marcar
- [x] PerfilDesktop actualizado (era user.mensaje singular, ahora array)
- [x] Space tracking: quién leyó cada mensaje

### Space S7 — Compras (registro implementos)
- [x] Schema nuevo `implementos` (categoria, tipo, talla, etc.)
- [x] 7 endpoints en `space-compras.js`
- [x] SpaceCompras.tsx (~730 líneas)
- [x] Integración: detalle alumno muestra implementos
- [x] Integración: modal graduación muestra `armas-alumno/:id`

### UX/UI Overhaul Space
- [x] Modal.tsx con React `createPortal` → `document.body` + z-index 99999
- [x] `tokens.ts` con valores SÓLIDOS (`bg-zinc-900 border border-zinc-800 rounded-2xl`)
- [x] Eliminado `backdrop-blur` y `/60` transparencia de modals
- [x] CSS select dropdowns dark theme en `styles/globals.css`
- [x] Header/footer fijos, smooth scroll, mobile-first layout

### BD Audit completo
- [x] Revisión exhaustiva queries backend vs schema real
- [x] Fix: `LOWER(estado) = 'activo'` consistente en alumnos
- [x] Fix: `nombre_alumno`/`dni_alumno` en todas las queries
- [x] Fix: `asistio = 'Sí'` en 6 queries
- [x] Fix: response shapes (`data.stats` vs `data.data`)
- [x] Fix: field names mensajes (programa_destino/alumno_destino_id)
- [x] Fix: Graduaciones sin usar columna `dni` inexistente

## Sesiones previas

### Fase 1 — Seguridad
- [x] Password hardcodeado eliminado de db.js
- [x] 24 console.log/warn eliminados
- [x] CORS específico, bug precedencia leads.js
- [x] npm audit fix: 0 vulnerabilidades

### Fase 2 — Calidad
- [x] Respuestas error estandarizadas
- [x] Validación input, env vars validadas
- [x] Schema SQL exportado

### Fase 3 — Performance
- [x] Code splitting: 16 páginas lazy (1MB → 375KB)
- [x] Rate limiting: 100/min general, 20/min escritura
- [x] Pool BD: max 20, timeouts

### Fase 4-6 — UI
- [x] #FF6700 → #FA7B21
- [x] Focus rings, touch targets, transitions
- [x] HeaderMain active states

### Fases 7-10 — Responsive + Mobile UX
- [x] md: breakpoints, forms 2 columnas tablet
- [x] inputMode="numeric" DNI
- [x] pb-28 keyboard overlap
- [x] Optimización Android gama baja

### Lazy loading completo
- [x] 16 páginas React.lazy, ErrorBoundary
- [x] IntersectionObserver para secciones Home
