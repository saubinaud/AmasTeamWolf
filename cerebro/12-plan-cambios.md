# 12 — Plan Maestro de Cambios (consolidado 2026-04-12)

Consolidación de la lista escrita de Sebastien + 3 transcripciones de audio. Organizado por área con prioridades relativas.

**Leyenda**: [HECHO] ya implementado | [PARCIAL] en progreso | [NUEVO] por hacer | [INFO] requiere info de David/equipo

---

## A. PERFIL DEL ALUMNO / APODERADO

| # | Cambio | Estado | Notas |
|---|--------|--------|-------|
| A1 | Información del apoderado visible + editable en la cuenta del alumno | [NUEVO] | Actualmente solo se muestra alumno. Añadir sección "Mi información" con nombre, DNI, correo, teléfono, dirección. Botón editar → PUT /api/auth/perfil |
| A2 | Progreso basado en clases ASISTIDAS (no por asistir) | [PARCIAL] | El perfil ya muestra asistencias. Falta: barra de progreso visual "X de Y clases asistidas" con porcentaje |
| A3 | Código de recomendado único por alumno + bono S/60 por referido que se inscribe | [NUEVO] | Generar código tipo "AMAS-[4LETRAS]" por alumno. En formulario matrícula: campo "código de referido". Si se inscribe → registrar bono S/60 acumulable al referidor. Mostrar saldo de bonos en perfil |
| A4 | Registro a torneo desde el perfil + modalidades + pago | [NUEVO] | Sección "Torneos" en perfil: "Has sido seleccionado al torneo X". Mostrar afiche, modalidades, montos. Diferenciar: regional, nacional, interescuelas, Panamericano, mundial. Cada uno tiene precio y nominación distinta. Botón solicitar pago |
| A5 | Implementos comprados (con fotos) + implementos por adquirir (tienda) | [PARCIAL] | Ya existe tabla `implementos` y se muestra en Space. Falta: en PERFIL del alumno, sección "Mis implementos" con fotos de los comprados + catálogo "Por adquirir" con fotos y botón comprar. Merchandising: pantalones negros, polos nuevos |
| A6 | Notificación al llegar a 8 clases → puede registrarse a Leadership | [NUEVO] | Query: si COUNT(asistencias WHERE asistio='Sí') >= 8, mostrar badge/notificación en perfil. Enlace a registro Leadership |
| A7 | Después de 24 clases (3 meses) + cinturón amarillo camuflado + >3 años → puede registrarse a Fighter Wolf | [NUEVO] | Requiere: validar clases ≥ 24, cinturon_actual >= 'amarillo camuflado', edad > 3 años |
| A8 | Cancelaciones/congelamientos visibles en perfil + editables desde Space | [PARCIAL] | Tabla `congelamientos` existe. Falta: mostrar en perfil las cancelaciones restantes del plan + congelamientos usados. En Space: widget para asignar cuántas cancelaciones tiene cada plan |
| A9 | Extensión de programa 1x/semana: multiplicar meses | [NUEVO] | Si alumno viene 1x/semana en vez de 2x: 3m→6m, 6m→12m, 1m→2m. Mismo precio. Lógica en inscripción: campo "frecuencia semanal" que ajusta `fecha_fin` automáticamente |
| A10 | Tipos de documento: DNI + CE (Carné de Extranjería) + Pasaporte | [NUEVO] | Actualmente solo DNI. Añadir campo `tipo_documento` en alumnos + apoderados. Frontend: selector Tipo documento + input. BD: ALTER TABLE, VARCHAR libre |
| A11 | Envío de archivos PDF desde Space → perfil del alumno | [NUEVO] | En mensajes o sección nueva: admin sube PDF (o link Google Drive). Alumno lo ve en su perfil con botón "Descargar" |
| A12 | Sección "Renovar ahora" + "Comprar implementos" en la pantalla principal del perfil | [NUEVO] | De la transcripción: al lado de "Renovar ahora" poner "Quiero comprar" con fotos de implementos disponibles |

---

## B. SISTEMA DE ASISTENCIAS

