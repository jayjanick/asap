import React, { useState } from 'react';
import { Card, Button, Badge } from '../components/ui';
import { Modal, Drawer } from '../components/ui/Dialogs';
import {
  PLANTILLAS_MINEDUC,
  ACTIVIDADES_INICIALES,
  PARALELOS_INICIALES,
  DOCENTE_ACTUAL
} from '../data/mockData';
import {
  Briefcase,
  Sparkles,
  Plus,
  FileText,
  Upload,
  Folder,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Layers,
  ChevronRight,
  FileCode,
  FileSpreadsheet
} from 'lucide-react';

interface KanbanTask {
  id: string;
  titulo: string;
  paralelo: string;
  columna: 'Por hacer' | 'En progreso' | 'Completado';
  prioridad: 'Urgente' | 'Alta' | 'Media' | 'Baja';
  fecha: string;
}

export const WorkspacePage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'kanban' | 'actividades' | 'plantillas' | 'documentos'>('kanban');

  // Kanban Tasks State
  const [tasks, setTasks] = useState<KanbanTask[]>([
    { id: '1', titulo: 'Revisar borradores de crónica barrial', paralelo: '8vo A', columna: 'En progreso', prioridad: 'Alta', fecha: '2026-10-24' },
    { id: '2', titulo: 'Subir calificaciones del Parcial 1 al sistema', paralelo: '9no B', columna: 'Por hacer', prioridad: 'Urgente', fecha: '2026-10-25' },
    { id: '3', titulo: 'Convocatoria a reunión de representantes', paralelo: '8vo A', columna: 'Completado', prioridad: 'Media', fecha: '2026-10-21' },
    { id: '4', titulo: 'Elaborar rúbrica de debate con Gemini', paralelo: '8vo A', columna: 'Por hacer', prioridad: 'Baja', fecha: '2026-10-30' },
    { id: '5', titulo: 'Entregar informe mensual a Inspección', paralelo: 'General', columna: 'En progreso', prioridad: 'Alta', fecha: '2026-10-26' }
  ]);

  const [nuevaTareaTitulo, setNuevaTareaTitulo] = useState('');
  const [nuevaTareaParalelo, setNuevaTareaParalelo] = useState('8vo A');
  const [nuevaTareaPrioridad, setNuevaTareaPrioridad] = useState<'Urgente' | 'Alta' | 'Media' | 'Baja'>('Media');
  const [showNuevaTareaModal, setShowNuevaTareaModal] = useState(false);

  // Actividades con IA
  const [showActividadIAModal, setShowActividadIAModal] = useState(false);
  const [actividadMateria, setActividadMateria] = useState('Lengua y Literatura');
  const [actividadDestreza, setActividadDestreza] = useState('LL.4.2.1. Comunicación oral en debates');
  const [actividadTipo, setActividadTipo] = useState('Grupal');
  const [generandoActividad, setGenerandoActividad] = useState(false);
  const [actividadGenerada, setActividadGenerada] = useState<any | null>(null);

  // Plantillas
  const [selectedPlantilla, setSelectedPlantilla] = useState<any | null>(null);
  const [showPlantillaEditor, setShowPlantillaEditor] = useState(false);
  const [plantillaContenido, setPlantillaContenido] = useState('');

  // Mis Documentos
  const [categoriaDoc, setCategoriaDoc] = useState<'Todos' | 'Personal' | 'Institucional' | 'Planificaciones' | 'Informes'>('Todos');
  const [documentos, setDocumentos] = useState([
    { id: 'doc-1', nombre: 'PUD_Lengua_Unidad_2_MINEDUC.pdf', categoria: 'Planificaciones', tamano: '1.4 MB', fecha: '2026-10-22' },
    { id: 'doc-2', nombre: 'Nomina_Estudiantes_Oficial_8voA.xlsx', categoria: 'Institucional', tamano: '450 KB', fecha: '2026-10-18' },
    { id: 'doc-3', nombre: 'Acta_Reunion_Representantes_Octubre.docx', categoria: 'Institucional', tamano: '120 KB', fecha: '2026-10-21' },
    { id: 'doc-4', nombre: 'Certificado_Capacitacion_Docente_2026.pdf', categoria: 'Personal', tamano: '890 KB', fecha: '2026-09-14' }
  ]);

  const handleMoverTarea = (id: string, nuevaColumna: 'Por hacer' | 'En progreso' | 'Completado') => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, columna: nuevaColumna } : t)));
  };

  const handleCrearTarea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaTareaTitulo.trim()) return;
    setTasks([
      ...tasks,
      {
        id: String(Date.now()),
        titulo: nuevaTareaTitulo.trim(),
        paralelo: nuevaTareaParalelo,
        columna: 'Por hacer',
        prioridad: nuevaTareaPrioridad,
        fecha: new Date().toISOString().slice(0, 10)
      }
    ]);
    setNuevaTareaTitulo('');
    setShowNuevaTareaModal(false);
  };

  const handleGenerarActividadIA = async () => {
    setGenerandoActividad(true);
    try {
      const res = await fetch('/api/workspace/actividad-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materia: actividadMateria,
          destreza: actividadDestreza,
          tipoActividad: actividadTipo,
          nivel: '8vo EGB'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setActividadGenerada(data.actividad);
      }
    } catch {
      setActividadGenerada({
        titulo: `Taller de Oratoria y Debate Argumentativo`,
        descripcion: `Actividad práctica diseñada para fortalecer la destreza ${actividadDestreza}.`,
        instrucciones: `1. En equipos de 4 integrantes, seleccionen una postura sobre el tema planteado.\n2. Redacten 3 argumentos sustentados y 1 contraargumento anticipado.\n3. Defiendan su tesis en 3 minutos ante el pleno de la clase.`,
        criteriosEvaluacion: [
          'Claridad de la tesis planteada (4 pts)',
          'Elocuencia y respeto a los turnos de habla (3 pts)',
          'Calidad de las evidencias presentadas (3 pts)'
        ]
      });
    } finally {
      setGenerandoActividad(false);
    }
  };

  const handleUsarPlantilla = (plt: any) => {
    setSelectedPlantilla(plt);
    setPlantillaContenido(
      `INSTITUCIÓN: ${DOCENTE_ACTUAL.institucion}\nDOCENTE: ${DOCENTE_ACTUAL.nombre}\nASIGNATURA: Lengua y Literatura\nAÑO LECTIVO: 2026-2027\nDOCUMENTO: ${plt.titulo} (${plt.codigo})\n\n-- DATOS DE REUNIÓN / PLANIFICACIÓN --\nObjetivo: Cumplimiento de metas de aprendizaje del primer quimestre.\nParticipantes: Docente, representantes legales y directivos.\nAcuerdos:\n1. Cumplimiento estricto del horario de refuerzo pedagógico.\n2. Notificación oportuna de inasistencias médicas.`
    );
    setShowPlantillaEditor(true);
  };

  const handleSubirArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentos([
        {
          id: `doc-${Date.now()}`,
          nombre: file.name,
          categoria: 'Personal',
          tamano: `${(file.size / 1024).toFixed(0)} KB`,
          fecha: new Date().toISOString().slice(0, 10)
        },
        ...documentos
      ]);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-[#176087] dark:text-[#9ED8ED]" />
            Workspace del Docente
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            El centro de operaciones y organización de tu labor fuera del aula.
          </p>
        </div>

        {/* Section Navigation Pills */}
        <div className="flex items-center gap-1 p-1 bg-slate-200 dark:bg-slate-800 rounded-xl overflow-x-auto">
          {[
            { id: 'kanban', label: 'Planner Kanban' },
            { id: 'actividades', label: 'Actividades & IA' },
            { id: 'plantillas', label: 'Banco de Plantillas' },
            { id: 'documentos', label: 'Mis Documentos' }
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeSection === sec.id
                  ? 'bg-white dark:bg-[#0A2239] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. SECCIÓN: PLANNER KANBAN */}
      {activeSection === 'kanban' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Organiza tus pendientes pedagógicos. Haz clic en las flechas para mover entre columnas.
            </span>
            <Button size="sm" variant="primary" onClick={() => setShowNuevaTareaModal(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Nueva tarea
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(['Por hacer', 'En progreso', 'Completado'] as const).map((col) => {
              const colTasks = tasks.filter((t) => t.columna === col);
              const headerColors = {
                'Por hacer': 'border-t-4 border-t-amber-500',
                'En progreso': 'border-t-4 border-t-[#176087]',
                'Completado': 'border-t-4 border-t-emerald-500'
              };

              return (
                <div
                  key={col}
                  className={`bg-slate-100/70 dark:bg-[#071727]/80 rounded-2xl p-4 space-y-3 border border-slate-200/80 dark:border-slate-800 ${headerColors[col]}`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {col}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400 bg-white dark:bg-[#0A2239] px-2 py-0.5 rounded-full">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 min-h-[320px]">
                    {colTasks.map((t) => (
                      <Card
                        key={t.id}
                        className="p-3.5 space-y-2 bg-white dark:bg-[#0A2239] hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                            {t.titulo}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                              t.prioridad === 'Urgente'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                : t.prioridad === 'Alta'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {t.prioridad}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span>{t.paralelo}</span>
                          <span>{t.fecha}</span>
                        </div>

                        {/* Mover rápido */}
                        <div className="flex items-center justify-end gap-1 pt-1">
                          {col !== 'Por hacer' && (
                            <button
                              onClick={() => handleMoverTarea(t.id, col === 'Completado' ? 'En progreso' : 'Por hacer')}
                              className="text-[10px] text-slate-400 hover:text-slate-600 p-1"
                              title="Mover hacia atrás"
                            >
                              ←
                            </button>
                          )}
                          {col !== 'Completado' && (
                            <button
                              onClick={() => handleMoverTarea(t.id, col === 'Por hacer' ? 'En progreso' : 'Completado')}
                              className="text-[10px] text-[#176087] dark:text-[#9ED8ED] font-bold p-1 hover:underline"
                              title="Avanzar de columna"
                            >
                              Avanzar →
                            </button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. SECCIÓN: GESTIÓN DE ACTIVIDADES & IA */}
      {activeSection === 'actividades' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Actividades Creadas y Estado de Entregas
              </h3>
              <p className="text-xs text-slate-500">
                Monitorea las tareas enviadas a los estudiantes y genera nuevas con Gemini.
              </p>
            </div>
            <Button size="sm" variant="primary" onClick={() => setShowActividadIAModal(true)}>
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Crear Actividad con IA
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ACTIVIDADES_INICIALES.map((act) => (
              <Card key={act.id} className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <Badge variant={act.estado === 'Calificado' ? 'success' : 'primary'}>
                    {act.tipo} · {act.ponderacion} pts
                  </Badge>
                  <span className="text-xs font-mono text-slate-400">
                    Entrega: {act.fechaEntrega}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {act.titulo}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">{act.descripcion}</p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    Entregados: {act.entregadosCount} / {act.totalCount} estudiantes
                  </span>
                  <Link to="/calificaciones" className="text-[#176087] dark:text-[#9ED8ED] font-bold hover:underline">
                    Ver calificaciones →
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 3. SECCIÓN: BANCO DE PLANTILLAS MINEDUC */}
      {activeSection === 'plantillas' && (
        <div className="space-y-6">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Banco de Plantillas Oficiales del MINEDUC
            </h3>
            <p className="text-xs text-slate-500">
              Modelos listos para rellenar con los datos del docente y descargar en formato institucional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PLANTILLAS_MINEDUC.map((plt) => (
              <Card key={plt.id} className="p-5 flex flex-col justify-between space-y-4">
                <div>
                  <Badge variant="outline" className="mb-2">
                    {plt.categoria}
                  </Badge>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {plt.titulo}
                  </h4>
                  <p className="text-[10px] font-mono text-[#176087] dark:text-[#9ED8ED] mt-0.5">
                    {plt.codigo}
                  </p>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {plt.descripcion}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => handleUsarPlantilla(plt)}
                  >
                    <span>Usar plantilla</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 4. SECCIÓN: MIS DOCUMENTOS */}
      {activeSection === 'documentos' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Repositorio Digital del Docente
              </h3>
              <p className="text-xs text-slate-500">
                Almacena de forma segura tus planificaciones, actas y certificados.
              </p>
            </div>

            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#176087] text-white hover:bg-[#124b6a] cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Subir documento</span>
              <input type="file" onChange={handleSubirArchivo} className="hidden" />
            </label>
          </div>

          {/* Categorías */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(['Todos', 'Planificaciones', 'Institucional', 'Personal'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaDoc(cat)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  categoriaDoc === cat
                    ? 'bg-[#176087] text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Lista de Documentos */}
          <Card className="p-0 overflow-hidden border-slate-200 dark:border-slate-800">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {documentos
                .filter((d) => (categoriaDoc === 'Todos' ? true : d.categoria === categoriaDoc))
                .map((doc) => (
                  <div key={doc.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#071727]/60 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#9ED8ED]/20 text-[#176087] dark:text-[#9ED8ED]">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white block">
                          {doc.nombre}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <Badge variant="outline">{doc.categoria}</Badge>
                          <span>·</span>
                          <span>{doc.tamano}</span>
                          <span>·</span>
                          <span>Subido: {doc.fecha}</span>
                        </div>
                      </div>
                    </div>

                    <Button size="sm" variant="ghost" className="h-8 px-2 text-[#176087] dark:text-[#9ED8ED]">
                      <Download className="w-3.5 h-3.5 mr-1" />
                      Descargar
                    </Button>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      )}

      {/* MODAL CREAR TAREA KANBAN */}
      <Modal
        isOpen={showNuevaTareaModal}
        onClose={() => setShowNuevaTareaModal(false)}
        title="Nueva Tarea en el Planner"
      >
        <form onSubmit={handleCrearTarea} className="space-y-4 text-xs text-left">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Título o actividad pendiente *
            </label>
            <input
              required
              type="text"
              value={nuevaTareaTitulo}
              onChange={(e) => setNuevaTareaTitulo(e.target.value)}
              placeholder="Ej: Revisar portafolios, redactar acta..."
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Paralelo asignado
              </label>
              <select
                value={nuevaTareaParalelo}
                onChange={(e) => setNuevaTareaParalelo(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727]"
              >
                <option value="8vo A">8vo EGB "A"</option>
                <option value="9no B">9no EGB "B"</option>
                <option value="General">Gestión General</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Prioridad
              </label>
              <select
                value={nuevaTareaPrioridad}
                onChange={(e) => setNuevaTareaPrioridad(e.target.value as any)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727]"
              >
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowNuevaTareaModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Agregar al Planner
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL CREAR ACTIVIDAD CON IA */}
      <Modal
        isOpen={showActividadIAModal}
        onClose={() => setShowActividadIAModal(false)}
        title="Generador de Actividades con Gemini IA"
        subtitle="Sugerencia didáctica alineada a la destreza del bloque curricular"
      >
        <div className="space-y-4 text-xs text-left">
          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Destreza Curricular Objetivo
              </label>
              <input
                type="text"
                value={actividadDestreza}
                onChange={(e) => setActividadDestreza(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Materia
                </label>
                <input
                  type="text"
                  value={actividadMateria}
                  onChange={(e) => setActividadMateria(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Modalidad
                </label>
                <select
                  value={actividadTipo}
                  onChange={(e) => setActividadTipo(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727]"
                >
                  <option value="Individual">Individual (Deber)</option>
                  <option value="Grupal">Grupal (Taller en clase)</option>
                  <option value="Evaluacion">Evaluación diagnóstica</option>
                </select>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerarActividadIA}
              isLoading={generandoActividad}
              className="w-full"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Generar Actividad con IA
            </Button>
          </div>

          {actividadGenerada && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#071727] border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-[#176087] dark:text-[#9ED8ED] text-sm block">
                {actividadGenerada.titulo}
              </span>
              <p className="text-slate-600 dark:text-slate-300">{actividadGenerada.descripcion}</p>
              <div className="p-2.5 rounded bg-white dark:bg-[#0A2239] border border-slate-200 dark:border-slate-800 whitespace-pre-line text-[11px]">
                {actividadGenerada.instrucciones}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* EDITOR DE PLANTILLA */}
      <Modal
        isOpen={showPlantillaEditor}
        onClose={() => setShowPlantillaEditor(false)}
        title={selectedPlantilla?.titulo || 'Editor de Plantilla'}
        subtitle={`Formato oficial MINEDUC · ${selectedPlantilla?.codigo}`}
        maxWidth="xl"
      >
        <div className="space-y-4 text-xs text-left">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Contenido del Documento Pre-llenado:
            </label>
            <textarea
              rows={10}
              value={plantillaContenido}
              onChange={(e) => setPlantillaContenido(e.target.value)}
              className="w-full font-mono text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setShowPlantillaEditor(false)}>
              Cerrar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                alert('Documento generado con éxito listo para firma y sello ministerial.');
                setShowPlantillaEditor(false);
              }}
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Descargar Documento Listo
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WorkspacePage;
