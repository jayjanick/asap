import express, { Request, Response } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
// Generador de estudiantes y datos mock en el servidor
const NOMBRES_ESTUDIANTES_8VO = [
  'Alvarado Mendoza Juan Diego', 'Andrade Suárez Valentina Sofía', 'Barahona Zambrano Carlos Andrés',
  'Campoverde Silva Doménica Isabella', 'Castillo Loor Mateo Sebastián', 'Cedeño Macías Camila Nicole',
  'Chávez Moreira Lucas Gabriel', 'Cordero Benítez Emilia Renatta', 'Delgado Holguín Kevin Josué',
  'Espinoza Véliz Ana Paula', 'Flores Pincay Matías Alejandro', 'García Intriago Melany Michelle',
  'Guerrero Cárdenas Dylan Alexander', 'Hidalgo Paredes Romina Victoria', 'Jaramillo Bravo Isaac Fernando',
  'Lara Montalvo Fiorella Daniela', 'Mendoza Villacreses Thiago Manuel', 'Molina Villamar Danna Paola',
  'Navarrete Vélez Ian Roberto', 'Ochoa Rosero Paula Cristina', 'Pacheco Solórzano Joaquín David',
  'Quijije Vera Scarlett Estefanía', 'Rivadeneira Palma Leonardo José', 'Sánchez Guadamud Andrea Belén',
  'Torres Cevallos Axel Adrián', 'Vásquez Moran Maite Alejandra', 'Vera Coello Maximiliano Xavier',
  'Villavicencio Castro Mia Antonella', 'Zambrano Bailón Bruno Daniel', 'Zurita Álava Allison Dayana'
];

const NOMBRES_ESTUDIANTES_9NO = [
  'Aguilar Ponce David Eduardo', 'Bailón Castro Erika Noemí', 'Caicedo Mina Bryan Josué',
  'Carreño Barrezueta Jennifer Paola', 'Duque Solís Samuel Enrique', 'Escobar Rendón Daniela Carolina',
  'Farfán Quinde Gabriel Ignacio', 'Gómez Peñafiel Stephany Jazmín', 'Herrera Vallejo Justin Anthony',
  'Izquierdo Tello Valeria Montserrat', 'León Alarcón Fernando Josué', 'Macías Palacios Nayeli Briggette',
  'Narváez Guzmán Emilio Rafael', 'Ordoñez Villacís Karla Daniela', 'Pazmiño Cañarte Christian Xavier',
  'Pico Mendieta Ashley Milena', 'Reyes Arreaga Joshua Emanuel', 'Salazar Cobeña Angie Lisseth',
  'Tandazo Vite Erick Paul', 'Ubilla Carriel Melanie Solange', 'Valarezo Cobos Christopher Jair',
  'Véliz Giler Arianna Nicole', 'Yagual Chele Alexis Jonathan', 'Zavala Intriago Britany Anahí',
  'Arias Santana Kevin Daniel', 'Benalcázar Orellana Génesis Abigail', 'Cevallos Saltos Jorge Luis',
  'Díaz Barzola Dayanna Nicole', 'Franco Ronquillo Jonathan Ariel', 'Lucas Mendoza Melissa Katherine'
];

