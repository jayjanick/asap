import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, AlertCircle } from 'lucide-react';
import { API_URL } from '../../config/api';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Credenciales inválidas');
        setLoading(false);
        return;
      }

      if (!data.user || data.user.rol !== 'Admin') {
        setError('Acceso denegado: esta cuenta no posee privilegios de Administrador.');
        setLoading(false);
        return;
      }

      localStorage.setItem('asap_admin_token', data.token);
      localStorage.setItem('asap_admin_user', JSON.stringify(data.user));
      navigate('/admin/dashboard', { replace: true });
    } catch (err: any) {
      setError('No se pudo conectar con el servidor de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 font-['DM_Sans',sans-serif]">
      <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <div className="mb-6">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold text-slate-900 tracking-tight">
            Consola de Administración
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ingresa con tus credenciales de nivel Administrador para gestionar ASAP.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@asap.edu.ec"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            {loading ? 'Verificando acceso...' : 'Iniciar Sesión como Admin'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
