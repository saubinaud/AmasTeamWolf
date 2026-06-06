// Types for tables: torneos_config, torneo_selecciones
// Generated from database/01_schema.sql

export interface TorneoConfig {
  id: number;
  nombre: string; // VARCHAR(200) NOT NULL
  tipo: 'regional' | 'nacional' | 'interescuelas' | 'panamericano' | 'mundial'; // VARCHAR(50) NOT NULL, DEFAULT 'regional'
  fecha: string | null; // date -> ISO string
  lugar: string | null; // VARCHAR(200)
  precio: number; // numeric, DEFAULT 0
  activo: boolean; // DEFAULT true
  created_at: string; // timestamp -> ISO string
}

export interface TorneoSeleccion {
  id: number;
  torneo_id: number; // FK -> torneos_config, NOT NULL
  alumno_id: number; // FK -> alumnos, NOT NULL
  modalidad: string | null; // VARCHAR(100)
  estado: 'seleccionado' | 'confirmado' | 'descartado'; // VARCHAR(30) NOT NULL, DEFAULT 'seleccionado'
  estado_pago: string | null; // VARCHAR(30), DEFAULT 'Pendiente'
  observaciones: string | null; // text
  created_by: number | null; // FK -> space_usuarios
  created_at: string; // timestamp -> ISO string
}

export type TorneoConfigCreate = Omit<TorneoConfig, 'id' | 'created_at'>;
export type TorneoSeleccionCreate = Omit<TorneoSeleccion, 'id' | 'created_at'>;
