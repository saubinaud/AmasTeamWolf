# 08 — Problemas Conocidos y Pendientes

## Resueltos (último ciclo)
- ~~Login 500 por columnas generadas no aplicadas~~ → migración re-aplicada + regla R1
- ~~Búsqueda lenta (REPLACE en cada query)~~ → columnas generadas + índices
- ~~Input tipo documento bloqueado~~ → campos separados
- ~~Frecuencia mostraba datos inventados~~ → "—" si null
- ~~Dashboard "por vencer" sin acción~~ → filtro + link funcional
- ~~Asistencia profesores sin módulo~~ → nuevo sub-item en sidebar
- ~~6 issues HIGH frontend (optional chaining, error handling)~~ → auditoría + fix

## Pendientes técnicos

### Backend
- **Endpoints públicos sin auth** (matrícula, QR, renovación) — cualquiera con URL puede POST
- **Emails fire-and-forget** — sin retry ni dead letter queue
- **No hay audit trail** — Space no registra quién creó/modificó (solo `created_by` parcial)
- **Deploy backend manual** — SSH + scp + docker restart, sin CI/CD

### Frontend
- **TypeScript strict mode OFF** — hay `any` en varios lugares
- **No hay tests** — ni unitarios ni e2e
- **SpaceRenovar** — no tiene tipo_documento para apoderado (parcialmente implementado)
- **PerfilDesktop** — no tiene las mismas mejoras que PerfilPage (pagos, referidos, elegibilidad)

### UX
- **FormularioMatricula** web pública no tiene tipo_documento (solo DNI)
- **QR panel en embed mode** — la altura `min-h-[80dvh]` puede no funcionar perfecto en todos los Android

## Fases pendientes (F11-F14)

### F11 — Pasarela Culqi (requiere cuenta)
Pago con tarjeta (+3% comisión). Precio Yape/transfer sin comisión. Mostrar ambos.

### F12 — Torneos desde perfil
Registro, modalidades, afiche, pago. Diferencia regional/nacional/Panamericano.

### F13 — QR único inteligente
1 solo QR diario que detecta automáticamente la clase del alumno por categoría/horario.

### F14 — Pendiente info David
Wolf Instructor, Fighter Wolf, contrato modificado, cartillas de deberes, audios.

## Ideas futuras (del plan maestro)
- WhatsApp notificaciones (Evolution API instalada)
- Reportes PDF desde Space
- Gráficos con recharts en Dashboard
- Multi-sede real con selector
- Calendario editorial de mensajes
- CI/CD backend con GitHub Actions
- PDF compartibles (Google Drive links con botón descargar)
- Tienda de implementos con fotos en perfil del alumno
