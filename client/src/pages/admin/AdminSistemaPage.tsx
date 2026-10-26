import React, { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle2, XCircle, Server, Clock, Database } from 'lucide-react';
import { API_URL } from '../../config/api';

interface SistemaResponse {
  mongo: {
    readyState: number;
    estado: string;
    conectado: boolean;
  };
  variablesEntorno: Record<string, boolean>;
  timestamp: string;
  uptime: number;
}

export const AdminSistemaPage: React.FC = () => {
  const [data, setData] = useState<SistemaResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSistema = () => {
    const token = localStorage.getItem('asap_admin_token');
    setLoading(true);
    fetch(`${API_URL}/api/admin/sistema`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => {
        if (d && d.success) {
          setData(d);
        } else {
          setData(null);
        }
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSistema();
  }, []);

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs}h ${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
        No se pudo obtener la información del sistema.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold text-slate-900">
            Estado del Sistema
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Diagnóstico de conexión a MongoDB, tiempo activo del servidor y variables de entorno presentes.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSistema}
          className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refrescar Estado</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Conexión MongoDB</span>
            <Database className="w-4 h-4 text-slate-400" />
          </div>
          <p
            className={`font-['Plus_Jakarta_Sans',sans-serif] text-xl font-bold ${
              data.mongo.conectado ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {data.mongo.estado} (readyState: {data.mongo.readyState})
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Uptime del Servidor</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <p className="font-mono tabular-nums text-xl font-bold text-slate-900">
            {formatUptime(data.uptime)}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Timestamp del Servidor</span>
            <Server className="w-4 h-4 text-slate-400" />
          </div>
          <p className="font-mono tabular-nums text-sm font-semibold text-slate-900">
            {new Date(data.timestamp).toLocaleString('es-EC')}
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-base font-semibold text-slate-900">
            Variables de Entorno (Verificación de Presencia)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Se muestra únicamente si la clave se encuentra definida en el entorno de ejecución, sin exponer valores secretos.
          </p>
        </div>

        <div className="divide-y divide-slate-200">
          {Object.entries(data.variablesEntorno).map(([key, present]) => (
            <div key={key} className="px-6 py-3.5 flex items-center justify-between text-sm">
              <span className="font-mono text-xs font-medium text-slate-800">{key}</span>
              <div className="flex items-center gap-1.5 text-xs font-medium">
                {present ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Presente</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span className="text-rose-700">No definida</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSistemaPage;
