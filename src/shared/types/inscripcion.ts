// Types for table: inscripciones
// Generated from database/01_schema.sql

export interface Inscripcion {
  id: number;
  alumno_id: number; // FK -> alumnos, NOT NULL
  programa: string | null; // VARCHAR(100)
  fecha_inscripcion: string | null; // date -> ISO string
  fecha_inicio: string | null; // date -> ISO string
  fecha_fin: string | null; // date -> ISO string
  clases_totales: number | null; // integer
  turno: string | null; // VARCHAR(50)
  dias_tentativos: string | null; // VARCHAR(100)
  precio_programa: number | null; // numeric(10,2)
  precio_pagado: number | null; // numeric(10,2)
  descuento: number; // numeric(10,2), DEFAULT 0
  codigo_promocional: string | null; // VARCHAR(50)
  tipo_cliente: string | null; // VARCHAR(50), DEFAULT 'Nuevo/Primer registro'
  estado: 'Activo' | 'Inactivo' | 'Vencido' | 'Congelado'; // VARCHAR(30), DEFAULT 'Activo'
  estado_pago: 'Pendiente' | 'Pagado' | 'Parcial'; // VARCHAR(30), DEFAULT 'Pendiente'
  created_at: string; // timestamp -> ISO string
  updated_at: string; // timestamp -> ISO string
  frecuencia_semanal: number; // integer NOT NULL, DEFAULT 2 — 1 o 2 veces por semana
}

export type InscripcionCreate = Omit<Inscripcion, 'id' | 'created_at' | 'updated_at'>;
export type InscripcionUpdate = Partial<InscripcionCreate> & { id: number };
