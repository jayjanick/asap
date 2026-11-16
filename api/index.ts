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
    const prefix = paraleloId.includes('9no') ? '092' : '091';
    const cedula = `${prefix}${String(index + 1).padStart(7, '0')}`;
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
      telefonoRepresentante: `+593 99 ${String(1000000 + (index + 1) * 12345).slice(0, 7)}`,
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
  return connectDB();
}

// Schemas & Models
const UsuarioSchema = new Schema(
  {
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    rol: { type: String, enum: ['Docente', 'Director', 'Coordinador', 'Admin'], default: 'Docente' },
    materias: [{ type: String }],
    institucion: { type: String, required: true },
    telefono: { type: String },
    avatar: { type: String },
    horarioSemanal: [
      {
        hora: { type: String },
        lunes: { type: String, default: '' },
        martes: { type: String, default: '' },
        miercoles: { type: String, default: '' },
        jueves: { type: String, default: '' },
        viernes: { type: String, default: '' }
      }
    ]
  },
  { timestamps: true }
);
const Usuario = mongoose.models.Usuario || mongoose.model('Usuario', UsuarioSchema);

const ParaleloSchema = new Schema(
  {
    nombre: { type: String, required: true },
    grado: { type: Number, required: true },
    paralelo: { type: String, default: 'A' },
    materia: { type: String, default: 'General' },
    jornada: { type: String, enum: ['Matutina', 'Vespertina', 'Nocturna'], default: 'Matutina' },
    docenteId: { type: Schema.Types.Mixed, required: true },
    materias: [{ type: String }],
    nivel: { type: String, default: 'Educación Básica Superior' },
    especialidad: { type: String },
    horario: { type: String, default: '07:15 - 08:45' },
    aula: { type: String, default: 'Aula 101' },
    asistenciaHoyRegistrada: { type: Boolean, default: false },
    activo: { type: Boolean, default: true }
  },
  { timestamps: true }
);
const Paralelo = mongoose.models.Paralelo || mongoose.model('Paralelo', ParaleloSchema);

const AlumnoSchema = new Schema(
  {
    nombre: { type: String, required: true },
    cedula: { type: String, required: false },
    numeroLista: { type: Number },
    paraleloId: { type: Schema.Types.Mixed, required: true },
    activo: { type: Boolean, default: true },
    contactoRepresentante: { type: String },
    telefonoRepresentante: { type: String },
    faltasJustificadas: { type: Number, default: 0 },
    faltasInjustificadas: { type: Number, default: 0 },
    atrasos: { type: Number, default: 0 },
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

const PlanificacionSchema = new Schema(
  {
    docenteId: { type: String, default: 'docente-1' },
    paraleloId: { type: String, default: '' },
    paralelo: { type: String, default: '' },
    materia: { type: String, required: true },
    bloque: { type: Number, default: 2 },
    titulo: { type: String, required: true },
    destreza: { type: String, default: '' },
    semanas: { type: Number, default: 4 },
    fechaInicio: { type: String, default: '' },
    fechaFin: { type: String, default: '' },
    diasImparticion: [{ type: String }],
    progreso: { type: Number, default: 0 },
    estado: { type: String, default: 'Por iniciar' },
    generadaIA: { type: Boolean, default: false },
    objetivos: [{ type: String }],
    recursos: [{ type: String }],
    criteriosEvaluacion: [{ type: String }],
    secuenciaClases: [{
      semana: Number,
      tema: String,
      contenido: String,
      actividad: String,
      actividadSugerida: String,
      completada: { type: Boolean, default: false }
    }],
    archivosAdjuntos: [{
      nombre: String,
      tipo: String,
      tamano: String,
      contenidoBase64: String,
      fecha: String
    }]
  },
  { timestamps: true }
);
if (mongoose.models.Planificacion) {
  delete mongoose.models.Planificacion;
}
const Planificacion = mongoose.model('Planificacion', PlanificacionSchema);

const SesionSchema = new Schema(
  {
    tokenId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true },
    email: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    revocado: { type: Boolean, default: false }
  },
  { collection: 'sesiones' }
);
const Sesion = mongoose.models.Sesion || mongoose.model('Sesion', SesionSchema);

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
          {
            nombre: est.nombre,
            paraleloId: { $in: [paraleloDoc._id, paraleloDoc._id.toString()] }
          },
          force ? alumnoData : { $setOnInsert: alumnoData },
          { upsert: true }
        );
      }
    }

    const planCount = await Planificacion.countDocuments({ docenteId: docente._id.toString() });
    if (planCount === 0) {
      for (const plan of PLANIFICACIONES_MINEDUC) {
        await Planificacion.create({
          docenteId: docente._id.toString(),
          materia: plan.materia,
          bloque: plan.bloque,
          titulo: plan.titulo,
          destreza: plan.destreza,
          semanas: plan.semanas,
          progreso: plan.progreso,
          estado: plan.estado,
          generadaIA: plan.generadaIA,
          objetivos: plan.objetivos,
          recursos: plan.recursos,
          secuenciaClases: plan.secuenciaClases
        });
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
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
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
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
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
  estudiantesEnRiesgo: { nombre: string; promedio: number }[];
  actividadesCriticas: { titulo: string; promedio: number }[];
}) {
  const ai = getAiClient();
  const riesgoTexto =
    params.estudiantesEnRiesgo.length > 0
      ? params.estudiantesEnRiesgo.map((e) => `${e.nombre} (${Number(e.promedio).toFixed(2)}/10)`).join(', ')
      : 'Ninguno';
  const actTexto =
    params.actividadesCriticas.length > 0
      ? params.actividadesCriticas.map((a) => `${a.titulo} (${Number(a.promedio).toFixed(2)}/10)`).join(', ')
      : 'Sin actividades críticas';

  if (ai) {
    try {
      const prompt = `Actúa como asesor pedagógico MINEDUC. Analiza los datos reales del curso "${params.paraleloNombre}" en la asignatura "${params.materia}":
- Promedio real del grupo: ${Number(params.promedioGeneral).toFixed(2)}/10
- Porcentaje de aprobación (>=7.00): ${Number(params.porcentajeAprobados).toFixed(1)}%
- Estudiantes en riesgo (<7.00): ${riesgoTexto}
- Actividades con menor rendimiento: ${actTexto}
Responde ÚNICAMENTE en JSON válido con las claves exactas: diagnosticoBreve (string), puntosAlerta (array de strings), estrategiasRefuerzo (array de strings), recomendacionDirectivo (string).`;
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      const parsed = JSON.parse(response?.text?.trim() || '{}');
      if (parsed && parsed.diagnosticoBreve) {
        return parsed;
      }
    } catch (e) {}
  }
  return {
    diagnosticoBreve: `El curso ${params.paraleloNombre} registra un promedio real de ${Number(params.promedioGeneral).toFixed(2)}/10 con ${Number(params.porcentajeAprobados).toFixed(0)}% de aprobación.`,
    puntosAlerta:
      params.estudiantesEnRiesgo.length > 0
        ? [`${params.estudiantesEnRiesgo.length} estudiante(s) con promedio menor a 7.00: ${riesgoTexto}`]
        : ['Todos los estudiantes evaluados superan el puntaje mínimo de 7.00/10.'],
    estrategiasRefuerzo:
      params.estudiantesEnRiesgo.length > 0
        ? [
            'Aplicar refuerzo académico focalizado en los estudiantes con promedio menor a 7.00.',
            params.actividadesCriticas.length > 0
              ? `Retroalimentar los contenidos evaluados en: ${actTexto}.`
              : 'Realizar seguimiento continuo de tareas y talleres en clase.'
          ]
        : ['Mantener actividades de profundización y aprendizaje colaborativo en el aula.'],
    recomendacionDirectivo:
      params.estudiantesEnRiesgo.length > 0
        ? 'Registrar acta de refuerzo académico y notificar oportunamente a los representantes legales.'
        : 'Continuar con la planificación microcurricular programada.'
  };
}

