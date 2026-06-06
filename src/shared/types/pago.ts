// Types for table: pagos
// Generated from database/01_schema.sql

export interface Pago {
  id: number;
  inscripcion_id: number; // FK -> inscripciones, NOT NULL
  monto: number; // numeric(10,2) NOT NULL
  fecha: string | null; // date -> ISO string
  tipo: string | null; // VARCHAR(50), DEFAULT 'Inscripcion'
  metodo_pago: string | null; // VARCHAR(50)
  comprobante: string | null; // VARCHAR(200)
  observaciones: string | null; // text
  created_at: string; // timestamp -> ISO string
}

export type PagoCreate = Omit<Pago, 'id' | 'created_at'>;
export type PagoUpdate = Partial<PagoCreate> & { id: number };
