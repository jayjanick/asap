import React, { createContext, useContext, useState, useEffect } from 'react';
import { DOCENTE_ACTUAL } from '../data/mockData';

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
  login: (email?: string, password?: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (data: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    // Inicializar con Andrés Morales para permitir navegación inmediata del prototipo
    return DOCENTE_ACTUAL;
  });
  const [token, setToken] = useState<string | null>('demo-jwt-token-asap');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('asap_theme') === 'dark';
    }
    return false;
  });

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
        return true;
      }
    } catch (err) {
      console.warn('API local offline, usando fallback de sesión:', err);
    }
    // Fallback instantáneo
    setUser({ ...DOCENTE_ACTUAL, email: email || DOCENTE_ACTUAL.email });
    setToken('fallback-token');
    return true;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const updateUser = (data: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        token,
        darkMode,
        toggleDarkMode,
        login,
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
