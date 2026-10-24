import React from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  BookOpenCheck,
  GraduationCap,
  Briefcase,
  Settings,
  HelpCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  Zap
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
  const { user, logout, institucionActiva } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Panel Diario', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Asistencia', path: '/asistencia', icon: UserCheck },
    { name: 'Planificación', path: '/planificacion', icon: BookOpenCheck },
    { name: 'Calificaciones', path: '/calificaciones', icon: GraduationCap },
    { name: 'Workspace', path: '/workspace', icon: Briefcase },
    { name: 'Perfil & Ajustes', path: '/perfil', icon: Settings },
    { name: 'Soporte', path: '/perfil', icon: HelpCircle }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-[#0A2239] text-white">
      {/* Top: Logo and Brand */}
      <div>
        <div className={`h-16 flex items-center border-b border-slate-800 ${
          collapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}>
          <Link to="/dashboard" className="flex items-center gap-2 overflow-hidden">
            {collapsed ? (
              <div className="w-10 h-10 rounded-xl bg-[#176087] flex items-center justify-center text-white font-black text-xl shadow-md border border-[#9ED8ED]/30">
                <span className="text-[#9ED8ED] lowercase">a</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <img
                  src="/assets/aistudio/asap__3__5eb0a88f.png"
                  alt="asap logo"
                  className="max-w-[110px] h-auto object-contain"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <span className="hidden text-2xl font-black tracking-tight text-[#9ED8ED] select-none">
                  asap
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#176087] text-[#9ED8ED] font-semibold uppercase tracking-wider">
                  Docente
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Toggle or Mobile Close Button */}
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              title="Cerrar menú"
            >
              <X className="w-5 h-5 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Institution Badge */}
        {!collapsed && (
          <div className="px-4 py-3 mx-2 my-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Institución Activa
            </span>
            <span className="text-xs font-medium text-slate-200 truncate block mt-0.5" title={institucionActiva?.nombre}>
              {institucionActiva?.nombre || user?.institucion || 'U.E. Fisco-Misional Democracia'}
            </span>
          </div>
        )}

        {/* Navigation Links */}
        <nav className={`mt-3 space-y-1 ${collapsed ? 'px-1.5' : 'px-2'}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onCloseMobile}
                className={`flex items-center rounded-xl text-sm font-medium transition-all duration-200 select-none group ${
                  collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                } ${
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
      <div className={`border-t border-slate-800 space-y-1.5 ${collapsed ? 'p-2' : 'p-3'}`}>
        <Link
          to="/"
          className={`flex items-center rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors ${
            collapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2'
          }`}
          title="Ver Landing Page Corporativa"
        >
          <ExternalLink className="w-4 h-4 text-[#9ED8ED] shrink-0" />
          {!collapsed && <span>Portal Corporativo</span>}
        </Link>

        <button
          onClick={handleLogout}
          className={`w-full flex items-center rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors cursor-pointer ${
            collapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2'
          }`}
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
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div
          className={`fixed top-0 bottom-0 left-0 z-30 transition-all duration-300 ${
            collapsed ? 'w-16' : 'w-64'
          }`}
        >
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
