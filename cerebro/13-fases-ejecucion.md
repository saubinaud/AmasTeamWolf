# 13 — Fases de Ejecución

Plan dividido en fases pequeñas (~3-5 items). Cada fase sigue este ciclo:

```
Implementar → Build → Test Agent → Review Agent → Fix → Re-test → Deploy → Commit
```

---

## F1 — Tipos de documento + búsqueda mejorada
- A10: DNI / CE (Carné Extranjería) / Pasaporte en alumnos + apoderados
- B4: Mejorar búsqueda por DNI (normalizar input, LIKE fallback, trim)
- B5: Búsqueda unificada nombre + DNI

**Archivos**: `alumnos` schema, `space-alumnos.js`, `SpaceAlumnos.tsx`, `auth.js`, formularios matrícula/renovación
**BD**: ALTER TABLE alumnos ADD tipo_documento VARCHAR DEFAULT 'DNI'

## F2 — Info apoderado editable + progreso visual
- A1: Sección "Mi información" en perfil del alumno con datos del apoderado editables
- A2: Barra de progreso visual "X de Y clases asistidas" con porcentaje

**Archivos**: `PerfilPage.tsx`, `PerfilDesktop.tsx`, `auth.js` (cargarPerfil)

## F3 — Consulta pública de asistencias
- B1: Página `/consulta-asistencia` (input DNI → muestra nombre + calendario + clases restantes)

**Archivos**: nuevo componente `ConsultaAsistenciaPage.tsx`, nuevo endpoint `/api/consulta-asistencia`
**Sin login requerido** — búsqueda por DNI solamente

## F4 — Pagos parciales + historial
- C3: Timeline de pagos en perfil del alumno (fechas, montos, método)
- Mejora en Space: vista detallada de pagos por inscripción

**Archivos**: `auth.js` (cargarPerfil), `PerfilPage.tsx`, `space-inscripciones.js`

## F5 — Frecuencia semanal + congelamientos
- A9: Campo "frecuencia" en inscripción (1x/sem → multiplica duración)
- A8: Congelamientos visibles en perfil + gestionables desde Space

**BD**: ALTER TABLE inscripciones ADD frecuencia_semanal INTEGER DEFAULT 2

## F6 — Código referido + bono S/60
- A3: Generar código tipo "AMAS-XXXX" por alumno
- Tracking en matrícula: campo "código de referido"
- Acumular bono S/60 por referido que se inscribe

**BD**: ALTER TABLE alumnos ADD codigo_referido VARCHAR UNIQUE, ADD saldo_bonos NUMERIC DEFAULT 0
**BD**: CREATE TABLE referidos (referidor_id, referido_id, bono, canjeado, created_at)

## F7 — Módulo clases de prueba
- D1-D5: Registro, estados, embudo conversión, resúmenes
- Fusionar con Leads existente o crear módulo independiente

**BD**: CREATE TABLE clases_prueba (id, nombre, telefono, fecha, hora, profesora_id, estado, alumno_inscrito_id, created_at)

## F8 — Módulo profesores
- E1-E5: CRUD, asistencia por DNI, horarios, resumen mensual

**BD**: CREATE TABLE profesores (id, nombre, dni, telefono, contacto_emergencia, email, activo, created_at)
**BD**: CREATE TABLE asistencias_profesores (id, profesor_id, fecha, hora_entrada, hora_salida, observaciones)

## F9 — Graduaciones batch + limitaciones programas
- F1: Carga masiva (pegar CSV o lista)
- G3: Validar requisitos (8 clases → Leadership, 24 → Fighter)
- A6/A7: Notificaciones en perfil

## F10 — Implementos mejorados + tienda
- H1: Catálogo con precios automáticos
- H3: Fotos de implementos
- A5/A12: Sección en perfil del alumno

**BD**: CREATE TABLE catalogo_implementos (id, nombre, categoria, precio, foto_url, activo)

## F11 — Pasarela Culqi
- C1: Integración Culqi (tokenización tarjeta)
- C2: Pago desde perfil (renovación, torneos, implementos)
- Precios: con tarjeta = base + 3%, Yape/transfer = base

## F12 — Torneos desde perfil
- A4: Selección, modalidades, afiche, pago

**BD**: CREATE TABLE torneos (id, nombre, tipo, afiche_url, fecha, precio, activo)
**BD**: CREATE TABLE torneo_selecciones (id, torneo_id, alumno_id, modalidad, estado_pago)

## F13 — QR único inteligente
- B2: 1 solo QR diario → al escanear detecta clase del alumno por categoría/horario

## F14 — Pendiente de info David
- G1: Wolf Instructor
- G2: Fighter Wolf
- G6: Contrato modificado
- F2/F3: Cartillas de deberes
- D6: Audios clases prueba

---

## Estado de avance

| Fase | Estado | Fecha |
|------|--------|-------|
| F1 | ⏳ Pendiente | |
| F2 | ⏳ Pendiente | |
| F3 | ⏳ Pendiente | |
| F4 | ⏳ Pendiente | |
| F5 | ⏳ Pendiente | |
| F6 | ⏳ Pendiente | |
| F7 | ⏳ Pendiente | |
| F8 | ⏳ Pendiente | |
| F9 | ⏳ Pendiente | |
| F10 | ⏳ Pendiente | |
| F11 | ⏳ Pendiente | |
| F12 | ⏳ Pendiente | |
| F13 | ⏳ Pendiente | |
| F14 | 🔒 Esperando info | |
