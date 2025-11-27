import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FamiliaData {
  email: string;
  nombreFamilia: string;
  telefono: string;
  estudiante: string;
}

interface Matricula {
  programa: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
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
}

interface Notificacion {
  id: string;
  tipo: string;
  mensaje: string;
  fecha: string;
  leido: boolean;
}

interface UserData {
  familia: FamiliaData;
  matricula: Matricula;
  clases: Clase[];
  pagos: Pagos;
  notificaciones: Notificacion[];
}

interface AuthSession {
  token: string;
  expiresAt: string;
  data: UserData;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserData | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; requirePasswordChange?: boolean; message?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = 'https://pallium-n8n.s6hx3x.easypanel.host/webhook';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Verificar sesión al cargar
  useEffect(() => {
    const sessionData = localStorage.getItem('amasUserSession');
    if (sessionData) {
      try {
        const session: AuthSession = JSON.parse(sessionData);
        const expiresAt = new Date(session.expiresAt);
        const now = new Date();

        if (expiresAt > now) {
          // Sesión válida
          setIsAuthenticated(true);
          setUser(session.data);
          setToken(session.token);
        } else {
          // Sesión expirada
          localStorage.removeItem('amasUserSession');
        }
      } catch (error) {
        console.error('Error al cargar sesión:', error);
        localStorage.removeItem('amasUserSession');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login-usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.success) {
        // Verificar si requiere cambio de contraseña (primera vez)
        if (result.requirePasswordChange) {
          return {
            success: true,
            requirePasswordChange: true,
          };
        }

        // Login exitoso
        const session: AuthSession = {
          token: result.token,
          expiresAt: result.expiresAt,
          data: result.data,
        };

        localStorage.setItem('amasUserSession', JSON.stringify(session));
        setIsAuthenticated(true);
        setUser(result.data);
        setToken(result.token);

        return { success: true };
      } else {
        return {
          success: false,
          message: result.message || 'Error al iniciar sesión',
        };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        message: 'Error de conexión. Por favor, intenta nuevamente.',
      };
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/registro-usuario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.success) {
        return { success: true, message: 'Contraseña establecida correctamente' };
      } else {
        return {
          success: false,
          message: result.message || 'Error al establecer contraseña',
        };
      }
    } catch (error) {
      console.error('Error en registro:', error);
      return {
        success: false,
        message: 'Error de conexión. Por favor, intenta nuevamente.',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('amasUserSession');
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
  };

  const refreshUserData = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/refresh-usuarios`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        // Actualizar solo los datos, mantener el token actual
        const sessionData = localStorage.getItem('amasUserSession');
        if (sessionData) {
          const session: AuthSession = JSON.parse(sessionData);
          session.data = result.data;
          localStorage.setItem('amasUserSession', JSON.stringify(session));
          setUser(result.data);
        }
      }
    } catch (error) {
      console.error('Error al refrescar datos:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        token,
        login,
        register,
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
