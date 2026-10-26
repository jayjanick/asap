import express, { Request, Response } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { GoogleGenAI } from '@google/genai';
import mongoose, { Schema, Document, Types } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// ==========================================
// MOCK DATA & GENERATORS
// ==========================================
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

// ==========================================
// DATABASE (MongoDB & Mongoose Models) - Vercel Cached Pattern
// ==========================================
let cached: typeof mongoose | null = null;

export async function connectDB(): Promise<boolean> {
  if (cached && mongoose.connection.readyState === 1) return true;
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('usuario:password')) return false;
  try {
    cached = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, bufferCommands: false });
    return true;
  } catch (e) {
    cached = null;
    return false;
  }
}

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function ensureDbConnected(): Promise<boolean> {
  const connected = await connectDB();
  if (connected) {
    await seedDatabase(false).catch(() => {});
  }
  return connected;
}

// Schemas & Models
const UsuarioSchema = new Schema(
  {
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    rol: { type: String, enum: ['Docente', 'Director', 'Coordinador'], default: 'Docente' },
    materias: [{ type: String }],
    institucion: { type: String, required: true },
    telefono: { type: String },
    avatar: { type: String },
  },
  { timestamps: true }
);
const Usuario = mongoose.models.Usuario || mongoose.model('Usuario', UsuarioSchema);

const ParaleloSchema = new Schema(
  {
    nombre: { type: String, required: true },
    grado: { type: Number, required: true },
    jornada: { type: String, enum: ['Matutina', 'Vespertina', 'Nocturna'], default: 'Matutina' },
    docenteId: { type: String, required: true },
    materias: [{ type: String }],
    nivel: { type: String, default: 'Educación Básica Superior' },
    especialidad: { type: String },
    asistenciaHoyRegistrada: { type: Boolean, default: false }
  },
  { timestamps: true }
);
const Paralelo = mongoose.models.Paralelo || mongoose.model('Paralelo', ParaleloSchema);

const AlumnoSchema = new Schema(
  {
    nombre: { type: String, required: true },
    cedula: { type: String, required: false },
    paraleloId: { type: Schema.Types.ObjectId, ref: 'Paralelo', required: true },
    activo: { type: Boolean, default: true },
    contactoRepresentante: { type: String },
    telefonoRepresentante: { type: String },
    observaciones: [{ type: String }],
  },
  { timestamps: true }
);
const Alumno = mongoose.models.Alumno || mongoose.model('Alumno', AlumnoSchema);

const DocumentoSchema = new Schema(
  {
    nombre: { type: String, required: true },
    categoria: {
      type: String,
      enum: ['Personal', 'Planificación', 'Estudiante', 'Plantilla', 'Institucional'],
      default: 'Personal'
    },
    descripcion: { type: String, default: '' },
    tamano: { type: String, default: '150 KB' },
    fechaSubida: { type: String, default: () => new Date().toLocaleDateString('es-EC') },
    tipo: { type: String, default: 'PDF' },
    contenidoBase64: { type: String },
    url: { type: String },
    docenteId: { type: String, default: 'docente-1' }
  },
  { timestamps: true }
);
const Documento = mongoose.models.Documento || mongoose.model('Documento', DocumentoSchema);

const AsistenciaSchema = new Schema(
  {
    paraleloId: { type: String, required: true },
    fecha: { type: String, required: true },
    registros: [{
      estudianteId: String,
      estado: String,
      justificada: Boolean,
      motivo: String
    }]
  },
  { timestamps: true }
);
const Asistencia = mongoose.models.Asistencia || mongoose.model('Asistencia', AsistenciaSchema);

const CalificacionSchema = new Schema(
  {
    paraleloId: { type: String, required: true },
    estudianteId: { type: String, required: true },
    actividadId: { type: String, required: true },
    nota: { type: Number, required: true }
  },
  { timestamps: true }
);
const Calificacion = mongoose.models.Calificacion || mongoose.model('Calificacion', CalificacionSchema);

const ActividadSchema = new Schema(
  {
    paraleloId: { type: String, required: true },
    titulo: { type: String, required: true },
    tipo: { type: String, default: 'Individual' },
    fechaEntrega: { type: String },
    ponderacion: { type: Number, default: 10 },
    entregadosCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 30 },
    estado: { type: String, default: 'Por calificar' },
    bloque: { type: Number, default: 2 },
    descripcion: { type: String }
  },
  { timestamps: true }
);
const Actividad = mongoose.models.Actividad || mongoose.model('Actividad', ActividadSchema);

const KanbanTaskSchema = new Schema(
  {
    titulo: { type: String, required: true },
    descripcion: { type: String },
    paralelo: { type: String },
    columna: { type: String, default: 'Por hacer' },
    prioridad: { type: String, default: 'Media' },
    urgencia: { type: String, default: 'Media' },
    fecha: { type: String },
    fechaLimite: { type: String },
    observaciones: { type: String },
    adjuntos: [{ type: String }],
    docenteId: { type: String, default: 'docente-1' }
  },
  { timestamps: true }
);
const KanbanTask = mongoose.models.KanbanTask || mongoose.model('KanbanTask', KanbanTaskSchema);