export async function generarInformeInstitucional(params: any) {
  const ai = getAiClient();
  if (ai) {
    try {
      const prompt = `Redacta un informe oficial MINEDUC para ${params.paraleloNombre}. Responde en JSON con codigoDocumento, titulo, antecedentes, desarrollo, conclusiones, recomendaciones.`;
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
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

export const adminLogs: Array<{
  id: string;
  timestamp: string;
  method: string;
  route: string;
  message: string;
  statusCode: number;
}> = [];

function recordAdminError(req: Request, statusCode: number, message: string) {
  adminLogs.unshift({
    id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    method: req.method,
    route: req.originalUrl || req.url,
    message,
    statusCode
  });
  if (adminLogs.length > 100) {
    adminLogs.length = 100;
  }
}

async function issueSessionToken(user: {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  institucion: string;
}): Promise<string> {
  const tokenId = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await connectDB();
  if (isMongoConnected()) {
    try {
      await Sesion.create({
        tokenId,
        userId: String(user.id),
        email: user.email,
        createdAt: new Date(),
        expiresAt,
        revocado: false
      });
    } catch (e) {
      console.warn('Error registrando sesión en MongoDB:', e);
    }
  }
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      institucion: user.institucion,
      tokenId
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function getUserFromToken(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    return payload;
  } catch (err) {
    return null;
  }
}

async function resolveDocenteParaleloFilter(req: Request, includeInactive = false) {
  const userPayload = getUserFromToken(req);
  const rawId = userPayload?.id ? String(userPayload.id) : null;
  const email = (userPayload?.email || '').toLowerCase().trim();
  if (!rawId && !email) return null;

  const idCandidates: any[] = [];
  const addCandidate = (val: any) => {
    if (!val) return;
    const str = String(val);
    if (!idCandidates.some((c) => typeof c === 'string' && c === str)) {
      idCandidates.push(str);
    }
    if (/^[a-f\d]{24}$/i.test(str)) {
      if (!idCandidates.some((c) => c instanceof mongoose.Types.ObjectId && c.toString() === str)) {
        idCandidates.push(new mongoose.Types.ObjectId(str));
      }
    }
  };

  if (rawId) addCandidate(rawId);

  if (email && isMongoConnected()) {
    try {
      const dbUser = await Usuario.findOne({ email }).select('_id').lean();
      if (dbUser && (dbUser as any)._id) {
        addCandidate((dbUser as any)._id.toString());
      }
    } catch {}
  }

  if (email === 'andres.morales@uefdemocracia.edu.ec') {
    addCandidate('docente-1');
  }

  if (idCandidates.length === 0) return null;

  const filter: any = {
    docenteId: { $in: idCandidates }
  };
  if (!includeInactive) {
    filter.activo = { $ne: false };
  }
  const primaryId =
    idCandidates.find((c) => typeof c === 'string' && /^[a-f\d]{24}$/i.test(c)) ||
    String(idCandidates[0]);

  return { filter, userPayload, primaryDocenteId: String(primaryId) };
}

async function deduplicateAlumnosForParalelo(paraleloDoc: any) {
  if (!paraleloDoc || !paraleloDoc._id) return [];
  const rawAlumnos = await Alumno.find({
    $or: [{ paraleloId: paraleloDoc._id }, { paraleloId: paraleloDoc._id.toString() }],
    activo: { $ne: false }
  }).sort({ numeroLista: 1, createdAt: 1, _id: 1 });

  const seenNames = new Map<string, any>();
  const duplicateIds: any[] = [];
  const uniqueAlumnos: any[] = [];

  for (const al of rawAlumnos) {
    const key = String(al.nombre || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (!key) continue;
    if (seenNames.has(key)) {
      duplicateIds.push(al._id);
    } else {
      seenNames.set(key, al);
      uniqueAlumnos.push(al);
    }
  }

  if (duplicateIds.length > 0) {
    await Alumno.deleteMany({ _id: { $in: duplicateIds } }).catch(() => {});
  }

  uniqueAlumnos.sort((a, b) =>
    String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es')
  );

  let needsResequence = duplicateIds.length > 0;
  uniqueAlumnos.forEach((al, idx) => {
    if (al.numeroLista !== idx + 1) {
      needsResequence = true;
    }
  });

  if (needsResequence) {
    await Promise.all(
      uniqueAlumnos.map((al, idx) => {
        al.numeroLista = idx + 1;
        return Alumno.updateOne({ _id: al._id }, { $set: { numeroLista: idx + 1 } }).catch(() => {});
      })
    );
  }

  return uniqueAlumnos;
}

function buildDefaultHorarioFromParalelos(paralelos: any[]) {
  const formatCursoLabel = (p: any) => {
    if (!p) return '';
    const nombre = String(p.nombre || '').trim();
    const materia = String(p.materia || p.materias?.[0] || '').trim();
    if (!materia || nombre.toLowerCase().includes(materia.toLowerCase())) {
      return nombre;
    }
    return `${nombre} · ${materia}`;
  };

  const c0 = paralelos[0] ? formatCursoLabel(paralelos[0]) : '';
  const c1 = paralelos[1] ? formatCursoLabel(paralelos[1]) : c0;
  const c2 = paralelos[2] ? formatCursoLabel(paralelos[2]) : '';

  return [
    {
      hora: '07:15 - 08:00',
      lunes: c0,
      martes: c1,
      miercoles: c0,
      jueves: c1,
      viernes: c0
    },
    {
      hora: '08:00 - 08:45',
      lunes: c0,
      martes: c1,
      miercoles: c0,
      jueves: c1,
      viernes: c2 || c0
    },
    {
      hora: '08:45 - 09:30',
      lunes: c2 || 'Planificación Curricular',
      martes: c1,
      miercoles: c2 || 'Atención a Representantes',
      jueves: c1,
      viernes: 'Tutoría / Refuerzo Académico'
    },
    {
      hora: '09:30 - 10:00',
      lunes: 'RECESO',
      martes: 'RECESO',
      miercoles: 'RECESO',
      jueves: 'RECESO',
      viernes: 'RECESO'
    },
    {
      hora: '10:00 - 10:45',
      lunes: c1 || c0,
      martes: c0,
      miercoles: c1 || c0,
      jueves: c2 || 'Gestión Pedagógica',
      viernes: c1 || c0
    },
    {
      hora: '10:45 - 11:30',
      lunes: 'Calificación y Registro',
      martes: c0,
      miercoles: 'Refuerzo Académico (PRAI)',
      jueves: 'Comisión Técnico-Pedagógica',
      viernes: 'Cierre Semanal de Asistencia'
    }
  ];
}

export async function requireAdmin(req: Request, res: Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ success: false, error: 'Acceso denegado: token requerido' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (!payload || payload.rol !== 'Admin') {
      return res.status(403).json({ success: false, error: 'Acceso denegado: se requiere rol Admin' });
    }
    if (payload.tokenId) {
      await connectDB();
      if (isMongoConnected()) {
        const sesionDoc = await Sesion.findOne({ tokenId: payload.tokenId });
        if (!sesionDoc || sesionDoc.revocado !== false) {
          return res.status(403).json({ success: false, error: 'Sesión revocada o inválida' });
        }
      }
    }
    (req as any).adminUser = payload;
    return next();
  } catch (err) {
    return res.status(403).json({ success: false, error: 'Token inválido o expirado' });
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
      const token = await issueSessionToken({
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        institucion: user.institucion
      });
      return res.json({ success: true, token, user, message: 'Sesión iniciada correctamente' });
    }

    if (cleanEmail === 'andres.morales@uefdemocracia.edu.ec') {
      if (password !== 'asap2024') {
        return res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
      }
      const token = await issueSessionToken({
        id: 'docente-1',
        email: DOCENTE_ACTUAL.email,
        nombre: DOCENTE_ACTUAL.nombre,
        rol: DOCENTE_ACTUAL.rol,
        institucion: DOCENTE_ACTUAL.institucion
      });
      return res.json({ success: true, token, user: DOCENTE_ACTUAL, message: 'Sesión iniciada correctamente' });
    }
    return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
  } catch (error: any) {
    recordAdminError(req, 500, error?.message || 'Error interno en login');
    return res.status(500).json({ success: false, error: 'Error interno en el servidor' });
  }
});

app.post('/api/auth/logout', async (req: Request, res: Response) => {
  const userPayload = getUserFromToken(req);
  if (userPayload?.tokenId) {
    await connectDB();
    if (isMongoConnected()) {
      try {
        await Sesion.updateOne({ tokenId: userPayload.tokenId }, { $set: { revocado: true } });
      } catch (e) {}
    }
  }
  return res.json({ success: true, message: 'Sesión cerrada correctamente' });
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
  const token = await issueSessionToken({
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    rol: user.rol,
    institucion: user.institucion
  });
  res.json({ success: true, token, user, message: 'Sesión iniciada con Google' });
});

app.get('/api/auth/me', async (req: Request, res: Response) => {
  const userPayload = getUserFromToken(req);
  if (userPayload) {
    await connectDB();
    if (isMongoConnected()) {
      try {
        if (userPayload.tokenId) {
          const sesionDoc = await Sesion.findOne({ tokenId: userPayload.tokenId });
          if (!sesionDoc || sesionDoc.revocado !== false) {
            return res.status(401).json({ success: false, error: 'Sesión revocada o inválida' });
          }
        }
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
        const gradoStr = String(curso.grado || '8vo EGB').trim();
        const paraleloLetra = String(curso.paralelo || 'A').trim();
        const materiaStr = String(curso.materia || 'General').trim();
        const paraleloNombre = `${gradoStr} "${paraleloLetra}" - ${materiaStr}`;
        const ests = (estudiantesPorCurso && estudiantesPorCurso[curso.id]) || [];
        const mongoParalelo = await Paralelo.create({
          nombre: paraleloNombre,
          grado: parseInt(gradoStr, 10) || 8,
          paralelo: paraleloLetra,
          materia: materiaStr,
          nivel: curso.nivel || 'Educación Básica Superior',
          jornada: 'Matutina',
          docenteId: createdUser._id.toString(),
          materias: [materiaStr],
          activo: true
        });
        if (Array.isArray(ests) && ests.length > 0) {
          await Alumno.insertMany(
            ests.map((e: any, idx: number) => ({
              nombre: e.nombre,
              cedula: e.cedula || '',
              numeroLista: e.lista || idx + 1,
              paraleloId: mongoParalelo._id,
              activo: true
            }))
          );
        }
        createdParalelos.push({ id: mongoParalelo._id.toString(), nombre: paraleloNombre });
      }
    }

    const token = await issueSessionToken({
      id: createdUser._id.toString(),
      email: cleanEmail,
      nombre: createdUser.nombre,
      rol: createdUser.rol,
      institucion: createdUser.institucion
    });
    return res.status(201).json({ success: true, token, user: { id: createdUser._id.toString(), nombre: createdUser.nombre, email: cleanEmail, rol: createdUser.rol, institucion: createdUser.institucion, avatar: DOCENTE_ACTUAL.avatar }, cursosRegistrados: createdParalelos });
  } catch (err: any) {
    recordAdminError(req, 500, err.message || 'Error en registro');
    return res.status(500).json({ success: false, error: err.message || 'Error en registro' });
  }
});

app.get('/api/dashboard', async (req: Request, res: Response) => {
  let actividadesPendientes = 0;
  await connectDB();
  if (isMongoConnected()) {
    try {
      const auth = await resolveDocenteParaleloFilter(req, false);
      const userPayload = auth?.userPayload || getUserFromToken(req);
      const docenteId = userPayload?.id;

      let docenteObj: any = { ...DOCENTE_ACTUAL };
      let totalEstudiantes = 0;
      let paralelosNombres: string[] = [];
      let claseActual: any = null;
      let clasesHoy: { hora: string; materiaCurso: string; aula?: string; enCurso?: boolean }[] = [];
      let horarioSemanal: any[] = [];
      let misParalelos: any[] = [];
      let asistenciaMes = 0;
      let unidadesActivas = 0;
      let tareasKanban: any[] = [];

      if (auth) {
        misParalelos = await Paralelo.find(auth.filter).sort({ grado: 1, createdAt: 1 });
        paralelosNombres = misParalelos.map((p: any) => p.nombre);

        const dbUser =
          (docenteId && /^[a-f\d]{24}$/i.test(String(docenteId)) ? await Usuario.findById(docenteId) : null) ||
          (userPayload?.email ? await Usuario.findOne({ email: userPayload.email.toLowerCase().trim() }) : null);

        const docenteIds = Array.from(
          new Set(
            [
              auth.primaryDocenteId,
              dbUser?._id?.toString(),
              docenteId ? String(docenteId) : ''
            ].filter(Boolean)
          )
        );

        if (dbUser) {
          docenteObj = {
            id: dbUser._id.toString(),
            nombre: dbUser.nombre,
            email: dbUser.email,
            rol: dbUser.rol,
            institucion: dbUser.institucion,
            materias: dbUser.materias || ['Lengua y Literatura'],
            avatar: dbUser.avatar || DOCENTE_ACTUAL.avatar,
            provincia: 'Guayas',
            canton: 'Guayaquil',
            totalAlumnos: 0,
            asistenciaPromedioGeneral: 0
          };
        }

        horarioSemanal =
          dbUser && Array.isArray((dbUser as any).horarioSemanal) && (dbUser as any).horarioSemanal.length > 0
            ? (dbUser as any).horarioSemanal.map((h: any) => ({
                hora: h.hora || '',
                lunes: h.lunes || '',
                martes: h.martes || '',
                miercoles: h.miercoles || '',
                jueves: h.jueves || '',
                viernes: h.viernes || ''
              }))
            : buildDefaultHorarioFromParalelos(misParalelos);

        const dayIndex = new Date().getDay(); // 0=Sun, 1=Mon ... 5=Fri, 6=Sat
        const dayKeyMap: Record<number, 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes'> = {
          1: 'lunes',
          2: 'martes',
          3: 'miercoles',
          4: 'jueves',
          5: 'viernes'
        };
        const todayKey = dayKeyMap[dayIndex];
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();

        const parseMinutes = (timeStr: string): number | null => {
          const m = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
          if (!m) return null;
          return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
        };

        if (todayKey && horarioSemanal.length > 0) {
          clasesHoy = horarioSemanal
            .map((row: any) => {
              const cell = String(row[todayKey] || '').trim();
              if (!cell || cell.toUpperCase().includes('RECESO')) return null;
              const parts = String(row.hora || '').split('-');
              const startMin = parts[0] ? parseMinutes(parts[0]) : null;
              const endMin = parts[1] ? parseMinutes(parts[1]) : null;
              const enCurso =
                startMin !== null && endMin !== null && nowMinutes >= startMin && nowMinutes <= endMin;
              const matchedCurso = misParalelos.find(
                (p: any) =>
                  cell.toLowerCase().includes(String(p.nombre || '').toLowerCase()) ||
                  String(p.nombre || '').toLowerCase().includes(cell.toLowerCase())
              );
              return {
                hora: row.hora || '',
                materiaCurso: cell,
                aula: matchedCurso?.aula || '',
                paraleloId: matchedCurso?._id?.toString() || '',
                paraleloNombre: matchedCurso?.nombre || cell,
                materia: matchedCurso?.materia || matchedCurso?.materias?.[0] || docenteObj.materias?.[0] || 'General',
                enCurso
              };
            })
            .filter(Boolean) as any[];

          const activeBlock = clasesHoy.find((c: any) => c.enCurso) || clasesHoy[0] || null;
          if (activeBlock) {
            claseActual = {
              id: (activeBlock as any).paraleloId || '',
              paralelo: (activeBlock as any).paraleloNombre || activeBlock.materiaCurso,
              materia: (activeBlock as any).materia || 'General',
              aula: activeBlock.aula || 'Aula asignada',
              horario: activeBlock.hora,
              enCurso: Boolean(activeBlock.enCurso),
              tema: activeBlock.enCurso ? 'Clase en curso según tu horario' : 'Próximo bloque programado hoy'
            };
          }
        }

        const paraleloIds = misParalelos.map((p: any) => p._id.toString());
        if (paraleloIds.length > 0) {
          const cleanLists = await Promise.all(
            misParalelos.map((p: any) => deduplicateAlumnosForParalelo(p))
          );
          totalEstudiantes = cleanLists.reduce((acc, list) => acc + list.length, 0);
          actividadesPendientes = await Actividad.countDocuments({
            paraleloId: { $in: paraleloIds },
            estado: 'Por calificar'
          });

          const asistencias = await Asistencia.find({ paraleloId: { $in: paraleloIds } });
          if (asistencias.length > 0) {
            let totalRegs = 0;
            let presentes = 0;
            asistencias.forEach((a: any) => {
              (a.registros || []).forEach((r: any) => {
                if (r.estado) {
                  totalRegs++;
                  if (r.estado === 'P' || r.justificada) presentes++;
                }
              });
            });
            if (totalRegs > 0) {
              asistenciaMes = Number(((presentes / totalRegs) * 100).toFixed(1));
            }
          }
        }

        unidadesActivas = await Planificacion.countDocuments({
          docenteId: { $in: docenteIds },
          estado: { $in: ['En curso', 'Por iniciar'] }
        });

        const rawKanban = await KanbanTask.find({
          docenteId: { $in: docenteIds }
        }).sort({ createdAt: -1 });

        tareasKanban = rawKanban.map((t: any) => ({
          id: t._id.toString(),
          titulo: t.titulo,
          descripcion: t.descripcion || '',
          paralelo: t.paralelo || 'General',
          columna: t.columna || 'Por hacer',
          prioridad: t.prioridad || 'Media',
          urgencia: t.urgencia || 'Media',
          fechaLimite: t.fechaLimite || '',
          completada: t.columna === 'Completado'
        }));
      }

      docenteObj.totalAlumnos = totalEstudiantes;
      docenteObj.asistenciaPromedioGeneral = asistenciaMes;

      const totalBloquesSemana = horarioSemanal.reduce((acc, row) => {
        const dias: ('lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes')[] = [
          'lunes',
          'martes',
          'miercoles',
          'jueves',
          'viernes'
        ];
        dias.forEach((d) => {
          const val = String(row[d] || '').trim();
          if (val && !val.toUpperCase().includes('RECESO')) acc++;
        });
        return acc;
      }, 0);

      return res.json({
        success: true,
        docente: docenteObj,
        resumenHoy: {
          fecha: new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          jornada: misParalelos[0]?.jornada ? `${misParalelos[0].jornada}` : 'Matutina',
          claseActual,
          clasesHoy,
          horarioSemanal
        },
        estadisticas: {
          totalEstudiantes,
          actividadesPorCalificar: actividadesPendientes,
          clasesPlanificadasSemana: totalBloquesSemana,
          asistenciaPromedioMes: asistenciaMes,
          unidadesActivas,
          informesGenerados: unidadesActivas
        },
        tareasKanban,
        porHacerInteligente: [],
        ultimasActividades: []
      });
    } catch (e) {
      console.warn('Error calculando dashboard:', e);
    }
  }

  res.json({
    success: true,
    docente: DOCENTE_ACTUAL,
    resumenHoy: {
      fecha: new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      jornada: 'Matutina',
      claseActual: null,
      clasesHoy: [],
      horarioSemanal: []
    },
    estadisticas: { totalEstudiantes: 0, actividadesPorCalificar: 0, clasesPlanificadasSemana: 0, asistenciaPromedioMes: 0, unidadesActivas: 0, informesGenerados: 0 },
    tareasKanban: [],
    porHacerInteligente: [],
    ultimasActividades: []
  });
});