| # | Cambio | Estado | Notas |
|---|--------|--------|-------|
| B1 | Padres buscan por DNI → ven data y asistencias del hijo | [NUEVO] | Página pública tipo `/consulta-asistencia`: input DNI, muestra nombre + calendario de asistencias + clases restantes. Sin necesidad de login (o con login si ya tienen cuenta) |
| B2 | QR único que jale según grupo/clase del alumno | [NUEVO] | Actualmente el QR se genera POR CLASE (cada horario es un QR distinto). Alternativa: 1 solo QR diario, al escanear el sistema detecta automáticamente la clase del alumno según su categoría/horario. Más práctico pero requiere repensar el flujo |
| B3 | "Ver más" en carga de asistencias | [NUEVO] | Paginación con botón "Ver más" en la lista de asistencias del Space |
| B4 | Mejorar motor de búsqueda por DNI | [NUEVO] | A veces el DNI no encuentra al alumno. Posibles causas: DNI con espacios, guiones, o formato incorrecto. Fix: normalizar input (trim, solo dígitos), buscar con LIKE si no encuentra exacto |
| B5 | Buscador por nombre Y DNI (unificado) | [NUEVO] | Input que busca en ambos campos simultáneamente. Ya existe en Space alumnos (ILIKE). Faltaría en la pantalla pública de asistencia |

---

## C. PASARELA DE PAGO (Culqi)

| # | Cambio | Estado | Notas |
|---|--------|--------|-------|
| C1 | Integrar Culqi como pasarela de pago con tarjeta | [NUEVO] | Precio con tarjeta = precio base + 3% comisión Culqi. Precio con Yape/transferencia = precio base sin comisión. Mostrar ambos precios al cliente |
| C2 | Pago desde el perfil (torneo, implementos, renovación) | [NUEVO] | Después de tener Culqi, permitir pago directo desde el perfil del alumno para: torneos, implementos y renovaciones |
| C3 | Monto de pago parcial + fechas de pagos | [PARCIAL] | Ya implementado en Space (estadoPago Parcial con monto). Falta: en PERFIL del alumno, mostrar historial de pagos parciales con fechas. En Space: timeline de pagos por inscripción |

---

## D. MÓDULO CLASES DE PRUEBA (NUEVO)

| # | Cambio | Estado | Notas |
|---|--------|--------|-------|
| D1 | Registro de clases de prueba | [NUEVO] | Datos: nombre del prospecto, teléfono, fecha de la clase, hora, profesora asignada |
| D2 | Estado de la clase: por asistir → asistió / no asistió → se inscribió / no se inscribió / en confirmación / separación | [NUEVO] | Separación = inscripción. "En confirmación" = lead caliente |
| D3 | Resumen diario: cuántas clases de prueba tuvo cada día | [NUEVO] | Dashboard del módulo |
| D4 | Resumen semanal/mensual automatizado | [NUEVO] | Stats: clases esta semana, este mes, a la fecha |
| D5 | Embudo de conversión: total → asistieron → se inscribieron → pendientes → rechazaron | [NUEVO] | Similar al embudo de Leads. Probablemente se fusiona con el módulo de Leads existente (las clases de prueba SON leads calientes) |
| D6 | Sección de audios (clases de prueba) | [INFO] | ¿Qué audios? ¿Grabaciones de las clases? ¿Audio de bienvenida? Pedir info |

---

## E. MÓDULO PROFESORES (NUEVO)

| # | Cambio | Estado | Notas |
|---|--------|--------|-------|
| E1 | Base de datos de profesores | [NUEVO] | Tabla `profesores`: id, nombre, DNI, teléfono, email, contacto_emergencia, activo, created_at |
| E2 | CRUD en Space > Config (nuevo tab) | [NUEVO] | Gestionar profesores, sus datos, horarios asignados |
| E3 | Asistencia de profesores por DNI | [NUEVO] | Profesora inserta su DNI en una pantalla → se registra asistencia. O usa el mismo panel QR pero con un modo "profesor" |
| E4 | Registro de horarios acordados por profesor | [NUEVO] | Qué días y horas le toca a cada profesora. Comparar con asistencias reales |
| E5 | Resumen mensual: de 30 días, cuántos asistió | [NUEVO] | Dashboard por profesor: días asistidos vs esperados |

---

## F. GRADUACIONES

| # | Cambio | Estado | Notas |
|---|--------|--------|-------|
| F1 | Carga masiva de graduaciones | [NUEVO] | Similar al import de asistencias: pegar lista o CSV con alumno + cinturón + fecha. O un formulario batch en Space |
| F2 | Modificar cartilla de deberes según info David | [INFO] | Pedir contenido a David |
| F3 | Cartilla nueva para baby (<2 años): Wolf con pañal y cinturón | [INFO] | Diseño gráfico necesario. ¿Se implementa como PDF descargable o como página web? |

---

## G. INSCRIPCIONES / PROGRAMAS

