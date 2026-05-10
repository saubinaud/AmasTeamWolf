--
-- PostgreSQL database dump
--

\restrict yxhu4TERRiwjCtHYQ2jJPUJH7zdvJsZYWlouFwCZ4QgJ7KnLoQlB6UrQdflYuPc

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
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


--
-- Name: registrar_asistencia(character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registrar_asistencia(p_dni character varying, p_token character varying, p_turno character varying) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_alumno RECORD;
    v_inscripcion RECORD;
    v_sesion_id INTEGER DEFAULT NULL;
    v_asistencia_id INTEGER;
    v_sede_id INTEGER DEFAULT 1;
    v_turno VARCHAR;
    v_clases_restantes INTEGER DEFAULT NULL;
    v_membresia_vencida BOOLEAN DEFAULT FALSE;
BEGIN
    v_turno := COALESCE(p_turno, 'General');

    -- 1. Buscar alumno por DNI (alumno o apoderado)
    SELECT id, nombre_alumno, dni_alumno, estado INTO v_alumno FROM alumnos WHERE dni_alumno = p_dni;
    IF NOT FOUND THEN
        SELECT id, nombre_alumno, dni_alumno, estado INTO v_alumno FROM alumnos WHERE dni_apoderado = p_dni AND LOWER(estado) = 'activo' LIMIT 1;
    END IF;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'DNI no encontrado', 'dni', p_dni);
    END IF;

    -- 2. Si alumno INACTIVO → rechazar
    IF LOWER(v_alumno.estado) = 'inactivo' THEN
        RETURN json_build_object('success', false, 'error', 'Alumno inactivo. Contacta al administrador.', 'alumno', v_alumno.nombre_alumno);
    END IF;

    -- 3. Buscar inscripción: primero activa, sino la más reciente
    SELECT id, programa, fecha_fin, estado, clases_totales INTO v_inscripcion
    FROM inscripciones WHERE alumno_id = v_alumno.id AND estado = 'Activo' ORDER BY fecha_inicio DESC LIMIT 1;
    
    IF NOT FOUND THEN
        SELECT id, programa, fecha_fin, estado, clases_totales INTO v_inscripcion
        FROM inscripciones WHERE alumno_id = v_alumno.id ORDER BY fecha_inicio DESC LIMIT 1;
        IF FOUND THEN
            v_membresia_vencida := TRUE;
        END IF;
    END IF;

    -- 4. Verificar token QR
    IF p_token IS NOT NULL THEN
        SELECT id, sede_id INTO v_sesion_id, v_sede_id FROM qr_sesiones WHERE token = p_token AND activa = TRUE AND fecha = CURRENT_DATE;
        IF v_sesion_id IS NULL THEN
            RETURN json_build_object('success', false, 'error', 'QR expirado o invalido');
        END IF;
    END IF;

    -- 5. Verificar duplicado hoy
    IF EXISTS (SELECT 1 FROM asistencias WHERE alumno_id = v_alumno.id AND fecha = CURRENT_DATE AND turno = v_turno) THEN
        RETURN json_build_object('success', false, 'error', 'Asistencia ya registrada hoy', 'alumno', v_alumno.nombre_alumno, 'turno', v_turno);
    END IF;

    -- 6. Registrar asistencia (SIEMPRE si alumno activo, sin importar estado membresía)
    INSERT INTO asistencias (alumno_id, inscripcion_id, fecha, hora, turno, asistio, sede_id, qr_sesion_id, metodo_registro)
    VALUES (v_alumno.id, v_inscripcion.id, CURRENT_DATE, CURRENT_TIME, v_turno, 'Sí', v_sede_id, v_sesion_id,
        CASE WHEN p_token IS NOT NULL THEN 'qr' ELSE 'manual' END)
    RETURNING id INTO v_asistencia_id;

    -- 7. Calcular clases restantes
    IF v_inscripcion.clases_totales IS NOT NULL AND v_inscripcion.clases_totales > 0 THEN
        v_clases_restantes := v_inscripcion.clases_totales - (SELECT COUNT(*) FROM asistencias WHERE inscripcion_id = v_inscripcion.id AND asistio = 'Sí');
    END IF;

    -- 8. Respuesta con flags de estado
    RETURN json_build_object(
        'success', true,
        'alumno', v_alumno.nombre_alumno,
        'programa', v_inscripcion.programa,
        'fecha', CURRENT_DATE,
        'hora', TO_CHAR(CURRENT_TIME::time, 'HH24:MI'),
        'turno', v_turno,
        'asistencia_id', v_asistencia_id,
        'clases_restantes', v_clases_restantes,
        'membresia_vencida', v_membresia_vencida
    );