// Seed database function
export async function seedDatabase(force = false) {
  const connected = await connectDB();
  if (!connected) return;
  try {
    const existingUser = await Usuario.findOne({ email: 'andres.morales@uefdemocracia.edu.ec' });
    if (existingUser && !force) return;

    const hashedPassword = await bcrypt.hash('asap2024', 10);
    const docenteData = {
      nombre: 'Lic. Andrés Morales',
      email: 'andres.morales@uefdemocracia.edu.ec',
      password: hashedPassword,
      rol: 'Docente',
      materias: ['Lengua y Literatura'],
      institucion: 'U.E. Fisco-Misional Democracia',
      telefono: '+593 98 765 4321',
      avatar: 'https://picsum.photos/seed/docente_andres/150/150'
    };

    const docente = await Usuario.findOneAndUpdate(
      { email: 'andres.morales@uefdemocracia.edu.ec' },
      force ? docenteData : { $setOnInsert: docenteData },
      { upsert: true, new: true }
    );

    for (const p of PARALELOS_INICIALES) {
      const paraleloData = {
        nombre: p.nombre,
        grado: p.grado,
        nivel: p.nivel,
        jornada: p.jornada,
        materia: p.materia,
        horario: p.horario,
        aula: p.aula,
        docenteId: docente._id.toString()
      };

      const paraleloDoc = await Paralelo.findOneAndUpdate(
        { nombre: p.nombre },
        force ? paraleloData : { $setOnInsert: paraleloData },
        { upsert: true, new: true }
      );

      for (const est of p.estudiantes) {
        const alumnoData = {
          nombre: est.nombre,
          cedula: est.cedula,
          numeroLista: est.numeroLista,
          paraleloId: paraleloDoc._id.toString(),
          activo: est.activo,
          telefonoRepresentante: est.telefonoRepresentante || '+593 99 123 4567',
          faltasJustificadas: est.faltasJustificadas || 0,
          faltasInjustificadas: est.faltasInjustificadas || 0,
          atrasos: est.atrasos || 0
        };

        await Alumno.findOneAndUpdate(
          { cedula: est.cedula },
          force ? alumnoData : { $setOnInsert: alumnoData },
          { upsert: true }
        );
      }
    }
  } catch (err) {
    console.error('Error in seedDatabase:', err);
  }
}

// ==========================================
// GEMINI AI SERVICE
// ==========================================
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });
};

export async function generarPlanificacionCurricular(params: {
  materia: string;
  bloque: number | string;
  destreza: string;
  nivel: string;
  semanas: number;
}) {
  const ai = getAiClient();
  const prompt = `Actúa como especialista pedagógico del Ministerio de Educación del Ecuador (MINEDUC).
Genera una planificación microcurricular para la materia "${params.materia}", nivel "${params.nivel}", bloque ${params.bloque}.
Destreza con criterio de desempeño (DCD): "${params.destreza}".
Duración: ${params.semanas} semanas.
Responde ÚNICAMENTE en JSON válido con la siguiente estructura exacta:
{
  "tituloUnidad": "Título pedagógico de la unidad",
  "objetivos": ["Objetivo 1", "Objetivo 2"],
  "criteriosEvaluacion": ["Criterio 1"],
  "secuenciaClases": [
    { "semana": 1, "tema": "Tema", "contenido": "Contenido", "actividadSugerida": "Actividad", "recursos": ["Texto"] }
  ],
  "actividadesEvaluacion": ["Instrumento"],
  "adaptacionesCurriculares": "Orientaciones"
}`;

  if (ai) {
    let attempts = 0;
    while (attempts < 2) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json', temperature: 0.3 }
        });
        const text = response?.text?.trim() || '';
        const parsed = JSON.parse(text);
        return { ...parsed, generadaIA: true };
      } catch (err: any) {
        if (err?.status === 503 && attempts === 0) {
          await new Promise(r => setTimeout(r, 2000));
          attempts++;
        } else {
          break;
        }
      }
    }
  }

  return {
    tituloUnidad: `Unidad ${params.bloque}: Aplicación de ${params.destreza.slice(0, 45)}...`,
    objetivos: [`Desarrollar habilidades comunicativas y de análisis crítico aplicadas a ${params.materia}.`],
    criteriosEvaluacion: [`CE.LL.${params.bloque}.1 Aplica estrategias cognitivas`],
    secuenciaClases: [{ semana: 1, tema: `Exploración de ${params.destreza}`, contenido: 'ERCA', actividadSugerida: 'Taller', recursos: ['Texto'] }],
    actividadesEvaluacion: ['Rúbrica'],
    adaptacionesCurriculares: 'Flexibilidad curricular',
    generadaIA: false
  };
}

export async function generarActividad(params: { materia: string; destreza: string; tipoActividad: string; nivel: string }) {
  const ai = getAiClient();
  const prompt = `Crea una actividad didáctica de tipo "${params.tipoActividad}" para la materia "${params.materia}" (Nivel: ${params.nivel}). Destreza: "${params.destreza}". Responde en JSON.`;
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.4 }
      });
      const parsed = JSON.parse(response?.text?.trim() || '{}');
      return { ...parsed, generadaIA: true };
    } catch (e) {}
  }
  return {
    titulo: `Taller Práctico: ${params.materia}`,
    descripcion: `Actividad ${params.tipoActividad}`,
    instrucciones: '1. Leer guía\n2. Desarrollar',
    tiempoEstimadoMinutos: 40,
    criteriosEvaluacion: ['Comprensión (5 pts)', 'Participación (5 pts)'],
    recursosNecesarios: ['Cuaderno'],
    generadaIA: false
  };
}

