CREATE OR REPLACE FUNCTION public.registrar_asistencia(p_dni character varying, p_token character varying DEFAULT NULL::character varying, p_turno character varying DEFAULT NULL::character varying)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_alumno RECORD;
    v_inscripcion RECORD;
    v_sesion_id INTEGER DEFAULT NULL;
    v_asistencia_id INTEGER;
    v_sede_id INTEGER DEFAULT 1;
    v_turno VARCHAR;
BEGIN
    v_turno := COALESCE(p_turno, 'General');

    -- 1. Buscar alumno por DNI
    SELECT id, nombre_alumno, estado INTO v_alumno FROM alumnos WHERE dni_alumno = p_dni;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'DNI no encontrado', 'dni', p_dni);
    END IF;

    -- 2. Verificar inscripción activa
    SELECT id, programa, fecha_fin, estado INTO v_inscripcion
    FROM inscripciones WHERE alumno_id = v_alumno.id AND estado = 'Activo' ORDER BY fecha_inicio DESC LIMIT 1;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'No tiene inscripción activa', 'alumno', v_alumno.nombre_alumno);
    END IF;

    -- 3. Verificar token QR (si se proporcionó)
    IF p_token IS NOT NULL THEN
        SELECT id, sede_id INTO v_sesion_id, v_sede_id FROM qr_sesiones WHERE token = p_token AND activa = TRUE AND fecha = CURRENT_DATE;
        IF v_sesion_id IS NULL THEN
            RETURN json_build_object('success', false, 'error', 'QR expirado o inválido');
        END IF;
    END IF;

    -- 4. Verificar si ya marcó hoy en este turno
    IF EXISTS (SELECT 1 FROM asistencias WHERE alumno_id = v_alumno.id AND fecha = CURRENT_DATE AND turno = v_turno) THEN
        RETURN json_build_object('success', false, 'error', 'Asistencia ya registrada hoy', 'alumno', v_alumno.nombre_alumno, 'turno', v_turno);
    END IF;

    -- 5. Registrar asistencia
    INSERT INTO asistencias (alumno_id, inscripcion_id, fecha, hora, turno, asistio, sede_id, qr_sesion_id, metodo_registro)
    VALUES (v_alumno.id, v_inscripcion.id, CURRENT_DATE, CURRENT_TIME, v_turno, 'Sí', v_sede_id, v_sesion_id,
        CASE WHEN p_token IS NOT NULL THEN 'qr' ELSE 'manual' END)
    RETURNING id INTO v_asistencia_id;

    -- 6. Respuesta exitosa
    RETURN json_build_object(
        'success', true,
        'alumno', v_alumno.nombre_alumno,
        'programa', v_inscripcion.programa,
        'fecha', CURRENT_DATE,
        'hora', TO_CHAR(CURRENT_TIME::time, 'HH24:MI'),
        'turno', v_turno,
        'asistencia_id', v_asistencia_id
    );
END;
$function$

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$

