// Types for table: referidos
// Generated from database/01_schema.sql

export interface Referido {
  id: number;
  referidor_id: number; // FK -> alumnos, NOT NULL
  referido_id: number; // FK -> alumnos, NOT NULL, UNIQUE
  bono: number; // numeric NOT NULL, DEFAULT 60
  canjeado: boolean; // NOT NULL, DEFAULT false
  created_at: string; // timestamp -> ISO string
}

export type ReferidoCreate = Omit<Referido, 'id' | 'created_at'>;