export async function analizarRendimientoGrupo(params: {
  paraleloNombre: string;
  materia: string;
  promedioGeneral: number;
  porcentajeAprobados: number;
  estudiantesEnRiesgo: any[];
  actividadesCriticas: any[];
}) {
  const ai = getAiClient();
  if (ai) {
    try {
      const prompt = `Analiza el estado académico del paralelo "${params.paraleloNombre}" en "${params.materia}" (promedio ${params.promedioGeneral}). Responde en JSON con diagnosticoBreve, puntosAlerta, estrategiasRefuerzo, recomendacionDirectivo.`;
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.3 }
      });
      return JSON.parse(response?.text?.trim() || '{}');
    } catch (e) {}
  }
  return {
    diagnosticoBreve: `El paralelo ${params.paraleloNombre} tiene promedio de ${params.promedioGeneral.toFixed(1)}/10.`,
    puntosAlerta: [`${params.estudiantesEnRiesgo.length} estudiantes en riesgo`],
    estrategiasRefuerzo: ['Tutorías personalizadas'],
    recomendacionDirectivo: 'Formalizar plan de refuerzo.'
  };
}

export async function generarInformeInstitucional(params: any) {
  const ai = getAiClient();
  if (ai) {
    try {
      const prompt = `Redacta un informe oficial MINEDUC para ${params.paraleloNombre}. Responde en JSON con codigoDocumento, titulo, antecedentes, desarrollo, conclusiones, recomendaciones.`;
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.3 }
      });
      return JSON.parse(response?.text?.trim() || '{}');
    } catch (e) {}
  }
  return {
    codigoDocumento: `INF-2026-01`,
    titulo: 'INFORME DE RENDIMIENTO ACADÉMICO',
    antecedentes: `Informe conforme a lineamientos MINEDUC para ${params.institucion}.`,
    desarrollo: `Asignatura ${params.materia}, promedio ${params.promedio}.`,
    conclusiones: ['Estudiantes cumplieron los objetivos básicos.'],
    recomendaciones: ['Continuar refuerzo académico.']
  };
}

export async function sugerirTareasTodo(params: any) {
  const tareas: any[] = [];
  if (params.asistenciaPendienteHoy) {
    tareas.push({ id: 't-1', titulo: 'Tomar asistencia de hoy', urgencia: 'alta', modulo: 'Asistencia', link: '/asistencia' });
  }
  if (params.actividadesSinCalificar > 0) {
    tareas.push({ id: 't-2', titulo: `Calificar ${params.actividadesSinCalificar} entregas pendientes`, urgencia: 'alta', modulo: 'Calificaciones', link: '/calificaciones' });
  }
  tareas.push({ id: 't-3', titulo: 'Generar reporte consolidado', urgencia: 'baja', modulo: 'Workspace', link: '/workspace' });
  return tareas;
}

// ==========================================
// EXPRESS APP & ROUTES
// ==========================================
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

connectDB().catch(() => {});

// In-memory fallbacks
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
  }
];

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

function getUserFromToken(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (err) {
    return null;
  }
}

// Routes
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

app.get('/api/debug', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    mongo: isMongoConnected(),
    mongoState: mongoose.connection.readyState,
    env: process.env.NODE_ENV || 'development',
    hasMongoUri: Boolean(process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('usuario:password')),
    hasJwtSecret: Boolean(process.env.JWT_SECRET),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString()
  });
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Correo y contraseña son requeridos' });
    }
    const cleanEmail = email.toLowerCase().trim();
    await connectDB();
    if (isMongoConnected()) {
      const dbUser = await Usuario.findOne({ email: cleanEmail });
      if (!dbUser) {
        return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      }
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
        { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol, institucion: user.institucion },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({ success: true, token, user, message: 'Sesión iniciada correctamente' });
    }

    if (cleanEmail === 'andres.morales@uefdemocracia.edu.ec') {
      if (password !== 'asap2024') {
        return res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
      }
      const token = jwt.sign(
        { id: 'docente-1', email: DOCENTE_ACTUAL.email, nombre: DOCENTE_ACTUAL.nombre, rol: DOCENTE_ACTUAL.rol, institucion: DOCENTE_ACTUAL.institucion },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({ success: true, token, user: DOCENTE_ACTUAL, message: 'Sesión iniciada correctamente' });
    }
    return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Error interno en el servidor' });
  }
});

app.post('/api/auth/google', async (req: Request, res: Response) => {
  const { email, nombre, avatar } = req.body;
  const targetEmail = (email || 'andres.morales@uefdemocracia.edu.ec').toLowerCase().trim();
  let dbUser = null;
  await connectDB();
  if (isMongoConnected()) {
    try { dbUser = await Usuario.findOne({ email: targetEmail }); } catch (e) {}
  }
  const user = {
    id: dbUser ? dbUser._id.toString() : 'docente-1',
    nombre: dbUser?.nombre || nombre || 'Lic. Andrés Morales',
    email: dbUser?.email || targetEmail,
    rol: dbUser?.rol || 'Docente',
    institucion: dbUser?.institucion || 'U.E. Fisco-Misional Democracia',
    materias: dbUser?.materias || ['Lengua y Literatura'],
    avatar: avatar || dbUser?.avatar || DOCENTE_ACTUAL.avatar
  };
  const token = jwt.sign({ id: user.id, email: user.email, nombre: user.nombre, rol: user.rol, institucion: user.institucion }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, token, user, message: 'Sesión iniciada con Google' });
});

