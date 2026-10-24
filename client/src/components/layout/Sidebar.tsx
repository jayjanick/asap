import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  BookOpenCheck,
  GraduationCap,
  Briefcase,
  Settings,
  Calendar,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Panel Diario', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Asistencia', path: '/asistencia', icon: UserCheck },
    { name: 'Planificación', path: '/planificacion', icon: BookOpenCheck },
    { name: 'Calificaciones', path: '/calificaciones', icon: GraduationCap },
    { name: 'Workspace', path: '/workspace', icon: Briefcase },
    { name: 'Perfil & Ajustes', path: '/perfil', icon: Settings }
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-[#0A2239] text-white">
      {/* Top: Logo and Brand */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <Link to="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            {/* Logo de asap con ancho máximo de 120px como especifica el prompt */}
            <div className="flex items-center justify-center">
              <img
                src="/assets/aistudio/asap__3__5eb0a88f.png"
                alt="asap logo"
                className="max-w-[110px] h-auto object-contain"
                onError={(e) => {
                  // Fallback limpio si la imagen no carga
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <span className="hidden text-2xl font-black tracking-tight text-[#9ED8ED] select-none">
                asap
              </span>
            </div>
            {!collapsed && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#176087] text-[#9ED8ED] font-semibold uppercase tracking-wider">
                Docente
              </span>
            )}
          </Link>

          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Institution Badge */}
        {!collapsed && (
          <div className="px-4 py-3 mx-2 my-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Institución
            </span>
            <span className="text-xs font-medium text-slate-200 truncate block mt-0.5">
              {user?.institucion || 'Colegio Fiscal Vicente Rocafuerte'}
            </span>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="px-2 mt-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 select-none group ${
                  isActive
                    ? 'bg-[#176087] text-white shadow-[0_2px_10px_rgba(23,96,135,0.30)]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
                title={collapsed ? item.name : undefined}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${
                    isActive ? 'text-[#9ED8ED]' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom section: Landing Link & Logout */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        <Link
          to="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          title="Ver Landing Page Corporativa"
        >
          <ExternalLink className="w-4 h-4 text-[#9ED8ED] shrink-0" />
          {!collapsed && <span>Portal Corporativo asap</span>}
        </Link>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors cursor-pointer"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block shrink-0 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className={`fixed top-0 bottom-0 left-0 z-30 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        }`}>
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#0A2239]/70 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
