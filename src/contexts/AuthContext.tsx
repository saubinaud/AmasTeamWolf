import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { API_BASE } from '../config/api';

// ============ INTERFACES ============

interface FamiliaData {
  email: string;
  nombreFamilia: string;
  telefono: string;
  estudiante: string;
  dniFamilia: string;
  dniEstudiante: string;
  direccion: string;
}

interface Matricula {
  programa: string;
  fechaInicio: string;
  fechaFin: string;
  fechaInscripcion: string;
  estado: string;
  categoria: string;
  clasesTotales: number;
  clasesAsistidas: number;
  clasesRestantes: number;
  /** Estado del plan según v_plan_alumno (null: sin plan) */
  estadoPlan: string | null;
  vigente: boolean;
  diasParaVencer: number | null;
  vencioEl: string | null;
  diasDesdeVencimiento: number | null;
}

interface Clase {
  horario: string;
}

interface PagoData {
  fecha: string;
  monto: number;
  estado: string;
}

interface PagoHistorial {
  id: number;
  monto: number;
  fecha: string;
  tipo: string;
  metodo_pago: string;
  observaciones: string | null;
  created_at: string;
}

interface Pagos {
  proximoPago: PagoData;
  ultimoPago?: PagoData;
  precioPrograma: number;
  precioAPagar: number;
  descuento: number;
  estadoPago: string;
  historial: PagoHistorial[];
  totalPagado: number;
}

interface Notificacion {
  id: string;
  tipo: string;
  mensaje: string;
  fecha: string;
  leido: boolean;
}

interface EstudianteData {
  nombre: string;
  dni: string;
  fechaNacimiento: string;
  edad: string;
  categoria: string;
  tallaUniforme: string;
  tallaPolo: string;
  cinturonActual: string;
}

interface CinturonHistorial {
  cinturon: string;
  fecha: string;
}

interface ProximaGraduacion {
  fecha: string;
  horario: string;
  turno: string;
  rango: string;
  cinturonDesde: string;
  cinturonHasta: string;
}

interface MensajeData {
  id: number;
  tipo: 'difusion' | 'programa' | 'individual';
  asunto: string;
  contenido: string;
  fecha: string;
  leido: boolean;
}

interface Asistencia {
  fecha: string;
  /** asistio y tardanza cuentan como clase tomada */
  estado: 'asistio' | 'falta' | 'tardanza';
}

interface Congelacion {
  fechaInicio: string;
  fechaFin: string;
  estado: 'activo' | 'finalizado';
  dias: number;
}

interface TorneoData {
  id: number;
  modalidad: string;
  estado: string;
  estadoPago: string;
  torneoNombre: string;
  tipo: string;
  fecha: string;
  lugar: string;
  precio: number;
}

interface ImplementoData {
  id: number;
  categoria: string;
  tipo: string;
  talla: string;
  precio: number;
  fechaAdquisicion: string;
  observaciones: string | null;
  entregado: boolean;
}

interface ReferidoData {
  nombre: string;
  fecha: string;
  canjeado: boolean;
}

export interface Hijo {
  id: number;
  nombre: string;
  estado: string;
  programa: string | null;
  estadoPlan: string | null;
  cinturon: string;
}

export interface SolicitudCongelamiento {
  id: number;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  motivo: string | null;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';
  respuesta: string | null;
}

interface CongelamientoInfo {
  puede: boolean;
  motivo: string | null;
  topeDias: number;
  anticipacionMaxDias: number;
  /** Días de aviso mínimos para pedir (T&C v3: 7) */
  avisoMinDias: number;
  solicitudes: SolicitudCongelamiento[];
}

interface LineaHorario {
  clase: string | null;
  dias: number[];
  horaInicio: string;
  horaFin: string | null;
  pista: string | null;
}

interface UserData {
  alumnoId: number;
  hijos: Hijo[];
  familia: FamiliaData;
  historialCinturones: CinturonHistorial[];
  proximaGraduacion: ProximaGraduacion | null;
  matricula: Matricula;
  clases: Clase[];
  pagos: Pagos;
  notificaciones: Notificacion[];
  estudiante: EstudianteData;
  mensajes: MensajeData[];
  asistencias: Asistencia[];
  congelaciones: Congelacion[];
  codigoReferido: string | null;
  saldoBonos: number;
  elegibleLeadership: boolean;
  elegibleFighter: boolean;
  referidos: ReferidoData[];
  torneos: TorneoData[];
  implementos: ImplementoData[];
  congelamiento: CongelamientoInfo;
  horario: LineaHorario[];
  contrato: { url: string; firmadoAt: string } | null;
}

