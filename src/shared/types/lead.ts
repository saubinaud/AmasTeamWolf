// Types for tables: leads, clases_prueba
// Generated from database/01_schema.sql

export interface Lead {
  id: number;
  nombre_apoderado: string | null; // VARCHAR(200)
  telefono: string | null; // VARCHAR(50)
  correo: string | null; // VARCHAR(150)
  nombre_alumno: string | null; // VARCHAR(200)
  fecha_nacimiento: string | null; // date -> ISO string
  plataforma: string | null; // VARCHAR(50)
  campana: string | null; // VARCHAR(100)
  campana_id: string | null; // VARCHAR(100)
  estado: string | null; // VARCHAR(50), DEFAULT 'Nuevo'
  created_at: string; // timestamp -> ISO string
  updated_at: string; // timestamp -> ISO string
  observaciones: string | null; // text
  alumno_inscrito_id: number | null; // FK -> alumnos
}

export interface ClasePrueba {
  id: number;
  nombre_prospecto: string; // VARCHAR(200) NOT NULL
  telefono: string | null; // VARCHAR(20)
  email: string | null; // VARCHAR(100)
  fecha: string; // date NOT NULL -> ISO string
  hora: string | null; // VARCHAR(20)
  profesora: string | null; // VARCHAR(100)
  estado: 'por_asistir' | 'asistio' | 'no_asistio'; // CHECK via comment, DEFAULT 'por_asistir', NOT NULL
  resultado: 'inscrito' | 'en_confirmacion' | 'separacion' | 'no_interesado' | null; // NULL = pendiente
  observaciones: string | null; // text
  alumno_inscrito_id: number | null; // FK -> alumnos
  created_by: number | null; // FK -> space_usuarios
  created_at: string; // timestamp -> ISO string
}

export type LeadCreate = Omit<Lead, 'id' | 'created_at' | 'updated_at'>;
export type LeadUpdate = Partial<LeadCreate> & { id: number };
export type ClasePruebaCreate = Omit<ClasePrueba, 'id' | 'created_at'>;
