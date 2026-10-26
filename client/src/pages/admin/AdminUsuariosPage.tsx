import React, { useEffect, useState } from 'react';
import { Eye, Trash2, Search, X, RefreshCw } from 'lucide-react';
import { API_URL } from '../../config/api';

interface AdminUserRow {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  institucion: string;
  fechaRegistro: string | null;
  numeroParalelos: number;
}

interface UserDetailResponse {
  usuario: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
    institucion: string;
    materias: string[];
    telefono: string;
    fechaRegistro: string | null;
  };
  paralelos: Array<{
    id: string;
    nombre: string;
    grado: number;
    jornada: string;
    nivel: string;
    totalAlumnos: number;
  }>;
  estadisticas: {
    totalParalelos: number;
    totalAlumnos: number;
    totalActividades: number;
    totalPlanificaciones: number;
    totalDocumentos: number;
    totalKanbanTasks: number;
  };
}

export const AdminUsuariosPage: React.FC = () => {
  const [usuarios, setUsuarios] = useState<AdminUserRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [userToDelete, setUserToDelete] = useState<AdminUserRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsuarios = () => {
    const token = localStorage.getItem('asap_admin_token');
    setLoading(true);
    fetch(`${API_URL}/api/admin/usuarios`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => {
        if (d && Array.isArray(d.usuarios)) {
          setUsuarios(d.usuarios);
        } else {
          setUsuarios([]);
        }
      })
      .catch(() => setUsuarios([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleOpenDetail = (id: string) => {
    const token = localStorage.getItem('asap_admin_token');
    setSelectedUserId(id);
    setUserDetail(null);
    setLoadingDetail(true);
    fetch(`${API_URL}/api/admin/usuarios/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => {
        if (d && d.success) {
          setUserDetail(d);
        }
      })
      .finally(() => setLoadingDetail(false));
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    const token = localStorage.getItem('asap_admin_token');
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/usuarios/${userToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUsuarios(prev => (prev ? prev.filter(u => u.id !== userToDelete.id) : []));
        setUserToDelete(null);
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-96 bg-white border border-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  const filtered = (usuarios || []).filter(u => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      u.nombre?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.institucion?.toLowerCase().includes(q) ||
      u.rol?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-bold text-slate-900">
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Listado de cuentas registradas, inspección de paralelos y eliminación en cascada.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, correo o plantel..."
              className="pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 w-64"
            />
          </div>
          <button
            type="button"
            onClick={fetchUsuarios}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refrescar</span>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
          No se encontraron usuarios registrados con ese criterio.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Nombre</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Rol</th>
                  <th className="py-3 px-4">Institución</th>
                  <th className="py-3 px-4">Fecha Registro</th>
                  <th className="py-3 px-4 text-right">Paralelos</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                      {u.nombre}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                      {u.email}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-700 whitespace-nowrap">
                      {u.rol}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-600">
                      {u.institucion}
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums text-xs text-slate-500 whitespace-nowrap">
                      {u.fechaRegistro
                        ? new Date(u.fechaRegistro).toLocaleDateString('es-EC')
                        : '—'}
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums text-xs font-semibold text-slate-900 text-right">
                      {u.numeroParalelos}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(u.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detalle</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserToDelete(u)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Usuario */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-2xl overflow-hidden shadow-lg">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-base font-bold text-slate-900">
                Detalle del Usuario y Estadísticas
              </h2>
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {loadingDetail || !userDetail ? (
                <div className="space-y-3">
                  <div className="h-6 bg-slate-100 rounded animate-pulse" />
                  <div className="h-24 bg-slate-100 rounded animate-pulse" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block">Nombre Completo</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {userDetail.usuario.nombre}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Correo Electrónico</span>
                      <span className="font-mono text-slate-800">{userDetail.usuario.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Institución</span>
                      <span className="text-slate-800">{userDetail.usuario.institucion}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Rol · Fecha de Registro</span>
                      <span className="text-slate-800">
                        {userDetail.usuario.rol} ·{' '}
                        {userDetail.usuario.fechaRegistro
                          ? new Date(userDetail.usuario.fechaRegistro).toLocaleDateString('es-EC')
                          : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 border-t border-slate-100 text-center">
                    <div className="p-2.5 bg-slate-50 rounded-lg">
                      <span className="font-mono tabular-nums text-lg font-bold text-slate-900 block">
                        {userDetail.estadisticas.totalParalelos}
                      </span>
                      <span className="text-[11px] text-slate-500">Paralelos</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg">
                      <span className="font-mono tabular-nums text-lg font-bold text-slate-900 block">
                        {userDetail.estadisticas.totalAlumnos}
                      </span>
                      <span className="text-[11px] text-slate-500">Alumnos</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg">
                      <span className="font-mono tabular-nums text-lg font-bold text-slate-900 block">
                        {userDetail.estadisticas.totalPlanificaciones}
                      </span>
                      <span className="text-[11px] text-slate-500">Planes</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg">
                      <span className="font-mono tabular-nums text-lg font-bold text-slate-900 block">
                        {userDetail.estadisticas.totalActividades}
                      </span>
                      <span className="text-[11px] text-slate-500">Actividades</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg">
                      <span className="font-mono tabular-nums text-lg font-bold text-slate-900 block">
                        {userDetail.estadisticas.totalKanbanTasks}
                      </span>
                      <span className="text-[11px] text-slate-500">Kanban</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg">
                      <span className="font-mono tabular-nums text-lg font-bold text-slate-900 block">
                        {userDetail.estadisticas.totalDocumentos}
                      </span>
                      <span className="text-[11px] text-slate-500">Docs</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-slate-700 mb-2">
                      Paralelos Registrados ({userDetail.paralelos.length})
                    </h3>
                    {userDetail.paralelos.length === 0 ? (
                      <p className="text-xs text-slate-400">Sin paralelos registrados.</p>
                    ) : (
                      <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                        {userDetail.paralelos.map(p => (
                          <div
                            key={p.id}
                            className="px-4 py-2.5 flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-medium text-slate-900">{p.nombre}</span>
                              <span className="text-slate-400 ml-2">
                                {p.nivel} · {p.jornada}
                              </span>
                            </div>
                            <span className="font-mono tabular-nums text-slate-700">
                              {p.totalAlumnos} estudiantes
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación en Cascada */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-lg">
            <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-base font-bold text-slate-900">
              Confirmar eliminación en cascada
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Estás a punto de eliminar a <strong>{userToDelete.nombre}</strong> (
              <span className="font-mono">{userToDelete.email}</span>). Esta acción borrará
              permanentemente su cuenta y todos sus paralelos, estudiantes, asistencias,
              calificaciones, actividades, planificaciones, documentos y tareas Kanban asociadas.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setUserToDelete(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-3.5 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 rounded-lg cursor-pointer"
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar en cascada'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsuariosPage;
