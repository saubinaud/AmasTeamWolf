# 04 — Base de Datos

## Conexión

- Container: `pallium_amas-db` (Docker Swarm)
- Database: `amas_database`
- User: `amas_user`
- Puerto: 5432 (solo interno)

Dragon Knight usa misma estructura en `dragonknight_database` / `dk_user` / puerto 5436 (externo).

## Tablas principales

### alumnos
- `id`, `nombre_alumno` (VARCHAR), `dni_alumno` (VARCHAR, UNIQUE)
- `fecha_nacimiento`, `categoria`, `cinturon_actual`
- `estado` (VARCHAR: activo/inactivo/congelado) — **siempre usar LOWER() en queries**
- `apoderado_id` → apoderados

### apoderados
- `id`, `nombre`, `dni`, `correo`, `telefono`, `direccion`
- `password_hash` — **auth propia (bcrypt)**, reemplazó auth_id/Logto
- `email_verified`, `created_at`

### inscripciones
- `alumno_id`, `programa`, `fecha_inicio`, `fecha_fin`
- `clases_totales`, `turno`, `dias_tentativos`
- `precio_programa`, `precio_pagado`, `descuento`
- `codigo_promocional`, `tipo_cliente`
- `estado` (VARCHAR: 'Activo'/'Vencido'), `estado_pago` (pendiente/parcial/pagado)
- **IMPORTANTE:** No existen columnas `monto`, `horario`, `sede_id`, `activa` (boolean). La activa se deriva de `estado = 'Activo'`.

### asistencias
- `alumno_id`, `inscripcion_id`, `fecha`, `hora`, `turno`
- `asistio` — **VARCHAR** con valores `'Sí'`/`'No'`/`'Tardanza'` (NO boolean)
- `sede_id`, `qr_sesion_id`, `metodo_registro` (qr/manual/auto)

### qr_sesiones
- `sede_id`, `token` (UUID), `fecha`, `hora_apertura`, `hora_cierre`
- `activa`, `hora_clase`, `programa`

### space_usuarios
- `id`, `nombre`, `email`, `password_hash`, `rol` (admin/staff), `activo`, `ultimo_login`
- Auth para Space (JWT propio, middleware `spaceAuth`)

### sedes
- `id`, `nombre`, `direccion`, `activa`

### horarios
- `id`, `sede_id`, `dia_semana`, `hora_inicio`, `hora_fin`
- `nombre_clase`, `capacidad`, `instructor`, `activo`

### leads
- `id`, `nombre`, `dni`, `telefono`, `email`, `programa_interes`
- `estado` (Nuevo/Contactado/Interesado/Convertido/Descartado)
- `observaciones` — **agregada este sesión** (ALTER TABLE)
- `created_at`

### pagos
- `inscripcion_id`, `monto`, `metodo_pago`, `fecha_pago`, `comprobante_url`

### contratos
- `inscripcion_id`, `nombre_archivo`
- `pdf_bytea` — **PDF almacenado en BD (reemplazó Cloudinary)**
- `pdf_path` — opcional, ruta en disco `/opt/amas-contratos/`
- `created_at`

### graduaciones
- `alumno_id`, `cinturon_anterior`, `cinturon_nuevo`
- `fecha_examen`, `turno`, `horario`, `aprobado`, `observaciones`

### graduacion_correcciones (creada este sesión)
- `graduacion_id`, `campo_corregido`, `valor_anterior`, `valor_nuevo`, `corregido_por`, `fecha`

### historial_cinturones (creada este sesión)
- `alumno_id`, `cinturon`, `fecha`, `graduacion_id`
- Registro inmutable. Al aprobar graduación se inserta fila.

### implementos (recreada este sesión con schema nuevo)
- `id`, `alumno_id`, `categoria` (arma/uniforme/protector/polo)
- `tipo` (sable/nunchaku/dobok/peto/...), `talla`, `precio`
- `fecha_compra`, `observaciones`
- Usada por SpaceCompras y mostrada en detalle de alumno + modal graduación

### mensajes (creada este sesión — auto por space-mensajes.js)
- `id`, `tipo` (difusion/programa/individual)
- `asunto`, `contenido`
- `programa_destino` (NULL = difusión)
- `alumno_destino_id` (NULL salvo individual)
- `created_by`, `created_at`

