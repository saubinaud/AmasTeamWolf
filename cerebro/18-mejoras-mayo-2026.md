# 18 — Mejoras Mayo 2026 (Sesión 2-5 mayo)

## Arquitectura Frontend

### Migración React Router v7
- **Antes**: App.tsx de 865 líneas con `currentPage` useState + if/else chain
- **Ahora**: App.tsx de 8 líneas + `router.tsx` con `createBrowserRouter`
- URLs reales (botón atrás funciona, estado se preserva al recargar)
- `<ScrollRestoration />` automático (fix scroll Android)
- `src/layouts/MainLayout.tsx`: cart, pago, toaster + outlet context
- `src/hooks/useAppNavigate.ts`: bridge backward-compatible (componentes no cambiaron)

### Eliminación Framer Motion (9 archivos)
- PerfilPage: 24 motion.div → CSS `animate-fade-in-up`
- PerfilDesktop, TiendaPage, LeadershipTimeline, HeroLeadership, etc.
- Creado `src/hooks/useInView.ts` (IntersectionObserver ligero)
- Creado `src/components/FadeIn.tsx` (CSS-only fade/slide)
- Motion chunk (56KB) ya no se carga en páginas principales

### Fix Scroll Android/Google App
- Eliminado `overscroll-behavior-y: none` en html/body
- Eliminado `transform: translateZ(0)` en todos los buttons
- Eliminado `will-change: auto !important` en mobile
- Eliminado `-webkit-overflow-scrolling: touch` (deprecado)
- `overflow-x: hidden` solo en html, no body

### Nginx con gzip + cache
- Entry JS: 131KB → 42KB (gzip)
- Assets con hash: `Cache-Control: public, immutable, max-age=1y`
- Dockerfile: `FROM nginx:alpine` + config con gzip

---

## Graduaciones

### Carga desde Excel
- Modo "Pegar desde Excel" en modal carga masiva
- Formato: NOMBRE [tab] APELLIDO [tab] RANGO [tab] HORARIO [tab] TURNO [tab] FECHA
- Matching automático alumnos por nombre+apellido vs BD
- Parseo de fechas "6 DE MAYO" → ISO

### Tabla cinturones relacional
- Tabla `cinturones` (27 rangos con orden de progresión)
- FK en: `graduaciones.cinturon_id`, `alumnos.cinturon_actual_id`, `historial_cinturones.cinturon_id`
- Endpoint `/cinturones` lee de tabla (no hardcodeado)
- Aprobar graduación actualiza `cinturon_actual` + `cinturon_actual_id` + historial

### Página pública /graduacion
- Backend leía de inscripciones (versión vieja) → ahora lee de tabla `graduaciones`
- Fecha en español: CASE manual (TMMonth salía en inglés)
- Turnos: "1er Turno", "2do Turno", "3er Turno"
- Correcciones: LEFT JOIN (antes INNER JOIN filtraba las sin graduacion_id)

---

## Búsqueda de Alumnos

### Panel asistencia — búsqueda client-side
- **Antes**: fetch al servidor por cada tecla (800ms latencia Europa→Perú)
- **Ahora**: endpoint público `GET /api/asistencia/alumnos-activos` (178 alumnos, ~20KB)
- Carga una vez al montar → filtro local instantáneo (0ms)
- Normaliza acentos para match: `normalize('NFD').replace(/[\u0300-\u036f]/g, '')`

### DNI apoderado
- POST /api/asistencia: si DNI no es alumno, busca como apoderado
- GET /api/consulta-asistencia: acepta DNI alumno O apoderado
- detectarTurnoDiario: 1 query en vez de 3 (optimizado)

### QR Auto-generado
- Al abrir panel asistencia, si no hay QR activo → se genera automáticamente
- Countdown en vivo: cada 1 segundo, formato "11h 23m 45s"

### Asistencias agrupadas por clase
- Lista "Presentes hoy" agrupada por turno (Baby Wolf, Little Wolf, etc.)
- Cada grupo muestra conteo de alumnos