app.get('/api/paralelos', async (req: Request, res: Response) => {
  await connectDB();
  if (isMongoConnected()) {
    try {
      const includeInactive = req.query.incluirInactivos === 'true';
      const auth = await resolveDocenteParaleloFilter(req, includeInactive);
      if (!auth) return res.json({ success: true, paralelos: [] });

      const paralelos = await Paralelo.find(auth.filter).sort({ createdAt: -1 });
      const paralelosWithCount = await Promise.all(
        paralelos.map(async (p: any) => {
          const cleanAlumnos = await deduplicateAlumnosForParalelo(p);
          return {
            id: p._id.toString(),
            nombre: p.nombre,
            grado: p.grado,
            paralelo: p.paralelo || 'A',
            nivel: p.nivel || 'Educación Básica Superior',
            jornada: p.jornada || 'Matutina',
            materia: p.materia || p.materias?.[0] || 'General',
            horario: p.horario || '07:15 - 08:45',
            aula: p.aula || 'Aula 101',
            activo: p.activo !== false,
            totalEstudiantes: cleanAlumnos.length,
            asistenciaHoyRegistrada: Boolean(p.asistenciaHoyRegistrada),
            porcentajeAsistenciaMes: 100
          };
        })
      );
      return res.json({
        success: true,
        paralelos: paralelosWithCount
      });
    } catch (e: any) {
      console.warn('Error en GET /api/paralelos:', e);
      return res.json({ success: true, paralelos: [] });
    }
  }
  res.json({ success: true, paralelos: [] });
});

app.post('/api/paralelos', async (req: Request, res: Response) => {
  await connectDB();
  if (!isMongoConnected()) {
    return res.status(503).json({ success: false, error: 'Servicio de base de datos no disponible' });
  }
  try {
    const auth = await resolveDocenteParaleloFilter(req, true);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'No autenticado' });
    }

    const { nombre, grado, paralelo, materia, nivel, jornada, horario, aula, estudiantes } = req.body;
    const gradoStr = String(grado || '8vo EGB').trim();
    const paraleloLetra = String(paralelo || 'A').trim();
    const materiaStr = String(materia || 'General').trim();
    if (!materiaStr) {
      return res.status(400).json({ success: false, error: 'La materia es obligatoria' });
    }

    const nombreFinal =
      typeof nombre === 'string' && nombre.trim()
        ? nombre.trim()
        : `${gradoStr} "${paraleloLetra}" - ${materiaStr}`;

    const nuevoParalelo = await Paralelo.create({
      nombre: nombreFinal,
      grado: parseInt(gradoStr.replace(/\D/g, ''), 10) || 8,
      paralelo: paraleloLetra,
      materia: materiaStr,
      materias: [materiaStr],
      nivel: nivel || 'Educación Básica Superior',
      jornada: jornada || 'Matutina',
      horario: horario || '07:15 - 08:45',
      aula: aula || 'Aula 101',
      docenteId: auth.primaryDocenteId,
      asistenciaHoyRegistrada: false,
      activo: true
    });

    let totalInsertados = 0;
    if (Array.isArray(estudiantes) && estudiantes.length > 0) {
      const validEsts = estudiantes
        .filter((e: any) => e && typeof e.nombre === 'string' && e.nombre.trim())
        .map((e: any, idx: number) => ({
          nombre: e.nombre.trim(),
          cedula: e.cedula ? String(e.cedula).trim() : '',
          numeroLista: idx + 1,
          paraleloId: nuevoParalelo._id,
          activo: true,
          telefonoRepresentante: e.telefonoRepresentante ? String(e.telefonoRepresentante).trim() : ''
        }));
      if (validEsts.length > 0) {
        await Alumno.insertMany(validEsts);
        totalInsertados = validEsts.length;
      }
    }

    if (/^[a-f\d]{24}$/i.test(auth.primaryDocenteId)) {
      await Usuario.updateOne(
        { _id: auth.primaryDocenteId },
        { $addToSet: { materias: materiaStr } }
      ).catch(() => {});
    }

    return res.status(201).json({
      success: true,
      paralelo: {
        id: nuevoParalelo._id.toString(),
        nombre: nuevoParalelo.nombre,
        grado: nuevoParalelo.grado,
        paralelo: nuevoParalelo.paralelo || paraleloLetra,
        nivel: nuevoParalelo.nivel,
        jornada: nuevoParalelo.jornada,
        materia: nuevoParalelo.materia,
        horario: nuevoParalelo.horario,
        aula: nuevoParalelo.aula,
        activo: true,
        totalEstudiantes: totalInsertados,
        asistenciaHoyRegistrada: false,
        porcentajeAsistenciaMes: 100
      }
    });
  } catch (e: any) {
    recordAdminError(req, 500, e.message || 'Error creando paralelo');
    return res.status(500).json({ success: false, error: e.message || 'Error al crear el curso' });
  }
});