app.get('/api/auth/me', async (req: Request, res: Response) => {
  const userPayload = getUserFromToken(req);
  if (userPayload) {
    await connectDB();
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
  res.status(401).json({ success: false, error: 'No autenticado' });
});

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { nombre, email, password, rol, institucion, cursos, estudiantesPorCurso } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ success: false, error: 'Nombre, correo y contraseña requeridos.' });
    }
    const cleanEmail = email.toLowerCase().trim();
    await connectDB();
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, error: 'MongoDB no conectado.' });
    }
    const existing = await Usuario.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Ya existe una cuenta con este correo.' });
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

    const createdParalelos: any[] = [];
    if (Array.isArray(cursos)) {
      for (const curso of cursos) {
        const paraleloNombre = `${curso.grado || 'Curso'} "${curso.paralelo || 'A'}" - ${curso.materia || 'General'}`;
        const ests = (estudiantesPorCurso && estudiantesPorCurso[curso.id]) || [];
        const mongoParalelo = await Paralelo.create({
          nombre: paraleloNombre,
          grado: parseInt(curso.grado) || 8,
          jornada: 'Matutina',
          docenteId: createdUser._id.toString(),
          materias: [curso.materia || 'General']
        });
        if (Array.isArray(ests) && ests.length > 0) {
          await Alumno.insertMany(ests.map((e: any) => ({ nombre: e.nombre, cedula: e.cedula || '', paraleloId: mongoParalelo._id, activo: true })));
        }
        createdParalelos.push({ id: mongoParalelo._id.toString(), nombre: paraleloNombre });
      }
    }

    const token = jwt.sign({ id: createdUser._id.toString(), email: cleanEmail, nombre: createdUser.nombre, rol: createdUser.rol, institucion: createdUser.institucion }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({ success: true, token, user: { id: createdUser._id.toString(), nombre: createdUser.nombre, email: cleanEmail, rol: createdUser.rol, institucion: createdUser.institucion, avatar: DOCENTE_ACTUAL.avatar }, cursosRegistrados: createdParalelos });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Error en registro' });
  }
});

app.get('/api/dashboard', async (_req: Request, res: Response) => {
  let actividadesPendientes = 0;
  await connectDB();
  if (isMongoConnected()) {
    try {
      actividadesPendientes = await Actividad.countDocuments({ estado: 'Por calificar' });
    } catch (e) {
      actividadesPendientes = actividadesState.filter((a: any) => a.estado === 'Por calificar').length;
    }
  } else {
    actividadesPendientes = actividadesState.filter((a: any) => a.estado === 'Por calificar').length;
  }

  const smartTodo = await sugerirTareasTodo({
    actividadesSinCalificar: actividadesPendientes,
    planificacionesPorIniciar: 1,
    asistenciaPendienteHoy: true,
    paralelosNombres: ['8vo EGB "A"', '9no EGB "B"']
  });

  res.json({
    success: true,
    docente: DOCENTE_ACTUAL,
    resumenHoy: {
      fecha: new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      jornada: 'Matutina (07:15 - 12:45)',
      claseActual: { paralelo: '8vo EGB "A"', materia: 'Lengua y Literatura', aula: 'Bloque B · Aula 204', horario: '07:15 a 08:45', tema: 'Ensayo argumentativo' }
    },
    estadisticas: { totalEstudiantes: 60, actividadesPorCalificar: actividadesPendientes, clasesPlanificadasSemana: 14, asistenciaPromedioMes: 94.8, informesGenerados: 3 },
    porHacerInteligente: smartTodo,
    ultimasActividades: [{ id: '1', accion: 'Asistencia registrada', detalle: '8vo EGB "A"', tiempo: 'Hace 45 min' }]
  });
});

app.get('/api/paralelos', async (req: Request, res: Response) => {
  await connectDB();
  if (isMongoConnected()) {
    try {
      const userPayload = getUserFromToken(req);
      const docenteId = userPayload?.id;
      if (!docenteId) return res.json({ success: true, paralelos: [] });
      const paralelos = await Paralelo.find({ docenteId: String(docenteId) });
      return res.json({
        success: true,
        paralelos: paralelos.map((p: any) => ({
          id: p._id.toString(),
          nombre: p.nombre,
          grado: p.grado,
          nivel: p.nivel || 'Educación Básica Superior',
          jornada: p.jornada || 'Matutina',
          materia: p.materia || 'General',
          horario: '07:15 - 08:45',
          aula: 'Aula 101',
          totalEstudiantes: 30,
          asistenciaHoyRegistrada: Boolean(p.asistenciaHoyRegistrada),
          porcentajeAsistenciaMes: 100
        }))
      });
    } catch (e) {}
  }
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
  await connectDB();
  if (isMongoConnected()) {
    try {
      const userPayload = getUserFromToken(req);
      const docenteId = userPayload?.id;
      if (!docenteId) return res.json({ success: true, paralelos: [] });
      const paralelos = await Paralelo.find({ docenteId: String(docenteId) });
      return res.json({
        success: true,
        paralelos: paralelos.map((p: any) => ({
          id: p._id.toString(),
          nombre: p.nombre,
          grado: p.grado,
          jornada: p.jornada || 'Matutina',
          materia: p.materia || 'General',
          totalEstudiantes: 30,
          asistenciaHoyRegistrada: Boolean(p.asistenciaHoyRegistrada),
          porcentajeAsistenciaMes: 100
        }))
      });
    } catch (e) {}
  }
  res.json({ success: true, paralelos: paralelosState });
});

