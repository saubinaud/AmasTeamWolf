// Barrel export for all shared types
// Each file maps to one or more database tables from database/01_schema.sql

export type {
  Alumno,
  AlumnoDetalle,
  AlumnoCreate,
  AlumnoUpdate,
} from './alumno';

export type {
  Inscripcion,
  InscripcionCreate,
  InscripcionUpdate,
} from './inscripcion';

export type {
  Asistencia,
  AsistenciaProfesor,
  QrSesion,
  AsistenciaHoyView,
  AsistenciaCreate,
} from './asistencia';

export type {
  Cinturon,
  Graduacion,
  HistorialCinturon,
  GraduacionCorreccion,
  GraduacionCreate,
  HistorialCinturonCreate,
} from './graduacion';

export type {
  Pago,
  PagoCreate,
  PagoUpdate,
} from './pago';

export type {
  Mensaje,
  MensajeLeido,
  MensajeConEstado,
  MensajeCreate,
} from './mensaje';

export type {
  SpacePermisos,
  SpaceUsuario,
  SpaceUsuarioPublic,
  SpaceSesion,
  SpaceUsuarioCreate,
  SpaceUsuarioUpdate,
} from './space';

export type {
  Lead,
  ClasePrueba,
  LeadCreate,
  LeadUpdate,
  ClasePruebaCreate,
} from './lead';

export type {
  Sede,
  Horario,
  SedeCreate,
  HorarioCreate,
} from './sede';

export type {
  TorneoConfig,
  TorneoSeleccion,
  TorneoConfigCreate,
  TorneoSeleccionCreate,
} from './torneo';

export type {
  ImplementoCategoria,
  ImplementoOrigen,
  Implemento,
  CatalogoImplemento,
  Talla,
  ImplementoCreate,
  CatalogoImplementoCreate,
} from './implemento';

export type {
  Profesor,
  ProfesorCreate,
  ProfesorUpdate,
} from './profesor';

export type {
  Referido,
  ReferidoCreate,
} from './referido';

export type {
  Congelamiento,
  CongelamientoCreate,
} from './congelamiento';

export type {
  Contrato,
  ContratoCreate,
} from './contrato';

export type {
  VerificationCode,
  LoginResult,
  CodeResult,
} from './auth';

export type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  ApiResult,
} from './api';
