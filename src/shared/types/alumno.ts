// Types for table: alumnos
// Generated from database/01_schema.sql

export interface Alumno {
  id: number;
  nombre_alumno: string; // VARCHAR(200) NOT NULL
  dni_alumno: string | null; // VARCHAR(20), UNIQUE
  fecha_nacimiento: string | null; // date -> ISO string
  categoria: string | null; // VARCHAR(50), DEFAULT 'No especificada'
  nombre_apoderado: string | null; // VARCHAR(200)
  dni_apoderado: string | null; // VARCHAR(20)
  correo: string | null; // VARCHAR(150)
  telefono: string | null; // VARCHAR(50)
  direccion: string | null; // text
  estado: 'Activo' | 'Inactivo'; // VARCHAR(20), DEFAULT 'Activo'
  created_at: string; // timestamp -> ISO string
  updated_at: string; // timestamp -> ISO string
  auth_id: string | null; // VARCHAR(100)
  password_hash: string | null; // VARCHAR(100)
  cinturon_actual: string | null; // VARCHAR(50), DEFAULT 'Blanco'
  tipo_documento: 'DNI' | 'CE' | 'Pasaporte'; // VARCHAR(20) NOT NULL, DEFAULT 'DNI'
  codigo_referido: string | null; // VARCHAR(10), UNIQUE
  saldo_bonos: number; // numeric, DEFAULT 0, NOT NULL
  cinturon_actual_id: number | null; // FK -> cinturones
  // Generated columns (read-only, STORED):
  dni_alumno_norm: string | null;
  dni_apoderado_norm: string | null;
  nombre_alumno_norm: string | null;
  nombre_apoderado_norm: string | null;
}

/** Alumno with related data for detail views */
export interface AlumnoDetalle extends Alumno {
  talla_uniforme: string | null;
  talla_polo: string | null;
  inscripcion_activa: import('./inscripcion').Inscripcion | null;
  asistencias: import('./asistencia').Asistencia[];
  historial_cinturones: import('./graduacion').HistorialCinturon[];
}

/** Payload for creating a new alumno (omit auto-generated fields) */
export type AlumnoCreate = Omit<
  Alumno,
  'id' | 'created_at' | 'updated_at' | 'dni_alumno_norm' | 'dni_apoderado_norm' | 'nombre_alumno_norm' | 'nombre_apoderado_norm'
>;

/** Payload for updating an alumno (all fields optional except id) */
export type AlumnoUpdate = Partial<AlumnoCreate> & { id: number };
