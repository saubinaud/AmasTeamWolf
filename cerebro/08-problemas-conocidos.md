# 08 — Problemas Conocidos y Pendientes

## Resueltos esta sesión
- ~~CSS 6500 líneas estático~~ → Tailwind v4 dinámico con @tailwindcss/vite
- ~~Auth Logto inestable~~ → JWT propio con bcrypt
- ~~PDFs Cloudinary corruptos~~ → bytea + disco
- ~~Sin panel admin~~ → Space con 9 módulos
- ~~Space endpoints sin auth~~ → middleware spaceAuth + requireAdmin
- ~~Modals transparentes invisibles~~ → React Portal + tokens sólidos
- ~~Mensajes a padres inexistentes~~ → sistema mensajes bidireccional

## Pendientes

### Backend
- **Matrícula/QR/Renovación públicos sin auth** — Todavía cualquiera puede POST. Deberían tener auth o rate limit más estricto.
- **Emails fire-and-forget** — Si Notifuse falla, nadie se entera. Falta retry + dead letter queue.
- **No hay audit trail** — Space no registra quién creó/modificó (podría usar `created_by` en más tablas).
- **Backups BD** — Existe cron pero no se verifica integridad.

### Frontend
- **TypeScript strict mode desactivado** (tsconfig `strict: false`). Hay `any` en varios lugares.
- **No hay tests** — Ni unitarios ni e2e.
- **No hay ESLint** configurado.
- **SpaceCompras.tsx 730 líneas** — Candidato a refactor en sub-componentes.

### UX
- **FormularioMatricula muy largo sin indicador** — El padre no sabe cuánto falta.
- **Sin confirmación de navegación** — Perder formulario a medio llenar.
- **Modal Space en mobile** — Funciona pero algunos forms podrían ser drawers.

### Infraestructura
- **Deploy backend manual** — SSH + scp + docker restart. Sin CI/CD.
- **Sin monitoreo** — No hay alertas si el API cae.
- **Un solo admin Space** — Aunque hay tabla `space_usuarios` con roles, falta UI para gestionar permisos finos.

## Ideas para próximas sesiones

- **WhatsApp notificaciones** — Evolution API está instalada, conectar con Space mensajes.
- **Reportes PDF desde Space** — Asistencia mensual, graduaciones, balance de pagos.
- **Dashboard con gráficos** — recharts ya está en el stack, falta usarlo en SpaceDashboard.
- **Multi-sede real** — Selector en Space, filtrar stats por sede.
- **Calendario editorial Mensajes** — Programar mensajes futuros.
- **Integración pagos online** — Culqi o Izipay para renovaciones sin transferencia manual.
- **CI/CD backend** — GitHub Actions + SSH deploy.

## Bugs conocidos
- Ninguno crítico actualmente.

## Limitaciones del sistema
- Un solo PIN para profesoras (no trackea quién generó QR).
- Horarios editables desde Space S5 (ya resuelto vs. hardcoded anterior).
- WhatsApp no conectado aún.
