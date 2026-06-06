// Types for table: verification_codes + auth flow
// Generated from database/01_schema.sql + AuthContext.tsx

export interface VerificationCode {
  id: number;
  alumno_id: number; // FK -> alumnos, NOT NULL
  code: string; // VARCHAR(6) NOT NULL
  expires_at: string; // timestamp NOT NULL -> ISO string
  used: boolean; // DEFAULT false
  created_at: string; // timestamp -> ISO string
}

export interface LoginResult {
  success: boolean;
  error?: string;
  needsPassword?: boolean;
  hasEmail?: boolean;
}

export interface CodeResult {
  success: boolean;
  emailHint?: string;
  error?: string;
}
