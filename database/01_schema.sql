-- ============================================
-- AMAS TEAM WOLF - BASE DE DATOS
-- ============================================
-- Script de creación de tablas
-- Ejecutar en PostgreSQL
-- ============================================

-- Eliminar tablas si existen (en orden inverso por dependencias)
DROP TABLE IF EXISTS implementos CASCADE;
DROP TABLE IF EXISTS congelamientos CASCADE;
DROP TABLE IF EXISTS asistencias CASCADE;
DROP TABLE IF EXISTS graduaciones CASCADE;
DROP TABLE IF EXISTS pagos CASCADE;
DROP TABLE IF EXISTS inscripciones_adicionales CASCADE;
DROP TABLE IF EXISTS inscripciones CASCADE;
DROP TABLE IF EXISTS alumnos CASCADE;
DROP TABLE IF EXISTS apoderados CASCADE;

-- ============================================
-- TABLA: APODERADOS
-- ============================================
-- Padres o tutores responsables de los alumnos
-- Un apoderado puede tener múltiples alumnos (hijos)
-- El correo es el identificador único principal

CREATE TABLE apoderados (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    dni VARCHAR(20),
    correo VARCHAR(200) UNIQUE,
    telefono VARCHAR(20),
    direccion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas por correo
CREATE INDEX idx_apoderados_correo ON apoderados(correo);
CREATE INDEX idx_apoderados_dni ON apoderados(dni);

COMMENT ON TABLE apoderados IS 'Padres o tutores responsables de los alumnos';
COMMENT ON COLUMN apoderados.correo IS 'Identificador único principal para buscar al apoderado';


-- ============================================
-- TABLA: ALUMNOS
-- ============================================
-- Información de cada alumno
-- Cada alumno pertenece a un apoderado

CREATE TABLE alumnos (
    id SERIAL PRIMARY KEY,
    apoderado_id INTEGER REFERENCES apoderados(id) ON DELETE SET NULL,
    nombre VARCHAR(200) NOT NULL,
    dni VARCHAR(20),
    fecha_nacimiento DATE,
    categoria VARCHAR(50), -- Niños, Adolescentes, Adultos, etc.
    talla_uniforme VARCHAR(10),
    talla_polo VARCHAR(10),
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'congelado')),
    fecha_inscripcion DATE, -- Primera vez que se inscribió
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas comunes
CREATE INDEX idx_alumnos_apoderado ON alumnos(apoderado_id);
CREATE INDEX idx_alumnos_nombre ON alumnos(nombre);
CREATE INDEX idx_alumnos_estado ON alumnos(estado);
CREATE INDEX idx_alumnos_dni ON alumnos(dni);

COMMENT ON TABLE alumnos IS 'Información de cada alumno de la academia';
COMMENT ON COLUMN alumnos.estado IS 'Estado actual: activo, inactivo o congelado';
COMMENT ON COLUMN alumnos.categoria IS 'Categoría por edad: Niños, Adolescentes, Adultos';


-- ============================================
-- TABLA: INSCRIPCIONES
-- ============================================
-- Cada inscripción o renovación a un programa base
-- Se mantiene historial completo (activa = true solo para la vigente)

CREATE TABLE inscripciones (
    id SERIAL PRIMARY KEY,
    alumno_id INTEGER NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
    programa VARCHAR(50) NOT NULL, -- 1_mes, 3_meses, 6_meses, 12_meses
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    clases_totales INTEGER DEFAULT 0,
    turno VARCHAR(50), -- Mañana, Tarde, Noche
    dias_tentativos VARCHAR(100), -- "Lunes, Miércoles, Viernes"
    precio_programa DECIMAL(10,2),
    precio_pagado DECIMAL(10,2),
    codigo_promocional VARCHAR(50),
    descuento DECIMAL(10,2) DEFAULT 0,
    contrato_url TEXT, -- Link al contrato
    estado_pago VARCHAR(30) DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'parcial', 'pagado', 'vencido')),
    activa BOOLEAN DEFAULT true, -- Solo una inscripción activa por alumno
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_inscripciones_alumno ON inscripciones(alumno_id);
CREATE INDEX idx_inscripciones_activa ON inscripciones(alumno_id, activa) WHERE activa = true;
CREATE INDEX idx_inscripciones_fecha_fin ON inscripciones(fecha_fin);
CREATE INDEX idx_inscripciones_estado_pago ON inscripciones(estado_pago);

