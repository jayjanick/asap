import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { Card, Button, InfoTooltip, Skeleton, EmptyState } from '../components/ui';
import { Modal } from '../components/ui/Dialogs';
import {
  Calendar,
  Clock,
  Sparkles,
  BookOpenCheck,
  Plus,
  TrendingUp,
  Lock
} from 'lucide-react';

interface TodoKanbanItem {
  id: string;
  titulo: string;
  descripcion?: string;
  paralelo?: string;
  columna: 'Por hacer' | 'En progreso' | 'Completado';
  urgencia: 'Alta' | 'Media' | 'Baja';
  prioridad?: 'Alta' | 'Media' | 'Baja';
  fechaLimite?: string;
  observaciones?: string;
  completada: boolean;
}

const parseTimeMinutes = (timeStr: string): number | null => {
  const m = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
};

export const DashboardPage: React.FC = () => {
  const { user, token, institucionActiva } = useAuth();
  const [searchParams] = useSearchParams();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [todoList, setTodoList] = useState<TodoKanbanItem[]>([]);

  // Formulario de tarea sincronizado con Kanban de Workspace
  const [nuevaTareaTitulo, setNuevaTareaTitulo] = useState('');
  const [nuevaTareaUrgencia, setNuevaTareaUrgencia] = useState<'Alta' | 'Media' | 'Baja'>('Media');
  const [nuevaTareaFecha, setNuevaTareaFecha] = useState('');
  const [nuevaTareaObs, setNuevaTareaObs] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [guardandoTarea, setGuardandoTarea] = useState(false);

  // Hora en tiempo real para evaluación dinámica del Horario del Día
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then((r) => r.json()),
      fetch(`${API_URL}/api/workspace/kanban`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((r) => (r.ok ? r.json() : { kanbanTasks: [] }))
        .catch(() => ({ kanbanTasks: [] }))
    ])
      .then(([dashData, kbData]) => {
        setData(dashData);
        const rawTasks = Array.isArray(kbData?.kanbanTasks)
          ? kbData.kanbanTasks
          : Array.isArray(dashData?.tareasKanban)
          ? dashData.tareasKanban
          : [];
        setTodoList(
          rawTasks.map((t: any) => ({
            id: t.id || t._id,
            titulo: t.titulo,
            descripcion: t.descripcion || '',
            paralelo: t.paralelo || 'General',
            columna: t.columna || 'Por hacer',
            urgencia: t.urgencia || t.prioridad || 'Media',
            prioridad: t.prioridad || t.urgencia || 'Media',
            fechaLimite: t.fechaLimite || '',
            observaciones: t.observaciones || t.descripcion || '',
            completada: t.columna === 'Completado'
          }))
        );
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (searchParams.get('onboarding') === 'true') {
      setShowOnboarding(true);
    }
  }, [searchParams]);

  if (loading) return <Skeleton className="h-[600px] w-full" />;
  if (!data) return <EmptyState mensaje="No hay datos aún" />;

  // Evaluación dinámica en tiempo real del Horario del Día según el horario configurado por el docente
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const dayIndex = currentTime.getDay(); // 0=Dom, 1=Lun..5=Vie, 6=Sáb
  const dayKeyMap: Record<number, 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes'> = {
    1: 'lunes',
    2: 'martes',
    3: 'miercoles',
    4: 'jueves',
    5: 'viernes'
  };
  const todayKey = dayKeyMap[dayIndex];
  const horarioSemanal = Array.isArray(data?.resumenHoy?.horarioSemanal)
    ? data.resumenHoy.horarioSemanal
    : [];

  const bloquesHoy = todayKey
    ? horarioSemanal
        .map((row: any) => {
          const valorCelda = String(row[todayKey] || '').trim();
          if (!valorCelda || valorCelda.toUpperCase().includes('RECESO')) return null;
          const partesHora = String(row.hora || '').split('-');
          const inicioMin = partesHora[0] ? parseTimeMinutes(partesHora[0]) : null;
          const finMin = partesHora[1] ? parseTimeMinutes(partesHora[1]) : null;
          const enCurso =
            inicioMin !== null &&
            finMin !== null &&
            currentMinutes >= inicioMin &&
            currentMinutes <= finMin;
          const proximo =
            inicioMin !== null && currentMinutes < inicioMin;
          return {
            hora: row.hora || '',
            contenido: valorCelda,
            enCurso,
            proximo
          };
        })
        .filter(Boolean)
    : [];

  const bloqueEnCurso = bloquesHoy.find((b: any) => b.enCurso) || null;

  const handleToggleTodo = async (item: TodoKanbanItem) => {
    const nuevoCompletada = !item.completada;
    const nuevaColumna: 'Por hacer' | 'Completado' = nuevoCompletada ? 'Completado' : 'Por hacer';

    setTodoList((prev) =>
      prev.map((t) =>
        t.id === item.id ? { ...t, completada: nuevoCompletada, columna: nuevaColumna } : t
      )
    );

    try {
      await fetch(`${API_URL}/api/workspace/kanban/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ columna: nuevaColumna })
      });
    } catch (e) {
      console.warn('Error actualizando estado de tarea:', e);
    }
  };

  const handleAddTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaTareaTitulo.trim()) return;
    setGuardandoTarea(true);

    const payload = {
      titulo: nuevaTareaTitulo.trim(),
      descripcion: nuevaTareaObs.trim(),
      observaciones: nuevaTareaObs.trim(),
      paralelo: 'General',
      columna: 'Por hacer' as const,
      prioridad: nuevaTareaUrgencia,
      urgencia: nuevaTareaUrgencia,
      fechaLimite: nuevaTareaFecha || new Date().toISOString().slice(0, 10)
    };

    try {
      const res = await fetch(`${API_URL}/api/workspace/kanban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const d = await res.json();
        const t = d.tarea;
        if (t) {
          setTodoList((prev) => [
            {
              id: t.id,
              titulo: t.titulo,
              descripcion: t.descripcion || '',
              paralelo: t.paralelo || 'General',
              columna: t.columna || 'Por hacer',
              urgencia: t.urgencia || t.prioridad || 'Media',
              prioridad: t.prioridad || t.urgencia || 'Media',
              fechaLimite: t.fechaLimite || '',
              observaciones: t.observaciones || t.descripcion || '',
              completada: t.columna === 'Completado'
            },
            ...prev
          ]);
        }
      }
    } catch (err) {
      console.warn('Error creando tarea:', err);
    } finally {
      setGuardandoTarea(false);
      setNuevaTareaTitulo('');
      setNuevaTareaObs('');
      setNuevaTareaFecha('');
      setShowTaskForm(false);
    }
  };

  const fechaEcuador = currentTime.toLocaleDateString('es-EC', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getUrgenciaBadge = (urgencia: string) => {
    switch (urgencia) {
      case 'Alta':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
            Alta
          </span>
        );
      case 'Media':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
            Media
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
            Baja
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* 1. SECCIÓN SUPERIOR — RESUMEN DEL DÍA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Hoy (Horario del Día dinámico) */}
        <Card className="lg:col-span-2 p-6 bg-gradient-to-br from-[#0A2239] to-[#12365a] text-white relative overflow-hidden border-none shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-700/80 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#9ED8ED] uppercase tracking-wider">
                  Jornada {data?.resumenHoy?.jornada || 'Matutina'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {currentTime.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black capitalize mt-1 text-white">
                {fechaEcuador}
              </h2>
            </div>
            <div className="self-start sm:self-auto px-3 py-1 rounded-lg bg-white/10 text-xs font-semibold text-[#9ED8ED]">
              {institucionActiva?.nombre || user?.institucion || 'U.E. Fisco-Misional Democracia'}
            </div>
          </div>

          {/* Horario del día sincronizado con el horario semanal del docente */}
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  Horario del Día
                </span>
                <InfoTooltip content="Sincronizado en tiempo real con tu horario semanal configurado." />
              </div>
              <Link
                to="/perfil"
                className="text-[11px] font-semibold text-[#9ED8ED] hover:underline"
              >
                Configurar horario →
              </Link>
            </div>

            {bloquesHoy.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/50 flex flex-col items-center justify-center text-center py-6">
                <Clock className="w-5 h-5 text-slate-400 mb-1.5" />
                <h4 className="text-sm font-semibold text-slate-300">
                  {todayKey
                    ? 'Sin bloques programados para hoy en tu horario'
                    : 'Fin de semana — Sin clases programadas'}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {todayKey
                    ? 'Puedes asignar o editar tus franjas horarias desde Perfil y Ajustes.'
                    : 'Tus bloques de lunes a viernes se mostrarán aquí automáticamente.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {bloqueEnCurso && (
                  <div className="p-3.5 rounded-xl bg-[#176087]/90 border border-[#9ED8ED]/50 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-500 text-white flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        En Curso Ahora
                      </span>
                      <span className="text-xs font-mono font-bold text-white">
                        {bloqueEnCurso.hora}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{bloqueEnCurso.contenido}</h4>
                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-end">
                      <Link
                        to="/asistencia"
                        className="text-xs font-bold text-[#9ED8ED] hover:underline"
                      >
                        Tomar asistencia →
                      </Link>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {bloquesHoy.map((b: any, i: number) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                        b.enCurso
                          ? 'bg-[#176087]/40 border-[#9ED8ED]/60 text-white font-bold'
                          : 'bg-slate-900/40 border-slate-700/60 text-slate-200'
                      }`}
                    >
                      <div className="truncate">
                        <span className="font-mono text-[11px] text-[#9ED8ED] block">
                          {b.hora}
                        </span>
                        <span className="font-semibold truncate block">{b.contenido}</span>
                      </div>
                      {b.enCurso && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                          Activo
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Card Accesos Rápidos (Sección desactivada sin acciones por defecto) */}
        <Card className="p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Accesos Rápidos
              </span>
              <InfoTooltip content="Esta sección se encuentra desactivada temporalmente." />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              Acciones Frecuentes
            </h3>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30">
            <Lock className="w-6 h-6 text-slate-400 mb-2" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Sección desactivada temporalmente
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Los atajos personalizados se habilitarán próximamente.
            </p>
          </div>
        </Card>
      </div>

      {/* 2. STATS RÁPIDAS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Clases Esta Semana</span>
            <Calendar className="w-4 h-4 text-[#176087]" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {data?.estadisticas?.clasesPlanificadasSemana ?? 0}
          </div>
          <span className="text-[11px] text-slate-400">
            Bloques en tu horario semanal
          </span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Actividades por Calificar</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-600 mt-1">
            {data?.estadisticas?.actividadesPorCalificar ?? 0}
          </div>
          <span className="text-[11px] text-slate-400">
            Columnas pendientes
          </span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">% Asistencia del Mes</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 mt-1">
            {data?.estadisticas?.asistenciaPromedioMes ? `${data.estadisticas.asistenciaPromedioMes}%` : '0%'}
          </div>
          <span className="text-[11px] text-slate-400">
            {data?.estadisticas?.totalEstudiantes ?? 0} estudiantes activos
          </span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Unidades PUD Activas</span>
            <BookOpenCheck className="w-4 h-4 text-[#176087]" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {data?.estadisticas?.unidadesActivas ?? data?.estadisticas?.informesGenerados ?? 0}
          </div>
          <span className="text-[11px] text-slate-400">
            Planificaciones curriculares
          </span>
        </Card>
      </div>

      {/* 3. SECCIÓN INFERIOR — TO-DO SINCRONIZADO CON WORKSPACE KANBAN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#176087] dark:text-[#9ED8ED]" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Por Hacer (Sincronizado con Workspace)
              </h3>
              <InfoTooltip content="Tus pendientes aquí están sincronizados directamente con el Tablero Kanban de tu Workspace." />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#176087] dark:text-[#9ED8ED]">
                {todoList.filter((t) => !t.completada).length} pendientes
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTaskForm(!showTaskForm)}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showTaskForm ? 'Ocultar' : 'Nueva tarea'}</span>
              </Button>
            </div>
          </div>

          {showTaskForm && (
            <form
              onSubmit={handleAddTarea}
              className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3"
            >
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Título de la tarea
                </label>
                <input
                  type="text"
                  placeholder="Ej: Revisar ensayos de 8vo EGB..."
                  value={nuevaTareaTitulo}
                  onChange={(e) => setNuevaTareaTitulo(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Nivel de Urgencia
                  </label>
                  <select
                    value={nuevaTareaUrgencia}
                    onChange={(e) => setNuevaTareaUrgencia(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="Alta">Alta (Urgente)</option>
                    <option value="Media">Media (Esta semana)</option>
                    <option value="Baja">Baja (Proyectada)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Fecha límite
                  </label>
                  <input
                    type="date"
                    value={nuevaTareaFecha}
                    onChange={(e) => setNuevaTareaFecha(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Observaciones / Notas adicionales
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles o notas de la tarea..."
                  value={nuevaTareaObs}
                  onChange={(e) => setNuevaTareaObs(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowTaskForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={guardandoTarea}>
                  Guardar
                </Button>
              </div>
            </form>
          )}

          {/* Lista de tareas reales sincronizadas con Kanban */}
          {todoList.length === 0 ? (
            <EmptyState
              mensaje="No tienes tareas pendientes en tu tablero"
              submensaje="Crea una tarea aquí o en el Tablero Kanban de Workspace; ambas vistas se mantienen sincronizadas."
              accionTexto="Nueva tarea"
              onAccion={() => setShowTaskForm(true)}
              className="py-8"
            />
          ) : (
            <div className="space-y-2">
              {todoList.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all duration-150 flex items-start gap-3 ${
                    item.completada
                      ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                      : 'bg-white dark:bg-[#071727] border-slate-200/80 dark:border-slate-800 shadow-xs'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.completada}
                    onChange={() => handleToggleTodo(item)}
                    className="mt-1 w-4 h-4 rounded text-[#176087] cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className={`text-xs font-semibold text-slate-800 dark:text-slate-100 ${
                          item.completada ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {item.titulo}
                      </p>
                      {getUrgenciaBadge(item.urgencia)}
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {item.columna}
                      </span>
                      {item.fechaLimite && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" /> {item.fechaLimite}
                        </span>
                      )}
                    </div>
                    {item.observaciones && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {item.observaciones}
                      </p>
                    )}
                  </div>
                  <Link
                    to="/workspace"
                    className="text-xs font-bold text-[#176087] dark:text-[#9ED8ED] hover:underline shrink-0 self-center"
                  >
                    Ver en Kanban →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Últimas Actividades */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-1.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Actividad Reciente
            </h3>
            <InfoTooltip content="Registro de tus últimas acciones en el portal." />
          </div>

          {Array.isArray(data?.ultimasActividades) && data.ultimasActividades.length > 0 ? (
            <div className="space-y-3.5">
              {data.ultimasActividades.map((act: any, idx: number) => (
                <div key={act.id || idx} className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {act.accion || 'Actividad registrada'}
                    </p>
                    <p className="text-[11px] text-slate-500">{act.detalle || ''}</p>
                    <span className="text-[10px] text-slate-400">{act.tiempo || 'Reciente'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              Aún no tienes actividad reciente registrada.
            </div>
          )}
        </Card>
      </div>

      {/* Onboarding Dialog */}
      {showOnboarding && (
        <Modal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          title="¡Bienvenido a tu Espacio Docente en asap!"
        >
          <div className="space-y-4 py-2 text-xs text-slate-600 dark:text-slate-300">
            <p>
              Hemos configurado tu perfil como <strong>{user?.nombre}</strong> con tus paralelos asignados en la {institucionActiva?.nombre}.
            </p>
            <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800 space-y-1">
              <p className="font-bold text-sky-900 dark:text-sky-300">Flujo diario recomendado:</p>
              <p>1. Toma de asistencia al inicio del bloque.</p>
              <p>2. Registro continuo de calificaciones sin recargar.</p>
              <p>3. Gestión de unidades curriculares y actividades.</p>
            </div>
            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setShowOnboarding(false)}>
                Comenzar mi jornada
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DashboardPage;
