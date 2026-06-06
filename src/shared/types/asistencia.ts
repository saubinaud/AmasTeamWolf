// Types for tables: asistencias, asistencias_profesores, qr_sesiones
// Generated from database/01_schema.sql

/**
 * IMPORTANT: `asistio` is VARCHAR, NOT boolean.
 * Values: 'Si' | 'No' | 'Tardanza'
 */
export interface Asistencia {
  id: number;
  alumno_id: number; // FK -> alumnos, NOT NULL
  inscripcion_id: number | null; // FK -> inscripciones
  fecha: string; // date NOT NULL -> ISO string
  hora: string | null; // time -> "HH:MM:SS"
  turno: string | null; // VARCHAR(50)
  asistio: 'Si' | 'No' | 'Tardanza'; // VARCHAR(20), DEFAULT 'Si'
  observaciones: string | null; // text
  created_at: string; // timestamp -> ISO string
  sede_id: number; // integer, DEFAULT 1
  qr_sesion_id: number | null; // FK -> qr_sesiones
  metodo_registro: 'qr' | 'manual'; // VARCHAR(20), DEFAULT 'qr'
}

export interface AsistenciaProfesor {
  id: number;
  profesor_id: number; // FK -> profesores, NOT NULL
  fecha: string; // date NOT NULL, DEFAULT CURRENT_DATE
  hora_entrada: string | null; // time -> "HH:MM:SS"
  observaciones: string | null; // text
  created_at: string; // timestamp -> ISO string
}

export interface QrSesion {
  id: number;
  sede_id: number; // FK -> sedes, NOT NULL
  horario_id: number | null; // FK -> horarios
  token: string; // VARCHAR(64), UNIQUE, NOT NULL
  fecha: string; // date NOT NULL, DEFAULT CURRENT_DATE
  hora_apertura: string; // timestamp NOT NULL
  hora_cierre: string | null; // timestamp
  activa: boolean; // DEFAULT true
  created_at: string; // timestamp -> ISO string
  hora_clase: string | null; // text
  programa: string | null; // text
}

/** View: v_asistencia_hoy */
export interface AsistenciaHoyView {
  id: number;
  nombre_alumno: string;
  dni_alumno: string | null;
  categoria: string | null;
  programa: string | null;
  estado_inscripcion: string | null;
  fecha: string;
  hora: string | null;
  turno: string | null;
  asistio: string | null;
  metodo_registro: string | null;
  sede: string | null;
}

export type AsistenciaCreate = Omit<Asistencia, 'id' | 'created_at'>;
