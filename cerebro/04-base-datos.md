# 04 — Base de Datos

## Conexión

- Container: `pallium_amas-db` (Docker Swarm)
- Database: `amas_database`
- User: `amas_user`
- Puerto: 5432 (solo interno)

Dragon Knight usa la misma estructura en `dragonknight_database` / `dk_user` / puerto 5436 (externo).

## Tablas principales

### alumnos
Cada fila = un alumno. Vinculado a un apoderado.
- `id`, `nombre` (VARCHAR 200), `dni` (VARCHAR 20, UNIQUE)
- `fecha_nacimiento`, `categoria`, `estado` (activo/inactivo/congelado)
- `apoderado_id` → apoderados

### apoderados
- `id`, `nombre`, `dni`, `correo`, `telefono`, `direccion`
- `auth_id` — vincula con Logto para login

### inscripciones
Cada inscripción a un programa. Un alumno puede tener varias (renovaciones).
- `alumno_id` → alumnos
- `programa`, `fecha_inicio`, `fecha_fin`, `clases_totales`
- `turno`, `dias_tentativos`, `precio_programa`, `precio_pagado`
- `activa` (boolean), `estado_pago` (pendiente/parcial/pagado/vencido)

### asistencias
Registro por QR o manual. Una por alumno por día por turno.
- `alumno_id`, `inscripcion_id`, `fecha`, `hora`, `turno`
- `asistio` (Sí/No/Tardanza), `sede_id`, `qr_sesion_id`
- `metodo_registro` (qr/manual/auto)

### qr_sesiones
Token QR generado por la profesora para cada clase.
- `sede_id`, `token` (UUID), `fecha`, `hora_apertura`, `hora_cierre`
- `activa`, `hora_clase`, `programa`

### Otras tablas
- `sedes` — locales (nombre, dirección, activa)
- `horarios` — clases programadas por sede
- `leads` — prospectos interesados
- `pagos` — registro de pagos por inscripción
- `contratos` — documentos firmados
- `tallas` — tallas de uniforme/polo
- `inscripciones_adicionales` — Leadership, Fighters
- `graduaciones`, `graduacion_correcciones`
- `torneos`, `torneo_participantes`
- `implementos_pedidos`

## Función: registrar_asistencia

```sql
SELECT registrar_asistencia('DNI', 'TOKEN_QR', 'TURNO');
```

Retorna JSON:
- OK: `{success: true, alumno: "...", programa: "...", hora: "17:43", clases_restantes: 5}`
- Error: `{success: false, error: "DNI no encontrado"}`

Valida: DNI existe, QR válido y no expirado, inscripción activa, no marcó ya hoy.

## Vistas
- `v_asistencia_hoy` — asistencias del día con datos alumno
- `v_asistencia_mensual` — resumen por mes con porcentaje

## Schema completo
Ver `database/01_schema.sql`, `02_functions.sql`, `03_views.sql`
