# Base de Datos AMAS Team Wolf

Scripts SQL para PostgreSQL.

## Estructura de Archivos

```
database/
├── 01_schema.sql    ← Crea todas las tablas
├── 02_views.sql     ← Vistas con campos calculados
└── README.md        ← Este archivo
```

## Instalación en EasyPanel

### 1. Crear servicio PostgreSQL

En EasyPanel Dashboard:
1. Create Service → Database → PostgreSQL
2. Configurar:
   - **Service Name**: `amas-db`
   - **Database**: `amas_database`
   - **User**: `amas_user`
   - **Password**: [generar uno seguro]
3. Deploy

### 2. Ejecutar los scripts

**Opción A: Desde terminal SSH**

```bash
# Conectar al contenedor de PostgreSQL
docker exec -it amas-db psql -U amas_user -d amas_database

# Dentro de psql, ejecutar:
\i /path/to/01_schema.sql
\i /path/to/02_views.sql
```

**Opción B: Copiar y pegar en pgAdmin o cliente SQL**

1. Conectar a la base de datos con credenciales
2. Copiar contenido de `01_schema.sql` y ejecutar
3. Copiar contenido de `02_views.sql` y ejecutar

### 3. Conectar n8n

En n8n → Credentials → PostgreSQL:
- **Host**: `amas-db` (nombre del servicio en EasyPanel)
- **Port**: `5432`
- **Database**: `amas_database`
- **User**: `amas_user`
- **Password**: [el que configuraste]

## Tablas

| Tabla | Descripción |
|-------|-------------|
| `apoderados` | Padres/tutores (identificados por correo) |
| `alumnos` | Datos de cada alumno |
| `inscripciones` | Programas base (1, 3, 6, 12 meses) - historial completo |
| `inscripciones_adicionales` | Leadership, Fighters |
| `pagos` | Todos los pagos realizados |
| `graduaciones` | Historial de cinturones |
| `asistencias` | Registro biométrico (fecha + hora) |
| `congelamientos` | Períodos de congelamiento |
| `implementos` | Cada implemento por alumno |

## Vistas Calculadas

| Vista | Descripción |
|-------|-------------|
| `v_dashboard_alumnos` | **Vista principal** - toda la info del alumno |
| `v_inscripciones_activas` | Inscripciones con días para vencimiento |
| `v_clases_alumno` | Clases asistidas y pendientes |
| `v_cinturon_actual` | Último cinturón de cada alumno |
| `v_alumnos_por_vencer` | Vencen en próximos 7 días |
| `v_alumnos_vencidos` | Ya vencidos |
| `v_implementos_alumno` | Resumen de implementos |
| `v_ingresos_mensuales` | Ingresos por mes y tipo |

## Ejemplos de Consultas

### Buscar alumno por correo del apoderado
```sql
SELECT * FROM v_dashboard_alumnos
WHERE apoderado_correo = 'padre@email.com';
```

### Ver alumnos que vencen pronto
```sql
SELECT * FROM v_alumnos_por_vencer;
```

### Ver clases pendientes de un alumno
```sql
SELECT * FROM v_clases_alumno
WHERE alumno_nombre ILIKE '%juan%';
```

### Total de ingresos del mes actual
```sql
SELECT SUM(total_ingresos) FROM v_ingresos_mensuales
WHERE mes = DATE_TRUNC('month', CURRENT_DATE);
```

### Alumnos con Leadership activo
```sql
SELECT alumno_nombre, programas_adicionales
FROM v_dashboard_alumnos
WHERE programas_adicionales ILIKE '%leadership%';
```

## Flujo de Webhooks (n8n)

### Nueva inscripción
```
1. Buscar apoderado por correo
   → Si no existe: INSERT INTO apoderados
2. INSERT INTO alumnos
3. INSERT INTO inscripciones (activa = true)
4. INSERT INTO pagos
```

### Renovación
```
1. Buscar alumno
2. UPDATE inscripciones SET activa = false WHERE alumno_id = X
3. INSERT INTO inscripciones (activa = true)
4. INSERT INTO pagos
```

### Inscripción Leadership
```
1. INSERT INTO inscripciones_adicionales
2. INSERT INTO implementos (por cada implemento dado)
3. INSERT INTO pagos
```

### Marcar asistencia (biométrico)
```
1. Buscar alumno
2. INSERT INTO asistencias (fecha, hora, turno)
```
