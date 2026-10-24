import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Document as DocxDocument, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import jsPDF from 'jspdf';
import { Card, Button, Badge, InfoTooltip } from '../components/ui';
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
  FileSpreadsheet,
  Calendar,
  X,
  AlertCircle,
  FileDown,
  Trash2,
  GripVertical
} from 'lucide-react';

export interface KanbanTaskItem {
  id: string;
  titulo: string;
  descripcion?: string;
  paralelo: string;
  columna: 'Por hacer' | 'En progreso' | 'Completado';
  prioridad: 'Alta' | 'Media' | 'Baja';
  urgencia: 'Alta' | 'Media' | 'Baja';
  fecha: string;
  fechaLimite?: string;
  observaciones?: string;
  adjuntos?: string[];
}

export interface DocumentoItem {
  id: string;
  nombre: string;
  categoria: 'Personal' | 'Planificación' | 'Estudiante' | 'Plantilla' | 'Institucional';
  descripcion?: string;
  tamano: string;
  fechaSubida: string;
  tipo: string;
  contenidoBase64?: string;
}

// Componente para tarjeta arrastrable con @dnd-kit
const SortableTaskCard: React.FC<{
  task: KanbanTaskItem;
  onClick: () => void;
}> = ({ task, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'Alta':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">Alta</span>;
      case 'Media':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">Media</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">Baja</span>;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#071727] shadow-xs hover:shadow-md transition-all group flex flex-col justify-between space-y-2 select-none"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 flex-1 min-w-0" onClick={onClick}>
          <div className="cursor-pointer flex-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug group-hover:text-[#176087] dark:group-hover:text-[#9ED8ED]">
              {task.titulo}
            </h4>
            {task.descripcion && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {task.descripcion}
              </p>
            )}
          </div>
        </div>

        {/* Agarradera de arrastre exclusiva */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 rounded"
          title="Arrastrar tarea"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400">
        <span className="font-semibold text-slate-600 dark:text-slate-300">
          {task.paralelo}
        </span>
        <div className="flex items-center gap-1.5">
          {task.fechaLimite && (
            <span className="flex items-center gap-1 font-mono text-slate-400">
              <Clock className="w-3 h-3" /> {task.fechaLimite}
            </span>
          )}
          {getPriorityBadge(task.prioridad || task.urgencia)}
        </div>
      </div>
    </div>
  );
};

