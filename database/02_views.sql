-- ============================================
-- AMAS TEAM WOLF - VISTAS CALCULADAS
-- ============================================
-- Vistas que calculan automáticamente:
-- - Días para vencimiento
-- - Clases pendientes
-- - Cinturón actual
-- - Edad del alumno
-- - Vista general completa
-- ============================================

-- ============================================
-- VISTA: Inscripción activa con días para vencimiento
-- ============================================
CREATE OR REPLACE VIEW v_inscripciones_activas AS
SELECT
    i.id,
    i.alumno_id,
    a.nombre AS alumno_nombre,
    ap.nombre AS apoderado_nombre,
    ap.correo AS apoderado_correo,
    ap.telefono AS apoderado_telefono,
    i.programa,
    i.fecha_inicio,
    i.fecha_fin,
    i.clases_totales,
    i.turno,
    i.dias_tentativos,
    i.precio_programa,
    i.precio_pagado,
    i.estado_pago,
    -- Días para vencimiento (negativo = ya venció)
    (i.fecha_fin - CURRENT_DATE) AS dias_para_vencimiento,
    -- Estado basado en días
    CASE
        WHEN (i.fecha_fin - CURRENT_DATE) < 0 THEN 'vencido'
        WHEN (i.fecha_fin - CURRENT_DATE) <= 7 THEN 'por_vencer'
        ELSE 'vigente'
    END AS estado_vencimiento
FROM inscripciones i
JOIN alumnos a ON i.alumno_id = a.id
LEFT JOIN apoderados ap ON a.apoderado_id = ap.id
WHERE i.activa = true;

COMMENT ON VIEW v_inscripciones_activas IS 'Inscripciones activas con cálculo de días para vencimiento';


-- ============================================
-- VISTA: Clases asistidas y pendientes por alumno
-- ============================================
CREATE OR REPLACE VIEW v_clases_alumno AS
SELECT
    a.id AS alumno_id,
    a.nombre AS alumno_nombre,
    i.id AS inscripcion_id,
    i.programa,
    i.fecha_inicio,
    i.fecha_fin,
    i.clases_totales,
    -- Contar asistencias dentro del período de la inscripción
    COALESCE(
        (SELECT COUNT(*)
         FROM asistencias asi
         WHERE asi.alumno_id = a.id
         AND asi.fecha BETWEEN i.fecha_inicio AND i.fecha_fin),
        0
    ) AS clases_asistidas,
    -- Clases pendientes
    i.clases_totales - COALESCE(
        (SELECT COUNT(*)
         FROM asistencias asi
         WHERE asi.alumno_id = a.id
         AND asi.fecha BETWEEN i.fecha_inicio AND i.fecha_fin),
        0
    ) AS clases_pendientes,
    -- Porcentaje de asistencia
    CASE
        WHEN i.clases_totales > 0 THEN
            ROUND(
                (COALESCE(
                    (SELECT COUNT(*)
                     FROM asistencias asi
                     WHERE asi.alumno_id = a.id
                     AND asi.fecha BETWEEN i.fecha_inicio AND i.fecha_fin),
                    0
                )::DECIMAL / i.clases_totales) * 100,
                1
            )
        ELSE 0
    END AS porcentaje_asistencia
FROM alumnos a
JOIN inscripciones i ON a.id = i.alumno_id
WHERE i.activa = true;

COMMENT ON VIEW v_clases_alumno IS 'Clases asistidas y pendientes por alumno en su inscripción activa';


-- ============================================
-- VISTA: Cinturón actual de cada alumno
-- ============================================
CREATE OR REPLACE VIEW v_cinturon_actual AS
SELECT DISTINCT ON (alumno_id)
    g.alumno_id,
    a.nombre AS alumno_nombre,
    g.cinturon AS cinturon_actual,
    g.fecha AS fecha_ultimo_cinturon,
    -- Contar total de graduaciones
    (SELECT COUNT(*) FROM graduaciones WHERE alumno_id = g.alumno_id) AS total_graduaciones
FROM graduaciones g
JOIN alumnos a ON g.alumno_id = a.id
ORDER BY alumno_id, g.fecha DESC;

