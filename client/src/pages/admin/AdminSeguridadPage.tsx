import React, { useEffect, useState } from 'react';
import { RefreshCw, ShieldOff } from 'lucide-react';
import { API_URL } from '../../config/api';

interface ActiveSessionItem {
  tokenId: string;
  userId: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  revocado: boolean;
}

export const AdminSeguridadPage: React.FC = () => {
  const [sesiones, setSesiones] = useState<ActiveSessionItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchSesiones = () => {
    const token = localStorage.getItem('asap_admin_token');
    setLoading(true);
    fetch(`${API_URL}/api/admin/sesiones`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => {
        if (d && Array.isArray(d.sesiones)) {
          setSesiones(d.sesiones);
        } else {
          setSesiones([]);
        }
      })
      .catch(() => setSesiones([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSesiones();
  }, []);

  const handleRevoke = async (tokenId: string) => {
    const token = localStorage.getItem('asap_admin_token');
    setRevokingId(tokenId);
    try {
      const res = await fetch(`${API_URL}/api/admin/sesiones/${encodeURIComponent(tokenId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSesiones(prev => (prev ? prev.filter(s => s.tokenId !== tokenId) : []));
      }
    } finally {
      setRevokingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-80 bg-white border border-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold text-slate-900">
            Seguridad y Sesiones Activas
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Control de tokens JWT activos respaldados en MongoDB. Revocar invalida el acceso de inmediato.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSesiones}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualizar</span>
        </button>
      </div>

      {!sesiones || sesiones.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
          No hay sesiones activas registradas en este momento.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Token ID</th>
                  <th className="py-3 px-4">Email Usuario</th>
                  <th className="py-3 px-4">Inicio de Sesión</th>
                  <th className="py-3 px-4">Expiración</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {sesiones.map(s => (
                  <tr key={s.tokenId} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-mono text-xs text-slate-800 whitespace-nowrap">
                      {s.tokenId}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                      {s.email}
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums text-xs text-slate-500 whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleString('es-EC')}
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums text-xs text-slate-500 whitespace-nowrap">
                      {new Date(s.expiresAt).toLocaleDateString('es-EC')}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        disabled={revokingId === s.tokenId}
                        onClick={() => handleRevoke(s.tokenId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 rounded-md transition-colors cursor-pointer"
                      >
                        <ShieldOff className="w-3.5 h-3.5" />
                        <span>{revokingId === s.tokenId ? 'Revocando...' : 'Revocar'}</span>
                      </button>
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

export default AdminSeguridadPage;
