--
-- PostgreSQL database dump
--

\restrict QRWKvvr8vfqMzMad7uOl8lF8vcpiHRerozZsRX9eJPzZoHoqJQpRcd2VH1XCaKv

-- Dumped from database version 17.9 (Debian 17.9-1.pgdg13+1)
-- Dumped by pg_dump version 17.9 (Debian 17.9-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: registrar_asistencia(character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registrar_asistencia(p_dni character varying, p_token character varying DEFAULT NULL::character varying, p_turno character varying DEFAULT NULL::character varying) RETURNS json
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alumnos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alumnos (
    id integer NOT NULL,
    nombre_alumno character varying(200) NOT NULL,
    dni_alumno character varying(20),
    fecha_nacimiento date,
    categoria character varying(50) DEFAULT 'No especificada'::character varying,
    nombre_apoderado character varying(200),
    dni_apoderado character varying(20),
    correo character varying(150),
    telefono character varying(50),
    direccion text,
    estado character varying(20) DEFAULT 'Activo'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    auth_id character varying(100)
);


--
-- Name: alumnos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.alumnos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: alumnos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.alumnos_id_seq OWNED BY public.alumnos.id;


--
-- Name: asistencias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asistencias (
    id integer NOT NULL,
    alumno_id integer NOT NULL,
    inscripcion_id integer,
    fecha date NOT NULL,
    hora time without time zone,
    turno character varying(50),
    asistio character varying(20) DEFAULT 'Sí'::character varying,
    observaciones text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    sede_id integer DEFAULT 1,
    qr_sesion_id integer,
    metodo_registro character varying(20) DEFAULT 'qr'::character varying
);


--
-- Name: asistencias_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.asistencias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: asistencias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.asistencias_id_seq OWNED BY public.asistencias.id;


--
-- Name: contratos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contratos (
    id integer NOT NULL,
    inscripcion_id integer NOT NULL,
    archivo_url character varying(500),
    firmado boolean DEFAULT false,
    fecha_firma date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: contratos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contratos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contratos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contratos_id_seq OWNED BY public.contratos.id;


--
-- Name: horarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.horarios (
    id integer NOT NULL,
    sede_id integer DEFAULT 1,
    dia_semana smallint NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    nombre_clase character varying(100),
    capacidad integer,
    instructor character varying(200),
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT horarios_dia_semana_check CHECK (((dia_semana >= 0) AND (dia_semana <= 6)))
);


--
-- Name: horarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.horarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: horarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.horarios_id_seq OWNED BY public.horarios.id;


--
-- Name: inscripciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inscripciones (
    id integer NOT NULL,
    alumno_id integer NOT NULL,
    programa character varying(100),
    fecha_inscripcion date,
    fecha_inicio date,
    fecha_fin date,
    clases_totales integer,
    turno character varying(50),
    dias_tentativos character varying(100),
    precio_programa numeric(10,2),
    precio_pagado numeric(10,2),
    descuento numeric(10,2) DEFAULT 0,
    codigo_promocional character varying(50),
    tipo_cliente character varying(50) DEFAULT 'Nuevo/Primer registro'::character varying,
    estado character varying(30) DEFAULT 'Activo'::character varying,
    estado_pago character varying(30) DEFAULT 'Pendiente'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: inscripciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inscripciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inscripciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inscripciones_id_seq OWNED BY public.inscripciones.id;


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id integer NOT NULL,
    nombre_apoderado character varying(200),
    telefono character varying(50),
    correo character varying(150),
    nombre_alumno character varying(200),
    fecha_nacimiento date,
    plataforma character varying(50),
    campana character varying(100),
    campana_id character varying(100),
    estado character varying(50) DEFAULT 'Nuevo'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: leads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.leads_id_seq OWNED BY public.leads.id;


--
-- Name: pagos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pagos (
    id integer NOT NULL,
    inscripcion_id integer NOT NULL,
    monto numeric(10,2) NOT NULL,
    fecha date,
    tipo character varying(50) DEFAULT 'Inscripción'::character varying,
    metodo_pago character varying(50),
    comprobante character varying(200),
    observaciones text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: pagos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pagos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pagos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pagos_id_seq OWNED BY public.pagos.id;


--
-- Name: qr_sesiones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qr_sesiones (
    id integer NOT NULL,
    sede_id integer NOT NULL,
    horario_id integer,
    token character varying(64) NOT NULL,
    fecha date DEFAULT CURRENT_DATE NOT NULL,
    hora_apertura timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    hora_cierre timestamp without time zone,
    activa boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    hora_clase text,
    programa text
);


--
-- Name: qr_sesiones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.qr_sesiones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: qr_sesiones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.qr_sesiones_id_seq OWNED BY public.qr_sesiones.id;


--
-- Name: sedes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sedes (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    direccion text,
    activa boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: sedes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sedes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sedes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sedes_id_seq OWNED BY public.sedes.id;


--
-- Name: tallas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tallas (
    id integer NOT NULL,
    alumno_id integer NOT NULL,
    talla_uniforme character varying(20),
    talla_polo character varying(20),
    fecha_registro date DEFAULT CURRENT_DATE,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: tallas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tallas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tallas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tallas_id_seq OWNED BY public.tallas.id;


--
-- Name: v_asistencia_hoy; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_asistencia_hoy AS
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
   FROM (((public.asistencias a
     JOIN public.alumnos al ON ((al.id = a.alumno_id)))
     LEFT JOIN public.inscripciones i ON ((i.id = a.inscripcion_id)))
     LEFT JOIN public.sedes s ON ((s.id = a.sede_id)))
  WHERE (a.fecha = CURRENT_DATE);


--
-- Name: v_asistencia_mensual; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_asistencia_mensual AS
 SELECT al.id AS alumno_id,
    al.nombre_alumno,
    al.dni_alumno,
    i.programa,
    date_trunc('month'::text, (a.fecha)::timestamp with time zone) AS mes,
    count(*) AS clases_asistidas,
    count(*) FILTER (WHERE ((a.asistio)::text = 'Sí'::text)) AS presentes,
    count(*) FILTER (WHERE ((a.asistio)::text = 'No'::text)) AS ausentes,
    round(((100.0 * (count(*) FILTER (WHERE ((a.asistio)::text = 'Sí'::text)))::numeric) / (NULLIF(count(*), 0))::numeric), 1) AS porcentaje_asistencia
   FROM ((public.asistencias a
     JOIN public.alumnos al ON ((al.id = a.alumno_id)))
     LEFT JOIN public.inscripciones i ON ((i.id = a.inscripcion_id)))
  GROUP BY al.id, al.nombre_alumno, al.dni_alumno, i.programa, (date_trunc('month'::text, (a.fecha)::timestamp with time zone));


--
-- Name: alumnos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumnos ALTER COLUMN id SET DEFAULT nextval('public.alumnos_id_seq'::regclass);


--
-- Name: asistencias id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencias ALTER COLUMN id SET DEFAULT nextval('public.asistencias_id_seq'::regclass);


--
-- Name: contratos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos ALTER COLUMN id SET DEFAULT nextval('public.contratos_id_seq'::regclass);


--
-- Name: horarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horarios ALTER COLUMN id SET DEFAULT nextval('public.horarios_id_seq'::regclass);


--
-- Name: inscripciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscripciones ALTER COLUMN id SET DEFAULT nextval('public.inscripciones_id_seq'::regclass);


--
-- Name: leads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads ALTER COLUMN id SET DEFAULT nextval('public.leads_id_seq'::regclass);


--
-- Name: pagos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos ALTER COLUMN id SET DEFAULT nextval('public.pagos_id_seq'::regclass);


--
-- Name: qr_sesiones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qr_sesiones ALTER COLUMN id SET DEFAULT nextval('public.qr_sesiones_id_seq'::regclass);


--
-- Name: sedes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sedes ALTER COLUMN id SET DEFAULT nextval('public.sedes_id_seq'::regclass);


--
-- Name: tallas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tallas ALTER COLUMN id SET DEFAULT nextval('public.tallas_id_seq'::regclass);


--
-- Name: alumnos alumnos_dni_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumnos
    ADD CONSTRAINT alumnos_dni_unique UNIQUE (dni_alumno);


--
-- Name: alumnos alumnos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumnos
    ADD CONSTRAINT alumnos_pkey PRIMARY KEY (id);


--
-- Name: asistencias asistencias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencias
    ADD CONSTRAINT asistencias_pkey PRIMARY KEY (id);


--
-- Name: contratos contratos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_pkey PRIMARY KEY (id);


--
-- Name: horarios horarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horarios
    ADD CONSTRAINT horarios_pkey PRIMARY KEY (id);


--
-- Name: inscripciones inscripciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscripciones
    ADD CONSTRAINT inscripciones_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: pagos pagos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_pkey PRIMARY KEY (id);


--
-- Name: qr_sesiones qr_sesiones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qr_sesiones
    ADD CONSTRAINT qr_sesiones_pkey PRIMARY KEY (id);


--
-- Name: qr_sesiones qr_sesiones_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qr_sesiones
    ADD CONSTRAINT qr_sesiones_token_key UNIQUE (token);


--
-- Name: sedes sedes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sedes
    ADD CONSTRAINT sedes_pkey PRIMARY KEY (id);


--
-- Name: tallas tallas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tallas
    ADD CONSTRAINT tallas_pkey PRIMARY KEY (id);


--
-- Name: idx_alumnos_auth_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alumnos_auth_id ON public.alumnos USING btree (auth_id);


--
-- Name: idx_alumnos_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alumnos_estado ON public.alumnos USING btree (estado);


--
-- Name: idx_alumnos_nombre; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alumnos_nombre ON public.alumnos USING btree (nombre_alumno);


--
-- Name: idx_asistencias_alumno; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asistencias_alumno ON public.asistencias USING btree (alumno_id);


--
-- Name: idx_asistencias_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asistencias_fecha ON public.asistencias USING btree (fecha);


--
-- Name: idx_asistencias_inscripcion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asistencias_inscripcion ON public.asistencias USING btree (inscripcion_id);


--
-- Name: idx_asistencias_metodo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asistencias_metodo ON public.asistencias USING btree (metodo_registro);


--
-- Name: idx_asistencias_sede; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asistencias_sede ON public.asistencias USING btree (sede_id);


--
-- Name: idx_asistencias_unica_dia; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_asistencias_unica_dia ON public.asistencias USING btree (alumno_id, fecha, turno);


--
-- Name: idx_contratos_inscripcion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratos_inscripcion ON public.contratos USING btree (inscripcion_id);


--
-- Name: idx_contratos_inscripcion_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_contratos_inscripcion_unique ON public.contratos USING btree (inscripcion_id);


--
-- Name: idx_horarios_dia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_horarios_dia ON public.horarios USING btree (dia_semana);


--
-- Name: idx_horarios_sede; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_horarios_sede ON public.horarios USING btree (sede_id);


--
-- Name: idx_inscripciones_alumno; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inscripciones_alumno ON public.inscripciones USING btree (alumno_id);


--
-- Name: idx_inscripciones_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inscripciones_estado ON public.inscripciones USING btree (estado);


--
-- Name: idx_inscripciones_fecha_fin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inscripciones_fecha_fin ON public.inscripciones USING btree (fecha_fin);


--
-- Name: idx_leads_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_estado ON public.leads USING btree (estado);


--
-- Name: idx_leads_telefono; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_telefono ON public.leads USING btree (telefono);


--
-- Name: idx_pagos_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagos_fecha ON public.pagos USING btree (fecha);


--
-- Name: idx_pagos_inscripcion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagos_inscripcion ON public.pagos USING btree (inscripcion_id);


--
-- Name: idx_qr_sesiones_activa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qr_sesiones_activa ON public.qr_sesiones USING btree (activa) WHERE (activa = true);


--
-- Name: idx_qr_sesiones_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qr_sesiones_fecha ON public.qr_sesiones USING btree (fecha);


--
-- Name: idx_qr_sesiones_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qr_sesiones_token ON public.qr_sesiones USING btree (token);


--
-- Name: idx_tallas_alumno; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tallas_alumno ON public.tallas USING btree (alumno_id);


--
-- Name: asistencias asistencias_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencias
    ADD CONSTRAINT asistencias_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.alumnos(id) ON DELETE CASCADE;


--
-- Name: asistencias asistencias_inscripcion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencias
    ADD CONSTRAINT asistencias_inscripcion_id_fkey FOREIGN KEY (inscripcion_id) REFERENCES public.inscripciones(id) ON DELETE SET NULL;


--
-- Name: asistencias asistencias_qr_sesion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencias
    ADD CONSTRAINT asistencias_qr_sesion_id_fkey FOREIGN KEY (qr_sesion_id) REFERENCES public.qr_sesiones(id) ON DELETE SET NULL;


--
-- Name: asistencias asistencias_sede_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencias
    ADD CONSTRAINT asistencias_sede_id_fkey FOREIGN KEY (sede_id) REFERENCES public.sedes(id) ON DELETE SET NULL;


--
-- Name: contratos contratos_inscripcion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_inscripcion_id_fkey FOREIGN KEY (inscripcion_id) REFERENCES public.inscripciones(id) ON DELETE CASCADE;


--
-- Name: horarios horarios_sede_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horarios
    ADD CONSTRAINT horarios_sede_id_fkey FOREIGN KEY (sede_id) REFERENCES public.sedes(id) ON DELETE CASCADE;


--
-- Name: inscripciones inscripciones_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscripciones
    ADD CONSTRAINT inscripciones_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.alumnos(id) ON DELETE CASCADE;


--
-- Name: pagos pagos_inscripcion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_inscripcion_id_fkey FOREIGN KEY (inscripcion_id) REFERENCES public.inscripciones(id) ON DELETE CASCADE;


--
-- Name: qr_sesiones qr_sesiones_horario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qr_sesiones
    ADD CONSTRAINT qr_sesiones_horario_id_fkey FOREIGN KEY (horario_id) REFERENCES public.horarios(id) ON DELETE SET NULL;


--
-- Name: qr_sesiones qr_sesiones_sede_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qr_sesiones
    ADD CONSTRAINT qr_sesiones_sede_id_fkey FOREIGN KEY (sede_id) REFERENCES public.sedes(id) ON DELETE CASCADE;


--
-- Name: tallas tallas_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tallas
    ADD CONSTRAINT tallas_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.alumnos(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict QRWKvvr8vfqMzMad7uOl8lF8vcpiHRerozZsRX9eJPzZoHoqJQpRcd2VH1XCaKv