app.put('/api/paralelos/:id', async (req: Request, res: Response) => {
  await connectDB();
  if (!isMongoConnected()) {
    return res.status(503).json({ success: false, error: 'Servicio de base de datos no disponible' });
  }
  try {
    const auth = await resolveDocenteParaleloFilter(req, true);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'No autenticado' });
    }
    const { id } = req.params;
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return res.status(400).json({ success: false, error: 'ID de paralelo inválido' });
    }

    const existing = await Paralelo.findOne({ _id: id, ...auth.filter });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Curso no encontrado o sin permisos' });
    }

    const { nombre, grado, paralelo, materia, nivel, jornada, horario, aula, activo } = req.body;
    if (typeof nombre === 'string' && nombre.trim()) existing.nombre = nombre.trim();
    if (grado !== undefined) existing.grado = parseInt(String(grado).replace(/\D/g, ''), 10) || existing.grado;
    if (typeof paralelo === 'string' && paralelo.trim()) existing.paralelo = paralelo.trim();
    if (typeof materia === 'string' && materia.trim()) {
      existing.materia = materia.trim();
      existing.materias = [materia.trim()];
    }
    if (typeof nivel === 'string' && nivel.trim()) existing.nivel = nivel.trim();
    if (typeof jornada === 'string' && ['Matutina', 'Vespertina', 'Nocturna'].includes(jornada)) {
      existing.jornada = jornada;
    }
    if (typeof horario === 'string') existing.horario = horario.trim();
    if (typeof aula === 'string') existing.aula = aula.trim();
    if (typeof activo === 'boolean') existing.activo = activo;

    await existing.save();

    const count = await Alumno.countDocuments({
      $or: [{ paraleloId: existing._id }, { paraleloId: existing._id.toString() }],
      activo: { $ne: false }
    });

    return res.json({
      success: true,
      paralelo: {
        id: existing._id.toString(),
        nombre: existing.nombre,
        grado: existing.grado,
        paralelo: existing.paralelo || 'A',
        nivel: existing.nivel || 'Educación Básica Superior',
        jornada: existing.jornada || 'Matutina',
        materia: existing.materia || existing.materias?.[0] || 'General',
        horario: existing.horario || '07:15 - 08:45',
        aula: existing.aula || 'Aula 101',
        activo: existing.activo !== false,
        totalEstudiantes: count,
        asistenciaHoyRegistrada: Boolean(existing.asistenciaHoyRegistrada),
        porcentajeAsistenciaMes: 100
      }
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message || 'Error actualizando el curso' });
  }
});

app.delete('/api/paralelos/:id', async (req: Request, res: Response) => {
  await connectDB();
  if (!isMongoConnected()) {
    return res.status(503).json({ success: false, error: 'Servicio de base de datos no disponible' });
  }
  try {
    const auth = await resolveDocenteParaleloFilter(req, true);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'No autenticado' });
    }
    const { id } = req.params;
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return res.status(400).json({ success: false, error: 'ID de paralelo inválido' });
    }

    const updated = await Paralelo.findOneAndUpdate(
      { _id: id, ...auth.filter },
      { $set: { activo: false } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Curso no encontrado o sin permisos' });
    }

    return res.json({
      success: true,
      id,
      message: 'Curso desactivado correctamente. Su historial de asistencias y calificaciones se mantiene intacto.'
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message || 'Error al desactivar el curso' });
  }
});

app.get('/api/paralelos/:id/alumnos', async (req: Request, res: Response) => {
  await connectDB();
  if (!isMongoConnected()) {
    return res.status(503).json({ success: false, error: 'Servicio de base de datos no disponible' });
  }
  try {
    const auth = await resolveDocenteParaleloFilter(req, true);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'No autenticado' });
    }
    const { id } = req.params;
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return res.status(400).json({ success: false, error: 'ID de paralelo inválido' });
    }

    const paraleloDoc = await Paralelo.findOne({ _id: id, ...auth.filter });
    if (!paraleloDoc) {
      return res.status(404).json({ success: false, error: 'Curso no encontrado o sin permisos' });
    }

    const alumnos = await deduplicateAlumnosForParalelo(paraleloDoc);

    return res.json({
      success: true,
      alumnos: alumnos.map((a: any, idx: number) => ({
        id: a._id.toString(),
        nombre: a.nombre,
        cedula: a.cedula || '',
        numeroLista: a.numeroLista || idx + 1,
        telefonoRepresentante: a.telefonoRepresentante || ''
      }))
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message || 'Error cargando estudiantes' });
  }
});

app.post('/api/paralelos/:id/alumnos', async (req: Request, res: Response) => {
  await connectDB();
  if (!isMongoConnected()) {
    return res.status(503).json({ success: false, error: 'Servicio de base de datos no disponible' });
  }
  try {
    const auth = await resolveDocenteParaleloFilter(req, true);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'No autenticado' });
    }
    const { id } = req.params;
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return res.status(400).json({ success: false, error: 'ID de paralelo inválido' });
    }

    const paraleloDoc = await Paralelo.findOne({ _id: id, ...auth.filter });
    if (!paraleloDoc) {
      return res.status(404).json({ success: false, error: 'Curso no encontrado o sin permisos' });
    }

    const existingAlumnos = await deduplicateAlumnosForParalelo(paraleloDoc);

    const { nombre, cedula, telefonoRepresentante, estudiantes, actualizarDuplicados } = req.body;
    const rawList = Array.isArray(estudiantes)
      ? estudiantes
      : nombre
      ? [{ nombre, cedula, telefonoRepresentante }]
      : [];

    const validIncoming = rawList
      .filter((item: any) => item && typeof item.nombre === 'string' && item.nombre.trim())
      .map((item: any) => ({
        nombre: item.nombre.trim(),
        cedula: item.cedula ? String(item.cedula).trim() : '',
        telefonoRepresentante: item.telefonoRepresentante ? String(item.telefonoRepresentante).trim() : ''
      }));

    if (validIncoming.length === 0) {
      return res.status(400).json({ success: false, error: 'Debe proporcionar al menos un estudiante con nombre válido' });
    }

    let nextNumeroLista = existingAlumnos.length + 1;
    const toInsert: any[] = [];
    let actualizadosCount = 0;
    let omitidosCount = 0;

    for (const item of validIncoming) {
      const normName = item.nombre.toLowerCase().replace(/\s+/g, ' ');
      const normCedula = item.cedula;
      const existingMatch = existingAlumnos.find((ex: any) => {
        const exName = String(ex.nombre || '').trim().toLowerCase().replace(/\s+/g, ' ');
        const exCedula = String(ex.cedula || '').trim();
        return exName === normName || (normCedula && exCedula && exCedula === normCedula);
      });

      if (existingMatch) {
        if (actualizarDuplicados === true) {
          const updateFields: any = { nombre: item.nombre };
          if (item.cedula) updateFields.cedula = item.cedula;
          if (item.telefonoRepresentante) updateFields.telefonoRepresentante = item.telefonoRepresentante;
          await Alumno.updateOne({ _id: existingMatch._id }, { $set: updateFields });
          actualizadosCount++;
        } else {
          omitidosCount++;
        }
      } else {
        toInsert.push({
          nombre: item.nombre,
          cedula: item.cedula,
          numeroLista: nextNumeroLista++,
          paraleloId: paraleloDoc._id,
          activo: true,
          telefonoRepresentante: item.telefonoRepresentante
        });
      }
    }

    if (toInsert.length > 0) {
      await Alumno.insertMany(toInsert);
    }

    const alumnos = await deduplicateAlumnosForParalelo(paraleloDoc);

    return res.status(201).json({
      success: true,
      insertadosCount: toInsert.length,
      actualizadosCount,
      omitidosCount,
      alumnos: alumnos.map((a: any, idx: number) => ({
        id: a._id.toString(),
        nombre: a.nombre,
        cedula: a.cedula || '',
        numeroLista: a.numeroLista || idx + 1,
        telefonoRepresentante: a.telefonoRepresentante || ''
      }))
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message || 'Error agregando estudiantes' });
  }
});

app.delete('/api/paralelos/:id/alumnos/:alumnoId', async (req: Request, res: Response) => {
  await connectDB();
  if (!isMongoConnected()) {
    return res.status(503).json({ success: false, error: 'Servicio de base de datos no disponible' });
  }
  try {
    const auth = await resolveDocenteParaleloFilter(req, true);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'No autenticado' });
    }
    const { id, alumnoId } = req.params;
    if (!/^[a-f\d]{24}$/i.test(id) || !/^[a-f\d]{24}$/i.test(alumnoId)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    const paraleloDoc = await Paralelo.findOne({ _id: id, ...auth.filter });
    if (!paraleloDoc) {
      return res.status(404).json({ success: false, error: 'Curso no encontrado o sin permisos' });
    }

    await Alumno.findOneAndUpdate(
      {
        _id: alumnoId,
        $or: [{ paraleloId: paraleloDoc._id }, { paraleloId: paraleloDoc._id.toString() }]
      },
      { $set: { activo: false } }
    );

    const remaining = await Alumno.find({
      $or: [{ paraleloId: paraleloDoc._id }, { paraleloId: paraleloDoc._id.toString() }],
      activo: { $ne: false }
    }).sort({ numeroLista: 1, nombre: 1 });

    await Promise.all(
      remaining.map((a: any, idx: number) =>
        Alumno.updateOne({ _id: a._id }, { $set: { numeroLista: idx + 1 } })
      )
    );

    return res.json({
      success: true,
      alumnos: remaining.map((a: any, idx: number) => ({
        id: a._id.toString(),
        nombre: a.nombre,
        cedula: a.cedula || '',
        numeroLista: idx + 1,
        telefonoRepresentante: a.telefonoRepresentante || ''
      }))
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message || 'Error eliminando estudiante' });
  }
});

