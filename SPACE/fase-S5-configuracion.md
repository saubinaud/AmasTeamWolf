# Fase S5 — Configuración

## Objetivo
Gestionar usuarios del SPACE, sedes, y horarios (que actualmente están hardcodeados).

## Backend

### 1. Endpoints space-config.js

**Usuarios:**
- `GET /api/space/config/usuarios` — lista (solo admin)
- `POST /api/space/config/usuarios` — crear usuario (solo admin)
- `PUT /api/space/config/usuarios/:id` — editar/desactivar (solo admin)
- `PUT /api/space/config/usuarios/:id/password` — cambiar contraseña

**Sedes:**
- `GET /api/space/config/sedes` — lista sedes
- `POST /api/space/config/sedes` — crear sede
- `PUT /api/space/config/sedes/:id` — editar sede

**Horarios:**
- `GET /api/space/config/horarios` — lista horarios por sede y día
- `POST /api/space/config/horarios` — crear horario
- `PUT /api/space/config/horarios/:id` — editar
- `DELETE /api/space/config/horarios/:id` — eliminar

### 2. Migrar horarios de frontend a BD
- Poblar tabla `horarios` con los datos actuales de AsistenciaPanelPage.tsx
- Crear endpoint público `GET /api/horarios?sede_id=1&dia=1` 
- Actualizar AsistenciaPanelPage.tsx para cargar horarios de la API en vez de constante

## Frontend

### 3. SpaceConfig.tsx
- **Tabs**: Usuarios | Sedes | Horarios
- **Usuarios**: tabla CRUD, crear con email+nombre+rol+password, editar, desactivar
- **Sedes**: lista simple, crear/editar nombre+dirección
- **Horarios**: grid visual día×hora, agregar/quitar clases con selector de programa
  - Vista tipo calendario semanal
  - Click en celda → selector de programa
  - Colores por programa (mismos que AsistenciaPanelPage)

## Impacto en otras partes

### 4. Actualizar AsistenciaPanelPage.tsx
- Reemplazar constante `HORARIOS` por fetch a `/api/horarios`
- Si falla el fetch, usar los horarios hardcodeados como fallback

## Agentes asignados
- **Agente 1**: Backend (CRUD usuarios, sedes, horarios + endpoint público horarios)
- **Agente 2**: Frontend (SpaceConfig con 3 tabs + actualizar AsistenciaPanelPage)
