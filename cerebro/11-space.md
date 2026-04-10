# 11 — SPACE (Portal Administrativo)

## Qué es
Portal web protegido en `/space` para gestionar la academia sin depender de Sheets o acceso directo a BD. Panel completo con 9 módulos.

## Estado: Operativo (2026-04-07)

## Fases

| Fase | Nombre | Estado |
|------|--------|--------|
| S1 | Auth + Layout + Dashboard | ✅ Completa |
| S2 | Graduaciones CRUD + Historial | ✅ Completa |
| S3 | Alumnos + Inscripciones | ✅ Completa |
| S4 | Asistencia reportes + Leads | ✅ Completa |
| S5 | Configuración (usuarios, sedes, horarios) | ✅ Completa |
| S6 | Mensajes (Space ↔ Perfil) | ✅ Completa |
| S7 | Compras (registro implementos) | ✅ Completa |

## Arquitectura

**Auth:**
- Tabla `space_usuarios` (bcrypt + JWT)
- Middleware `spaceAuth` en `/api/space/*` (excepto `/auth`)
- Middleware `requireAdmin` en `/api/space/config/*`
- `spaceRequestLogger` loggea todas las requests

**Frontend:**
- `src/components/space/SpaceApp.tsx` — router con `currentPage` state
- `src/components/space/SpaceLayout.tsx` — sidebar 9 ítems
- `src/components/space/tokens.ts` — **SÓLIDOS** (`bg-zinc-900 border border-zinc-800`), SIN transparencia
- `src/components/space/Modal.tsx` — React `createPortal` a `document.body`, z-index 99999

**Backend:**
- 10 archivos `api/src/routes/space-*.js`
- Todos usan `queryOne`/`query` de `db.js`

## Módulos

### Dashboard (`/space/dashboard`)
Stats: alumnos activos, inscripciones activas, asistencias hoy, leads nuevos, inscripciones por vencer, últimas asistencias, último login Space.

### Alumnos (`/space/alumnos`)
- Lista paginada con LATERAL JOIN (muestra programa, clases, cinturón actual)
- Filtros: búsqueda, programa, estado
- Detalle: datos alumno + inscripciones + asistencias + **implementos comprados**
- Modal edición completo

### Inscripciones (`/space/inscripciones`)
- Lista con filtros (programa, estado, estado_pago)
- Vista vencimientos (próximos 7 días)
- Detalle: alumno + pagos + contratos
- Edición con allowedFields limitados (no campos fantasma)

### Graduaciones (`/space/graduaciones`)
- CRUD graduaciones
- Aprobar → actualiza `cinturon_actual` + inserta `historial_cinturones`
- Modal creación muestra armas del alumno (integración con compras)
- Tabla `graduacion_correcciones` para ajustes

### Asistencia (`/space/asistencia`)
- Stats: hoy, semana, mes
- Vista hoy con paginación + date range
- Por fecha específica
- Historial por alumno
- Exportar CSV
- Resumen semanal
- **Botón "Tomar asistencia"** → redirige a panel profesora
- Usa `asistio = 'Sí'` (VARCHAR)

### Leads (`/space/leads`)
- Stats (nuevos, contactados, convertidos, descartados)
- Lista con filtros
- Embudo de conversión
- Exportar CSV
- Campo `observaciones` editable

### Compras (`/space/compras`)
- Registro de implementos por alumno
- Categorías: arma, uniforme, protector, polo
- Stats + filtros
- Endpoint `armas-alumno/:id` para modal graduación

### Mensajes (`/space/mensajes`)
- Enviar: difusión / por programa / individual
- Tracking: quién leyó cada mensaje
- Tabla `mensajes` + `mensajes_leidos`
- **Integración bidireccional**: perfil apoderado ve los mensajes y marca como leídos

### Configuración (`/space/config`) — solo admin
- Tab Usuarios: CRUD `space_usuarios` + cambiar password
- Tab Sedes: CRUD `sedes`
- Tab Horarios: CRUD `horarios` (antes hardcodeados en frontend)

## Tablas nuevas creadas para Space

| Tabla | Uso |
|-------|-----|
| `space_usuarios` | Login Space |
| `graduacion_correcciones` | Reemplaza hack de leads |
| `historial_cinturones` | Registro inmutable de avances |
| `implementos` (schema nuevo) | Compras por alumno |
| `mensajes` | Mensajes Space → padres |
| `mensajes_leidos` | Tracking lectura |

## Convenciones críticas Space
1. **No transparencia en modals** — tokens sólidos, React Portal
2. **`asistio = 'Sí'`** — VARCHAR, no boolean
3. **`LOWER(estado) = 'activo'`** en alumnos
4. **`nombre_alumno`/`dni_alumno`** — no `nombre`/`dni`
5. **Response shape backend**: `{success: true, data: [...]}` o `{success: true, stats: {...}}` — revisar cada ruta antes de consumir en frontend
