# 07 — Mejoras Realizadas

## Sesión 2026-04-09 a 2026-04-13 (masiva)

### Migración Auth: Logto → JWT propio
- Eliminado LogtoProvider, AuthContext reescrito con DNI+password+JWT
- Backend /api/auth con bcrypt + jsonwebtoken, tabla verification_codes
- cargarPerfil() carga asistencias, inscripciones, pagos, contratos, mensajes, referidos, elegibilidad

### Tailwind v4 dinámico
- @tailwindcss/vite plugin, src/index.css solo imports, clases dinámicas

### PDFs contratos: Cloudinary → bytea + disco
- contratos.pdf_bytea + /opt/amas-contratos/

### Space Panel Completo (S1-S7 + F1-F10)
- **S1**: Auth + Layout + Dashboard + sidebar grupos desplegables
- **S2**: Graduaciones CRUD + aprobar + historial_cinturones
- **S3**: Alumnos + Inscripciones con LATERAL JOIN
- **S4**: Asistencia (6 endpoints) + Leads (stats + embudo)
- **S5**: Configuración (usuarios/sedes/horarios) + permisos por módulo
- **S6**: Mensajes bidireccionales Space ↔ Perfil
- **S7**: Compras (registro implementos + entrega)

### Fases F1-F10 (plan de 14 fases)
- **F1**: Tipos documento (DNI/CE/Pasaporte) + búsqueda normalizada en 9 rutas
- **F2**: Info apoderado editable en perfil + barra progreso visual
- **F3**: Consulta pública asistencias /consulta-asistencia (sin login)
- **F4**: Pagos parciales + historial timeline + registrar pago manual en Space
- **F5**: Frecuencia semanal (1x/2x) con ajuste duración
- **F6**: Código referido AMAS-XXXX + bono S/60 + tracking
- **F7**: Módulo clases de prueba (embudo conversión)
- **F8**: Módulo profesores (CRUD + asistencia por DNI + resumen mensual)
- **F9**: Graduaciones batch (table-builder) + elegibilidad Leadership/Fighter en perfil
- **F10**: Catálogo implementos (15 items) + precios automáticos + gestión admin

### Import masivo asistencias Excel
- Parser de Excels 2025+2026 (6,644 marcas, 416 alumnos)
- Matcher multi-nivel (exacto, tokens, apellidos, fuzzy)
- 3,326 asistencias importadas para 141 alumnos
- Fix retroactivo turno: 'Tarde' → clase real (Baby Wolf, etc.)
- Módulo "Registrar pasadas" con 3 modos (individual, lote, rango)

### Performance
- Columnas generadas dni_alumno_norm + dni_apoderado_norm con índices
- 5 índices adicionales (vencimiento, alumno+fecha, nombre)
- REPLACE(REPLACE(REPLACE())) eliminado de todas las queries → index scan

### UX/UI
- Modo claro/oscuro Space (CSS overrides sin refactorizar componentes)
- Admin overrides en Inscribir/Renovar (precio, estado_pago, skip firma/email)
- Heatmap asistencias en dashboard (clases × días, colores intensidad)
- Filtro "por vencer" en Inscritos (5/7/15/30 días)
- Entrega de implementos: select dropdown + fecha editable
- Timezone America/Lima forzado en todo el frontend (dateUtils.ts)

### Auditoría completa
- 19 rutas backend verificadas contra schema producción → 0 issues
- 6 issues HIGH frontend corregidos (optional chaining, error handling)
- Reglas de arquitectura documentadas (cerebro/14-reglas-arquitectura.md)

## Sesiones previas (2026-04-07)

### Fases 1-10 originales (UX/UI web pública)
- Seguridad (CORS, rate limiting, audit)
- Code splitting (1MB → 375KB)
- Colores #FF6700 → #FA7B21
- Responsive tablet + mobile UX
- Android gama baja optimizaciones