END;
$$;


--
-- Name: unaccent_immutable(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.unaccent_immutable(text) RETURNS text
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    AS $_$ SELECT public.unaccent($1); $_$;


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
    auth_id character varying(100),
    password_hash character varying(100),
    cinturon_actual character varying(50) DEFAULT 'Blanco'::character varying,
    tipo_documento character varying(20) DEFAULT 'DNI'::character varying NOT NULL,
    codigo_referido character varying(10),
    saldo_bonos numeric DEFAULT 0 NOT NULL,
    dni_alumno_norm character varying(20) GENERATED ALWAYS AS (upper(replace(replace(replace((COALESCE(dni_alumno, ''::character varying))::text, ' '::text, ''::text), '-'::text, ''::text), '.'::text, ''::text))) STORED,
    dni_apoderado_norm character varying(20) GENERATED ALWAYS AS (upper(replace(replace(replace((COALESCE(dni_apoderado, ''::character varying))::text, ' '::text, ''::text), '-'::text, ''::text), '.'::text, ''::text))) STORED,
    nombre_alumno_norm character varying(200) GENERATED ALWAYS AS (lower(public.unaccent_immutable((COALESCE(nombre_alumno, ''::character varying))::text))) STORED,
    nombre_apoderado_norm character varying(200) GENERATED ALWAYS AS (lower(public.unaccent_immutable((COALESCE(nombre_apoderado, ''::character varying))::text))) STORED,
    cinturon_actual_id integer
);