// Componente de columna Droppable para Kanban
const KanbanColumn: React.FC<{
  id: string;
  title: string;
  count: number;
  tasks: KanbanTaskItem[];
  color: string;
  onTaskClick: (task: KanbanTaskItem) => void;
}> = ({ id, title, count, tasks, color, onTaskClick }) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className="p-4 rounded-2xl bg-slate-100/70 dark:bg-[#0A2239]/70 border border-slate-200/80 dark:border-slate-800 flex flex-col min-h-[500px]"
    >
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            {title}
          </h3>
        </div>
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {count}
        </span>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2.5 flex-1">
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
          {tasks.length === 0 && (
            <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-400">
              Arrastra una tarea aquí
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

export const WorkspacePage: React.FC = () => {
  // P0.3: Navegación interna exclusiva por estado local (sin cambiar la URL)
  const [activeTab, setActiveTab] = useState<'kanban' | 'plantillas' | 'documentos'>('kanban');

  // Kanban State
  const [tasks, setTasks] = useState<KanbanTaskItem[]>([
    {
      id: 'kb-1',
      titulo: 'Revisar borradores de crónica barrial',
      descripcion: 'Evaluar coherencia en párrafos descriptivos y uso de conectores temporales.',
      paralelo: '8vo A',
      columna: 'En progreso',
      prioridad: 'Alta',
      urgencia: 'Alta',
      fecha: '2026-10-24',
      fechaLimite: '2026-10-28',
      observaciones: 'Coordinar con la comisión pedagógica la rúbrica formativa.'
    },
    {
      id: 'kb-2',
      titulo: 'Subir calificaciones Parcial 1 al sistema',
      descripcion: 'Cierre del primer parcial con notas de deberes y lección escrita.',
      paralelo: '9no B',
      columna: 'Por hacer',
      prioridad: 'Alta',
      urgencia: 'Alta',
      fecha: '2026-10-25',
      fechaLimite: '2026-10-26',
      observaciones: 'Verificar estudiantes con justificativo médico antes de cerrar el acta.'
    },
    {
      id: 'kb-3',
      titulo: 'Convocatoria a reunión de representantes',
      descripcion: 'Socialización del rendimiento y compromisos de refuerzo.',
      paralelo: '8vo A',
      columna: 'Completado',
      prioridad: 'Media',
      urgencia: 'Media',
      fecha: '2026-10-21',
      fechaLimite: '2026-10-22',
      observaciones: 'Asistencia del 88% de padres de familia.'
    },
    {
      id: 'kb-4',
      titulo: 'Preparar material para el bloque 3',
      descripcion: 'Diseño de diapositivas interactivas y fichas de lectura sobre lírica ecuatoriana.',
      paralelo: '8vo A',
      columna: 'Por hacer',
      prioridad: 'Baja',
      urgencia: 'Baja',
      fecha: '2026-10-30',
      fechaLimite: '2026-11-05',
      observaciones: 'Revisar antología de poetas guayaquileños y cuencanos.'
    }
  ]);

  // Sensores de @dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // Modal y Drawer de Tarea
  const [selectedTask, setSelectedTask] = useState<KanbanTaskItem | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newParalelo, setNewParalelo] = useState('8vo A');
  const [newUrgencia, setNewUrgencia] = useState<'Alta' | 'Media' | 'Baja'>('Media');
  const [newFechaLimite, setNewFechaLimite] = useState('');
  const [newObservaciones, setNewObservaciones] = useState('');

  // Plantillas & Editor enriquecido (P2.3)
  const [selectedPlantilla, setSelectedPlantilla] = useState<any | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editorTitulo, setEditorTitulo] = useState('');
  const [editorContenido, setEditorContenido] = useState('');
  const [templateSavedSuccess, setTemplateSavedSuccess] = useState(false);

  // Mis Documentos (P2.4 & P3.10)
  const [documentos, setDocumentos] = useState<DocumentoItem[]>([
    {
      id: 'doc-1',
      nombre: 'Plan_Curricular_Anual_Lengua_8vo.pdf',
      categoria: 'Planificación',
      descripcion: 'PCA oficial aprobado por vicerrectorado periodo 2026-2027',
      tamano: '380 KB',
      tipo: 'PDF',
      fechaSubida: '12/03/2026',
      contenidoBase64: 'JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwgL0xlbmd0aCA1OSAvRmlsdGVyIC9GbGF0ZURlY29kZSA+PgpzdHJlYW0KeJwrSExPT1HIzFPSUUpMzs8tLslPzlDISSxJLQIyQzJSgYKVkmlqSgEAg3kNEwo=endstream'
    },
    {
      id: 'doc-2',
      nombre: 'Acta_Junta_Curso_1er_Quimestre.pdf',
      categoria: 'Institucional',
      descripcion: 'Acta formal con resoluciones de rendimiento',
      tamano: '210 KB',
      tipo: 'PDF',
      fechaSubida: '28/03/2026',
      contenidoBase64: 'JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwgL0xlbmd0aCA1OSAvRmlsdGVyIC9GbGF0ZURlY29kZSA+PgpzdHJlYW0KeJwrSExPT1HIzFPSUUpMzs8tLslPzlDISSxJLQIyQzJSgYKVkmlqSgEAg3kNEwo=endstream'
    },
    {
      id: 'doc-3',
      nombre: 'PRAI_Estudiantes_En_Riesgo.docx',
      categoria: 'Estudiante',
      descripcion: 'Planes de refuerzo académico individualizados',
      tamano: '145 KB',
      tipo: 'DOCX',
      fechaSubida: '04/04/2026',
      contenidoBase64: 'UEsDBBQAAAAIAAAAAAAAAAAAAAAAAAAAAAAIAAAAd29yZC9kb2N1bWVudC54bWw='
    }
  ]);

  // Modal Subir Documento con clasificación (P3.10)
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadNombre, setUploadNombre] = useState('');
  const [uploadCategoria, setUploadCategoria] = useState<'Personal' | 'Planificación' | 'Estudiante' | 'Plantilla' | 'Institucional'>('Personal');
  const [uploadDescripcion, setUploadDescripcion] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadBase64, setUploadBase64] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('Todos');

  // Cargar tareas y documentos del servidor al iniciar
  useEffect(() => {
    fetch('/api/workspace/kanban')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.kanbanTasks) setTasks(data.kanbanTasks);
      })
      .catch(() => {});

    fetch('/api/workspace/documentos')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.documentos) setDocumentos(data.documentos);
      })
      .catch(() => {});
  }, []);

  // Manejador de Drag End en Kanban (P3.9)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Si se soltó sobre una columna directamente ('Por hacer', 'En progreso', 'Completado')
    if (['Por hacer', 'En progreso', 'Completado'].includes(overId)) {
      setTasks((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, columna: overId as any } : t))
      );
      // Sincronizar con servidor
      fetch(`/api/workspace/kanban/${activeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columna: overId })
      }).catch(() => {});
      return;
    }

    // Si se soltó sobre otra tarea, mover a la columna de esa tarea
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask) {
      setTasks((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, columna: overTask.columna } : t))
      );
      fetch(`/api/workspace/kanban/${activeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columna: overTask.columna })
      }).catch(() => {});
    }
  };

  // Crear tarea en Kanban
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: KanbanTaskItem = {
      id: `kb-${Date.now()}`,
      titulo: newTitle.trim(),
      descripcion: newDesc.trim(),
      paralelo: newParalelo,
      columna: 'Por hacer',
      prioridad: newUrgencia,
      urgencia: newUrgencia,
      fecha: new Date().toISOString().slice(0, 10),
      fechaLimite: newFechaLimite,
      observaciones: newObservaciones.trim()
    };

    setTasks([newTask, ...tasks]);

    try {
      await fetch('/api/workspace/kanban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
    } catch {}

    setNewTitle('');
    setNewDesc('');
    setNewFechaLimite('');
    setNewObservaciones('');
    setShowNewTaskModal(false);
  };

  // Actualizar tarea en el Sheet lateral (P3.9)
  const handleSaveSelectedTask = async () => {
    if (!selectedTask) return;

    setTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? selectedTask : t)));

    try {
      await fetch(`/api/workspace/kanban/${selectedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedTask)
      });
    } catch {}

    setSelectedTask(null);
  };

  // Eliminar tarea de Kanban
  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSelectedTask(null);
    try {
      await fetch(`/api/workspace/kanban/${id}`, { method: 'DELETE' });
    } catch {}
  };

  // Abrir editor con plantilla pre-cargada (P2.3)
  const handleUsarPlantilla = (plantilla: any) => {
    setSelectedPlantilla(plantilla);
    setEditorTitulo(plantilla.titulo);
    setEditorContenido(
`MINISTERIO DE EDUCACIÓN DEL ECUADOR
${plantilla.codigo} · FORMATO OFICIAL MINEDUC
Fecha: ${new Date().toLocaleDateString('es-EC')}
Plantel: U.E. Fisco-Misional Democracia
Docente: Lic. Andrés Morales
Asignatura: Lengua y Literatura

==================================================
1. DATOS INFORMATIVOS
- Código de Instrumento: ${plantilla.codigo}
- Formato: ${plantilla.formato}
- Categoría: ${plantilla.categoria}

2. DESCRIPCIÓN Y OBJETIVOS
${plantilla.descripcion}

3. CAMPOS REQUERIDOS MINEDUC:
${plantilla.campos.map((c: string) => `• [ ] ${c}: `).join('\n')}

4. OBSERVACIONES Y ACUERDOS PEDAGÓGICOS:
Se deja constancia del presente documento para el expediente de vicerrectorado.
`
    );
    setShowTemplateEditor(true);
  };

  // Guardar plantilla editada en "Mis Documentos" (P2.3)
  const handleGuardarEnMisDocumentos = async () => {
    const nuevoDoc: DocumentoItem = {
      id: `doc-${Date.now()}`,
      nombre: `${editorTitulo.replace(/\s+/g, '_')}.txt`,
      categoria: 'Plantilla',
      descripcion: `Generado a partir de ${selectedPlantilla?.codigo || 'plantilla MINEDUC'}`,
      tamano: `${(editorContenido.length / 1024).toFixed(1)} KB`,
      tipo: 'TXT',
      fechaSubida: new Date().toLocaleDateString('es-EC'),
      contenidoBase64: btoa(unescape(encodeURIComponent(editorContenido)))
    };

    setDocumentos([nuevoDoc, ...documentos]);

    try {
      await fetch('/api/workspace/documentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoDoc)
      });
    } catch {}

    setTemplateSavedSuccess(true);
    setTimeout(() => setTemplateSavedSuccess(false), 2500);
  };

  // Descargar Plantilla en DOCX (P2.3)
  const handleDescargarDOCX = async () => {
    const lines = editorContenido.split('\n');
    const docxDoc = new DocxDocument({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: editorTitulo,
              heading: HeadingLevel.TITLE
            }),
            ...lines.map((line) => new Paragraph({ text: line }))
          ]
        }
      ]
    });

    const blob = await Packer.toBlob(docxDoc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${editorTitulo.replace(/\s+/g, '_')}.docx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Descargar Plantilla en PDF con jsPDF (P2.3)
  const handleDescargarPDF = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(14);
    pdf.setTextColor(23, 96, 135);
    pdf.text('MINISTERIO DE EDUCACIÓN DEL ECUADOR', 14, 15);
    pdf.setFontSize(11);
    pdf.setTextColor(10, 34, 57);
    pdf.text(editorTitulo, 14, 23);
    pdf.setFontSize(8);
    pdf.setTextColor(80);

    const splitText = pdf.splitTextToSize(editorContenido, 180);
    pdf.text(splitText, 14, 32);

    pdf.save(`${editorTitulo.replace(/\s+/g, '_')}.pdf`);
  };

  // Manejar selección de archivo para subir a Mis Documentos (P3.10)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!uploadNombre) {
        setUploadNombre(file.name);
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setUploadBase64(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Guardar documento subido con metadatos y Base64 (P2.4 & P3.10)
  const handleGuardarSubida = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadNombre.trim()) return;

    const fileExt = uploadFile?.name.split('.').pop()?.toUpperCase() || 'PDF';
    const fileSize = uploadFile ? `${(uploadFile.size / 1024).toFixed(0)} KB` : '150 KB';

    const nuevoDoc: DocumentoItem = {
      id: `doc-${Date.now()}`,
      nombre: uploadNombre.trim(),
      categoria: uploadCategoria,
      descripcion: uploadDescripcion.trim(),
      tamano: fileSize,
      tipo: fileExt,
      fechaSubida: new Date().toLocaleDateString('es-EC'),
      contenidoBase64: uploadBase64
    };

    setDocumentos([nuevoDoc, ...documentos]);

    try {
      await fetch('/api/workspace/documentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoDoc)
      });
    } catch {}

    setUploadNombre('');
    setUploadDescripcion('');
    setUploadFile(null);
    setUploadBase64('');
    setShowUploadModal(false);
  };

  // Descarga real de archivo desde base64 (P2.4)
  const handleDescargarArchivo = (docItem: DocumentoItem) => {
    if (docItem.contenidoBase64) {
      const linkSource = docItem.contenidoBase64.startsWith('data:')
        ? docItem.contenidoBase64
        : `data:application/octet-stream;base64,${docItem.contenidoBase64}`;
      const downloadLink = document.createElement('a');
      downloadLink.href = linkSource;
      downloadLink.download = docItem.nombre;
      downloadLink.click();
    } else {
      // Reconstrucción de archivo de texto si es un documento generado
      const blob = new Blob(
        [
          `Documento: ${docItem.nombre}\nCategoría: ${docItem.categoria}\nFecha: ${docItem.fechaSubida}\nDescripción: ${docItem.descripcion || 'Sin descripción'}\nInstitución: U.E. Fisco-Misional Democracia\nDocente: Lic. Andrés Morales`
        ],
        { type: 'text/plain;charset=utf-8' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = docItem.nombre.endsWith('.txt') ? docItem.nombre : `${docItem.nombre}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Eliminar documento
  const handleEliminarDocumento = async (id: string) => {
    setDocumentos((prev) => prev.filter((d) => d.id !== id));
    try {
      await fetch(`/api/workspace/documentos/${id}`, { method: 'DELETE' });
    } catch {}
  };

  const docsFiltrados =
    filterCategoria === 'Todos'
      ? documentos
      : documentos.filter((d) => d.categoria === filterCategoria);

  return (
    <div className="space-y-6 text-left">
      {/* 1. Encabezado principal con InfoTooltip (P3.1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div className="flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-[#176087] dark:text-[#9ED8ED]" />
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Workspace Docente
          </h2>
          <InfoTooltip content="Espacio de trabajo diario con tablero Kanban arrastrable, repositorio de documentos clasificados y plantillas oficiales MINEDUC." />
        </div>

        {/* Selector de pestañas local (P0.3: sin alterar la URL) */}
        <div className="flex items-center gap-1 p-1 bg-slate-200 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('kanban')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'kanban'
                ? 'bg-white dark:bg-[#0A2239] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Tablero Kanban
          </button>
          <button
            onClick={() => setActiveTab('plantillas')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'plantillas'
                ? 'bg-white dark:bg-[#0A2239] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Plantillas MINEDUC
          </button>
          <button
            onClick={() => setActiveTab('documentos')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'documentos'
                ? 'bg-white dark:bg-[#0A2239] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Mis Documentos
          </button>
        </div>
      </div>

      {/* PESTAÑA 1: TABLERO KANBAN CON @dnd-kit (P3.9) */}
      {activeTab === 'kanban' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Flujo de Tareas y Pendientes
              </span>
              <InfoTooltip content="Arrastra y suelta tarjetas entre columnas para cambiar su estado. Haz clic sobre cualquier tarjeta para editar detalles y adjuntos." />
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowNewTaskModal(true)}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva tarea</span>
            </Button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <KanbanColumn
                id="Por hacer"
                title="Por Hacer"
                count={tasks.filter((t) => t.columna === 'Por hacer').length}
                tasks={tasks.filter((t) => t.columna === 'Por hacer')}
                color="bg-slate-400"
                onTaskClick={(t) => setSelectedTask(t)}
              />

              <KanbanColumn
                id="En progreso"
                title="En Progreso"
                count={tasks.filter((t) => t.columna === 'En progreso').length}
                tasks={tasks.filter((t) => t.columna === 'En progreso')}
                color="bg-amber-500"
                onTaskClick={(t) => setSelectedTask(t)}
              />

              <KanbanColumn
                id="Completado"
                title="Completado"
                count={tasks.filter((t) => t.columna === 'Completado').length}
                tasks={tasks.filter((t) => t.columna === 'Completado')}
                color="bg-emerald-500"
                onTaskClick={(t) => setSelectedTask(t)}
              />
            </div>
          </DndContext>
        </div>
      )}

      {/* PESTAÑA 2: PLANTILLAS MINEDUC CON EDITOR ENRIQUECIDO (P2.3) */}
      {activeTab === 'plantillas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Biblioteca Oficial de Instrumentos MINEDUC 2023 - 2026
              </span>
              <InfoTooltip content="Plantillas institucionales validadas según el RGLOEI con editor en línea, guardado en la nube y exportación a DOCX y PDF." />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PLANTILLAS_MINEDUC.map((plt) => (
              <Card
                key={plt.id}
                className="p-5 flex flex-col justify-between hover:shadow-lg transition-all space-y-4 border-slate-200 dark:border-slate-800"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#176087] dark:text-[#9ED8ED] font-bold">
                      {plt.codigo}
                    </span>
                    <Badge variant="frosted">{plt.categoria}</Badge>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {plt.titulo}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {plt.descripcion}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleUsarPlantilla(plt)}
                    className="w-full text-xs font-semibold"
                  >
                    Usar plantilla
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: MIS DOCUMENTOS CON CLASIFICACIÓN (P2.4 & P3.10) */}
      {activeTab === 'documentos' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filtros de Categoría (P3.10) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {['Todos', 'Personal', 'Planificación', 'Estudiante', 'Plantilla', 'Institucional'].map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategoria(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      filterCategoria === cat
                        ? 'bg-[#176087] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowUploadModal(true)}
              className="text-xs shrink-0"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Subir documento</span>
            </Button>
          </div>

          {/* Tabla de Documentos con Reconstrucción de Descarga (P2.4) */}
          <Card className="overflow-hidden p-0 border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#176087] text-white">
                  <tr>
                    <th className="py-3 px-4 font-bold">Nombre del Documento</th>
                    <th className="py-3 px-3 font-semibold">Categoría</th>
                    <th className="py-3 px-3 font-semibold">Tamaño</th>
                    <th className="py-3 px-3 font-semibold">Fecha Subida</th>
                    <th className="py-3 px-4 text-center font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {docsFiltrados.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-[#176087] dark:text-[#9ED8ED] shrink-0" />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {doc.nombre}
                            </span>
                            {doc.descripcion && (
                              <span className="text-[11px] text-slate-400 block truncate max-w-sm">
                                {doc.descripcion}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="frosted">{doc.categoria}</Badge>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {doc.tamano}
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono">
                        {doc.fechaSubida}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDescargarArchivo(doc)}
                            className="p-1.5 rounded-lg text-[#176087] hover:bg-[#176087]/10 dark:text-[#9ED8ED] dark:hover:bg-[#9ED8ED]/10 transition-colors cursor-pointer"
                            title="Descargar archivo"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminarDocumento(doc.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Eliminar documento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {docsFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        No hay documentos registrados en esta categoría.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL 1: NUEVA TAREA KANBAN */}
      {showNewTaskModal && (
        <Modal
          isOpen={showNewTaskModal}
          onClose={() => setShowNewTaskModal(false)}
          title="Crear Nueva Tarea en el Tablero"
        >
          <form onSubmit={handleCreateTask} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Título de la tarea
              </label>
              <input
                type="text"
                placeholder="Ej: Revisión de cuadernos pedagógicos..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Descripción
              </label>
              <textarea
                rows={2}
                placeholder="Detalle de actividades a realizar..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Paralelo
                </label>
                <select
                  value={newParalelo}
                  onChange={(e) => setNewParalelo(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
                >
                  <option value="8vo A">8vo EGB "A"</option>
                  <option value="9no B">9no EGB "B"</option>
                  <option value="General">General / Institucional</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Urgencia
                </label>
                <select
                  value={newUrgencia}
                  onChange={(e) => setNewUrgencia(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
                >
                  <option value="Alta">🔴 Alta</option>
                  <option value="Media">🟡 Media</option>
                  <option value="Baja">🔵 Baja</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Fecha límite
                </label>
                <input
                  type="date"
                  value={newFechaLimite}
                  onChange={(e) => setNewFechaLimite(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Observaciones
              </label>
              <textarea
                rows={2}
                placeholder="Acuerdos o notas de seguimiento..."
                value={newObservaciones}
                onChange={(e) => setNewObservaciones(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowNewTaskModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Guardar Tarea
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* DRAWER LATERAL: EDICIÓN DE TARJETA KANBAN (P3.9) */}
      {selectedTask && (
        <Drawer
          isOpen={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
          title="Detalles de la Tarea"
        >
          <div className="space-y-4 py-2 text-xs text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Título
              </label>
              <input
                type="text"
                value={selectedTask.titulo}
                onChange={(e) => setSelectedTask({ ...selectedTask, titulo: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Descripción
              </label>
              <textarea
                rows={3}
                value={selectedTask.descripcion || ''}
                onChange={(e) => setSelectedTask({ ...selectedTask, descripcion: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nivel de Urgencia
                </label>
                <select
                  value={selectedTask.urgencia || selectedTask.prioridad}
                  onChange={(e) =>
                    setSelectedTask({
                      ...selectedTask,
                      urgencia: e.target.value as any,
                      prioridad: e.target.value as any
                    })
                  }
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
                >
                  <option value="Alta">🔴 Alta</option>
                  <option value="Media">🟡 Media</option>
                  <option value="Baja">🔵 Baja</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fecha Límite
                </label>
                <input
                  type="date"
                  value={selectedTask.fechaLimite || ''}
                  onChange={(e) => setSelectedTask({ ...selectedTask, fechaLimite: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Observaciones y Acuerdos
              </label>
              <textarea
                rows={3}
                value={selectedTask.observaciones || ''}
                onChange={(e) => setSelectedTask({ ...selectedTask, observaciones: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
              />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Estado Actual
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Columna: {selectedTask.columna}
                </span>
                <span className="text-[11px] text-slate-400">
                  (El movimiento entre columnas se realiza por arrastre en el tablero)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteTask(selectedTask.id)}
              >
                Eliminar tarea
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedTask(null)}>
                  Cerrar
                </Button>
                <Button variant="primary" size="sm" onClick={handleSaveSelectedTask}>
                  Guardar cambios
                </Button>
              </div>
            </div>
          </div>
        </Drawer>
      )}

      {/* MODAL 2: EDITOR DE PLANTILLAS ENRIQUECIDO (P2.3) */}
      {showTemplateEditor && (
        <Modal
          isOpen={showTemplateEditor}
          onClose={() => setShowTemplateEditor(false)}
          title={`Editor de Plantilla: ${selectedPlantilla?.titulo || ''}`}
        >
          <div className="space-y-4 py-2 text-left text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Título del documento
              </label>
              <input
                type="text"
                value={editorTitulo}
                onChange={(e) => setEditorTitulo(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Contenido editable pre-cargado
              </label>
              <textarea
                rows={12}
                value={editorContenido}
                onChange={(e) => setEditorContenido(e.target.value)}
                className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#071727] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#176087] leading-relaxed"
              />
            </div>

            {templateSavedSuccess && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Documento guardado con éxito en &quot;Mis Documentos&quot;.
              </div>
            )}

            {/* Botones de acción solicitados en P2.3 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGuardarEnMisDocumentos}
                className="text-xs"
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Guardar en Mis Documentos</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDescargarDOCX}
                  className="text-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Descargar DOCX</span>
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleDescargarPDF}
                  className="text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar PDF</span>
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: SUBIR DOCUMENTO CON CLASIFICACIÓN (P3.10) */}
      {showUploadModal && (
        <Modal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          title="Subir Documento a la Biblioteca"
        >
          <form onSubmit={handleGuardarSubida} className="space-y-4 py-2 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre del documento
              </label>
              <input
                type="text"
                placeholder="Ej: Registro_Ausencias_Octubre.pdf"
                value={uploadNombre}
                onChange={(e) => setUploadNombre(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Categoría (P3.10)
              </label>
              <select
                value={uploadCategoria}
                onChange={(e) => setUploadCategoria(e.target.value as any)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
              >
                <option value="Personal">Personal</option>
                <option value="Planificación">Planificación</option>
                <option value="Estudiante">Estudiante</option>
                <option value="Plantilla">Plantilla</option>
                <option value="Institucional">Institucional</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Descripción
              </label>
              <textarea
                rows={2}
                placeholder="Breve detalle sobre el archivo..."
                value={uploadDescripcion}
                onChange={(e) => setUploadDescripcion(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Archivo (PDF, DOCX, XLSX, TXT)
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#176087]/15 file:text-[#176087] hover:file:bg-[#176087]/25 cursor-pointer"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowUploadModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Guardar Documento
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default WorkspacePage;
