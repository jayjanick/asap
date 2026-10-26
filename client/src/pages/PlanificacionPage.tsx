import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Badge, InfoTooltip, Skeleton, EmptyState } from '../components/ui';
import type { PlanificacionUnidad } from '../data/mockData';
import { Drawer } from '../components/ui/Dialogs';
import {
  BookOpenCheck,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  BookOpen,
  Layers,
  ChevronRight,
  TrendingUp,
  FileCheck
} from 'lucide-react';

export const PlanificacionPage: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [planificaciones, setPlanificaciones] = useState<PlanificacionUnidad[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPlanDetail, setSelectedPlanDetail] = useState<PlanificacionUnidad | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/planificacion`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (d?.planificaciones && Array.isArray(d.planificaciones)) {
          setPlanificaciones(d.planificaciones);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Formulario del Drawer de IA
  const [materia, setMateria] = useState('Lengua y Literatura');
  const [paralelo, setParalelo] = useState('8vo EGB "A"');
  const [bloque, setBloque] = useState('Bloque 2');
  const [destreza, setDestreza] = useState('LL.4.2.1. Utilizar recursos de la comunicación oral en contextos de intercambio social y debate.');
  const [semanas, setSemanas] = useState(4);
  const [generando, setGenerando] = useState(false);
  const [resultadoIA, setResultadoIA] = useState<any | null>(null);

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
          nivel: paralelo,
          semanas
        })
      });
      if (res.ok) {
        const data = await res.json();
        setResultadoIA(data.plan);
      }
    } catch (e) {
      console.warn('Fallback local de IA:', e);
      // Fallback si la API no está disponible
      setResultadoIA({
        tituloUnidad: `Unidad Didáctica: ${destreza.slice(0, 40)}...`,
        objetivos: [
          'Apropiar las estrategias comunicativas orales y escritas del currículo ecuatoriano.',
          'Formular argumentos sustentados en evidencias empíricas y lecturas reflexivas.'
        ],
        criteriosEvaluacion: [
          'CE.LL.4.2. Desarrolla discursos estructurados empleando técnicas de debate formal.'
        ],
        secuenciaClases: [
          {
            semana: 1,
            tema: 'Semana 1: Análisis de fuentes y tipos de argumentos',
            contenido: 'Lectura crítica de editoriales y clasificación de argumentos lógicos.',
            actividadSugerida: 'Taller de fichas de lectura en parejas.'
          },
          {
            semana: 2,
            tema: 'Semana 2: Preparación del panel de discusión',
            contenido: 'Estructura de la tesis, preguntas guía y tiempos de intervención.',
            actividadSugerida: 'Simulación de panel con moderador rotativo.'
          }
        ],
        recursos: ['Guía del estudiante MINEDUC', 'Textos seleccionados', 'Cuaderno de trabajo'],
        generadaIA: true
      });
    } finally {
      setGenerando(false);
    }
  };

  const handleGuardarPlan = async () => {
    if (!resultadoIA) return;
    const nuevoPlan: PlanificacionUnidad = {
      id: `plan-${Date.now()}`,
      materia,
      bloque: 4,
      titulo: resultadoIA.tituloUnidad || 'Nueva Unidad con IA',
      destreza,
      semanas,
      progreso: 0,
      estado: 'Por iniciar',
      generadaIA: true,
      objetivos: resultadoIA.objetivos || [],
      recursos: resultadoIA.recursos || [],
      secuenciaClases: resultadoIA.secuenciaClases || []
    };

    setPlanificaciones((prev) => [...prev, nuevoPlan]);
    setDrawerOpen(false);
    setResultadoIA(null);

    try {
      const res = await fetch(`${API_URL}/api/planificacion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(nuevoPlan)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.plan) {
          setPlanificaciones((prev) =>
            prev.map((p) => (p.id === nuevoPlan.id ? { ...p, id: data.plan.id || data.plan._id } : p))
          );
        }
      }
    } catch (err) {
      console.warn('Error persistiendo plan curricular en MongoDB:', err);
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
            <InfoTooltip content="Unidades microcurriculares PUD alineadas al Currículo Nacional del Ministerio de Educación del Ecuador (MINEDUC) con asistencia de Gemini." />
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

            return (
              <Card
                key={plan.id}
                className="p-6 flex flex-col justify-between hover:shadow-xl transition-all border-slate-200 dark:border-slate-800 space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <Badge
                      variant={isCompletado ? 'success' : isEnCurso ? 'primary' : 'outline'}
                    >
                      {plan.estado}
                    </Badge>

                    {plan.generadaIA && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#176087] dark:text-[#9ED8ED] bg-[#9ED8ED]/20 px-2 py-0.5 rounded-full">
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
                </div>

                {/* Progress Ring / Bar */}
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
                    <span>{plan.semanas} semanas planificadas</span>
                    <span>{plan.secuenciaClases?.length || 0} clases</span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPlanDetail(plan)}
                  className="w-full text-xs text-[#176087] dark:text-[#9ED8ED] justify-between border border-slate-200 dark:border-slate-800 mt-2"
                >
                  <span>Ver secuencia y destrezas</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* DRAWER DE GENERACIÓN CON IA */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Generador de Planificación con IA"
        subtitle="Alineado con los estándares del Currículo Nacional MINEDUC 2023"
      >
        <div className="space-y-5 text-left">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Materia y Paralelo
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={materia}
                  onChange={(e) => setMateria(e.target.value)}
                  className="text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727]"
                />
                <input
                  type="text"
                  value={paralelo}
                  onChange={(e) => setParalelo(e.target.value)}
                  className="text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bloque Curricular (MINEDUC)
              </label>
              <select
                value={bloque}
                onChange={(e) => setBloque(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727]"
              >
                <option value="Bloque 1">Bloque 1: Lengua y Cultura</option>
                <option value="Bloque 2">Bloque 2: Comunicación Oral</option>
                <option value="Bloque 3">Bloque 3: Lectura Crítica</option>
                <option value="Bloque 4">Bloque 4: Escritura Creativa y Ensayo</option>
                <option value="Bloque 5">Bloque 5: Literatura Ecuatoriana</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Destreza con Criterio de Desempeño (DCD)
              </label>
              <textarea
                rows={3}
                value={destreza}
                onChange={(e) => setDestreza(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Duración en semanas
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={semanas}
                onChange={(e) => setSemanas(Number(e.target.value))}
                className="w-24 text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727]"
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
              Generar Planificación con Gemini
            </Button>
          </div>

          {/* Resultado de la IA para revisar y editar */}
          {resultadoIA && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Propuesta Curricular Generada
                </span>
                <span className="text-[10px] text-slate-400">Editable antes de guardar</span>
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
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Objetivos de Aprendizaje
                </label>
                <div className="space-y-1.5">
                  {resultadoIA.objetivos?.map((obj: string, i: number) => (
                    <div key={i} className="text-xs p-2 rounded bg-slate-50 dark:bg-[#071727] border border-slate-200 dark:border-slate-800">
                      {obj}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Secuencia de Clases Sugerida
                </label>
                <div className="space-y-2">
                  {resultadoIA.secuenciaClases?.map((clase: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#071727] text-xs space-y-1">
                      <span className="font-bold text-[#176087] dark:text-[#9ED8ED]">
                        {clase.tema}
                      </span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">{clase.contenido}</p>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Actividad: {clase.actividadSugerida || clase.actividad}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <Button variant="outline" size="sm" className="w-1/2" onClick={() => setResultadoIA(null)}>
                  Descartar
                </Button>
                <Button variant="primary" size="sm" className="w-1/2" onClick={handleGuardarPlan}>
                  Guardar en MongoDB
                </Button>
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* MODAL DE DETALLE DE PLANIFICACIÓN */}
      {selectedPlanDetail && (
        <Drawer
          isOpen={Boolean(selectedPlanDetail)}
          onClose={() => setSelectedPlanDetail(null)}
          title={selectedPlanDetail.titulo}
          subtitle={`${selectedPlanDetail.materia} · ${selectedPlanDetail.semanas} semanas de duración`}
        >
          <div className="space-y-5 text-left text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#071727] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Destreza con Criterio de Desempeño
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                {selectedPlanDetail.destreza}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Objetivos de la Unidad
              </span>
              <ul className="space-y-1.5 list-disc list-inside text-slate-600 dark:text-slate-300">
                {selectedPlanDetail.objetivos.map((o, idx) => (
                  <li key={idx}>{o}</li>
                ))}
              </ul>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Secuencia de Clases
              </span>
              <div className="space-y-2.5">
                {selectedPlanDetail.secuenciaClases.map((sc, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A2239]">
                    <span className="font-bold text-[#176087] dark:text-[#9ED8ED] block">
                      {sc.tema}
                    </span>
                    <p className="text-slate-500 mt-1">{sc.contenido}</p>
                    <span className="text-emerald-600 font-semibold block mt-1">
                      Actividad: {sc.actividad}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setSelectedPlanDetail(null)} className="w-full">
                Cerrar Detalle
              </Button>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};

export default PlanificacionPage;