COMMENT ON VIEW v_cinturon_actual IS 'Cinturón actual de cada alumno (última graduación)';


-- ============================================
-- VISTA: Alumnos con edad calculada
-- ============================================
CREATE OR REPLACE VIEW v_alumnos_edad AS
SELECT
    a.id,
    a.nombre,
    a.fecha_nacimiento,
    -- Calcular edad en años
    CASE
        WHEN a.fecha_nacimiento IS NOT NULL THEN
            EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.fecha_nacimiento))::INTEGER
        ELSE NULL
    END AS edad,
    -- Categoría sugerida basada en edad
    CASE
        WHEN a.fecha_nacimiento IS NULL THEN a.categoria
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.fecha_nacimiento)) < 6 THEN 'Mini'
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.fecha_nacimiento)) < 12 THEN 'Niños'
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.fecha_nacimiento)) < 18 THEN 'Adolescentes'
        ELSE 'Adultos'
    END AS categoria_sugerida,
    a.categoria AS categoria_actual,
    a.estado
FROM alumnos a;

COMMENT ON VIEW v_alumnos_edad IS 'Alumnos con edad calculada y categoría sugerida';


-- ============================================
-- VISTA: Dashboard general de alumnos
-- ============================================
-- Esta vista une toda la información relevante de un alumno
CREATE OR REPLACE VIEW v_dashboard_alumnos AS
SELECT
    a.id AS alumno_id,
    a.nombre AS alumno_nombre,
    a.dni AS alumno_dni,
    a.estado,
    a.fecha_inscripcion,
    a.talla_uniforme,
    a.talla_polo,
    -- Edad
    CASE
        WHEN a.fecha_nacimiento IS NOT NULL THEN
            EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.fecha_nacimiento))::INTEGER
        ELSE NULL
    END AS edad,
    a.categoria,
    -- Apoderado
    ap.id AS apoderado_id,
    ap.nombre AS apoderado_nombre,
    ap.correo AS apoderado_correo,
    ap.telefono AS apoderado_telefono,
    -- Inscripción activa
    i.id AS inscripcion_id,
    i.programa,
    i.fecha_inicio,
    i.fecha_fin,
    i.clases_totales,
    i.turno,
    i.dias_tentativos,
    i.estado_pago,
    -- Días para vencimiento
    (i.fecha_fin - CURRENT_DATE) AS dias_para_vencimiento,
    CASE
        WHEN i.fecha_fin IS NULL THEN 'sin_inscripcion'
        WHEN (i.fecha_fin - CURRENT_DATE) < 0 THEN 'vencido'
        WHEN (i.fecha_fin - CURRENT_DATE) <= 7 THEN 'por_vencer'
        ELSE 'vigente'
    END AS estado_vencimiento,
    -- Clases
    COALESCE(
        (SELECT COUNT(*)
         FROM asistencias asi
         WHERE asi.alumno_id = a.id
         AND i.id IS NOT NULL
         AND asi.fecha BETWEEN i.fecha_inicio AND i.fecha_fin),
        0
    ) AS clases_asistidas,
    COALESCE(i.clases_totales, 0) - COALESCE(
        (SELECT COUNT(*)
         FROM asistencias asi
         WHERE asi.alumno_id = a.id
         AND i.id IS NOT NULL
         AND asi.fecha BETWEEN i.fecha_inicio AND i.fecha_fin),
        0
    ) AS clases_pendientes,
    -- Cinturón actual
    (SELECT g.cinturon
     FROM graduaciones g
     WHERE g.alumno_id = a.id
     ORDER BY g.fecha DESC
     LIMIT 1) AS cinturon_actual,
    -- Programas adicionales
    (SELECT STRING_AGG(ia.programa, ', ')
     FROM inscripciones_adicionales ia
     WHERE ia.alumno_id = a.id AND ia.activo = true) AS programas_adicionales,
    -- ¿Está congelado?
    EXISTS(
        SELECT 1 FROM congelamientos c
        WHERE c.alumno_id = a.id
        AND c.activo = true
    ) AS tiene_congelamiento_activo
FROM alumnos a
LEFT JOIN apoderados ap ON a.apoderado_id = ap.id
LEFT JOIN inscripciones i ON a.id = i.alumno_id AND i.activa = true;

