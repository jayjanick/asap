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

// Generador de 30 estudiantes realistas con apellidos y nombres típicos de Ecuador
const NOMBRES_ESTUDIANTES_8VO = [
  'Alvarado Mendoza Juan Diego',
  'Andrade Suárez Valentina Sofía',
  'Barahona Zambrano Carlos Andrés',
  'Campoverde Silva Doménica Isabella',
  'Castillo Loor Mateo Sebastián',
  'Cedeño Macías Camila Nicole',
  'Chávez Moreira Lucas Gabriel',
  'Cordero Benítez Emilia Renatta',
  'Delgado Holguín Kevin Josué',
  'Espinoza Véliz Ana Paula',
  'Flores Pincay Matías Alejandro',
  'García Intriago Melany Michelle',
  'Guerrero Cárdenas Dylan Alexander',
  'Hidalgo Paredes Romina Victoria',
  'Jaramillo Bravo Isaac Fernando',
  'Lara Montalvo Fiorella Daniela',
  'Mendoza Villacreses Thiago Manuel',
  'Molina Villamar Danna Paola',
  'Navarrete Vélez Ian Roberto',
  'Ochoa Rosero Paula Cristina',
  'Pacheco Solórzano Joaquín David',
  'Quijije Vera Scarlett Estefanía',
  'Rivadeneira Palma Leonardo José',
  'Sánchez Guadamud Andrea Belén',
  'Torres Cevallos Axel Adrián',
  'Vásquez Moran Maite Alejandra',
  'Vera Coello Maximiliano Xavier',
  'Villavicencio Castro Mia Antonella',
  'Zambrano Bailón Bruno Daniel',
  'Zurita Álava Allison Dayana'
];

const NOMBRES_ESTUDIANTES_9NO = [
  'Aguilar Ponce David Eduardo',
  'Bailón Castro Erika Noemí',
  'Caicedo Mina Bryan Josué',
  'Carreño Barrezueta Jennifer Paola',
  'Duque Solís Samuel Enrique',
  'Escobar Rendón Daniela Carolina',
  'Farfán Quinde Gabriel Ignacio',
  'Gómez Peñafiel Stephany Jazmín',
  'Herrera Vallejo Justin Anthony',
  'Izquierdo Tello Valeria Montserrat',
  'León Alarcón Fernando Josué',
  'Macías Palacios Nayeli Briggette',
  'Narváez Guzmán Emilio Rafael',
  'Ordoñez Villacís Karla Daniela',
  'Pazmiño Cañarte Christian Xavier',
  'Pico Mendieta Ashley Milena',
  'Reyes Arreaga Joshua Emanuel',
  'Salazar Cobeña Angie Lisseth',
  'Tandazo Vite Erick Paul',
  'Ubilla Carriel Melanie Solange',
  'Valarezo Cobos Christopher Jair',
  'Véliz Giler Arianna Nicole',
  'Yagual Chele Alexis Jonathan',
  'Zavala Intriago Britany Anahí',
  'Arias Santana Kevin Daniel',
  'Benalcázar Orellana Génesis Abigail',
  'Cevallos Saltos Jorge Luis',
  'Díaz Barzola Dayanna Nicole',
  'Franco Ronquillo Jonathan Ariel',
  'Lucas Mendoza Melissa Katherine'
];