// ==========================================
// 6 ENDPOINTS REQUERIDOS MONGODB + FALLBACK
// ==========================================

// 1. GET /api/asistencia/:cursoId
app.get('/api/asistencia/:cursoId', async (req: Request, res: Response) => {
  const { cursoId } = req.params;
  const fechaHoy = new Date().toISOString().slice(0, 10);

  await connectDB();
  if (isMongoConnected()) {
    try {
      let paraleloDoc = cursoId.match(/^[0-9a-fA-F]{24}$/) ? await Paralelo.findById(cursoId) : await Paralelo.findOne({ nombre: cursoId });
      if (!paraleloDoc) {
        paraleloDoc = await Paralelo.findOne();
      }
      if (paraleloDoc) {
        const alumnos = await Alumno.find({ paraleloId: paraleloDoc._id.toString() });
        const asistenciaDoc = await Asistencia.findOne({ paraleloId: paraleloDoc._id.toString(), fecha: fechaHoy });

        const paraleloObj = {
          id: paraleloDoc._id.toString(),
          nombre: paraleloDoc.nombre,
          grado: paraleloDoc.grado,
          jornada: paraleloDoc.jornada || 'Matutina',
          materia: paraleloDoc.materia || 'General'
        };

        const asistenciaHoy = alumnos.map((est: any, idx: number) => {
          const reg = asistenciaDoc?.registros?.find((r: any) => r.estudianteId === est._id.toString());
          return {
            estudianteId: est._id.toString(),
            nombre: est.nombre,
            numeroLista: est.numeroLista || idx + 1,
            cedula: est.cedula || '',
            estado: reg?.estado || (idx === 4 ? 'F' : idx === 12 ? 'A' : 'P'),
            justificada: reg ? reg.justificada : idx === 4,
            motivo: reg?.motivo || (idx === 4 ? 'Cita médica' : ''),
            faltasJustificadas: est.faltasJustificadas || 0,
            faltasInjustificadas: est.faltasInjustificadas || 0,
            atrasos: est.atrasos || 0,
            porcentajeFaltas: 2.5
          };
        });

        return res.json({
          success: true,
          paralelo: paraleloObj,
          fecha: fechaHoy,
          asistenciaHoy
        });
      }
    } catch (err) {
      console.warn('Error leyendo asistencia de MongoDB:', err);
    }
  }

  // Fallback memoria
  const paralelo = paralelosState.find((p: any) => p.id === cursoId) || paralelosState[0];
  if (!paralelo) return res.status(404).json({ success: false, error: 'Paralelo no encontrado' });
  const asistenciaHoy = paralelo.estudiantes.map((est: any) => ({
    estudianteId: est.id,
    nombre: est.nombre,
    numeroLista: est.numeroLista,
    cedula: est.cedula,
    estado: 'P',
    justificada: false,
    motivo: '',
    faltasJustificadas: est.faltasJustificadas || 0,
    faltasInjustificadas: est.faltasInjustificadas || 0,
    atrasos: est.atrasos || 0,
    porcentajeFaltas: 0
  }));
  res.json({ success: true, paralelo, fecha: fechaHoy, asistenciaHoy });
});

// 2. POST /api/asistencia/:cursoId
app.post('/api/asistencia/:cursoId', async (req: Request, res: Response) => {
  const { cursoId } = req.params;
  const { registros } = req.body;
  const fechaHoy = new Date().toISOString().slice(0, 10);

  await connectDB();
  if (isMongoConnected()) {
    try {
      await Asistencia.findOneAndUpdate(
        { paraleloId: cursoId, fecha: fechaHoy },
        { paraleloId: cursoId, fecha: fechaHoy, registros: registros || [] },
        { upsert: true, new: true }
      );
      await Paralelo.findByIdAndUpdate(cursoId, { asistenciaHoyRegistrada: true }).catch(() => {});
      return res.json({ success: true, message: 'Asistencia guardada en MongoDB', paraleloId: cursoId, fecha: fechaHoy });
    } catch (err) {
      console.warn('Error guardando asistencia en MongoDB:', err);
    }
  }

  // Fallback memoria
  const index = paralelosState.findIndex((p: any) => p.id === cursoId);
  if (index !== -1) paralelosState[index].asistenciaHoyRegistrada = true;
  res.json({ success: true, message: 'Asistencia guardada en memoria', paraleloId: cursoId, fecha: fechaHoy });
});

