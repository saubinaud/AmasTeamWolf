// Types for table: congelamientos
// Generated from database/01_schema.sql

export interface Congelamiento {
  id: number;
  alumno_id: number; // FK -> alumnos, NOT NULL
  fecha_inicio: string; // date NOT NULL -> ISO string
  fecha_fin: string | null; // date -> ISO string
  dias: number; // integer, DEFAULT 0
  motivo: string | null; // text
  estado: 'activo' | 'finalizado'; // CHECK constraint, DEFAULT 'activo'
  created_at: string; // timestamp -> ISO string
}

export type CongelamientoCreate = Omit<Congelamiento, 'id' | 'created_at'>;
