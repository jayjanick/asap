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
// DATABASE (MongoDB & Mongoose Models)
// ==========================================
let isConnected = false;

export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('usuario:password')) {
    isConnected = false;
    return false;
  }
  try {
    if (mongoose.connection.readyState >= 1) {
      isConnected = true;
      return true;
    }
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    isConnected = true;
    return true;
  } catch (error) {
    isConnected = false;
    return false;
  }
}

export function isMongoConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
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
    docenteId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    materias: [{ type: String }],
    nivel: { type: String, default: 'Educación Básica Superior' },
    especialidad: { type: String },
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

// Seed database function
export async function seedDatabase(force = false) {
  const connected = await connectDB();
  if (!connected) return;
  try {
    const existingUser = await Usuario.findOne({ email: 'andres.morales@uefdemocracia.edu.ec' });
    if (existingUser && !force) return;

    const hashedPassword = await bcrypt.hash('asap2024', 10);
    const docente = await Usuario.findOneAndUpdate(
      { email: 'andres.morales@uefdemocracia.edu.ec' },
      {
        nombre: 'Lic. Andrés Morales',
        email: 'andres.morales@uefdemocracia.edu.ec',
        password: hashedPassword,
        rol: 'Docente',
        materias: ['Lengua y Literatura'],
        institucion: 'U.E. Fisco-Misional Democracia',
        telefono: '+593 98 765 4321',
        avatar: 'https://picsum.photos/seed/docente_andres/150/150'
      },
      { upsert: true, new: true }
    );

    for (const p of PARALELOS_INICIALES) {
      const paraleloDoc = await Paralelo.findOneAndUpdate(
        { nombre: p.nombre },
        {
          nombre: p.nombre,
          grado: p.grado,
          nivel: p.nivel,
          jornada: p.jornada,
          materia: p.materia,
          horario: p.horario,
          aula: p.aula,
          docenteId: docente._id.toString()
        },
        { upsert: true, new: true }
      );

      for (const est of p.estudiantes) {
        await Alumno.findOneAndUpdate(
          { cedula: est.cedula },
          {
            nombre: est.nombre,
            cedula: est.cedula,
            numeroLista: est.numeroLista,
            paraleloId: paraleloDoc._id.toString(),
            activo: est.activo,
            telefonoRepresentante: est.telefonoRepresentante || '+593 99 123 4567',
            faltasJustificadas: est.faltasJustificadas || 0,
            faltasInjustificadas: est.faltasInjustificadas || 0,
            atrasos: est.atrasos || 0
          },
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

ensureDbConnected().catch(() => {});

// In-memory states
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

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Correo y contraseña son requeridos' });
    }
    const cleanEmail = email.toLowerCase().trim();
    if (!isMongoConnected()) {
      await connectDB();
    }
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
    if (!isMongoConnected()) await connectDB();
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
          docenteId: createdUser._id,
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
  const actividadesPendientes = actividadesState.filter((a: any) => a.estado === 'Por calificar').length;
  const paralelosNombres = paralelosState.map((p: any) => p.nombre);
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
      claseActual: { paralelo: '8vo EGB "A"', materia: 'Lengua y Literatura', aula: 'Bloque B · Aula 204', horario: '07:15 a 08:45', tema: 'Ensayo argumentativo' }
    },
    estadisticas: { totalEstudiantes: 60, actividadesPorCalificar: actividadesPendientes, clasesPlanificadasSemana: 14, asistenciaPromedioMes: 94.8, informesGenerados: 3 },
    porHacerInteligente: smartTodo,
    ultimasActividades: [{ id: '1', accion: 'Asistencia registrada', detalle: '8vo EGB "A"', tiempo: 'Hace 45 min' }]
  });
});

