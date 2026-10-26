export interface Estudiante {
  id: string;
  nombre: string;
  cedula: string;
  numeroLista: number;
  activo: boolean;
  telefonoRepresentante?: string;
  asistenciaMes: number; // Porcentaje ej: 96%
  faltasJustificadas: number;
  faltasInjustificadas: number;
  atrasos: number;
  promedioGeneral: number;
  observaciones?: string[];
}

export interface ParaleloInfo {
  id: string;
  nombre: string;
  grado: number;
  nivel: string;
  jornada: 'Matutina' | 'Vespertina';
  materia: string;
  totalEstudiantes: number;
  asistenciaHoyRegistrada: boolean;
  porcentajeAsistenciaMes: number;
  horario: string;
  aula: string;
  estudiantes: Estudiante[];
}

export interface ActividadInfo {
  id: string;
  paraleloId: string;
  titulo: string;
  tipo: 'Individual' | 'Grupal' | 'Evaluacion' | 'Proyecto';
  fechaEntrega: string;
  ponderacion: number;
  entregadosCount: number;
  totalCount: number;
  estado: 'Por calificar' | 'Calificado' | 'En curso';
  bloque: number;
  descripcion?: string;
}

export interface PlanificacionUnidad {
  id: string;
  materia: string;
  bloque: number;
  titulo: string;
  destreza: string;
  semanas: number;
  progreso: number; // 0 a 100
  estado: 'En curso' | 'Completado' | 'Por iniciar';
  generadaIA: boolean;
  objetivos: string[];
  recursos: string[];
  secuenciaClases: {
    semana: number;
    tema: string;
    contenido: string;
    actividad: string;
  }[];
}

export interface RegistroDiarioAsistencia {
  estudianteId: string;
  estado: 'P' | 'A' | 'F';
  justificada: boolean;
  motivo?: string;
}



export const DOCENTE_ACTUAL = {
  id: 'usr-andres-morales',
  nombre: 'Andrés Morales',
  titulo: 'Lic. Andrés Morales R.',
  email: 'andres.morales@educacion.gob.ec',
  rol: 'Docente',
  institucion: 'Colegio Fiscal Vicente Rocafuerte',
  distrito: 'Distrito 09D03 — Guayaquil',
  provincia: 'Guayas',
  canton: 'Guayaquil',
  materias: ['Lengua y Literatura'],
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  totalAlumnos: 60,
  asistenciaPromedioGeneral: 94.2,
};

export const PARALELOS_INICIALES: ParaleloInfo[] = [];

export const ACTIVIDADES_INICIALES: ActividadInfo[] = [];

export const PLANIFICACIONES_MINEDUC: PlanificacionUnidad[] = [];

export const PLANTILLAS_MINEDUC = [
  {
    id: 'plt-pud',
    titulo: 'Planificación de Unidad Didáctica (PUD)',
    codigo: 'MINEDUC-SNC-2023-PUD',
    formato: 'MINEDUC 2023',
    descripcion: 'Formato estándar oficial con datos informativos, objetivos de unidad, relación destreza con criterio de desempeño, actividades evaluativas y adaptaciones curriculares.',
    categoria: 'Planificaciones',
    campos: ['Institución', 'Docente', 'Área', 'Asignatura', 'Grado', 'Paralelo', 'Número de Unidad', 'Título']
  },
  {
    id: 'plt-asistencia',
    titulo: 'Registro de Asistencia y Atrasos Mensual',
    codigo: 'MINEDUC-REG-ASIST-01',
    formato: 'Imprimible / Inspección',
    descripcion: 'Planilla mensual con matriz de 31 días, desglose de faltas justificadas e injustificadas con casillero para firma de Inspección General.',
    categoria: 'Asistencia',
    campos: ['Mes', 'Paralelo', 'Total Días Laborados', 'Porcentaje Global']
  },
  {
    id: 'plt-acta-padres',
    titulo: 'Acta de Reunión de Padres de Familia / Representantes',
    codigo: 'MINEDUC-ACTA-RP-2026',
    formato: 'Legal Institucional',
    descripcion: 'Estructura formal con orden del día, registro de asistencia de representantes, resoluciones acordadas y firmas de respaldo.',
    categoria: 'Institucional',
    campos: ['Fecha', 'Lugar', 'Orden del día', 'Resoluciones', 'Compromisos']
  },
  {
    id: 'plt-refuerzo',
    titulo: 'Plan de Refuerzo Académico Individual (PRAI)',
    codigo: 'MINEDUC-PRAI-RGLOEI',
    formato: 'Pedagógico Art. 208 RGLOEI',
    descripcion: 'Documento obligatorio para estudiantes con calificación inferior a 7 puntos. Detalla destrezas no alcanzadas, cronograma de tutorías y compromisos del representante.',
    categoria: 'Planificaciones',
    campos: ['Estudiante', 'Causa pedagógica', 'Estrategia de tutoría', 'Fecha de reevaluación']
  },
  {
    id: 'plt-circular',
    titulo: 'Circular Informativa a Representantes Legales',
    codigo: 'CIRC-VICERREC-04',
    formato: 'Comunicación',
    descripcion: 'Plantilla de comunicación oficial con membrete del plantel para citaciones y avisos de eventos curriculares.',
    categoria: 'Institucional',
    campos: ['Asunto', 'Fecha', 'Contenido', 'Firma y Sello']
  }
];

export const HORARIO_DOCENTE_SEMANAL: {
  hora: string;
  lunes: string;
  martes: string;
  miercoles: string;
  jueves: string;
  viernes: string;
}[] = [];

