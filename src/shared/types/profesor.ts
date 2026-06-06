// Types for table: profesores
// Generated from database/01_schema.sql

export interface Profesor {
  id: number;
  nombre: string; // VARCHAR(200) NOT NULL
  dni: string | null; // VARCHAR(20)
  telefono: string | null; // VARCHAR(20)
  email: string | null; // VARCHAR(100)
  contacto_emergencia: string | null; // VARCHAR(200)
  activo: boolean; // NOT NULL, DEFAULT true
  created_at: string; // timestamp -> ISO string
  space_usuario_id: number | null; // FK -> space_usuarios — vincula con panel
}

export type ProfesorCreate = Omit<Profesor, 'id' | 'created_at'>;
export type ProfesorUpdate = Partial<ProfesorCreate> & { id: number };