// 3. GET /api/calificaciones/:cursoId
app.get('/api/calificaciones/:cursoId', async (req: Request, res: Response) => {
  const { cursoId } = req.params;

  await connectDB();
  if (isMongoConnected()) {
    try {
      let mongoParalelo = cursoId.match(/^[0-9a-fA-F]{24}$/) ? await Paralelo.findById(cursoId) : await Paralelo.findOne({ nombre: cursoId });
      if (!mongoParalelo) mongoParalelo = await Paralelo.findOne();

      if (mongoParalelo) {
        const paraleloIdStr = mongoParalelo._id.toString();
        const alumnos = await Alumno.find({ paraleloId: paraleloIdStr });
        const actividadesMongo = await Actividad.find({ paraleloId: { $in: [paraleloIdStr, cursoId, 'par-8vo-a'] } });
        const calificacionesMongo = await Calificacion.find({ paraleloId: { $in: [paraleloIdStr, cursoId, 'par-8vo-a'] } });

        const actividades = actividadesMongo.length > 0 ? actividadesMongo.map((a: any) => ({
          id: a._id.toString(),
          paraleloId: a.paraleloId,
          titulo: a.titulo,
          tipo: a.tipo,
          fechaEntrega: a.fechaEntrega,
          ponderacion: a.ponderacion,
          entregadosCount: a.entregadosCount,
          totalCount: a.totalCount,
          estado: a.estado,
          bloque: a.bloque,
          descripcion: a.descripcion
        })) : actividadesState.filter((a: any) => a.paraleloId === 'par-8vo-a');

        const libroNotas = alumnos.map((est: any) => {
          const estId = est._id.toString();
          const notasAlumno: Record<string, number> = {};
          actividades.forEach((act: any) => {
            const found = calificacionesMongo.find((c: any) => c.estudianteId === estId && c.actividadId === act.id);
            if (found) {
              notasAlumno[act.id] = found.nota;
            } else {
              const seed = (est.numeroLista * 7) % 10;
              notasAlumno[act.id] = Number((7.0 + (seed / 10) * 2.8).toFixed(2));
            }
          });
          const vals = Object.values(notasAlumno) as number[];
          const prom = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 7.5;
          return {
            estudianteId: estId,
            nombre: est.nombre,
            numeroLista: est.numeroLista || 1,
            cedula: est.cedula || '',
            notas: notasAlumno,
            promedio: Number(prom.toFixed(2))
          };
        });

        const promediosTodos = libroNotas.map((n: any) => n.promedio);
        const promedioGeneral = promediosTodos.length > 0 ? Number((promediosTodos.reduce((a, b) => a + b, 0) / promediosTodos.length).toFixed(2)) : 8.1;
        const aprobados = promediosTodos.filter((p: number) => p >= 7.0).length;
        const porcentajeAprobados = promediosTodos.length > 0 ? (aprobados / promediosTodos.length) * 100 : 90;

        return res.json({
          success: true,
          paralelo: { id: paraleloIdStr, nombre: mongoParalelo.nombre, grado: mongoParalelo.grado, materia: mongoParalelo.materia || 'General' },
          actividades,
          libroNotas,
          estadisticas: { promedioGeneral, porcentajeAprobados, totalEstudiantes: libroNotas.length, enRiesgo: libroNotas.filter((n: any) => n.promedio < 7.0) }
        });
      }
    } catch (err) {
      console.warn('Error leyendo calificaciones de MongoDB:', err);
    }
  }

  // Fallback memoria
  const paralelo = paralelosState.find((p: any) => p.id === cursoId) || paralelosState[0];
  const actividades = actividadesState.filter((a: any) => a.paraleloId === paralelo.id);
  const matrix = calificacionesMatrix[paralelo.id] || {};
  const libroNotas = paralelo.estudiantes.map((est: any) => {
    const notasAlumno: Record<string, number> = matrix[est.id] || {};
    const vals = Object.values(notasAlumno) as number[];
    const prom = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 7.5;
    return { estudianteId: est.id, nombre: est.nombre, numeroLista: est.numeroLista, cedula: est.cedula, notas: notasAlumno, promedio: Number(prom.toFixed(2)) };
  });

  res.json({
    success: true,
    paralelo,
    actividades,
    libroNotas,
    estadisticas: { promedioGeneral: 8.1, porcentajeAprobados: 90, totalEstudiantes: libroNotas.length, enRiesgo: [] }
  });
});

// 4. PUT /api/calificaciones/celda
app.put('/api/calificaciones/celda', async (req: Request, res: Response) => {
  const { paraleloId, estudianteId, actividadId, nota } = req.body;
  const parsedNota = Math.max(0, Math.min(10, Number(nota) || 0));
  const finalNota = Number(parsedNota.toFixed(2));

  await connectDB();
  if (isMongoConnected()) {
    try {
      await Calificacion.findOneAndUpdate(
        { paraleloId, estudianteId, actividadId },
        { paraleloId, estudianteId, actividadId, nota: finalNota },
        { upsert: true, new: true }
      );
      return res.json({ success: true, nota: finalNota, message: 'Nota guardada en MongoDB' });
    } catch (err) {
      console.warn('Error guardando calificación en MongoDB:', err);
    }
  }

  // Fallback memoria
  if (!calificacionesMatrix[paraleloId]) calificacionesMatrix[paraleloId] = {};
  if (!calificacionesMatrix[paraleloId][estudianteId]) calificacionesMatrix[paraleloId][estudianteId] = {};
  calificacionesMatrix[paraleloId][estudianteId][actividadId] = finalNota;
  res.json({ success: true, nota: finalNota, message: 'Nota guardada en memoria' });
});

