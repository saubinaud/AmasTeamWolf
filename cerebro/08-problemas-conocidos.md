# 08 — Problemas Conocidos y Pendientes

## Pendientes

### Backend
- **Sin autenticación** en endpoints POST (matrícula, renovación, QR). Cualquiera con la URL puede enviar datos. Falta middleware de auth.
- **Emails fire-and-forget** — Si Notifuse falla, el padre no sabe. No hay retry ni notificación.
- **No hay audit trail** — No se registra quién creó/modificó registros.
- **formularios-academia-template/** — Directorio duplicado en el repo. Ocupa espacio. Evaluar si se puede eliminar.

### Frontend
- **TypeScript strict mode desactivado** (`strict: false` en tsconfig). Hay tipos `any` en App.tsx y PerfilPage.
- **No hay tests** — Ni unitarios ni e2e.
- **CSS de 6500 líneas** — index.css incluye todo Tailwind. Podría optimizarse con tree-shaking.
- **No hay ESLint** configurado. Solo tsc para type-check.

### UX
- **Formulario largo sin indicador de progreso** — FormularioMatricula es muy largo, el padre no sabe cuánto falta.
- **Sin confirmación de navegación** — Si el padre llena medio formulario y toca "Atrás", pierde todo sin warning.

### Infraestructura
- **Deploy backend manual** — Hay que SSH y docker exec. No hay CI/CD para el API.
- **Sin monitoreo** — No hay alertas si el API cae. Solo health check manual.
- **Backup BD** — Existe cron diario pero no se verifica automáticamente.

## Bugs conocidos

- Ninguno crítico actualmente (2026-04-07).

## Limitaciones del sistema

- **Un solo PIN para todas las profesoras** (2026). No se sabe quién generó el QR.
- **Horarios hardcodeados** en frontend. Cambiar horarios requiere deploy.
- **Una sola sede** (sede_id: 1 siempre). Si Dragon Knight usa el mismo panel, necesita selector.
- **WhatsApp notificaciones** no implementado (Evolution API está instalada pero no conectada).
