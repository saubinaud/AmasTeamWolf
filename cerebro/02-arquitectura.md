# 02 — Arquitectura

## Frontend (SPA React + Tailwind v4 dinámico)

Single Page Application. Router manual via `currentPage` state en App.tsx.

**Tailwind v4 con generación dinámica:**
- `@tailwindcss/vite` plugin en `vite.config.ts`
- `src/index.css` solo tiene: `@import "tailwindcss"` + `@import "./styles/globals.css"`
- Las clases se generan al vuelo al compilar — ya NO hay CSS pre-compilado estático
- Esto arregla el bug antiguo donde clases no usadas inicialmente no existían

```
src/
├── App.tsx              — Router principal (estado currentPage)
├── main.tsx             — Entry (AuthProvider directo, sin LogtoProvider)
├── index.css            — 2 líneas: import tailwindcss + globals
├── styles/globals.css   — Tokens, dark theme, select dropdowns
├── config/api.ts        — API_BASE (dev: /api, prod: easypanel URL)
├── contexts/
│   └── AuthContext.tsx   — JWT propio (DNI+password), mensajes: MensajeData[]
├── hooks/
│   └── useNetworkStatus.ts — Detecta conexión lenta / data saver
├── components/
│   ├── ui/              — shadcn/ui (Button, Input, Dialog, etc.)
│   ├── figma/           — Componentes exportados de Figma
│   ├── HomePage.tsx, HeroHome.tsx, HeaderMain.tsx, etc.
│   ├── PerfilPage.tsx   — Perfil mobile (lista mensajes, marcar leído)
│   ├── PerfilDesktop.tsx — Perfil desktop (usa user.mensajes[], no mensaje singular)
│   ├── AsistenciaPage.tsx, AsistenciaPanelPage.tsx
│   ├── FormularioMatricula.tsx, FormularioRenovacion.tsx
│   ├── space/           — PANEL ADMINISTRATIVO
│   │   ├── SpaceApp.tsx        — Router Space (dashboard/alumnos/...)
│   │   ├── SpaceLayout.tsx     — Sidebar con 9 ítems
│   │   ├── SpaceLogin.tsx
│   │   ├── SpaceDashboard.tsx
│   │   ├── SpaceAlumnos.tsx    — Lista + detalle + implementos + edit
│   │   ├── SpaceInscripciones.tsx
│   │   ├── SpaceGraduaciones.tsx — CRUD + aprobar (historial_cinturones)
│   │   ├── SpaceAsistencia.tsx — Stats, hoy, exportar, "Tomar asistencia"
│   │   ├── SpaceLeads.tsx      — Embudo + exportar
│   │   ├── SpaceCompras.tsx    — Registro implementos por alumno
│   │   ├── SpaceMensajes.tsx   — Difusión/programa/individual + tracking leídos
│   │   ├── SpaceConfig.tsx     — 3 tabs: usuarios, sedes, horarios (admin)
│   │   ├── Modal.tsx           — React Portal (z-index 99999)
│   │   └── tokens.ts           — Tokens SOLIDOS (bg-zinc-900, no backdrop-blur)
└── pages/
    └── RenovacionPage.tsx
```

## Backend (Express API)

```
api/
├── src/
│   ├── index.js                        — Express, CORS, rate limiting, routes
│   ├── db.js                           — Pool PostgreSQL (max:20, timeout:10s)
│   ├── cloudinary.js                   — Nombre legacy: ahora guarda en bytea + disco
│   ├── notifuse.js                     — Emails transaccionales
│   ├── middleware/
│   │   ├── auth.js                     — authMiddleware (JWT apoderados)
│   │   └── spaceAuth.js                — spaceAuth + requireAdmin + spaceRequestLogger
│   └── routes/
│       ├── auth.js                     — DNI+password, cargarPerfil() con mensajes
│       ├── asistencia.js, qr.js, matricula.js, renovacion.js
│       ├── perfil.js, vincular.js, leads.js
│       ├── graduacion.js, leadership.js, implementos.js, torneo.js
│       ├── contratos.js                — Genera PDF → guarda bytea + disco
│       ├── space-auth.js               — Login Space
│       ├── space-dashboard.js          — /stats
│       ├── space-alumnos.js            — CRUD + LATERAL JOIN + implementos
│       ├── space-inscripciones.js      — CRUD, vencimientos (allowedFields corregidos)
│       ├── space-graduaciones.js       — CRUD + aprobar + correcciones
│       ├── space-asistencia.js         — 6 endpoints (usa `asistio = 'Sí'` VARCHAR)
│       ├── space-leads.js              — Stats, list, embudo, exportar
│       ├── space-config.js             — 14 endpoints (usuarios/sedes/horarios)
│       ├── space-mensajes.js           — 6 endpoints + auto-crea tablas
│       └── space-compras.js            — 7 endpoints, incluye armas-alumno/:id
├── package.json
└── Dockerfile
```

## Base de datos

PostgreSQL 17 en Docker Swarm (`pallium_amas-db`).
Schema inicial en `database/01_schema.sql`. Las tablas Space fueron agregadas via migraciones ad-hoc este sesión.

## Servicios externos

| Servicio | Para qué | URL |
|----------|----------|-----|
| Notifuse | Emails de confirmación | emailmarketing-notifuse.s6hx3x.easypanel.host |
| QR Server API | Generar QR de asistencia | api.qrserver.com |
| Umami | Analytics | stats.nodumstudio.com |
| Facebook Pixel | Tracking ads | ID: 1405101054435929 |

**Removidos:**
- ~~Logto~~ — reemplazado por JWT propio (auth.js)
- ~~Cloudinary~~ — reemplazado por bytea + /opt/amas-contratos
