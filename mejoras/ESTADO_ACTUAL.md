# Estado Actual del Proyecto — 2026-04-10

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
- [x] Auth propio (DNI + contraseña + JWT) — reemplazó Logto
- [x] Analytics (Umami + GA4 + Facebook Pixel)
- [x] Contratos PDF guardados en BD + disco (reemplazó Cloudinary)
- [x] Sistema de cinturones y graduaciones (historial + próxima)
- [x] Congelamientos de membresía conectados a BD real
- [x] Progreso por clases asistidas (no por días)

### Optimizaciones aplicadas
- [x] Tailwind v4.2.2 dinámico via @tailwindcss/vite (antes era CSS pre-compilado estático)
- [x] Seguridad: sin passwords hardcodeados, CORS restringido
- [x] Performance: bundle code splitting 16+ páginas, lazy images
- [x] Responsive: md: breakpoints, touch targets 44px
- [x] Backend: rate limiting, pool BD optimizado, validación input

---

## SPACE (Portal Admin — amasteamwolf.com/space)

### S1: Auth + Layout + Dashboard — COMPLETADO
- [x] Login con JWT (bcrypt + jsonwebtoken)
- [x] Layout con sidebar (push desktop, overlay mobile)
- [x] Dashboard con stats reales + alertas vencimientos
- [x] Design tokens v3 (fondos sólidos, sin transparencias)

### S2: Graduaciones — COMPLETADO
- [x] CRUD completo (crear, editar, eliminar graduaciones)
- [x] 13 niveles de cinturón (Blanco → Negro 3 Dan)
- [x] Aprobar graduación → actualiza cinturón automáticamente
- [x] Historial de cinturones por alumno
- [x] Correcciones (resolver/rechazar)

### S3: Alumnos + Inscripciones — COMPLETADO
- [x] Lista paginada con búsqueda por nombre/DNI
- [x] Detalle alumno (datos + apoderado + inscripciones + asistencias)
- [x] Lista inscripciones con filtros (programa, estado_pago, activa)
- [x] Alerta inscripciones por vencer
- [x] Edición de inscripciones
- [x] Modals con React Portal (createPortal) para renderizado correcto

### S4: Asistencia + Leads — PENDIENTE
- [ ] Vista de asistencia en SPACE (diaria, por clase, por alumno)
- [ ] Reportes de asistencia (semanal, mensual)
- [ ] Exportar asistencia a CSV
- [ ] Gestión de leads (lista, cambiar estado, embudo)
- [ ] Exportar leads

### S5: Configuración — PENDIENTE
- [ ] CRUD usuarios SPACE
- [ ] Gestionar sedes
- [ ] Horarios editables desde BD

### S6: Mensajes/Comunicados — PENDIENTE
- [ ] Enviar mensajes desde SPACE (difusión, por programa, individual)
- [ ] Bandeja de mensajes en perfil del padre
- [ ] Tracking de leídos

---

## Infraestructura

### Deploy
- **Frontend:** push a main → GitHub Actions → GitHub Pages
- **Backend:** SCP archivos a /opt/amas-api/ → docker build → docker run
- **Tailwind:** v4.2.2 dinámico, se genera en cada build
- **Container:** amas-api con volumen /opt/amas-contratos, 2 redes (easypanel + easypanel-pallium)

### Env vars del container
- DB: DB_HOST=pallium_amas-db, DB_PORT=5432, DB_NAME=amas_database
- Auth: JWT_SECRET, SPACE_JWT_SECRET
- Cloudinary: CLOUD_NAME, API_KEY, API_SECRET (solo para imágenes, no PDFs)
- Notifuse: URL, TOKEN, WORKSPACE=amaswolf
- CONTRATOS_DIR=/opt/amas-contratos

### Accesos
- Web: https://amasteamwolf.com
- API: https://amas-api.s6hx3x.easypanel.host
- SPACE: https://amasteamwolf.com/space
- SPACE login: saubinaud@amasteamwolf.com

---

## Próximos pasos

1. **S4: Asistencia + Leads** en SPACE
2. **Limpiar data basura** de BD (entries de test)
3. **S5: Configuración** (usuarios, sedes, horarios)
4. **S6: Mensajes** a padres