--
-- Name: COLUMN alumnos.tipo_documento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alumnos.tipo_documento IS 'DNI, CE (Carné Extranjería), o Pasaporte';


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
-- Name: asistencias_profesores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asistencias_profesores (
    id integer NOT NULL,
    profesor_id integer NOT NULL,
    fecha date DEFAULT CURRENT_DATE NOT NULL,
    hora_entrada time without time zone,
    observaciones text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: asistencias_profesores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.asistencias_profesores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: asistencias_profesores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.asistencias_profesores_id_seq OWNED BY public.asistencias_profesores.id;


--
-- Name: catalogo_implementos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.catalogo_implementos (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    categoria character varying(30) NOT NULL,
    precio numeric DEFAULT 0 NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: catalogo_implementos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.catalogo_implementos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: catalogo_implementos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.catalogo_implementos_id_seq OWNED BY public.catalogo_implementos.id;


--
-- Name: cinturones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cinturones (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    orden integer NOT NULL,
    color_hex character varying(7),
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: cinturones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cinturones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cinturones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cinturones_id_seq OWNED BY public.cinturones.id;


--
-- Name: clases_prueba; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clases_prueba (
    id integer NOT NULL,
    nombre_prospecto character varying(200) NOT NULL,
    telefono character varying(20),
    email character varying(100),
    fecha date NOT NULL,
    hora character varying(20),
    profesora character varying(100),
    estado character varying(30) DEFAULT 'por_asistir'::character varying NOT NULL,
    resultado character varying(30),
    observaciones text,
    alumno_inscrito_id integer,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: COLUMN clases_prueba.estado; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clases_prueba.estado IS 'por_asistir, asistio, no_asistio';


--
-- Name: COLUMN clases_prueba.resultado; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clases_prueba.resultado IS 'NULL (pendiente), inscrito, en_confirmacion, separacion, no_interesado';


--
-- Name: clases_prueba_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clases_prueba_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clases_prueba_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clases_prueba_id_seq OWNED BY public.clases_prueba.id;


--
-- Name: congelamientos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.congelamientos (
    id integer NOT NULL,
    alumno_id integer NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date,
    dias integer DEFAULT 0,
    motivo text,
    estado character varying(20) DEFAULT 'activo'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT congelamientos_estado_check CHECK (((estado)::text = ANY (ARRAY[('activo'::character varying)::text, ('finalizado'::character varying)::text])))
);


--
-- Name: congelamientos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.congelamientos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: congelamientos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.congelamientos_id_seq OWNED BY public.congelamientos.id;


--
-- Name: contratos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contratos (
    id integer NOT NULL,
    inscripcion_id integer NOT NULL,
    archivo_url character varying(500),
    firmado boolean DEFAULT false,
    fecha_firma date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    pdf_data bytea
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
-- Name: graduacion_correcciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.graduacion_correcciones (
    id integer NOT NULL,
    graduacion_id integer,
    nombre character varying(200),
    apellido character varying(200),
    correo character varying(150),
    comentario text NOT NULL,
    estado character varying(20) DEFAULT 'pendiente'::character varying,
    resuelta_por integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT graduacion_correcciones_estado_check CHECK (((estado)::text = ANY (ARRAY[('pendiente'::character varying)::text, ('resuelta'::character varying)::text, ('rechazada'::character varying)::text])))
);


--
-- Name: graduacion_correcciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.graduacion_correcciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: graduacion_correcciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.graduacion_correcciones_id_seq OWNED BY public.graduacion_correcciones.id;


--
-- Name: graduaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.graduaciones (
    id integer NOT NULL,
    alumno_id integer,
    inscripcion_id integer,
    nombre_alumno character varying(200) NOT NULL,
    apellido_alumno character varying(200) NOT NULL,
    rango character varying(100),
    horario character varying(50),
    turno character varying(50),
    fecha_graduacion date NOT NULL,
    sede_id integer,
    estado character varying(30) DEFAULT 'programada'::character varying,
    observaciones text,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    cinturon_desde character varying(50),
    cinturon_hasta character varying(50),
    aprobado boolean DEFAULT false,
    cinturon_id integer,
    CONSTRAINT graduaciones_estado_check CHECK (((estado)::text = ANY (ARRAY[('programada'::character varying)::text, ('completada'::character varying)::text, ('cancelada'::character varying)::text])))
);


--
-- Name: graduaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.graduaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: graduaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.graduaciones_id_seq OWNED BY public.graduaciones.id;


--
-- Name: historial_cinturones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historial_cinturones (
    id integer NOT NULL,
    alumno_id integer NOT NULL,
    cinturon character varying(50) NOT NULL,
    fecha_obtencion date NOT NULL,
    graduacion_id integer,
    observaciones text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    cinturon_id integer
);


--
-- Name: historial_cinturones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.historial_cinturones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: historial_cinturones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.historial_cinturones_id_seq OWNED BY public.historial_cinturones.id;


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
    edad_min_meses integer,
    edad_max_meses integer,
    CONSTRAINT horarios_dia_semana_check CHECK (((dia_semana >= 0) AND (dia_semana <= 6)))
);


--
-- Name: COLUMN horarios.edad_min_meses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.horarios.edad_min_meses IS 'Edad mínima en meses para este horario/programa';


--
-- Name: COLUMN horarios.edad_max_meses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.horarios.edad_max_meses IS 'Edad máxima en meses para este horario/programa';


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
-- Name: implementos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.implementos (
    id integer NOT NULL,
    alumno_id integer NOT NULL,
    categoria character varying(30) NOT NULL,
    tipo character varying(100) NOT NULL,
    talla character varying(20),
    fecha_adquisicion date DEFAULT CURRENT_DATE,
    precio numeric(10,2) DEFAULT 0,
    origen character varying(50) DEFAULT 'compra'::character varying,
    metodo_pago character varying(50),
    observaciones text,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    entregado boolean DEFAULT false NOT NULL,
    fecha_entrega timestamp without time zone,
    entregado_by integer,
    CONSTRAINT implementos_categoria_check CHECK (((categoria)::text = ANY (ARRAY[('arma'::character varying)::text, ('uniforme'::character varying)::text, ('protector'::character varying)::text, ('polo'::character varying)::text, ('accesorio'::character varying)::text, ('otro'::character varying)::text]))),
    CONSTRAINT implementos_origen_check CHECK (((origen)::text = ANY (ARRAY[('compra'::character varying)::text, ('incluido_programa'::character varying)::text, ('regalo'::character varying)::text, ('promocion'::character varying)::text])))
);


--
-- Name: implementos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.implementos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: implementos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.implementos_id_seq OWNED BY public.implementos.id;


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
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    frecuencia_semanal integer DEFAULT 2 NOT NULL
);


--
-- Name: COLUMN inscripciones.frecuencia_semanal; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.inscripciones.frecuencia_semanal IS 'Veces por semana que asiste: 1 o 2. Si 1, la duración del programa se multiplica x2';


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
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    observaciones text,
    alumno_inscrito_id integer
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
-- Name: mensajes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mensajes (
    id integer NOT NULL,
    tipo character varying(20) NOT NULL,
    asunto character varying(200) NOT NULL,
    contenido text NOT NULL,
    programa_destino character varying(100),
    alumno_destino_id integer,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT mensajes_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('difusion'::character varying)::text, ('programa'::character varying)::text, ('individual'::character varying)::text])))
);


