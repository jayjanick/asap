import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  Calendar,
  Sparkles,
  School,
  ChevronDown,
  User,
  Settings,
  HelpCircle,
  LogOut,
  ExternalLink,
  BookOpen,
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
    logout,
    institucionActiva,
    instituciones,
    setInstitucionActiva
  } = useAuth();
  const navigate = useNavigate();

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [instDropdownOpen, setInstDropdownOpen] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const instRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
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

  const notifications = [
    {
      id: 'notif-1',
      titulo: 'Actividades por calificar',
      detalle: '5 tareas pendientes en 8vo A de Lengua y Literatura.',
      href: '/calificaciones',
      tiempo: 'Hace 20 min',
      urgente: true
    },
    {
      id: 'notif-2',
      titulo: 'Asistencia matutina pendiente',
      detalle: 'No has registrado la asistencia diaria de 9no B.',
      href: '/asistencia',
      tiempo: 'Hace 45 min',
      urgente: true
    },
    {
      id: 'notif-3',
      titulo: 'Planificación validada con IA',
      detalle: 'Microplanificación PUD del Bloque 2 lista para descarga.',
      href: '/planificacion',
      tiempo: 'Ayer',
      urgente: false
    }
  ];

  const handleNotificationClick = (href: string) => {
    setNotificationsOpen(false);
    navigate(href);
  };

  const handleLogout = () => {
    logout();
    setProfileDropdownOpen(false);
    navigate('/login');
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

          {/* Selector de Institución (P3.8) */}
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
                        <p className="text-[10px] text-slate-400 font-normal">{inst.distrito}</p>
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

        {/* Right: Actions, Notifications and User Profile Dropdown */}
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

          {/* Notification Center (P2.5) */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Notificaciones"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#0A2239]" />
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#0A2239] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Centro de Notificaciones</span>
                  <span className="text-[10px] text-[#176087] dark:text-[#9ED8ED] font-semibold cursor-pointer hover:underline">
                    3 nuevas
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 my-2 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
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
                  ))}
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

          {/* User Profile Dropdown (P3.6) */}
          <div className="relative pl-2 border-l border-slate-200 dark:border-slate-800" ref={profileRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-full bg-[#176087] text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#9ED8ED]/40 shrink-0">
                {user?.nombre
                  ? user.nombre
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                  : 'AM'}
              </div>
              <div className="hidden lg:block">
                <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                  {user?.nombre || 'Andrés Morales'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate max-w-[140px]">
                  {institucionActiva?.nombre || user?.institucion}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#0A2239] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-left">
                <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user?.nombre || 'Andrés Morales'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {user?.email || 'andres.morales@uefdemocracia.edu.ec'}
                  </p>
                </div>

                <div className="py-1 space-y-0.5">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/perfil');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-[#176087] dark:text-[#9ED8ED]" />
                    <span>Editar perfil & Ajustes</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setShowHelpModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-[#176087] dark:text-[#9ED8ED]" />
                    <span>Soporte / Ayuda MINEDUC</span>
                  </button>

                  <button
                    onClick={toggleDarkMode}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
                      <span>Tema {darkMode ? 'Oscuro' : 'Claro'}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">{darkMode ? 'Activo' : 'Inactivo'}</span>
                  </button>
                </div>

                <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modal de Horario */}
      <WeeklyScheduleModal isOpen={scheduleOpen} onClose={() => setScheduleOpen(false)} />

      {/* Modal de Soporte / Ayuda (P3.6) */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A2239]/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#0A2239] rounded-2xl p-6 text-left border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#176087] dark:text-[#9ED8ED]" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Centro de Ayuda y Soporte asap
                </h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 my-4 text-xs text-slate-600 dark:text-slate-300">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  ¿Cómo registro la asistencia diaria y calculo faltas justificadas?
                </h4>
                <p className="leading-relaxed">
                  En el módulo de Asistencia, selecciona tu paralelo y haz clic en &quot;Tomar asistencia&quot;. Puedes alternar entre Presente (P), Atraso (A) o Falta (F). Si marcas Falta, activa la casilla de justificación médica o calamidad doméstica.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  ¿Cómo exporto las calificaciones a Excel (XLSX) o PDF oficial?
                </h4>
                <p className="leading-relaxed">
                  En el Libro de Calificaciones, usa los botones &quot;Exportar XLSX&quot; o &quot;Exportar CSV&quot;. Para actas quimestrales, presiona &quot;Generar Informe Oficial&quot; para obtener un documento validado por IA listo para imprimir.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  Canales de Soporte Técnico
                </h4>
                <p className="leading-relaxed">
                  Mesa de Ayuda Distrital: <span className="font-semibold text-[#176087] dark:text-[#9ED8ED]">soporte@asap.ec</span> · Horario: Lunes a Viernes 07:00 - 18:00.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-[#176087] text-white rounded-lg text-xs font-semibold hover:bg-[#134d6d] cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
