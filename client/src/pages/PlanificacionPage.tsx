import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Badge, InfoTooltip, Skeleton, EmptyState } from '../components/ui';
import { Drawer } from '../components/ui/Dialogs';
import {
  BookOpenCheck,
  Sparkles,
  Calendar,
  CheckCircle2,
  Plus,
  ChevronRight,
  Play,
  Trash2,
  Paperclip,
  Download,
  FileText,
  Save,
  X,
  CheckSquare,
  Square
} from 'lucide-react';

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export interface ArchivoAdjuntoPlan {
  nombre: string;
  tipo: string;
  tamano: string;
  contenidoBase64: string;
  fecha: string;
}

export interface ClaseSecuenciaItem {
  semana: number;
  tema: string;
  contenido: string;
  actividad: string;
  actividadSugerida?: string;
  completada?: boolean;
}

export interface PlanificacionExtendida {
  id: string;
  paraleloId?: string;
  paralelo?: string;
  materia: string;
  bloque: number;
  titulo: string;
  destreza: string;
  semanas: number;
  fechaInicio?: string;
  fechaFin?: string;
  diasImparticion?: string[];
  progreso: number;
  estado: 'Por iniciar' | 'En curso' | 'Completado';
  generadaIA: boolean;
  objetivos: string[];
  recursos: string[];
  criteriosEvaluacion?: string[];
  secuenciaClases: ClaseSecuenciaItem[];
  archivosAdjuntos?: ArchivoAdjuntoPlan[];
}