app.get('/api/paralelos', async (req: Request, res: Response) => {
  if (isMongoConnected()) {
    try {
      const userPayload = getUserFromToken(req);
      const docenteId = userPayload?.id;
      const paralelos = await Paralelo.find(docenteId ? { docenteId } : {});
      if (paralelos && paralelos.length > 0) {
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
      }
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
  if (isMongoConnected()) {
    try {
      const userPayload = getUserFromToken(req);
      const paralelos = await Paralelo.find(userPayload?.id ? { docenteId: userPayload.id } : {});
      if (paralelos && paralelos.length > 0) {
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
      }
    } catch (e) {}
  }
  res.json({ success: true, paralelos: paralelosState });
});

app.get('/api/asistencia/:cursoId', (req: Request, res: Response) => {
  const paralelo = paralelosState.find((p: any) => p.id === req.params.cursoId) || paralelosState[0];
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
  res.json({ success: true, paralelo, fecha: new Date().toISOString().slice(0, 10), asistenciaHoy });
});

app.post('/api/asistencia/:cursoId', async (req: Request, res: Response) => {
  const index = paralelosState.findIndex((p: any) => p.id === req.params.cursoId);
  if (index !== -1) paralelosState[index].asistenciaHoyRegistrada = true;
  res.json({ success: true, message: 'Asistencia guardada' });
});

app.get('/api/calificaciones', async (req: Request, res: Response) => {
  if (isMongoConnected()) {
    try {
      const userPayload = getUserFromToken(req);
      const paralelos = await Paralelo.find(userPayload?.id ? { docenteId: userPayload.id } : {});
      if (paralelos && paralelos.length > 0) {
        return res.json({
          success: true,
          paralelos: paralelos.map((p: any) => ({ id: p._id.toString(), nombre: p.nombre, grado: p.grado, materia: p.materia || 'General' }))
        });
      }
    } catch (e) {}
  }
  res.json({ success: true, paralelos: paralelosState });
});

app.get('/api/calificaciones/:cursoId', async (req: Request, res: Response) => {
  const { cursoId } = req.params;
  if (isMongoConnected()) {
    try {
      let mongoParalelo = cursoId.match(/^[0-9a-fA-F]{24}$/) ? await Paralelo.findById(cursoId) : await Paralelo.findOne({ nombre: cursoId });
      if (mongoParalelo) {
        const alumnos = await Alumno.find({ paraleloId: mongoParalelo._id.toString() });
        const paraleloObj = {
          id: mongoParalelo._id.toString(),
          nombre: mongoParalelo.nombre,
          grado: mongoParalelo.grado,
          materia: mongoParalelo.materia || 'General',
          estudiantes: alumnos.map((a: any, idx: number) => ({ id: a._id.toString(), nombre: a.nombre, numeroLista: a.numeroLista || idx + 1, cedula: a.cedula }))
        };
        const actividades = actividadesState.filter((a: any) => a.paraleloId === paraleloObj.id || a.paraleloId === 'par-8vo-a');
        const matrix = calificacionesMatrix[paraleloObj.id] || calificacionesMatrix['par-8vo-a'] || {};
        const libroNotas = paraleloObj.estudiantes.map((est: any) => {
          const notasAlumno = matrix[est.id] || {};
          const vals = Object.values(notasAlumno) as number[];
          const prom = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 7.5;
          return { estudianteId: est.id, nombre: est.nombre, numeroLista: est.numeroLista, cedula: est.cedula, notas: notasAlumno, promedio: Number(prom.toFixed(2)) };
        });
        return res.json({
          success: true,
          paralelo: paraleloObj,
          actividades,
          libroNotas,
          estadisticas: { promedioGeneral: 8.2, porcentajeAprobados: 90, totalEstudiantes: libroNotas.length, enRiesgo: [] }
        });
      }
    } catch (e) {}
  }

  const paralelo = paralelosState.find((p: any) => p.id === cursoId) || paralelosState[0];
  const actividades = actividadesState.filter((a: any) => a.paraleloId === paralelo.id);
  const matrix = calificacionesMatrix[paralelo.id] || {};
  const libroNotas = paralelo.estudiantes.map((est: any) => {
    const notasAlumno = matrix[est.id] || {};
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

app.put('/api/calificaciones/celda', (req: Request, res: Response) => {
  const { paraleloId, estudianteId, actividadId, nota } = req.body;
  const parsedNota = Math.max(0, Math.min(10, Number(nota) || 0));
  if (!calificacionesMatrix[paraleloId]) calificacionesMatrix[paraleloId] = {};
  if (!calificacionesMatrix[paraleloId][estudianteId]) calificacionesMatrix[paraleloId][estudianteId] = {};
  calificacionesMatrix[paraleloId][estudianteId][actividadId] = Number(parsedNota.toFixed(2));
  res.json({ success: true, nota: parsedNota });
});

app.post('/api/calificaciones/actividad', (req: Request, res: Response) => {
  const { paraleloId, titulo, tipo, fechaEntrega, ponderacion } = req.body;
  const nuevaActividad = {
    id: `act-${Date.now()}`,
    paraleloId,
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

app.get('/api/workspace/kanban', (_req: Request, res: Response) => {
  res.json({ success: true, kanbanTasks });
});

app.post('/api/workspace/kanban', (req: Request, res: Response) => {
  const nuevaTarea = { id: `kb-${Date.now()}`, fecha: new Date().toISOString().slice(0, 10), adjuntos: [], ...req.body };
  kanbanTasks.unshift(nuevaTarea);
  res.status(201).json({ success: true, tarea: nuevaTarea });
});

app.put('/api/workspace/kanban/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = kanbanTasks.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'No encontrada' });
  kanbanTasks[idx] = { ...kanbanTasks[idx], ...req.body };
  res.json({ success: true, tarea: kanbanTasks[idx] });
});

app.delete('/api/workspace/kanban/:id', (req: Request, res: Response) => {
  kanbanTasks = kanbanTasks.filter(t => t.id !== req.params.id);
  res.json({ success: true });
});

app.get('/api/workspace/documentos', async (_req: Request, res: Response) => {
  if (isMongoConnected()) {
    try {
      const docs = await Documento.find().sort({ createdAt: -1 });
      if (docs && docs.length > 0) return res.json({ success: true, documentos: docs });
    } catch (e) {}
  }
  res.json({ success: true, documentos: documentosState });
});

app.post('/api/workspace/documentos', async (req: Request, res: Response) => {
  const nuevoDoc = { id: `doc-${Date.now()}`, fechaSubida: new Date().toLocaleDateString('es-EC'), ...req.body };
  documentosState.unshift(nuevoDoc);
  if (isMongoConnected()) {
    try { await Documento.create(nuevoDoc); } catch (e) {}
  }
  res.status(201).json({ success: true, documento: nuevoDoc });
});

app.delete('/api/workspace/documentos/:id', async (req: Request, res: Response) => {
  documentosState = documentosState.filter(d => d.id !== req.params.id);
  if (isMongoConnected()) {
    try { await Documento.findByIdAndDelete(req.params.id); } catch (e) {}
  }
  res.json({ success: true });
});

export default app;
