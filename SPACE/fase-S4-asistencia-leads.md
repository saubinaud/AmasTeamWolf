# Fase S4 — Reportes Asistencia + Gestión Leads

## Objetivo
Reportes de asistencia visuales + gestión de leads/prospectos.

## Backend

### 1. Endpoints space-asistencia.js
- `GET /api/space/asistencia/diario` — reporte de un día (?fecha=)
- `GET /api/space/asistencia/semanal` — resumen semanal (?desde=)
- `GET /api/space/asistencia/alumno/:id` — historial completo de un alumno
- `GET /api/space/asistencia/exportar` — CSV con filtros (?desde=, ?hasta=, ?programa=)

### 2. Endpoints space-leads.js
- `GET /api/space/leads` — lista paginada (?estado=, ?plataforma=, ?desde=)
- `PUT /api/space/leads/:id` — cambiar estado (Nuevo → Contactado → Convertido)
- `GET /api/space/leads/stats` — conteo por estado, por plataforma, por mes
- `DELETE /api/space/leads/:id` — eliminar

## Frontend

### 3. SpaceAsistencia.tsx
- **Vista diaria**: selector de fecha, lista de presentes agrupados por clase/turno
- **Vista semanal**: grid con días vs clases, conteo en cada celda
- **Vista por alumno**: buscar alumno → calendario con días asistidos
- **Exportar**: botón CSV con filtros
- **Stats**: gráficos simples (barras por día, por programa)

### 4. SpaceLeads.tsx
- **Lista**: tabla con nombre, teléfono, estado, plataforma, fecha
- **Cambiar estado**: dropdown inline (Nuevo → Contactado → Convertido → Descartado)
- **Filtros**: por estado, plataforma (Web, Instagram, Facebook), rango de fecha
- **Stats**: embudo de conversión (cuántos en cada estado)
- **Correcciones graduación**: tab separado mostrando las correcciones de la página pública

## Agentes asignados
- **Agente 1**: Backend (asistencia reportes + leads CRUD)
- **Agente 2**: Frontend (SpaceAsistencia + SpaceLeads)
