import React, { useState } from 'react';
import { Modal } from '../ui/Dialogs';
import { Button, Badge } from '../ui';
import { Estudiante } from '../../data/mockData';
import { User, CheckCircle2, AlertTriangle, XCircle, Clock, Plus, Phone, FileText } from 'lucide-react';

interface StudentProfileModalProps {
  estudiante: Estudiante | null;
  paraleloNombre: string;
  isOpen: boolean;
  onClose: () => void;
  onGuardarObservacion?: (estudianteId: string, nuevaObservacion: string) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  estudiante,
  paraleloNombre,
  isOpen,
  onClose,
  onGuardarObservacion
}) => {
  const [nuevaObs, setNuevaObs] = useState('');
  const [observacionesList, setObservacionesList] = useState<string[]>(estudiante?.observaciones || []);

  if (!estudiante) return null;

  const handleAgregarObservacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaObs.trim()) return;
    const actualizada = [...observacionesList, nuevaObs.trim()];
    setObservacionesList(actualizada);
    if (onGuardarObservacion) {
      onGuardarObservacion(estudiante.id, nuevaObs.trim());
    }
    setNuevaObs('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={estudiante.nombre}
      subtitle={`Lista #${estudiante.numeroLista} · ${paraleloNombre} · Cédula: ${estudiante.cedula}`}
      maxWidth="2xl"
    >
      <div className="space-y-6 text-sm">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#071727] border border-slate-200/80 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">Promedio Actual</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-2xl font-bold font-mono ${estudiante.promedioGeneral >= 7 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {estudiante.promedioGeneral.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400">/10</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {estudiante.promedioGeneral >= 7 ? 'Aprobado regular' : 'Requiere refuerzo'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#071727] border border-slate-200/80 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">% Asistencia</span>
            <div className="text-2xl font-bold font-mono text-[#176087] dark:text-[#9ED8ED] mt-1">
              {estudiante.asistenciaMes}%
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Mes lectivo</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#071727] border border-slate-200/80 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">Faltas Injustificadas</span>
            <div className="text-2xl font-bold font-mono text-rose-600 mt-1">
              {estudiante.faltasInjustificadas}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {estudiante.faltasJustificadas} Justificadas
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#071727] border border-slate-200/80 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">Atrasos</span>
            <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
              {estudiante.atrasos}
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Acumulados</span>
          </div>
        </div>

        {/* Representante info */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#9ED8ED]/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#176087] text-white flex items-center justify-center font-bold text-xs">
              RL
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Representante Legal</span>
              <span className="text-xs text-slate-500">Contacto registrado en secretaría</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-[#176087] dark:text-[#9ED8ED]" />
            <span className="font-mono text-xs font-semibold text-[#176087] dark:text-[#9ED8ED]">
              {estudiante.telefonoRepresentante || '+593 99 481 9283'}
            </span>
          </div>
        </div>

        {/* Observaciones y Bitácora */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#176087]" />
            Observaciones Pedagógicas y Seguimiento Docente
          </h4>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {observacionesList.length > 0 ? (
              observacionesList.map((obs, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#071727] border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                  <span className="text-[#176087] font-bold">·</span>
                  <span>{obs}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No hay observaciones registradas para este estudiante aún.</p>
            )}
          </div>

          <form onSubmit={handleAgregarObservacion} className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder="Escribe una observación pedagógica o acuerdo con el representante..."
              value={nuevaObs}
              onChange={(e) => setNuevaObs(e.target.value)}
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#176087]"
            />
            <Button type="submit" size="sm" variant="primary">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Añadir
            </Button>
          </form>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
