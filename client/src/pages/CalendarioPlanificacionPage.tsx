import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { Card, Button, InfoTooltip, Skeleton, EmptyState } from '../components/ui';
import { Modal } from '../components/ui/Dialogs';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Clock,
  CheckCircle2
} from 'lucide-react';

interface EventoClase {
  fechaISO: string;
  dia: number;
  hora: string;
  paralelo: string;
  materia: string;
  tema: string;
  contenido: string;
  destreza: string;
  actividad: string;
  completada: boolean;
  color: string;
}

const MESES_NOMBRES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

const DIA_NOMBRE_A_NUM: Record<string, number> = {
  Lunes: 1,
  Martes: 2,
  Miércoles: 3,
  Miercoles: 3,
  Jueves: 4,
  Viernes: 5
};

export const CalendarioPlanificacionPage: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [cursos, setCursos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth()); // 0-11
  const [selectedParalelo, setSelectedParalelo] = useState<string>('todos');
  const [selectedEvento, setSelectedEvento] = useState<EventoClase | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/planificacion`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then((r) => r.json()),
      fetch(`${API_URL}/api/paralelos`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((r) => (r.ok ? r.json() : { paralelos: [] }))
        .catch(() => ({ paralelos: [] }))
    ])
      .then(([planData, parData]) => {
        setData(planData);
        if (Array.isArray(parData?.paralelos)) {
          setCursos(parData.paralelos);
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!data) return <EmptyState mensaje="No hay datos aún" />;

  const planificaciones = Array.isArray(data.planificaciones) ? data.planificaciones : [];

  const totalDiasMes = new Date(currentYear, currentMonth + 1, 0).getDate();
  const primerDiaSemanaOffset = new Date(currentYear, currentMonth, 1).getDay();

  // Distribuir las clases de cada planificación según fechaInicio, fechaFin y diasImparticion
  const eventosPorDia: Record<number, EventoClase[]> = {};

  planificaciones.forEach((plan: any, planIdx: number) => {
    const secuencias = Array.isArray(plan.secuenciaClases) ? plan.secuenciaClases : [];
    if (secuencias.length === 0) return;

    const diasConfigurados: number[] =
      Array.isArray(plan.diasImparticion) && plan.diasImparticion.length > 0
        ? plan.diasImparticion
            .map((d: string) => DIA_NOMBRE_A_NUM[d])
            .filter((n: number | undefined): n is number => typeof n === 'number')
        : [1, 3, 5];

    const startDate = plan.fechaInicio
      ? new Date(`${plan.fechaInicio}T00:00:00`)
      : new Date(currentYear, currentMonth, 1 + planIdx * 3);
    const endDate = plan.fechaFin
      ? new Date(`${plan.fechaFin}T23:59:59`)
      : new Date(startDate.getTime() + (Number(plan.semanas) || 4) * 7 * 86400000);

    // Generar fechas válidas que coincidan con los días de impartición
    const validDates: Date[] = [];
    const cursor = new Date(startDate);
    let safety = 0;
    while (cursor <= endDate && validDates.length < secuencias.length && safety < 180) {
      if (diasConfigurados.includes(cursor.getDay())) {
        validDates.push(new Date(cursor));
      }
      cursor.setDate(cursor.getDate() + 1);
      safety++;
    }

    secuencias.forEach((sc: any, scIdx: number) => {
      const targetDate =
        validDates[scIdx] ||
        new Date(startDate.getTime() + scIdx * 2 * 86400000);
      if (
        targetDate.getFullYear() === currentYear &&
        targetDate.getMonth() === currentMonth
      ) {
        const dayNum = targetDate.getDate();
        if (!eventosPorDia[dayNum]) eventosPorDia[dayNum] = [];
        eventosPorDia[dayNum].push({
          fechaISO: targetDate.toISOString().slice(0, 10),
          dia: dayNum,
          hora: 'Sesión programada',
          paralelo: plan.paralelo || plan.materia || 'Curso',
          materia: plan.materia || 'General',
          tema: sc.tema || plan.titulo,
          contenido: sc.contenido || '',
          destreza: plan.destreza || '',
          actividad: sc.actividad || sc.actividadSugerida || 'Actividad de clase',
          completada: Boolean(sc.completada),
          color: sc.completada
            ? 'bg-emerald-600'
            : planIdx % 2 === 0
            ? 'bg-[#176087]'
            : 'bg-[#0A2239]'
        });
      }
    });
  });

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

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
                Calendario de Planificación
              </h2>
              <InfoTooltip content="Distribución mensual de tus sesiones según las fechas de inicio, fin y días configurados en cada unidad." />
            </div>
          </div>
        </div>

        {/* Filtro por curso */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedParalelo}
            onChange={(e) => setSelectedParalelo(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A2239] text-slate-900 dark:text-white"
          >
            <option value="todos">Todos mis cursos</option>
            {cursos.map((c) => (
              <option key={c.id} value={c.nombre}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mes Grid o Empty State */}
      {planificaciones.length === 0 ? (
        <EmptyState
          mensaje="Aún no has programado clases"
          submensaje="Crea tu primera planificación curricular para visualizar la distribución de clases en el calendario."
          accionTexto="Crear planificación"
          onAccion={() => navigate('/planificacion')}
        />
      ) : (
        <Card className="p-0 overflow-hidden border-slate-200 dark:border-slate-800 shadow-md">
          {/* Month Header Bar */}
          <div className="p-4 bg-[#0A2239] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold">
                {MESES_NOMBRES[currentMonth]} {currentYear}
              </span>
              <span className="text-xs text-[#9ED8ED] font-mono">
                {planificaciones.length} unidad(es) registrada(s)
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300 cursor-pointer"
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300 cursor-pointer"
                title="Mes siguiente"
              >
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
            {Array.from({ length: primerDiaSemanaOffset }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="p-2 bg-slate-50/50 dark:bg-[#071727]/30 min-h-[95px]"
              />
            ))}

            {Array.from({ length: totalDiasMes }, (_, i) => {
              const dayNum = i + 1;
              const clasesDia = eventosPorDia[dayNum] || [];
              const filteredClases =
                selectedParalelo === 'todos'
                  ? clasesDia
                  : clasesDia.filter((c) =>
                      c.paralelo.toLowerCase().includes(selectedParalelo.toLowerCase())
                    );
              const isToday =
                dayNum === now.getDate() &&
                currentMonth === now.getMonth() &&
                currentYear === now.getFullYear();

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
                        type="button"
                        onClick={() => setSelectedEvento(c)}
                        className={`w-full text-left p-1 rounded text-[10px] text-white font-medium truncate block cursor-pointer transition-opacity hover:opacity-90 ${c.color}`}
                      >
                        {c.completada ? '✓ ' : ''}
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
          subtitle={`${selectedEvento.paralelo} · ${selectedEvento.materia} · ${selectedEvento.fechaISO}`}
        >
          <div className="space-y-4 text-xs text-left">
            {selectedEvento.completada && (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" /> Sesión marcada como impartida
              </div>
            )}

            {selectedEvento.contenido && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#071727] border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Contenido de la Sesión
                </span>
                <p className="text-slate-700 dark:text-slate-200">{selectedEvento.contenido}</p>
              </div>
            )}

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
                Fecha: {selectedEvento.fechaISO}
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
