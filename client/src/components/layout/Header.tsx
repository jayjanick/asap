import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  Calendar,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Clock,
  User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { WeeklyScheduleModal } from '../calendar/WeeklyScheduleModal';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { user, darkMode, toggleDarkMode } = useAuth();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notifications = [
    {
      id: 'notif-1',
      titulo: '5 actividades sin calificar',
      detalle: 'Deber 2: Micro-crónica en 8vo A vence hoy a las 18:00.',
      tipo: 'alerta',
      tiempo: 'Hace 20 min'
    },
    {
      id: 'notif-2',
      titulo: 'Asistencia pendiente',
      detalle: 'No has registrado la asistencia matutina de 9no B.',
      tipo: 'urgente',
      tiempo: 'Hace 1 hora'
    },
    {
      id: 'notif-3',
      titulo: 'Planificación generada con IA',
      detalle: 'La unidad 2 de Lengua y Literatura fue guardada.',
      tipo: 'info',
      tiempo: 'Ayer'
    }
  ];

  const fechaFormateada = new Date().toLocaleDateString('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <>
      <header className="h-16 px-4 sm:px-6 bg-white/90 dark:bg-[#0A2239]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between sticky top-0 z-20">
        {/* Left: Mobile hamburger + Greeting and Date */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Buenos días, {user?.nombre?.split(' ')[0] || 'Docente'}</span>
              <span className="hidden sm:inline text-[#176087] dark:text-[#9ED8ED]">👋</span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize hidden sm:block">
              {fechaFormateada}
            </p>
          </div>
        </div>

        {/* Right: Actions and User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Horario Semanal Button */}
          <button
            onClick={() => setScheduleOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-[#9ED8ED]/30 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-[#176087] dark:text-[#9ED8ED]" />
            <span>Horario semanal</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Notification Center */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Notificaciones"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#0A2239]" />
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#0A2239] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Centro de Notificaciones</span>
                  <span className="text-[10px] text-[#176087] font-semibold cursor-pointer hover:underline">
                    Marcar leídas
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 my-2 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="py-2.5 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {n.titulo}
                        </span>
                        <span className="text-[10px] text-slate-400">{n.tiempo}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {n.detalle}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  <button
                    onClick={() => setNotificationsOpen(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-[#176087] text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#9ED8ED]/40">
              {user?.nombre
                ? user.nombre
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                : 'AM'}
            </div>
            <div className="hidden lg:block text-left">
              <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                {user?.nombre || 'Andrés Morales'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                {user?.materias?.[0] || 'Lengua y Literatura'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Modal de Horario */}
      <WeeklyScheduleModal isOpen={scheduleOpen} onClose={() => setScheduleOpen(false)} />
    </>
  );
};
