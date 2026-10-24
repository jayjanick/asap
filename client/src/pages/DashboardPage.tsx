import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Badge } from '../components/ui';
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
  Compass
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [nuevaTareaTexto, setNuevaTareaTexto] = useState('');

  const [todoList, setTodoList] = useState([
    {
      id: 't-1',
      titulo: 'Tomar asistencia de 9no EGB "B" (Jornada matutina)',
      urgencia: 'alta',
      modulo: 'Asistencia',
      link: '/asistencia/par-9no-b',
      completada: false
    },
    {
      id: 't-2',
      titulo: 'Calificar 4 micro-crónicas barriales pendientes en 8vo A',
      urgencia: 'media',
      modulo: 'Calificaciones',
      link: '/calificaciones',
      completada: false
    },
    {
      id: 't-3',
      titulo: 'Planificar Bloque 3: Textos Periodísticos con asistencia IA',
      urgencia: 'media',
      modulo: 'Planificación',
      link: '/planificacion',
      completada: false
    },
    {
      id: 't-4',
      titulo: 'Entregar reporte consolidado de asistencia a Inspección General',
      urgencia: 'baja',
      modulo: 'Workspace',
      link: '/workspace',
      completada: false
    }
  ]);

  useEffect(() => {
    if (searchParams.get('onboarding') === 'true') {
      setShowOnboarding(true);
    }
  }, [searchParams]);

  const handleToggleTodo = (id: string) => {
    setTodoList(
      todoList.map((t) => (t.id === id ? { ...t, completada: !t.completada } : t))
    );
  };

  const handleAddTarea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaTareaTexto.trim()) return;
    setTodoList([
      {
        id: `t-${Date.now()}`,
        titulo: nuevaTareaTexto.trim(),
        urgencia: 'media',
        modulo: 'Personal',
        link: '/workspace',
        completada: false
      },
      ...todoList
    ]);
    setNuevaTareaTexto('');
  };

  const fechaEcuador = new Date().toLocaleDateString('es-EC', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

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
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black capitalize mt-1 text-white">
                {fechaEcuador}
              </h2>
            </div>
            <Badge variant="frosted" className="self-start sm:self-auto">
              Colegio Vicente Rocafuerte
            </Badge>
          </div>

          {/* Clases del día */}
          <div className="mt-5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              Horario del Día
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Clase en curso */}
              <div className="p-3.5 rounded-xl bg-[#176087]/80 border border-[#9ED8ED]/40 flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    En Curso Ahora
                  </span>
                  <span className="text-xs font-mono font-bold text-white">07:15 - 08:45</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">8vo EGB "A" · Lengua y Literatura</h4>
                  <p className="text-xs text-[#9ED8ED] mt-0.5">Estructura del ensayo y conectores</p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] text-slate-200">Aula 204 · Bloque B</span>
                  <Link
                    to="/asistencia/par-8vo-a"
                    className="text-xs font-bold text-[#9ED8ED] hover:underline"
                  >
                    Ver asistencia →
                  </Link>
                </div>
              </div>

              {/* Siguiente clase */}
              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-700/60 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    Siguiente Clase
                  </span>
                  <span className="text-xs font-mono text-slate-300">10:00 - 11:30</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">9no EGB "B" · Lengua y Literatura</h4>
                  <p className="text-xs text-slate-300 mt-0.5">Taller de Métrica y Figuras Retóricas</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Aula 102 · Bloque C</span>
                  <Link
                    to="/asistencia/par-9no-b"
                    className="text-xs font-bold text-[#9ED8ED] hover:underline"
                  >
                    Tomar asistencia →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Acceso Rápido */}
        <Card className="p-6 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#176087] dark:text-[#9ED8ED]">
              Accesos Rápidos
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              Acciones Frecuentes
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <Link to="/asistencia/par-9no-b">
              <Button variant="primary" size="md" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Tomar asistencia ahora (9no B)
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link to="/workspace">
              <Button variant="outline" size="md" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nueva actividad pedagógica
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link to="/planificacion">
              <Button variant="outline" size="md" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#176087] dark:text-[#9ED8ED]" />
                  Generar planificación con IA
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link to="/calificaciones">
              <Button variant="ghost" size="md" className="w-full justify-between border border-slate-200 dark:border-slate-800">
                <span className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Ver libro de calificaciones
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* 2. MINI-CARDS DE ESTADÍSTICAS RÁPIDAS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Estudiantes Activos</span>
            <Users className="w-4 h-4 text-[#176087]" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">60</div>
          <span className="text-[11px] text-slate-400">8vo A (30) y 9no B (30)</span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Por Calificar</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-600 mt-1">5</div>
          <span className="text-[11px] text-slate-400">Entregas pendientes</span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Clases Esta Semana</span>
            <Calendar className="w-4 h-4 text-[#176087]" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">12</div>
          <span className="text-[11px] text-slate-400">9 planificadas / 3 dictadas</span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">% Asistencia Mes</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 mt-1">94.2%</div>
          <span className="text-[11px] text-slate-400">Promedio institucional</span>
        </Card>

        <Card className="p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Informes Oficiales</span>
            <FileText className="w-4 h-4 text-[#176087]" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">3</div>
          <span className="text-[11px] text-slate-400">Listos para exportar</span>
        </Card>
      </div>

      {/* 3. SECCIÓN INFERIOR — TO-DO INTELIGENTE Y ÚLTIMAS ACTIVIDADES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* To-Do Inteligente */}
        <Card className="lg:col-span-2 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#176087] dark:text-[#9ED8ED]" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Por Hacer (To-do Inteligente)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Priorizado automáticamente según pendientes de calificaciones y asistencia.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#176087] dark:text-[#9ED8ED]">
              {todoList.filter((t) => !t.completada).length} pendientes
            </span>
          </div>

          {/* Formulario para agregar tarea manual */}
          <form onSubmit={handleAddTarea} className="flex gap-2">
            <input
              type="text"
              placeholder="Añadir una tarea manual al flujo de hoy..."
              value={nuevaTareaTexto}
              onChange={(e) => setNuevaTareaTexto(e.target.value)}
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white focus:outline-none focus:border-[#176087]"
            />
            <Button type="submit" size="sm" variant="primary">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Añadir
            </Button>
          </form>

          {/* Lista de Tareas */}
          <div className="space-y-2">
            {todoList.map((t) => (
              <div
                key={t.id}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  t.completada
                    ? 'bg-slate-100/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-60'
                    : 'bg-white dark:bg-[#0A2239] border-slate-200/80 dark:border-slate-800 hover:border-[#176087]/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={t.completada}
                    onChange={() => handleToggleTodo(t.id)}
                    className="w-4 h-4 rounded text-[#176087] focus:ring-[#176087] cursor-pointer"
                  />
                  <div className="min-w-0">
                    <p className={`text-xs font-medium truncate ${t.completada ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {t.titulo}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                      <span>{t.modulo}</span>
                      <span>·</span>
                      <span className={t.urgencia === 'alta' ? 'text-rose-500 font-bold' : t.urgencia === 'media' ? 'text-amber-500' : 'text-slate-400'}>
                        Urgencia {t.urgencia}
                      </span>
                    </div>
                  </div>
                </div>

                <Link to={t.link}>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-[#176087] dark:text-[#9ED8ED]">
                    Ir
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>

        {/* Feed de Últimas Actividades */}
        <Card className="p-6 space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Últimas Actividades
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Historial reciente del flujo docente</p>
          </div>

          <div className="space-y-4">
            {[
              {
                id: '1',
                titulo: 'Asistencia registrada',
                desc: '8vo EGB "A" — 28 presentes, 1 atraso, 1 falta justificada.',
                time: 'Hace 45 min',
                icon: UserCheck,
                color: 'text-emerald-500'
              },
              {
                id: '2',
                titulo: 'Nueva actividad creada con IA',
                desc: 'Deber 2: Micro-crónica barrial asignada a 8vo A.',
                time: 'Hace 3 horas',
                icon: Sparkles,
                color: 'text-[#176087] dark:text-[#9ED8ED]'
              },
              {
                id: '3',
                titulo: 'Calificaciones guardadas',
                desc: 'Taller de Figuras Literarias en 9no B cerrado.',
                time: 'Ayer',
                icon: GraduationCap,
                color: 'text-amber-500'
              },
              {
                id: '4',
                titulo: 'Planificación curricular guardada',
                desc: 'Bloque 2 con destrezas MINEDUC completado al 70%.',
                time: 'Hace 2 días',
                icon: BookOpenCheck,
                color: 'text-indigo-500'
              }
            ].map((act) => {
              const Icon = act.icon;
              return (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <div className={`p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 ${act.color} shrink-0 mt-0.5`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {act.titulo}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">{act.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {act.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Onboarding Tour Modal (3 Pasos) */}
      <Modal
        isOpen={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
          setSearchParams({});
        }}
        title={`Bienvenido a asap, ${user?.nombre || 'Docente'}`}
        subtitle={`Paso ${onboardingStep} de 3 — Guía rápida de inicio`}
      >
        <div className="space-y-4 text-sm text-left">
          {onboardingStep === 1 && (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#176087]/20 text-[#176087] dark:text-[#9ED8ED] flex items-center justify-center">
                <Compass className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                1. Tu Panel Diario responde: ¿Qué tengo hoy y qué me falta?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Cada mañana al iniciar sesión verás la clase en curso, tu horario y una lista inteligente priorizada con tareas de asistencia y calificaciones pendientes.
              </p>
            </div>
          )}

          {onboardingStep === 2 && (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#9ED8ED]/30 text-[#0A2239] dark:text-[#9ED8ED] flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                2. Toma de asistencia ágil desde cualquier dispositivo
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Diseñado para usarse en menos de 60 segundos en el aula: botones directos de Presente, Atraso y Falta, con justificación automática y aviso de representante.
              </p>
            </div>
          )}

          {onboardingStep === 3 && (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                3. Inteligencia Artificial nativa alineada al MINEDUC
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Genera unidades curriculares completas, sugerencias de actividades y diagnóstico pedagógico con solo seleccionar el bloque y la destreza.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400">Tour de bienvenida</span>
            <div className="flex gap-2">
              {onboardingStep > 1 && (
                <Button size="sm" variant="outline" onClick={() => setOnboardingStep(onboardingStep - 1)}>
                  Atrás
                </Button>
              )}
              {onboardingStep < 3 ? (
                <Button size="sm" variant="primary" onClick={() => setOnboardingStep(onboardingStep + 1)}>
                  Siguiente
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setShowOnboarding(false);
                    setSearchParams({});
                  }}
                >
                  ¡Comenzar!
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardPage;
