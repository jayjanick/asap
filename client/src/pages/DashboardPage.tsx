import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Badge, InfoTooltip, Skeleton, EmptyState } from '../components/ui';
import { Modal } from '../components/ui/Dialogs';
import {
  Calendar,
  Clock,
  UserCheck,
  GraduationCap,
  Sparkles,
  BookOpenCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  FileText,
  Users,
  Compass,
  AlertTriangle
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, token, institucionActiva } = useAuth();
  const [searchParams] = useSearchParams();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [todoList, setTodoList] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (Array.isArray(d?.porHacerInteligente) && d.porHacerInteligente.length > 0) {
          setTodoList(
            d.porHacerInteligente.map((t: any, i: number) => ({
              id: `t-smart-${i}`,
              titulo: t.titulo || t.texto || t,
              urgencia: t.urgencia || 'Media',
              fechaLimite: t.fechaLimite || new Date().toISOString().slice(0, 10),
              observaciones: t.observaciones || t.motivo || 'Generado por análisis del paralelo.',
              modulo: t.modulo || 'Asistencia',
              link: t.link || '/asistencia',
              completada: false
            }))
          );
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Formulario de tarea con urgencia, fecha límite y observaciones (P3.2)
  const [nuevaTareaTitulo, setNuevaTareaTitulo] = useState('');
  const [nuevaTareaUrgencia, setNuevaTareaUrgencia] = useState<'Alta' | 'Media' | 'Baja'>('Media');
  const [nuevaTareaFecha, setNuevaTareaFecha] = useState('');
  const [nuevaTareaObs, setNuevaTareaObs] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Cálculo de hora en tiempo real para determinar clase en curso
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (searchParams.get('onboarding') === 'true') {
      setShowOnboarding(true);
    }
  }, [searchParams]);

  if (loading) return <Skeleton className="h-[600px] w-full" />;
  if (!data) return <EmptyState mensaje="No hay datos aún" />;

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  // Horario del docente Andrés Morales:
  // 07:15 (435m) a 08:45 (525m): 8vo A
  // 08:45 (525m) a 10:00 (600m): 9no B
  // 10:00 a 10:30: Receso
  // 10:30 a 11:45: Refuerzo / Tutoría
  let claseEnCurso = null;
  if (currentMinutes >= 435 && currentMinutes < 525) {
    claseEnCurso = {
      paralelo: '8vo EGB "A"',
      materia: 'Lengua y Literatura',
      aula: 'Aula 204 · Bloque B',
      horario: '07:15 - 08:45',
      tema: 'Estructura del ensayo y conectores argumentativos',
      link: '/asistencia/par-8vo-a'
    };
  } else if (currentMinutes >= 525 && currentMinutes < 600) {
    claseEnCurso = {
      paralelo: '9no EGB "B"',
      materia: 'Lengua y Literatura',
      aula: 'Aula 102 · Bloque C',
      horario: '08:45 - 10:00',
      tema: 'Métrica y recursos estilísticos en la poesía lírica',
      link: '/asistencia/par-9no-b'
    };
  }

  const handleToggleTodo = (id: string) => {
    setTodoList(
      todoList.map((t) => (t.id === id ? { ...t, completada: !t.completada } : t))
    );
  };

  const handleAddTarea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaTareaTitulo.trim()) return;

    setTodoList([
      {
        id: `t-${Date.now()}`,
        titulo: nuevaTareaTitulo.trim(),
        urgencia: nuevaTareaUrgencia,
        fechaLimite: nuevaTareaFecha || new Date().toISOString().slice(0, 10),
        observaciones: nuevaTareaObs.trim(),
        modulo: 'Personal',
        link: '/workspace',
        completada: false
      },
      ...todoList
    ]);

    setNuevaTareaTitulo('');
    setNuevaTareaObs('');
    setNuevaTareaFecha('');
    setShowTaskForm(false);
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
        {/* Card Hoy */}
        <Card className="lg:col-span-2 p-6 bg-gradient-to-br from-[#0A2239] to-[#12365a] text-white relative overflow-hidden border-none shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-700/80 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#9ED8ED] uppercase tracking-wider">
                  Jornada Matutina · Régimen Costa
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

          {/* Clases del día */}
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Horario del Día
              </span>
              <InfoTooltip content="Muestra la clase activa y la siguiente según tu carga horaria semanal." />
            </div>

            <div className="grid grid-cols-1 gap-3">
              {data?.resumenHoy?.claseActual ? (
                <div className="p-3.5 rounded-xl bg-[#176087]/80 border border-[#9ED8ED]/40 flex flex-col justify-between relative overflow-hidden">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      En Curso Ahora
                    </span>
                    <span className="text-xs font-mono font-bold text-white">{data.resumenHoy.claseActual.horario}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{data.resumenHoy.claseActual.paralelo} · {data.resumenHoy.claseActual.materia}</h4>
                    <p className="text-xs text-[#9ED8ED] mt-0.5">{data.resumenHoy.claseActual.tema || 'Actividad docente'}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[11px] text-slate-200">{data.resumenHoy.claseActual.aula || 'Aula asignada'}</span>
                    <Link
                      to="/asistencia"
                      className="text-xs font-bold text-[#9ED8ED] hover:underline"
                    >
                      Tomar asistencia →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/50 flex flex-col items-center justify-center text-center py-6">
                  <Clock className="w-5 h-5 text-slate-400 mb-1.5" />
                  <h4 className="text-sm font-semibold text-slate-300">Sin clases en curso ahora</h4>
                  <p className="text-xs text-slate-400 mt-0.5">No hay bloques de clase programados para este momento.</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Acceso Rápido */}
        <Card className="p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#176087] dark:text-[#9ED8ED]">
                Accesos Rápidos
              </span>
              <InfoTooltip content="Atajos directos para tus acciones diarias más frecuentes." />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              Acciones Frecuentes
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <Link to="/asistencia">
              <Button variant="primary" size="md" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Tomar asistencia hoy
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link to="/workspace">
              <Button variant="outline" size="md" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nueva tarea en Workspace
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link to="/planificacion">
              <Button variant="outline" size="md" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#176087] dark:text-[#9ED8ED]" />
                  Generar PUD con IA
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link to="/calificaciones">
              <Button variant="ghost" size="md" className="w-full justify-between border border-slate-200 dark:border-slate-800">
                <span className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Libro de calificaciones
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* 2. STATS RÁPIDAS (Dinámicas desde MongoDB) */}
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
            Horas lectivas semanales
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
            Tareas pendientes
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
            {data?.estadisticas?.informesGenerados ?? 0}
          </div>
          <span className="text-[11px] text-slate-400">
            Planificaciones curriculares
          </span>
        </Card>
      </div>

      {/* 3. SECCIÓN INFERIOR — TO-DO CON CAMPOS COMPLETOS Y ACTIVIDADES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* To-Do Inteligente */}
        <Card className="lg:col-span-2 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#176087] dark:text-[#9ED8ED]" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Por Hacer (To-do Docente)
              </h3>
              <InfoTooltip content="Lista priorizada automáticamente de tus pendientes diarios con semáforo de urgencia y fecha límite." />
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

          {/* Formulario desplegable con Urgencia, Fecha límite y Observaciones (P3.2) */}
          {showTaskForm && (
            <form onSubmit={handleAddTarea} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Título de la tarea
                </label>
                <input
                  type="text"
                  placeholder="Ej: Preparar material para el bloque 3..."
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
                    <option value="Alta">🔴 Alta (Urgente hoy / mañana)</option>
                    <option value="Media">🟡 Media (Esta semana)</option>
                    <option value="Baja">🔵 Baja (Proyectada)</option>
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
                  placeholder="Notas adicionales, estudiantes involucrados o acuerdos pedagógicos..."
                  value={nuevaTareaObs}
                  onChange={(e) => setNuevaTareaObs(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowTaskForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Guardar Tarea
                </Button>
              </div>
            </form>
          )}

          {/* Lista de tareas */}
          {todoList.length === 0 ? (
            <EmptyState
              mensaje="Aún no has creado tareas"
              submensaje="Agrega pendientes o recordatorios docentes para mantenerte organizado."
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
                    onChange={() => handleToggleTodo(item.id)}
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
                  {item.link && (
                    <Link
                      to={item.link}
                      className="text-xs font-bold text-[#176087] dark:text-[#9ED8ED] hover:underline shrink-0 self-center"
                    >
                      Ir →
                    </Link>
                  )}
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
            <InfoTooltip content="Registro histórico de tus últimas modificaciones en asistencia, notas y planes." />
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
              <p>3. Generación automática de unidades PUD con IA.</p>
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
