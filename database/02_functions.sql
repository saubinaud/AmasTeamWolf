                                                                     pg_get_functiondef                                                                      
-------------------------------------------------------------------------------------------------------------------------------------------------------------
 CREATE OR REPLACE FUNCTION public.registrar_asistencia(p_dni character varying, p_token character varying, p_turno character varying)                      +
  RETURNS json                                                                                                                                              +
  LANGUAGE plpgsql                                                                                                                                          +
 AS $function$                                                                                                                                              +
 DECLARE                                                                                                                                                    +
     v_alumno RECORD;                                                                                                                                       +
     v_inscripcion RECORD;                                                                                                                                  +
     v_sesion_id INTEGER DEFAULT NULL;                                                                                                                      +
     v_asistencia_id INTEGER;                                                                                                                               +
     v_sede_id INTEGER DEFAULT 1;                                                                                                                           +
     v_turno VARCHAR;                                                                                                                                       +
     v_clases_restantes INTEGER DEFAULT NULL;                                                                                                               +
     v_membresia_vencida BOOLEAN DEFAULT FALSE;                                                                                                             +
 BEGIN                                                                                                                                                      +
     v_turno := COALESCE(p_turno, 'General');                                                                                                               +
                                                                                                                                                            +
     -- 1. Buscar alumno por DNI (alumno o apoderado)                                                                                                       +
     SELECT id, nombre_alumno, dni_alumno, estado INTO v_alumno FROM alumnos WHERE dni_alumno = p_dni;                                                      +
     IF NOT FOUND THEN                                                                                                                                      +
         SELECT id, nombre_alumno, dni_alumno, estado INTO v_alumno FROM alumnos WHERE dni_apoderado = p_dni AND LOWER(estado) = 'activo' LIMIT 1;          +
     END IF;                                                                                                                                                +
     IF NOT FOUND THEN                                                                                                                                      +
         RETURN json_build_object('success', false, 'error', 'DNI no encontrado', 'dni', p_dni);                                                            +
     END IF;                                                                                                                                                +
                                                                                                                                                            +
     -- 2. Si alumno INACTIVO → rechazar                                                                                                                    +
     IF LOWER(v_alumno.estado) = 'inactivo' THEN                                                                                                            +
         RETURN json_build_object('success', false, 'error', 'Alumno inactivo. Contacta al administrador.', 'alumno', v_alumno.nombre_alumno);              +
     END IF;                                                                                                                                                +
                                                                                                                                                            +
     -- 3. Buscar inscripción: primero activa, sino la más reciente                                                                                         +
     SELECT id, programa, fecha_fin, estado, clases_totales INTO v_inscripcion                                                                              +
     FROM inscripciones WHERE alumno_id = v_alumno.id AND estado = 'Activo' ORDER BY fecha_inicio DESC LIMIT 1;                                             +
                                                                                                                                                            +
     IF NOT FOUND THEN                                                                                                                                      +
         SELECT id, programa, fecha_fin, estado, clases_totales INTO v_inscripcion                                                                          +
         FROM inscripciones WHERE alumno_id = v_alumno.id ORDER BY fecha_inicio DESC LIMIT 1;                                                               +
         IF FOUND THEN                                                                                                                                      +
             v_membresia_vencida := TRUE;                                                                                                                   +
         END IF;                                                                                                                                            +
     END IF;                                                                                                                                                +
                                                                                                                                                            +
     -- 4. Verificar token QR                                                                                                                               +
     IF p_token IS NOT NULL THEN                                                                                                                            +
         SELECT id, sede_id INTO v_sesion_id, v_sede_id FROM qr_sesiones WHERE token = p_token AND activa = TRUE AND fecha = CURRENT_DATE;                  +
         IF v_sesion_id IS NULL THEN                                                                                                                        +
             RETURN json_build_object('success', false, 'error', 'QR expirado o invalido');                                                                 +
         END IF;                                                                                                                                            +
     END IF;                                                                                                                                                +
                                                                                                                                                            +
     -- 5. Verificar duplicado hoy                                                                                                                          +
     IF EXISTS (SELECT 1 FROM asistencias WHERE alumno_id = v_alumno.id AND fecha = CURRENT_DATE AND turno = v_turno) THEN                                  +
         RETURN json_build_object('success', false, 'error', 'Asistencia ya registrada hoy', 'alumno', v_alumno.nombre_alumno, 'turno', v_turno);           +
     END IF;                                                                                                                                                +
                                                                                                                                                            +
     -- 6. Registrar asistencia (SIEMPRE si alumno activo, sin importar estado membresía)                                                                   +
     INSERT INTO asistencias (alumno_id, inscripcion_id, fecha, hora, turno, asistio, sede_id, qr_sesion_id, metodo_registro)                               +
     VALUES (v_alumno.id, v_inscripcion.id, CURRENT_DATE, CURRENT_TIME, v_turno, 'Sí', v_sede_id, v_sesion_id,                                              +
         CASE WHEN p_token IS NOT NULL THEN 'qr' ELSE 'manual' END)                                                                                         +
     RETURNING id INTO v_asistencia_id;                                                                                                                     +
                                                                                                                                                            +
     -- 7. Calcular clases restantes                                                                                                                        +
     IF v_inscripcion.clases_totales IS NOT NULL AND v_inscripcion.clases_totales > 0 THEN                                                                  +
         v_clases_restantes := v_inscripcion.clases_totales - (SELECT COUNT(*) FROM asistencias WHERE inscripcion_id = v_inscripcion.id AND asistio = 'Sí');+
     END IF;                                                                                                                                                +
                                                                                                                                                            +
     -- 8. Respuesta con flags de estado                                                                                                                    +
     RETURN json_build_object(                                                                                                                              +
         'success', true,                                                                                                                                   +
         'alumno', v_alumno.nombre_alumno,                                                                                                                  +
         'programa', v_inscripcion.programa,                                                                                                                +
         'fecha', CURRENT_DATE,                                                                                                                             +
         'hora', TO_CHAR(CURRENT_TIME::time, 'HH24:MI'),                                                                                                    +
         'turno', v_turno,                                                                                                                                  +
         'asistencia_id', v_asistencia_id,                                                                                                                  +
         'clases_restantes', v_clases_restantes,                                                                                                            +
         'membresia_vencida', v_membresia_vencida                                                                                                           +
     );                                                                                                                                                     +
 END;                                                                                                                                                       +
 $function$                                                                                                                                                 +
 
(1 row)