--
-- Name: mensajes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mensajes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mensajes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mensajes_id_seq OWNED BY public.mensajes.id;


--
-- Name: mensajes_leidos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mensajes_leidos (
    id integer NOT NULL,
    mensaje_id integer NOT NULL,
    alumno_id integer NOT NULL,
    leido_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: mensajes_leidos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mensajes_leidos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mensajes_leidos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mensajes_leidos_id_seq OWNED BY public.mensajes_leidos.id;


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
-- Name: profesores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profesores (
    id integer NOT NULL,
    nombre character varying(200) NOT NULL,
    dni character varying(20),
    telefono character varying(20),
    email character varying(100),
    contacto_emergencia character varying(200),
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    space_usuario_id integer
);


--
-- Name: COLUMN profesores.space_usuario_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profesores.space_usuario_id IS 'Vincula con space_usuarios para dar acceso al panel';


--
-- Name: profesores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.profesores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: profesores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.profesores_id_seq OWNED BY public.profesores.id;


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
-- Name: referidos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referidos (
    id integer NOT NULL,
    referidor_id integer NOT NULL,
    referido_id integer NOT NULL,
    bono numeric DEFAULT 60 NOT NULL,
    canjeado boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: referidos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.referidos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: referidos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.referidos_id_seq OWNED BY public.referidos.id;


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
-- Name: space_sesiones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.space_sesiones (
    id integer NOT NULL,
    usuario_id integer,
    token_hash character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: space_sesiones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.space_sesiones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: space_sesiones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.space_sesiones_id_seq OWNED BY public.space_sesiones.id;


--
-- Name: space_usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.space_usuarios (
    id integer NOT NULL,
    nombre character varying(200) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash character varying(255) NOT NULL,
    rol character varying(20) DEFAULT 'profesor'::character varying,
    activo boolean DEFAULT true,
    ultimo_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    permisos jsonb,
    academias_acceso text[] DEFAULT '{amas}'::text[],
    CONSTRAINT space_usuarios_rol_check CHECK (((rol)::text = ANY (ARRAY[('admin'::character varying)::text, ('profesor'::character varying)::text])))
);


--
-- Name: space_usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.space_usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: space_usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.space_usuarios_id_seq OWNED BY public.space_usuarios.id;


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
-- Name: torneo_selecciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.torneo_selecciones (
    id integer NOT NULL,
    torneo_id integer NOT NULL,
    alumno_id integer NOT NULL,
    modalidad character varying(100),
    estado character varying(30) DEFAULT 'seleccionado'::character varying NOT NULL,
    estado_pago character varying(30) DEFAULT 'Pendiente'::character varying,
    observaciones text,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: COLUMN torneo_selecciones.estado; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.torneo_selecciones.estado IS 'seleccionado, confirmado, descartado';


--
-- Name: torneo_selecciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.torneo_selecciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: torneo_selecciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.torneo_selecciones_id_seq OWNED BY public.torneo_selecciones.id;


--
-- Name: torneos_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.torneos_config (
    id integer NOT NULL,
    nombre character varying(200) NOT NULL,
    tipo character varying(50) DEFAULT 'regional'::character varying NOT NULL,
    fecha date,
    lugar character varying(200),
    precio numeric DEFAULT 0,
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: COLUMN torneos_config.tipo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.torneos_config.tipo IS 'regional, nacional, interescuelas, panamericano, mundial';


--
-- Name: torneos_config_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.torneos_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: torneos_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.torneos_config_id_seq OWNED BY public.torneos_config.id;


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
-- Name: verification_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification_codes (
    id integer NOT NULL,
    alumno_id integer NOT NULL,
    code character varying(6) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: verification_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.verification_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: verification_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.verification_codes_id_seq OWNED BY public.verification_codes.id;


--
-- Name: alumnos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumnos ALTER COLUMN id SET DEFAULT nextval('public.alumnos_id_seq'::regclass);


--
-- Name: asistencias id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencias ALTER COLUMN id SET DEFAULT nextval('public.asistencias_id_seq'::regclass);


--
-- Name: asistencias_profesores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencias_profesores ALTER COLUMN id SET DEFAULT nextval('public.asistencias_profesores_id_seq'::regclass);


--
-- Name: catalogo_implementos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalogo_implementos ALTER COLUMN id SET DEFAULT nextval('public.catalogo_implementos_id_seq'::regclass);


--
-- Name: cinturones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cinturones ALTER COLUMN id SET DEFAULT nextval('public.cinturones_id_seq'::regclass);


--
-- Name: clases_prueba id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clases_prueba ALTER COLUMN id SET DEFAULT nextval('public.clases_prueba_id_seq'::regclass);


--
-- Name: congelamientos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.congelamientos ALTER COLUMN id SET DEFAULT nextval('public.congelamientos_id_seq'::regclass);


--
-- Name: contratos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos ALTER COLUMN id SET DEFAULT nextval('public.contratos_id_seq'::regclass);


--
-- Name: graduacion_correcciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graduacion_correcciones ALTER COLUMN id SET DEFAULT nextval('public.graduacion_correcciones_id_seq'::regclass);


--
-- Name: graduaciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graduaciones ALTER COLUMN id SET DEFAULT nextval('public.graduaciones_id_seq'::regclass);


--
-- Name: historial_cinturones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_cinturones ALTER COLUMN id SET DEFAULT nextval('public.historial_cinturones_id_seq'::regclass);


--
-- Name: horarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horarios ALTER COLUMN id SET DEFAULT nextval('public.horarios_id_seq'::regclass);


--
-- Name: implementos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.implementos ALTER COLUMN id SET DEFAULT nextval('public.implementos_id_seq'::regclass);


--
-- Name: inscripciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscripciones ALTER COLUMN id SET DEFAULT nextval('public.inscripciones_id_seq'::regclass);


--
-- Name: leads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads ALTER COLUMN id SET DEFAULT nextval('public.leads_id_seq'::regclass);


--
-- Name: mensajes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensajes ALTER COLUMN id SET DEFAULT nextval('public.mensajes_id_seq'::regclass);


--
-- Name: mensajes_leidos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensajes_leidos ALTER COLUMN id SET DEFAULT nextval('public.mensajes_leidos_id_seq'::regclass);


--
-- Name: pagos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos ALTER COLUMN id SET DEFAULT nextval('public.pagos_id_seq'::regclass);


--
-- Name: profesores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profesores ALTER COLUMN id SET DEFAULT nextval('public.profesores_id_seq'::regclass);


--
-- Name: qr_sesiones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qr_sesiones ALTER COLUMN id SET DEFAULT nextval('public.qr_sesiones_id_seq'::regclass);


--
-- Name: referidos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referidos ALTER COLUMN id SET DEFAULT nextval('public.referidos_id_seq'::regclass);


--
-- Name: sedes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sedes ALTER COLUMN id SET DEFAULT nextval('public.sedes_id_seq'::regclass);


--
-- Name: space_sesiones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.space_sesiones ALTER COLUMN id SET DEFAULT nextval('public.space_sesiones_id_seq'::regclass);


--
-- Name: space_usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.space_usuarios ALTER COLUMN id SET DEFAULT nextval('public.space_usuarios_id_seq'::regclass);


--
-- Name: tallas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tallas ALTER COLUMN id SET DEFAULT nextval('public.tallas_id_seq'::regclass);


--
-- Name: torneo_selecciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.torneo_selecciones ALTER COLUMN id SET DEFAULT nextval('public.torneo_selecciones_id_seq'::regclass);


--
-- Name: torneos_config id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.torneos_config ALTER COLUMN id SET DEFAULT nextval('public.torneos_config_id_seq'::regclass);


--
-- Name: verification_codes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_codes ALTER COLUMN id SET DEFAULT nextval('public.verification_codes_id_seq'::regclass);


--
-- Name: alumnos alumnos_codigo_referido_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumnos
    ADD CONSTRAINT alumnos_codigo_referido_key UNIQUE (codigo_referido);


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
-- Name: asistencias_profesores asistencias_profesores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencias_profesores
    ADD CONSTRAINT asistencias_profesores_pkey PRIMARY KEY (id);


--
-- Name: asistencias_profesores asistencias_profesores_profesor_id_fecha_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencias_profesores
    ADD CONSTRAINT asistencias_profesores_profesor_id_fecha_key UNIQUE (profesor_id, fecha);


--
-- Name: catalogo_implementos catalogo_implementos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalogo_implementos
    ADD CONSTRAINT catalogo_implementos_pkey PRIMARY KEY (id);


--
-- Name: cinturones cinturones_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cinturones
    ADD CONSTRAINT cinturones_nombre_key UNIQUE (nombre);


--
-- Name: cinturones cinturones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cinturones
    ADD CONSTRAINT cinturones_pkey PRIMARY KEY (id);


--
-- Name: clases_prueba clases_prueba_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clases_prueba
    ADD CONSTRAINT clases_prueba_pkey PRIMARY KEY (id);


--
-- Name: congelamientos congelamientos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.congelamientos
    ADD CONSTRAINT congelamientos_pkey PRIMARY KEY (id);


--
-- Name: contratos contratos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_pkey PRIMARY KEY (id);


--
-- Name: graduacion_correcciones graduacion_correcciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graduacion_correcciones
    ADD CONSTRAINT graduacion_correcciones_pkey PRIMARY KEY (id);


--
-- Name: graduaciones graduaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graduaciones
    ADD CONSTRAINT graduaciones_pkey PRIMARY KEY (id);


--
-- Name: historial_cinturones historial_cinturones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_cinturones
    ADD CONSTRAINT historial_cinturones_pkey PRIMARY KEY (id);


--
-- Name: horarios horarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horarios
    ADD CONSTRAINT horarios_pkey PRIMARY KEY (id);


--
-- Name: implementos implementos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.implementos
    ADD CONSTRAINT implementos_pkey PRIMARY KEY (id);


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
-- Name: mensajes_leidos mensajes_leidos_mensaje_id_alumno_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensajes_leidos
    ADD CONSTRAINT mensajes_leidos_mensaje_id_alumno_id_key UNIQUE (mensaje_id, alumno_id);


--
-- Name: mensajes_leidos mensajes_leidos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensajes_leidos
    ADD CONSTRAINT mensajes_leidos_pkey PRIMARY KEY (id);


--
-- Name: mensajes mensajes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensajes
    ADD CONSTRAINT mensajes_pkey PRIMARY KEY (id);


--
-- Name: pagos pagos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_pkey PRIMARY KEY (id);


--
-- Name: profesores profesores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profesores
    ADD CONSTRAINT profesores_pkey PRIMARY KEY (id);


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
-- Name: referidos referidos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referidos
    ADD CONSTRAINT referidos_pkey PRIMARY KEY (id);


--
-- Name: referidos referidos_referido_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referidos
    ADD CONSTRAINT referidos_referido_id_key UNIQUE (referido_id);


--
-- Name: sedes sedes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sedes
    ADD CONSTRAINT sedes_pkey PRIMARY KEY (id);


--
-- Name: space_sesiones space_sesiones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.space_sesiones
    ADD CONSTRAINT space_sesiones_pkey PRIMARY KEY (id);


--
-- Name: space_usuarios space_usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.space_usuarios
    ADD CONSTRAINT space_usuarios_email_key UNIQUE (email);


--
-- Name: space_usuarios space_usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.space_usuarios
    ADD CONSTRAINT space_usuarios_pkey PRIMARY KEY (id);


--
-- Name: tallas tallas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tallas
    ADD CONSTRAINT tallas_pkey PRIMARY KEY (id);


--
-- Name: torneo_selecciones torneo_selecciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.torneo_selecciones
    ADD CONSTRAINT torneo_selecciones_pkey PRIMARY KEY (id);


--
-- Name: torneo_selecciones torneo_selecciones_torneo_id_alumno_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.torneo_selecciones
    ADD CONSTRAINT torneo_selecciones_torneo_id_alumno_id_key UNIQUE (torneo_id, alumno_id);


--
-- Name: torneos_config torneos_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.torneos_config
    ADD CONSTRAINT torneos_config_pkey PRIMARY KEY (id);


--
-- Name: verification_codes verification_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_codes
    ADD CONSTRAINT verification_codes_pkey PRIMARY KEY (id);


--
-- Name: idx_alumnos_auth_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alumnos_auth_id ON public.alumnos USING btree (auth_id);


--
-- Name: idx_alumnos_dni_alumno_norm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alumnos_dni_alumno_norm ON public.alumnos USING btree (dni_alumno_norm);


--
-- Name: idx_alumnos_dni_apoderado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alumnos_dni_apoderado ON public.alumnos USING btree (dni_apoderado);


--
-- Name: idx_alumnos_dni_apoderado_norm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alumnos_dni_apoderado_norm ON public.alumnos USING btree (dni_apoderado_norm);


--
-- Name: idx_alumnos_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alumnos_estado ON public.alumnos USING btree (estado);


--
-- Name: idx_alumnos_nombre; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alumnos_nombre ON public.alumnos USING btree (nombre_alumno);


--
-- Name: idx_alumnos_nombre_apo_norm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alumnos_nombre_apo_norm ON public.alumnos USING btree (nombre_apoderado_norm);


--
-- Name: idx_alumnos_nombre_lower; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alumnos_nombre_lower ON public.alumnos USING btree (lower((nombre_alumno)::text));


--
-- Name: idx_alumnos_nombre_norm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alumnos_nombre_norm ON public.alumnos USING btree (nombre_alumno_norm);


--
-- Name: idx_asistencias_alumno; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asistencias_alumno ON public.asistencias USING btree (alumno_id);


--
-- Name: idx_asistencias_alumno_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asistencias_alumno_fecha ON public.asistencias USING btree (alumno_id, fecha);


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
-- Name: idx_congelamientos_alumno; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_congelamientos_alumno ON public.congelamientos USING btree (alumno_id);


--
-- Name: idx_contratos_inscripcion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratos_inscripcion ON public.contratos USING btree (inscripcion_id);


--
-- Name: idx_contratos_inscripcion_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_contratos_inscripcion_unique ON public.contratos USING btree (inscripcion_id);


--
-- Name: idx_graduaciones_alumno; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_graduaciones_alumno ON public.graduaciones USING btree (alumno_id);


--
-- Name: idx_graduaciones_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_graduaciones_fecha ON public.graduaciones USING btree (fecha_graduacion);


--
-- Name: idx_historial_cinturones_alumno; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historial_cinturones_alumno ON public.historial_cinturones USING btree (alumno_id);


--
-- Name: idx_horarios_dia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_horarios_dia ON public.horarios USING btree (dia_semana);


--
-- Name: idx_horarios_sede; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_horarios_sede ON public.horarios USING btree (sede_id);


--
-- Name: idx_implementos_alumno; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_implementos_alumno ON public.implementos USING btree (alumno_id);


--
-- Name: idx_implementos_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_implementos_categoria ON public.implementos USING btree (categoria);


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
-- Name: idx_inscripciones_vencimiento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inscripciones_vencimiento ON public.inscripciones USING btree (fecha_fin) WHERE ((estado)::text = 'Activo'::text);


--
-- Name: idx_leads_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_estado ON public.leads USING btree (estado);


--
-- Name: idx_leads_telefono; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_telefono ON public.leads USING btree (telefono);


--
-- Name: idx_mensajes_leidos_alumno; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensajes_leidos_alumno ON public.mensajes_leidos USING btree (alumno_id);


--
-- Name: idx_mensajes_leidos_msg; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensajes_leidos_msg ON public.mensajes_leidos USING btree (mensaje_id);


--
-- Name: idx_mensajes_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensajes_tipo ON public.mensajes USING btree (tipo);


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
-- Name: idx_verification_codes_alumno; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_verification_codes_alumno ON public.verification_codes USING btree (alumno_id);


--
-- Name: alumnos alumnos_cinturon_actual_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumnos
    ADD CONSTRAINT alumnos_cinturon_actual_id_fkey FOREIGN KEY (cinturon_actual_id) REFERENCES public.cinturones(id);


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
-- Name: asistencias_profesores asistencias_profesores_profesor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asistencias_profesores
    ADD CONSTRAINT asistencias_profesores_profesor_id_fkey FOREIGN KEY (profesor_id) REFERENCES public.profesores(id);


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
-- Name: clases_prueba clases_prueba_alumno_inscrito_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clases_prueba
    ADD CONSTRAINT clases_prueba_alumno_inscrito_id_fkey FOREIGN KEY (alumno_inscrito_id) REFERENCES public.alumnos(id);


--
-- Name: congelamientos congelamientos_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.congelamientos
    ADD CONSTRAINT congelamientos_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.alumnos(id) ON DELETE CASCADE;


--
-- Name: contratos contratos_inscripcion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_inscripcion_id_fkey FOREIGN KEY (inscripcion_id) REFERENCES public.inscripciones(id) ON DELETE CASCADE;


--
-- Name: graduacion_correcciones graduacion_correcciones_graduacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graduacion_correcciones
    ADD CONSTRAINT graduacion_correcciones_graduacion_id_fkey FOREIGN KEY (graduacion_id) REFERENCES public.graduaciones(id);


--
-- Name: graduacion_correcciones graduacion_correcciones_resuelta_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graduacion_correcciones
    ADD CONSTRAINT graduacion_correcciones_resuelta_por_fkey FOREIGN KEY (resuelta_por) REFERENCES public.space_usuarios(id);


--
-- Name: graduaciones graduaciones_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graduaciones
    ADD CONSTRAINT graduaciones_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.alumnos(id);


--
-- Name: graduaciones graduaciones_cinturon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graduaciones
    ADD CONSTRAINT graduaciones_cinturon_id_fkey FOREIGN KEY (cinturon_id) REFERENCES public.cinturones(id);


--
-- Name: graduaciones graduaciones_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graduaciones
    ADD CONSTRAINT graduaciones_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.space_usuarios(id);


--
-- Name: graduaciones graduaciones_inscripcion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graduaciones
    ADD CONSTRAINT graduaciones_inscripcion_id_fkey FOREIGN KEY (inscripcion_id) REFERENCES public.inscripciones(id);


--
-- Name: graduaciones graduaciones_sede_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graduaciones
    ADD CONSTRAINT graduaciones_sede_id_fkey FOREIGN KEY (sede_id) REFERENCES public.sedes(id);


--
-- Name: historial_cinturones historial_cinturones_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_cinturones
    ADD CONSTRAINT historial_cinturones_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.alumnos(id) ON DELETE CASCADE;


--
-- Name: historial_cinturones historial_cinturones_cinturon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_cinturones
    ADD CONSTRAINT historial_cinturones_cinturon_id_fkey FOREIGN KEY (cinturon_id) REFERENCES public.cinturones(id);


--
-- Name: historial_cinturones historial_cinturones_graduacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_cinturones
    ADD CONSTRAINT historial_cinturones_graduacion_id_fkey FOREIGN KEY (graduacion_id) REFERENCES public.graduaciones(id);


--
-- Name: horarios horarios_sede_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horarios
    ADD CONSTRAINT horarios_sede_id_fkey FOREIGN KEY (sede_id) REFERENCES public.sedes(id) ON DELETE CASCADE;


--
-- Name: implementos implementos_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.implementos
    ADD CONSTRAINT implementos_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.alumnos(id) ON DELETE CASCADE;


--
-- Name: inscripciones inscripciones_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscripciones
    ADD CONSTRAINT inscripciones_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.alumnos(id) ON DELETE CASCADE;


--
-- Name: leads leads_alumno_inscrito_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_alumno_inscrito_id_fkey FOREIGN KEY (alumno_inscrito_id) REFERENCES public.alumnos(id);


--
-- Name: mensajes mensajes_alumno_destino_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensajes
    ADD CONSTRAINT mensajes_alumno_destino_id_fkey FOREIGN KEY (alumno_destino_id) REFERENCES public.alumnos(id);


--
-- Name: mensajes_leidos mensajes_leidos_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensajes_leidos
    ADD CONSTRAINT mensajes_leidos_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.alumnos(id) ON DELETE CASCADE;


--
-- Name: mensajes_leidos mensajes_leidos_mensaje_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mensajes_leidos
    ADD CONSTRAINT mensajes_leidos_mensaje_id_fkey FOREIGN KEY (mensaje_id) REFERENCES public.mensajes(id) ON DELETE CASCADE;


--
-- Name: pagos pagos_inscripcion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_inscripcion_id_fkey FOREIGN KEY (inscripcion_id) REFERENCES public.inscripciones(id) ON DELETE CASCADE;


--
-- Name: profesores profesores_space_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profesores
    ADD CONSTRAINT profesores_space_usuario_id_fkey FOREIGN KEY (space_usuario_id) REFERENCES public.space_usuarios(id);


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
-- Name: referidos referidos_referido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referidos
    ADD CONSTRAINT referidos_referido_id_fkey FOREIGN KEY (referido_id) REFERENCES public.alumnos(id);


--
-- Name: referidos referidos_referidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referidos
    ADD CONSTRAINT referidos_referidor_id_fkey FOREIGN KEY (referidor_id) REFERENCES public.alumnos(id);


--
-- Name: space_sesiones space_sesiones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.space_sesiones
    ADD CONSTRAINT space_sesiones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.space_usuarios(id) ON DELETE CASCADE;


--
-- Name: tallas tallas_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tallas
    ADD CONSTRAINT tallas_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.alumnos(id) ON DELETE CASCADE;


--
-- Name: torneo_selecciones torneo_selecciones_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.torneo_selecciones
    ADD CONSTRAINT torneo_selecciones_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.alumnos(id);


--
-- Name: torneo_selecciones torneo_selecciones_torneo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.torneo_selecciones
    ADD CONSTRAINT torneo_selecciones_torneo_id_fkey FOREIGN KEY (torneo_id) REFERENCES public.torneos_config(id);


--
-- Name: verification_codes verification_codes_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_codes
    ADD CONSTRAINT verification_codes_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.alumnos(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict yxhu4TERRiwjCtHYQ2jJPUJH7zdvJsZYWlouFwCZ4QgJ7KnLoQlB6UrQdflYuPc

