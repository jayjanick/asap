import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Server,
  AlertTriangle,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { API_URL } from '../../config/api';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/sistema', label: 'Sistema', icon: Server },
  { to: '/admin/logs', label: 'Logs de Errores', icon: AlertTriangle },
  { to: '/admin/seguridad', label: 'Seguridad y Sesiones', icon: ShieldCheck }
];

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const rawAdminUser = localStorage.getItem('asap_admin_user');
  let adminEmail = 'admin@asap.edu.ec';
  let adminNombre = 'Administrador';
  if (rawAdminUser) {
    try {
      const parsed = JSON.parse(rawAdminUser);
      adminEmail = parsed.email || adminEmail;
      adminNombre = parsed.nombre || adminNombre;
    } catch {}
  }

  const handleLogout = async () => {
    const token = localStorage.getItem('asap_admin_token');
    if (token) {
      try {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {}
    }
    localStorage.removeItem('asap_admin_token');
    localStorage.removeItem('asap_admin_user');
    navigate('/admin/login', { replace: true });
  };

  const currentSection =
    NAV_ITEMS.find(item => location.pathname.startsWith(item.to))?.label || 'Panel de Administración';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex font-['DM_Sans',sans-serif]">
      {/* Sidebar independiente del docente */}
      <aside className="w-[250px] shrink-0 bg-[#0F172A] text-slate-200 flex flex-col justify-between border-r border-slate-800">
        <div>
          <div className="px-6 py-5 border-b border-slate-800/80">
            <span className="font-['Plus_Jakarta_Sans',sans-serif] text-lg font-bold tracking-tight text-white block whitespace-nowrap">
              ASAP Admin Console
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">
              Control Operativo y Seguridad
            </span>
          </div>

          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <div className="px-2">
            <p className="text-xs font-semibold text-white truncate">{adminNombre}</p>
            <p className="text-xs text-slate-400 truncate font-mono">{adminEmail}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Cerrar Sesión Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 px-8 flex items-center justify-between gap-8 shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Administración</span>
            <span className="text-slate-300">/</span>
            <span className="font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-slate-900 whitespace-nowrap">
              {currentSection}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>Rol: Administrador</span>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
