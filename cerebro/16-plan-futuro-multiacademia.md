# 16 — Plan a futuro: Multi-academia

## Visión

Un **Space central** que gestione múltiples academias desde un solo panel. Cada academia tiene su propia web pública, su propia data, pero se administran todas desde Space.

## Academias

| Academia | Dominio | Repo | BD | Estado |
|---|---|---|---|---|
| **AMAS Team Wolf** | amasteamwolf.com | saubinaud/AmasTeamWolf | amas_database | Operativo |
| **AMAS Dragon Knight** | dragon-knight.amasteamwolf.com | saubinaud/Amas-Dragon-Knight | dragonknight_database (puerto 5436) | Básico (sin Space) |
| *(futuras)* | *.amasteamwolf.com | — | — | Plan |

## Arquitectura actual (separada)

Cada academia tiene:
- Su propio repo GitHub
- Su propio frontend (React SPA)
- Su propio backend Express (o comparte el de AMAS)
- Su propia base de datos PostgreSQL

**La data NO está compartida** — cada academia tiene su propia BD con sus alumnos, inscripciones, asistencias, etc.

## Arquitectura futura (multi-tenant)

### Opción A: Space central con switch de academia
- Un solo Space (el de AMAS) con un selector de academia en el header
- Al cambiar de academia, todas las queries apuntan a la BD correspondiente
- Requiere: connection pool por academia, middleware que inyecte el tenant_id

### Opción B: Space central con API gateway
- Space hace requests a diferentes backends según la academia seleccionada
- Cada academia mantiene su propio API
- Más fácil de implementar, menos acoplamiento

### Opción C: Base de datos compartida con tenant_id
- Una sola BD con columna `academia_id` en cada tabla
- Todas las queries filtran por academia_id
- Riesgo: data leakage entre academias si se olvida un filtro

### Recomendación
**Opción A o B** — mantener BDs separadas es más seguro para la data. La Opción B es la más rápida de implementar: un dropdown en Space que cambia la `API_BASE` URL.

## Lo que NO hacer todavía
- No fusionar los repos
- No compartir tablas entre academias
- No construir el multi-tenant hasta que ambas academias estén estabilizadas con las mismas features

## Lo que SÍ hacer ahora
- Mantener Dragon Knight como proyecto independiente
- Portar features de AMAS a Dragon Knight cuando estén estabilizadas
- Asegurar que la arquitectura de AMAS sea "tenant-ready" (no hardcodear sede_id=1, no asumir una sola academia)

## Dragon Knight — estado actual
- Ruta: `/Users/sebastien/Documents/Amas-Dragon-Knight`
- Repo: `github.com/saubinaud/Amas-Dragon-Knight`
- Stack: React + Express + Vite (mismo que AMAS)
- BD: `dragonknight_database` / `dk_user` / puerto 5436
- Tiene: matrícula, QR asistencia, contratos PDF, torneo, graduación
- NO tiene: Space, auth JWT, referidos, clases prueba, profesores, catálogo
