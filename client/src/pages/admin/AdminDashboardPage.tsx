import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Database, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { API_URL } from '../../config/api';

interface DashboardSummary {
  totalUsuarios: number;
  mongoEstado: string;
  mongoConectado: boolean;
  sesionesActivas: number;
  ultimosErrores: Array<{
    id: string;
    timestamp: string;
    method: string;
    route: string;
    message: string;
    statusCode: number;
  }>;
}

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = () => {
    const token = localStorage.getItem('asap_admin_token');
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API_URL}/api/admin/usuarios`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/api/admin/sistema`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/api/admin/logs`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/api/admin/sesiones`, { headers }).then(r => r.json())
    ])
      .then(([usuariosRes, sistemaRes, logsRes, sesionesRes]) => {
        setData({
          totalUsuarios: Array.isArray(usuariosRes?.usuarios) ? usuariosRes.usuarios.length : 0,
          mongoEstado: sistemaRes?.mongo?.estado || 'Desconocido',
          mongoConectado: Boolean(sistemaRes?.mongo?.conectado),
          sesionesActivas: Array.isArray(sesionesRes?.sesiones) ? sesionesRes.sesiones.length : 0,
          ultimosErrores: Array.isArray(logsRes?.logs) ? logsRes.logs.slice(0, 5) : []
        });
      })
      .catch(() => {
        setData(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl p-5 animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-white border border-slate-200 rounded-xl p-6 animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <p className="text-sm text-slate-600 mb-4">No hay datos disponibles del panel administrativo.</p>
        <button
          type="button"
          onClick={fetchDashboard}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 cursor-pointer"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold text-slate-900">
            Resumen Operativo
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Estado general de usuarios, base de datos, sesiones activas e incidentes recientes.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchDashboard}
          className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* 4 Tarjetas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-medium">Total Usuarios</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="font-mono tabular-nums text-3xl font-bold text-slate-900">
            {data.totalUsuarios}
          </p>
          <Link to="/admin/usuarios" className="text-xs text-slate-500 hover:text-slate-900 mt-2 inline-block">
            Ver directorio completo →
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-medium">MongoDB Status</span>
            <Database className="w-4 h-4 text-slate-400" />
          </div>
          <p
            className={`font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold ${
              data.mongoConectado ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {data.mongoEstado}
          </p>
          <Link to="/admin/sistema" className="text-xs text-slate-500 hover:text-slate-900 mt-2 inline-block">
            Ver diagnóstico de sistema →
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-medium">Sesiones Activas</span>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>
          <p className="font-mono tabular-nums text-3xl font-bold text-slate-900">
            {data.sesionesActivas}
          </p>
          <Link to="/admin/seguridad" className="text-xs text-slate-500 hover:text-slate-900 mt-2 inline-block">
            Gestionar tokens activos →
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-medium">Errores Recientes (Últ. 5)</span>
            <AlertTriangle className="w-4 h-4 text-slate-400" />
          </div>
          <p className="font-mono tabular-nums text-3xl font-bold text-slate-900">
            {data.ultimosErrores.length}
          </p>
          <Link to="/admin/logs" className="text-xs text-slate-500 hover:text-slate-900 mt-2 inline-block">
            Revisar registro de errores →
          </Link>
        </div>
      </div>

      {/* Tabla con últimos 5 errores recientes */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-base font-semibold text-slate-900">
            Errores Recientes (Últimos 5)
          </h2>
          <Link
            to="/admin/logs"
            className="text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap"
          >
            Ver todos los logs
          </Link>
        </div>

        {data.ultimosErrores.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No se han registrado errores recientes en el servidor.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Ruta</th>
                  <th className="py-3 px-4">Mensaje</th>
                  <th className="py-3 px-4 text-right">Código HTTP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {data.ultimosErrores.map(err => (
                  <tr key={err.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-mono tabular-nums text-xs text-slate-500 whitespace-nowrap">
                      {new Date(err.timestamp).toLocaleString('es-EC')}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-xs text-slate-800 whitespace-nowrap">
                      {err.method} {err.route}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 text-xs">
                      {err.message}
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums text-xs font-semibold text-rose-600 text-right">
                      {err.statusCode}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
