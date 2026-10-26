import React from 'react';
import { Modal } from '../ui/Dialogs';
import { Button } from '../ui';
import { HORARIO_DOCENTE_SEMANAL } from '../../data/mockData';
import { Calendar, Clock, BookOpen } from 'lucide-react';

interface WeeklyScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WeeklyScheduleModal: React.FC<WeeklyScheduleModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Horario Semanal del Docente"
      subtitle="Distribución horaria oficial · Año Lectivo Régimen Costa"
      maxWidth="2xl"
    >
      <div className="space-y-4 text-left">
        {HORARIO_DOCENTE_SEMANAL.length === 0 ? (
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
                {HORARIO_DOCENTE_SEMANAL.map((fila, idx) => {
                  const isReceso = fila.lunes === 'RECESO';
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
                      <td className="px-3 py-2.5">{fila.lunes}</td>
                      <td className="px-3 py-2.5">{fila.martes}</td>
                      <td className="px-3 py-2.5">{fila.miercoles}</td>
                      <td className="px-3 py-2.5">{fila.jueves}</td>
                      <td className="px-3 py-2.5">{fila.viernes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#176087]" />
            <span>20 horas pedagógicas de aula + 10 horas de gestión y refuerzo académico.</span>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Entendido
          </Button>
        </div>
      </div>
    </Modal>
  );
};