COMMENT ON TABLE inscripciones IS 'Historial de inscripciones a programas base (1, 3, 6, 12 meses)';
COMMENT ON COLUMN inscripciones.activa IS 'Solo una inscripción debe estar activa por alumno';
COMMENT ON COLUMN inscripciones.dias_tentativos IS 'Días que asiste, formato: "Lunes, Miércoles, Viernes"';


-- ============================================
-- TABLA: INSCRIPCIONES_ADICIONALES
-- ============================================
-- Programas adicionales: Leadership, Fighters
-- Se añaden al paquete base del alumno

CREATE TABLE inscripciones_adicionales (
    id SERIAL PRIMARY KEY,
    alumno_id INTEGER NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
    programa VARCHAR(50) NOT NULL CHECK (programa IN ('leadership', 'fighters')),
    fecha_inscripcion DATE NOT NULL,
    precio_programa DECIMAL(10,2), -- Precio base del programa (ej: 1300 para Leadership)
    precio_pagado DECIMAL(10,2),
    descuento DECIMAL(10,2) DEFAULT 0,
    implementos_ya_tenia TEXT, -- "guantes, protector" - lo que ya tenía antes
    implementos_dados TEXT, -- "cabezal, canilleras" - lo que se le dio
    activo BOOLEAN DEFAULT true,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_inscripciones_adicionales_alumno ON inscripciones_adicionales(alumno_id);
CREATE INDEX idx_inscripciones_adicionales_programa ON inscripciones_adicionales(programa);
CREATE INDEX idx_inscripciones_adicionales_activo ON inscripciones_adicionales(alumno_id, activo) WHERE activo = true;

COMMENT ON TABLE inscripciones_adicionales IS 'Programas adicionales: Leadership (1300 soles con implementos) y Fighters';
COMMENT ON COLUMN inscripciones_adicionales.implementos_ya_tenia IS 'Implementos que el alumno ya tenía antes de inscribirse';
COMMENT ON COLUMN inscripciones_adicionales.implementos_dados IS 'Implementos entregados como parte del programa';


-- ============================================
-- TABLA: PAGOS
-- ============================================
-- Registro de todos los pagos realizados
-- Puede estar asociado a inscripción, inscripción adicional, o ser independiente (implementos)

CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    alumno_id INTEGER NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
    inscripcion_id INTEGER REFERENCES inscripciones(id) ON DELETE SET NULL,
    inscripcion_adicional_id INTEGER REFERENCES inscripciones_adicionales(id) ON DELETE SET NULL,
    monto DECIMAL(10,2) NOT NULL,
    fecha DATE NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('inscripcion', 'renovacion', 'implemento', 'leadership', 'fighters', 'otro')),
    metodo_pago VARCHAR(50), -- yape, transferencia, efectivo, etc.
    comprobante TEXT, -- Link o número de comprobante
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_pagos_alumno ON pagos(alumno_id);
CREATE INDEX idx_pagos_fecha ON pagos(fecha);
CREATE INDEX idx_pagos_tipo ON pagos(tipo);
CREATE INDEX idx_pagos_inscripcion ON pagos(inscripcion_id);

COMMENT ON TABLE pagos IS 'Registro de todos los pagos: inscripciones, renovaciones, implementos, etc.';


-- ============================================
-- TABLA: GRADUACIONES
-- ============================================
-- Historial de cinturones obtenidos
-- El cinturón actual es la última graduación

