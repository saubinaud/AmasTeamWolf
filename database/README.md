# Base de Datos AMAS Team Wolf

Scripts SQL para PostgreSQL con Dockerfile para EasyPanel.

## Estructura de Archivos

```
database/
├── Dockerfile       ← Para deploy en EasyPanel
├── 01_schema.sql    ← Crea todas las tablas
├── 02_views.sql     ← Vistas con campos calculados
└── README.md        ← Este archivo
```

## Instalación en EasyPanel (Recomendado)

### 1. Crear servicio desde Git

En EasyPanel Dashboard:

1. **Create Service** → **App**
2. En la configuración:
   - **Source**: Git
   - **Repository**: `https://github.com/saubinaud/AmasTeamWolf`
   - **Branch**: `main` (o la rama que uses)
   - **Build Path**: `/database`
3. En **Environment Variables**, agregar:
   ```
   POSTGRES_DB=amas_database
   POSTGRES_USER=amas_user
   POSTGRES_PASSWORD=TU_PASSWORD_SEGURO
   ```
4. En **Volumes**, agregar persistencia:
   - **Volume Name**: `amas-db-data`
   - **Mount Path**: `/var/lib/postgresql/data`
5. **Deploy**

Los scripts SQL se ejecutan automáticamente en el primer inicio.

### 2. Conectar n8n

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