---

## Inscripciones

### Modal edición completo (11 campos)
- Antes: solo estado_pago y activa
- Ahora: programa, clases_totales, frecuencia, turno, días, fecha_inicio, fecha_fin, precio, descuento, estado_pago, activa
- Campos se inicializan desde datos del listado (no espera fetch del detalle)

### Tabla mejorada
- Columnas: Alumno (+ edad + días) | Programa/Turno | Clases | Período | Pago | Estado
- Edad calculada: "2 años", "18 meses"
- Sort asc/desc por fecha inscripción (botón visible)

### Frecuencia semanal hasta 6x
- 6 botones: 1x a 6x por semana
- Precio automático: +S/100 por cada clase extra sobre 2x
- Modal edición: select hasta 6x con precios

### Fix cálculo fechas timezone
- `new Date('2026-05-05')` se interpretaba como UTC (desfase 1 día en Lima)
- Creado `toLimaDate()`, `dateFromLima()`, `parseISOToLima()`
- Todas las funciones de matriculaShared.ts corregidas

### Fix días tentativos
- Ya no requiere fecha de nacimiento para mostrar selector
- Sin categoría → todos los días disponibles

---

## Contrato

### Nuevas cláusulas
- UNIFORMIDAD: pantalón, chaqueta, cinturón, polo obligatorio
- IMPLEMENTOS: solo reglamentarios de AMAS/Team Wolf
- CONDUCTA: no maltratos, no conflictos, no venta interna
- No cancelaciones: "en membresías menores a 3 meses"
- Horarios: "puede modificar en cualquier momento"
- Responsabilidad: "daños fuera de horario de clase"

### Checkbox autorización imagen
- Checkbox independiente (verde): "Autorizo uso promocional"
- Default marcado → contrato dice "institucionales y promocionales"
- Desmarcado → contrato dice "NO se autoriza uso promocional"
- Padres que no quieren promo desmarcan sin rechazar todo

---

## Space — Nuevas Features

### Notificaciones (campana en header)
- Badge rojo con total de pendientes
- Dropdown: correcciones graduación + leads nuevos + inscripciones por vencer
- Polling cada 60 segundos
- Íconos distintos por tipo (GraduationCap, UserPlus, CalendarCheck)

### Módulo Referidos
- Stats: total, bonos pendientes, bonos cobrados
- Top referidores (ranking)
- Tabla: referidor → referido, bono, estado, fecha
- Modal "Registrar referido": buscar + monto (default S/60)
- Modal "Canjear bono": buscar alumno, ver saldo, descontar
- Backend: POST /space/referidos, POST /space/referidos/canjear

### Credential Management (browser save password)
- `navigator.credentials.store()` después de login exitoso
- `<form>` con `autocomplete="username"` + `autocomplete="current-password"`
- Chrome/Safari ofrecen guardar → autocompletar con huella/Face ID

---

## Perfil del Alumno

### Renombramientos
- "Plan" → "Membresía" (tab, título, botones, congelar)
- "X días restantes" → "X clases restantes"

---

## Performance

### Nginx
- Gzip: JS/CSS/JSON comprimidos (67% reducción)
- Assets: cache immutable 1 año (Vite hash en nombre)

### Bundles
- Entry: 42KB gzip
- CSS: 32KB gzip
- UI: 65KB gzip
- Motion eliminado de 9/12 archivos

---

## Deploy

### Backend
- 13 archivos sincronizados al servidor
- Nuevo: space-referidos.js
- Fix: CORS X-Academia header permitido

### Frontend
- Deploy manual: `git pull && npm run build && docker build && docker service update`
- Dockerfile: nginx:alpine + dist/ + gzip config
- Easypanel no auto-buildea (webhook roto) — se hace manual desde SSH

### Base de datos
- Restaurada del backup 2026-05-03 (incidente por docker service update --force)
- Requiere extensión `unaccent` + función `unaccent_immutable` ANTES del restore
- REGLA: NUNCA usar --force en servicios que compartan stack con BD
