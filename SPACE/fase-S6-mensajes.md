# Fase S6 — Mensajes y Comunicados

## Objetivo
Desde el SPACE, enviar mensajes a padres específicos o a todos (difusión). Los padres los ven en su perfil (/perfil) como una bandeja de notificaciones.

## Flujo

```
SPACE (admin)                          PERFIL (padre)
┌──────────────┐                      ┌──────────────┐
│ Nuevo mensaje │                      │ 🔔 3 nuevos  │
│              │                      │              │
│ Para: Todos  │   ──── BD ────►      │ Comunicado:  │
│   o Alumno X │                      │ "La próxima  │
│              │                      │  graduación  │
│ Asunto: ...  │                      │  será el..." │
│ Mensaje: ... │                      │              │
│ [Enviar]     │                      │ [Marcar leído]│
└──────────────┘                      └──────────────┘
```

## Tipos de mensaje

| Tipo | Destinatario | Ejemplo |
|------|-------------|---------|
| **Difusión** | Todos los padres | "La academia cierra el 25 de diciembre" |
| **Por programa** | Padres de Baby Wolf, Little Wolf, etc. | "Horario cambia a partir del lunes" |
| **Individual** | Un alumno/padre específico | "Tu hijo tiene pendiente el pago" |
| **Automático** | Generado por el sistema | "Quedan 3 clases en tu programa" |

## Tablas nuevas

### mensajes
```sql
CREATE TABLE mensajes (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('difusion', 'programa', 'individual', 'sistema')),
  asunto VARCHAR(200) NOT NULL,
  contenido TEXT NOT NULL,
  programa_destino VARCHAR(100),    -- NULL = todos, o "Baby Wolf", "Little Wolf", etc.
  alumno_destino_id INTEGER REFERENCES alumnos(id),  -- NULL = difusión/programa
  created_by INTEGER REFERENCES space_usuarios(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_mensajes_tipo ON mensajes(tipo);
CREATE INDEX idx_mensajes_created ON mensajes(created_at DESC);
```

### mensajes_leidos
```sql
CREATE TABLE mensajes_leidos (
  id SERIAL PRIMARY KEY,
  mensaje_id INTEGER NOT NULL REFERENCES mensajes(id) ON DELETE CASCADE,
  alumno_id INTEGER NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  leido_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(mensaje_id, alumno_id)
);
CREATE INDEX idx_mensajes_leidos_alumno ON mensajes_leidos(alumno_id);
```

## Backend endpoints

### SPACE (admin — protegidos con spaceAuth)
- `GET /api/space/mensajes` — lista mensajes enviados (?tipo=, ?page=, ?limit=)
- `GET /api/space/mensajes/:id` — detalle + cuántos lo leyeron
- `POST /api/space/mensajes` — crear mensaje
  - Body: { tipo, asunto, contenido, programa_destino?, alumno_destino_id? }
- `DELETE /api/space/mensajes/:id` — eliminar mensaje

### Público (para el perfil del padre)
- `GET /api/mensajes/:alumnoId` — mensajes para este alumno (difusión + su programa + individuales)
  - Incluye flag `leido` (LEFT JOIN mensajes_leidos)
  - Ordenados por fecha DESC
- `POST /api/mensajes/:mensajeId/leido` — marcar como leído
  - Body: { alumno_id }

## Frontend SPACE (SpaceMensajes.tsx)

### Vista lista
- Tabla: Asunto, Tipo (badge), Destinatario, Fecha, Leídos (X/Y)
- Filtros: tipo (difusión, programa, individual)
- Botón "Nuevo mensaje"

### Formulario nuevo mensaje
- **Tipo**: radio buttons (Difusión / Por programa / Individual)
- Si "Por programa": dropdown con programas (Baby Wolf, Little Wolf, etc.)
- Si "Individual": autocomplete alumno (mismo que graduaciones)
- **Asunto**: input text
- **Contenido**: textarea grande (con soporte para saltos de línea)
- **Preview**: cómo se verá el mensaje para el padre
- Botón enviar

### Vista detalle
- Muestra el mensaje completo
- Stats: enviado a X padres, Y lo leyeron
- Lista de quién lo leyó (con fecha)

## Frontend Perfil (PerfilPage.tsx)

### Bandeja en el perfil
- Ícono de campana 🔔 con badge rojo si hay no leídos
- Al tocar: lista de mensajes (más recientes primero)
- Cada mensaje:
  - Punto azul si no leído
  - Asunto + preview del contenido (2 líneas)
  - Fecha relativa ("hace 2 horas", "ayer")
  - Al tocar: expande contenido completo + marca como leído
- Separador visual entre leídos y no leídos

## Agentes asignados
- **Agente 1**: Backend (crear tablas + endpoints admin + endpoints públicos)
- **Agente 2**: Frontend SPACE (SpaceMensajes con formulario y lista)
- **Agente 3**: Frontend Perfil (bandeja de mensajes en PerfilPage)
