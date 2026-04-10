# Prompt para nueva sesión de Claude Code

> Copia y pega esto al inicio de una nueva terminal de Claude Code en este proyecto. Actualizado: 2026-04-07 tras la migración auth + panel Space completo.

---

## Contexto rápido

Estás trabajando en **AMAS Team Wolf**, la web + panel administrativo de una academia de taekwondo en Lima, Perú. Propietario: Sebastien Aubinaud (GitHub: `saubinaud`). Tiene 2 academias hermanas (AMAS + Dragon Knight) que comparten estructura.

Es un monorepo con frontend React + backend Express + PostgreSQL, desplegado en Contabo VPS vía Easypanel (Docker Swarm).

## Estado actual (2026-04-07)

### Lo que está operativo
- **Landing pública** con matrícula, renovación, tienda, torneo, leadership, showroom
- **Perfil del apoderado** con asistencias, inscripciones, pagos, contratos, mensajes (lista + marcar leído)
- **Asistencia QR** (registro por alumno + panel profesora con "Tomar asistencia")
- **Space Panel Administrativo** (`/space`) con 9 módulos: dashboard, alumnos, inscripciones, graduaciones, asistencia, leads, compras, mensajes, configuración

### Cambios grandes recientes
1. **Auth: Logto → JWT propio** (bcrypt + jsonwebtoken). Ya NO existe LogtoProvider. El login es DNI + password.
2. **Tailwind v4 dinámico** con `@tailwindcss/vite`. Antes `src/index.css` era archivo pre-compilado estático de 6640 líneas → ahora se genera al vuelo. Cualquier clase de Tailwind funciona.
3. **PDFs contratos: Cloudinary → bytea + disco** (`/opt/amas-contratos/`). Cloudinary tenía restricción 401 en downloads.
4. **Space panel completo S1-S7** con auth propia (tabla `space_usuarios`, middleware `spaceAuth` + `requireAdmin`).
5. **Mensajes bidireccionales Space ↔ Perfil** con tracking de lectura.
6. **Sistema de compras** con `implementos` conectado a detalle de alumno y modal graduación.

## Cómo orientarte — lee en este orden

1. `CLAUDE.md` — reglas proyecto (ya cargado)
2. `cerebro/01-proyecto.md` — qué es, stack
3. `cerebro/02-arquitectura.md` — estructura archivos
4. `cerebro/03-rutas-endpoints.md` — todas las rutas API (incluye Space)
5. `cerebro/04-base-datos.md` — tablas + convenciones críticas
6. `cerebro/11-space.md` — módulos Space detallados
7. `cerebro/07-mejoras-realizadas.md` — qué ya se hizo
8. `cerebro/08-problemas-conocidos.md` — qué falta y ideas

**Para tareas específicas:**
- Asistencia/QR: `cerebro/05-horarios-asistencia.md`
- Deploy: `cerebro/09-deploy.md`
- Accesos servidor: `cerebro/10-accesos.md` + `src/Accesos Servidor Pallium - Contabo VPS.md`

## Convenciones críticas (no olvidar)

### Base de datos
- Tabla `alumnos` usa `nombre_alumno` y `dni_alumno` (NO `nombre`/`dni`)
- `alumnos.estado` es VARCHAR → siempre `LOWER(estado) = 'activo'`
- `inscripciones.estado` es `'Activo'`/`'Vencido'` (case-sensitive)
- **NO existen** `inscripciones.monto`, `.horario`, `.sede_id`, `.activa` (boolean)
- `asistencias.asistio` es VARCHAR `'Sí'`/`'No'`/`'Tardanza'` (NO boolean — fue bug histórico)
- `leads.observaciones` existe (se agregó este sesión)
- Contratos: PDF en `contratos.pdf_bytea`, NO en Cloudinary

### Frontend
- Tokens Space SÓLIDOS: `bg-zinc-900 border border-zinc-800 rounded-2xl` — **sin** `/60`, **sin** `backdrop-blur`
- Modales Space usan `createPortal` a `document.body`, z-index 99999
- `src/index.css` SOLO tiene 2 imports — nunca regresar a CSS pre-compilado
- `AuthContext` expone `user.mensajes[]` (array, no singular)

### Backend
- Space routes: siempre bajo `/api/space/*` con middleware `spaceAuth`
- Responses: `{success: true, data: [...]}` o `{success: true, stats: {...}}` — checar cada ruta antes de consumir

## Reglas del proyecto (del CLAUDE.md)

- **No crear archivos innecesarios** — editar existentes siempre que sea posible
- **No crear docs/README** a menos que se pida explícitamente
- **No guardar archivos de trabajo/tests en root** — usar `/src`, `/tests`, `/docs`, `/scripts`
- **Leer archivo antes de editar** — siempre
- Padres usan **Android gama baja** — priorizar performance mobile
- **Commit + push** solo cuando el usuario lo pida
- Usar `gh auth switch --user saubinaud` si hay problema de cuenta

## Deploy

### Frontend
Push a `main` → Easypanel auto-build (1-2 min).

### Backend
Manual vía SSH:
```bash
# Un archivo
cat api/src/routes/ARCHIVO.js | sshpass -p 'Aubinaud919' ssh -o StrictHostKeyChecking=no -o PubkeyAuthentication=no root@95.111.254.27 "docker exec -i amas-api tee /app/src/routes/ARCHIVO.js > /dev/null"
sshpass -p 'Aubinaud919' ssh root@95.111.254.27 "docker restart amas-api"
```

### BD
```bash
sshpass -p 'Aubinaud919' ssh root@95.111.254.27 "docker exec pallium_amas-db.1.\$(docker service ps pallium_amas-db -q --no-trunc | head -1) psql -U amas_user -d amas_database -c \"SQL_AQUI\""
```

### Verificar
- Frontend: https://amasteamwolf.com
- API health: `curl https://amas-api.s6hx3x.easypanel.host/health`
- Logs: `docker logs amas-api --tail 20`

## Ideas para próximas sesiones (del 08)

- WhatsApp notificaciones (Evolution API ya instalada)
- Reportes PDF desde Space
- Gráficos en Dashboard (recharts ya en stack)
- Multi-sede real con selector
- Calendario editorial de mensajes (programar envíos)
- Integración pagos online (Culqi/Izipay)
- CI/CD backend con GitHub Actions

## Si algo no funciona

1. **Clase Tailwind no aplica** → Verificar que `@tailwindcss/vite` esté en `vite.config.ts`. Si `index.css` tiene más de 10 líneas, algo está mal.
2. **Space endpoint 500** → Revisar convenciones BD arriba. Muchos bugs históricos eran por `nombre`/`dni` vs `nombre_alumno`/`dni_alumno`, o `asistio = true` vs `'Sí'`.
3. **Modal invisible** → Verificar tokens sólidos + `createPortal`.
4. **Login falla** → Ya no usa Logto. Ver `api/src/routes/auth.js`.
5. **PDF corrupto** → Ya no es Cloudinary. Ver `contratos.pdf_bytea` + endpoints `/api/auth/contrato/:id/ver`.

## Último commit
`ee25450 fix: UX/UI overhaul — fixed header/footer, smooth scroll, mobile-first layout`

Branch: `main`. El repo tiene `.claude/`, `.claude-flow/`, `CLAUDE.md`, `.mcp.json` sin trackear — ignorar.
