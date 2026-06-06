// Types for tables: space_usuarios, space_sesiones
// Generated from database/01_schema.sql

/** Permissions stored as JSONB in space_usuarios.permisos */
export interface SpacePermisos {
  [modulo: string]: boolean;
}

export interface SpaceUsuario {
  id: number;
  nombre: string; // VARCHAR(200) NOT NULL
  email: string; // VARCHAR(150) NOT NULL, UNIQUE
  password_hash: string; // VARCHAR(255) NOT NULL
  rol: 'admin' | 'profesor'; // CHECK constraint, DEFAULT 'profesor'
  activo: boolean; // DEFAULT true
  ultimo_login: string | null; // timestamp -> ISO string
  created_at: string; // timestamp -> ISO string
  permisos: SpacePermisos | null; // jsonb
  academias_acceso: string[]; // text[], DEFAULT '{amas}'
}

/** SpaceUsuario without sensitive fields (for API responses) */
export type SpaceUsuarioPublic = Omit<SpaceUsuario, 'password_hash'>;

export interface SpaceSesion {
  id: number;
  usuario_id: number | null; // FK -> space_usuarios
  token_hash: string; // VARCHAR(255) NOT NULL
  expires_at: string; // timestamp NOT NULL
  created_at: string; // timestamp -> ISO string
}

export type SpaceUsuarioCreate = Omit<SpaceUsuario, 'id' | 'created_at' | 'ultimo_login'>;
export type SpaceUsuarioUpdate = Partial<Omit<SpaceUsuarioCreate, 'password_hash'>> & { id: number };
