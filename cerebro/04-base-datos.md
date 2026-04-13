# 04 — Base de Datos

## Conexión

- Container: `pallium_amas-db` (Docker Swarm)
- Database: `amas_database`
- User: `amas_user`
- Puerto: 5432 (solo interno)

## Tablas (25+)

### alumnos
- `id`, `nombre_alumno`, `dni_alumno`, `tipo_documento` (DNI/CE/Pasaporte, default 'DNI')
- `dni_alumno_norm` — **GENERATED ALWAYS AS** (normalizado, con índice)
- `dni_apoderado_norm` — **GENERATED ALWAYS AS** (normalizado, con índice)
- `fecha_nacimiento`, `categoria`, `cinturon_actual`, `estado` (Activo/Inactivo)
- `nombre_apoderado`, `dni_apoderado`, `correo`, `telefono`, `direccion`
- `password_hash` — auth propia (bcrypt)
- `codigo_referido` (VARCHAR UNIQUE, auto-generado "AMAS-XXXX")
- `saldo_bonos` (NUMERIC, acumulable por referidos)

### inscripciones
- `alumno_id`, `programa`, `fecha_inscripcion`, `fecha_inicio`, `fecha_fin`
- `clases_totales`, `turno`, `dias_tentativos`
- `frecuencia_semanal` (INTEGER, 1 o 2, default 2)
- `precio_programa`, `precio_pagado`, `descuento`
- `codigo_promocional`, `tipo_cliente`
- `estado` ('Activo'/'Vencido'), `estado_pago` ('Pendiente'/'Parcial'/'Pagado')

### asistencias
- `alumno_id`, `inscripcion_id`, `fecha`, `hora`
- `turno` — **nombre de la clase** (Súper Baby Wolf, Baby Wolf, Little Wolf, Junior Wolf, Adolescentes Wolf)
- `asistio` — VARCHAR 'Sí'/'No'/'Tardanza' (NO boolean)
- `sede_id`, `qr_sesion_id`, `metodo_registro` (qr/manual/auto/excel_import_2026_04/manual_admin)

### space_usuarios
- `id`, `nombre`, `email`, `password_hash`, `rol` (admin/profesor)
- `activo`, `ultimo_login`
- `permisos` (JSONB — NULL=admin acceso total, array=páginas permitidas)

### profesores
- `id`, `nombre`, `dni`, `telefono`, `email`, `contacto_emergencia`, `activo`
- `space_usuario_id` — FK a space_usuarios (vincular cuenta Space)

### asistencias_profesores
- `profesor_id`, `fecha`, `hora_entrada`, `observaciones`
- UNIQUE(profesor_id, fecha)

### clases_prueba
- `nombre_prospecto`, `telefono`, `email`, `fecha`, `hora`, `profesora`
- `estado` (por_asistir/asistio/no_asistio)
- `resultado` (inscrito/en_confirmacion/separacion/no_interesado)
- `alumno_inscrito_id`, `created_by`

### referidos
- `referidor_id` → alumnos, `referido_id` → alumnos
- `bono` (NUMERIC, default 60), `canjeado` (BOOLEAN)
- UNIQUE(referido_id)

### catalogo_implementos
- `nombre`, `categoria`, `precio`, `activo`
- Pre-cargado con 15 items (dobok, polos, protectores, armas, accesorios)

### implementos
- `alumno_id`, `categoria`, `tipo`, `talla`, `precio`, `origen`, `metodo_pago`
- `entregado` (BOOLEAN), `fecha_entrega` (TIMESTAMP), `entregado_by`
- `observaciones`, `created_by`, `fecha_adquisicion`

### Otras tablas existentes
- `pagos` (inscripcion_id, monto, fecha, tipo, metodo_pago, observaciones)
- `contratos` (inscripcion_id, pdf_bytea, pdf_path)
- `graduaciones`, `graduacion_correcciones`, `historial_cinturones`
- `mensajes`, `mensajes_leidos`
- `leads`, `tallas`, `sedes`, `horarios`
- `qr_sesiones`, `congelamientos`, `verification_codes`

## Índices importantes

| Índice | Columna(s) | Uso |
|---|---|---|
| `idx_alumnos_dni_alumno_norm` | `dni_alumno_norm` | Búsqueda DNI (index scan) |
| `idx_alumnos_dni_apoderado_norm` | `dni_apoderado_norm` | Búsqueda DNI padre |
| `idx_alumnos_nombre_lower` | `LOWER(nombre_alumno)` | Búsqueda por nombre |
| `idx_inscripciones_vencimiento` | `fecha_fin WHERE Activo` | Dashboard + filtro "por vencer" |
| `idx_asistencias_alumno_fecha` | `(alumno_id, fecha)` | Perfil, dedup |
| `idx_asistencias_fecha` | `fecha` | Reportes diarios |

## Reglas críticas (ver también 14-reglas-arquitectura.md)

1. **`nombre_alumno`/`dni_alumno`** — NO `nombre`/`dni`
2. **`asistio = 'Sí'`** — VARCHAR, NO boolean
3. **`turno`** = nombre de la clase (Súper Baby Wolf, etc.) — NO Mañana/Tarde
4. **`estado` en alumnos**: 'Activo'/'Inactivo' (capitalizado)
5. **`estado` en inscripciones**: 'Activo'/'Vencido' (case-sensitive)
6. **DNI buscar**: usar `WHERE dni_alumno_norm = $1` (columna generada con índice)
7. **Timezone**: PostgreSQL y Node están en America/Lima. Frontend DEBE forzar `timeZone: 'America/Lima'`
8. **Migraciones**: SIEMPRE verificar con SELECT después de ALTER TABLE (ver R1 en 14-reglas-arquitectura.md)
