# 11 — SPACE (Portal Administrativo)

## Estado: Operativo (2026-04-13)

Panel web completo en `/space` con 17+ módulos organizados en sidebar con grupos desplegables.

## Módulos

### Dashboard
Stats: alumnos activos, inscripciones activas, asistencias hoy, leads nuevos, inscripciones por vencer.
**Heatmap** de asistencias últimos 30 días (clases × días de semana).
Acciones rápidas.

### Alumnos
Lista paginada con LATERAL JOIN (programa, clases, cinturón). Filtros: búsqueda unificada (nombre alumno/apoderado + DNI normalizado), estado. Detalle con inscripciones + asistencias + implementos + referidos.

### Inscripciones (grupo desplegable)
- **Inscritos**: lista + edición + filtros (programa, estado_pago, activa, **por vencer** con selector 5/7/15/30 días). Badge frecuencia solo si ≠ default. Pagos: registrar pago manual + timeline.
- **Inscribir**: formulario completo (horarios por edad, fechas inteligentes con feriados Perú, promo codes 30+, tallas, ContratoFirma, **admin overrides** precio/estado_pago/skip firma). Tipo documento alumno Y apoderado (DNI/CE/Pasaporte).
- **Renovar**: mismo pero con búsqueda de alumno + pre-fill + inscripción activa como referencia.

### Graduaciones
CRUD + aprobar (actualiza cinturón + historial). **Carga masiva**: table-builder con autocomplete alumno + select cinturón + fecha (hasta 100 por lote).

### Asistencia (grupo desplegable)
- **Reportes**: stats + lista + exportar CSV + resumen semanal
- **Tomar asistencia**: QR panel embebido (sin PIN, sin logout)
- **Registrar pasadas**: 3 modos (individual, lote texto, por rango + días semana)
- **Asistencia profesores**: registro por DNI + badges hoy + calendario mensual

### Leads
Stats + lista + embudo conversión + exportar CSV.

### Compras
CRUD implementos + **catálogo con precios automáticos** (select dropdown auto-llena precio) + gestión catálogo (admin). Estado entrega: **select dropdown profesional** (Pendiente/Entregado) con **fecha editable**. Pendientes de entrega filtrable.

### Profesores
CRUD profesores (nombre, DNI, teléfono, email, contacto emergencia). Columna `space_usuario_id` para vincular con cuenta Space.

### Clases de prueba
Registro de clases de prueba (prospectos). Estados: por_asistir → asistió/no_asistió. Resultado: inscrito/en_confirmación/separación/no_interesado. Embudo visual + resumen diario + stats mes.

### Mensajes
Enviar: difusión / por programa / individual. Tracking: quién leyó. Integración bidireccional con perfil apoderado.

### Ajustes (solo admin)
- Usuarios: CRUD space_usuarios + cambiar password + **permisos por módulo** (checkboxes de 15+ páginas). Admin = acceso total, profesor = limitado.
- Sedes: CRUD
- Horarios: CRUD

### Modo claro/oscuro
Toggle sol/luna en header + sidebar footer. CSS overrides via clase `.space-light` en `document.body`.

## Sidebar

```
Dashboard
Alumnos
Inscripciones ▸
  ├─ Inscritos
  ├─ Inscribir
  └─ Renovar
Graduaciones
Asistencia ▸
  ├─ Reportes
  ├─ Tomar asistencia (QR)
  ├─ Registrar pasadas
  └─ Asistencia profesores
Leads
Compras
Profesores
Clases prueba
Mensajes
Ajustes
```
