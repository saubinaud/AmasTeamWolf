# 11 — SPACE (Portal Administrativo)

## Qué es
Portal web protegido en `/space` para gestionar la academia sin depender de Sheets o acceso directo a BD.

## Estado: En diseño (2026-04-07)

## Fases

| Fase | Nombre | Dependencias |
|------|--------|-------------|
| S1 | Auth + Layout + Dashboard | Ninguna (base) |
| S2 | Graduaciones CRUD | S1 (necesita auth) |
| S3 | Alumnos + Inscripciones | S1 |
| S4 | Asistencia reportes + Leads | S1 |
| S5 | Configuración (usuarios, sedes, horarios) | S1 |

## Tablas nuevas
- `space_usuarios` — login del SPACE (bcrypt + JWT)
- `space_sesiones` — tokens activos
- `graduaciones` — reemplaza Sheets (alumno, rango, horario, turno, fecha)
- `graduacion_correcciones` — reemplaza hack de leads para correcciones

## Rutas
- `/space` → Login
- `/space/dashboard` → Stats
- `/space/graduaciones` → CRUD
- `/space/alumnos` → Lista + detalle
- `/space/inscripciones` → Gestión
- `/space/asistencia` → Reportes
- `/space/leads` → Prospectos
- `/space/configuracion` → Usuarios, sedes, horarios

## Plan completo en `SPACE/PLAN_MAESTRO.md`
