# 14 — Reglas de Arquitectura (OBLIGATORIAS)

Reglas establecidas después de un incidente en producción donde el login de padres se rompió (error 500) por referenciar columnas SQL que no existían en el servidor.

**ESTAS REGLAS NO SON OPCIONALES.** Cualquier sesión que modifique backend o BD debe seguirlas.

---

## R1 — Migraciones BD: 2 pasos obligatorios

**NUNCA** cambiar código que referencia columnas nuevas en el mismo deploy que la migración.

```
Paso 1: Ejecutar ALTER TABLE + VERIFICAR con SELECT que la columna existe
Paso 2: Solo después, actualizar el código que usa la columna nueva
```

**Verificación obligatoria** después de cada ALTER TABLE:
```bash
sshpass -p 'Aubinaud919' ssh ... "docker exec pallium_amas-db.1.$(docker service ps pallium_amas-db -q --no-trunc | head -1) psql -U amas_user -d amas_database -c \"SELECT column_name FROM information_schema.columns WHERE table_name='TABLA' AND column_name='COLUMNA'\""
```

Si devuelve 0 rows → la migración FALLÓ. No continuar.

## R2 — Columnas generadas (dni_alumno_norm, dni_apoderado_norm)

La tabla `alumnos` tiene 2 columnas generadas `STORED` que PostgreSQL mantiene automáticamente:
- `dni_alumno_norm` = UPPER(REPLACE(REPLACE(REPLACE(dni_alumno, ' ', ''), '-', ''), '.', ''))
- `dni_apoderado_norm` = igual para dni_apoderado

Con índices:
- `idx_alumnos_dni_alumno_norm`
- `idx_alumnos_dni_apoderado_norm`

**SIEMPRE** usar `WHERE dni_alumno_norm = $1` en vez de `WHERE REPLACE(REPLACE(REPLACE(...)))`.
**SIEMPRE** normalizar el input JS: `String(dni).replace(/[\s\-\.]/g, '').trim().toUpperCase()`

## R3 — Timezone: America/Lima

- PostgreSQL: `timezone = America/Lima`
- Docker container: `TZ = America/Lima`
- Frontend: **SIEMPRE** usar `timeZone: 'America/Lima'` en `toLocaleDateString/toLocaleTimeString`
- Helper centralizado: `src/components/space/dateUtils.ts`

## R4 — Optional chaining obligatorio

En el frontend, **NUNCA** acceder a campos anidados sin optional chaining:

```typescript
// ❌ MAL — crash si user o pagos es null
user.pagos.precioPrograma

// ✅ BIEN
user?.pagos?.precioPrograma ?? 0
```

Esto aplica especialmente a:
- `user.pagos`, `user.matricula`, `user.estudiante`
- `alumno.clases_asistidas`, `alumno.apellido`
- Cualquier campo que viene de la BD y puede ser null

## R5 — Fetch error handling

Todo `fetch()` debe:
1. Verificar `res.ok` antes de llamar `res.json()`
2. Usar `.catch()` con mensaje de error significativo
3. **NUNCA** hacer logout silencioso en error 500 (mostrar "Error del servidor, intenta de nuevo")

```typescript
// ✅ Patrón correcto
const res = await fetch(url, { headers });
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const data = await res.json();
```

## R6 — Campo turno en asistencias

El campo `asistencias.turno` guarda el **nombre de la clase**, NO un turno horario:
- Súper Baby Wolf
- Baby Wolf
- Little Wolf
- Junior Wolf
- Adolescentes Wolf

**NUNCA** usar 'Mañana'/'Tarde'/'Noche' como valores de turno.

## R7 — Estado en alumnos e inscripciones

- `alumnos.estado`: VARCHAR capitalizado → 'Activo', 'Inactivo'. Usar `LOWER(estado) = 'activo'` como defensa.
- `inscripciones.estado`: 'Activo' / 'Vencido' (case-sensitive, NO usar LOWER)
- `inscripciones.estado_pago`: 'Pendiente' / 'Parcial' / 'Pagado'
- `asistencias.asistio`: VARCHAR 'Sí' / 'No' / 'Tardanza' (NO boolean)

## R8 — Nombres de columnas en alumnos

- `nombre_alumno` y `dni_alumno` — NO `nombre`/`dni`
- `nombre_apoderado`, `dni_apoderado` — NO `nombre_padre`

## R9 — Permisos Space (space_usuarios.permisos)

- `NULL` = admin con acceso total
- `string[]` (JSONB) = lista de SpacePage permitidas para profesor
- Dashboard siempre accesible
- Whitelist de páginas válidas en `space-config.js` → `PAGINAS_VALIDAS`
- Frontend filtra sidebar según permisos en `SpaceLayout.tsx`

## R10 — Deploy backend: verificar después

Después de **cada** deploy de backend:
```bash
# 1. Restart
sshpass ... "docker restart amas-api"
sleep 3

# 2. Health check
curl -s https://amas-api.s6hx3x.easypanel.host/health

# 3. Verificar logs sin errores
sshpass ... "docker logs amas-api --tail 10"

# 4. Probar endpoint crítico (login)
curl -s -X POST https://amas-api.s6hx3x.easypanel.host/api/auth/login \
  -H 'Content-Type: application/json' -d '{"dni":"47702188","password":"test"}'
# Debe devolver {success:false, needsPassword:true} o similar — NUNCA 500
```

## R11 — Auditoría post-cambios grandes

Después de cualquier batch de cambios que toque >5 archivos:
1. Spawn sub-agente `tester` para verificar SQL columns vs schema real
2. Spawn sub-agente `reviewer` para verificar optional chaining y error handling
3. Corregir issues HIGH antes de mergear

## R12 — No inventar datos

Si la BD no tiene datos para un campo, mostrar:
- String vacío, "—", o "Sin datos"
- **NUNCA** inventar valores default que parezcan datos reales
- Ejemplo: frecuencia_semanal NULL → mostrar "—", NO badge "2x/sem"