app.get('/api/asistencia', async (req: Request, res: Response) => {
  await connectDB();
  if (isMongoConnected()) {
    try {
      const auth = await resolveDocenteParaleloFilter(req, false);
      if (!auth) return res.json({ success: true, paralelos: [] });

      const paralelos = await Paralelo.find(auth.filter).sort({ createdAt: -1 });
      const paralelosWithCount = await Promise.all(
        paralelos.map(async (p: any) => {
          const cleanAlumnos = await deduplicateAlumnosForParalelo(p);
          return {
            id: p._id.toString(),
            nombre: p.nombre,
            grado: p.grado,
            paralelo: p.paralelo || 'A',
            nivel: p.nivel || 'Educación Básica Superior',
            jornada: p.jornada || 'Matutina',
            materia: p.materia || p.materias?.[0] || 'General',
            horario: p.horario || '07:15 - 08:45',
            aula: p.aula || 'Aula 101',
            totalEstudiantes: cleanAlumnos.length,
            asistenciaHoyRegistrada: Boolean(p.asistenciaHoyRegistrada),
            porcentajeAsistenciaMes: 100
          };
        })
      );
      return res.json({
        success: true,
        paralelos: paralelosWithCount
      });
    } catch (e) {
      return res.json({ success: true, paralelos: [] });
    }
  }
  res.json({ success: true, paralelos: [] });
});

app.get('/api/horario', async (req: Request, res: Response) => {
  await connectDB();
  if (isMongoConnected()) {
    try {
      const auth = await resolveDocenteParaleloFilter(req, false);
      if (!auth) {
        return res.status(401).json({ success: false, error: 'No autenticado' });
      }
      const userPayload = auth.userPayload;
      const misParalelos = await Paralelo.find(auth.filter).sort({ grado: 1, createdAt: 1 });
      const regenerar = req.query.regenerar === 'true';

      const dbUser =
        (userPayload?.id && /^[a-f\d]{24}$/i.test(String(userPayload.id))
          ? await Usuario.findById(userPayload.id)
          : null) ||
        (userPayload?.email ? await Usuario.findOne({ email: userPayload.email.toLowerCase().trim() }) : null);

      let horario =
        !regenerar && dbUser && Array.isArray((dbUser as any).horarioSemanal) && (dbUser as any).horarioSemanal.length > 0
          ? (dbUser as any).horarioSemanal.map((h: any) => ({
              hora: h.hora || '',
              lunes: h.lunes || '',
              martes: h.martes || '',
              miercoles: h.miercoles || '',
              jueves: h.jueves || '',
              viernes: h.viernes || ''
            }))
          : buildDefaultHorarioFromParalelos(misParalelos);

      if (dbUser && (regenerar || !Array.isArray((dbUser as any).horarioSemanal) || (dbUser as any).horarioSemanal.length === 0)) {
        (dbUser as any).horarioSemanal = horario;
        await dbUser.save().catch(() => {});
      }

      return res.json({
        success: true,
        horario,
        cursos: misParalelos.map((p: any) => ({
          id: p._id.toString(),
          nombre: p.nombre,
          materia: p.materia || p.materias?.[0] || 'General',
          horario: p.horario || '07:15 - 08:45',
          aula: p.aula || 'Aula 101'
        }))
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message || 'Error al obtener horario' });
    }
  }
  return res.json({
    success: true,
    horario: buildDefaultHorarioFromParalelos(PARALELOS_INICIALES),
    cursos: PARALELOS_INICIALES.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      materia: p.materia,
      horario: p.horario,
      aula: p.aula
    }))
  });
});

app.put('/api/horario', async (req: Request, res: Response) => {
  await connectDB();
  if (!isMongoConnected()) {
    return res.status(503).json({ success: false, error: 'Servicio de base de datos no disponible' });
  }
  try {
    const auth = await resolveDocenteParaleloFilter(req, false);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'No autenticado' });
    }
    const userPayload = auth.userPayload;
    const rawHorario = Array.isArray(req.body?.horario) ? req.body.horario : [];
    const sanitizedHorario = rawHorario.map((row: any) => ({
      hora: String(row?.hora || '').trim(),
      lunes: String(row?.lunes || '').trim(),
      martes: String(row?.martes || '').trim(),
      miercoles: String(row?.miercoles || '').trim(),
      jueves: String(row?.jueves || '').trim(),
      viernes: String(row?.viernes || '').trim()
    }));

    const dbUser =
      (userPayload?.id && /^[a-f\d]{24}$/i.test(String(userPayload.id))
        ? await Usuario.findById(userPayload.id)
        : null) ||
      (userPayload?.email ? await Usuario.findOne({ email: userPayload.email.toLowerCase().trim() }) : null);

    if (dbUser) {
      (dbUser as any).horarioSemanal = sanitizedHorario;
      await dbUser.save();
    }

    return res.json({
      success: true,
      horario: sanitizedHorario,
      message: 'Horario semanal guardado correctamente'
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message || 'Error al guardar horario' });
  }
});

// ==========================================
// 6 ENDPOINTS REQUERIDOS MONGODB + FALLBACK
// ==========================================

// 1. GET /api/asistencia/:cursoId
app.get('/api/asistencia/:cursoId', async (req: Request, res: Response) => {
  const { cursoId } = req.params;
  const fechaHoy = new Date().toISOString().slice(0, 10);
  const fechaConsulta =
    typeof req.query.fecha === 'string' && req.query.fecha.trim()
      ? req.query.fecha.trim()
      : fechaHoy;

  await connectDB();
  if (isMongoConnected()) {
    try {
      const auth = await resolveDocenteParaleloFilter(req, false);
      if (!auth) {
        return res.json({
          success: true,
          paralelo: { id: '', nombre: '', grado: 8, jornada: 'Matutina', materia: '' },
          fecha: fechaConsulta,
          registroExistente: false,
          asistenciaHoy: []
        });
      }

      let paraleloDoc = null;
      if (cursoId && cursoId !== 'default') {
        if (/^[0-9a-fA-F]{24}$/.test(cursoId)) {
          paraleloDoc = await Paralelo.findOne({ _id: cursoId, ...auth.filter });
        } else {
          paraleloDoc = await Paralelo.findOne({ nombre: cursoId, ...auth.filter });
        }
      }
      if (!paraleloDoc) {
        paraleloDoc = await Paralelo.findOne(auth.filter);
      }

      if (!paraleloDoc) {
        return res.json({
          success: true,
          paralelo: { id: '', nombre: '', grado: 8, jornada: 'Matutina', materia: '' },
          fecha: fechaConsulta,
          registroExistente: false,
          asistenciaHoy: []
        });
      }

      const paraleloIdStr = paraleloDoc._id.toString();
      const alumnos = await deduplicateAlumnosForParalelo(paraleloDoc);
      const asistenciaDoc = await Asistencia.findOne({
        $or: [{ paraleloId: paraleloIdStr }, { paraleloId: cursoId }],
        fecha: fechaConsulta
      });

      const paraleloObj = {
        id: paraleloIdStr,
        nombre: paraleloDoc.nombre,
        grado: paraleloDoc.grado,
        jornada: paraleloDoc.jornada || 'Matutina',
        materia: paraleloDoc.materia || paraleloDoc.materias?.[0] || 'General'
      };

      const asistenciaHoy = alumnos.map((est: any, idx: number) => {
        const reg = asistenciaDoc?.registros?.find((r: any) => r.estudianteId === est._id.toString());
        return {
          estudianteId: est._id.toString(),
          nombre: est.nombre,
          numeroLista: est.numeroLista || idx + 1,
          cedula: est.cedula || '',
          estado: reg?.estado || '',
          justificada: reg ? Boolean(reg.justificada) : false,
          motivo: reg?.motivo || '',
          faltasJustificadas: est.faltasJustificadas || 0,
          faltasInjustificadas: est.faltasInjustificadas || 0,
          atrasos: est.atrasos || 0,
          porcentajeFaltas: 0
        };
      });

      return res.json({
        success: true,
        paralelo: paraleloObj,
        fecha: fechaConsulta,
        registroExistente: Boolean(asistenciaDoc),
        asistenciaHoy
      });
    } catch (err) {
      console.warn('Error leyendo asistencia de MongoDB:', err);
    }
  }

  // Fallback memoria
  const paralelo = paralelosState.find((p: any) => p.id === cursoId);
  if (!paralelo) {
    return res.json({
      success: true,
      paralelo: { id: '', nombre: '', grado: 8, jornada: 'Matutina', materia: '' },
      fecha: fechaConsulta,
      registroExistente: false,
      asistenciaHoy: []
    });
  }
  const asistenciaHoy = paralelo.estudiantes.map((est: any) => ({
    estudianteId: est.id,
    nombre: est.nombre,
    numeroLista: est.numeroLista,
    cedula: est.cedula,
    estado: '',
    justificada: false,
    motivo: '',
    faltasJustificadas: est.faltasJustificadas || 0,
    faltasInjustificadas: est.faltasInjustificadas || 0,
    atrasos: est.atrasos || 0,
    porcentajeFaltas: 0
  }));
  res.json({ success: true, paralelo, fecha: fechaConsulta, registroExistente: false, asistenciaHoy });
});

