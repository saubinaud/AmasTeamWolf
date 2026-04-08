# SPACE — Plan Maestro

> Portal administrativo de AMAS Team Wolf
> Estado: En diseño | Inicio: 2026-04-07

## Qué es SPACE

Un portal web protegido por contraseña donde Sebastien y su equipo pueden:
- Gestionar graduaciones (reemplaza el Google Sheets)
- Ver y editar alumnos, inscripciones, pagos
- Ver reportes de asistencia
- Gestionar leads y prospectos
- Futuras apps/módulos

## Acceso

- URL: `https://amasteamwolf.com/space`
- Login con usuario + contraseña (tabla `space_usuarios` en BD)
- Roles: `admin` (todo), `profesor` (asistencia + graduación)

## Arquitectura

```
/space                  → Login
/space/dashboard        → Panel principal con stats
/space/graduaciones     → CRUD graduaciones
/space/alumnos          → Lista alumnos + detalle
/space/inscripciones    → Inscripciones activas/vencidas
/space/asistencia       → Reportes de asistencia
/space/leads            → Prospectos y correcciones
/space/configuracion    → Usuarios, sedes, horarios
```

El SPACE vive dentro de la misma SPA React (nueva sección en App.tsx).
Backend: nuevos endpoints bajo `/api/space/`.
Auth: middleware propio con JWT simple (no Logto — es para admin, no padres).

## Fases

| Fase | Nombre | Descripción |
|------|--------|-------------|
| **S1** | Auth + Layout | Login, JWT, layout con sidebar, dashboard básico |
| **S2** | Graduaciones | CRUD completo (reemplaza Sheets), campos: rango, horario, turno, fecha |
| **S3** | Alumnos + Inscripciones | Lista, búsqueda, detalle, edición |
| **S4** | Asistencia + Leads | Reportes, exportar, gestionar leads |
| **S5** | Configuración | Usuarios, sedes, horarios editables |

## Tablas nuevas en BD

### space_usuarios
```sql
CREATE TABLE space_usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(20) DEFAULT 'profesor' CHECK (rol IN ('admin', 'profesor')),
  activo BOOLEAN DEFAULT true,
  ultimo_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### graduaciones
```sql
CREATE TABLE graduaciones (
  id SERIAL PRIMARY KEY,
  alumno_id INTEGER REFERENCES alumnos(id),
  inscripcion_id INTEGER REFERENCES inscripciones(id),
  nombre_alumno VARCHAR(200) NOT NULL,
  apellido_alumno VARCHAR(200) NOT NULL,
  rango VARCHAR(100),          -- "Cinturón Amarillo", "Punta Verde", etc.
  horario VARCHAR(50),          -- "3:30 PM", "10:00 AM"
  turno VARCHAR(50),            -- "Primer Turno", "Segundo Turno"
  fecha_graduacion DATE NOT NULL,
  sede_id INTEGER REFERENCES sedes(id),
  estado VARCHAR(30) DEFAULT 'programada' CHECK (estado IN ('programada', 'completada', 'cancelada')),
  observaciones TEXT,
  created_by INTEGER REFERENCES space_usuarios(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_graduaciones_fecha ON graduaciones(fecha_graduacion);
CREATE INDEX idx_graduaciones_alumno ON graduaciones(alumno_id);
```

### graduacion_correcciones (reemplaza el hack de leads)
```sql
CREATE TABLE graduacion_correcciones (
  id SERIAL PRIMARY KEY,
  graduacion_id INTEGER REFERENCES graduaciones(id),
  nombre VARCHAR(200),
  apellido VARCHAR(200),
  correo VARCHAR(150),
  comentario TEXT NOT NULL,
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'resuelta', 'rechazada')),
  resuelta_por INTEGER REFERENCES space_usuarios(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### space_sesiones (para JWT refresh)
```sql
CREATE TABLE space_sesiones (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES space_usuarios(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Archivos a crear

### Backend
```
api/src/
├── middleware/
│   └── spaceAuth.js        — Middleware JWT para /api/space/*
├── routes/
│   ├── space-auth.js       — POST login, POST logout, GET me
│   ├── space-graduaciones.js — CRUD graduaciones
│   ├── space-alumnos.js    — GET lista, GET detalle, PUT editar
│   ├── space-inscripciones.js — GET lista, GET detalle
│   ├── space-asistencia.js — GET reportes, GET exportar
│   ├── space-leads.js      — GET lista, PUT estado
│   └── space-config.js     — CRUD usuarios, sedes, horarios
```

### Frontend
```
src/components/space/
├── SpaceApp.tsx           — Router del SPACE (sub-SPA)
├── SpaceLogin.tsx         — Pantalla de login
├── SpaceLayout.tsx        — Layout con sidebar + header
├── SpaceDashboard.tsx     — Dashboard con stats generales
├── SpaceGraduaciones.tsx  — Lista + formulario graduaciones
├── SpaceAlumnos.tsx       — Lista + detalle alumnos
├── SpaceInscripciones.tsx — Lista inscripciones
├── SpaceAsistencia.tsx    — Reportes asistencia
├── SpaceLeads.tsx         — Gestión leads
└── SpaceConfig.tsx        — Configuración
```