function crearEstudiantes(nombres: string[], paraleloId: string) {
  return nombres.map((nombre, index) => {
    const cedula = `09${Math.floor(10000000 + Math.random() * 90000000)}`;
    const faltasInjust = index === 3 || index === 17 ? 2 : index === 8 ? 1 : 0;
    const faltasJust = index === 4 || index === 21 ? 1 : 0;
    const atrasos = index % 5 === 0 ? 1 : 0;
    const porcentaje = Math.max(78, 100 - (faltasInjust * 5 + faltasJust * 2 + atrasos * 1.5));
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

export const PARALELOS_INICIALES = [
  {
    id: 'par-8vo-a',
    nombre: '8vo EGB "A"',
    grado: 8,
    nivel: 'Básica Superior',
    jornada: 'Matutina' as const,
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
    jornada: 'Matutina' as const,
    materia: 'Lengua y Literatura',
    totalEstudiantes: 30,
    asistenciaHoyRegistrada: false,
    porcentajeAsistenciaMes: 93.1,
    horario: 'Martes y Jueves — 07:15 a 09:30',
    aula: 'Bloque C · Aula 102',
    estudiantes: crearEstudiantes(NOMBRES_ESTUDIANTES_9NO, '9no-b')
  }
];

export const ACTIVIDADES_INICIALES = [
  {
    id: 'act-1',
    paraleloId: 'par-8vo-a',
    titulo: 'Taller 1: Estructura del ensayo argumentativo',
    tipo: 'Individual' as const,
    fechaEntrega: '2026-10-20',
    ponderacion: 10,
    entregadosCount: 30,
    totalCount: 30,
    estado: 'Calificado' as const,
    bloque: 2,
    descripcion: 'Identificar tesis, conectores adversativos y párrafos de conclusión en textos seleccionados.'
  },
  {
    id: 'act-2',
    paraleloId: 'par-8vo-a',
    titulo: 'Deber 2: Redacción de micro-crónica barrial',
    tipo: 'Individual' as const,
    fechaEntrega: '2026-10-24',
    ponderacion: 10,
    entregadosCount: 26,
    totalCount: 30,
    estado: 'Por calificar' as const,
    bloque: 2,
    descripcion: 'Elaborar un texto testimonial de 300 palabras sobre una tradición comunitaria.'
  },
  {
    id: 'act-3',
    paraleloId: 'par-8vo-a',
    titulo: 'Evaluación Parcial: Comprensión crítica y oratoria',
    tipo: 'Evaluacion' as const,
    fechaEntrega: '2026-10-28',
    ponderacion: 10,
    entregadosCount: 0,
    totalCount: 30,
    estado: 'En curso' as const,
    bloque: 2,
    descripcion: 'Exposición oral de 2 minutos sobre una temática de impacto ambiental en Guayaquil.'
  },
  {
    id: 'act-4',
    paraleloId: 'par-9no-b',
    titulo: 'Taller de Figuras Literarias y Métrica',
    tipo: 'Grupal' as const,
    fechaEntrega: '2026-10-22',
    ponderacion: 10,
    entregadosCount: 30,
    totalCount: 30,
    estado: 'Calificado' as const,
    bloque: 2,
    descripcion: 'Análisis estrófico y detección de metáforas en poetas ecuatorianos de la Generación Decapitada.'
  },
  {
    id: 'act-5',
    paraleloId: 'par-9no-b',
    titulo: 'Ensayo Crítico: Literatura e Identidad Andina',
    tipo: 'Individual' as const,
    fechaEntrega: '2026-10-26',
    ponderacion: 10,
    entregadosCount: 24,
    totalCount: 30,
    estado: 'Por calificar' as const,
    bloque: 2,
    descripcion: 'Redacción formal siguiendo la guía de normas APA básica provista por el docente.'
  }
];

export const PLANIFICACIONES_MINEDUC = [
  {
    id: 'plan-bloque-1',
    materia: 'Lengua y Literatura',
    bloque: 1,
    titulo: 'Bloque 1: Lengua y Cultura — Origen y evolución de la palabra escrita',
    destreza: 'LL.4.1.1. Indagar y explicar los aportes de la cultura escrita al desarrollo histórico, social y cultural de la humanidad.',
    semanas: 6,
    progreso: 100,
    estado: 'Completado' as const,
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
    estado: 'En curso' as const,
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
    estado: 'Por iniciar' as const,
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
import {
  generarPlanificacionCurricular,
  generarActividad,
  analizarRendimientoGrupo,
  generarInformeInstitucional,
  sugerirTareasTodo
} from '../services/gemini';
import { connectDB, isMongoConnected } from '../db';
import { seedDatabase } from '../seed';
import Usuario from '../models/Usuario';
import Paralelo from '../models/Paralelo';
import Alumno from '../models/Alumno';
import Documento from '../models/Documento';

const JWT_SECRET = process.env.JWT_SECRET || 'asap-super-secret-key-2026';

export const app = express();

const ALLOWED_ORIGINS = [
  'https://jayjanick.github.io',
  'http://localhost:3000',
  'http://localhost:5173',
  'https://asap-steel.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      ALLOWED_ORIGINS.includes(origin) ||
      origin.endsWith('.run.app') ||
      origin.endsWith('.google.com') ||
      origin.endsWith('.github.io') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Conexión a MongoDB Atlas y seed inicial
let dbInitPromise: Promise<boolean> | null = null;
export async function ensureDbConnected(): Promise<boolean> {
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      const connected = await connectDB();
      if (connected) {
        await seedDatabase(false);
      }
      return connected;
    })();
  }
  return dbInitPromise;
}

// Iniciar conexión en runtime (dev o prod)
ensureDbConnected().catch(() => {});

// Almacén de estado en memoria (fallback persistente durante la sesión)
let paralelosState = JSON.parse(JSON.stringify(PARALELOS_INICIALES));
let actividadesState = JSON.parse(JSON.stringify(ACTIVIDADES_INICIALES));
let planificacionesState = JSON.parse(JSON.stringify(PLANIFICACIONES_MINEDUC));
let kanbanTasks = [
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
    observaciones: 'Coordinar con la comisión pedagógica la rúbrica formativa.',
    adjuntos: []
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
    observaciones: 'Verificar estudiantes con justificativo médico antes de cerrar el acta.',
    adjuntos: []
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
    observaciones: 'Asistencia del 88% de padres de familia.',
    adjuntos: []
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
    observaciones: 'Revisar antología de poetas guayaquileños y cuencanos.',
    adjuntos: []
  }
];

let documentosState: any[] = [
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
];

// Matriz de notas por paralelo: [paraleloId][estudianteId][actividadId] = nota
let calificacionesMatrix: Record<string, Record<string, Record<string, number>>> = {};

function initCalificaciones() {
  paralelosState.forEach((p: any) => {
    calificacionesMatrix[p.id] = {};
    const acts = actividadesState.filter((a: any) => a.paraleloId === p.id);
    p.estudiantes.forEach((est: any) => {
      calificacionesMatrix[p.id][est.id] = {};
      acts.forEach((act: any, idx: number) => {
        const seed = (est.numeroLista * 7 + idx * 13) % 10;
        let nota = 7.0 + (seed / 10) * 2.8;
        if (est.numeroLista === 5 || est.numeroLista === 13) nota = 5.5 + (seed % 3) * 0.4;
        calificacionesMatrix[p.id][est.id][act.id] = Number(nota.toFixed(2));
      });
    });
  });
}
initCalificaciones();

// Helper para extraer usuario de JWT
function getUserFromToken(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (err) {
    return null;
  }
}

// ==========================================
// 1. HEALTH & METADATA
// ==========================================
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'asap',
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongoConnected: isMongoConnected(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
  });
});