// 5. POST /api/calificaciones/actividad
app.post('/api/calificaciones/actividad', async (req: Request, res: Response) => {
  const { paraleloId, titulo, tipo, fechaEntrega, ponderacion, descripcion } = req.body;

  await connectDB();
  if (isMongoConnected()) {
    try {
      const nuevaAct = await Actividad.create({
        paraleloId: paraleloId || 'par-8vo-a',
        titulo: titulo || 'Nueva Actividad',
        tipo: tipo || 'Individual',
        fechaEntrega: fechaEntrega || new Date().toISOString().slice(0, 10),
        ponderacion: Number(ponderacion) || 10,
        entregadosCount: 0,
        totalCount: 30,
        estado: 'Por calificar',
        bloque: 2,
        descripcion: descripcion || ''
      });
      return res.status(201).json({
        success: true,
        actividad: {
          id: nuevaAct._id.toString(),
          paraleloId: nuevaAct.paraleloId,
          titulo: nuevaAct.titulo,
          tipo: nuevaAct.tipo,
          fechaEntrega: nuevaAct.fechaEntrega,
          ponderacion: nuevaAct.ponderacion,
          entregadosCount: nuevaAct.entregadosCount,
          totalCount: nuevaAct.totalCount,
          estado: nuevaAct.estado,
          bloque: nuevaAct.bloque,
          descripcion: nuevaAct.descripcion
        }
      });
    } catch (err) {
      console.warn('Error creando actividad en MongoDB:', err);
    }
  }

  // Fallback memoria
  const nuevaActividad = {
    id: `act-${Date.now()}`,
    paraleloId: paraleloId || 'par-8vo-a',
    titulo: titulo || 'Nueva Actividad',
    tipo: tipo || 'Individual',
    fechaEntrega: fechaEntrega || new Date().toISOString().slice(0, 10),
    ponderacion: Number(ponderacion) || 10,
    entregadosCount: 0,
    totalCount: 30,
    estado: 'Por calificar',
    bloque: 2
  };
  actividadesState.push(nuevaActividad);
  res.status(201).json({ success: true, actividad: nuevaActividad });
});

// 6. GET /api/workspace/kanban y métodos (POST, PUT, DELETE)
app.get('/api/workspace/kanban', async (req: Request, res: Response) => {
  await connectDB();
  if (isMongoConnected()) {
    try {
      const userPayload = getUserFromToken(req);
      const docenteId = userPayload?.id || 'docente-1';
      const tasks = await KanbanTask.find({ docenteId }).sort({ createdAt: -1 });
      if (tasks && tasks.length > 0) {
        return res.json({
          success: true,
          kanbanTasks: tasks.map((t: any) => ({
            id: t._id.toString(),
            titulo: t.titulo,
            descripcion: t.descripcion,
            paralelo: t.paralelo,
            columna: t.columna,
            prioridad: t.prioridad,
            urgencia: t.urgencia,
            fecha: t.fecha,
            fechaLimite: t.fechaLimite,
            observaciones: t.observaciones,
            adjuntos: t.adjuntos || []
          }))
        });
      }
    } catch (err) {
      console.warn('Error leyendo Kanban de MongoDB:', err);
    }
  }
  res.json({ success: true, kanbanTasks });
});

app.post('/api/workspace/kanban', async (req: Request, res: Response) => {
  const { titulo, descripcion, paralelo, columna, prioridad, urgencia, fechaLimite, observaciones } = req.body;
  const fechaHoy = new Date().toISOString().slice(0, 10);

  await connectDB();
  if (isMongoConnected()) {
    try {
      const userPayload = getUserFromToken(req);
      const docenteId = userPayload?.id || 'docente-1';
      const newTask = await KanbanTask.create({
        titulo: titulo || 'Nueva Tarea',
        descripcion: descripcion || '',
        paralelo: paralelo || 'General',
        columna: columna || 'Por hacer',
        prioridad: prioridad || 'Media',
        urgencia: urgencia || 'Media',
        fecha: fechaHoy,
        fechaLimite: fechaLimite || '',
        observaciones: observaciones || '',
        adjuntos: [],
        docenteId
      });
      return res.status(201).json({
        success: true,
        tarea: {
          id: newTask._id.toString(),
          titulo: newTask.titulo,
          descripcion: newTask.descripcion,
          paralelo: newTask.paralelo,
          columna: newTask.columna,
          prioridad: newTask.prioridad,
          urgencia: newTask.urgencia,
          fecha: newTask.fecha,
          fechaLimite: newTask.fechaLimite,
          observaciones: newTask.observaciones,
          adjuntos: newTask.adjuntos
        }
      });
    } catch (err) {
      console.warn('Error creando tarea Kanban en MongoDB:', err);
    }
  }

  // Fallback memoria
  const nuevaTarea = {
    id: `kb-${Date.now()}`,
    titulo: titulo || 'Nueva Tarea',
    descripcion: descripcion || '',
    paralelo: paralelo || 'General',
    columna: columna || 'Por hacer',
    prioridad: prioridad || 'Media',
    urgencia: urgencia || 'Media',
    fecha: fechaHoy,
    fechaLimite: fechaLimite || '',
    observaciones: observaciones || '',
    adjuntos: []
  };
  kanbanTasks.unshift(nuevaTarea);
  res.status(201).json({ success: true, tarea: nuevaTarea });
});

app.put('/api/workspace/kanban/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  await connectDB();
  if (isMongoConnected() && id.match(/^[0-9a-fA-F]{24}$/)) {
    try {
      const userPayload = getUserFromToken(req);
      const docenteId = userPayload?.id || 'docente-1';
      const updated = await KanbanTask.findOneAndUpdate(
        { _id: id, docenteId },
        req.body,
        { new: true }
      );
      if (!updated) return res.status(404).json({ success: false, error: 'Tarea no encontrada' });
      return res.json({
        success: true,
        tarea: {
          id: updated._id.toString(),
          titulo: updated.titulo,
          descripcion: updated.descripcion,
          paralelo: updated.paralelo,
          columna: updated.columna,
          prioridad: updated.prioridad,
          urgencia: updated.urgencia,
          fecha: updated.fecha,
          fechaLimite: updated.fechaLimite,
          observaciones: updated.observaciones,
          adjuntos: updated.adjuntos
        }
      });
    } catch (err) {
      console.warn('Error actualizando tarea Kanban en MongoDB:', err);
    }
  }

  // Fallback memoria
  const idx = kanbanTasks.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'No encontrada' });
  kanbanTasks[idx] = { ...kanbanTasks[idx], ...req.body };
  res.json({ success: true, tarea: kanbanTasks[idx] });
});