interface LoginResult {
  success: boolean;
  error?: string;
  /** La familia tiene más de un hijo: la web pregunta a cuál ver */
  elegirHijo?: boolean;
  hijos?: Hijo[];
}

export type PropositoCodigo = 'crear' | 'recuperar';

interface CodeResult {
  success: boolean;
  /** Mensaje del API: el mismo exista o no el DNI */
  mensaje?: string;
  error?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserData | null;
  login: (dni: string, password: string) => Promise<LoginResult>;
  /** Envía un código al correo del apoderado. 'recuperar' = olvidé mi contraseña. */
  requestCode: (dni: string, proposito?: PropositoCodigo) => Promise<CodeResult>;
  verifyCode: (dni: string, code: string) => Promise<{ success: boolean; error?: string }>;
  /** Pone la contraseña con el código recibido por correo (crear la primera o restablecerla). */
  setPassword: (dni: string, code: string, password: string, proposito?: PropositoCodigo) => Promise<LoginResult>;
  /** Cambia el hijo que se ve (familias con más de un alumno) */
  elegirHijo: (alumnoId: number) => Promise<{ success: boolean; error?: string }>;
  /** Recién entró una familia con varios hijos: el perfil pregunta a cuál ver */
  debeElegirHijo: boolean;
  /** La familia ya eligió (o siguió con el que abrió) */
  terminarEleccion: () => void;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_API = `${API_BASE}/auth`;

const estadoAsistencia = (asistio: string): Asistencia['estado'] =>
  asistio === 'Sí' ? 'asistio' : asistio === 'Tardanza' ? 'tardanza' : 'falta';

const transformHijo = (h: any): Hijo => ({
  id: Number(h.id),
  nombre: h.nombre || '',
  estado: h.estado || '',
  programa: h.programa ?? null,
  estadoPlan: h.estado_plan ?? null,
  cinturon: h.cinturon || 'Blanco',
});

function transformProfile(data: any): UserData {
  const plan = data.plan || null;
  const cong = data.congelamiento || {};
  return {
    alumnoId: Number(data.alumno_id),
    hijos: Array.isArray(data.hijos) ? data.hijos.map(transformHijo) : [],
    familia: {
      email: data.apoderado_correo || '',
      nombreFamilia: data.apoderado_nombre || data.nombre_apoderado || 'Familia',
      telefono: data.apoderado_telefono || '',
      estudiante: data.alumno_nombre || data.nombre_alumno || '',
      dniFamilia: String(data.dni_apoderado || data.apoderado_dni || ''),
      dniEstudiante: String(data.alumno_dni || data.dni_alumno || ''),
      direccion: data.direccion || '',
    },
    matricula: {
      programa: data.programa || 'Sin programa activo',
      fechaInicio: data.fecha_inicio || '',
      fechaFin: data.fecha_fin || '',
      fechaInscripcion: data.fecha_inscripcion || '',
      estado: data.estado || 'activa',
      categoria: data.categoria || '',
      clasesTotales: Number(data.clases_totales) || 0,
      clasesAsistidas: Number(data.clases_asistidas) || 0,
      clasesRestantes: Number(data.clases_restantes) || 0,
      estadoPlan: plan?.estado_plan ?? null,
      vigente: Boolean(plan?.vigente),
      diasParaVencer: plan?.dias_para_vencer ?? null,
      vencioEl: plan?.vencio_el ?? null,
      diasDesdeVencimiento: plan?.dias_desde_vencimiento ?? null,
    },
    clases: data.dias_tentativos ? [{ horario: data.dias_tentativos }] : [],
    pagos: {
      proximoPago: { fecha: data.fecha_fin || '', monto: Number(data.precio_pagado) || 0, estado: 'pendiente' },
      ultimoPago: undefined,
      precioPrograma: Number(data.precio_programa) || 0,
      precioAPagar: Number(data.precio_pagado) || 0,
      descuento: Number(data.descuento) || 0,
      estadoPago: data.estado_pago || 'Pendiente',
      historial: Array.isArray(data.pagos_historial)
        ? data.pagos_historial.map((p: Record<string, unknown>) => ({
            id: Number(p.id),
            monto: Number(p.monto) || 0,
            fecha: String(p.fecha || ''),
            tipo: String(p.tipo || ''),
            metodo_pago: String(p.metodo_pago || ''),
            observaciones: (p.observaciones as string | null) ?? null,
            created_at: String(p.created_at || ''),
          }))
        : [],
      totalPagado: Number(data.pagos_total) || Number(data.precio_pagado) || 0,
    },
    notificaciones: [],
    estudiante: {
      nombre: data.alumno_nombre || data.nombre_alumno || '',
      dni: String(data.alumno_dni || data.dni_alumno || ''),
      fechaNacimiento: data.fecha_nacimiento || '',
      edad: calculateAge(data.fecha_nacimiento),
      categoria: data.categoria || '',
      tallaUniforme: data.talla_uniforme || 'Sin registrar',
      tallaPolo: data.talla_polo || 'Sin registrar',
      cinturonActual: data.cinturon_actual || 'Blanco',
    },
    historialCinturones: Array.isArray(data.historial_cinturones)
      ? data.historial_cinturones.map((c: any) => ({ cinturon: c.cinturon, fecha: c.fecha_obtencion }))
      : [],
    proximaGraduacion: data.proxima_graduacion
      ? {
          fecha: data.proxima_graduacion.fecha_graduacion,
          horario: data.proxima_graduacion.horario || '',
          turno: data.proxima_graduacion.turno || '',
          rango: data.proxima_graduacion.rango || '',
          cinturonDesde: data.proxima_graduacion.cinturon_desde || '',
          cinturonHasta: data.proxima_graduacion.cinturon_hasta || '',
        }
      : null,
    mensajes: Array.isArray(data.mensajes)
      ? data.mensajes.map((m: any) => ({
          id: m.id,
          tipo: m.tipo,
          asunto: m.asunto,
          contenido: m.contenido,
          fecha: m.fecha,
          leido: !!m.leido,
        }))
      : [],
    asistencias: Array.isArray(data.asistencias)
      ? data.asistencias.map((a: any) => ({
          fecha: a.fecha,
          estado: estadoAsistencia(a.asistio),
        }))
      : [],
    congelaciones: Array.isArray(data.congelaciones)
      ? data.congelaciones.map((c: any) => ({
          fechaInicio: c.fecha_inicio,
          fechaFin: c.fecha_fin || '',
          estado: c.estado || 'activo',
          dias: Number(c.dias) || 0,
        }))
      : [],
    codigoReferido: data.codigo_referido || null,
    saldoBonos: Number(data.saldo_bonos) || 0,
    elegibleLeadership: Boolean(data.elegible_leadership),
    elegibleFighter: Boolean(data.elegible_fighter),
    referidos: Array.isArray(data.referidos)
      ? data.referidos.map((r: any) => ({
          nombre: r.nombre_alumno || r.nombre || '',
          fecha: r.created_at || r.fecha || '',
          canjeado: !!r.canjeado,
        }))
      : [],
    torneos: Array.isArray(data.torneos)
      ? data.torneos.map((t: any) => ({
          id: Number(t.id),
          modalidad: t.modalidad ?? '',
          estado: t.estado ?? 'seleccionado',
          estadoPago: t.estado_pago ?? 'Pendiente',
          torneoNombre: t.torneo_nombre ?? '',
          tipo: t.tipo ?? 'regional',
          fecha: t.fecha ?? '',
          lugar: t.lugar ?? '',
          precio: Number(t.precio) || 0,
        }))
      : [],
    implementos: Array.isArray(data.implementos)
      ? data.implementos.map((imp: any) => ({
          id: Number(imp.id),
          categoria: imp.categoria ?? '',
          tipo: imp.tipo ?? '',
          talla: imp.talla ?? '',
          precio: Number(imp.precio) || 0,
          fechaAdquisicion: imp.fecha_adquisicion ?? '',
          observaciones: (imp.observaciones as string | null) ?? null,
          entregado: Boolean(imp.entregado),
        }))
      : [],
    congelamiento: {
      puede: Boolean(cong.puede),
      motivo: cong.motivo ?? null,
      topeDias: Number(cong.tope_dias) || 0,
      anticipacionMaxDias: Number(cong.anticipacion_max_dias) || 60,
      avisoMinDias: Number.isFinite(Number(cong.aviso_min_dias)) ? Number(cong.aviso_min_dias) : 7,
      solicitudes: Array.isArray(cong.solicitudes)
        ? cong.solicitudes.map((s: any) => ({
            id: Number(s.id),
            fechaInicio: s.fecha_inicio,
            fechaFin: s.fecha_fin,
            dias: Number(s.dias) || 0,
            motivo: s.motivo ?? null,
            estado: s.estado,
            respuesta: s.respuesta ?? null,
          }))
        : [],
    },
    horario: Array.isArray(data.horario?.lineas)
      ? data.horario.lineas.map((l: any) => ({
          clase: l.clase ?? null,
          dias: Array.isArray(l.dias) ? l.dias.map(Number) : [],
          horaInicio: l.hora_inicio || '',
          horaFin: l.hora_fin ?? null,
          pista: l.pista ?? null,
        }))
      : [],
    contrato: data.contrato?.url ? { url: data.contrato.url, firmadoAt: data.contrato.firmado_at || '' } : null,
  };
}

function calculateAge(birthDate: string): string {
  if (!birthDate) return '';
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age.toString();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debeElegirHijo, setDebeElegirHijo] = useState(false);
  const terminarEleccion = useCallback(() => setDebeElegirHijo(false), []);

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('amasToken');
    if (savedToken) {
      fetch(`${AUTH_API}/me`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then(r => {
          if (r.ok) return r.json();
          throw new Error('expired');
        })
        .then(data => {
          setToken(savedToken);
          setUser(transformProfile(data));
        })
        .catch(() => {
          localStorage.removeItem('amasToken');
          localStorage.removeItem('amasUserProfile');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  /** Guarda la sesión que devuelven login, crear contraseña y elegir hijo. */
  const guardarSesion = useCallback((data: any): LoginResult => {
    const userData = transformProfile({ ...data.perfil, hijos: data.hijos });
    localStorage.setItem('amasToken', data.token);
    localStorage.setItem('amasUserProfile', JSON.stringify(userData));
    setToken(data.token);
    setUser(userData);
    return { success: true, elegirHijo: Boolean(data.elegir_hijo), hijos: userData.hijos };
  }, []);

  const login = useCallback(async (dni: string, password: string): Promise<LoginResult> => {
    try {
      const res = await fetch(`${AUTH_API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Error de autenticación' };
      if (data.success && data.token) {
        setDebeElegirHijo(Boolean(data.elegir_hijo));
        return guardarSesion(data);
      }
      return { success: false, error: data.error || 'Error desconocido' };
    } catch {
      return { success: false, error: 'Error de conexión' };
    }
  }, [guardarSesion]);

  const elegirHijo = useCallback(async (alumnoId: number) => {
    const actual = token || localStorage.getItem('amasToken');
    if (!actual) return { success: false, error: 'Sesión vencida' };
    try {
      const res = await fetch(`${AUTH_API}/elegir-hijo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${actual}` },
        body: JSON.stringify({ alumno_id: alumnoId }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) return { success: false, error: data.error || 'No se pudo cambiar' };
      guardarSesion(data);
      return { success: true };
    } catch {
      return { success: false, error: 'Error de conexión' };
    }
  }, [token, guardarSesion]);

  const requestCode = useCallback(async (dni: string, proposito: PropositoCodigo = 'crear'): Promise<CodeResult> => {
    try {
      const res = await fetch(`${AUTH_API}/solicitar-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni, proposito }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      return { success: true, mensaje: data.mensaje };
    } catch {
      return { success: false, error: 'Error de conexión' };
    }
  }, []);

  const verifyCode = useCallback(async (dni: string, code: string) => {
    try {
      const res = await fetch(`${AUTH_API}/verificar-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni, code }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      return { success: true };
    } catch {
      return { success: false, error: 'Error de conexión' };
    }
  }, []);

  const setPassword = useCallback(async (dni: string, code: string, password: string, proposito: PropositoCodigo = 'crear'): Promise<LoginResult> => {
    try {
      // Sin el código del correo el API no escribe nada
      const ruta = proposito === 'recuperar' ? 'restablecer-password' : 'crear-password';
      const res = await fetch(`${AUTH_API}/${ruta}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni, code, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      if (data.success && data.token) {
        setDebeElegirHijo(Boolean(data.elegir_hijo));
        return guardarSesion(data);
      }
      return { success: false, error: data.error || 'Error desconocido' };
    } catch {
      return { success: false, error: 'Error de conexión' };
    }
  }, [guardarSesion]);

  const logout = useCallback(() => {
    localStorage.removeItem('amasToken');
    localStorage.removeItem('amasUserProfile');
    setDebeElegirHijo(false);
    setToken(null);
    setUser(null);
  }, []);

  const refreshUserData = useCallback(async () => {
    const savedToken = token || localStorage.getItem('amasToken');
    if (!savedToken) return;
    try {
      const res = await fetch(`${AUTH_API}/me`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const userData = transformProfile(data);
        localStorage.setItem('amasUserProfile', JSON.stringify(userData));
        setUser(userData);
      }
    } catch { /* silently fail */ }
  }, [token]);

  const isAuthenticated = !!token && user !== null;

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, requestCode, verifyCode, setPassword, elegirHijo, debeElegirHijo, terminarEleccion, logout, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
