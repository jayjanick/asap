import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Dialogs';
import { Button } from '../ui';
import { API_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Edit2 } from 'lucide-react';
import { HorarioFila } from '../../pages/PerfilPage';

interface WeeklyScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WeeklyScheduleModal: React.FC<WeeklyScheduleModalProps> = ({ isOpen, onClose }) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [horario, setHorario] = useState<HorarioFila[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !token) return;
    setLoading(true);
    fetch(`${API_URL}/api/horario`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.horario)) {
          setHorario(data.horario);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, token]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Horario Semanal del Docente"
      subtitle="Distribución horaria sincronizada con tus cursos activos"
      maxWidth="2xl"
    >
      <div className="space-y-4 text-left">
        {loading ? (
          <div className="py-10 text-center text-xs text-slate-400">
            Cargando tu horario semanal...
          </div>
        ) : horario.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            Aún no tienes un horario de clases registrado en tu carga lectiva.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0A2239] text-white uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Hora</th>
                  <th className="px-3 py-2.5 font-semibold">Lunes</th>
                  <th className="px-3 py-2.5 font-semibold">Martes</th>
                  <th className="px-3 py-2.5 font-semibold">Miércoles</th>
                  <th className="px-3 py-2.5 font-semibold">Jueves</th>
                  <th className="px-3 py-2.5 font-semibold">Viernes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {horario.map((fila, idx) => {
                  const isReceso = fila.lunes?.toUpperCase() === 'RECESO';
                  return (
                    <tr
                      key={idx}
                      className={
                        isReceso
                          ? 'bg-amber-50/70 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 font-bold text-center'
                          : 'hover:bg-slate-50 dark:hover:bg-[#071727]/50 text-slate-700 dark:text-slate-300'
                      }
                    >
                      <td className="px-3 py-2.5 font-bold text-slate-500 whitespace-nowrap bg-slate-50/80 dark:bg-[#071727]">
                        {fila.hora}
                      </td>
                      <td className="px-3 py-2.5">{fila.lunes || '-'}</td>
                      <td className="px-3 py-2.5">{fila.martes || '-'}</td>
                      <td className="px-3 py-2.5">{fila.miercoles || '-'}</td>
                      <td className="px-3 py-2.5">{fila.jueves || '-'}</td>
                      <td className="px-3 py-2.5">{fila.viernes || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 gap-2 flex-wrap">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#176087]" />
            <span>Sincronizado con Mis Cursos y Perfil & Ajustes.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                navigate('/perfil');
              }}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Editar en Perfil</span>
            </Button>
            <Button variant="primary" size="sm" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
