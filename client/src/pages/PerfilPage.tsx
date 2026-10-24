import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Badge, Input } from '../components/ui';
import {
  User,
  Settings,
  Calendar,
  Mail,
  Video,
  Share2,
  CheckCircle2,
  Sun,
  Moon,
  ExternalLink,
  Shield,
  Award,
  TrendingUp,
  FileText
} from 'lucide-react';

export const PerfilPage: React.FC = () => {
  const { user, darkMode, toggleDarkMode } = useAuth();

  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(true);
  const [googleClassroomConnected, setGoogleClassroomConnected] = useState(false);
  const [zoomLink, setZoomLink] = useState('https://zoom.us/j/9812938472?pwd=asap');
  const [teamsLink, setTeamsLink] = useState('https://teams.microsoft.com/l/meetup-join/asap-morales');

  const [guardadoMsg, setGuardadoMsg] = useState(false);

  const handleGuardarEnlaces = (e: React.FormEvent) => {
    e.preventDefault();
    setGuardadoMsg(true);
    setTimeout(() => setGuardadoMsg(false), 2500);
  };

  return (
    <div className="space-y-6 text-left max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#176087] dark:text-[#9ED8ED]" />
            Perfil y Configuración del Docente
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Administra tus credenciales institucionales, integraciones y preferencias del sistema.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Tarjeta de Perfil */}
        <Card className="p-6 space-y-5 text-center">
          <div className="relative inline-block mx-auto">
            <div className="w-20 h-20 rounded-full bg-[#176087] text-white flex items-center justify-center font-bold text-2xl shadow-xl ring-4 ring-[#9ED8ED]/40 mx-auto">
              AM
            </div>
            <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0A2239]" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {user?.nombre || 'Lic. Andrés Morales'}
            </h3>
            <p className="text-xs text-[#176087] dark:text-[#9ED8ED] font-semibold mt-0.5">
              Docente de Lengua y Literatura
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {user?.institucion || 'Colegio Fiscal Vicente Rocafuerte'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#071727] text-xs text-left space-y-1.5 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-400">Distrito:</span>
              <span className="font-medium">{user?.distrito || '09D03 Guayaquil'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Provincia:</span>
              <span className="font-medium">Guayas</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Alumnos:</span>
              <span className="font-mono font-bold text-[#176087] dark:text-[#9ED8ED]">60</span>
            </div>
          </div>

          {/* Modo Oscuro Toggle */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="text-left">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Tema de Interfaz
              </span>
              <span className="text-[10px] text-slate-400">
                {darkMode ? 'Modo Oscuro (Prussian Blue)' : 'Modo Claro'}
              </span>
            </div>

            <Button size="sm" variant="outline" onClick={toggleDarkMode}>
              {darkMode ? <Sun className="w-4 h-4 mr-1 text-amber-400" /> : <Moon className="w-4 h-4 mr-1" />}
              {darkMode ? 'Claro' : 'Oscuro'}
            </Button>
          </div>
        </Card>

        {/* Columna Derecha: Integraciones y Autoevaluación */}
        <div className="lg:col-span-2 space-y-6">
          {/* Autoevaluación Docente */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#176087] dark:text-[#9ED8ED]" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Desempeño y Autoevaluación Docente
                </h4>
              </div>
              <Badge variant="success">Excelente</Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#071727] border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 block">Clases Ejecutadas</span>
                <span className="text-xl font-bold font-mono text-emerald-600 mt-1 block">92%</span>
                <span className="text-[10px] text-slate-500">vs Planificadas</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#071727] border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 block">Calificadas a Tiempo</span>
                <span className="text-xl font-bold font-mono text-[#176087] dark:text-[#9ED8ED] mt-1 block">88%</span>
                <span className="text-[10px] text-slate-500">Cierre de parcial</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#071727] border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 block">Retención Asistencia</span>
                <span className="text-xl font-bold font-mono text-indigo-600 mt-1 block">94.2%</span>
                <span className="text-[10px] text-slate-500">Promedio global</span>
              </div>
            </div>
          </Card>

          {/* Integraciones Externas */}
          <Card className="p-6 space-y-4">
            <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#176087] dark:text-[#9ED8ED]" />
                Integraciones del Ecosistema Escolar
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Conecta tus servicios en la nube para sincronizar eventos y clases virtuales.
              </p>
            </div>

            <div className="space-y-3">
              {/* Google Calendar */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                    GC
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Google Calendar
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {googleCalendarConnected ? 'Sincronizado con cuenta institucional' : 'No conectado'}
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={googleCalendarConnected ? 'outline' : 'primary'}
                  onClick={() => setGoogleCalendarConnected(!googleCalendarConnected)}
                >
                  {googleCalendarConnected ? 'Desconectar' : 'Conectar'}
                </Button>
              </div>

              {/* Google Classroom */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    CR
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Google Classroom
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Importar nóminas y sincronizar tareas
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={googleClassroomConnected ? 'outline' : 'primary'}
                  onClick={() => setGoogleClassroomConnected(!googleClassroomConnected)}
                >
                  {googleClassroomConnected ? 'Conectado ✓' : 'Conectar'}
                </Button>
              </div>

              {/* Notion (Próximamente) */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 flex items-center justify-center font-bold text-xs">
                    N
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Notion Workspace
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Exportar notas y planificaciones a Notion (Fase 2)
                    </span>
                  </div>
                </div>
                <Badge variant="outline">Próximamente</Badge>
              </div>
            </div>

            {/* Enlaces de Clases Virtuales (Zoom / Teams) */}
            <form onSubmit={handleGuardarEnlaces} className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Salas de Clases Virtuales
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <Input
                  label="Enlace de Zoom"
                  value={zoomLink}
                  onChange={(e) => setZoomLink(e.target.value)}
                  placeholder="https://zoom.us/j/..."
                />
                <Input
                  label="Enlace de Microsoft Teams"
                  value={teamsLink}
                  onChange={(e) => setTeamsLink(e.target.value)}
                  placeholder="https://teams.microsoft.com/..."
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                {guardadoMsg ? (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Enlaces guardados correctamente
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Se utilizarán para el botón de acceso rápido en el panel.
                  </span>
                )}
                <Button type="submit" size="sm" variant="primary">
                  Guardar Enlaces
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PerfilPage;
