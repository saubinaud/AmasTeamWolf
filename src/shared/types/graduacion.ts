// Types for tables: graduaciones, historial_cinturones, graduacion_correcciones, cinturones
// Generated from database/01_schema.sql

export interface Cinturon {
  id: number;
  nombre: string; // VARCHAR(100) NOT NULL, UNIQUE
  orden: number; // integer NOT NULL
  color_hex: string | null; // VARCHAR(7)
  activo: boolean; // DEFAULT true
  created_at: string; // timestamp -> ISO string
}

export interface Graduacion {
  id: number;
  alumno_id: number | null; // FK -> alumnos
  inscripcion_id: number | null; // FK -> inscripciones
  nombre_alumno: string; // VARCHAR(200) NOT NULL
  apellido_alumno: string; // VARCHAR(200) NOT NULL
  rango: string | null; // VARCHAR(100)
  horario: string | null; // VARCHAR(50)
  turno: string | null; // VARCHAR(50)
  fecha_graduacion: string; // date NOT NULL -> ISO string
  sede_id: number | null; // FK -> sedes
  estado: 'programada' | 'completada' | 'cancelada'; // CHECK constraint, DEFAULT 'programada'
  observaciones: string | null; // text
  created_by: number | null; // FK -> space_usuarios
  created_at: string; // timestamp -> ISO string
  updated_at: string; // timestamp -> ISO string
  cinturon_desde: string | null; // VARCHAR(50)
  cinturon_hasta: string | null; // VARCHAR(50)
  aprobado: boolean; // DEFAULT false
  cinturon_id: number | null; // FK -> cinturones
}

export interface HistorialCinturon {
  id: number;
  alumno_id: number; // FK -> alumnos, NOT NULL
  cinturon: string; // VARCHAR(50) NOT NULL
  fecha_obtencion: string; // date NOT NULL -> ISO string
  graduacion_id: number | null; // FK -> graduaciones
  observaciones: string | null; // text
  created_at: string; // timestamp -> ISO string
  cinturon_id: number | null; // FK -> cinturones
}

export interface GraduacionCorreccion {
  id: number;
  graduacion_id: number | null; // FK -> graduaciones
  nombre: string | null; // VARCHAR(200)
  apellido: string | null; // VARCHAR(200)
  correo: string | null; // VARCHAR(150)
  comentario: string; // text NOT NULL
  estado: 'pendiente' | 'resuelta' | 'rechazada'; // CHECK constraint, DEFAULT 'pendiente'
  resuelta_por: number | null; // FK -> space_usuarios
  created_at: string; // timestamp -> ISO string
}

export type GraduacionCreate = Omit<Graduacion, 'id' | 'created_at' | 'updated_at'>;
export type HistorialCinturonCreate = Omit<HistorialCinturon, 'id' | 'created_at'>;
