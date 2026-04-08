# 02 — Arquitectura

## Frontend (SPA React)

Single Page Application. No usa router — maneja navegación con estado `currentPage` en App.tsx.

```
src/
├── App.tsx              — Router principal (estado currentPage)
├── main.tsx             — Entry point
├── index.css            — Tailwind + CSS custom (scroll, animaciones)
├── config/api.ts        — API_BASE (dev: /api, prod: easypanel URL)
├── contexts/
│   └── AuthContext.tsx   — Logto auth + perfil del usuario
├── hooks/
│   └── useNetworkStatus.ts — Detecta conexión lenta / data saver
├── components/
│   ├── ui/              — shadcn/ui components (Button, Input, Dialog, etc.)
│   ├── figma/           — Componentes exportados de Figma
│   ├── HomePage.tsx     — Landing principal (hero + secciones)
│   ├── HeroHome.tsx     — Hero con CTA
│   ├── ProgramasSection.tsx — Grid de programas (3, 6 meses, etc.)
│   ├── TiendaSection.tsx — Preview de tienda en home
│   ├── TiendaPage.tsx   — Tienda completa
│   ├── FormularioMatricula.tsx — Formulario de inscripción (Dialog)
│   ├── FormularioRenovacion.tsx — Formulario de renovación
│   ├── PopupPago.tsx    — Modal de pago (Yape, transferencia)
│   ├── CartDrawerHome.tsx — Carrito lateral (Sheet)
│   ├── PerfilPage.tsx   — Perfil mobile (calendario asistencia)
│   ├── PerfilDesktop.tsx — Perfil desktop/tablet
│   ├── AsistenciaPage.tsx — Registro asistencia (alumno escanea QR)
│   ├── AsistenciaPanelPage.tsx — Panel profesora (genera QR, ve presentes)
│   ├── GraduacionPage.tsx — Graduaciones
│   ├── TorneoPage.tsx   — Inscripción torneo
│   ├── RegistroLeadershipPage.tsx — Inscripción Leadership Wolf
│   ├── RegistroShowroomPage.tsx — Registro visita showroom
│   ├── LandingConversion.tsx — Landing clase de prueba
│   ├── HeaderMain.tsx   — Header con nav + carrito
│   └── OptimizedImage.tsx — Imágenes optimizadas (Cloudinary, lazy, data saver)
└── pages/
    └── RenovacionPage.tsx — Página de renovación
```

## Backend (Express API)

```
api/
├── src/
│   ├── index.js         — Server Express, CORS, rate limiting, routes
│   ├── db.js            — Pool PostgreSQL (max:20, timeout:10s)
│   ├── cloudinary.js    — Upload de PDFs/imágenes
│   ├── notifuse.js      — Envío de emails transaccionales
│   └── routes/
│       ├── asistencia.js — POST registro, GET hoy, GET exportar CSV, GET dashboard
│       ├── qr.js        — POST generar, GET validar, GET activas
│       ├── matricula.js — POST inscripción (transacción)
│       ├── renovacion.js — POST renovación + /navidad
│       ├── perfil.js    — POST obtener/vincular perfil
│       ├── vincular.js  — POST buscar/vincular cuenta
│       ├── leads.js     — POST crear lead + /showroom + /evento-navidad
│       ├── graduacion.js — GET lista + POST corrección
│       ├── leadership.js — POST inscripción Leadership
│       ├── implementos.js — POST pedido implementos
│       ├── torneo.js    — GET consultar DNI + POST registro
│       └── contratos.js — POST generar PDF contrato
├── package.json
└── Dockerfile
```

## Base de datos

PostgreSQL 17 en Docker Swarm (`pallium_amas-db`).
Schema completo en `database/01_schema.sql`.
Funciones en `database/02_functions.sql`.
Vistas en `database/03_views.sql`.

## Servicios externos

| Servicio | Para qué | URL |
|----------|----------|-----|
| Logto | Auth (login, registro) | auth.nodumstudio.com |
| Notifuse | Emails de confirmación | emailmarketing-notifuse.s6hx3x.easypanel.host |
| Cloudinary | PDFs contratos, imágenes | dkoocok3j |
| QR Server API | Generar QR de asistencia | api.qrserver.com |
| Umami | Analytics | stats.nodumstudio.com |
| Facebook Pixel | Tracking ads | ID: 1405101054435929 |
