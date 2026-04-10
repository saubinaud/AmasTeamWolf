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
}

interface Clase {
  horario: string;
}

interface PagoData {
  fecha: string;
  monto: number;
  estado: string;
}

interface Pagos {
  proximoPago: PagoData;
  ultimoPago?: PagoData;
  precioPrograma: number;
  precioAPagar: number;
  descuento: number;
  estadoPago: string;
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
  estado: 'asistio' | 'falta' | 'tardanza' | 'justificado';
}

interface Congelacion {
  fechaInicio: string;
  fechaFin: string;
  estado: 'activo' | 'finalizado';
  dias: number;
}

interface UserData {
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
}

interface LoginResult {
  success: boolean;
  error?: string;
  needsPassword?: boolean;
  hasEmail?: boolean;
}

interface CodeResult {
  success: boolean;
  emailHint?: string;
  error?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserData | null;
  login: (dni: string, password: string) => Promise<LoginResult>;
  requestCode: (dni: string) => Promise<CodeResult>;
  verifyCode: (dni: string, code: string) => Promise<{ success: boolean; error?: string }>;
  setPassword: (dni: string, code: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_API = `${API_BASE}/auth`;

function transformProfile(data: any): UserData {
  return {
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
    },
    clases: data.dias_tentativos ? [{ horario: data.dias_tentativos }] : [],
    pagos: {
      proximoPago: { fecha: data.fecha_fin || '', monto: Number(data.precio_pagado) || 0, estado: 'pendiente' },
      ultimoPago: undefined,
      precioPrograma: Number(data.precio_programa) || 0,
      precioAPagar: Number(data.precio_pagado) || 0,
      descuento: Number(data.descuento) || 0,
      estadoPago: data.estado_pago || 'Pendiente',
    },
    notificaciones: [],
    estudiante: {
      nombre: data.alumno_nombre || data.nombre_alumno || '',
      dni: String(data.alumno_dni || data.dni_alumno || ''),
      fechaNacimiento: data.fecha_nacimiento || '',
      edad: calculateAge(data.fecha_nacimiento),
      categoria: data.categoria || '',
      tallaUniforme: data.talla_uniforme || 'S',
      tallaPolo: data.talla_polo || 'S',
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
          estado: a.asistio === 'Sí' ? 'asistio' as const : 'falta' as const,
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

  const login = useCallback(async (dni: string, password: string): Promise<LoginResult> => {
    try {
      const res = await fetch(`${AUTH_API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni, password }),
      });
      const data = await res.json();

      if (data.needsPassword) {
        return { success: false, needsPassword: true, hasEmail: data.hasEmail };
      }
      if (!res.ok) {
        return { success: false, error: data.error || 'Error de autenticación' };
      }
      if (data.success && data.token) {
        const userData = transformProfile(data.perfil);
        localStorage.setItem('amasToken', data.token);
        localStorage.setItem('amasUserProfile', JSON.stringify(userData));
        setToken(data.token);
        setUser(userData);
        return { success: true };
      }
      return { success: false, error: data.error || 'Error desconocido' };
    } catch {
      return { success: false, error: 'Error de conexión' };
    }
  }, []);

  const requestCode = useCallback(async (dni: string): Promise<CodeResult> => {
    try {
      const res = await fetch(`${AUTH_API}/solicitar-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      return { success: true, emailHint: data.emailHint };
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

  const setPassword = useCallback(async (dni: string, _code: string, password: string): Promise<LoginResult> => {
    try {
      const res = await fetch(`${AUTH_API}/crear-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      if (data.success && data.token) {
        const userData = transformProfile(data.perfil);
        localStorage.setItem('amasToken', data.token);
        localStorage.setItem('amasUserProfile', JSON.stringify(userData));
        setToken(data.token);
        setUser(userData);
        return { success: true };
      }
      return { success: false, error: data.error || 'Error desconocido' };
    } catch {
      return { success: false, error: 'Error de conexión' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('amasToken');
    localStorage.removeItem('amasUserProfile');
    localStorage.removeItem('amasAuthId');
    localStorage.removeItem('amasSessionTimestamp');
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
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, requestCode, verifyCode, setPassword, logout, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
