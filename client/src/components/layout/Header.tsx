import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  Calendar,
  School,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { WeeklyScheduleModal } from '../calendar/WeeklyScheduleModal';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const {
    user,
    darkMode,
    toggleDarkMode,
    institucionActiva,
    instituciones,
    setInstitucionActiva
  } = useAuth();
  const navigate = useNavigate();

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [instDropdownOpen, setInstDropdownOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const instRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (instRef.current && !instRef.current.contains(e.target as Node)) {
        setInstDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  interface NotificationItem {
    id: string;
    titulo: string;
    detalle: string;
    href: string;
    tiempo: string;
    urgente?: boolean;
  }
  const notifications: NotificationItem[] = [];

  const handleNotificationClick = (href: string) => {
    setNotificationsOpen(false);
    navigate(href);
  };

  const fechaFormateada = new Date().toLocaleDateString('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <>
      <header className="h-16 px-4 sm:px-6 bg-white/95 dark:bg-[#0A2239]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between sticky top-0 z-20">
        {/* Left: Mobile hamburger + Greeting + Institution Switcher */}
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
              <span>Buenos días, {user?.nombre?.split(' ')[1] || user?.nombre?.split(' ')[0] || 'Docente'}</span>
              <span className="hidden sm:inline text-[#176087] dark:text-[#9ED8ED]">👋</span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize hidden sm:block">
              {fechaFormateada}
            </p>
          </div>

          {/* Selector de Institución */}
          <div className="relative hidden xl:block ml-4" ref={instRef}>
            <button
              onClick={() => setInstDropdownOpen(!instDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <School className="w-3.5 h-3.5 text-[#176087] dark:text-[#9ED8ED]" />
              <span className="max-w-[200px] truncate">{institucionActiva?.nombre}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {instDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-[#0A2239] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 z-50">
                <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 block">
                  Cambiar Institución Activa
                </span>
                <div className="space-y-1 mt-1">
                  {instituciones.map((inst) => (
                    <button
                      key={inst.id}
                      onClick={() => {
                        setInstitucionActiva(inst);
                        setInstDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        institucionActiva?.id === inst.id
                          ? 'bg-[#176087]/15 text-[#176087] dark:text-[#9ED8ED] font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <p className="truncate">{inst.nombre}</p>
                        <p className="text-[10px] text-slate-400 font-normal">Jornada {inst.jornada}</p>
                      </div>
                      {institucionActiva?.id === inst.id && (
                        <CheckCircle2 className="w-4 h-4 text-[#176087] dark:text-[#9ED8ED] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions and Notifications */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Horario Semanal Button */}
          <button
            onClick={() => setScheduleOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-[#9ED8ED]/30 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-[#176087] dark:text-[#9ED8ED]" />
            <span>Horario</span>
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
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Notificaciones"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#0A2239]" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#0A2239] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Centro de Notificaciones</span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {notifications.length} nuevas
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 my-2 max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No tienes notificaciones pendientes
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n.href)}
                        className="py-2.5 px-2 -mx-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors space-y-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            {n.urgente && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />}
                            {n.titulo}
                          </span>
                          <span className="text-[10px] text-slate-400">{n.tiempo}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {n.detalle}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  <button
                    onClick={() => setNotificationsOpen(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modal de Horario */}
      <WeeklyScheduleModal isOpen={scheduleOpen} onClose={() => setScheduleOpen(false)} />
    </>
  );
};
