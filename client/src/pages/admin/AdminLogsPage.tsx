import React, { useEffect, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { API_URL } from '../../config/api';

interface AdminErrorLog {
  id: string;
  timestamp: string;
  method: string;
  route: string;
  message: string;
  statusCode: number;
}

export const AdminLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AdminErrorLog[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchLogs = () => {
    const token = localStorage.getItem('asap_admin_token');
    setLoading(true);
    fetch(`${API_URL}/api/admin/logs`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => {
        if (d && Array.isArray(d.logs)) {
          setLogs(d.logs);
        } else {
          setLogs([]);
        }
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-80 bg-white border border-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  const filteredLogs = (logs || []).filter(item => {
    const q = filter.toLowerCase().trim();
    if (!q) return true;
    return (
      item.route?.toLowerCase().includes(q) ||
      item.message?.toLowerCase().includes(q) ||
      String(item.statusCode).includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold text-slate-900">
            Registro de Errores del Servidor
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Últimos 100 errores capturados en tiempo de ejecución.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Filtrar por ruta, mensaje o código..."
              className="pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 w-64"
            />
          </div>
          <button
            type="button"
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
          No hay errores registrados en el historial del servidor.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
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
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-mono tabular-nums text-xs text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('es-EC')}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-xs text-slate-800 whitespace-nowrap">
                      {log.method} {log.route}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-700">
                      {log.message}
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums text-xs font-semibold text-rose-600 text-right">
                      {log.statusCode}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogsPage;
