// Types for tables: implementos, catalogo_implementos, tallas
// Generated from database/01_schema.sql

export type ImplementoCategoria = 'arma' | 'uniforme' | 'protector' | 'polo' | 'accesorio' | 'otro';
export type ImplementoOrigen = 'compra' | 'incluido_programa' | 'regalo' | 'promocion';

export interface Implemento {
  id: number;
  alumno_id: number; // FK -> alumnos, NOT NULL
  categoria: ImplementoCategoria; // CHECK constraint, NOT NULL
  tipo: string; // VARCHAR(100) NOT NULL
  talla: string | null; // VARCHAR(20)
  fecha_adquisicion: string; // date, DEFAULT CURRENT_DATE
  precio: number; // numeric(10,2), DEFAULT 0
  origen: ImplementoOrigen; // CHECK constraint, DEFAULT 'compra'
  metodo_pago: string | null; // VARCHAR(50)
  observaciones: string | null; // text
  created_by: number | null; // FK -> space_usuarios
  created_at: string; // timestamp -> ISO string
  entregado: boolean; // NOT NULL, DEFAULT false
  fecha_entrega: string | null; // timestamp -> ISO string
  entregado_by: number | null; // FK -> space_usuarios
}

export interface CatalogoImplemento {
  id: number;
  nombre: string; // VARCHAR(100) NOT NULL
  categoria: string; // VARCHAR(30) NOT NULL
  precio: number; // numeric NOT NULL, DEFAULT 0
  activo: boolean; // NOT NULL, DEFAULT true
  created_at: string; // timestamp -> ISO string
}

export interface Talla {
  id: number;
  alumno_id: number; // FK -> alumnos, NOT NULL
  talla_uniforme: string | null; // VARCHAR(20)
  talla_polo: string | null; // VARCHAR(20)
  fecha_registro: string; // date, DEFAULT CURRENT_DATE
  created_at: string; // timestamp -> ISO string
}

export type ImplementoCreate = Omit<Implemento, 'id' | 'created_at'>;
export type CatalogoImplementoCreate = Omit<CatalogoImplemento, 'id' | 'created_at'>;