// 2. POST /api/asistencia/:cursoId
app.post('/api/asistencia/:cursoId', async (req: Request, res: Response) => {
  const { cursoId } = req.params;
  const { registros, fecha } = req.body;
  const fechaHoy = new Date().toISOString().slice(0, 10);
  const fechaRegistro =
    typeof fecha === 'string' && fecha.trim() ? fecha.trim() : fechaHoy;

  await connectDB();
  if (isMongoConnected()) {
    try {
      const auth = await resolveDocenteParaleloFilter(req, false);
      if (auth && /^[0-9a-fA-F]{24}$/.test(cursoId)) {
        const owns = await Paralelo.findOne({ _id: cursoId, ...auth.filter });
        if (!owns) {
          return res.status(403).json({ success: false, error: 'No tienes permiso para modificar este curso' });
        }
      }
      await Asistencia.findOneAndUpdate(
        { paraleloId: cursoId, fecha: fechaRegistro },
        { paraleloId: cursoId, fecha: fechaRegistro, registros: registros || [] },
        { upsert: true, new: true }
      );
      if (fechaRegistro === fechaHoy) {
        await Paralelo.findByIdAndUpdate(cursoId, { asistenciaHoyRegistrada: true }).catch(() => {});
      }
      return res.json({
        success: true,
        message: 'Asistencia guardada correctamente',
        paraleloId: cursoId,
        fecha: fechaRegistro
      });
    } catch (err) {
      console.warn('Error guardando asistencia en MongoDB:', err);
    }
  }

  // Fallback memoria
  const index = paralelosState.findIndex((p: any) => p.id === cursoId);
  if (index !== -1 && fechaRegistro === fechaHoy) {
    paralelosState[index].asistenciaHoyRegistrada = true;
  }
  res.json({
    success: true,
    message: 'Asistencia guardada en memoria',
    paraleloId: cursoId,
    fecha: fechaRegistro
  });
});

// 3. GET /api/calificaciones/:cursoId
app.get('/api/calificaciones/:cursoId', async (req: Request, res: Response) => {
  const { cursoId } = req.params;

  await connectDB();
  if (isMongoConnected()) {
    try {
      const auth = await resolveDocenteParaleloFilter(req, false);
      if (!auth) {
        return res.json({
          success: true,
          paralelo: { id: '', nombre: '', grado: 8, materia: '' },
          actividades: [],
          libroNotas: [],
          estadisticas: { promedioGeneral: 0, porcentajeAprobados: 0, totalEstudiantes: 0, enRiesgo: [] }
        });
      }

      let mongoParalelo = null;
      if (cursoId && cursoId !== 'default') {
        if (/^[0-9a-fA-F]{24}$/.test(cursoId)) {
          mongoParalelo = await Paralelo.findOne({ _id: cursoId, ...auth.filter });
        } else {
          mongoParalelo = await Paralelo.findOne({ nombre: cursoId, ...auth.filter });
        }
      }
      if (!mongoParalelo) {
        mongoParalelo = await Paralelo.findOne(auth.filter);
      }

      if (!mongoParalelo) {
        return res.json({
          success: true,
          paralelo: { id: '', nombre: '', grado: 8, materia: '' },
          actividades: [],
          libroNotas: [],
          estadisticas: { promedioGeneral: 0, porcentajeAprobados: 0, totalEstudiantes: 0, enRiesgo: [] }
        });
      }

      const paraleloIdStr = mongoParalelo._id.toString();
      const alumnos = await deduplicateAlumnosForParalelo(mongoParalelo);
      const actividadesMongo = await Actividad.find({ paraleloId: { $in: [paraleloIdStr, cursoId] } });
      const calificacionesMongo = await Calificacion.find({ paraleloId: { $in: [paraleloIdStr, cursoId] } });

      const actividades = actividadesMongo.map((a: any) => ({
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
      }));

      const libroNotas = alumnos.map((est: any, idx: number) => {
        const estId = est._id.toString();
        const notasAlumno: Record<string, number> = {};
        actividades.forEach((act: any) => {
          const found = calificacionesMongo.find((c: any) => c.estudianteId === estId && c.actividadId === act.id);
          if (found) {
            notasAlumno[act.id] = found.nota;
          }
        });
        const vals = Object.values(notasAlumno) as number[];
        const prom = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        return {
          estudianteId: estId,
          nombre: est.nombre,
          numeroLista: est.numeroLista || idx + 1,
          cedula: est.cedula || '',
          notas: notasAlumno,
          promedio: Number(prom.toFixed(2))
        };
      });

      const promediosConNota = libroNotas.map((n: any) => n.promedio).filter((p: number) => p > 0);
      const promedioGeneral =
        promediosConNota.length > 0
          ? Number((promediosConNota.reduce((a, b) => a + b, 0) / promediosConNota.length).toFixed(2))
          : 0;
      const aprobados = promediosConNota.filter((p: number) => p >= 7.0).length;
      const porcentajeAprobados =
        promediosConNota.length > 0 ? Number(((aprobados / promediosConNota.length) * 100).toFixed(1)) : 0;

      return res.json({
        success: true,
        paralelo: {
          id: paraleloIdStr,
          nombre: mongoParalelo.nombre,
          grado: mongoParalelo.grado,
          materia: mongoParalelo.materia || mongoParalelo.materias?.[0] || 'General'
        },
        actividades,
        libroNotas,
        estadisticas: {
          promedioGeneral,
          porcentajeAprobados,
          totalEstudiantes: libroNotas.length,
          enRiesgo: libroNotas.filter((n: any) => n.promedio > 0 && n.promedio < 7.0)
        }
      });
    } catch (err) {
      console.warn('Error leyendo calificaciones de MongoDB:', err);
    }
  }

  // Fallback memoria
  const paralelo = paralelosState.find((p: any) => p.id === cursoId);
  if (!paralelo) {
    return res.json({
      success: true,
      paralelo: { id: '', nombre: '', grado: 8, materia: '' },
      actividades: [],
      libroNotas: [],
      estadisticas: { promedioGeneral: 0, porcentajeAprobados: 0, totalEstudiantes: 0, enRiesgo: [] }
    });
  }
  const actividades = actividadesState.filter((a: any) => a.paraleloId === paralelo.id);
  const matrix = calificacionesMatrix[paralelo.id] || {};
  const libroNotas = paralelo.estudiantes.map((est: any) => {
    const notasAlumno: Record<string, number> = matrix[est.id] || {};
    const vals = Object.values(notasAlumno) as number[];
    const prom = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return { estudianteId: est.id, nombre: est.nombre, numeroLista: est.numeroLista, cedula: est.cedula, notas: notasAlumno, promedio: Number(prom.toFixed(2)) };
  });

  res.json({
    success: true,
    paralelo,
    actividades,
    libroNotas,
    estadisticas: { promedioGeneral: 0, porcentajeAprobados: 0, totalEstudiantes: libroNotas.length, enRiesgo: [] }
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
      return res.json({ success: true, nota: finalNota, message: 'Nota guardada correctamente' });
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
      const isObjectId = mongoose.isValidObjectId(paraleloId);
      const paraleloDoc = await Paralelo.findOne(
        isObjectId ? { $or: [{ _id: paraleloId }, { id: paraleloId }] } : { $or: [{ id: paraleloId }, { nombre: paraleloId }] }
      ).catch(() => null);
      const realParaleloId = paraleloDoc ? paraleloDoc._id.toString() : paraleloId;

      const nuevaAct = await Actividad.create({
        paraleloId: realParaleloId,
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
    } catch (err) {
      console.warn('Error leyendo Kanban de MongoDB:', err);
    }
  }
  res.json({ success: true, kanbanTasks: [] });
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
      return res.json({ success: true, message: 'Tarea eliminada correctamente' });
    } catch (err) {}
  }

  kanbanTasks = kanbanTasks.filter(t => t.id !== id);
  res.json({ success: true, message: 'Tarea eliminada' });
});

