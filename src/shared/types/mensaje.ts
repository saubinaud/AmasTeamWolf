// Types for tables: mensajes, mensajes_leidos
// Generated from database/01_schema.sql

export interface Mensaje {
  id: number;
  tipo: 'difusion' | 'programa' | 'individual'; // CHECK constraint, NOT NULL
  asunto: string; // VARCHAR(200) NOT NULL
  contenido: string; // text NOT NULL
  programa_destino: string | null; // VARCHAR(100)
  alumno_destino_id: number | null; // FK -> alumnos
  created_by: number | null; // FK -> space_usuarios
  created_at: string; // timestamp -> ISO string
}

export interface MensajeLeido {
  id: number;
  mensaje_id: number; // FK -> mensajes, NOT NULL
  alumno_id: number; // FK -> alumnos, NOT NULL
  leido_at: string; // timestamp -> ISO string
}

/** Mensaje with read status (joined view used in frontend) */
export interface MensajeConEstado extends Mensaje {
  leido: boolean;
}

export type MensajeCreate = Omit<Mensaje, 'id' | 'created_at'>;
