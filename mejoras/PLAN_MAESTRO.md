# Plan Maestro de Mejoras — AMAS Team Wolf

> Auditoría: 2026-04-07 | Estado: En progreso

## Resumen

| Fase | Nombre | Issues | Estado |
|------|--------|--------|--------|
| 1 | Seguridad | 7 críticos/altos | Pendiente |
| 2 | Calidad de código | 8 altos/medios | Pendiente |
| 3 | Performance y UX | 7 medios | Pendiente |

## Detalle por fase

### [Fase 1 — Seguridad](./fase-1-seguridad.md)
- Quitar password hardcodeado de db.js
- Eliminar console.logs de producción
- Mascarar cuentas bancarias en PopupPago
- Corregir CORS demasiado amplio
- Fix error lógico en leads.js
- npm audit fix
- Fix AsistenciaPage API_BASE hardcodeado

### [Fase 2 — Calidad de código](./fase-2-calidad.md)
- Estandarizar respuestas de error en backend
- Validación de input en todos los endpoints
- Habilitar TypeScript strict gradualmente
- Fix tipos `any` en App.tsx y PerfilPage
- Respuestas consistentes {success, error, data}
- Validar env vars al arrancar servidor
- Actualizar archivos .sql del repo

### [Fase 3 — Performance y UX](./fase-3-performance.md)
- Code splitting del bundle (1MB → objetivo <500KB)
- Rate limiting en endpoints sensibles
- Optimizar pool de BD (max connections, timeout)
- Mejorar N+1 queries en perfil
- Aria-labels en botones de solo ícono
- Limpiar archivos innecesarios (backup, template duplicado)
- Agregar scripts npm (lint, type-check)
