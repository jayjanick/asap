import React, { createContext, useContext, useState, useEffect } from 'react';

export interface InstitucionInfo {
  id: string;
  nombre: string;
  codigoAmie: string;
  distrito: string;
  rol: string;
  jornada: string;
  principal: boolean;
}

export interface UserProfile {
  id: string;
  nombre: string;
  titulo?: string;
  email: string;
  rol: string;
  institucion: string;
  distrito?: string;
  provincia?: string;
  canton?: string;
  materias: string[];
  avatar?: string;
  totalAlumnos?: number;
  asistenciaPromedioGeneral?: number;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  token: string | null;
  authError: string | null;
  clearAuthError: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  institucionActiva: InstitucionInfo | null;
  instituciones: InstitucionInfo[];
  setInstitucionActiva: (inst: InstitucionInfo | null) => void;
  login: (email?: string, password?: string) => Promise<boolean>;
  loginWithGoogle: (credential?: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (data: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Problema 1: El token inicial debe ser null si no hay nada en localStorage
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('asap_token');
      // Depurar tokens demo residuales de versiones anteriores
      if (stored === 'demo-jwt-token-asap' || stored === 'asap-demo-token' || stored === 'asap-google-token') {
        localStorage.removeItem('asap_token');
        localStorage.removeItem('asap_user');
        return null;
      }
      return stored || null;
    }
    return null;
  });

  // Problema 2: El usuario inicial debe ser null (solo se carga si hay token guardado)
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('asap_token');
      if (savedToken && !savedToken.includes('demo') && !savedToken.includes('google-token')) {
        const saved = localStorage.getItem('asap_user');
        if (saved) {
          try {
            return JSON.parse(saved);
          } catch (e) {}
        }
      }
    }
    return null;
  });

  const [authError, setAuthError] = useState<string | null>(null);
  const [instituciones, setInstituciones] = useState<InstitucionInfo[]>([]);
  const [institucionActiva, setInstitucionActiva] = useState<InstitucionInfo | null>(null);

  // Sincronizar instituciones desde el objeto user cargado desde la API
  useEffect(() => {
    if (user && user.institucion) {
      const inst: InstitucionInfo = {
        id: `inst-${user.id || '1'}`,
        nombre: user.institucion,
        codigoAmie: '09H' + (user.id?.slice(-5) || '01234'),
        distrito: user.distrito || 'Distrito Educativo',
        rol: user.rol || 'Docente Titular',
        jornada: 'Matutina',
        principal: true
      };
      setInstituciones([inst]);
      setInstitucionActiva(inst);
    } else {
      setInstituciones([]);
      setInstitucionActiva(null);
    }
  }, [user]);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('asap_theme') === 'dark';
    }
    return false;
  });

  const clearAuthError = () => setAuthError(null);

  // Revalidar sesión al cargar
  useEffect(() => {
    const savedToken = localStorage.getItem('asap_token');
    if (savedToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` }
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && data?.user) {
            setUser(data.user);
            localStorage.setItem('asap_user', JSON.stringify(data.user));
          } else {
            // Token inválido o expirado
            setUser(null);
            setToken(null);
            localStorage.removeItem('asap_token');
            localStorage.removeItem('asap_user');
          }
        })
        .catch(() => {
          // Error al contactar backend: no inventar datos de mock
        });
    } else {
      setUser(null);
      localStorage.removeItem('asap_user');
    }
  }, []);

  // Sincronizar dark mode en el DOM
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('asap_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('asap_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Problema 3: Login real sin fallbacks que siempre autentiquen
  const login = async (email?: string, password?: string): Promise<boolean> => {
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.success && data?.token) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('asap_token', data.token);
        localStorage.setItem('asap_user', JSON.stringify(data.user));
        return true;
      }

      const errMsg = data?.error || 'Credenciales incorrectas';
      setAuthError(errMsg);
      return false;
    } catch (err: any) {
      console.error('Error de conexión durante el login:', err);
      setAuthError('No se pudo conectar con el servidor. Verifica tu conexión.');
      return false;
    }
  };

  const loginWithGoogle = async (credential?: string): Promise<boolean> => {
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.success && data?.token) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('asap_token', data.token);
        localStorage.setItem('asap_user', JSON.stringify(data.user));
        return true;
      }

      const errMsg = data?.error || 'Error al autenticar con Google';
      setAuthError(errMsg);
      return false;
    } catch (err: any) {
      console.error('Error durante autenticación Google:', err);
      setAuthError('No se pudo conectar con el servicio de autenticación.');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setAuthError(null);
    localStorage.removeItem('asap_token');
    localStorage.removeItem('asap_user');
  };

  const updateUser = (data: Partial<UserProfile>) => {
    setUser((prev) => {
      const updated = prev ? { ...prev, ...data } : null;
      if (updated) {
        localStorage.setItem('asap_user', JSON.stringify(updated));
      }
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user && token),
        token,
        authError,
        clearAuthError,
        darkMode,
        toggleDarkMode,
        institucionActiva,
        instituciones,
        setInstitucionActiva,
        login,
        loginWithGoogle,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