// ==========================================
// 2. AUTHENTICATION (JWT + Demo + Google OAuth)
// ==========================================
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Correo y contraseña son requeridos' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Asegurar conexión a MongoDB si está pendiente
    if (!isMongoConnected()) {
      await connectDB();
    }

    // Si Mongo está conectado, consultar usuario y validar contraseña con bcrypt
    if (isMongoConnected()) {
      const dbUser = await Usuario.findOne({ email: cleanEmail });
      if (!dbUser) {
        return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      }

      // Validar contraseña con bcrypt (con soporte retrocompatible para contraseñas previas)
      let isValid = false;
      if (dbUser.password && dbUser.password.startsWith('$2')) {
        isValid = await bcrypt.compare(password, dbUser.password);
      } else if (dbUser.password) {
        isValid = password === dbUser.password;
        if (isValid) {
          dbUser.password = await bcrypt.hash(password, 10);
          await dbUser.save();
        }
      }

      if (!isValid) {
        return res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
      }

      const user = {
        id: dbUser._id.toString(),
        nombre: dbUser.nombre,
        email: dbUser.email,
        rol: dbUser.rol,
        institucion: dbUser.institucion,
        materias: dbUser.materias || [],
        avatar: dbUser.avatar || DOCENTE_ACTUAL.avatar,
        distrito: 'Distrito 09D04 · Guayaquil Centro',
        provincia: 'Guayas',
        canton: 'Guayaquil',
        totalAlumnos: 60,
        asistenciaPromedioGeneral: 94.8
      };

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          rol: user.rol,
          institucion: user.institucion
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        token,
        user,
        message: 'Sesión iniciada correctamente'
      });
    }

    // Fallback offline (solo si Mongo estuviese desconectado):
    // Andrés Morales solo funciona con sus credenciales exactas: andres.morales@uefdemocracia.edu.ec / asap2024
    if (cleanEmail === 'andres.morales@uefdemocracia.edu.ec') {
      if (password !== 'asap2024') {
        return res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
      }
      const token = jwt.sign(
        {
          id: 'docente-1',
          email: DOCENTE_ACTUAL.email,
          nombre: DOCENTE_ACTUAL.nombre,
          rol: DOCENTE_ACTUAL.rol,
          institucion: DOCENTE_ACTUAL.institucion
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({
        success: true,
        token,
        user: DOCENTE_ACTUAL,
        message: 'Sesión iniciada correctamente'
      });
    }

    return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
  } catch (error: any) {
    console.error('Error en /api/auth/login:', error);
    return res.status(500).json({ success: false, error: 'Error interno en el servidor' });
  }
});

app.post('/api/auth/google', async (req: Request, res: Response) => {
  const { credential, email, nombre, avatar } = req.body;

  const targetEmail = (email || 'andres.morales@uefdemocracia.edu.ec').toLowerCase().trim();
  let dbUser = null;

  if (isMongoConnected()) {
    try {
      dbUser = await Usuario.findOne({ email: targetEmail });
    } catch (e) {}
  }

  const user = {
    id: dbUser ? dbUser._id.toString() : 'docente-1',
    nombre: dbUser?.nombre || nombre || 'Lic. Andrés Morales',
    email: dbUser?.email || targetEmail,
    rol: dbUser?.rol || 'Docente',
    institucion: dbUser?.institucion || 'U.E. Fisco-Misional Democracia',
    materias: dbUser?.materias || ['Lengua y Literatura'],
    avatar: avatar || dbUser?.avatar || 'https://picsum.photos/seed/google_avatar/150/150'
  };

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      institucion: user.institucion,
      authProvider: 'google'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    token,
    user,
    message: 'Sesión iniciada con Google'
  });
});

