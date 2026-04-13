# Prompt para nueva sesión de Claude Code

> Actualizado: 2026-04-13

---

## Contexto rápido

**AMAS Team Wolf** — web + panel administrativo de academia de taekwondo en Lima, Perú. Propietario: Sebastien Aubinaud (GitHub: `saubinaud`). Monorepo React + Express + PostgreSQL en Contabo VPS (Docker Swarm + Easypanel).

## **LEER PRIMERO** (obligatorio)

1. `CLAUDE.md` — reglas del proyecto (ya cargado)
2. `cerebro/14-reglas-arquitectura.md` — **REGLAS CRÍTICAS** de BD, migraciones, optional chaining, timezone, deploy
3. `cerebro/04-base-datos.md` — tablas, columnas generadas, índices
4. `cerebro/11-space.md` — 17+ módulos del panel admin

## Estado actual (2026-04-13)

### Operativo
- **Landing pública** con matrícula, renovación, tienda, torneo
- **Auth propio JWT** (DNI+password, bcrypt, tipos documento DNI/CE/Pasaporte)
- **Perfil apoderado**: asistencias, progreso, pagos timeline, contrato, mensajes, código referido, elegibilidad Leadership/Fighter, info apoderado editable
- **Consulta pública** `/consulta-asistencia` (sin login, por DNI)
- **Space Panel** con 17+ módulos: dashboard (heatmap), alumnos, inscripciones (inscritos/inscribir/renovar), graduaciones (batch), asistencia (reportes/QR/pasadas/profesores), leads, compras (catálogo), profesores, clases prueba, mensajes, config (usuarios+permisos/sedes/horarios), modo claro/oscuro

### Stack
| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS v4 (@tailwindcss/vite) |
| Backend | Express.js (Node.js) |
| BD | PostgreSQL 17 (timezone America/Lima) |
| Auth | JWT propio (bcrypt + jsonwebtoken) |
| Email | Notifuse |
| Archivos | bytea + disco (/opt/amas-contratos/) |
| Deploy FE | Push main → Easypanel auto-build |
| Deploy BE | SSH + scp + docker restart |

### Performance
- Columnas generadas `dni_alumno_norm` + `dni_apoderado_norm` con índices
- 5 índices adicionales (vencimiento, alumno+fecha, nombre)
- Timezone forzado con dateUtils.ts (America/Lima)

## Convenciones críticas

- **`nombre_alumno`/`dni_alumno`** no `nombre`/`dni`
- **`asistio = 'Sí'`** VARCHAR no boolean
- **`turno`** = nombre clase (Súper Baby Wolf, Baby Wolf, Little Wolf, Junior Wolf, Adolescentes Wolf)
- **DNI buscar**: `WHERE dni_alumno_norm = $1` (columna generada, index scan)
- **Timezone**: `timeZone: 'America/Lima'` obligatorio en frontend
- **Migraciones**: SIEMPRE verificar con SELECT después de ALTER TABLE
- **No inventar datos**: si NULL → mostrar "—"
- **Optional chaining**: obligatorio para campos anidados (`user?.pagos?.precioPrograma ?? 0`)

## Deploy

### Frontend
Push a `main` → Easypanel auto-build (1-2 min).

### Backend
```bash
cat api/src/routes/ARCHIVO.js | sshpass -p 'Aubinaud919' ssh -o StrictHostKeyChecking=no -o PubkeyAuthentication=no root@95.111.254.27 "docker exec -i amas-api tee /app/src/routes/ARCHIVO.js > /dev/null"
sshpass -p 'Aubinaud919' ssh root@95.111.254.27 "docker restart amas-api"
# VERIFICAR después:
curl -s https://amas-api.s6hx3x.easypanel.host/health
curl -s -X POST https://amas-api.s6hx3x.easypanel.host/api/auth/login -H 'Content-Type: application/json' -d '{"dni":"47702188","password":"test"}'
```

### BD
```bash
sshpass -p 'Aubinaud919' ssh root@95.111.254.27 "docker exec pallium_amas-db.1.\$(docker service ps pallium_amas-db -q --no-trunc | head -1) psql -U amas_user -d amas_database -c \"SQL_AQUI\""
```

## Fases pendientes (3 de 14)

- **F11**: Pasarela Culqi (requiere cuenta)
- **F12**: Torneos desde perfil
- **F13**: QR único inteligente
- **F14**: Pendiente info David (Wolf Instructor, Fighter, contrato, cartillas)

## Plan maestro de cambios

Ver `cerebro/12-plan-cambios.md` (50 items organizados en 9 áreas).

## Si algo no funciona

1. **Login 500** → verificar columnas generadas: `SELECT column_name FROM information_schema.columns WHERE table_name='alumnos' AND column_name LIKE '%norm%'`
2. **Búsqueda lenta** → verificar índices: `SELECT indexname FROM pg_indexes WHERE tablename='alumnos'`
3. **Clase Tailwind no aplica** → verificar `@tailwindcss/vite` en `vite.config.ts`
4. **Modal invisible** → verificar tokens sólidos + `createPortal`
5. **Datos inventados** → campo sin dato debe mostrar "—", no un valor default visible