function crearEstudiantes(nombres: string[], paraleloId: string): Estudiante[] {
  return nombres.map((nombre, index) => {
    const cedula = `09${Math.floor(10000000 + Math.random() * 90000000)}`;
    const faltasInjust = index === 3 || index === 17 ? 2 : index === 8 ? 1 : 0;
    const faltasJust = index === 4 || index === 21 ? 1 : 0;
    const atrasos = index % 5 === 0 ? 1 : 0;
    const porcentaje = Math.max(78, 100 - (faltasInjust * 5 + faltasJust * 2 + atrasos * 1.5));
    
    // Promedio ponderado inicial con algunos en riesgo (<7.0) para activar el análisis de IA
    let promedio = Number((7.2 + (Math.sin(index) * 2.1)).toFixed(2));
    if (index === 4) promedio = 6.45;
    if (index === 12) promedio = 5.80;
    if (index === 19) promedio = 6.70;
    if (promedio > 10) promedio = 9.85;
    if (promedio < 4.5) promedio = 5.20;

    return {
      id: `${paraleloId}-est-${index + 1}`,
      nombre,
      cedula,
      numeroLista: index + 1,
      activo: true,
      telefonoRepresentante: `+593 99 ${Math.floor(1000000 + Math.random() * 9000000)}`,
      asistenciaMes: Math.round(porcentaje),
      faltasJustificadas: faltasJust,
      faltasInjustificadas: faltasInjust,
      atrasos,
      promedioGeneral: promedio,
      observaciones: index === 4 ? ['Requiere refuerzo en ortografía acentual.'] : []
    };
  });
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

export const PARALELOS_INICIALES: ParaleloInfo[] = [
  {
    id: 'par-8vo-a',
    nombre: '8vo EGB "A"',
    grado: 8,
    nivel: 'Básica Superior',
    jornada: 'Matutina',
    materia: 'Lengua y Literatura',
    totalEstudiantes: 30,
    asistenciaHoyRegistrada: true,
    porcentajeAsistenciaMes: 95.4,
    horario: 'Lunes, Miércoles y Viernes — 07:15 a 08:45',
    aula: 'Bloque B · Aula 204',
    estudiantes: crearEstudiantes(NOMBRES_ESTUDIANTES_8VO, '8vo-a')
  },
  {
    id: 'par-9no-b',
    nombre: '9no EGB "B"',
    grado: 9,
    nivel: 'Básica Superior',
    jornada: 'Matutina',
    materia: 'Lengua y Literatura',
    totalEstudiantes: 30,
    asistenciaHoyRegistrada: false,
    porcentajeAsistenciaMes: 93.1,
    horario: 'Martes y Jueves — 07:15 a 09:30',
    aula: 'Bloque C · Aula 102',
    estudiantes: crearEstudiantes(NOMBRES_ESTUDIANTES_9NO, '9no-b')
  }
];

export const ACTIVIDADES_INICIALES: ActividadInfo[] = [
  {
    id: 'act-1',
    paraleloId: 'par-8vo-a',
    titulo: 'Taller 1: Estructura del ensayo argumentativo',
    tipo: 'Individual',
    fechaEntrega: '2026-10-20',
    ponderacion: 10,
    entregadosCount: 30,
    totalCount: 30,
    estado: 'Calificado',
    bloque: 2,
    descripcion: 'Identificar tesis, conectores adversativos y párrafos de conclusión en textos seleccionados.'
  },
  {
    id: 'act-2',
    paraleloId: 'par-8vo-a',
    titulo: 'Deber 2: Redacción de micro-crónica barrial',
    tipo: 'Individual',
    fechaEntrega: '2026-10-24',
    ponderacion: 10,
    entregadosCount: 26,
    totalCount: 30,
    estado: 'Por calificar',
    bloque: 2,
    descripcion: 'Elaborar un texto testimonial de 300 palabras sobre una tradición comunitaria.'
  },
  {
    id: 'act-3',
    paraleloId: 'par-8vo-a',
    titulo: 'Evaluación Parcial: Comprensión crítica y oratoria',
    tipo: 'Evaluacion',
    fechaEntrega: '2026-10-28',
    ponderacion: 10,
    entregadosCount: 0,
    totalCount: 30,
    estado: 'En curso',
    bloque: 2,
    descripcion: 'Exposición oral de 2 minutos sobre una temática de impacto ambiental en Guayaquil.'
  },
  {
    id: 'act-4',
    paraleloId: 'par-9no-b',
    titulo: 'Taller de Figuras Literarias y Métrica',
    tipo: 'Grupal',
    fechaEntrega: '2026-10-22',
    ponderacion: 10,
    entregadosCount: 30,
    totalCount: 30,
    estado: 'Calificado',
    bloque: 2,
    descripcion: 'Análisis estrófico y detección de metáforas en poetas ecuatorianos de la Generación Decapitada.'
  },
  {
    id: 'act-5',
    paraleloId: 'par-9no-b',
    titulo: 'Ensayo Crítico: Literatura e Identidad Andina',
    tipo: 'Individual',
    fechaEntrega: '2026-10-26',
    ponderacion: 10,
    entregadosCount: 24,
    totalCount: 30,
    estado: 'Por calificar',
    bloque: 2,
    descripcion: 'Redacción formal siguiendo la guía de normas APA básica provista por el docente.'
  }
];

export const PLANIFICACIONES_MINEDUC: PlanificacionUnidad[] = [
  {
    id: 'plan-bloque-1',
    materia: 'Lengua y Literatura',
    bloque: 1,
    titulo: 'Bloque 1: Lengua y Cultura — Origen y evolución de la palabra escrita',
    destreza: 'LL.4.1.1. Indagar y explicar los aportes de la cultura escrita al desarrollo histórico, social y cultural de la humanidad.',
    semanas: 6,
    progreso: 100,
    estado: 'Completado',
    generadaIA: false,
    objetivos: [
      'Reconocer las ventajas y beneficios que la cultura escrita ha aportado en diferentes momentos históricos.',
      'Valorar la diversidad cultural expresada en textos orales y escritos del Ecuador.'
    ],
    recursos: ['Texto de Lengua 8vo MINEDUC', 'Biblioteca digital', 'Mapas conceptuales'],
    secuenciaClases: [
      { semana: 1, tema: 'De la oralidad a la pictografía', contenido: 'Pinturas rupestres y primeros símbolos cuneiformes.', actividad: 'Taller de creación de códice personal.' },
      { semana: 2, tema: 'Alfabetos de la antigüedad', contenido: 'El legado fenicio y griego en el castellano actual.', actividad: 'Línea de tiempo colaborativa en cartulina.' }
    ]
  },
  {
    id: 'plan-bloque-2',
    materia: 'Lengua y Literatura',
    bloque: 2,
    titulo: 'Bloque 2: Comunicación Oral y Escrita — El debate y el ensayo',
    destreza: 'LL.4.2.1. Utilizar recursos de la comunicación oral en contextos de intercambio social, construcción de acuerdos y resolución de problemas.',
    semanas: 6,
    progreso: 70,
    estado: 'En curso',
    generadaIA: true,
    objetivos: [
      'Construir acuerdos mediante el uso pertinente de argumentos y contraargumentos.',
      'Organizar el discurso oral y escrito aplicando conectores lógicos de causa y consecuencia.'
    ],
    recursos: ['Guía didáctica MINEDUC 2023', 'Fichas de debate', 'Proyector multimedia'],
    secuenciaClases: [
      { semana: 1, tema: 'Estructura de la argumentación', contenido: 'Tesis, premisas válidas y falacias comunes.', actividad: 'Identificación de falacias en columnas de opinión.' },
      { semana: 2, tema: 'Mesa redonda en el aula', contenido: 'Roles de moderador, expositor y público.', actividad: 'Simulación de debate sobre uso responsable de redes sociales.' },
      { semana: 3, tema: 'Conectores textuales', contenido: 'Conectores adversativos, distributivos y conclusivos.', actividad: 'Guía de ejercicios de redacción en pares.' }
    ]
  },
  {
    id: 'plan-bloque-3',
    materia: 'Lengua y Literatura',
    bloque: 3,
    titulo: 'Bloque 3: Lectura Crítica y Textos Periodísticos',
    destreza: 'LL.4.3.2. Construir significados implícitos al inferir el tema, el punto de vista del autor y las motivaciones de los personajes.',
    semanas: 6,
    progreso: 15,
    estado: 'Por iniciar',
    generadaIA: true,
    objetivos: [
      'Comparar y valorar textos periodísticos de diferentes fuentes y corrientes editoriales.',
      'Autorregular la comprensión lectora mediante el uso de esquemas de síntesis.'
    ],
    recursos: ['Periódicos locales y nacionales', 'Diccionario de la RAE', 'Fichas de lectura rápida'],
    secuenciaClases: [
      { semana: 1, tema: 'Géneros periodísticos: Noticia vs Crónica', contenido: 'Características de inmediatez y profundidad.', actividad: 'Análisis de un titular de prensa nacional.' }
    ]
  }
];

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

export const HORARIO_DOCENTE_SEMANAL = [
  { hora: '07:15 - 08:00', lunes: '8vo A (Lengua)', martes: '9no B (Lengua)', miercoles: '8vo A (Lengua)', jueves: '9no B (Lengua)', viernes: '8vo A (Lengua)' },
  { hora: '08:00 - 08:45', lunes: '8vo A (Lengua)', martes: '9no B (Lengua)', miercoles: '8vo A (Lengua)', jueves: '9no B (Lengua)', viernes: '8vo A (Lengua)' },
  { hora: '08:45 - 09:30', lunes: 'Planificación', martes: '9no B (Lengua)', miercoles: 'Refuerzo Pedagógico', jueves: '9no B (Lengua)', viernes: 'Tutoría Estudiantil' },
  { hora: '09:30 - 10:00', lunes: 'RECESO', martes: 'RECESO', miercoles: 'RECESO', jueves: 'RECESO', viernes: 'RECESO' },
  { hora: '10:00 - 10:45', lunes: 'Atención a Padres', martes: 'Comisión Pedagógica', miercoles: 'Revisión de Tareas', jueves: 'Atención DECE', viernes: 'Círculo de Estudio' },
  { hora: '10:45 - 11:30', lunes: 'Junta de Curso', martes: 'Planificación', miercoles: 'Coordinación de Área', jueves: 'Planificación', viernes: 'Gestión Documental' }
];