| # | Cambio | Estado | Notas |
|---|--------|--------|-------|
| G1 | Programa Wolf Instructor | [INFO] | Pedir requisitos y estructura a David/Sebastien |
| G2 | Programa Fighter Wolf | [INFO] | Requisitos: ≥24 clases + cinturón amarillo camuflado + >3 años. Pedir estructura |
| G3 | Limitaciones de acceso a Leadership y Fighter | [NUEVO] | Validar requisitos antes de permitir inscripción. Leadership: 8 clases mínimo. Fighter: 24 clases + cinturón + edad. Instructor: ¿? |
| G4 | Beneficio Leadership/Fighter: prioridad en selección de torneos + preparación especial | [NUEVO] | Marcar en perfil. Mínimo 1-2 veces/mes preparación especial antes de torneo |
| G5 | Programa 1x/semana: ajustar duración | [NUEVO] | Mismo de A9. Campo frecuencia en inscripción |
| G6 | Modificar contrato según información David | [INFO] | Pedir cambios al texto del contrato → actualizar ContratoFirma.tsx |

---

## H. IMPLEMENTOS / TIENDA

| # | Cambio | Estado | Notas |
|---|--------|--------|-------|
| H1 | Desplegable en Space para marcar implemento con precio automático | [NUEVO] | Al seleccionar tipo (ej. "Polo AMAS") → llena precio automáticamente según catálogo. Tabla `catalogo_implementos` con precios |
| H2 | Estado pendiente → entregado | [HECHO] | Ya implementado con botón toggle + fecha_entrega |
| H3 | Fotos de implementos en perfil del alumno y en tienda | [NUEVO] | Subir fotos por implemento (Cloudinary o almacenamiento local). Mostrar en perfil + catálogo público |
| H4 | Nuevos productos: pantalones negros, polos nuevos | [INFO] | Definir SKUs, precios, tallas |

---

## I. DISEÑO / MARCA

| # | Cambio | Estado | Notas |
|---|--------|--------|-------|
| I1 | Parche AMAS TEAM WOLF con logo actualizado | [INFO] | Diseño gráfico — no es cambio de código |
| I2 | Plantilla base | [INFO] | ¿Para qué? ¿Emails? ¿Documentos? ¿Certificados? |

---

## Priorización sugerida

### Prioridad 1 — Alto impacto, bajo esfuerzo (hacer primero)
- **A1** Info apoderado editable en perfil
- **A10** Tipos de documento (DNI/CE/Pasaporte)
- **B4** Mejorar búsqueda por DNI
- **B1** Consulta pública de asistencias por DNI
- **C3** Historial de pagos parciales con fechas
- **H1** Precios automáticos en implementos

### Prioridad 2 — Alto impacto, esfuerzo medio
- **A3** Código de recomendado + bono S/60
- **A9** Extensión programa 1x/semana
- **D1-D5** Módulo clases de prueba (fusionar con Leads)
- **E1-E5** Módulo profesores
- **F1** Carga masiva graduaciones
- **G3** Limitaciones de acceso a programas

### Prioridad 3 — Alto impacto, esfuerzo alto
- **C1-C2** Pasarela Culqi
- **A4** Torneos desde perfil
- **A5** Tienda de implementos con fotos
- **B2** QR único inteligente

### Prioridad 4 — Requiere info de David/equipo primero
- **G1** Wolf Instructor
- **G2** Fighter Wolf
- **G6** Contrato modificado
- **F2-F3** Cartillas de deberes
- **I1-I2** Diseño/marca

---

## Dependencias clave

```
A10 (tipos documento) ← B4 (búsqueda DNI mejorada) ← B1 (consulta pública)
A3 (código referido) ← C1 (Culqi) para automatizar el bono
A6 (notif 8 clases) ← A7 (notif 24 clases) ← G3 (limitaciones programas)
D1-D5 (clases prueba) podría fusionarse con Leads existente
E1-E5 (profesores) es módulo independiente, se puede hacer en paralelo
C1 (Culqi) desbloquea: C2 (pagos desde perfil), A4 (torneos con pago)
```

---

## Lo que ya está hecho (para no duplicar)

- [x] Space completo S1-S7 (dashboard, alumnos, inscripciones, graduaciones, asistencia, leads, compras, mensajes, config)
- [x] Auth propio JWT (DNI + password)
- [x] Perfil del alumno con asistencias, inscripciones, pagos, contratos, mensajes
- [x] QR asistencia por clase
- [x] Contrato firmado digital con PDF
- [x] Estado de pago (Pendiente/Parcial/Pagado) con registro automático en pagos
- [x] Implementos con estado entregado/pendiente
- [x] Mensajes bidireccionales Space ↔ Perfil
- [x] Permisos por módulo para profesores en Space
- [x] Import masivo de asistencias desde Excel (2025+2026)
- [x] Registro de asistencias pasadas (individual, lote, rango)
- [x] Modo claro/oscuro Space
- [x] Admin overrides (precio, estado pago, skip contrato)
- [x] Horarios editables desde Space
