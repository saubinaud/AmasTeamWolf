// Types for table: contratos
// Generated from database/01_schema.sql

export interface Contrato {
  id: number;
  inscripcion_id: number; // FK -> inscripciones, NOT NULL, UNIQUE index
  archivo_url: string | null; // VARCHAR(500)
  firmado: boolean; // DEFAULT false
  fecha_firma: string | null; // date -> ISO string
  created_at: string; // timestamp -> ISO string
  // Note: pdf_data (bytea) is excluded — binary data not serialized in API
}

export type ContratoCreate = Omit<Contrato, 'id' | 'created_at'>;
