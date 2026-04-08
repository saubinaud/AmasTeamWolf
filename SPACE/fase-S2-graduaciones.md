# Fase S2 — Módulo de Graduaciones

## Objetivo
CRUD completo de graduaciones que reemplaza el Google Sheets. La página pública /graduacion lee de la nueva tabla.

## Backend

### 1. Crear tabla graduaciones + graduacion_correcciones en BD

### 2. Endpoints space-graduaciones.js (protegidos con spaceAuth)
- `GET /api/space/graduaciones` — lista con filtros (?fecha=, ?turno=, ?estado=)
- `GET /api/space/graduaciones/:id` — detalle
- `POST /api/space/graduaciones` — crear nueva
- `PUT /api/space/graduaciones/:id` — editar
- `DELETE /api/space/graduaciones/:id` — eliminar (soft delete → estado='cancelada')
- `POST /api/space/graduaciones/bulk` — crear múltiples (para carga masiva)
- `GET /api/space/graduaciones/correcciones` — lista correcciones pendientes
- `PUT /api/space/graduaciones/correcciones/:id` — marcar como resuelta

### 3. Actualizar GET /api/graduacion (público)
- Cambiar la query para que lea de tabla `graduaciones` en vez de `inscripciones`
- Filtrar: estado='programada', fecha_graduacion >= hoy
- Devolver: NOMBRE, APELLIDO, RANGO, HORARIO, TURNO, FECHA
- Mantener backward compatibility

### 4. Actualizar POST /api/graduacion/correccion (público)
- Insertar en `graduacion_correcciones` en vez de `leads`

## Frontend

### 5. SpaceGraduaciones.tsx
- **Vista lista**: tabla con columnas (Alumno, Rango, Horario, Turno, Fecha, Estado)
- **Filtros**: por fecha, turno, estado
- **Botón "Agregar"**: abre formulario
- **Click en fila**: abre detalle editable
- **Formulario**: 
  - Buscar alumno por DNI/nombre (autocomplete desde alumnos)
  - Campos: rango (select con opciones), horario, turno (select), fecha, observaciones
  - Guardar / Cancelar
- **Carga masiva**: botón para subir CSV o agregar múltiples
- **Correcciones**: tab con lista de correcciones pendientes, marcar como resuelta

### 6. Actualizar GraduacionPage.tsx (público)
- Ahora recibe datos completos (RANGO, HORARIO, TURNO)
- Las tarjetas se llenan correctamente con todos los campos

## Agentes asignados
- **Agente 1**: Backend (tabla + CRUD endpoints + actualizar endpoint público)
- **Agente 2**: Frontend (SpaceGraduaciones + actualizar GraduacionPage)
