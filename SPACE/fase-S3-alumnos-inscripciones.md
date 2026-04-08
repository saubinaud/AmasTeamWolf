# Fase S3 — Alumnos + Inscripciones

## Objetivo
Ver, buscar y editar alumnos e inscripciones desde el SPACE.

## Backend

### 1. Endpoints space-alumnos.js
- `GET /api/space/alumnos` — lista paginada (?page=, ?limit=, ?search=, ?estado=)
- `GET /api/space/alumnos/:id` — detalle con inscripciones, asistencias, pagos
- `PUT /api/space/alumnos/:id` — editar datos alumno
- `GET /api/space/alumnos/stats` — total activos, inactivos, congelados

### 2. Endpoints space-inscripciones.js
- `GET /api/space/inscripciones` — lista (?estado_pago=, ?programa=, ?activa=)
- `GET /api/space/inscripciones/:id` — detalle con pagos y contrato
- `PUT /api/space/inscripciones/:id` — editar (cambiar estado, fechas, precio)
- `GET /api/space/inscripciones/vencimientos` — próximos a vencer (7 días)

## Frontend

### 3. SpaceAlumnos.tsx
- **Lista**: tabla con búsqueda por nombre/DNI, filtro por estado
- **Detalle**: al click, panel lateral o página con:
  - Datos del alumno y apoderado
  - Inscripciones (activas e históricas)
  - Historial de asistencia (últimos 30 días)
  - Pagos registrados
  - Botón editar
- **Paginación**: 20 por página

### 4. SpaceInscripciones.tsx
- **Lista**: filtros por programa, estado pago, activa/vencida
- **Alertas**: badge rojo en inscripciones que vencen esta semana
- **Detalle**: editar estado, ver contrato, ver pagos
- **Stats**: cards con conteo por programa

## Agentes asignados
- **Agente 1**: Backend (4 endpoints alumnos + 4 endpoints inscripciones)
- **Agente 2**: Frontend (SpaceAlumnos + SpaceInscripciones)
