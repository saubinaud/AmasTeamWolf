CREATE OR REPLACE VIEW v_asistencia_hoy AS 
 SELECT a.id,
    al.nombre_alumno,
    al.dni_alumno,
    al.categoria,
    i.programa,
    i.estado AS estado_inscripcion,
    a.fecha,
    a.hora,
    a.turno,
    a.asistio,
    a.metodo_registro,
    s.nombre AS sede
   FROM (((asistencias a
     JOIN alumnos al ON ((al.id = a.alumno_id)))
     LEFT JOIN inscripciones i ON ((i.id = a.inscripcion_id)))
     LEFT JOIN sedes s ON ((s.id = a.sede_id)))
  WHERE (a.fecha = CURRENT_DATE);
CREATE OR REPLACE VIEW v_asistencia_mensual AS 
 SELECT al.id AS alumno_id,
    al.nombre_alumno,
    al.dni_alumno,
    i.programa,
    date_trunc('month'::text, (a.fecha)::timestamp with time zone) AS mes,
    count(*) AS clases_asistidas,
    count(*) FILTER (WHERE ((a.asistio)::text = 'Sí'::text)) AS presentes,
    count(*) FILTER (WHERE ((a.asistio)::text = 'No'::text)) AS ausentes,
    round(((100.0 * (count(*) FILTER (WHERE ((a.asistio)::text = 'Sí'::text)))::numeric) / (NULLIF(count(*), 0))::numeric), 1) AS porcentaje_asistencia
   FROM ((asistencias a
     JOIN alumnos al ON ((al.id = a.alumno_id)))
     LEFT JOIN inscripciones i ON ((i.id = a.inscripcion_id)))
  GROUP BY al.id, al.nombre_alumno, al.dni_alumno, i.programa, (date_trunc('month'::text, (a.fecha)::timestamp with time zone));