export const PlanificacionPage: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [planificaciones, setPlanificaciones] = useState<PlanificacionExtendida[]>([]);
  const [cursosDocente, setCursosDocente] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPlanDetail, setSelectedPlanDetail] = useState<PlanificacionExtendida | null>(null);
  const [guardandoDetalle, setGuardandoDetalle] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState('');
  const [nuevoRecursoTexto, setNuevoRecursoTexto] = useState('');
  const [nuevoObjetivoTexto, setNuevoObjetivoTexto] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Formulario del Drawer de creación
  const todayISO = new Date().toISOString().slice(0, 10);
  const defaultEndISO = new Date(Date.now() + 28 * 86400000).toISOString().slice(0, 10);

  const [materia, setMateria] = useState('Lengua y Literatura');
  const [paraleloId, setParaleloId] = useState('');
  const [paralelo, setParalelo] = useState('');
  const [bloque, setBloque] = useState('Bloque 2');
  const [destreza, setDestreza] = useState(
    'LL.4.2.1. Utilizar recursos de la comunicación oral en contextos de intercambio social y debate.'
  );
  const [semanas, setSemanas] = useState(4);
  const [fechaInicio, setFechaInicio] = useState(todayISO);
  const [fechaFin, setFechaFin] = useState(defaultEndISO);
  const [diasImparticion, setDiasImparticion] = useState<string[]>(['Lunes', 'Miércoles', 'Viernes']);
  const [generando, setGenerando] = useState(false);
  const [resultadoIA, setResultadoIA] = useState<any | null>(null);

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
        if (planData?.planificaciones && Array.isArray(planData.planificaciones)) {
          setPlanificaciones(planData.planificaciones);
        }
        if (parData?.paralelos && Array.isArray(parData.paralelos) && parData.paralelos.length > 0) {
          setCursosDocente(parData.paralelos);
          setParaleloId(parData.paralelos[0].id);
          setParalelo(parData.paralelos[0].nombre);
          if (parData.paralelos[0].materia) {
            setMateria(parData.paralelos[0].materia);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const toggleDiaCreacion = (dia: string) => {
    setDiasImparticion((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  };

  const handleGenerarIA = async () => {
    setGenerando(true);
    try {
      const res = await fetch(`${API_URL}/api/planificacion/generar-ia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materia,
          bloque,
          destreza,
          nivel: paralelo || '8vo EGB',
          semanas
        })
      });
      if (res.ok) {
        const d = await res.json();
        const planGen = d.plan || {};
        setResultadoIA({
          tituloUnidad: planGen.tituloUnidad || `Unidad: ${destreza.slice(0, 40)}`,
          objetivos: Array.isArray(planGen.objetivos) ? planGen.objetivos : [],
          recursos: Array.isArray(planGen.recursos)
            ? planGen.recursos
            : ['Guía del docente', 'Material de lectura', 'Cuaderno de trabajo'],
          secuenciaClases: Array.isArray(planGen.secuenciaClases)
            ? planGen.secuenciaClases.map((sc: any, idx: number) => ({
                semana: sc.semana || idx + 1,
                tema: sc.tema || `Sesión ${idx + 1}`,
                contenido: sc.contenido || '',
                actividad: sc.actividad || sc.actividadSugerida || '',
                completada: false
              }))
            : []
        });
      }
    } catch (e) {
      setResultadoIA({
        tituloUnidad: `Unidad Didáctica: ${destreza.slice(0, 40)}...`,
        objetivos: [
          'Desarrollar las destrezas comunicativas y analíticas propuestas en la unidad.',
          'Aplicar actividades prácticas y participativas en el aula.'
        ],
        secuenciaClases: [
          {
            semana: 1,
            tema: 'Sesión 1: Exploración y diagnóstico del tema',
            contenido: 'Activación de conocimientos previos y lectura comprensiva.',
            actividad: 'Taller de análisis en parejas.',
            completada: false
          },
          {
            semana: 2,
            tema: 'Sesión 2: Aplicación práctica y retroalimentación',
            contenido: 'Desarrollo de ejercicios guiados y socialización.',
            actividad: 'Exposición breve de conclusiones.',
            completada: false
          }
        ],
        recursos: ['Texto guía', 'Pizarra', 'Cuaderno de trabajo'],
        generadaIA: true
      });
    } finally {
      setGenerando(false);
    }
  };

  const handleGuardarPlan = async () => {
    if (!resultadoIA) return;
    const bloqueNum = parseInt(String(bloque).replace(/\D/g, ''), 10) || 2;
    const secuenciaNormalizada: ClaseSecuenciaItem[] = (resultadoIA.secuenciaClases || []).map(
      (sc: any, idx: number) => ({
        semana: Number(sc.semana) || idx + 1,
        tema: sc.tema || `Sesión ${idx + 1}`,
        contenido: sc.contenido || '',
        actividad: sc.actividad || sc.actividadSugerida || '',
        actividadSugerida: sc.actividad || sc.actividadSugerida || '',
        completada: Boolean(sc.completada)
      })
    );

    const payload: Partial<PlanificacionExtendida> = {
      paraleloId,
      paralelo,
      materia,
      bloque: bloqueNum,
      titulo: resultadoIA.tituloUnidad || 'Nueva Unidad Curricular',
      destreza,
      semanas: Number(semanas) || Math.max(1, secuenciaNormalizada.length),
      fechaInicio,
      fechaFin,
      diasImparticion,
      progreso: 0,
      estado: 'Por iniciar',
      generadaIA: true,
      objetivos: resultadoIA.objetivos || [],
      recursos: resultadoIA.recursos || [],
      secuenciaClases: secuenciaNormalizada,
      archivosAdjuntos: []
    };

    try {
      const res = await fetch(`${API_URL}/api/planificacion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success && d.plan) {
          setPlanificaciones((prev) => [d.plan, ...prev]);
          setDrawerOpen(false);
          setResultadoIA(null);
          return;
        }
      }
    } catch (err) {
      console.warn('Error guardando planificación:', err);
    }
  };

  const persistirActualizacionPlan = async (planActualizado: PlanificacionExtendida) => {
    setGuardandoDetalle(true);
    setMensajeGuardado('');
    try {
      const res = await fetch(`${API_URL}/api/planificacion/${planActualizado.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(planActualizado)
      });
      if (res.ok) {
        const d = await res.json();
        const saved = d.plan || planActualizado;
        setPlanificaciones((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
        if (selectedPlanDetail?.id === saved.id) {
          setSelectedPlanDetail(saved);
        }
        setMensajeGuardado('Cambios guardados');
        setTimeout(() => setMensajeGuardado(''), 2500);
      }
    } catch (e) {
      console.warn('Error actualizando planificación:', e);
    } finally {
      setGuardandoDetalle(false);
    }
  };

  const handleIniciarUnidad = async (plan: PlanificacionExtendida, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const actualizado: PlanificacionExtendida = {
      ...plan,
      estado: 'En curso',
      fechaInicio: plan.fechaInicio || todayISO
    };
    setPlanificaciones((prev) => prev.map((p) => (p.id === plan.id ? actualizado : p)));
    if (selectedPlanDetail?.id === plan.id) {
      setSelectedPlanDetail(actualizado);
    }
    await persistirActualizacionPlan(actualizado);
  };

  const handleToggleClaseCompletada = async (idx: number) => {
    if (!selectedPlanDetail) return;
    const nuevasClases = selectedPlanDetail.secuenciaClases.map((sc, i) =>
      i === idx ? { ...sc, completada: !sc.completada } : sc
    );
    const total = nuevasClases.length;
    const completadas = nuevasClases.filter((c) => c.completada).length;
    const nuevoProgreso = total > 0 ? Math.round((completadas / total) * 100) : 0;
    const nuevoEstado: 'Por iniciar' | 'En curso' | 'Completado' =
      nuevoProgreso === 100
        ? 'Completado'
        : nuevoProgreso > 0 || selectedPlanDetail.estado === 'En curso'
        ? 'En curso'
        : 'Por iniciar';

    const actualizado: PlanificacionExtendida = {
      ...selectedPlanDetail,
      secuenciaClases: nuevasClases,
      progreso: nuevoProgreso,
      estado: nuevoEstado
    };
    setSelectedPlanDetail(actualizado);
    setPlanificaciones((prev) => prev.map((p) => (p.id === actualizado.id ? actualizado : p)));
    await persistirActualizacionPlan(actualizado);
  };

  const handleAdjuntarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPlanDetail) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = typeof reader.result === 'string' ? reader.result : '';
      const kb = Math.max(1, Math.round(file.size / 1024));
      const nuevoArchivo: ArchivoAdjuntoPlan = {
        nombre: file.name,
        tipo: file.type || 'application/octet-stream',
        tamano: `${kb} KB`,
        contenidoBase64: base64,
        fecha: new Date().toLocaleDateString('es-EC')
      };
      const actualizado: PlanificacionExtendida = {
        ...selectedPlanDetail,
        archivosAdjuntos: [...(selectedPlanDetail.archivosAdjuntos || []), nuevoArchivo]
      };
      setSelectedPlanDetail(actualizado);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDescargarAdjunto = (adj: ArchivoAdjuntoPlan) => {
    if (!adj.contenidoBase64) return;
    const link = document.createElement('a');
    link.href = adj.contenidoBase64;
    link.download = adj.nombre;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEliminarPlanificacion = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/planificacion/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setPlanificaciones((prev) => prev.filter((p) => p.id !== id));
        setSelectedPlanDetail(null);
      }
    } catch (e) {
      console.warn('Error eliminando planificación:', e);
    }
  };

  if (loading) return <Skeleton className="h-[500px] w-full" />;
  if (!data) return <EmptyState mensaje="No hay datos aún" />;

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpenCheck className="w-6 h-6 text-[#176087] dark:text-[#9ED8ED]" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Planificación Curricular
            </h2>
            <InfoTooltip content="Unidades microcurriculares PUD alineadas al Currículo Nacional MINEDUC con control de fechas, días de clase, avance por sesión y recursos adjuntos." />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/planificacion/calendario">
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-1.5" />
              Ver Calendario Mensual
            </Button>
          </Link>

          <Button variant="primary" size="sm" onClick={() => setDrawerOpen(true)}>
            <Sparkles className="w-4 h-4 mr-1.5" />
            Nueva planificación con IA
          </Button>
        </div>
      </div>

      {/* Bloques Curriculares Grid / Empty State */}
      {planificaciones.length === 0 ? (
        <EmptyState
          mensaje="Aún no has creado planificaciones"
          submensaje="Crea tu primera unidad microcurricular PUD asistida por IA alineada al currículo nacional ecuatoriano."
          accionTexto="Nueva planificación con IA"
          onAccion={() => setDrawerOpen(true)}
          icon={<BookOpenCheck className="w-12 h-12 text-slate-400" />}
          className="py-16"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {planificaciones.map((plan) => {
            const isEnCurso = plan.estado === 'En curso';
            const isCompletado = plan.estado === 'Completado';
            const clasesTotales = plan.secuenciaClases?.length || 0;
            const clasesCompletadas = (plan.secuenciaClases || []).filter((c) => c.completada).length;

            return (
              <Card
                key={plan.id}
                className="p-6 flex flex-col justify-between hover:shadow-xl transition-all border-slate-200 dark:border-slate-800 space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant={isCompletado ? 'success' : isEnCurso ? 'primary' : 'outline'}>
                        {plan.estado}
                      </Badge>
                      {plan.paralelo && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {plan.paralelo}
                        </span>
                      )}
                    </div>

                    {plan.generadaIA && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#176087] dark:text-[#9ED8ED] bg-[#9ED8ED]/20 px-2 py-0.5 rounded-md shrink-0">
                        <Sparkles className="w-3 h-3" /> IA MINEDUC
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {plan.titulo}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3">
                    {plan.destreza}
                  </p>

                  {(plan.fechaInicio || (plan.diasImparticion && plan.diasImparticion.length > 0)) && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {plan.fechaInicio && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#176087] dark:text-[#9ED8ED]" />
                          <span>
                            {plan.fechaInicio}
                            {plan.fechaFin ? ` al ${plan.fechaFin}` : ''}
                          </span>
                        </div>
                      )}
                      {plan.diasImparticion && plan.diasImparticion.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {plan.diasImparticion.map((d) => (
                            <span
                              key={d}
                              className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                            >
                              {d.slice(0, 3)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">Progreso curricular</span>
                    <span className="font-mono text-[#176087] dark:text-[#9ED8ED]">{plan.progreso}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        plan.progreso === 100 ? 'bg-emerald-500' : 'bg-[#176087]'
                      }`}
                      style={{ width: `${plan.progreso}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>{plan.semanas} semanas</span>
                    <span>
                      {clasesCompletadas}/{clasesTotales} clases completadas
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  {plan.estado === 'Por iniciar' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => handleIniciarUnidad(plan, e)}
                      className="w-full text-xs justify-center"
                    >
                      <Play className="w-3.5 h-3.5 mr-1.5" />
                      <span>Iniciar unidad</span>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPlanDetail(plan)}
                    className="w-full text-xs text-[#176087] dark:text-[#9ED8ED] justify-between border border-slate-200 dark:border-slate-800"
                  >
                    <span>Ver secuencia y destrezas</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* DRAWER DE GENERACIÓN CON IA */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Nueva Planificación Microcurricular"
        subtitle="Configura fechas, días de clase y genera o edita las actividades de la unidad"
      >
        <div className="space-y-5 text-left">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Curso / Paralelo
                </label>
                {cursosDocente.length > 0 ? (
                  <select
                    value={paraleloId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setParaleloId(id);
                      const found = cursosDocente.find((c) => c.id === id);
                      if (found) {
                        setParalelo(found.nombre);
                        if (found.materia) setMateria(found.materia);
                      }
                    }}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
                  >
                    {cursosDocente.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder='Ej: 8vo EGB "A"'
                    value={paralelo}
                    onChange={(e) => setParalelo(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727]"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Asignatura
                </label>
                <input
                  type="text"
                  value={materia}
                  onChange={(e) => setMateria(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bloque Curricular
                </label>
                <select
                  value={bloque}
                  onChange={(e) => setBloque(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727]"
                >
                  <option value="Bloque 1">Bloque 1</option>
                  <option value="Bloque 2">Bloque 2</option>
                  <option value="Bloque 3">Bloque 3</option>
                  <option value="Bloque 4">Bloque 4</option>
                  <option value="Bloque 5">Bloque 5</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Duración (semanas)
                </label>
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={semanas}
                  onChange={(e) => setSemanas(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727]"
                />
              </div>
            </div>

            {/* Fechas de inicio y fin */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fecha de inicio
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fecha de finalización
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Días en que se imparte */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Días de la semana en que se imparte
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DIAS_SEMANA.map((dia) => {
                  const active = diasImparticion.includes(dia);
                  return (
                    <button
                      key={dia}
                      type="button"
                      onClick={() => toggleDiaCreacion(dia)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        active
                          ? 'bg-[#176087] text-white border-[#176087]'
                          : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {dia}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Destreza con Criterio de Desempeño (DCD) y contexto
              </label>
              <textarea
                rows={3}
                value={destreza}
                onChange={(e) => setDestreza(e.target.value)}
                placeholder="Describe la destreza, indicadores y enfoque que deseas trabajar en esta unidad..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727]"
              />
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleGenerarIA}
              isLoading={generando}
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generar propuesta de unidad con IA
            </Button>
          </div>

          {/* Resultado de la IA para revisar y editar antes de guardar */}
          {resultadoIA && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Propuesta lista para personalizar
                </span>
                <span className="text-[10px] text-slate-400">Puedes editar o quitar actividades</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Título de la Unidad
                </label>
                <input
                  type="text"
                  value={resultadoIA.tituloUnidad}
                  onChange={(e) => setResultadoIA({ ...resultadoIA, tituloUnidad: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#071727]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">
                    Secuencia de Clases y Actividades ({resultadoIA.secuenciaClases?.length || 0})
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setResultadoIA({
                        ...resultadoIA,
                        secuenciaClases: [
                          ...(resultadoIA.secuenciaClases || []),
                          {
                            semana: (resultadoIA.secuenciaClases?.length || 0) + 1,
                            tema: `Sesión ${(resultadoIA.secuenciaClases?.length || 0) + 1}`,
                            contenido: '',
                            actividad: '',
                            completada: false
                          }
                        ]
                      })
                    }
                    className="text-[11px] font-bold text-[#176087] dark:text-[#9ED8ED] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar sesión
                  </button>
                </div>

                <div className="space-y-2.5">
                  {resultadoIA.secuenciaClases?.map((clase: any, i: number) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#071727] text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={clase.tema || ''}
                          onChange={(e) => {
                            const list = [...resultadoIA.secuenciaClases];
                            list[i] = { ...list[i], tema: e.target.value };
                            setResultadoIA({ ...resultadoIA, secuenciaClases: list });
                          }}
                          placeholder="Tema de la clase"
                          className="flex-1 font-bold text-[#176087] dark:text-[#9ED8ED] bg-white dark:bg-[#0A2239] px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const list = resultadoIA.secuenciaClases.filter((_: any, idx: number) => idx !== i);
                            setResultadoIA({ ...resultadoIA, secuenciaClases: list });
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded cursor-pointer"
                          title="Eliminar esta actividad"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={clase.contenido || ''}
                        onChange={(e) => {
                          const list = [...resultadoIA.secuenciaClases];
                          list[i] = { ...list[i], contenido: e.target.value };
                          setResultadoIA({ ...resultadoIA, secuenciaClases: list });
                        }}
                        placeholder="Contenido y desarrollo metodológico..."
                        className="w-full text-[11px] bg-white dark:bg-[#0A2239] px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700"
                      />
                      <input
                        type="text"
                        value={clase.actividad || clase.actividadSugerida || ''}
                        onChange={(e) => {
                          const list = [...resultadoIA.secuenciaClases];
                          list[i] = {
                            ...list[i],
                            actividad: e.target.value,
                            actividadSugerida: e.target.value
                          };
                          setResultadoIA({ ...resultadoIA, secuenciaClases: list });
                        }}
                        placeholder="Actividad evaluativa o taller práctico..."
                        className="w-full text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-white dark:bg-[#0A2239] px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <Button variant="outline" size="sm" className="w-1/2" onClick={() => setResultadoIA(null)}>
                  Descartar
                </Button>
                <Button variant="primary" size="sm" className="w-1/2" onClick={handleGuardarPlan}>
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* DRAWER INTERACTIVO DE DETALLE Y EDICIÓN DE PLANIFICACIÓN */}
      {selectedPlanDetail && (
        <Drawer
          isOpen={Boolean(selectedPlanDetail)}
          onClose={() => setSelectedPlanDetail(null)}
          title={selectedPlanDetail.titulo}
          subtitle={`${selectedPlanDetail.materia}${selectedPlanDetail.paralelo ? ` · ${selectedPlanDetail.paralelo}` : ''} · ${selectedPlanDetail.progreso}% completado`}
        >
          <div className="space-y-6 text-left text-xs">
            {/* Barra de Estado e Inicio de Unidad */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#071727] border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Estado:</span>
                <select
                  value={selectedPlanDetail.estado}
                  onChange={(e) => {
                    const nuevoEstado = e.target.value as 'Por iniciar' | 'En curso' | 'Completado';
                    const nuevoProgreso =
                      nuevoEstado === 'Completado' ? 100 : selectedPlanDetail.progreso;
                    setSelectedPlanDetail({
                      ...selectedPlanDetail,
                      estado: nuevoEstado,
                      progreso: nuevoProgreso
                    });
                  }}
                  className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A2239] text-slate-900 dark:text-white"
                >
                  <option value="Por iniciar">Por iniciar</option>
                  <option value="En curso">En curso</option>
                  <option value="Completado">Completado</option>
                </select>

                {selectedPlanDetail.estado === 'Por iniciar' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleIniciarUnidad(selectedPlanDetail)}
                    className="text-xs py-1 px-2.5 h-7"
                  >
                    <Play className="w-3 h-3 mr-1" /> Iniciar ahora
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {mensajeGuardado && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    ✓ {mensajeGuardado}
                  </span>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={guardandoDetalle}
                  onClick={() => persistirActualizacionPlan(selectedPlanDetail)}
                  className="text-xs py-1 px-3 h-8"
                >
                  <Save className="w-3.5 h-3.5 mr-1" /> Guardar
                </Button>
              </div>
            </div>

            {/* Datos Generales, Fechas y Días */}
            <div className="space-y-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A2239]">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Título de la Unidad
                </label>
                <input
                  type="text"
                  value={selectedPlanDetail.titulo}
                  onChange={(e) =>
                    setSelectedPlanDetail({ ...selectedPlanDetail, titulo: e.target.value })
                  }
                  className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071727] text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={selectedPlanDetail.fechaInicio || ''}
                    onChange={(e) =>
                      setSelectedPlanDetail({ ...selectedPlanDetail, fechaInicio: e.target.value })
                    }
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071727]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Fecha de Fin
                  </label>
                  <input
                    type="date"
                    value={selectedPlanDetail.fechaFin || ''}
                    onChange={(e) =>
                      setSelectedPlanDetail({ ...selectedPlanDetail, fechaFin: e.target.value })
                    }
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071727]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Días de Clase
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DIAS_SEMANA.map((dia) => {
                    const diasActuales = selectedPlanDetail.diasImparticion || [];
                    const activo = diasActuales.includes(dia);
                    return (
                      <button
                        key={dia}
                        type="button"
                        onClick={() => {
                          const next = activo
                            ? diasActuales.filter((d) => d !== dia)
                            : [...diasActuales, dia];
                          setSelectedPlanDetail({ ...selectedPlanDetail, diasImparticion: next });
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                          activo
                            ? 'bg-[#176087] text-white border-[#176087]'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {dia}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Destreza con Criterio de Desempeño y Especificaciones del Contenido
                </label>
                <textarea
                  rows={3}
                  value={selectedPlanDetail.destreza}
                  onChange={(e) =>
                    setSelectedPlanDetail({ ...selectedPlanDetail, destreza: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071727] text-slate-800 dark:text-slate-200 leading-relaxed"
                />
              </div>
            </div>

            {/* Objetivos editables */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Objetivos de Aprendizaje
              </span>
              <div className="space-y-1.5">
                {(selectedPlanDetail.objetivos || []).map((obj, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={obj}
                      onChange={(e) => {
                        const next = [...selectedPlanDetail.objetivos];
                        next[idx] = e.target.value;
                        setSelectedPlanDetail({ ...selectedPlanDetail, objetivos: next });
                      }}
                      className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0A2239]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = selectedPlanDetail.objetivos.filter((_, i) => i !== idx);
                        setSelectedPlanDetail({ ...selectedPlanDetail, objetivos: next });
                      }}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded cursor-pointer"
                      title="Eliminar objetivo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Agregar nuevo objetivo específico..."
                    value={nuevoObjetivoTexto}
                    onChange={(e) => setNuevoObjetivoTexto(e.target.value)}
                    className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071727]"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!nuevoObjetivoTexto.trim()) return;
                      setSelectedPlanDetail({
                        ...selectedPlanDetail,
                        objetivos: [...(selectedPlanDetail.objetivos || []), nuevoObjetivoTexto.trim()]
                      });
                      setNuevoObjetivoTexto('');
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Secuencia de Clases Interactiva (Check por clase + Edición + Eliminar + Agregar) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Secuencia de Clases y Actividades ({selectedPlanDetail.secuenciaClases.length})
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Marca cada sesión completada para actualizar el porcentaje de avance automáticamente
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const nuevaSesion: ClaseSecuenciaItem = {
                      semana: selectedPlanDetail.secuenciaClases.length + 1,
                      tema: `Sesión ${selectedPlanDetail.secuenciaClases.length + 1}: Nuevo tema`,
                      contenido: '',
                      actividad: '',
                      completada: false
                    };
                    setSelectedPlanDetail({
                      ...selectedPlanDetail,
                      secuenciaClases: [...selectedPlanDetail.secuenciaClases, nuevaSesion]
                    });
                  }}
                  className="text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Agregar clase
                </Button>
              </div>

              <div className="space-y-3">
                {selectedPlanDetail.secuenciaClases.map((sc, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border transition-colors space-y-2.5 ${
                      sc.completada
                        ? 'border-emerald-300/70 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/15'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A2239]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleClaseCompletada(idx)}
                        className="flex items-center gap-2 text-left cursor-pointer group"
                      >
                        {sc.completada ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 group-hover:text-[#176087] shrink-0" />
                        )}
                        <span
                          className={`text-[11px] font-bold ${
                            sc.completada
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {sc.completada ? 'Clase impartida' : 'Marcar como impartida'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const nuevas = selectedPlanDetail.secuenciaClases.filter((_, i) => i !== idx);
                          const done = nuevas.filter((c) => c.completada).length;
                          const prog = nuevas.length > 0 ? Math.round((done / nuevas.length) * 100) : 0;
                          setSelectedPlanDetail({
                            ...selectedPlanDetail,
                            secuenciaClases: nuevas,
                            progreso: prog
                          });
                        }}
                        className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded cursor-pointer"
                        title="Eliminar esta clase/actividad"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                        Tema de la sesión
                      </label>
                      <input
                        type="text"
                        value={sc.tema}
                        onChange={(e) => {
                          const nuevas = [...selectedPlanDetail.secuenciaClases];
                          nuevas[idx] = { ...nuevas[idx], tema: e.target.value };
                          setSelectedPlanDetail({ ...selectedPlanDetail, secuenciaClases: nuevas });
                        }}
                        className="w-full text-xs font-bold text-[#176087] dark:text-[#9ED8ED] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071727]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                        Contenido y desarrollo explícito de la clase
                      </label>
                      <textarea
                        rows={2}
                        value={sc.contenido}
                        onChange={(e) => {
                          const nuevas = [...selectedPlanDetail.secuenciaClases];
                          nuevas[idx] = { ...nuevas[idx], contenido: e.target.value };
                          setSelectedPlanDetail({ ...selectedPlanDetail, secuenciaClases: nuevas });
                        }}
                        placeholder="Detalla los conceptos, ejemplos, páginas del texto o pasos metodológicos..."
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071727] text-slate-700 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                        Actividad de aprendizaje / evaluación
                      </label>
                      <input
                        type="text"
                        value={sc.actividad || sc.actividadSugerida || ''}
                        onChange={(e) => {
                          const nuevas = [...selectedPlanDetail.secuenciaClases];
                          nuevas[idx] = {
                            ...nuevas[idx],
                            actividad: e.target.value,
                            actividadSugerida: e.target.value
                          };
                          setSelectedPlanDetail({ ...selectedPlanDetail, secuenciaClases: nuevas });
                        }}
                        placeholder="Describe la actividad o tarea para los estudiantes..."
                        className="w-full text-xs font-semibold text-emerald-700 dark:text-emerald-400 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071727]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recursos Didácticos y Archivos Adjuntos */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Recursos Didácticos y Archivos de Apoyo
              </span>

              {/* Recursos en texto / enlaces */}
              <div className="flex flex-wrap gap-1.5">
                {(selectedPlanDetail.recursos || []).map((rec, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs"
                  >
                    <span>{rec}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = selectedPlanDetail.recursos.filter((_, i) => i !== idx);
                        setSelectedPlanDetail({ ...selectedPlanDetail, recursos: next });
                      }}
                      className="text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Agregar recurso bibliográfico, enlace o material..."
                  value={nuevoRecursoTexto}
                  onChange={(e) => setNuevoRecursoTexto(e.target.value)}
                  className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071727]"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!nuevoRecursoTexto.trim()) return;
                    setSelectedPlanDetail({
                      ...selectedPlanDetail,
                      recursos: [...(selectedPlanDetail.recursos || []), nuevoRecursoTexto.trim()]
                    });
                    setNuevoRecursoTexto('');
                  }}
                >
                  Agregar recurso
                </Button>
              </div>

              {/* Archivos Adjuntos */}
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Archivos adjuntos de la unidad ({selectedPlanDetail.archivosAdjuntos?.length || 0})
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleAdjuntarArchivo}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs"
                  >
                    <Paperclip className="w-3.5 h-3.5 mr-1" /> Adjuntar archivo
                  </Button>
                </div>

                {(selectedPlanDetail.archivosAdjuntos || []).length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">
                    No hay archivos adjuntos. Puedes subir guías PDF, diapositivas, lecturas o rúbricas para organizar la asignatura.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {(selectedPlanDetail.archivosAdjuntos || []).map((adj, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#071727]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-[#176087] dark:text-[#9ED8ED] shrink-0" />
                          <div className="truncate">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {adj.nombre}
                            </p>
                            <span className="text-[10px] text-slate-400">
                              {adj.tamano} {adj.fecha ? `· ${adj.fecha}` : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDescargarAdjunto(adj)}
                            className="p-1.5 text-[#176087] dark:text-[#9ED8ED] hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded cursor-pointer"
                            title="Descargar archivo"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const next = (selectedPlanDetail.archivosAdjuntos || []).filter(
                                (_, i) => i !== idx
                              );
                              setSelectedPlanDetail({
                                ...selectedPlanDetail,
                                archivosAdjuntos: next
                              });
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded cursor-pointer"
                            title="Quitar archivo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer de acciones */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEliminarPlanificacion(selectedPlanDetail.id)}
                className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/30"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar unidad
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedPlanDetail(null)}>
                  Cerrar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={guardandoDetalle}
                  onClick={() => persistirActualizacionPlan(selectedPlanDetail)}
                >
                  <Save className="w-3.5 h-3.5 mr-1" /> Guardar
                </Button>
              </div>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};

export default PlanificacionPage;
