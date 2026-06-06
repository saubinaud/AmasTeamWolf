// Types for tables: sedes, horarios
// Generated from database/01_schema.sql

export interface Sede {
  id: number;
  nombre: string; // VARCHAR(100) NOT NULL
  direccion: string | null; // text
  activa: boolean; // DEFAULT true
  created_at: string; // timestamp -> ISO string
}

export interface Horario {
  id: number;
  sede_id: number; // FK -> sedes, DEFAULT 1
  dia_semana: number; // smallint NOT NULL, 0-6 (CHECK constraint)
  hora_inicio: string; // time NOT NULL -> "HH:MM:SS"
  hora_fin: string; // time NOT NULL -> "HH:MM:SS"
  nombre_clase: string | null; // VARCHAR(100)
  capacidad: number | null; // integer
  instructor: string | null; // VARCHAR(200)
  activo: boolean; // DEFAULT true
  created_at: string; // timestamp -> ISO string
  edad_min_meses: number | null; // integer — edad minima en meses
  edad_max_meses: number | null; // integer — edad maxima en meses
}

export type SedeCreate = Omit<Sede, 'id' | 'created_at'>;
export type HorarioCreate = Omit<Horario, 'id' | 'created_at'>;
