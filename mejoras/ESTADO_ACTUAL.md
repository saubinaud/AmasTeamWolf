# Estado Actual del Proyecto — 2026-04-09

## Web Pública (amasteamwolf.com)

### Completado
- [x] Landing page responsive (mobile + tablet + desktop)
- [x] Formularios de matrícula (3, 6 meses, mensual, leadership)
- [x] Sistema de asistencia QR (panel profesora + registro alumno)
- [x] Tienda de implementos
- [x] Perfil del alumno con calendario de asistencia
- [x] Graduaciones (página pública)
- [x] Torneo (inscripción)
- [x] Renovación de programa
- [x] Popup de pago (Yape, transferencia)
- [x] Auth con Logto
- [x] Analytics (Umami + GA4 + Facebook Pixel)

### Optimizaciones aplicadas (Fases 1-10)
- [x] Seguridad: sin passwords hardcodeados, CORS restringido, npm audit 0 vulns
- [x] Performance: bundle 1MB→375KB, code splitting 16 páginas, lazy images
- [x] Responsive: md: breakpoints en 20+ archivos
- [x] Mobile: inputMode numeric, touch targets 44px, checkboxes grandes
- [x] Android: overscroll-behavior, touch-action manipulation, 300ms tap fix
- [x] Gama baja: prefers-reduced-motion, backdrop-filter removido en baja res
- [x] Backend: rate limiting, pool BD optimizado, validación input, error responses

---

## SPACE (Portal Admin — amasteamwolf.com/space)

### S1: Auth + Layout + Dashboard — COMPLETADO
- [x] Login con JWT (bcrypt + jsonwebtoken)
- [x] Layout con sidebar (push desktop, overlay mobile)
- [x] Dashboard con stats reales (172 alumnos, 284 inscripciones)
- [x] Animated numbers, alertas de vencimientos, acciones rápidas
- [x] Design tokens v2 (glassmorphism, gradients, depth layers)

### S2: Graduaciones — COMPLETADO
- [x] CRUD completo (crear, editar, eliminar graduaciones)
- [x] 11 niveles de cinturón
- [x] Autocomplete de alumnos por nombre/DNI
- [x] Correcciones (resolver/rechazar)
- [x] Tabla vacía actualmente (necesita carga de datos)
- [x] Endpoint público actualizado (lee de tabla graduaciones)

### S3: Alumnos + Inscripciones — COMPLETADO
- [x] Lista de alumnos paginada con búsqueda y filtros
- [x] Detalle de alumno (datos + apoderado + inscripciones + asistencias)
- [x] Lista de inscripciones con filtros (programa, estado_pago, activa)
- [x] Alerta de inscripciones por vencer
- [x] Edición de inscripciones

### S4: Asistencia + Leads — PENDIENTE
- [ ] Reportes de asistencia desde SPACE (diario, semanal, por alumno)
- [ ] Gestión de leads (lista, cambiar estado, embudo conversión)
- [ ] Exportar datos

### S5: Configuración — PENDIENTE
- [ ] CRUD usuarios SPACE
- [ ] Gestionar sedes
- [ ] Horarios editables desde BD (reemplaza constante hardcodeada)

### S6: Mensajes/Comunicados — PENDIENTE (planificado)
- [ ] Enviar mensajes desde SPACE (difusión, por programa, individual)
- [ ] Bandeja de mensajes en perfil del padre
- [ ] Tracking de leídos
- [ ] Tablas: mensajes, mensajes_leidos

---

## Infraestructura

### Estado del deploy
- Frontend: push a GitHub → Easypanel auto-deploy
- Backend: imagen Docker committeada con archivos + deps
  - Entrypoint: /usr/local/bin/node /app/src/index.js
  - Network: easypanel-pallium + easypanel (Traefik)
  - Env vars: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS

### Problema recurrente (resuelto)
El container API perdía archivos al reiniciarse. Se resolvió con `docker commit` que guarda el estado completo en la imagen.

### Accesos
- Web: https://amasteamwolf.com
- API: https://amas-api.s6hx3x.easypanel.host
- SPACE: https://amasteamwolf.com/space
- SPACE login: saubinaud@amasteamwolf.com / amasteamwolf2026
- Servidor: ver cerebro/10-accesos.md

---

## Próximos pasos (en orden de prioridad)

1. **Deploy backend con archivos actualizados** (tokens v2, layout, dashboard mejorado)
2. **Cargar datos de graduaciones** de prueba para verificar el flujo completo
3. **S4: Asistencia + Leads** en SPACE
4. **S5: Configuración** (usuarios, sedes, horarios)
5. **S6: Mensajes** a padres
6. **Limpiar data basura** de la BD (entries de test "Perspiciatis accusa" etc.)