app.get('/api/auth/me', async (req: Request, res: Response) => {
  const userPayload = getUserFromToken(req);
  if (userPayload) {
    if (isMongoConnected()) {
      try {
        const dbUser = await Usuario.findById(userPayload.id) || await Usuario.findOne({ email: userPayload.email });
        if (dbUser) {
          return res.json({
            success: true,
            user: {
              id: dbUser._id.toString(),
              nombre: dbUser.nombre,
              email: dbUser.email,
              rol: dbUser.rol,
              institucion: dbUser.institucion,
              materias: dbUser.materias || [],
              avatar: dbUser.avatar || DOCENTE_ACTUAL.avatar,
              distrito: 'Distrito 09D04 · Guayaquil Centro',
              provincia: 'Guayas',
              canton: 'Guayaquil',
              totalAlumnos: 60,
              asistenciaPromedioGeneral: 94.8
            }
          });
        }
      } catch (e) {}
    }
    return res.json({
      success: true,
      user: {
        id: userPayload.id,
        email: userPayload.email,
        nombre: userPayload.nombre,
        rol: userPayload.rol,
        institucion: userPayload.institucion,
        materias: userPayload.materias || ['Lengua y Literatura'],
        avatar: DOCENTE_ACTUAL.avatar
      }
    });
  }
  // No autorizado si no hay token válido
  res.status(401).json({ success: false, error: 'No autenticado' });
});

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const {
      nombre,
      email,
      password,
      edad,
      rol,
      institucion,
      provincia,
      canton,
      niveles,
      especialidadTecnica,
      cursos,
      estudiantesPorCurso
    } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ success: false, error: 'Nombre, correo y contraseña son requeridos.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    let savedUserId = 'docente-new';
    let mongoUser = null;

    if (!isMongoConnected()) {
      await connectDB();
    }

    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        error: 'No se pudo conectar a MongoDB Atlas. Por favor verifica las credenciales y el estado de la base de datos.'
      });
    }

    try {
      const existing = await Usuario.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(409).json({ success: false, error: 'Ya existe una cuenta registrada con este correo electrónico.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const createdUser = await Usuario.create({
        nombre: nombre.trim(),
        email: cleanEmail,
        password: hashedPassword,
        rol: rol || 'Docente',
        institucion: institucion || 'Unidad Educativa',
        materias: (cursos || []).map((c: any) => c.materia).filter(Boolean)
      });

      mongoUser = createdUser;
      savedUserId = createdUser._id.toString();
    } catch (err: any) {
      console.error('Error guardando usuario en MongoDB:', err);
      return res.status(500).json({ success: false, error: 'Error al registrar usuario: ' + (err.message || 'Error de base de datos') });
    }

    const createdParalelos: any[] = [];

    if (Array.isArray(cursos)) {
      for (const curso of cursos) {
        const paraleloNombre = `${curso.grado || 'Curso'} "${curso.paralelo || 'A'}" - ${curso.materia || 'General'}`;
        const estudiantesParaEsteCurso = (estudiantesPorCurso && estudiantesPorCurso[curso.id]) || [];

        let mongoParalelo: any = null;
        if (isMongoConnected() && mongoUser) {
          try {
            const gradoNum = parseInt((curso.grado || '').replace(/\D/g, '')) || 8;
            mongoParalelo = await Paralelo.create({
              nombre: paraleloNombre,
              grado: gradoNum,
              jornada: 'Matutina',
              docenteId: mongoUser._id,
              materias: [curso.materia || 'General'],
              nivel: curso.nivel || 'Educación Básica Superior',
              especialidad: especialidadTecnica || ''
            });

            if (Array.isArray(estudiantesParaEsteCurso) && estudiantesParaEsteCurso.length > 0) {
              const alumnoDocs = estudiantesParaEsteCurso.map((est: any) => ({
                nombre: est.nombre,
                cedula: est.cedula || '',
                paraleloId: mongoParalelo._id,
                activo: true
              }));
              await Alumno.insertMany(alumnoDocs);
            }
          } catch (pErr) {
            console.warn('Error guardando paralelo/alumnos en MongoDB:', pErr);
          }
        }

        // Sincronizar también con paralelosState en memoria
        const newParaleloState = {
          id: mongoParalelo ? mongoParalelo._id.toString() : `p-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          nombre: `${curso.grado || 'Curso'} "${curso.paralelo || 'A'}"`,
          materia: curso.materia || 'General',
          grado: curso.grado || '8vo EGB',
          jornada: 'Matutina',
          totalEstudiantes: estudiantesParaEsteCurso.length || curso.estudiantesAprox || 30,
          asistenciaHoyRegistrada: false,
          porcentajeAsistenciaMes: 100,
          aula: 'Bloque A · Aula 101',
          horario: '07:15 - 08:45',
          estudiantes: estudiantesParaEsteCurso.length > 0
            ? estudiantesParaEsteCurso.map((e: any, idx: number) => ({
                id: `est-new-${idx + 1}`,
                nombre: e.nombre,
                cedula: e.cedula || '',
                numeroLista: e.lista || idx + 1,
                faltasJustificadas: 0,
                faltasInjustificadas: 0,
                atrasos: 0
              }))
            : Array.from({ length: curso.estudiantesAprox || 30 }).map((_, idx) => ({
                id: `est-ph-${idx + 1}`,
                nombre: `Estudiante ${idx + 1}`,
                cedula: `09${10000000 + idx}`,
                numeroLista: idx + 1,
                faltasJustificadas: 0,
                faltasInjustificadas: 0,
                atrasos: 0
              }))
        };

        paralelosState.unshift(newParaleloState);
        createdParalelos.push(newParaleloState);
      }
    }

    const userResponse = {
      id: savedUserId,
      nombre: nombre.trim(),
      email: cleanEmail,
      rol: rol || 'Docente',
      institucion: institucion || 'Unidad Educativa',
      materias: (cursos || []).map((c: any) => c.materia).filter(Boolean),
      avatar: DOCENTE_ACTUAL.avatar
    };

    const token = jwt.sign(
      {
        id: savedUserId,
        email: cleanEmail,
        nombre: userResponse.nombre,
        rol: userResponse.rol,
        institucion: userResponse.institucion
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Docente y cursos registrados exitosamente',
      token,
      user: userResponse,
      cursosRegistrados: createdParalelos
    });
  } catch (err: any) {
    console.error('Error en /api/auth/register:', err);
    return res.status(500).json({ success: false, error: err.message || 'Error al procesar el registro' });
  }
});

// ==========================================
// 3. DASHBOARD (Panel Diario)
// ==========================================
app.get('/api/dashboard', async (_req: Request, res: Response) => {
  const actividadesPendientes = actividadesState.filter((a: any) => a.estado === 'Por calificar').length;
  const paralelosNombres = paralelosState.map((p: any) => p.nombre);

  // Cálculo del estado en curso según la hora del sistema
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Jornada matutina escolar ecuatoriana: 07:15 (435 min) a 12:45 (765 min)
  let claseActual = null;
  if (currentMinutes >= 435 && currentMinutes <= 525) {
    claseActual = {
      paralelo: '8vo EGB "A"',
      materia: 'Lengua y Literatura',
      aula: 'Bloque B · Aula 204',
      horario: '07:15 a 08:45',
      tema: 'Estructura y conectores en el ensayo argumentativo'
    };
  } else if (currentMinutes > 525 && currentMinutes <= 600) {
    claseActual = {
      paralelo: '9no EGB "B"',
      materia: 'Lengua y Literatura',
      aula: 'Bloque A · Aula 102',
      horario: '08:45 a 10:00',
      tema: 'Métrica y recursos estilísticos en la poesía lírica'
    };
  }

  const smartTodo = await sugerirTareasTodo({
    actividadesSinCalificar: actividadesPendientes,
    planificacionesPorIniciar: 1,
    asistenciaPendienteHoy: paralelosState.some((p: any) => !p.asistenciaHoyRegistrada),
    paralelosNombres
  });

  res.json({
    success: true,
    docente: DOCENTE_ACTUAL,
    resumenHoy: {
      fecha: new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      jornada: 'Matutina (07:15 - 12:45)',
      claseActual,
      proximaClase: {
        paralelo: '9no EGB "B"',
        materia: 'Lengua y Literatura',
        horario: '10:00 a 11:30',
        tema: 'Taller de redacción de microcuentos'
      }
    },
    estadisticas: {
      totalEstudiantes: 60,
      actividadesPorCalificar: actividadesPendientes,
      clasesPlanificadasSemana: 14,
      asistenciaPromedioMes: 94.8,
      informesGenerados: 3
    },
    porHacerInteligente: smartTodo,
    ultimasActividades: [
      { id: '1', accion: 'Asistencia registrada', detalle: '8vo EGB "A" — 28 presentes, 1 atraso, 1 falta justificada', tiempo: 'Hace 45 min' },
      { id: '2', accion: 'Nueva actividad creada con IA', detalle: 'Deber 2: Micro-crónica barrial asignada a 8vo A', tiempo: 'Hace 3 horas' },
      { id: '3', accion: 'Calificaciones actualizadas', detalle: 'Taller de Figuras Literarias en 9no B cerrado con promedio 8.1', tiempo: 'Ayer' },
      { id: '4', accion: 'Planificación generada', detalle: 'Bloque 2 validado según destrezas MINEDUC', tiempo: 'Hace 2 días' }
    ]
  });
});

// ==========================================
// 4. PARALELOS & ASISTENCIA
// ==========================================
app.get('/api/paralelos', async (req: Request, res: Response) => {
  if (isMongoConnected()) {
    try {
      const userPayload = getUserFromToken(req);
      const docenteId = userPayload?.id;
      const query = docenteId ? { docenteId } : {};
      const paralelos = await Paralelo.find(query);
      if (paralelos && paralelos.length > 0) {
        return res.json({
          success: true,
          paralelos: paralelos.map((p: any) => ({
            id: p._id.toString(),
            nombre: p.nombre,
            grado: p.grado,
            nivel: p.nivel || 'Educación Básica Superior',
            jornada: p.jornada || 'Matutina',
            materia: p.materia || (p.materias && p.materias[0]) || 'General',
            horario: p.horario || '07:15 - 08:45',
            aula: p.aula || 'Aula 101',
            totalEstudiantes: p.totalEstudiantes || 30,
            asistenciaHoyRegistrada: Boolean(p.asistenciaHoyRegistrada),
            porcentajeAsistenciaMes: 100
          }))
        });
      }
    } catch (err) {
      console.warn('Error obteniendo paralelos en MongoDB:', err);
    }
  }

  // Fallback cuando !isMongoConnected()
  res.json({
    success: true,
    paralelos: paralelosState.map((p: any) => ({
      id: p.id,
      nombre: p.nombre,
      grado: p.grado,
      jornada: p.jornada,
      materia: p.materia,
      totalEstudiantes: p.totalEstudiantes,
      asistenciaHoyRegistrada: p.asistenciaHoyRegistrada,
      porcentajeAsistenciaMes: p.porcentajeAsistenciaMes,
      aula: p.aula,
      horario: p.horario
    }))
  });
});

app.get('/api/asistencia', async (req: Request, res: Response) => {
  if (isMongoConnected()) {
    try {
      const userPayload = getUserFromToken(req);
      const docenteId = userPayload?.id;
      const query = docenteId ? { docenteId } : {};
      const paralelos = await Paralelo.find(query);
      if (paralelos && paralelos.length > 0) {
        return res.json({
          success: true,
          paralelos: paralelos.map((p: any) => ({
            id: p._id.toString(),
            nombre: p.nombre,
            grado: p.grado,
            jornada: p.jornada || 'Matutina',
            materia: p.materia || (p.materias && p.materias[0]) || 'General',
            totalEstudiantes: p.totalEstudiantes || 30,
            asistenciaHoyRegistrada: Boolean(p.asistenciaHoyRegistrada),
            porcentajeAsistenciaMes: 100,
            aula: p.aula || 'Aula 101',
            horario: p.horario || '07:15 - 08:45'
          }))
        });
      }
    } catch (err) {
      console.warn('Error obteniendo asistencia de paralelos en MongoDB:', err);
    }
  }

  // Fallback cuando !isMongoConnected()
  res.json({
    success: true,
    paralelos: paralelosState.map((p: any) => ({
      id: p.id,
      nombre: p.nombre,
      grado: p.grado,
      jornada: p.jornada,
      materia: p.materia,
      totalEstudiantes: p.totalEstudiantes,
      asistenciaHoyRegistrada: p.asistenciaHoyRegistrada,
      porcentajeAsistenciaMes: p.porcentajeAsistenciaMes,
      aula: p.aula,
      horario: p.horario
    }))
  });
});

app.get('/api/asistencia/:cursoId', (req: Request, res: Response) => {
  const paralelo = paralelosState.find((p: any) => p.id === req.params.cursoId);
  if (!paralelo) {
    return res.status(404).json({ success: false, error: 'Paralelo no encontrado' });
  }

  const asistenciaHoy = paralelo.estudiantes.map((est: any, idx: number) => {
    let estado: 'P' | 'A' | 'F' = 'P';
    let justificada = false;
    let motivo = '';

    if (idx === 4) {
      estado = 'F';
      justificada = true;
      motivo = 'Cita médica en IESS Guayaquil (Certificado presentado)';
    } else if (idx === 12) {
      estado = 'A';
      motivo = 'Llegada 10 min tarde por transporte';
    }

    const totalDias = 20; // Días laborables del mes
    const totalFaltas = (est.faltasJustificadas || 0) + (est.faltasInjustificadas || 0);
    const porcentajeFaltas = Number(((totalFaltas / totalDias) * 100).toFixed(1));

    return {
      estudianteId: est.id,
      nombre: est.nombre,
      numeroLista: est.numeroLista,
      cedula: est.cedula,
      estado,
      justificada,
      motivo,
      faltasJustificadas: est.faltasJustificadas || 0,
      faltasInjustificadas: est.faltasInjustificadas || 0,
      atrasos: est.atrasos || 0,
      porcentajeFaltas
    };
  });

  res.json({
    success: true,
    paralelo,
    fecha: new Date().toISOString().slice(0, 10),
    asistenciaHoy
  });
});

app.post('/api/asistencia/:cursoId', async (req: Request, res: Response) => {
  const { registros, observacionGeneral } = req.body;
  const index = paralelosState.findIndex((p: any) => p.id === req.params.cursoId);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Paralelo no encontrado' });
  }

  paralelosState[index].asistenciaHoyRegistrada = true;

  if (Array.isArray(registros)) {
    registros.forEach((reg: any) => {
      const est = paralelosState[index].estudiantes.find((e: any) => e.id === reg.estudianteId);
      if (est) {
        if (reg.estado === 'F') {
          if (reg.justificada) est.faltasJustificadas = (est.faltasJustificadas || 0) + 1;
          else est.faltasInjustificadas = (est.faltasInjustificadas || 0) + 1;
        } else if (reg.estado === 'A') {
          est.atrasos = (est.atrasos || 0) + 1;
        }
      }
    });
  }

  // Si Mongo está conectado, persistir también en base de datos
  if (isMongoConnected()) {
    try {
      const ParaleloModel = Paralelo;
      await ParaleloModel.findOneAndUpdate(
        { nombre: paralelosState[index].nombre },
        { asistenciaHoyRegistrada: true }
      );
    } catch (err) {
      console.warn('Error sincronizando asistencia en MongoDB:', err);
    }
  }

  res.json({
    success: true,
    message: 'Asistencia del día guardada satisfactoriamente en el sistema',
    paraleloId: req.params.cursoId,
    fecha: new Date().toISOString()
  });
});

// ==========================================
// 5. CALIFICACIONES & ANÁLISIS IA
// ==========================================
app.get('/api/calificaciones', async (req: Request, res: Response) => {
  if (isMongoConnected()) {
    try {
      const userPayload = getUserFromToken(req);
      const docenteId = userPayload?.id;
      const query = docenteId ? { docenteId } : {};
      const paralelos = await Paralelo.find(query);
      if (paralelos && paralelos.length > 0) {
        return res.json({
          success: true,
          paralelos: paralelos.map((p: any) => ({
            id: p._id.toString(),
            nombre: p.nombre,
            grado: p.grado,
            materia: p.materia || (p.materias && p.materias[0]) || 'General'
          }))
        });
      }
    } catch (err) {
      console.warn('Error obteniendo calificaciones de MongoDB:', err);
    }
  }

  // Fallback cuando !isMongoConnected()
  res.json({
    success: true,
    paralelos: paralelosState.map((p: any) => ({
      id: p.id,
      nombre: p.nombre,
      grado: p.grado,
      materia: p.materia
    }))
  });
});

app.get('/api/calificaciones/:cursoId', async (req: Request, res: Response) => {
  const { cursoId } = req.params;

  if (isMongoConnected()) {
    try {
      let mongoParalelo = null;
      if (cursoId && cursoId.match(/^[0-9a-fA-F]{24}$/)) {
        mongoParalelo = await Paralelo.findById(cursoId);
      }
      if (!mongoParalelo) {
        mongoParalelo = await Paralelo.findOne({ nombre: cursoId });
      }
      if (mongoParalelo) {
        const alumnos = await Alumno.find({ paraleloId: mongoParalelo._id.toString() });
        const paraleloObj = {
          id: mongoParalelo._id.toString(),
          nombre: mongoParalelo.nombre,
          grado: mongoParalelo.grado,
          materia: mongoParalelo.materia || (mongoParalelo.materias && mongoParalelo.materias[0]) || 'General',
          estudiantes: alumnos.map((a: any, idx: number) => ({
            id: a._id.toString(),
            nombre: a.nombre,
            numeroLista: a.numeroLista || idx + 1,
            cedula: a.cedula
          }))
        };
        const actividades = actividadesState.filter((a: any) => a.paraleloId === paraleloObj.id || a.paraleloId === 'par-8vo-a');
        const matrix = calificacionesMatrix[paraleloObj.id] || calificacionesMatrix['par-8vo-a'] || {};

        const libroNotas = paraleloObj.estudiantes.map((est: any) => {
          const notasAlumno: Record<string, number> = matrix[est.id] || {};
          const notasArray = actividades.map((a: any) => notasAlumno[a.id] ?? 0);
          const suma = notasArray.reduce((acc: number, curr: number) => acc + curr, 0);
          const promedio = notasArray.length > 0 ? Number((suma / notasArray.length).toFixed(2)) : 0;

          return {
            estudianteId: est.id,
            nombre: est.nombre,
            numeroLista: est.numeroLista,
            cedula: est.cedula,
            notas: notasAlumno,
            promedio
          };
        });

        const promediosTodos = libroNotas.map((n: any) => n.promedio);
        const promedioGeneral = promediosTodos.length > 0
          ? Number((promediosTodos.reduce((a: number, b: number) => a + b, 0) / promediosTodos.length).toFixed(2))
          : 7.5;
        const aprobados = promediosTodos.filter((p: number) => p >= 7.0).length;
        const porcentajeAprobados = promediosTodos.length > 0 ? (aprobados / promediosTodos.length) * 100 : 85;

        return res.json({
          success: true,
          paralelo: paraleloObj,
          actividades,
          libroNotas,
          estadisticas: {
            promedioGeneral,
            porcentajeAprobados,
            totalEstudiantes: libroNotas.length,
            enRiesgo: libroNotas.filter((n: any) => n.promedio < 7.0)
          }
        });
      }
    } catch (err) {
      console.warn('Error consultando calificaciones de curso en MongoDB:', err);
    }
  }
  const paralelo = paralelosState.find((p: any) => p.id === req.params.cursoId) || paralelosState[0];
  if (!paralelo) {
    return res.status(404).json({ success: false, error: 'Paralelo no encontrado' });
  }

  const actividades = actividadesState.filter((a: any) => a.paraleloId === paralelo.id);
  const matrix = calificacionesMatrix[paralelo.id] || {};

  const libroNotas = paralelo.estudiantes.map((est: any) => {
    const notasAlumno: Record<string, number> = matrix[est.id] || {};
    const notasArray = actividades.map((a: any) => notasAlumno[a.id] ?? 0);
    const suma = notasArray.reduce((acc: number, curr: number) => acc + curr, 0);
    const promedio = notasArray.length > 0 ? Number((suma / notasArray.length).toFixed(2)) : 0;

    return {
      estudianteId: est.id,
      nombre: est.nombre,
      numeroLista: est.numeroLista,
      cedula: est.cedula,
      notas: notasAlumno,
      promedio
    };
  });

  const promediosTodos = libroNotas.map((n: any) => n.promedio);
  const promedioGeneral = promediosTodos.length > 0
    ? Number((promediosTodos.reduce((a: number, b: number) => a + b, 0) / promediosTodos.length).toFixed(2))
    : 7.5;
  const aprobados = promediosTodos.filter((p: number) => p >= 7.0).length;
  const porcentajeAprobados = promediosTodos.length > 0 ? (aprobados / promediosTodos.length) * 100 : 85;

  res.json({
    success: true,
    paralelo,
    actividades,
    libroNotas,
    estadisticas: {
      promedioGeneral,
      porcentajeAprobados,
      totalEstudiantes: libroNotas.length,
      enRiesgo: libroNotas.filter((n: any) => n.promedio < 7.0)
    }
  });
});

app.put('/api/calificaciones/celda', (req: Request, res: Response) => {
  const { paraleloId, estudianteId, actividadId, nota } = req.body;
  const parsedNota = Math.max(0, Math.min(10, Number(nota) || 0));

  if (!calificacionesMatrix[paraleloId]) calificacionesMatrix[paraleloId] = {};
  if (!calificacionesMatrix[paraleloId][estudianteId]) calificacionesMatrix[paraleloId][estudianteId] = {};

  calificacionesMatrix[paraleloId][estudianteId][actividadId] = Number(parsedNota.toFixed(2));

  res.json({
    success: true,
    nota: parsedNota,
    message: 'Nota actualizada correctamente'
  });
});

app.post('/api/calificaciones/actividad', (req: Request, res: Response) => {
  const { paraleloId, titulo, tipo, fechaEntrega, ponderacion } = req.body;
  const nuevaActividad = {
    id: `act-${Date.now()}`,
    paraleloId,
    titulo: titulo || 'Nueva Evaluación',
    tipo: tipo || 'Individual',
    fechaEntrega: fechaEntrega || new Date().toISOString().slice(0, 10),
    ponderacion: Number(ponderacion) || 10,
    entregadosCount: 0,
    totalCount: 30,
    estado: 'Por calificar',
    bloque: 2
  };

  actividadesState.push(nuevaActividad);

  // Inicializar en blanco (placeholder "-") para todos
  if (calificacionesMatrix[paraleloId]) {
    Object.keys(calificacionesMatrix[paraleloId]).forEach((estId) => {
      calificacionesMatrix[paraleloId][estId][nuevaActividad.id] = 0;
    });
  }

  res.status(201).json({
    success: true,
    actividad: nuevaActividad
  });
});

// Endpoint oficial de análisis de rendimiento por paralelo
app.post('/api/ai/analisis-rendimiento', async (req: Request, res: Response) => {
  const { paraleloId } = req.body;
  const paralelo = paralelosState.find((p: any) => p.id === paraleloId) || paralelosState[0];
  const actividades = actividadesState.filter((a: any) => a.paraleloId === paralelo.id);
  const matrix = calificacionesMatrix[paralelo.id] || {};

  const enRiesgo: any[] = [];
  let sumaGeneral = 0;
  let conteo = 0;

  paralelo.estudiantes.forEach((est: any) => {
    const notasAlumno = matrix[est.id] || {};
    const valores = Object.values(notasAlumno) as number[];
    const prom = valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : 7.2;
    sumaGeneral += prom;
    conteo++;
    if (prom < 7.0) {
      enRiesgo.push({ nombre: est.nombre, promedio: Number(prom.toFixed(2)) });
    }
  });

  const promedioGeneral = conteo > 0 ? sumaGeneral / conteo : 7.4;
  const porcentajeAprobados = conteo > 0 ? ((conteo - enRiesgo.length) / conteo) * 100 : 85;

  const analisis = await analizarRendimientoGrupo({
    paraleloNombre: paralelo.nombre,
    materia: paralelo.materia,
    promedioGeneral,
    porcentajeAprobados,
    estudiantesEnRiesgo: enRiesgo,
    actividadesCriticas: actividades.slice(0, 2).map((a: any) => ({ titulo: a.titulo, promedio: 6.8 }))
  });

  res.json({
    success: true,
    analisis
  });
});

// Alias compatible
app.post('/api/calificaciones/analisis-ia', (req: Request, res: Response) => {
  return (app as any)._router.handle({ ...req, url: '/api/ai/analisis-rendimiento' }, res, () => {});
});

// Endpoint oficial de generación de informe con Gemini
app.post('/api/ai/informe', async (req: Request, res: Response) => {
  const { paraleloNombre, periodo } = req.body;
  const informe = await generarInformeInstitucional({
    docenteNombre: DOCENTE_ACTUAL.nombre,
    institucion: DOCENTE_ACTUAL.institucion,
    paraleloNombre: paraleloNombre || '8vo EGB "A"',
    materia: 'Lengua y Literatura',
    periodo: periodo || 'Primer Quimestre - Parcial 2',
    promedio: 8.24,
    porcentajeAsistencia: 94.6
  });

  res.json({ success: true, informe });
});

// Alias compatible
app.post('/api/workspace/informe-oficial', (req: Request, res: Response) => {
  return (app as any)._router.handle({ ...req, url: '/api/ai/informe' }, res, () => {});
});

// ==========================================
// 6. PLANIFICACIÓN CON IA
// ==========================================
app.get('/api/planificacion', (_req: Request, res: Response) => {
  res.json({
    success: true,
    planificaciones: planificacionesState
  });
});

app.post('/api/planificacion/generar-ia', async (req: Request, res: Response) => {
  const { materia, bloque, destreza, nivel, semanas } = req.body;
  const plan = await generarPlanificacionCurricular({
    materia: materia || 'Lengua y Literatura',
    bloque: bloque || 2,
    destreza: destreza || 'LL.4.2.1. Utilizar recursos de la comunicación oral en contextos de intercambio social',
    nivel: nivel || '8vo EGB Superior',
    semanas: Number(semanas) || 4
  });

  res.json({
    success: true,
    plan
  });
});

app.post('/api/planificacion', (req: Request, res: Response) => {
  const nuevoPlan = {
    id: `plan-${Date.now()}`,
    progreso: 0,
    estado: 'Por iniciar',
    generadaIA: true,
    ...req.body
  };
  planificacionesState.push(nuevoPlan);
  res.status(201).json({
    success: true,
    plan: nuevoPlan
  });
});

// ==========================================
// 7. WORKSPACE: KANBAN & MIS DOCUMENTOS
// ==========================================
app.get('/api/workspace', (_req: Request, res: Response) => {
  res.json({
    success: true,
    kanbanTasks,
    plantillas: PLANTILLAS_MINEDUC,
    actividades: actividadesState,
    documentos: documentosState
  });
});

// Kanban endpoints con soporte de prioridad, fecha límite y observaciones
app.get('/api/workspace/kanban', (_req: Request, res: Response) => {
  res.json({ success: true, kanbanTasks });
});

app.post('/api/workspace/kanban', (req: Request, res: Response) => {
  const { titulo, descripcion, paralelo, columna, prioridad, urgencia, fechaLimite, observaciones } = req.body;
  const nuevaTarea = {
    id: `kb-${Date.now()}`,
    titulo: titulo || 'Nueva tarea docente',
    descripcion: descripcion || '',
    paralelo: paralelo || 'General',
    columna: columna || 'Por hacer',
    prioridad: prioridad || urgencia || 'Media',
    urgencia: urgencia || prioridad || 'Media',
    fecha: new Date().toISOString().slice(0, 10),
    fechaLimite: fechaLimite || '',
    observaciones: observaciones || '',
    adjuntos: []
  };
  kanbanTasks.unshift(nuevaTarea);
  res.status(201).json({ success: true, tarea: nuevaTarea });
});

app.put('/api/workspace/kanban/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = kanbanTasks.findIndex((t) => t.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Tarea no encontrada' });
  }

  kanbanTasks[index] = {
    ...kanbanTasks[index],
    ...req.body
  };

  res.json({ success: true, tarea: kanbanTasks[index] });
});

app.delete('/api/workspace/kanban/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  kanbanTasks = kanbanTasks.filter((t) => t.id !== id);
  res.json({ success: true, message: 'Tarea eliminada' });
});

// Endpoints de "Mis Documentos" con soporte para Base64 y categorías
app.get('/api/workspace/documentos', async (_req: Request, res: Response) => {
  if (isMongoConnected()) {
    try {
      const docs = await Documento.find().sort({ createdAt: -1 });
      if (docs && docs.length > 0) {
        return res.json({
          success: true,
          documentos: docs.map((d: any) => ({
            id: d._id.toString(),
            nombre: d.nombre,
            categoria: d.categoria,
            descripcion: d.descripcion,
            tamano: d.tamano,
            tipo: d.tipo,
            fechaSubida: d.fechaSubida,
            contenidoBase64: d.contenidoBase64
          }))
        });
      }
    } catch (err) {
      console.warn('Error obteniendo documentos de MongoDB:', err);
    }
  }
  res.json({ success: true, documentos: documentosState });
});

app.post('/api/workspace/documentos', async (req: Request, res: Response) => {
  const { nombre, categoria, descripcion, tamano, tipo, contenidoBase64 } = req.body;
  const nuevoDoc = {
    id: `doc-${Date.now()}`,
    nombre: nombre || 'Documento_Docente.pdf',
    categoria: categoria || 'Personal',
    descripcion: descripcion || 'Documento administrativo o pedagógico',
    tamano: tamano || '120 KB',
    tipo: tipo || 'PDF',
    fechaSubida: new Date().toLocaleDateString('es-EC'),
    contenidoBase64: contenidoBase64 || ''
  };

  documentosState.unshift(nuevoDoc);

  if (isMongoConnected()) {
    try {
      await Documento.create({
        nombre: nuevoDoc.nombre,
        categoria: nuevoDoc.categoria,
        descripcion: nuevoDoc.descripcion,
        tamano: nuevoDoc.tamano,
        tipo: nuevoDoc.tipo,
        fechaSubida: nuevoDoc.fechaSubida,
        contenidoBase64: nuevoDoc.contenidoBase64
      });
    } catch (err) {
      console.warn('Error guardando documento en MongoDB:', err);
    }
  }

  res.status(201).json({ success: true, documento: nuevoDoc });
});

app.get('/api/workspace/documentos/:id/descargar', async (req: Request, res: Response) => {
  const { id } = req.params;

  let doc = documentosState.find((d) => d.id === id);
  if (!doc && isMongoConnected()) {
    try {
      doc = await Documento.findById(id);
    } catch (err) {}
  }

  if (!doc) {
    return res.status(404).json({ success: false, error: 'Documento no encontrado' });
  }

  res.json({
    success: true,
    nombre: doc.nombre,
    tipo: doc.tipo,
    contenidoBase64: doc.contenidoBase64
  });
});

app.delete('/api/workspace/documentos/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  documentosState = documentosState.filter((d) => d.id !== id);

  if (isMongoConnected()) {
    try {
      await Documento.findByIdAndDelete(id);
    } catch (err) {}
  }

  res.json({ success: true, message: 'Documento eliminado correctamente' });
});

export default app;