### mensajes_leidos (creada este sesión)
- `id`, `mensaje_id` → mensajes (CASCADE)
- `alumno_id` → alumnos (CASCADE)
- `leido_at`, UNIQUE(mensaje_id, alumno_id)

### congelamientos
- `inscripcion_id`, `fecha_inicio`, `fecha_fin`, `motivo`, `aprobado`

### verification_codes
- `email`, `codigo`, `expiracion`, `usado`
- Para verificación email en registro

### Otras
- `tallas` — tallas uniformes
- `inscripciones_adicionales` — Leadership, Fighters
- `torneos`, `torneo_participantes`
- `implementos_pedidos` (legacy)

## Función: registrar_asistencia

```sql
SELECT registrar_asistencia('DNI', 'TOKEN_QR', 'TURNO');
```

Retorna JSON `{success, alumno, programa, hora, clases_restantes}` o `{success: false, error}`.

## Convenciones críticas (no olvidar)

1. **`estado` en alumnos** es VARCHAR 'Activo'/'Inactivo' (capitalizado). Usar `LOWER(estado) = 'activo'` solo como defensa extra.
2. **`estado` en inscripciones** es 'Activo'/'Vencido' (case-sensitive)
3. **`estado_pago` en inscripciones** es 'Pendiente'/'Parcial'/'Pagado'
4. **`tipo_cliente` en inscripciones** acepta: 'Nuevo/Primer registro', 'Renovación', 'Walk-in', 'Promocional', 'Transferido'
5. **`asistio` en asistencias** es VARCHAR 'Sí'/'No'/'Tardanza' (NO boolean)
6. **`nombre_alumno` y `dni_alumno`** — NO `nombre`/`dni` en tabla alumnos
7. **Password hash** en `password_hash` (bcrypt, 10 rounds)
8. **PDFs** en `contratos.pdf_bytea` — NO en Cloudinary
9. **Pagos** se crean automáticamente desde `/api/matricula` y `/api/renovacion` cuando admin marca estadoPago=Pagado/Parcial — ver `pagos` table con inscripcion_id, monto, tipo, metodo_pago
10. **`space_usuarios.permisos`** es JSONB — NULL = admin (acceso total), Array de SpacePage = profesor con módulos limitados

## 🕐 TIMEZONE — CRÍTICO

La academia está en **Lima, Perú (America/Lima, GMT-5)**.

**Estado actual:**
- PostgreSQL: `timezone = America/Lima` ✓
- Docker container `amas-api`: `TZ = America/Lima` ✓
- Las queries con `CURRENT_DATE`, `NOW()` devuelven Lima local ✓
- Los timestamps se guardan como Lima en columnas `timestamp without time zone`

**Regla frontend (IMPORTANTE):**
Cuando Node serializa un timestamp a JSON lo convierte a UTC ISO (ej. `2026-04-09T22:32:57Z` para las 17:32 Lima). Si el frontend hace `new Date(iso).toLocaleDateString('es-PE')` sin especificar timeZone, **usa la zona horaria del navegador** — lo cual rompe si alguien entra por VPN o tiene mal configurado su equipo.

**SIEMPRE** usar el helper centralizado `src/components/space/dateUtils.ts` o forzar `timeZone: 'America/Lima'` explícitamente en cualquier llamada a `toLocaleDateString`/`toLocaleTimeString`/`toLocaleString`.

```ts
// ❌ MAL — depende del navegador
new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })

// ✅ BIEN — siempre muestra Lima
new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', timeZone: 'America/Lima' })

// ✅ MEJOR — helper centralizado
import { formatFecha, formatHora, formatFechaHora } from './dateUtils';
```

**Backend queries donde aplicar `AT TIME ZONE 'America/Lima'`:**
Solo si alguna vez la configuración de TZ cambia. Actualmente ambos están en Lima así que `CURRENT_DATE` y `NOW()` ya funcionan bien. Pero es buena práctica en queries nuevas que formateen fechas con `to_char()`.

## Schema base
Ver `database/01_schema.sql`, `02_functions.sql`, `03_views.sql` (parcial — tablas Space se agregaron via migraciones).