COMMENT ON VIEW v_dashboard_alumnos IS 'Vista completa de dashboard con toda la información del alumno';


-- ============================================
-- VISTA: Alumnos por vencer (próximos 7 días)
-- ============================================
CREATE OR REPLACE VIEW v_alumnos_por_vencer AS
SELECT
    a.nombre AS alumno_nombre,
    ap.nombre AS apoderado_nombre,
    ap.correo,
    ap.telefono,
    i.programa,
    i.fecha_fin,
    (i.fecha_fin - CURRENT_DATE) AS dias_para_vencimiento
FROM inscripciones i
JOIN alumnos a ON i.alumno_id = a.id
LEFT JOIN apoderados ap ON a.apoderado_id = ap.id
WHERE i.activa = true
AND (i.fecha_fin - CURRENT_DATE) BETWEEN 0 AND 7
ORDER BY i.fecha_fin ASC;

COMMENT ON VIEW v_alumnos_por_vencer IS 'Alumnos cuya inscripción vence en los próximos 7 días';


-- ============================================
-- VISTA: Alumnos vencidos
-- ============================================
CREATE OR REPLACE VIEW v_alumnos_vencidos AS
SELECT
    a.nombre AS alumno_nombre,
    ap.nombre AS apoderado_nombre,
    ap.correo,
    ap.telefono,
    i.programa,
    i.fecha_fin,
    (CURRENT_DATE - i.fecha_fin) AS dias_vencido
FROM inscripciones i
JOIN alumnos a ON i.alumno_id = a.id
LEFT JOIN apoderados ap ON a.apoderado_id = ap.id
WHERE i.activa = true
AND i.fecha_fin < CURRENT_DATE
ORDER BY i.fecha_fin ASC;

COMMENT ON VIEW v_alumnos_vencidos IS 'Alumnos con inscripción vencida';


-- ============================================
-- VISTA: Implementos por alumno
-- ============================================
CREATE OR REPLACE VIEW v_implementos_alumno AS
SELECT
    a.id AS alumno_id,
    a.nombre AS alumno_nombre,
    STRING_AGG(imp.tipo, ', ' ORDER BY imp.tipo) AS implementos,
    COUNT(imp.id) AS total_implementos,
    SUM(CASE WHEN imp.precio > 0 THEN 1 ELSE 0 END) AS implementos_comprados,
    SUM(CASE WHEN imp.precio = 0 THEN 1 ELSE 0 END) AS implementos_regalados
FROM alumnos a
LEFT JOIN implementos imp ON a.id = imp.alumno_id
GROUP BY a.id, a.nombre;

COMMENT ON VIEW v_implementos_alumno IS 'Resumen de implementos por alumno';


-- ============================================
-- VISTA: Resumen de ingresos por mes
-- ============================================
CREATE OR REPLACE VIEW v_ingresos_mensuales AS
SELECT
    DATE_TRUNC('month', fecha) AS mes,
    tipo,
    COUNT(*) AS cantidad_pagos,
    SUM(monto) AS total_ingresos
FROM pagos
GROUP BY DATE_TRUNC('month', fecha), tipo
ORDER BY mes DESC, tipo;

COMMENT ON VIEW v_ingresos_mensuales IS 'Resumen de ingresos agrupados por mes y tipo de pago';


-- ============================================
-- VISTA: Historial completo de un alumno (para consultas)
-- ============================================
CREATE OR REPLACE VIEW v_historial_inscripciones AS
SELECT
    a.id AS alumno_id,
    a.nombre AS alumno_nombre,
    i.programa,
    i.fecha_inicio,
    i.fecha_fin,
    i.clases_totales,
    i.precio_pagado,
    i.estado_pago,
    i.activa,
    CASE
        WHEN i.activa THEN 'Actual'
        ELSE 'Anterior'
    END AS tipo_inscripcion
FROM alumnos a
JOIN inscripciones i ON a.id = i.alumno_id
ORDER BY a.id, i.fecha_inicio DESC;

COMMENT ON VIEW v_historial_inscripciones IS 'Historial completo de inscripciones por alumno';


-- ============================================
-- FIN DEL SCRIPT DE VISTAS
-- ============================================
