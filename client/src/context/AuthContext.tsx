import React, { createContext, useContext, useState, useEffect } from 'react';
import { DOCENTE_ACTUAL } from '../data/mockData';

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
  titulo: string;
  email: string;
  rol: string;
  institucion: string;
  distrito: string;
  provincia: string;
  canton: string;
  materias: string[];
  avatar: string;
  totalAlumnos: number;
  asistenciaPromedioGeneral: number;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  token: string | null;
  darkMode: boolean;
  toggleDarkMode: () => void;
  institucionActiva: InstitucionInfo;
  instituciones: InstitucionInfo[];
  setInstitucionActiva: (inst: InstitucionInfo) => void;
  login: (email?: string, password?: string) => Promise<boolean>;
  loginWithGoogle: (credential?: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (data: Partial<UserProfile>) => void;
}

const INSTITUCIONES_MOCK: InstitucionInfo[] = [
  {
    id: 'inst-1',
    nombre: 'U.E. Fisco-Misional Democracia',
    codigoAmie: '09H01234',
    distrito: 'Distrito 09D04 · Guayaquil Centro',
    rol: 'Docente Titular',
    jornada: 'Matutina',
    principal: true
  },
  {
    id: 'inst-2',
    nombre: 'Colegio Experimental Guayaquil',
    codigoAmie: '09H05678',
    distrito: 'Distrito 09D03 · Guayaquil Norte',
    rol: 'Docente Complementario',
    jornada: 'Vespertina',
    principal: false
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('asap_token') || 'demo-jwt-token-asap';
    }
    return 'demo-jwt-token-asap';
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('asap_user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return DOCENTE_ACTUAL;
  });

  const [instituciones, setInstituciones] = useState<InstitucionInfo[]>(INSTITUCIONES_MOCK);
  const [institucionActiva, setInstitucionActiva] = useState<InstitucionInfo>(INSTITUCIONES_MOCK[0]);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('asap_theme') === 'dark';
    }
    return false;
  });

  // Revalidar sesión al cargar
  useEffect(() => {
    const savedToken = localStorage.getItem('asap_token');
    if (savedToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` }
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user) {
            setUser((prev) => ({ ...(prev || DOCENTE_ACTUAL), ...data.user }));
            localStorage.setItem('asap_user', JSON.stringify({ ...(user || DOCENTE_ACTUAL), ...data.user }));
          }
        })
        .catch(() => {});
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

  const login = async (email?: string, password?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('asap_token', data.token);
        localStorage.setItem('asap_user', JSON.stringify(data.user));
        return true;
      }
    } catch (err) {
      console.warn('Fallback local de login:', err);
    }

    const fallbackUser = { ...DOCENTE_ACTUAL, email: email || DOCENTE_ACTUAL.email };
    setUser(fallbackUser);
    setToken('asap-demo-token');
    localStorage.setItem('asap_token', 'asap-demo-token');
    localStorage.setItem('asap_user', JSON.stringify(fallbackUser));
    return true;
  };

  const loginWithGoogle = async (credential?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential,
          email: 'andres.morales@uefdemocracia.edu.ec',
          nombre: 'Lic. Andrés Morales'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('asap_token', data.token);
        localStorage.setItem('asap_user', JSON.stringify(data.user));
        return true;
      }
    } catch (err) {
      console.warn('Fallback Google login:', err);
    }

    const googleUser = {
      ...DOCENTE_ACTUAL,
      nombre: 'Lic. Andrés Morales (Google)'
    };
    setUser(googleUser);
    setToken('asap-google-token');
    localStorage.setItem('asap_token', 'asap-google-token');
    localStorage.setItem('asap_user', JSON.stringify(googleUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
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
        isAuthenticated: Boolean(user),
        token,
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
