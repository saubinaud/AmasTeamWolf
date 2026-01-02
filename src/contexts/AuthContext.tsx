import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useLogto } from '@logto/react';

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
  estado: string;
  categoria: string;
  fechaInscripcion: string;
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
}

interface MensajeData {
  fecha: string;
  contenido: string;
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
  matricula: Matricula;
  clases: Clase[];
  pagos: Pagos;
  notificaciones: Notificacion[];
  estudiante: EstudianteData;
  mensaje: MensajeData;
  asistencias: Asistencia[];
  congelaciones: Congelacion[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserData | null;
  authId: string | null;
  loadUserProfile: (authId: string, email?: string) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API URL for profile fetching (n8n webhook)
const PROFILE_API_URL = 'https://pallium-n8n.s6hx3x.easypanel.host/webhook/perfil-usuario';

// Session timeout in milliseconds (12 hours)
const SESSION_TIMEOUT_MS = 12 * 60 * 60 * 1000;

// Transform database response to UserData format
function transformDatabaseProfile(data: any): UserData {
  // Handle the response from PostgreSQL view or query
  return {
    familia: {
      email: data.apoderado_correo || data.correo || '',
      nombreFamilia: data.apoderado_nombre || data.nombre_padre || 'Familia',
      telefono: data.apoderado_telefono || data.telefono || 'No registrado',
      estudiante: data.alumno_nombre || data.nombre_alumno || 'Estudiante',
      dniFamilia: String(data.apoderado_dni || data.dni_padre || ''),
      dniEstudiante: String(data.alumno_dni || data.dni_alumno || ''),
      direccion: data.direccion || '',
    },
    matricula: {
      programa: data.programa || 'Sin programa activo',
      fechaInicio: data.fecha_inicio || '',
      fechaFin: data.fecha_fin || '',
      estado: data.estado || 'activa',
      categoria: data.categoria || '',
      fechaInscripcion: data.fecha_inscripcion || '',
    },
    clases: data.dias_tentativos
      ? [{ horario: data.dias_tentativos }]
      : [],
    pagos: {
      proximoPago: {
        fecha: data.fecha_fin || '',
        monto: Number(data.precio_pagado) || 0,
        estado: 'pendiente',
      },
      ultimoPago: undefined,
      precioPrograma: Number(data.precio_programa) || 0,
      precioAPagar: Number(data.precio_pagado) || 0,
      descuento: Number(data.descuento) || 0,
      estadoPago: data.estado_pago || 'Pendiente',
    },
    notificaciones: [],
    estudiante: {
      nombre: data.alumno_nombre || '',
      dni: String(data.alumno_dni || ''),
      fechaNacimiento: data.fecha_nacimiento || '',
      edad: calculateAge(data.fecha_nacimiento) || (data.edad ? String(data.edad) : ''),
      categoria: data.categoria || '',
      tallaUniforme: data.talla_uniforme || 'S',
      tallaPolo: data.talla_polo || 'S',
    },
    mensaje: {
      fecha: data.mensaje_fecha || '',
      contenido: data.mensaje_contenido || '',
    },
    asistencias: Array.isArray(data.asistencias) ? data.asistencias : [],
    congelaciones: Array.isArray(data.congelaciones) ? data.congelaciones : [],
  };
}

function calculateAge(birthDate: string): string {
  if (!birthDate) return '';
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age.toString();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [authId, setAuthId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get Logto authentication state
  const { isAuthenticated: logtoAuthenticated, getIdTokenClaims } = useLogto();

  // Check for stored profile and session expiry on mount
  useEffect(() => {
    const storedProfile = localStorage.getItem('amasUserProfile');
    const storedAuthId = localStorage.getItem('amasAuthId');
    const sessionTimestamp = localStorage.getItem('amasSessionTimestamp');

    // Check if session has expired (12 hours)
    if (sessionTimestamp) {
      const sessionAge = Date.now() - parseInt(sessionTimestamp, 10);
      if (sessionAge > SESSION_TIMEOUT_MS) {
        console.log('Session expired, clearing stored data');
        localStorage.removeItem('amasUserProfile');
        localStorage.removeItem('amasAuthId');
        localStorage.removeItem('amasSessionTimestamp');
        setIsLoading(false);
        return;
      }
    }

    if (storedProfile && storedAuthId) {
      try {
        const profile = JSON.parse(storedProfile);
        // Ensure arrays exist (migration for old stored data)
        if (!profile.asistencias) profile.asistencias = [];
        if (!profile.congelaciones) profile.congelaciones = [];
        setUser(profile);
        setAuthId(storedAuthId);
      } catch (error) {
        console.error('Error loading stored profile:', error);
        localStorage.removeItem('amasUserProfile');
        localStorage.removeItem('amasAuthId');
        localStorage.removeItem('amasSessionTimestamp');
      }
    }

    setIsLoading(false);
  }, []);

  // Load user profile from PostgreSQL via API
  const loadUserProfile = useCallback(async (newAuthId: string, email?: string) => {
    setIsLoading(true);

    try {
      const response = await fetch(PROFILE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_id: newAuthId,
          email: email
        }),
      });

      if (!response.ok) {
        throw new Error(`Error fetching profile: ${response.status}`);
      }

      const result = await response.json();

      // Handle array response (from n8n/SQL)
      const data = Array.isArray(result) && result.length > 0 ? result[0] : result;

      if (data && (data.apoderado_nombre || data.alumno_nombre || data.nombre_padre)) {
        const transformedUser = transformDatabaseProfile(data);

        // Store in localStorage with session timestamp
        localStorage.setItem('amasUserProfile', JSON.stringify(transformedUser));
        localStorage.setItem('amasAuthId', newAuthId);
        localStorage.setItem('amasSessionTimestamp', Date.now().toString());

        setUser(transformedUser);
        setAuthId(newAuthId);

        // Update auth_id in database if it was matched by email
        if (data.auth_id !== newAuthId) {
          // Send update to link the Logto auth_id to the apoderado
          await fetch(PROFILE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'link_auth_id',
              auth_id: newAuthId,
              email: email,
              apoderado_id: data.apoderado_id || data.id
            }),
          }).catch(err => console.error('Error linking auth_id:', err));
        }
      } else {
        console.warn('No profile found for user');
        // Create minimal user data
        setUser({
          familia: {
            email: email || '',
            nombreFamilia: 'Usuario',
            telefono: '',
            estudiante: '',
            dniFamilia: '',
            dniEstudiante: '',
            direccion: '',
          },
          matricula: { programa: '', fechaInicio: '', fechaFin: '', estado: '', categoria: '', fechaInscripcion: '' },
          clases: [],
          pagos: { proximoPago: { fecha: '', monto: 0, estado: '' }, precioPrograma: 0, precioAPagar: 0, descuento: 0, estadoPago: '' },
          notificaciones: [],
          estudiante: { nombre: '', dni: '', fechaNacimiento: '', edad: '', categoria: '', tallaUniforme: '', tallaPolo: '' },
          mensaje: { fecha: '', contenido: '' },
          asistencias: [],
          congelaciones: [],
        });
        setAuthId(newAuthId);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('amasUserProfile');
    localStorage.removeItem('amasAuthId');
    localStorage.removeItem('amasSessionTimestamp');
    setUser(null);
    setAuthId(null);
  }, []);

  const refreshUserData = useCallback(async () => {
    if (authId && user?.familia?.email) {
      await loadUserProfile(authId, user.familia.email);
    }
  }, [authId, user, loadUserProfile]);

  // Sync with Logto auth state - only on mount
  useEffect(() => {
    const syncWithLogto = async () => {
      if (logtoAuthenticated && !authId && !user) {
        try {
          const claims = await getIdTokenClaims();
          if (claims?.sub) {
            await loadUserProfile(claims.sub, claims.email as string);
          }
        } catch (error) {
          console.error('Error syncing with Logto:', error);
        }
      }
    };

    syncWithLogto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logtoAuthenticated]); // Only run when auth state changes

  const isAuthenticated = logtoAuthenticated && user !== null;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        authId,
        loadUserProfile,
        logout,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
