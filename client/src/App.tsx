import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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
