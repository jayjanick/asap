// api/index.ts
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { GoogleGenAI } from "@google/genai";
import mongoose, { Schema } from "mongoose";
import dotenv from "dotenv";
dotenv.config();
var NOMBRES_ESTUDIANTES_8VO = [
  "Alvarado Mendoza Juan Diego",
  "Andrade Su\xE1rez Valentina Sof\xEDa",
  "Barahona Zambrano Carlos Andr\xE9s",
  "Campoverde Silva Dom\xE9nica Isabella",
  "Castillo Loor Mateo Sebasti\xE1n",
  "Cede\xF1o Mac\xEDas Camila Nicole",
  "Ch\xE1vez Moreira Lucas Gabriel",
  "Cordero Ben\xEDtez Emilia Renatta",
  "Delgado Holgu\xEDn Kevin Josu\xE9",
  "Espinoza V\xE9liz Ana Paula",
  "Flores Pincay Mat\xEDas Alejandro",
  "Garc\xEDa Intriago Melany Michelle",
  "Guerrero C\xE1rdenas Dylan Alexander",
  "Hidalgo Paredes Romina Victoria",
  "Jaramillo Bravo Isaac Fernando",
  "Lara Montalvo Fiorella Daniela",
  "Mendoza Villacreses Thiago Manuel",
  "Molina Villamar Danna Paola",
  "Navarrete V\xE9lez Ian Roberto",
  "Ochoa Rosero Paula Cristina",
  "Pacheco Sol\xF3rzano Joaqu\xEDn David",
  "Quijije Vera Scarlett Estefan\xEDa",
  "Rivadeneira Palma Leonardo Jos\xE9",
  "S\xE1nchez Guadamud Andrea Bel\xE9n",
  "Torres Cevallos Axel Adri\xE1n",
  "V\xE1squez Moran Maite Alejandra",
  "Vera Coello Maximiliano Xavier",
  "Villavicencio Castro Mia Antonella",
  "Zambrano Bail\xF3n Bruno Daniel",
  "Zurita \xC1lava Allison Dayana"
];
var NOMBRES_ESTUDIANTES_9NO = [
  "Aguilar Ponce David Eduardo",
  "Bail\xF3n Castro Erika Noem\xED",
  "Caicedo Mina Bryan Josu\xE9",
  "Carre\xF1o Barrezueta Jennifer Paola",
  "Duque Sol\xEDs Samuel Enrique",
  "Escobar Rend\xF3n Daniela Carolina",
  "Farf\xE1n Quinde Gabriel Ignacio",
  "G\xF3mez Pe\xF1afiel Stephany Jazm\xEDn",
  "Herrera Vallejo Justin Anthony",
  "Izquierdo Tello Valeria Montserrat",
  "Le\xF3n Alarc\xF3n Fernando Josu\xE9",
  "Mac\xEDas Palacios Nayeli Briggette",
  "Narv\xE1ez Guzm\xE1n Emilio Rafael",
  "Ordo\xF1ez Villac\xEDs Karla Daniela",
  "Pazmi\xF1o Ca\xF1arte Christian Xavier",
  "Pico Mendieta Ashley Milena",
  "Reyes Arreaga Joshua Emanuel",
  "Salazar Cobe\xF1a Angie Lisseth",
  "Tandazo Vite Erick Paul",
  "Ubilla Carriel Melanie Solange",
  "Valarezo Cobos Christopher Jair",
  "V\xE9liz Giler Arianna Nicole",
  "Yagual Chele Alexis Jonathan",
  "Zavala Intriago Britany Anah\xED",
  "Arias Santana Kevin Daniel",
  "Benalc\xE1zar Orellana G\xE9nesis Abigail",
  "Cevallos Saltos Jorge Luis",
  "D\xEDaz Barzola Dayanna Nicole",
  "Franco Ronquillo Jonathan Ariel",
  "Lucas Mendoza Melissa Katherine"
];
function crearEstudiantes(nombres, paraleloId) {
  return nombres.map((nombre, index) => {
    const cedula = `09${Math.floor(1e7 + Math.random() * 9e7)}`;
    const faltasInjust = index === 3 || index === 17 ? 2 : index === 8 ? 1 : 0;
    const faltasJust = index === 4 || index === 21 ? 1 : 0;
    const atrasos = index % 5 === 0 ? 1 : 0;
    const porcentaje = Math.max(78, 100 - (faltasInjust * 5 + faltasJust * 2 + atrasos * 1.5));
    let promedio = Number((7.2 + Math.sin(index) * 2.1).toFixed(2));
    if (index === 4) promedio = 6.45;
    if (index === 12) promedio = 5.8;
    if (index === 19) promedio = 6.7;
    if (promedio > 10) promedio = 9.85;
    if (promedio < 4.5) promedio = 5.2;
    return {
      id: `${paraleloId}-est-${index + 1}`,
      nombre,
      cedula,
      numeroLista: index + 1,
      activo: true,
      telefonoRepresentante: `+593 99 ${Math.floor(1e6 + Math.random() * 9e6)}`,
      asistenciaMes: Math.round(porcentaje),
      faltasJustificadas: faltasJust,
      faltasInjustificadas: faltasInjust,
      atrasos,
      promedioGeneral: promedio,
      observaciones: index === 4 ? ["Requiere refuerzo en ortograf\xEDa acentual."] : []
    };
  });
}
var DOCENTE_ACTUAL = {
  id: "usr-andres-morales",
  nombre: "Andr\xE9s Morales",
  titulo: "Lic. Andr\xE9s Morales R.",
  email: "andres.morales@educacion.gob.ec",
  rol: "Docente",
  institucion: "Colegio Fiscal Vicente Rocafuerte",
  distrito: "Distrito 09D03 \u2014 Guayaquil",
  provincia: "Guayas",
  canton: "Guayaquil",
  materias: ["Lengua y Literatura"],
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  totalAlumnos: 60,
  asistenciaPromedioGeneral: 94.2
};
var PARALELOS_INICIALES = [
  {
    id: "par-8vo-a",
    nombre: '8vo EGB "A"',
    grado: 8,
    nivel: "B\xE1sica Superior",
    jornada: "Matutina",
    materia: "Lengua y Literatura",
    totalEstudiantes: 30,
    asistenciaHoyRegistrada: true,
    porcentajeAsistenciaMes: 95.4,
    horario: "Lunes, Mi\xE9rcoles y Viernes \u2014 07:15 a 08:45",
    aula: "Bloque B \xB7 Aula 204",
    estudiantes: crearEstudiantes(NOMBRES_ESTUDIANTES_8VO, "8vo-a")
  },
  {
    id: "par-9no-b",
    nombre: '9no EGB "B"',
    grado: 9,
    nivel: "B\xE1sica Superior",
    jornada: "Matutina",
    materia: "Lengua y Literatura",
    totalEstudiantes: 30,
    asistenciaHoyRegistrada: false,
    porcentajeAsistenciaMes: 93.1,
    horario: "Martes y Jueves \u2014 07:15 a 09:30",
    aula: "Bloque C \xB7 Aula 102",
    estudiantes: crearEstudiantes(NOMBRES_ESTUDIANTES_9NO, "9no-b")
  }
];
var ACTIVIDADES_INICIALES = [
  {
    id: "act-1",
    paraleloId: "par-8vo-a",
    titulo: "Taller 1: Estructura del ensayo argumentativo",
    tipo: "Individual",
    fechaEntrega: "2026-10-20",
    ponderacion: 10,
    entregadosCount: 30,
    totalCount: 30,
    estado: "Calificado",
    bloque: 2,
    descripcion: "Identificar tesis, conectores adversativos y p\xE1rrafos de conclusi\xF3n en textos seleccionados."
  },
  {
    id: "act-2",
    paraleloId: "par-8vo-a",
    titulo: "Deber 2: Redacci\xF3n de micro-cr\xF3nica barrial",
    tipo: "Individual",
    fechaEntrega: "2026-10-24",
    ponderacion: 10,
    entregadosCount: 26,
    totalCount: 30,
    estado: "Por calificar",
    bloque: 2,
    descripcion: "Elaborar un texto testimonial de 300 palabras sobre una tradici\xF3n comunitaria."
  },
  {
    id: "act-3",
    paraleloId: "par-8vo-a",
    titulo: "Evaluaci\xF3n Parcial: Comprensi\xF3n cr\xEDtica y oratoria",
    tipo: "Evaluacion",
    fechaEntrega: "2026-10-28",
    ponderacion: 10,
    entregadosCount: 0,
    totalCount: 30,
    estado: "En curso",
    bloque: 2,
    descripcion: "Exposici\xF3n oral de 2 minutos sobre una tem\xE1tica de impacto ambiental en Guayaquil."
  },
  {
    id: "act-4",
    paraleloId: "par-9no-b",
    titulo: "Taller de Figuras Literarias y M\xE9trica",
    tipo: "Grupal",
    fechaEntrega: "2026-10-22",
    ponderacion: 10,
    entregadosCount: 30,
    totalCount: 30,
    estado: "Calificado",
    bloque: 2,
    descripcion: "An\xE1lisis estr\xF3fico y detecci\xF3n de met\xE1foras en poetas ecuatorianos de la Generaci\xF3n Decapitada."
  },
  {
    id: "act-5",
    paraleloId: "par-9no-b",
    titulo: "Ensayo Cr\xEDtico: Literatura e Identidad Andina",
    tipo: "Individual",
    fechaEntrega: "2026-10-26",
    ponderacion: 10,
    entregadosCount: 24,
    totalCount: 30,
    estado: "Por calificar",
    bloque: 2,
    descripcion: "Redacci\xF3n formal siguiendo la gu\xEDa de normas APA b\xE1sica provista por el docente."
  }
];
var PLANIFICACIONES_MINEDUC = [
  {
    id: "plan-bloque-1",
    materia: "Lengua y Literatura",
    bloque: 1,
    titulo: "Bloque 1: Lengua y Cultura \u2014 Origen y evoluci\xF3n de la palabra escrita",
    destreza: "LL.4.1.1. Indagar y explicar los aportes de la cultura escrita al desarrollo hist\xF3rico, social y cultural de la humanidad.",
    semanas: 6,
    progreso: 100,
    estado: "Completado",
    generadaIA: false,
    objetivos: [
      "Reconocer las ventajas y beneficios que la cultura escrita ha aportado en diferentes momentos hist\xF3ricos.",
      "Valorar la diversidad cultural expresada en textos orales y escritos del Ecuador."
    ],
    recursos: ["Texto de Lengua 8vo MINEDUC", "Biblioteca digital", "Mapas conceptuales"],
    secuenciaClases: [
      { semana: 1, tema: "De la oralidad a la pictograf\xEDa", contenido: "Pinturas rupestres y primeros s\xEDmbolos cuneiformes.", actividad: "Taller de creaci\xF3n de c\xF3dice personal." },
      { semana: 2, tema: "Alfabetos de la antig\xFCedad", contenido: "El legado fenicio y griego en el castellano actual.", actividad: "L\xEDnea de tiempo colaborativa en cartulina." }
    ]
  },
  {
    id: "plan-bloque-2",
    materia: "Lengua y Literatura",
    bloque: 2,
    titulo: "Bloque 2: Comunicaci\xF3n Oral y Escrita \u2014 El debate y el ensayo",
    destreza: "LL.4.2.1. Utilizar recursos de la comunicaci\xF3n oral en contextos de intercambio social, construcci\xF3n de acuerdos y resoluci\xF3n de problemas.",
    semanas: 6,
    progreso: 70,
    estado: "En curso",
    generadaIA: true,
    objetivos: [
      "Construir acuerdos mediante el uso pertinente de argumentos y contraargumentos.",
      "Organizar el discurso oral y escrito aplicando conectores l\xF3gicos de causa y consecuencia."
    ],
    recursos: ["Gu\xEDa did\xE1ctica MINEDUC 2023", "Fichas de debate", "Proyector multimedia"],
    secuenciaClases: [
      { semana: 1, tema: "Estructura de la argumentaci\xF3n", contenido: "Tesis, premisas v\xE1lidas y falacias comunes.", actividad: "Identificaci\xF3n de falacias en columnas de opini\xF3n." },
      { semana: 2, tema: "Mesa redonda en el aula", contenido: "Roles de moderador, expositor y p\xFAblico.", actividad: "Simulaci\xF3n de debate sobre uso responsable de redes sociales." },
      { semana: 3, tema: "Conectores textuales", contenido: "Conectores adversativos, distributivos y conclusivos.", actividad: "Gu\xEDa de ejercicios de redacci\xF3n en pares." }
    ]
  },
  {
    id: "plan-bloque-3",
    materia: "Lengua y Literatura",
    bloque: 3,
    titulo: "Bloque 3: Lectura Cr\xEDtica y Textos Period\xEDsticos",
    destreza: "LL.4.3.2. Construir significados impl\xEDcitos al inferir el tema, el punto de vista del autor y las motivaciones de los personajes.",
    semanas: 6,
    progreso: 15,
    estado: "Por iniciar",
    generadaIA: true,
    objetivos: [
      "Comparar y valorar textos period\xEDsticos de diferentes fuentes y corrientes editoriales.",
      "Autorregular la comprensi\xF3n lectora mediante el uso de esquemas de s\xEDntesis."
    ],
    recursos: ["Peri\xF3dicos locales y nacionales", "Diccionario de la RAE", "Fichas de lectura r\xE1pida"],
    secuenciaClases: [
      { semana: 1, tema: "G\xE9neros period\xEDsticos: Noticia vs Cr\xF3nica", contenido: "Caracter\xEDsticas de inmediatez y profundidad.", actividad: "An\xE1lisis de un titular de prensa nacional." }
    ]
  }
];
var PLANTILLAS_MINEDUC = [
  {
    id: "plt-pud",
    titulo: "Planificaci\xF3n de Unidad Did\xE1ctica (PUD)",
    codigo: "MINEDUC-SNC-2023-PUD",
    formato: "MINEDUC 2023",
    descripcion: "Formato est\xE1ndar oficial con datos informativos, objetivos de unidad, relaci\xF3n destreza con criterio de desempe\xF1o, actividades evaluativas y adaptaciones curriculares.",
    categoria: "Planificaciones",
    campos: ["Instituci\xF3n", "Docente", "\xC1rea", "Asignatura", "Grado", "Paralelo", "N\xFAmero de Unidad", "T\xEDtulo"]
  },
  {
    id: "plt-asistencia",
    titulo: "Registro de Asistencia y Atrasos Mensual",
    codigo: "MINEDUC-REG-ASIST-01",
    formato: "Imprimible / Inspecci\xF3n",
    descripcion: "Planilla mensual con matriz de 31 d\xEDas, desglose de faltas justificadas e injustificadas con casillero para firma de Inspecci\xF3n General.",
    categoria: "Asistencia",
    campos: ["Mes", "Paralelo", "Total D\xEDas Laborados", "Porcentaje Global"]
  },
  {
    id: "plt-acta-padres",
    titulo: "Acta de Reuni\xF3n de Padres de Familia / Representantes",
    codigo: "MINEDUC-ACTA-RP-2026",
    formato: "Legal Institucional",
    descripcion: "Estructura formal con orden del d\xEDa, registro de asistencia de representantes, resoluciones acordadas y firmas de respaldo.",
    categoria: "Institucional",
    campos: ["Fecha", "Lugar", "Orden del d\xEDa", "Resoluciones", "Compromisos"]
  },
  {
    id: "plt-refuerzo",
    titulo: "Plan de Refuerzo Acad\xE9mico Individual (PRAI)",
    codigo: "MINEDUC-PRAI-RGLOEI",
    formato: "Pedag\xF3gico Art. 208 RGLOEI",
    descripcion: "Documento obligatorio para estudiantes con calificaci\xF3n inferior a 7 puntos. Detalla destrezas no alcanzadas, cronograma de tutor\xEDas y compromisos del representante.",
    categoria: "Planificaciones",
    campos: ["Estudiante", "Causa pedag\xF3gica", "Estrategia de tutor\xEDa", "Fecha de reevaluaci\xF3n"]
  },
  {
    id: "plt-circular",
    titulo: "Circular Informativa a Representantes Legales",
    codigo: "CIRC-VICERREC-04",
    formato: "Comunicaci\xF3n",
    descripcion: "Plantilla de comunicaci\xF3n oficial con membrete del plantel para citaciones y avisos de eventos curriculares.",
    categoria: "Institucional",
    campos: ["Asunto", "Fecha", "Contenido", "Firma y Sello"]
  }
];
var cached = null;
async function connectDB() {
  if (cached && mongoose.connection.readyState === 1) return true;
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes("usuario:password")) return false;
  try {
    cached = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5e3, bufferCommands: false });
    return true;
  } catch (e) {
    cached = null;
    return false;
  }
}
function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}
async function ensureDbConnected() {
  return connectDB();
}
var UsuarioSchema = new Schema(
  {
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    rol: { type: String, enum: ["Docente", "Director", "Coordinador"], default: "Docente" },
    materias: [{ type: String }],
    institucion: { type: String, required: true },
    telefono: { type: String },
    avatar: { type: String }
  },
  { timestamps: true }
);
var Usuario = mongoose.models.Usuario || mongoose.model("Usuario", UsuarioSchema);
var ParaleloSchema = new Schema(
  {
    nombre: { type: String, required: true },
    grado: { type: Number, required: true },
    jornada: { type: String, enum: ["Matutina", "Vespertina", "Nocturna"], default: "Matutina" },
    docenteId: { type: String, required: true },
    materias: [{ type: String }],
    nivel: { type: String, default: "Educaci\xF3n B\xE1sica Superior" },
    especialidad: { type: String },
    asistenciaHoyRegistrada: { type: Boolean, default: false }
  },
  { timestamps: true }
);
var Paralelo = mongoose.models.Paralelo || mongoose.model("Paralelo", ParaleloSchema);
var AlumnoSchema = new Schema(
  {
    nombre: { type: String, required: true },
    cedula: { type: String, required: false },
    paraleloId: { type: Schema.Types.ObjectId, ref: "Paralelo", required: true },
    activo: { type: Boolean, default: true },
    contactoRepresentante: { type: String },
    telefonoRepresentante: { type: String },
    observaciones: [{ type: String }]
  },
  { timestamps: true }
);
var Alumno = mongoose.models.Alumno || mongoose.model("Alumno", AlumnoSchema);
var DocumentoSchema = new Schema(
  {
    nombre: { type: String, required: true },
    categoria: {
      type: String,
      enum: ["Personal", "Planificaci\xF3n", "Estudiante", "Plantilla", "Institucional"],
      default: "Personal"
    },
    descripcion: { type: String, default: "" },
    tamano: { type: String, default: "150 KB" },
    fechaSubida: { type: String, default: () => (/* @__PURE__ */ new Date()).toLocaleDateString("es-EC") },
    tipo: { type: String, default: "PDF" },
    contenidoBase64: { type: String },
    url: { type: String },
    docenteId: { type: String, default: "docente-1" }
  },
  { timestamps: true }
);
var Documento = mongoose.models.Documento || mongoose.model("Documento", DocumentoSchema);
var AsistenciaSchema = new Schema(
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
var Asistencia = mongoose.models.Asistencia || mongoose.model("Asistencia", AsistenciaSchema);
var CalificacionSchema = new Schema(
  {
    paraleloId: { type: String, required: true },
    estudianteId: { type: String, required: true },
    actividadId: { type: String, required: true },
    nota: { type: Number, required: true }
  },
  { timestamps: true }
);
var Calificacion = mongoose.models.Calificacion || mongoose.model("Calificacion", CalificacionSchema);
var ActividadSchema = new Schema(
  {
    paraleloId: { type: String, required: true },
    titulo: { type: String, required: true },
    tipo: { type: String, default: "Individual" },
    fechaEntrega: { type: String },
    ponderacion: { type: Number, default: 10 },
    entregadosCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 30 },
    estado: { type: String, default: "Por calificar" },
    bloque: { type: Number, default: 2 },
    descripcion: { type: String }
  },
  { timestamps: true }
);
var Actividad = mongoose.models.Actividad || mongoose.model("Actividad", ActividadSchema);
var KanbanTaskSchema = new Schema(
  {
    titulo: { type: String, required: true },
    descripcion: { type: String },
    paralelo: { type: String },
    columna: { type: String, default: "Por hacer" },
    prioridad: { type: String, default: "Media" },
    urgencia: { type: String, default: "Media" },
    fecha: { type: String },
    fechaLimite: { type: String },
    observaciones: { type: String },
    adjuntos: [{ type: String }],
    docenteId: { type: String, default: "docente-1" }
  },
  { timestamps: true }
);
var KanbanTask = mongoose.models.KanbanTask || mongoose.model("KanbanTask", KanbanTaskSchema);
var PlanificacionSchema = new Schema(
  {
    docenteId: { type: String, default: "docente-1" },
    paraleloId: { type: String },
    materia: { type: String, required: true },
    bloque: { type: Number, default: 2 },
    titulo: { type: String, required: true },
    destreza: { type: String, default: "" },
    semanas: { type: Number, default: 4 },
    progreso: { type: Number, default: 0 },
    estado: { type: String, default: "Por iniciar" },
    generadaIA: { type: Boolean, default: false },
    objetivos: [{ type: String }],
    recursos: [{ type: String }],
    criteriosEvaluacion: [{ type: String }],
    secuenciaClases: [{
      semana: Number,
      tema: String,
      contenido: String,
      actividad: String,
      actividadSugerida: String
    }]
  },
  { timestamps: true }
);
var Planificacion = mongoose.models.Planificacion || mongoose.model("Planificacion", PlanificacionSchema);
async function seedDatabase(force = false) {
  const connected = await connectDB();
  if (!connected) return;
  try {
    const existingUser = await Usuario.findOne({ email: "andres.morales@uefdemocracia.edu.ec" });
    if (existingUser && !force) return;
    const hashedPassword = await bcrypt.hash("asap2024", 10);
    const docenteData = {
      nombre: "Lic. Andr\xE9s Morales",
      email: "andres.morales@uefdemocracia.edu.ec",
      password: hashedPassword,
      rol: "Docente",
      materias: ["Lengua y Literatura"],
      institucion: "U.E. Fisco-Misional Democracia",
      telefono: "+593 98 765 4321",
      avatar: "https://picsum.photos/seed/docente_andres/150/150"
    };
    const docente = await Usuario.findOneAndUpdate(
      { email: "andres.morales@uefdemocracia.edu.ec" },
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
          telefonoRepresentante: est.telefonoRepresentante || "+593 99 123 4567",
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
    console.error("Error in seedDatabase:", err);
  }
}
var getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } }
  });
};
async function generarPlanificacionCurricular(params) {
  const ai = getAiClient();
  const prompt = `Act\xFAa como especialista pedag\xF3gico del Ministerio de Educaci\xF3n del Ecuador (MINEDUC).
Genera una planificaci\xF3n microcurricular para la materia "${params.materia}", nivel "${params.nivel}", bloque ${params.bloque}.
Destreza con criterio de desempe\xF1o (DCD): "${params.destreza}".
Duraci\xF3n: ${params.semanas} semanas.
Responde \xDANICAMENTE en JSON v\xE1lido con la siguiente estructura exacta:
{
  "tituloUnidad": "T\xEDtulo pedag\xF3gico de la unidad",
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
          model: "gemini-1.5-flash",
          contents: prompt,
          config: { responseMimeType: "application/json", temperature: 0.3 }
        });
        const text = response?.text?.trim() || "";
        const parsed = JSON.parse(text);
        return { ...parsed, generadaIA: true };
      } catch (err) {
        if (err?.status === 503 && attempts === 0) {
          await new Promise((r) => setTimeout(r, 2e3));
          attempts++;
        } else {
          break;
        }
      }
    }
  }
  return {
    tituloUnidad: `Unidad ${params.bloque}: Aplicaci\xF3n de ${params.destreza.slice(0, 45)}...`,
    objetivos: [`Desarrollar habilidades comunicativas y de an\xE1lisis cr\xEDtico aplicadas a ${params.materia}.`],
    criteriosEvaluacion: [`CE.LL.${params.bloque}.1 Aplica estrategias cognitivas`],
    secuenciaClases: [{ semana: 1, tema: `Exploraci\xF3n de ${params.destreza}`, contenido: "ERCA", actividadSugerida: "Taller", recursos: ["Texto"] }],
    actividadesEvaluacion: ["R\xFAbrica"],
    adaptacionesCurriculares: "Flexibilidad curricular",
    generadaIA: false
  };
}
async function generarActividad(params) {
  const ai = getAiClient();
  const prompt = `Crea una actividad did\xE1ctica de tipo "${params.tipoActividad}" para la materia "${params.materia}" (Nivel: ${params.nivel}). Destreza: "${params.destreza}". Responde en JSON.`;
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json", temperature: 0.4 }
      });
      const parsed = JSON.parse(response?.text?.trim() || "{}");
      return { ...parsed, generadaIA: true };
    } catch (e) {
    }
  }
  return {
    titulo: `Taller Pr\xE1ctico: ${params.materia}`,
    descripcion: `Actividad ${params.tipoActividad}`,
    instrucciones: "1. Leer gu\xEDa\n2. Desarrollar",
    tiempoEstimadoMinutos: 40,
    criteriosEvaluacion: ["Comprensi\xF3n (5 pts)", "Participaci\xF3n (5 pts)"],
    recursosNecesarios: ["Cuaderno"],
    generadaIA: false
  };
}
async function analizarRendimientoGrupo(params) {
  const ai = getAiClient();
  if (ai) {
    try {
      const prompt = `Analiza el estado acad\xE9mico del paralelo "${params.paraleloNombre}" en "${params.materia}" (promedio ${params.promedioGeneral}). Responde en JSON con diagnosticoBreve, puntosAlerta, estrategiasRefuerzo, recomendacionDirectivo.`;
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json", temperature: 0.3 }
      });
      return JSON.parse(response?.text?.trim() || "{}");
    } catch (e) {
    }
  }
  return {
    diagnosticoBreve: `El paralelo ${params.paraleloNombre} tiene promedio de ${params.promedioGeneral.toFixed(1)}/10.`,
    puntosAlerta: [`${params.estudiantesEnRiesgo.length} estudiantes en riesgo`],
    estrategiasRefuerzo: ["Tutor\xEDas personalizadas"],
    recomendacionDirectivo: "Formalizar plan de refuerzo."
  };
}
async function generarInformeInstitucional(params) {
  const ai = getAiClient();
  if (ai) {
    try {
      const prompt = `Redacta un informe oficial MINEDUC para ${params.paraleloNombre}. Responde en JSON con codigoDocumento, titulo, antecedentes, desarrollo, conclusiones, recomendaciones.`;
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json", temperature: 0.3 }
      });
      return JSON.parse(response?.text?.trim() || "{}");
    } catch (e) {
    }
  }
  return {
    codigoDocumento: `INF-2026-01`,
    titulo: "INFORME DE RENDIMIENTO ACAD\xC9MICO",
    antecedentes: `Informe conforme a lineamientos MINEDUC para ${params.institucion}.`,
    desarrollo: `Asignatura ${params.materia}, promedio ${params.promedio}.`,
    conclusiones: ["Estudiantes cumplieron los objetivos b\xE1sicos."],
    recomendaciones: ["Continuar refuerzo acad\xE9mico."]
  };
}
async function sugerirTareasTodo(params) {
  const tareas = [];
  if (params.asistenciaPendienteHoy) {
    tareas.push({ id: "t-1", titulo: "Tomar asistencia de hoy", urgencia: "alta", modulo: "Asistencia", link: "/asistencia" });
  }
  if (params.actividadesSinCalificar > 0) {
    tareas.push({ id: "t-2", titulo: `Calificar ${params.actividadesSinCalificar} entregas pendientes`, urgencia: "alta", modulo: "Calificaciones", link: "/calificaciones" });
  }
  tareas.push({ id: "t-3", titulo: "Generar reporte consolidado", urgencia: "baja", modulo: "Workspace", link: "/workspace" });
  return tareas;
}
var JWT_SECRET = process.env.JWT_SECRET || "asap-super-secret-key-2026";
var app = express();
var ALLOWED_ORIGINS = [
  "https://jayjanick.github.io",
  "http://localhost:3000",
  "http://localhost:5173",
  "https://asap-steel.vercel.app"
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".run.app") || origin.endsWith(".google.com") || origin.endsWith(".github.io") || origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
connectDB().catch(() => {
});
var paralelosState = JSON.parse(JSON.stringify(PARALELOS_INICIALES));
var actividadesState = JSON.parse(JSON.stringify(ACTIVIDADES_INICIALES));
var planificacionesState = JSON.parse(JSON.stringify(PLANIFICACIONES_MINEDUC));
var kanbanTasks = [
  {
    id: "kb-1",
    titulo: "Revisar borradores de cr\xF3nica barrial",
    descripcion: "Evaluar coherencia en p\xE1rrafos descriptivos y uso de conectores temporales.",
    paralelo: "8vo A",
    columna: "En progreso",
    prioridad: "Alta",
    urgencia: "Alta",
    fecha: "2026-10-24",
    fechaLimite: "2026-10-28",
    observaciones: "Coordinar con la comisi\xF3n pedag\xF3gica la r\xFAbrica formativa.",
    adjuntos: []
  },
  {
    id: "kb-2",
    titulo: "Subir calificaciones Parcial 1 al sistema",
    descripcion: "Cierre del primer parcial con notas de deberes y lecci\xF3n escrita.",
    paralelo: "9no B",
    columna: "Por hacer",
    prioridad: "Alta",
    urgencia: "Alta",
    fecha: "2026-10-25",
    fechaLimite: "2026-10-26",
    observaciones: "Verificar estudiantes con justificativo m\xE9dico antes de cerrar el acta.",
    adjuntos: []
  },
  {
    id: "kb-3",
    titulo: "Convocatoria a reuni\xF3n de representantes",
    descripcion: "Socializaci\xF3n del rendimiento y compromisos de refuerzo.",
    paralelo: "8vo A",
    columna: "Completado",
    prioridad: "Media",
    urgencia: "Media",
    fecha: "2026-10-21",
    fechaLimite: "2026-10-22",
    observaciones: "Asistencia del 88% de padres de familia.",
    adjuntos: []
  }
];
var documentosState = [
  {
    id: "doc-1",
    nombre: "Plan_Curricular_Anual_Lengua_8vo.pdf",
    categoria: "Planificaci\xF3n",
    descripcion: "PCA oficial aprobado por vicerrectorado periodo 2026-2027",
    tamano: "380 KB",
    tipo: "PDF",
    fechaSubida: "12/03/2026",
    contenidoBase64: "JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwgL0xlbmd0aCA1OSAvRmlsdGVyIC9GbGF0ZURlY29kZSA+PgpzdHJlYW0KeJwrSExPT1HIzFPSUUpMzs8tLslPzlDISSxJLQIyQzJSgYKVkmlqSgEAg3kNEwo=endstream"
  }
];
var calificacionesMatrix = {};
function initCalificaciones() {
  paralelosState.forEach((p) => {
    calificacionesMatrix[p.id] = {};
    const acts = actividadesState.filter((a) => a.paraleloId === p.id);
    p.estudiantes.forEach((est) => {
      calificacionesMatrix[p.id][est.id] = {};
      acts.forEach((act, idx) => {
        const seed = (est.numeroLista * 7 + idx * 13) % 10;
        let nota = 7 + seed / 10 * 2.8;
        if (est.numeroLista === 5 || est.numeroLista === 13) nota = 5.5 + seed % 3 * 0.4;
        calificacionesMatrix[p.id][est.id][act.id] = Number(nota.toFixed(2));
      });
    });
  });
}
initCalificaciones();
function getUserFromToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "asap",
    time: (/* @__PURE__ */ new Date()).toISOString(),
    environment: process.env.NODE_ENV || "development",
    mongoConnected: isMongoConnected(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
  });
});
app.get("/api/debug", (_req, res) => {
  res.json({
    status: "ok",
    mongo: isMongoConnected(),
    mongoState: mongoose.connection.readyState,
    env: process.env.NODE_ENV || "development",
    hasMongoUri: Boolean(process.env.MONGODB_URI && !process.env.MONGODB_URI.includes("usuario:password")),
    hasJwtSecret: Boolean(process.env.JWT_SECRET),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    time: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Correo y contrase\xF1a son requeridos" });
    }
    const cleanEmail = email.toLowerCase().trim();
    await connectDB();
    if (isMongoConnected()) {
      const dbUser = await Usuario.findOne({ email: cleanEmail });
      if (!dbUser) {
        return res.status(404).json({ success: false, error: "Usuario no encontrado" });
      }
      let isValid = false;
      if (dbUser.password && dbUser.password.startsWith("$2")) {
        isValid = await bcrypt.compare(password, dbUser.password);
      } else if (dbUser.password) {
        isValid = password === dbUser.password;
        if (isValid) {
          dbUser.password = await bcrypt.hash(password, 10);
          await dbUser.save();
        }
      }
      if (!isValid) {
        return res.status(401).json({ success: false, error: "Contrase\xF1a incorrecta" });
      }
      const user = {
        id: dbUser._id.toString(),
        nombre: dbUser.nombre,
        email: dbUser.email,
        rol: dbUser.rol,
        institucion: dbUser.institucion,
        materias: dbUser.materias || [],
        avatar: dbUser.avatar || DOCENTE_ACTUAL.avatar,
        distrito: "Distrito 09D04 \xB7 Guayaquil Centro",
        provincia: "Guayas",
        canton: "Guayaquil",
        totalAlumnos: 60,
        asistenciaPromedioGeneral: 94.8
      };
      const token = jwt.sign(
        { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol, institucion: user.institucion },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      return res.json({ success: true, token, user, message: "Sesi\xF3n iniciada correctamente" });
    }
    if (cleanEmail === "andres.morales@uefdemocracia.edu.ec") {
      if (password !== "asap2024") {
        return res.status(401).json({ success: false, error: "Contrase\xF1a incorrecta" });
      }
      const token = jwt.sign(
        { id: "docente-1", email: DOCENTE_ACTUAL.email, nombre: DOCENTE_ACTUAL.nombre, rol: DOCENTE_ACTUAL.rol, institucion: DOCENTE_ACTUAL.institucion },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      return res.json({ success: true, token, user: DOCENTE_ACTUAL, message: "Sesi\xF3n iniciada correctamente" });
    }
    return res.status(404).json({ success: false, error: "Usuario no encontrado" });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Error interno en el servidor" });
  }
});
app.post("/api/auth/google", async (req, res) => {
  const { email, nombre, avatar } = req.body;
  const targetEmail = (email || "andres.morales@uefdemocracia.edu.ec").toLowerCase().trim();
  let dbUser = null;
  await connectDB();
  if (isMongoConnected()) {
    try {
      dbUser = await Usuario.findOne({ email: targetEmail });
    } catch (e) {
    }
  }
  const user = {
    id: dbUser ? dbUser._id.toString() : "docente-1",
    nombre: dbUser?.nombre || nombre || "Lic. Andr\xE9s Morales",
    email: dbUser?.email || targetEmail,
    rol: dbUser?.rol || "Docente",
    institucion: dbUser?.institucion || "U.E. Fisco-Misional Democracia",
    materias: dbUser?.materias || ["Lengua y Literatura"],
    avatar: avatar || dbUser?.avatar || DOCENTE_ACTUAL.avatar
  };
  const token = jwt.sign({ id: user.id, email: user.email, nombre: user.nombre, rol: user.rol, institucion: user.institucion }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ success: true, token, user, message: "Sesi\xF3n iniciada con Google" });
});
app.get("/api/auth/me", async (req, res) => {
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
              distrito: "Distrito 09D04 \xB7 Guayaquil Centro",
              provincia: "Guayas",
              canton: "Guayaquil",
              totalAlumnos: 60,
              asistenciaPromedioGeneral: 94.8
            }
          });
        }
      } catch (e) {
      }
    }
    return res.json({
      success: true,
      user: {
        id: userPayload.id,
        email: userPayload.email,
        nombre: userPayload.nombre,
        rol: userPayload.rol,
        institucion: userPayload.institucion,
        materias: userPayload.materias || ["Lengua y Literatura"],
        avatar: DOCENTE_ACTUAL.avatar
      }
    });
  }
  res.status(401).json({ success: false, error: "No autenticado" });
});
app.post("/api/auth/register", async (req, res) => {
  try {
    const { nombre, email, password, rol, institucion, cursos, estudiantesPorCurso } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ success: false, error: "Nombre, correo y contrase\xF1a requeridos." });
    }
    const cleanEmail = email.toLowerCase().trim();
    await connectDB();
    if (!isMongoConnected()) {
      return res.status(503).json({ success: false, error: "MongoDB no conectado." });
    }
    const existing = await Usuario.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ success: false, error: "Ya existe una cuenta con este correo." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdUser = await Usuario.create({
      nombre: nombre.trim(),
      email: cleanEmail,
      password: hashedPassword,
      rol: rol || "Docente",
      institucion: institucion || "Unidad Educativa",
      materias: (cursos || []).map((c) => c.materia).filter(Boolean)
    });
    const createdParalelos = [];
    if (Array.isArray(cursos)) {
      for (const curso of cursos) {
        const paraleloNombre = `${curso.grado || "Curso"} "${curso.paralelo || "A"}" - ${curso.materia || "General"}`;
        const ests = estudiantesPorCurso && estudiantesPorCurso[curso.id] || [];
        const mongoParalelo = await Paralelo.create({
          nombre: paraleloNombre,
          grado: parseInt(curso.grado) || 8,
          jornada: "Matutina",
          docenteId: createdUser._id.toString(),
          materias: [curso.materia || "General"]
        });
        if (Array.isArray(ests) && ests.length > 0) {
          await Alumno.insertMany(ests.map((e) => ({ nombre: e.nombre, cedula: e.cedula || "", paraleloId: mongoParalelo._id, activo: true })));
        }
        createdParalelos.push({ id: mongoParalelo._id.toString(), nombre: paraleloNombre });
      }
    }
    const token = jwt.sign({ id: createdUser._id.toString(), email: cleanEmail, nombre: createdUser.nombre, rol: createdUser.rol, institucion: createdUser.institucion }, JWT_SECRET, { expiresIn: "7d" });
    return res.status(201).json({ success: true, token, user: { id: createdUser._id.toString(), nombre: createdUser.nombre, email: cleanEmail, rol: createdUser.rol, institucion: createdUser.institucion, avatar: DOCENTE_ACTUAL.avatar }, cursosRegistrados: createdParalelos });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || "Error en registro" });
  }
});
app.get("/api/dashboard", async (req, res) => {
  let actividadesPendientes = 0;
  await connectDB();
  if (isMongoConnected()) {
    try {
      const userPayload = getUserFromToken(req);
      const docenteId = userPayload?.id;
      let docenteObj = { ...DOCENTE_ACTUAL };
      let totalEstudiantes = 0;
      let paralelosNombres = [];
      let claseActual = null;
      let misParalelos = [];
      let asistenciaMes = 95;
      if (docenteId) {
        const docenteIdStr = String(docenteId);
        const isObjectId = /^[a-f\d]{24}$/i.test(docenteIdStr);
        const query = isObjectId ? { $or: [{ docenteId: docenteIdStr }, { docenteId: new mongoose.Types.ObjectId(docenteIdStr) }] } : { docenteId: docenteIdStr };
        misParalelos = await Paralelo.find(query);
        paralelosNombres = misParalelos.map((p) => p.nombre);
        const dbUser = await Usuario.findById(docenteId) || await Usuario.findOne({ email: userPayload?.email });
        if (dbUser) {
          docenteObj = {
            id: dbUser._id.toString(),
            nombre: dbUser.nombre,
            email: dbUser.email,
            rol: dbUser.rol,
            institucion: dbUser.institucion,
            materias: dbUser.materias || ["Lengua y Literatura"],
            avatar: dbUser.avatar || DOCENTE_ACTUAL.avatar,
            distrito: "Distrito 09D04 \xB7 Guayaquil Centro",
            provincia: "Guayas",
            canton: "Guayaquil",
            totalAlumnos: 0,
            asistenciaPromedioGeneral: 100
          };
        }
        const paraleloIds = misParalelos.map((p) => p._id.toString());
        if (paraleloIds.length > 0) {
          totalEstudiantes = await Alumno.countDocuments({ paraleloId: { $in: paraleloIds } });
          actividadesPendientes = await Actividad.countDocuments({
            paraleloId: { $in: paraleloIds },
            estado: "Por calificar"
          });
          const asistencias = await Asistencia.find({ paraleloId: { $in: paraleloIds } });
          if (asistencias.length > 0) {
            let totalRegs = 0;
            let presentes = 0;
            asistencias.forEach((a) => {
              (a.registros || []).forEach((r) => {
                totalRegs++;
                if (r.estado === "P" || r.justificada) presentes++;
              });
            });
            if (totalRegs > 0) {
              asistenciaMes = Number((presentes / totalRegs * 100).toFixed(1));
            }
          }
          const primerParalelo = misParalelos[0];
          claseActual = {
            paralelo: primerParalelo.nombre,
            materia: primerParalelo.materia || primerParalelo.materias?.[0] || "General",
            aula: "Bloque B \xB7 Aula 204",
            horario: "07:15 a 08:45",
            tema: "Ensayo argumentativo"
          };
        }
      }
      if (misParalelos.length === 0) {
        totalEstudiantes = 60;
        paralelosNombres = ['8vo EGB "A"', '9no EGB "B"'];
        actividadesPendientes = await Actividad.countDocuments({ estado: "Por calificar" }).catch(() => 5);
        claseActual = {
          paralelo: '8vo EGB "A"',
          materia: "Lengua y Literatura",
          aula: "Bloque B \xB7 Aula 204",
          horario: "07:15 a 08:45",
          tema: "Ensayo argumentativo"
        };
      }
      docenteObj.totalAlumnos = totalEstudiantes;
      docenteObj.asistenciaPromedioGeneral = asistenciaMes;
      const smartTodo2 = await sugerirTareasTodo({
        actividadesSinCalificar: actividadesPendientes,
        planificacionesPorIniciar: 1,
        asistenciaPendienteHoy: true,
        paralelosNombres: paralelosNombres.length > 0 ? paralelosNombres : ['8vo EGB "A"']
      });
      return res.json({
        success: true,
        docente: docenteObj,
        resumenHoy: {
          fecha: (/* @__PURE__ */ new Date()).toLocaleDateString("es-EC", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
          jornada: "Matutina (07:15 - 12:45)",
          claseActual
        },
        estadisticas: {
          totalEstudiantes,
          actividadesPorCalificar: actividadesPendientes,
          clasesPlanificadasSemana: Math.max(misParalelos.length * 4, 14),
          asistenciaPromedioMes: asistenciaMes,
          informesGenerados: 3
        },
        porHacerInteligente: smartTodo2,
        ultimasActividades: [{ id: "1", accion: "Asistencia registrada", detalle: paralelosNombres[0] || '8vo EGB "A"', tiempo: "Hace 45 min" }]
      });
    } catch (e) {
      console.warn("Error calculando dashboard desde MongoDB:", e);
    }
  }
  actividadesPendientes = actividadesState.filter((a) => a.estado === "Por calificar").length;
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
      fecha: (/* @__PURE__ */ new Date()).toLocaleDateString("es-EC", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
      jornada: "Matutina (07:15 - 12:45)",
      claseActual: { paralelo: '8vo EGB "A"', materia: "Lengua y Literatura", aula: "Bloque B \xB7 Aula 204", horario: "07:15 a 08:45", tema: "Ensayo argumentativo" }
    },
    estadisticas: { totalEstudiantes: 60, actividadesPorCalificar: actividadesPendientes, clasesPlanificadasSemana: 14, asistenciaPromedioMes: 94.8, informesGenerados: 3 },
    porHacerInteligente: smartTodo,
    ultimasActividades: [{ id: "1", accion: "Asistencia registrada", detalle: '8vo EGB "A"', tiempo: "Hace 45 min" }]
  });
});
app.get("/api/paralelos", async (req, res) => {
  await connectDB();
  if (isMongoConnected()) {
    try {
      const userPayload = getUserFromToken(req);
      const docenteId = userPayload?.id;
      if (!docenteId) return res.json({ success: true, paralelos: [] });
      const docenteIdStr = String(docenteId);
      const isObjectId = /^[a-f\d]{24}$/i.test(docenteIdStr);
      const query = isObjectId ? { $or: [{ docenteId: docenteIdStr }, { docenteId: new mongoose.Types.ObjectId(docenteIdStr) }] } : { docenteId: docenteIdStr };
      const paralelos = await Paralelo.find(query);
      return res.json({
        success: true,
        paralelos: paralelos.map((p) => ({
          id: p._id.toString(),
          nombre: p.nombre,
          grado: p.grado,
          nivel: p.nivel || "Educaci\xF3n B\xE1sica Superior",
          jornada: p.jornada || "Matutina",
          materia: p.materia || "General",
          horario: "07:15 - 08:45",
          aula: "Aula 101",
          totalEstudiantes: 30,
          asistenciaHoyRegistrada: Boolean(p.asistenciaHoyRegistrada),
          porcentajeAsistenciaMes: 100
        }))
      });
    } catch (e) {
    }
  }
  res.json({
    success: true,
    paralelos: paralelosState.map((p) => ({
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
app.get("/api/asistencia", async (req, res) => {
  await connectDB();
  if (isMongoConnected()) {
    try {
      const userPayload = getUserFromToken(req);
      const docenteId = userPayload?.id;
      if (!docenteId) return res.json({ success: true, paralelos: [] });
      const docenteIdStr = String(docenteId);
      const isObjectId = /^[a-f\d]{24}$/i.test(docenteIdStr);
      const query = isObjectId ? { $or: [{ docenteId: docenteIdStr }, { docenteId: new mongoose.Types.ObjectId(docenteIdStr) }] } : { docenteId: docenteIdStr };
      const paralelos = await Paralelo.find(query);
      return res.json({
        success: true,
        paralelos: paralelos.map((p) => ({
          id: p._id.toString(),
          nombre: p.nombre,
          grado: p.grado,
          jornada: p.jornada || "Matutina",
          materia: p.materia || "General",
          totalEstudiantes: 30,
          asistenciaHoyRegistrada: Boolean(p.asistenciaHoyRegistrada),
          porcentajeAsistenciaMes: 100
        }))
      });
    } catch (e) {
    }
  }
  res.json({ success: true, paralelos: paralelosState });
});
app.get("/api/asistencia/:cursoId", async (req, res) => {
  const { cursoId } = req.params;
  const fechaHoy = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
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
          jornada: paraleloDoc.jornada || "Matutina",
          materia: paraleloDoc.materia || "General"
        };
        const asistenciaHoy2 = alumnos.map((est, idx) => {
          const reg = asistenciaDoc?.registros?.find((r) => r.estudianteId === est._id.toString());
          return {
            estudianteId: est._id.toString(),
            nombre: est.nombre,
            numeroLista: est.numeroLista || idx + 1,
            cedula: est.cedula || "",
            estado: reg?.estado || (idx === 4 ? "F" : idx === 12 ? "A" : "P"),
            justificada: reg ? reg.justificada : idx === 4,
            motivo: reg?.motivo || (idx === 4 ? "Cita m\xE9dica" : ""),
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
          asistenciaHoy: asistenciaHoy2
        });
      }
    } catch (err) {
      console.warn("Error leyendo asistencia de MongoDB:", err);
    }
  }
  const paralelo = paralelosState.find((p) => p.id === cursoId) || paralelosState[0];
  if (!paralelo) return res.status(404).json({ success: false, error: "Paralelo no encontrado" });
  const asistenciaHoy = paralelo.estudiantes.map((est) => ({
    estudianteId: est.id,
    nombre: est.nombre,
    numeroLista: est.numeroLista,
    cedula: est.cedula,
    estado: "P",
    justificada: false,
    motivo: "",
    faltasJustificadas: est.faltasJustificadas || 0,
    faltasInjustificadas: est.faltasInjustificadas || 0,
    atrasos: est.atrasos || 0,
    porcentajeFaltas: 0
  }));
  res.json({ success: true, paralelo, fecha: fechaHoy, asistenciaHoy });
});
app.post("/api/asistencia/:cursoId", async (req, res) => {
  const { cursoId } = req.params;
  const { registros } = req.body;
  const fechaHoy = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  await connectDB();
  if (isMongoConnected()) {
    try {
      await Asistencia.findOneAndUpdate(
        { paraleloId: cursoId, fecha: fechaHoy },
        { paraleloId: cursoId, fecha: fechaHoy, registros: registros || [] },
        { upsert: true, new: true }
      );
      await Paralelo.findByIdAndUpdate(cursoId, { asistenciaHoyRegistrada: true }).catch(() => {
      });
      return res.json({ success: true, message: "Asistencia guardada en MongoDB", paraleloId: cursoId, fecha: fechaHoy });
    } catch (err) {
      console.warn("Error guardando asistencia en MongoDB:", err);
    }
  }
  const index = paralelosState.findIndex((p) => p.id === cursoId);
  if (index !== -1) paralelosState[index].asistenciaHoyRegistrada = true;
  res.json({ success: true, message: "Asistencia guardada en memoria", paraleloId: cursoId, fecha: fechaHoy });
});
app.get("/api/calificaciones/:cursoId", async (req, res) => {
  const { cursoId } = req.params;
  await connectDB();
  if (isMongoConnected()) {
    try {
      let mongoParalelo = cursoId.match(/^[0-9a-fA-F]{24}$/) ? await Paralelo.findById(cursoId) : await Paralelo.findOne({ nombre: cursoId });
      if (!mongoParalelo) mongoParalelo = await Paralelo.findOne();
      if (mongoParalelo) {
        const paraleloIdStr = mongoParalelo._id.toString();
        const alumnos = await Alumno.find({ paraleloId: paraleloIdStr });
        const actividadesMongo = await Actividad.find({ paraleloId: { $in: [paraleloIdStr, cursoId, "par-8vo-a"] } });
        const calificacionesMongo = await Calificacion.find({ paraleloId: { $in: [paraleloIdStr, cursoId, "par-8vo-a"] } });
        const actividades2 = actividadesMongo.length > 0 ? actividadesMongo.map((a) => ({
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
        })) : actividadesState.filter((a) => a.paraleloId === "par-8vo-a");
        const libroNotas2 = alumnos.map((est) => {
          const estId = est._id.toString();
          const notasAlumno = {};
          actividades2.forEach((act) => {
            const found = calificacionesMongo.find((c) => c.estudianteId === estId && c.actividadId === act.id);
            if (found) {
              notasAlumno[act.id] = found.nota;
            } else {
              const seed = est.numeroLista * 7 % 10;
              notasAlumno[act.id] = Number((7 + seed / 10 * 2.8).toFixed(2));
            }
          });
          const vals = Object.values(notasAlumno);
          const prom = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 7.5;
          return {
            estudianteId: estId,
            nombre: est.nombre,
            numeroLista: est.numeroLista || 1,
            cedula: est.cedula || "",
            notas: notasAlumno,
            promedio: Number(prom.toFixed(2))
          };
        });
        const promediosTodos = libroNotas2.map((n) => n.promedio);
        const promedioGeneral = promediosTodos.length > 0 ? Number((promediosTodos.reduce((a, b) => a + b, 0) / promediosTodos.length).toFixed(2)) : 8.1;
        const aprobados = promediosTodos.filter((p) => p >= 7).length;
        const porcentajeAprobados = promediosTodos.length > 0 ? aprobados / promediosTodos.length * 100 : 90;
        return res.json({
          success: true,
          paralelo: { id: paraleloIdStr, nombre: mongoParalelo.nombre, grado: mongoParalelo.grado, materia: mongoParalelo.materia || "General" },
          actividades: actividades2,
          libroNotas: libroNotas2,
          estadisticas: { promedioGeneral, porcentajeAprobados, totalEstudiantes: libroNotas2.length, enRiesgo: libroNotas2.filter((n) => n.promedio < 7) }
        });
      }
    } catch (err) {
      console.warn("Error leyendo calificaciones de MongoDB:", err);
    }
  }
  const paralelo = paralelosState.find((p) => p.id === cursoId) || paralelosState[0];
  const actividades = actividadesState.filter((a) => a.paraleloId === paralelo.id);
  const matrix = calificacionesMatrix[paralelo.id] || {};
  const libroNotas = paralelo.estudiantes.map((est) => {
    const notasAlumno = matrix[est.id] || {};
    const vals = Object.values(notasAlumno);
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
app.put("/api/calificaciones/celda", async (req, res) => {
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
      return res.json({ success: true, nota: finalNota, message: "Nota guardada en MongoDB" });
    } catch (err) {
      console.warn("Error guardando calificaci\xF3n en MongoDB:", err);
    }
  }
  if (!calificacionesMatrix[paraleloId]) calificacionesMatrix[paraleloId] = {};
  if (!calificacionesMatrix[paraleloId][estudianteId]) calificacionesMatrix[paraleloId][estudianteId] = {};
  calificacionesMatrix[paraleloId][estudianteId][actividadId] = finalNota;
  res.json({ success: true, nota: finalNota, message: "Nota guardada en memoria" });
});
app.post("/api/calificaciones/actividad", async (req, res) => {
  const { paraleloId, titulo, tipo, fechaEntrega, ponderacion, descripcion } = req.body;
  await connectDB();
  if (isMongoConnected()) {
    try {
      const nuevaAct = await Actividad.create({
        paraleloId: paraleloId || "par-8vo-a",
        titulo: titulo || "Nueva Actividad",
        tipo: tipo || "Individual",
        fechaEntrega: fechaEntrega || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
        ponderacion: Number(ponderacion) || 10,
        entregadosCount: 0,
        totalCount: 30,
        estado: "Por calificar",
        bloque: 2,
        descripcion: descripcion || ""
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
      console.warn("Error creando actividad en MongoDB:", err);
    }
  }
  const nuevaActividad = {
    id: `act-${Date.now()}`,
    paraleloId: paraleloId || "par-8vo-a",
    titulo: titulo || "Nueva Actividad",
    tipo: tipo || "Individual",
    fechaEntrega: fechaEntrega || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    ponderacion: Number(ponderacion) || 10,
    entregadosCount: 0,
    totalCount: 30,
    estado: "Por calificar",
    bloque: 2
  };
  actividadesState.push(nuevaActividad);
  res.status(201).json({ success: true, actividad: nuevaActividad });
});
app.get("/api/workspace/kanban", async (req, res) => {
  await connectDB();
  if (isMongoConnected()) {
    try {
      const userPayload = getUserFromToken(req);
      const docenteId = userPayload?.id || "docente-1";
      const tasks = await KanbanTask.find({ docenteId }).sort({ createdAt: -1 });
      if (tasks && tasks.length > 0) {
        return res.json({
          success: true,
          kanbanTasks: tasks.map((t) => ({
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
      console.warn("Error leyendo Kanban de MongoDB:", err);
    }
  }
  res.json({ success: true, kanbanTasks });
});
app.post("/api/workspace/kanban", async (req, res) => {
  const { titulo, descripcion, paralelo, columna, prioridad, urgencia, fechaLimite, observaciones } = req.body;
  const fechaHoy = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  await connectDB();
  if (isMongoConnected()) {
    try {
      const userPayload = getUserFromToken(req);
      const docenteId = userPayload?.id || "docente-1";
      const newTask = await KanbanTask.create({
        titulo: titulo || "Nueva Tarea",
        descripcion: descripcion || "",
        paralelo: paralelo || "General",
        columna: columna || "Por hacer",
        prioridad: prioridad || "Media",
        urgencia: urgencia || "Media",
        fecha: fechaHoy,
        fechaLimite: fechaLimite || "",
        observaciones: observaciones || "",
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
      console.warn("Error creando tarea Kanban en MongoDB:", err);
    }
  }
  const nuevaTarea = {
    id: `kb-${Date.now()}`,
    titulo: titulo || "Nueva Tarea",
    descripcion: descripcion || "",
    paralelo: paralelo || "General",
    columna: columna || "Por hacer",
    prioridad: prioridad || "Media",
    urgencia: urgencia || "Media",
    fecha: fechaHoy,
    fechaLimite: fechaLimite || "",
    observaciones: observaciones || "",
    adjuntos: []
  };
  kanbanTasks.unshift(nuevaTarea);
  res.status(201).json({ success: true, tarea: nuevaTarea });
});
app.put("/api/workspace/kanban/:id", async (req, res) => {
  const { id } = req.params;
  await connectDB();
  if (isMongoConnected() && id.match(/^[0-9a-fA-F]{24}$/)) {
    try {
      const userPayload = getUserFromToken(req);
      const docenteId = userPayload?.id || "docente-1";
      const updated = await KanbanTask.findOneAndUpdate(
        { _id: id, docenteId },
        req.body,
        { new: true }
      );
      if (!updated) return res.status(404).json({ success: false, error: "Tarea no encontrada" });
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
      console.warn("Error actualizando tarea Kanban en MongoDB:", err);
    }
  }
  const idx = kanbanTasks.findIndex((t) => t.id === id);
  if (idx === -1) return res.status(404).json({ success: false, error: "No encontrada" });
  kanbanTasks[idx] = { ...kanbanTasks[idx], ...req.body };
  res.json({ success: true, tarea: kanbanTasks[idx] });
});
app.delete("/api/workspace/kanban/:id", async (req, res) => {
  const { id } = req.params;
  await connectDB();
  if (isMongoConnected() && id.match(/^[0-9a-fA-F]{24}$/)) {
    try {
      const userPayload = getUserFromToken(req);
      const docenteId = userPayload?.id || "docente-1";
      const deleted = await KanbanTask.findOneAndDelete({ _id: id, docenteId });
      if (!deleted) return res.status(404).json({ success: false, error: "Tarea no encontrada" });
      return res.json({ success: true, message: "Eliminada de MongoDB" });
    } catch (err) {
    }
  }
  kanbanTasks = kanbanTasks.filter((t) => t.id !== id);
  res.json({ success: true, message: "Eliminada de memoria" });
});
app.post("/api/ai/analisis-rendimiento", async (req, res) => {
  const { paraleloId } = req.body;
  const paralelo = paralelosState.find((p) => p.id === paraleloId) || paralelosState[0];
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
app.post("/api/ai/informe", async (req, res) => {
  const { paraleloNombre, periodo } = req.body;
  const informe = await generarInformeInstitucional({
    docenteNombre: DOCENTE_ACTUAL.nombre,
    institucion: DOCENTE_ACTUAL.institucion,
    paraleloNombre: paraleloNombre || '8vo EGB "A"',
    materia: "Lengua y Literatura",
    periodo: periodo || "Primer Quimestre",
    promedio: 8.2,
    porcentajeAsistencia: 94.6
  });
  res.json({ success: true, informe });
});
app.get("/api/planificacion", async (req, res) => {
  await connectDB();
  if (isMongoConnected()) {
    try {
      const userPayload = getUserFromToken(req);
      const docenteId = userPayload?.id || "docente-1";
      const plans = await Planificacion.find({ docenteId }).sort({ createdAt: -1 });
      if (plans && plans.length > 0) {
        return res.json({
          success: true,
          planificaciones: plans.map((p) => ({
            id: p._id.toString(),
            docenteId: p.docenteId,
            paraleloId: p.paraleloId,
            materia: p.materia,
            bloque: p.bloque,
            titulo: p.titulo,
            destreza: p.destreza,
            semanas: p.semanas,
            progreso: p.progreso,
            estado: p.estado,
            generadaIA: p.generadaIA,
            objetivos: p.objetivos || [],
            recursos: p.recursos || [],
            criteriosEvaluacion: p.criteriosEvaluacion || [],
            secuenciaClases: p.secuenciaClases || []
          }))
        });
      }
    } catch (e) {
      console.warn("Error leyendo planificaciones de MongoDB:", e);
    }
  }
  res.json({ success: true, planificaciones: planificacionesState });
});
app.post("/api/planificacion/generar-ia", async (req, res) => {
  const { materia, bloque, destreza, nivel, semanas } = req.body;
  const plan = await generarPlanificacionCurricular({
    materia: materia || "Lengua y Literatura",
    bloque: bloque || 2,
    destreza: destreza || "LL.4.2.1",
    nivel: nivel || "8vo EGB",
    semanas: Number(semanas) || 4
  });
  res.json({ success: true, plan });
});
app.post("/api/planificacion", async (req, res) => {
  const userPayload = getUserFromToken(req);
  const docenteId = userPayload?.id || "docente-1";
  const nuevoPlan = {
    id: `plan-${Date.now()}`,
    docenteId,
    progreso: 0,
    estado: "Por iniciar",
    generadaIA: true,
    ...req.body
  };
  planificacionesState.push(nuevoPlan);
  await connectDB();
  if (isMongoConnected()) {
    try {
      const created = await Planificacion.create({
        docenteId,
        paraleloId: req.body.paraleloId,
        materia: req.body.materia || "Lengua y Literatura",
        bloque: Number(req.body.bloque) || 2,
        titulo: req.body.titulo || "Nueva Planificaci\xF3n",
        destreza: req.body.destreza || "",
        semanas: Number(req.body.semanas) || 4,
        progreso: req.body.progreso || 0,
        estado: req.body.estado || "Por iniciar",
        generadaIA: Boolean(req.body.generadaIA),
        objetivos: req.body.objetivos || [],
        recursos: req.body.recursos || [],
        criteriosEvaluacion: req.body.criteriosEvaluacion || [],
        secuenciaClases: req.body.secuenciaClases || []
      });
      return res.status(201).json({
        success: true,
        plan: {
          id: created._id.toString(),
          ...created.toObject()
        }
      });
    } catch (e) {
      console.warn("Error guardando planificaci\xF3n en MongoDB:", e);
    }
  }
  res.status(201).json({ success: true, plan: nuevoPlan });
});
app.get("/api/workspace", async (req, res) => {
  await connectDB();
  if (isMongoConnected()) {
    try {
      const userPayload = getUserFromToken(req);
      const docenteId = userPayload?.id || "docente-1";
      const [tasks, docs, acts] = await Promise.all([
        KanbanTask.find({ docenteId }).sort({ createdAt: -1 }),
        Documento.find({ docenteId }).sort({ createdAt: -1 }),
        Actividad.find().sort({ createdAt: -1 })
      ]);
      return res.json({
        success: true,
        kanbanTasks: tasks.map((t) => ({
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
        actividades: acts.length > 0 ? acts.map((a) => ({
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
        documentos: docs.length > 0 ? docs.map((d) => ({
          id: d._id.toString(),
          nombre: d.nombre,
          categoria: d.categoria,
          descripcion: d.descripcion,
          tamano: d.tamano,
          tipo: d.tipo,
          fechaSubida: d.fechaSubida,
          url: d.url
        })) : documentosState
      });
    } catch (e) {
    }
  }
  res.json({ success: true, kanbanTasks, plantillas: PLANTILLAS_MINEDUC, actividades: actividadesState, documentos: documentosState });
});
app.get("/api/workspace/documentos", async (req, res) => {
  await connectDB();
  if (isMongoConnected()) {
    try {
      const userPayload = getUserFromToken(req);
      const docenteId = userPayload?.id || "docente-1";
      const docs = await Documento.find({ docenteId }).sort({ createdAt: -1 });
      if (docs && docs.length > 0) return res.json({ success: true, documentos: docs });
    } catch (e) {
    }
  }
  res.json({ success: true, documentos: documentosState });
});
app.post("/api/workspace/documentos", async (req, res) => {
  const userPayload = getUserFromToken(req);
  const docenteId = userPayload?.id || "docente-1";
  const nuevoDoc = { id: `doc-${Date.now()}`, fechaSubida: (/* @__PURE__ */ new Date()).toLocaleDateString("es-EC"), docenteId, ...req.body };
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
    } catch (e) {
    }
  }
  res.status(201).json({ success: true, documento: nuevoDoc });
});
app.delete("/api/workspace/documentos/:id", async (req, res) => {
  const { id } = req.params;
  await connectDB();
  if (isMongoConnected()) {
    try {
      const userPayload = getUserFromToken(req);
      const docenteId = userPayload?.id || "docente-1";
      const deleted = await Documento.findOneAndDelete({ _id: id, docenteId });
      if (!deleted) return res.status(404).json({ success: false, error: "Documento no encontrado" });
      return res.json({ success: true, message: "Documento eliminado" });
    } catch (e) {
    }
  }
  documentosState = documentosState.filter((d) => d.id !== id);
  res.json({ success: true });
});
app.post("/api/admin/fix-docente-ids", async (_req, res) => {
  await connectDB();
  if (!isMongoConnected()) return res.status(503).json({ error: "MongoDB no conectado" });
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
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});
var index_default = app;
export {
  ACTIVIDADES_INICIALES,
  DOCENTE_ACTUAL,
  PARALELOS_INICIALES,
  PLANIFICACIONES_MINEDUC,
  PLANTILLAS_MINEDUC,
  analizarRendimientoGrupo,
  app,
  connectDB,
  index_default as default,
  ensureDbConnected,
  generarActividad,
  generarInformeInstitucional,
  generarPlanificacionCurricular,
  isMongoConnected,
  seedDatabase,
  sugerirTareasTodo
};