app.delete('/api/workspace/kanban/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  await connectDB();
  if (isMongoConnected() && id.match(/^[0-9a-fA-F]{24}$/)) {
    try {
      const userPayload = getUserFromToken(req);
      const docenteId = userPayload?.id || 'docente-1';
      const deleted = await KanbanTask.findOneAndDelete({ _id: id, docenteId });
      if (!deleted) return res.status(404).json({ success: false, error: 'Tarea no encontrada' });
      return res.json({ success: true, message: 'Eliminada de MongoDB' });
    } catch (err) {}
  }

  kanbanTasks = kanbanTasks.filter(t => t.id !== id);
  res.json({ success: true, message: 'Eliminada de memoria' });
});

// Other endpoints
app.post('/api/ai/analisis-rendimiento', async (req: Request, res: Response) => {
  const { paraleloId } = req.body;
  const paralelo = paralelosState.find((p: any) => p.id === paraleloId) || paralelosState[0];
  const analisis = await analizarRendimientoGrupo({
    paraleloNombre: paralelo.nombre,
    materia: paralelo.materia,
    promedioGeneral: 8.2,
    porcentajeAprobados: 90,
    estudiantesEnRiesgo: [],
    actividadesCriticas: []
  });
  res.json({ success: true, analisis });
});

app.post('/api/ai/informe', async (req: Request, res: Response) => {
  const { paraleloNombre, periodo } = req.body;
  const informe = await generarInformeInstitucional({
    docenteNombre: DOCENTE_ACTUAL.nombre,
    institucion: DOCENTE_ACTUAL.institucion,
    paraleloNombre: paraleloNombre || '8vo EGB "A"',
    materia: 'Lengua y Literatura',
    periodo: periodo || 'Primer Quimestre',
    promedio: 8.2,
    porcentajeAsistencia: 94.6
  });
  res.json({ success: true, informe });
});

app.get('/api/planificacion', (_req: Request, res: Response) => {
  res.json({ success: true, planificaciones: planificacionesState });
});

app.post('/api/planificacion/generar-ia', async (req: Request, res: Response) => {
  const { materia, bloque, destreza, nivel, semanas } = req.body;
  const plan = await generarPlanificacionCurricular({
    materia: materia || 'Lengua y Literatura',
    bloque: bloque || 2,
    destreza: destreza || 'LL.4.2.1',
    nivel: nivel || '8vo EGB',
    semanas: Number(semanas) || 4
  });
  res.json({ success: true, plan });
});

app.post('/api/planificacion', (req: Request, res: Response) => {
  const nuevoPlan = { id: `plan-${Date.now()}`, progreso: 0, estado: 'Por iniciar', generadaIA: true, ...req.body };
  planificacionesState.push(nuevoPlan);
  res.status(201).json({ success: true, plan: nuevoPlan });
});

app.get('/api/workspace', (_req: Request, res: Response) => {
  res.json({ success: true, kanbanTasks, plantillas: PLANTILLAS_MINEDUC, actividades: actividadesState, documentos: documentosState });
});

app.get('/api/workspace/documentos', async (req: Request, res: Response) => {
  await connectDB();
  if (isMongoConnected()) {
    try {
      const userPayload = getUserFromToken(req);
      const docenteId = userPayload?.id || 'docente-1';
      const docs = await Documento.find({ docenteId }).sort({ createdAt: -1 });
      if (docs && docs.length > 0) return res.json({ success: true, documentos: docs });
    } catch (e) {}
  }
  res.json({ success: true, documentos: documentosState });
});

app.post('/api/workspace/documentos', async (req: Request, res: Response) => {
  const userPayload = getUserFromToken(req);
  const docenteId = userPayload?.id || 'docente-1';
  const nuevoDoc = { id: `doc-${Date.now()}`, fechaSubida: new Date().toLocaleDateString('es-EC'), docenteId, ...req.body };
  documentosState.unshift(nuevoDoc);
  await connectDB();
  if (isMongoConnected()) {
    try {
      const { nombre, categoria, descripcion, tamano, tipo, contenidoBase64, url } = req.body;
      const created = await Documento.create({
        nombre,
        categoria,
        descripcion,
        tamano,
        tipo,
        contenidoBase64,
        url,
        docenteId
      });
      return res.status(201).json({ success: true, documento: created });
    } catch (e) {}
  }
  res.status(201).json({ success: true, documento: nuevoDoc });
});

app.delete('/api/workspace/documentos/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  await connectDB();
  if (isMongoConnected()) {
    try {
      const userPayload = getUserFromToken(req);
      const docenteId = userPayload?.id || 'docente-1';
      const deleted = await Documento.findOneAndDelete({ _id: id, docenteId });
      if (!deleted) return res.status(404).json({ success: false, error: 'Documento no encontrado' });
      return res.json({ success: true, message: 'Documento eliminado' });
    } catch (e) {}
  }
  documentosState = documentosState.filter(d => d.id !== id);
  res.json({ success: true });
});

export default app;
