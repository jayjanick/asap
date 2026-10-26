import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AsistenciaPage from './pages/AsistenciaPage';
import TomarAsistenciaPage from './pages/TomarAsistenciaPage';
import PlanificacionPage from './pages/PlanificacionPage';
import CalendarioPlanificacionPage from './pages/CalendarioPlanificacionPage';
import CalificacionesPage from './pages/CalificacionesPage';
import WorkspacePage from './pages/WorkspacePage';
import PerfilPage from './pages/PerfilPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsuariosPage from './pages/admin/AdminUsuariosPage';
import AdminSistemaPage from './pages/admin/AdminSistemaPage';
import AdminLogsPage from './pages/admin/AdminLogsPage';
import AdminSeguridadPage from './pages/admin/AdminSeguridadPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('asap_admin_token');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return <Navigate to="/admin/login" replace />;
    }
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    if (payload.rol !== 'Admin') {
      return <Navigate to="/admin/login" replace />;
    }
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('asap_admin_token');
      localStorage.removeItem('asap_admin_user');
      return <Navigate to="/admin/login" replace />;
    }
  } catch {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Rutas Protegidas del Administrador */}
      <Route
        path="/admin"
        element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="usuarios" element={<AdminUsuariosPage />} />
        <Route path="sistema" element={<AdminSistemaPage />} />
        <Route path="logs" element={<AdminLogsPage />} />
        <Route path="seguridad" element={<AdminSeguridadPage />} />
      </Route>

      {/* Rutas Protegidas del Docente con Layout Base */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/asistencia" element={<AsistenciaPage />} />
        <Route path="/asistencia/:cursoId" element={<TomarAsistenciaPage />} />
        <Route path="/planificacion" element={<PlanificacionPage />} />
        <Route path="/planificacion/calendario" element={<CalendarioPlanificacionPage />} />
        <Route path="/calificaciones" element={<CalificacionesPage />} />
        <Route path="/calificaciones/:cursoId" element={<CalificacionesPage />} />
        <Route path="/workspace" element={<WorkspacePage />} />
        <Route path="/perfil" element={<PerfilPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;