CREATE TABLE graduaciones (
    id SERIAL PRIMARY KEY,
    alumno_id INTEGER NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    cinturon VARCHAR(50) NOT NULL, -- blanco, amarillo, naranja, verde, azul, rojo, negro, etc.
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_graduaciones_alumno ON graduaciones(alumno_id);
CREATE INDEX idx_graduaciones_fecha ON graduaciones(alumno_id, fecha DESC);

COMMENT ON TABLE graduaciones IS 'Historial de graduaciones/cinturones obtenidos';
COMMENT ON COLUMN graduaciones.cinturon IS 'Cinturón obtenido: blanco, amarillo, naranja, verde, azul, rojo, negro';


-- ============================================
-- TABLA: ASISTENCIAS
-- ============================================
-- Registro de asistencia desde sistema biométrico
-- Incluye fecha y hora

CREATE TABLE asistencias (
    id SERIAL PRIMARY KEY,
    alumno_id INTEGER NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    turno VARCHAR(50), -- Mañana, Tarde, Noche (puede calcularse de la hora)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_asistencias_alumno ON asistencias(alumno_id);
CREATE INDEX idx_asistencias_fecha ON asistencias(fecha);
CREATE INDEX idx_asistencias_alumno_fecha ON asistencias(alumno_id, fecha);

-- Índice único para evitar duplicados de asistencia el mismo día
CREATE UNIQUE INDEX idx_asistencias_unico ON asistencias(alumno_id, fecha, turno);

COMMENT ON TABLE asistencias IS 'Registro de asistencia desde sistema biométrico';
COMMENT ON COLUMN asistencias.hora IS 'Hora exacta del registro biométrico';


-- ============================================
-- TABLA: CONGELAMIENTOS
-- ============================================
-- Períodos de congelamiento de membresía

CREATE TABLE congelamientos (
    id SERIAL PRIMARY KEY,
    alumno_id INTEGER NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    clases_pendientes INTEGER DEFAULT 0,
    observaciones TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_congelamientos_alumno ON congelamientos(alumno_id);
CREATE INDEX idx_congelamientos_activo ON congelamientos(alumno_id, activo) WHERE activo = true;

COMMENT ON TABLE congelamientos IS 'Períodos de congelamiento de membresía';
COMMENT ON COLUMN congelamientos.clases_pendientes IS 'Clases que quedan pendientes para cuando reactive';


-- ============================================
-- TABLA: IMPLEMENTOS
-- ============================================
-- Cada implemento que tiene un alumno (un registro por implemento)
-- Incluye si fue comprado, regalado o incluido en Leadership

CREATE TABLE implementos (
    id SERIAL PRIMARY KEY,
    alumno_id INTEGER NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
    tipo VARCHAR(100) NOT NULL, -- guantes, protector, cabezal, canilleras, uniforme, pads, etc.
    fecha_adquisicion DATE,
    precio DECIMAL(10,2) DEFAULT 0, -- 0 = regalado/incluido, >0 = vendido
    origen VARCHAR(50) DEFAULT 'compra' CHECK (origen IN ('compra', 'incluido_leadership', 'incluido_fighters', 'regalo', 'promocion')),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_implementos_alumno ON implementos(alumno_id);
CREATE INDEX idx_implementos_tipo ON implementos(tipo);
CREATE INDEX idx_implementos_origen ON implementos(origen);

COMMENT ON TABLE implementos IS 'Implementos que tiene cada alumno';
COMMENT ON COLUMN implementos.precio IS '0 = regalado o incluido en programa, >0 = vendido';
COMMENT ON COLUMN implementos.origen IS 'Cómo lo obtuvo: compra, incluido en Leadership/Fighters, regalo, promoción';


-- ============================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_apoderados_updated_at BEFORE UPDATE ON apoderados
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alumnos_updated_at BEFORE UPDATE ON alumnos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inscripciones_updated_at BEFORE UPDATE ON inscripciones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inscripciones_adicionales_updated_at BEFORE UPDATE ON inscripciones_adicionales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_congelamientos_updated_at BEFORE UPDATE ON congelamientos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- FIN DEL SCRIPT
-- ============================================
