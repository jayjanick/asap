import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Badge, InfoTooltip, Skeleton, EmptyState } from '../components/ui';
import { Modal } from '../components/ui/Dialogs';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Clock,
  ExternalLink
} from 'lucide-react';

interface EventoClase {
  dia: number;
  hora: string;
  paralelo: string;
  materia: string;
  tema: string;
  destreza: string;
  actividad: string;
  color: string;
}

export const CalendarioPlanificacionPage: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<'mes' | 'semana' | 'dia'>('mes');
  const [selectedParalelo, setSelectedParalelo] = useState<string>('todos');
  const [selectedEvento, setSelectedEvento] = useState<EventoClase | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/planificacion`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!data) return <EmptyState mensaje="No hay datos aún" />;

  const planificaciones = Array.isArray(data.planificaciones) ? data.planificaciones : [];

  // Mapear secuencias de clases reales si existen en las planificaciones
  const eventosClase: Record<number, EventoClase[]> = {};
  planificaciones.forEach((plan: any, planIdx: number) => {
    if (Array.isArray(plan.secuenciaClases)) {
      plan.secuenciaClases.forEach((sc: any, scIdx: number) => {
        // Asignar a un día representativo del mes
        const diaCalculado = Math.min(28, (planIdx * 8) + (scIdx * 4) + 5);
        if (!eventosClase[diaCalculado]) eventosClase[diaCalculado] = [];
        eventosClase[diaCalculado].push({
          dia: diaCalculado,
          hora: '07:15 - 08:45',
          paralelo: plan.paralelo || '8vo A',
          materia: plan.materia || 'Lengua y Literatura',
          tema: sc.tema || plan.titulo,
          destreza: plan.destreza || '',
          actividad: sc.actividad || 'Clase regular',
          color: planIdx % 2 === 0 ? 'bg-[#176087]' : 'bg-indigo-600'
        });
      });
    }
  });

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const totalDiasMes = 31;
  const primerDiaSemanaOffset = 4; // Octubre 2026

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <Link to="/planificacion">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-[#176087] dark:text-[#9ED8ED]" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Calendario de Clases
              </h2>
              <InfoTooltip content="Sincronizado con el cronograma del régimen Costa 2026 y fechas cívicas del Ministerio de Educación." />
            </div>
          </div>
        </div>

        {/* Filters and View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedParalelo}
            onChange={(e) => setSelectedParalelo(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A2239] text-slate-900 dark:text-white"
          >
            <option value="todos">Todos los paralelos</option>
            <option value="8vo A">8vo EGB "A"</option>
            <option value="9no B">9no EGB "B"</option>
          </select>

          <div className="flex rounded-lg bg-slate-200 dark:bg-slate-800 p-0.5 text-xs font-semibold">
            {(['mes', 'semana', 'dia'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1 rounded-md capitalize transition-all cursor-pointer ${
                  viewMode === m
                    ? 'bg-white dark:bg-[#0A2239] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Google Calendar Connected Banner */}
      <div className="p-3.5 rounded-2xl bg-[#9ED8ED]/20 dark:bg-[#176087]/20 border border-[#176087]/20 dark:border-[#9ED8ED]/20 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Google Calendar Sincronizado
          </span>
          <span className="text-slate-500 hidden sm:inline">· {user?.email || 'docente@educacion.gob.ec'}</span>
        </div>
        <Link to="/perfil" className="text-[#176087] dark:text-[#9ED8ED] font-bold hover:underline flex items-center gap-1">
          Configurar sincronización <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Mes Grid o Empty State */}
      {planificaciones.length === 0 ? (
        <EmptyState
          mensaje="Aún no has programado clases"
          submensaje="Crea tu primera planificación curricular para visualizar la distribución de clases en el calendario."
          accionTexto="Crear planificación"
          onAccion={() => navigate('/planificacion/crear')}
        />
      ) : (
        <Card className="p-0 overflow-hidden border-slate-200 dark:border-slate-800 shadow-md">
          {/* Month Header Bar */}
          <div className="p-4 bg-[#0A2239] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold">Octubre 2026</span>
              <span className="text-xs text-[#9ED8ED] font-mono">1er Quimestre · Parcial 2</span>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded hover:bg-slate-800 text-slate-300 cursor-pointer">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded hover:bg-slate-800 text-slate-300 cursor-pointer">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 bg-slate-100 dark:bg-slate-800/80 text-center py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
            {diasSemana.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Calendar Grid cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800 min-h-[500px]">
            {/* Empty cells before month start */}
            {Array.from({ length: primerDiaSemanaOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2 bg-slate-50/50 dark:bg-[#071727]/30 min-h-[95px]" />
            ))}

            {/* Days */}
            {Array.from({ length: totalDiasMes }, (_, i) => {
              const dayNum = i + 1;
              const clasesDia = eventosClase[dayNum] || [];
              const filteredClases =
                selectedParalelo === 'todos'
                  ? clasesDia
                  : clasesDia.filter((c) => c.paralelo.includes(selectedParalelo));
              const isToday = dayNum === new Date().getDate();

              return (
                <div
                  key={dayNum}
                  className={`p-2 min-h-[95px] flex flex-col justify-between transition-colors ${
                    isToday
                      ? 'bg-[#9ED8ED]/15 dark:bg-[#176087]/20 font-bold'
                      : 'hover:bg-slate-50 dark:hover:bg-[#071727]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono rounded-full w-5 h-5 flex items-center justify-center ${
                        isToday
                          ? 'bg-[#176087] text-white'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {isToday && (
                      <span className="text-[9px] font-bold text-[#176087] dark:text-[#9ED8ED] uppercase">
                        Hoy
                      </span>
                    )}
                  </div>

                  {/* Event Chips */}
                  <div className="space-y-1 my-1">
                    {filteredClases.map((c, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedEvento(c)}
                        className={`w-full text-left p-1 rounded text-[10px] text-white font-medium truncate block cursor-pointer transition-opacity hover:opacity-90 ${c.color}`}
                      >
                        {c.paralelo}: {c.tema}
                      </button>
                    ))}
                  </div>

                  <div className="h-1" />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* MODAL DETALLE DE CLASE PLANIFICADA */}
      {selectedEvento && (
        <Modal
          isOpen={Boolean(selectedEvento)}
          onClose={() => setSelectedEvento(null)}
          title={selectedEvento.tema}
          subtitle={`${selectedEvento.paralelo} · ${selectedEvento.materia} · ${selectedEvento.hora}`}
        >
          <div className="space-y-4 text-xs text-left">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#071727] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Destreza Curricular
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {selectedEvento.destreza}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-1">
                Actividad Pedagógica Planificada
              </span>
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                {selectedEvento.actividad}
              </p>
            </div>

            <div className="flex items-center justify-between text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#176087]" />
                {selectedEvento.hora} (Hora Pedagógica)
              </span>
              <Button size="sm" variant="outline" onClick={() => setSelectedEvento(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CalendarioPlanificacionPage;