// Other endpoints
app.post('/api/ai/analisis-rendimiento', async (req: Request, res: Response) => {
  const {
    paraleloId,
    paraleloNombre,
    materia,
    promedioGeneral,
    porcentajeAprobados,
    estudiantesEnRiesgo,
    actividadesCriticas,
    totalCalificaciones
  } = req.body || {};

  if (typeof totalCalificaciones === 'number' && totalCalificaciones === 0) {
    return res.json({ success: true, sinCalificaciones: true, analisis: null });
  }

  let resolvedNombre = paraleloNombre || 'Curso';
  let resolvedMateria = materia || 'General';
  let resolvedPromedio = typeof promedioGeneral === 'number' ? promedioGeneral : 0;
  let resolvedAprobados = typeof porcentajeAprobados === 'number' ? porcentajeAprobados : 0;
  let resolvedRiesgo = Array.isArray(estudiantesEnRiesgo) ? estudiantesEnRiesgo : [];
  let resolvedCriticas = Array.isArray(actividadesCriticas) ? actividadesCriticas : [];

  await connectDB();
  if (isMongoConnected() && paraleloId && typeof totalCalificaciones !== 'number') {
    try {
      const pDoc = /^[0-9a-fA-F]{24}$/.test(String(paraleloId))
        ? await Paralelo.findById(paraleloId)
        : await Paralelo.findOne({ nombre: paraleloId });
      if (pDoc) {
        resolvedNombre = pDoc.nombre;
        resolvedMateria = pDoc.materia || pDoc.materias?.[0] || 'General';
        const pIdStr = pDoc._id.toString();
        const calificaciones = await Calificacion.find({ paraleloId: { $in: [pIdStr, paraleloId] } });
        if (calificaciones.length === 0) {
          return res.json({ success: true, sinCalificaciones: true, analisis: null });
        }
      }
    } catch (e) {}
  }

  const analisis = await analizarRendimientoGrupo({
    paraleloNombre: resolvedNombre,
    materia: resolvedMateria,
    promedioGeneral: resolvedPromedio,
    porcentajeAprobados: resolvedAprobados,
    estudiantesEnRiesgo: resolvedRiesgo,
    actividadesCriticas: resolvedCriticas
  });
  res.json({ success: true, sinCalificaciones: false, analisis });
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

const serializePlanificacion = (p: any) => ({
  id: p._id ? p._id.toString() : p.id,
  docenteId: p.docenteId,
  paraleloId: p.paraleloId || '',
  paralelo: p.paralelo || '',
  materia: p.materia || 'Lengua y Literatura',
  bloque: p.bloque || 2,
  titulo: p.titulo || 'Unidad Microcurricular',
  destreza: p.destreza || '',
  semanas: p.semanas || 4,
  fechaInicio: p.fechaInicio || '',
  fechaFin: p.fechaFin || '',
  diasImparticion: Array.isArray(p.diasImparticion) ? p.diasImparticion : [],
  progreso: typeof p.progreso === 'number' ? p.progreso : 0,
  estado: p.estado || 'Por iniciar',
  generadaIA: Boolean(p.generadaIA),
  objetivos: Array.isArray(p.objetivos) ? p.objetivos : [],
  recursos: Array.isArray(p.recursos) ? p.recursos : [],
  criteriosEvaluacion: Array.isArray(p.criteriosEvaluacion) ? p.criteriosEvaluacion : [],
  secuenciaClases: Array.isArray(p.secuenciaClases)
    ? p.secuenciaClases.map((s: any, idx: number) => ({
        semana: s.semana || idx + 1,
        tema: s.tema || '',
        contenido: s.contenido || '',
        actividad: s.actividad || s.actividadSugerida || '',
        actividadSugerida: s.actividadSugerida || s.actividad || '',
        completada: Boolean(s.completada)
      }))
    : [],
  archivosAdjuntos: Array.isArray(p.archivosAdjuntos)
    ? p.archivosAdjuntos.map((a: any) => ({
        nombre: a.nombre || 'Archivo',
        tipo: a.tipo || 'application/octet-stream',
        tamano: a.tamano || '',
        contenidoBase64: a.contenidoBase64 || '',
        fecha: a.fecha || ''
      }))
    : []
});

app.get('/api/planificacion', async (req: Request, res: Response) => {
  await connectDB();
  if (isMongoConnected()) {
    try {
      const auth = await resolveDocenteParaleloFilter(req, true);
      const userPayload = auth?.userPayload || getUserFromToken(req);
      const docenteId = auth?.primaryDocenteId || userPayload?.id || 'docente-1';
      const ids = Array.from(new Set([docenteId, userPayload?.id].filter(Boolean)));
      const plans = await Planificacion.find({ docenteId: { $in: ids } }).sort({ createdAt: -1 });
      return res.json({
        success: true,
        planificaciones: plans.map(serializePlanificacion)
      });
    } catch (e) {
      console.warn('Error leyendo planificaciones:', e);
    }
  }
  res.json({ success: true, planificaciones: [] });
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

app.post('/api/planificacion', async (req: Request, res: Response) => {
  await connectDB();
  const auth = await resolveDocenteParaleloFilter(req, true);
  const userPayload = auth?.userPayload || getUserFromToken(req);
  const docenteId = auth?.primaryDocenteId || userPayload?.id || 'docente-1';

  const rawSecuencia = Array.isArray(req.body.secuenciaClases)
    ? req.body.secuenciaClases.map((s: any, idx: number) => ({
        semana: Number(s.semana) || idx + 1,
        tema: String(s.tema || '').trim(),
        contenido: String(s.contenido || '').trim(),
        actividad: String(s.actividad || s.actividadSugerida || '').trim(),
        actividadSugerida: String(s.actividadSugerida || s.actividad || '').trim(),
        completada: Boolean(s.completada)
      }))
    : [];

  const completadasCount = rawSecuencia.filter((s: any) => s.completada).length;
  const computedProgreso =
    rawSecuencia.length > 0 && completadasCount > 0
      ? Math.round((completadasCount / rawSecuencia.length) * 100)
      : Number(req.body.progreso) || 0;

  if (isMongoConnected()) {
    try {
      const created = await Planificacion.create({
        docenteId,
        paraleloId: req.body.paraleloId || '',
        paralelo: req.body.paralelo || '',
        materia: req.body.materia || 'Lengua y Literatura',
        bloque: Number(req.body.bloque) || 2,
        titulo: req.body.titulo || 'Nueva Planificación',
        destreza: req.body.destreza || '',
        semanas: Number(req.body.semanas) || Math.max(1, rawSecuencia.length || 4),
        fechaInicio: req.body.fechaInicio || '',
        fechaFin: req.body.fechaFin || '',
        diasImparticion: Array.isArray(req.body.diasImparticion) ? req.body.diasImparticion : [],
        progreso: computedProgreso,
        estado: req.body.estado || 'Por iniciar',
        generadaIA: Boolean(req.body.generadaIA),
        objetivos: Array.isArray(req.body.objetivos) ? req.body.objetivos : [],
        recursos: Array.isArray(req.body.recursos) ? req.body.recursos : [],
        criteriosEvaluacion: Array.isArray(req.body.criteriosEvaluacion) ? req.body.criteriosEvaluacion : [],
        secuenciaClases: rawSecuencia,
        archivosAdjuntos: Array.isArray(req.body.archivosAdjuntos) ? req.body.archivosAdjuntos : []
      });
      return res.status(201).json({
        success: true,
        plan: serializePlanificacion(created)
      });
    } catch (e) {
      console.warn('Error guardando planificación:', e);
    }
  }

  const nuevoPlan = serializePlanificacion({
    id: `plan-${Date.now()}`,
    docenteId,
    ...req.body,
    secuenciaClases: rawSecuencia,
    progreso: computedProgreso
  });
  planificacionesState.push(nuevoPlan);
  res.status(201).json({ success: true, plan: nuevoPlan });
});

app.put('/api/planificacion/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  await connectDB();
  if (isMongoConnected() && /^[0-9a-fA-F]{24}$/.test(id)) {
    try {
      const auth = await resolveDocenteParaleloFilter(req, true);
      const userPayload = auth?.userPayload || getUserFromToken(req);
      const docenteId = auth?.primaryDocenteId || userPayload?.id || 'docente-1';
      const ids = Array.from(new Set([docenteId, userPayload?.id].filter(Boolean)));

      const existing = await Planificacion.findOne({ _id: id, docenteId: { $in: ids } });
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Planificación no encontrada' });
      }

      const fields = [
        'paraleloId',
        'paralelo',
        'materia',
        'bloque',
        'titulo',
        'destreza',
        'semanas',
        'fechaInicio',
        'fechaFin',
        'diasImparticion',
        'estado',
        'progreso',
        'objetivos',
        'recursos',
        'criteriosEvaluacion',
        'archivosAdjuntos'
      ];
      fields.forEach((f) => {
        if (req.body[f] !== undefined) {
          (existing as any)[f] = req.body[f];
        }
      });

      if (Array.isArray(req.body.secuenciaClases)) {
        const sanitizedSec = req.body.secuenciaClases.map((s: any, idx: number) => ({
          semana: Number(s.semana) || idx + 1,
          tema: String(s.tema || '').trim(),
          contenido: String(s.contenido || '').trim(),
          actividad: String(s.actividad || s.actividadSugerida || '').trim(),
          actividadSugerida: String(s.actividadSugerida || s.actividad || '').trim(),
          completada: Boolean(s.completada)
        }));
        (existing as any).secuenciaClases = sanitizedSec;

        if (req.body.progreso === undefined) {
          const done = sanitizedSec.filter((s: any) => s.completada).length;
          (existing as any).progreso = sanitizedSec.length > 0 ? Math.round((done / sanitizedSec.length) * 100) : 0;
        }
      }

      await existing.save();
      return res.json({
        success: true,
        plan: serializePlanificacion(existing),
        message: 'Planificación guardada correctamente'
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message || 'Error al actualizar planificación' });
    }
  }
  return res.status(404).json({ success: false, error: 'Planificación no encontrada' });
});

app.delete('/api/planificacion/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  await connectDB();
  if (isMongoConnected() && /^[0-9a-fA-F]{24}$/.test(id)) {
    try {
      const auth = await resolveDocenteParaleloFilter(req, true);
      const userPayload = auth?.userPayload || getUserFromToken(req);
      const docenteId = auth?.primaryDocenteId || userPayload?.id || 'docente-1';
      const ids = Array.from(new Set([docenteId, userPayload?.id].filter(Boolean)));

      const deleted = await Planificacion.findOneAndDelete({ _id: id, docenteId: { $in: ids } });
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Planificación no encontrada' });
      }
      return res.json({ success: true, message: 'Planificación eliminada correctamente' });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message || 'Error al eliminar planificación' });
    }
  }
  return res.status(404).json({ success: false, error: 'Planificación no encontrada' });
});

app.get('/api/workspace', async (req: Request, res: Response) => {
  await connectDB();
  if (isMongoConnected()) {
    try {
      const userPayload = getUserFromToken(req);
      const docenteId = userPayload?.id || 'docente-1';
      const [tasks, docs, acts] = await Promise.all([
        KanbanTask.find({ docenteId }).sort({ createdAt: -1 }),
        Documento.find({ docenteId }).sort({ createdAt: -1 }),
        Actividad.find().sort({ createdAt: -1 })
      ]);
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
        })),
        plantillas: PLANTILLAS_MINEDUC,
        actividades: acts.length > 0 ? acts.map((a: any) => ({
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
        })) : actividadesState,
        documentos: docs.map((d: any) => ({
          id: d._id.toString(),
          nombre: d.nombre,
          categoria: d.categoria,
          descripcion: d.descripcion,
          tamano: d.tamano,
          tipo: d.tipo,
          fechaSubida: d.fechaSubida,
          url: d.url
        }))
      });
    } catch (e) {}
  }
  res.json({ success: true, kanbanTasks: [], plantillas: PLANTILLAS_MINEDUC, actividades: [], documentos: [] });
});

