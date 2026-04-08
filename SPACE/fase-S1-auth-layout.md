# Fase S1 — Auth + Layout del SPACE

## Objetivo
Login funcional + layout base con sidebar + dashboard con stats reales.

## Backend

### 1. Crear tablas en BD
```sql
-- space_usuarios
-- space_sesiones
-- Insertar admin inicial: sebastien / password hasheado con bcrypt
```

### 2. Middleware spaceAuth.js
- Verifica header `Authorization: Bearer TOKEN`
- Decodifica JWT, busca usuario en BD
- Rechaza si token expirado o usuario inactivo
- Agrega `req.spaceUser` con {id, nombre, email, rol}

### 3. Endpoints space-auth.js
- `POST /api/space/login` — email + password → JWT token (24h)
- `POST /api/space/logout` — invalida sesión
- `GET /api/space/me` — devuelve usuario actual

### 4. Instalar dependencias
- `bcrypt` (hash passwords)
- `jsonwebtoken` (JWT)

## Frontend

### 5. SpaceLogin.tsx
- Formulario email + password
- Estilo dark, logo AMAS, botón naranja
- Guarda token en localStorage
- Redirige a /space/dashboard

### 6. SpaceLayout.tsx
- Sidebar izquierdo (colapsable en mobile)
- Header con nombre usuario + logout
- Items: Dashboard, Graduaciones, Alumnos, Inscripciones, Asistencia, Leads, Config
- Active state según página actual

### 7. SpaceDashboard.tsx
- Cards de stats: total alumnos activos, inscripciones activas, asistencias hoy, leads nuevos
- Fetches: 4 queries a endpoints existentes

### 8. SpaceApp.tsx
- Sub-router dentro del SPACE
- Maneja estado `spacePage`
- Wrappea todo en auth check (si no logueado → login)

### 9. Integrar en App.tsx
- Detectar ruta /space/* → renderizar SpaceApp (lazy loaded)

## Agentes asignados
- **Agente 1**: Backend (tablas BD + middleware + auth endpoints)
- **Agente 2**: Frontend (Login + Layout + Dashboard + SpaceApp + integración App.tsx)