app.get('/api/workspace/documentos', async (req: Request, res: Response) => {
  await connectDB();
  if (isMongoConnected()) {
    try {
      const userPayload = getUserFromToken(req);
      const docenteId = userPayload?.id || 'docente-1';
      const docs = await Documento.find({ docenteId }).sort({ createdAt: -1 });
      return res.json({ success: true, documentos: docs });
    } catch (e) {}
  }
  res.json({ success: true, documentos: [] });
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

// ==========================================
// ADMIN ENDPOINTS (/api/admin/*)
// ==========================================

// Endpoint público one-time para crear el usuario Admin inicial
app.post('/api/admin/seed-admin', async (req: Request, res: Response) => {
  await connectDB();
  if (!isMongoConnected()) {
    return res.status(503).json({ success: false, error: 'MongoDB no conectado' });
  }
  try {
    const existingAdmin = await Usuario.findOne({ rol: 'Admin' });
    if (existingAdmin) {
      return res.status(403).json({
        success: false,
        error: 'El usuario administrador ya existe. Este endpoint se ha deshabilitado automáticamente.'
      });
    }

    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminNombre = process.env.ADMIN_NOMBRE || 'Administrador ASAP';

    if (!adminEmail || !adminPassword) {
      return res.status(400).json({
        success: false,
        error: 'Credenciales no configuradas: defina ADMIN_EMAIL y ADMIN_PASSWORD en las variables de entorno.'
      });
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminUser = await Usuario.findOneAndUpdate(
      { email: adminEmail },
      {
        nombre: adminNombre,
        email: adminEmail,
        password: hashedPassword,
        rol: 'Admin',
        institucion: 'Administración Central ASAP',
        materias: []
      },
      { upsert: true, new: true }
    );

    return res.status(201).json({
      success: true,
      message: 'Usuario administrador creado correctamente.',
      admin: {
        id: adminUser._id.toString(),
        nombre: adminUser.nombre,
        email: adminUser.email,
        rol: adminUser.rol,
        institucion: adminUser.institucion
      }
    });
  } catch (e: any) {
    recordAdminError(req, 500, e.message || 'Error en seed-admin');
    return res.status(500).json({ success: false, error: e.message });
  }
});

// Endpoint de migración one-time: normaliza todos los docenteId de Paralelo a string puro
app.post('/api/admin/fix-docente-ids', async (_req: Request, res: Response) => {
  await connectDB();
  if (!isMongoConnected()) return res.status(503).json({ error: 'MongoDB no conectado' });
  try {
    const paralelos = await Paralelo.find({});
    let fixed = 0;
    for (const p of paralelos) {
      const asString = p.docenteId?.toString();
      if (asString && p.docenteId !== asString) {
        await Paralelo.updateOne({ _id: p._id }, { $set: { docenteId: asString } });
        fixed++;
      }
    }
    return res.json({ success: true, fixed, total: paralelos.length, message: `${fixed} paralelos normalizados de ${paralelos.length} total` });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// Proteger todos los demás endpoints /api/admin/* con requireAdmin
app.use('/api/admin', requireAdmin);

app.get('/api/admin/usuarios', async (req: Request, res: Response) => {
  await connectDB();
  if (!isMongoConnected()) {
    return res.status(503).json({ success: false, error: 'MongoDB no conectado' });
  }
  try {
    const [usuariosDocs, paralelosDocs] = await Promise.all([
      Usuario.find({}).select('-password').sort({ createdAt: -1 }),
      Paralelo.find({})
    ]);

    const conteoPorDocente: Record<string, number> = {};
    for (const p of paralelosDocs) {
      const dId = p.docenteId?.toString();
      if (dId) {
        conteoPorDocente[dId] = (conteoPorDocente[dId] || 0) + 1;
      }
    }

    const usuarios = usuariosDocs.map((u: any) => {
      const uid = u._id.toString();
      return {
        id: uid,
        nombre: u.nombre,
        email: u.email,
        rol: u.rol,
        institucion: u.institucion,
        fechaRegistro: u.createdAt || null,
        numeroParalelos: conteoPorDocente[uid] || 0
      };
    });

    return res.json({ success: true, usuarios });
  } catch (e: any) {
    recordAdminError(req, 500, e.message || 'Error listando usuarios');
    return res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/admin/usuarios/:id', async (req: Request, res: Response) => {
  await connectDB();
  if (!isMongoConnected()) {
    return res.status(503).json({ success: false, error: 'MongoDB no conectado' });
  }
  try {
    const { id } = req.params;
    const usuario = await Usuario.findById(id).select('-password');
    if (!usuario) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const isObjectId = /^[a-f\d]{24}$/i.test(id);
    const paraleloQuery = isObjectId
      ? { $or: [{ docenteId: id }, { docenteId: new mongoose.Types.ObjectId(id) }] }
      : { docenteId: id };

    const paralelos = await Paralelo.find(paraleloQuery);
    const paraleloObjectIds = paralelos.map((p: any) => p._id);
    const paraleloIdStrings = paralelos.map((p: any) => p._id.toString());

    const isAndresLegacy = usuario.email?.toLowerCase().trim() === 'andres.morales@uefdemocracia.edu.ec';
    const kanbanFilter = isAndresLegacy
      ? { docenteId: { $in: [id, 'docente-1'] } }
      : { docenteId: id };

    const [alumnos, actividadesCount, planificacionesCount, documentosCount, kanbanCount] = await Promise.all([
      paraleloIdStrings.length > 0
        ? Alumno.find({ paraleloId: { $in: [...paraleloObjectIds, ...paraleloIdStrings] } })
        : Promise.resolve([]),
      paraleloIdStrings.length > 0
        ? Actividad.countDocuments({ paraleloId: { $in: paraleloIdStrings } })
        : Promise.resolve(0),
      Planificacion.countDocuments({ docenteId: id }),
      Documento.countDocuments({ docenteId: id }),
      KanbanTask.countDocuments(kanbanFilter)
    ]);

    const alumnosPorParalelo: Record<string, number> = {};
    for (const a of alumnos) {
      const pid = a.paraleloId?.toString();
      if (pid) alumnosPorParalelo[pid] = (alumnosPorParalelo[pid] || 0) + 1;
    }

    return res.json({
      success: true,
      usuario: {
        id: usuario._id.toString(),
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        institucion: usuario.institucion,
        materias: usuario.materias || [],
        telefono: usuario.telefono || '',
        fechaRegistro: (usuario as any).createdAt || null
      },
      paralelos: paralelos.map((p: any) => ({
        id: p._id.toString(),
        nombre: p.nombre,
        grado: p.grado,
        jornada: p.jornada,
        nivel: p.nivel,
        materias: p.materias || [],
        totalAlumnos: alumnosPorParalelo[p._id.toString()] || 0
      })),
      estadisticas: {
        totalParalelos: paralelos.length,
        totalAlumnos: alumnos.length,
        totalActividades: actividadesCount,
        totalPlanificaciones: planificacionesCount,
        totalDocumentos: documentosCount,
        totalKanbanTasks: kanbanCount
      }
    });
  } catch (e: any) {
    recordAdminError(req, 500, e.message || 'Error obteniendo detalle de usuario');
    return res.status(500).json({ success: false, error: e.message });
  }
});

app.delete('/api/admin/usuarios/:id', async (req: Request, res: Response) => {
  await connectDB();
  if (!isMongoConnected()) {
    return res.status(503).json({ success: false, error: 'MongoDB no conectado' });
  }
  try {
    const { id } = req.params;
    const userToDelete = await Usuario.findById(id);
    if (!userToDelete) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const isObjectId = /^[a-f\d]{24}$/i.test(id);
    const paraleloQuery = isObjectId
      ? { $or: [{ docenteId: id }, { docenteId: new mongoose.Types.ObjectId(id) }] }
      : { docenteId: id };

    const userParalelos = await Paralelo.find(paraleloQuery);
    const paraleloObjectIds = userParalelos.map((p: any) => p._id);
    const paraleloIdStrings = userParalelos.map((p: any) => p._id.toString());

    if (paraleloIdStrings.length > 0) {
      await Promise.all([
        Alumno.deleteMany({ paraleloId: { $in: [...paraleloObjectIds, ...paraleloIdStrings] } }),
        Asistencia.deleteMany({ paraleloId: { $in: paraleloIdStrings } }),
        Calificacion.deleteMany({ paraleloId: { $in: paraleloIdStrings } }),
        Actividad.deleteMany({ paraleloId: { $in: paraleloIdStrings } })
      ]);
    }

    const isAndresLegacy = userToDelete.email?.toLowerCase().trim() === 'andres.morales@uefdemocracia.edu.ec';
    const kanbanFilter = isAndresLegacy
      ? { docenteId: { $in: [id, 'docente-1'] } }
      : { docenteId: id };

    await Promise.all([
      Paralelo.deleteMany(paraleloQuery),
      Planificacion.deleteMany({ docenteId: id }),
      Documento.deleteMany({ docenteId: id }),
      KanbanTask.deleteMany(kanbanFilter),
      Sesion.updateMany({ userId: id }, { $set: { revocado: true } })
    ]);

    await Usuario.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: 'Usuario y todos sus datos asociados fueron eliminados en cascada.'
    });
  } catch (e: any) {
    recordAdminError(req, 500, e.message || 'Error eliminando usuario');
    return res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/admin/sistema', async (_req: Request, res: Response) => {
  await connectDB();
  const readyState = mongoose.connection.readyState;
  const readyStateMap: Record<number, string> = {
    0: 'Desconectado',
    1: 'Conectado',
    2: 'Conectando',
    3: 'Desconectando'
  };

  return res.json({
    success: true,
    mongo: {
      readyState,
      estado: readyStateMap[readyState] || 'Desconocido',
      conectado: readyState === 1
    },
    variablesEntorno: {
      MONGODB_URI: Boolean(process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('usuario:password')),
      JWT_SECRET: Boolean(process.env.JWT_SECRET),
      GEMINI_API_KEY: Boolean(process.env.GEMINI_API_KEY),
      ADMIN_EMAIL: Boolean(process.env.ADMIN_EMAIL),
      ADMIN_PASSWORD: Boolean(process.env.ADMIN_PASSWORD),
      NODE_ENV: Boolean(process.env.NODE_ENV)
    },
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/admin/logs', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    logs: adminLogs.slice(0, 100)
  });
});

app.get('/api/admin/sesiones', async (req: Request, res: Response) => {
  await connectDB();
  if (isMongoConnected()) {
    try {
      const sesionesDocs = await Sesion.find({
        revocado: false,
        expiresAt: { $gt: new Date() }
      }).sort({ createdAt: -1 });

      return res.json({
        success: true,
        sesiones: sesionesDocs.map((s: any) => ({
          tokenId: s.tokenId,
          userId: s.userId,
          email: s.email,
          createdAt: s.createdAt,
          expiresAt: s.expiresAt,
          revocado: s.revocado
        }))
      });
    } catch (e: any) {
      recordAdminError(req, 500, e.message || 'Error consultando sesiones');
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  return res.json({ success: true, sesiones: [] });
});

app.delete('/api/admin/sesiones/:tokenId', async (req: Request, res: Response) => {
  const { tokenId } = req.params;

  await connectDB();
  if (isMongoConnected()) {
    try {
      await Sesion.updateOne({ tokenId }, { $set: { revocado: true } });
    } catch (e: any) {
      recordAdminError(req, 500, e.message || 'Error revocando sesión');
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  return res.json({
    success: true,
    message: 'Sesión revocada correctamente'
  });
});

// Middleware global de captura de errores para alimentar adminLogs[]
app.use((err: any, req: Request, res: Response, _next: express.NextFunction) => {
  adminLogs.unshift({
    id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    method: req.method,
    route: req.originalUrl || req.url,
    message: err?.message || 'Error interno del servidor',
    statusCode: err?.status || err?.statusCode || 500
  });
  if (adminLogs.length > 100) {
    adminLogs.length = 100;
  }
  if (!res.headersSent) {
    res.status(err?.status || err?.statusCode || 500).json({
      success: false,
      error: err?.message || 'Error interno del servidor'
    });
  }
});

export default app;