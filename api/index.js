// server/routes/api.ts
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt2 from "bcryptjs";

// server/services/gemini.ts
import { GoogleGenAI } from "@google/genai";
var getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
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
  "objetivos": [
    "Objetivo general 1 alineado a destrezas MINEDUC",
    "Objetivo 2"
  ],
  "criteriosEvaluacion": [
    "Criterio de evaluaci\xF3n 1"
  ],
  "secuenciaClases": [
    {
      "semana": 1,
      "tema": "Tema de la clase",
      "contenido": "Descripci\xF3n sint\xE9tica del contenido pedag\xF3gico y metodolog\xEDas activas (ERCA)",
      "actividadSugerida": "Actividad formativa para el aula",
      "recursos": ["Texto del estudiante MINEDUC", "Cuaderno de trabajo", "Material audiovisual"]
    }
  ],
  "actividadesEvaluacion": [
    "Instrumento de evaluaci\xF3n formativa sugerido"
  ],
  "adaptacionesCurriculares": "Orientaciones generales para NEE (Necesidades Educativas Especiales)"
}`;
  if (ai) {
    try {
      let response = null;
      let attempts = 0;
      while (attempts < 2) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.3
            }
          });
          break;
        } catch (err) {
          if (err?.status === 503 && attempts === 0) {
            await new Promise((r) => setTimeout(r, 2e3));
            attempts++;
          } else throw err;
        }
      }
      const text = response?.text?.trim() || "";
      const parsed = JSON.parse(text);
      return { ...parsed, generadaIA: true };
    } catch (error) {
      console.warn("Error al consultar Gemini para planificaci\xF3n, aplicando fallback pedag\xF3gico:", error);
    }
  }
  return {
    tituloUnidad: `Unidad ${params.bloque}: Aplicaci\xF3n de ${params.destreza.slice(0, 45)}...`,
    objetivos: [
      `Desarrollar habilidades comunicativas y de an\xE1lisis cr\xEDtico aplicadas a ${params.materia}.`,
      `Apropiar herramientas formativas de acuerdo al curr\xEDculo nacional del Ecuador.`
    ],
    criteriosEvaluacion: [
      `CE.${params.materia.slice(0, 2).toUpperCase()}.${params.bloque}.1 Aplica estrategias cognitivas de comprensi\xF3n y producci\xF3n textual.`
    ],
    secuenciaClases: Array.from({ length: Math.min(Number(params.semanas) || 3, 4) }, (_, i) => ({
      semana: i + 1,
      tema: `Semana ${i + 1}: Exploraci\xF3n y conceptualizaci\xF3n de ${params.destreza}`,
      contenido: `Ciclo del aprendizaje (ERCA): Experiencia reflexiva, conceptualizaci\xF3n guiada y aplicaci\xF3n pr\xE1ctica colaborativa.`,
      actividadSugerida: `Taller guiado individual con r\xFAbrica cualitativa y formativa.`,
      recursos: ["Gu\xEDa del docente MINEDUC", "Fichas pedag\xF3gicas", "Lectura guiada"]
    })),
    actividadesEvaluacion: ["R\xFAbrica de desempe\xF1o anal\xEDtica", "Portafolio estudiantil"],
    adaptacionesCurriculares: "Tiempos flexibles y apoyos visuales focalizados para estudiantes con NEE no asociadas a discapacidad.",
    generadaIA: false,
    modoOffline: true
  };
}
async function analizarRendimientoGrupo(params) {
  const ai = getAiClient();
  const prompt = `Analiza el estado acad\xE9mico del paralelo "${params.paraleloNombre}" en la materia "${params.materia}".
Datos cuantitativos:
- Promedio grupal: ${params.promedioGeneral.toFixed(2)} / 10
- Porcentaje de estudiantes con nota >= 7: ${params.porcentajeAprobados.toFixed(1)}%
- Estudiantes con nota bajo 7: ${JSON.stringify(params.estudiantesEnRiesgo)}
- Evaluaciones con m\xE1s bajo rendimiento: ${JSON.stringify(params.actividadesCriticas)}

Genera un diagn\xF3stico pedag\xF3gico sint\xE9tico en tono profesional y emp\xE1tico para el docente, con recomendaciones concretas de refuerzo acad\xE9mico conforme al Reglamento General a la Ley Org\xE1nica de Educaci\xF3n Intercultural (RGLOEI) del Ecuador.
Responde \xDANICAMENTE en JSON con:
{
  "diagnosticoBreve": "Resumen de 2 p\xE1rrafos",
  "puntosAlerta": ["Alerta 1", "Alerta 2"],
  "estrategiasRefuerzo": [
    "Estrategia did\xE1ctica 1",
    "Estrategia did\xE1ctica 2"
  ],
  "recomendacionDirectivo": "Recomendaci\xF3n lista para el informe quimestral"
}`;
  if (ai) {
    try {
      let response = null;
      let attempts = 0;
      while (attempts < 2) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.3
            }
          });
          break;
        } catch (err) {
          if (err?.status === 503 && attempts === 0) {
            await new Promise((r) => setTimeout(r, 2e3));
            attempts++;
          } else throw err;
        }
      }
      return JSON.parse(response?.text?.trim() || "{}");
    } catch (error) {
      console.warn("Error en Gemini analizarRendimientoGrupo, usando fallback:", error);
    }
  }
  return {
    diagnosticoBreve: `El paralelo ${params.paraleloNombre} presenta un promedio general de ${params.promedioGeneral.toFixed(1)}/10, con un ${params.porcentajeAprobados.toFixed(0)}% de aprobaci\xF3n. Se evidencia un desempe\xF1o estable en la mayor\xEDa de actividades, aunque persisten dificultades puntuales en evaluaciones formales de an\xE1lisis reflexivo.`,
    puntosAlerta: [
      `${params.estudiantesEnRiesgo.length} estudiantes requieren Plan de Refuerzo Acad\xE9mico inmediato (promedio < 7.00).`,
      `La actividad con mayor \xEDndice de refuerzo requerido es "${params.actividadesCriticas[0]?.titulo || "Evaluaci\xF3n Parcial"}".`
    ],
    estrategiasRefuerzo: [
      "Implementar tutor\xEDas entre pares en los primeros 15 minutos de la jornada.",
      "Reevaluaci\xF3n formativa mediante talleres de retroalimentaci\xF3n en clase antes del cierre de parcial."
    ],
    recomendacionDirectivo: "Se sugiere notificar formalmente a los representantes legales y formalizar el registro del Plan de Mejora Acad\xE9mica institucional."
  };
}
async function generarInformeInstitucional(params) {
  const ai = getAiClient();
  const prompt = `Redacta el informe oficial de fin de per\xEDodo escolar seg\xFAn los est\xE1ndares del Ministerio de Educaci\xF3n del Ecuador.
Datos:
- Docente: ${params.docenteNombre}
- Plantel: ${params.institucion}
- Curso y Paralelo: ${params.paraleloNombre}
- Asignatura: ${params.materia}
- Per\xEDodo: ${params.periodo}
- Promedio acad\xE9mico grupal: ${params.promedio.toFixed(2)}/10
- Asistencia promedio mensual: ${params.porcentajeAsistencia.toFixed(1)}%

Responde \xDANICAMENTE en JSON:
{
  "codigoDocumento": "INF-${(/* @__PURE__ */ new Date()).getFullYear()}-01",
  "titulo": "INFORME DE RENDIMIENTO ACAD\xC9MICO Y PEDAG\xD3GICO",
  "antecedentes": "P\xE1rrafo formal de antecedentes curriculares",
  "desarrollo": "An\xE1lisis descriptivo del proceso formativo, cumplimiento del cronograma y logros",
  "conclusiones": [
    "Conclusi\xF3n 1 sobre el progreso del grupo",
    "Conclusi\xF3n 2 sobre asistencia y compromiso"
  ],
  "recomendaciones": [
    "Recomendaci\xF3n pedag\xF3gica para el pr\xF3ximo parcial",
    "Acci\xF3n coordinada con DECE e Inspecci\xF3n General"
  ]
}`;
  if (ai) {
    try {
      let response = null;
      let attempts = 0;
      while (attempts < 2) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.3
            }
          });
          break;
        } catch (err) {
          if (err?.status === 503 && attempts === 0) {
            await new Promise((r) => setTimeout(r, 2e3));
            attempts++;
          } else throw err;
        }
      }
      return JSON.parse(response?.text?.trim() || "{}");
    } catch (error) {
      console.warn("Error en Gemini generarInformeInstitucional:", error);
    }
  }
  return {
    codigoDocumento: `INF-${(/* @__PURE__ */ new Date()).getFullYear()}-${params.paraleloNombre.replace(/\s+/g, "")}`,
    titulo: "INFORME DE RENDIMIENTO ACAD\xC9MICO Y ASISTENCIA",
    antecedentes: `En concordancia con las directrices emanadas por el Ministerio de Educaci\xF3n del Ecuador y el Proyecto Educativo Institucional (PEI) de la ${params.institucion}, se presenta el balance correspondiente al ${params.periodo}.`,
    desarrollo: `Durante el per\xEDodo lectivo en la asignatura de ${params.materia}, se ejecutaron las destrezas con criterio de desempe\xF1o planificadas para ${params.paraleloNombre}, alcanzando un promedio ponderado de ${params.promedio.toFixed(2)}/10 y un \xEDndice de asistencia regular del ${params.porcentajeAsistencia.toFixed(1)}%.`,
    conclusiones: [
      `El 85% de los educandos demostraron apropiaci\xF3n de los aprendizajes b\xE1sicos e imprescindibles.`,
      `La toma de asistencia sistematizada permiti\xF3 detectar a tiempo alertas tempranas de ausentismo justificado e injustificado.`
    ],
    recomendaciones: [
      "Mantener el esquema de refuerzo pedag\xF3gico continuo para estudiantes en riesgo.",
      "Fortalecer la articulaci\xF3n con el Departamento de Consejer\xEDa Estudiantil (DECE)."
    ]
  };
}
async function sugerirTareasTodo(params) {
  const tareas = [];
  if (params.asistenciaPendienteHoy) {
    tareas.push({
      id: "task-asistencia-hoy",
      titulo: `Tomar asistencia de hoy en ${params.paralelosNombres[0] || "8vo A"}`,
      urgencia: "alta",
      modulo: "Asistencia",
      link: "/asistencia"
    });
  }
  if (params.actividadesSinCalificar > 0) {
    tareas.push({
      id: "task-calificar-pendientes",
      titulo: `Calificar ${params.actividadesSinCalificar} entregas pendientes en el Libro de Notas`,
      urgencia: params.actividadesSinCalificar > 5 ? "alta" : "media",
      modulo: "Calificaciones",
      link: "/calificaciones"
    });
  }
  if (params.planificacionesPorIniciar > 0) {
    tareas.push({
      id: "task-plan-mineduc",
      titulo: "Completar planificaci\xF3n del Bloque 3 con asistencia de IA",
      urgencia: "media",
      modulo: "Planificaci\xF3n",
      link: "/planificacion"
    });
  }
  tareas.push({
    id: "task-reporte-quimestral",
    titulo: "Generar reporte consolidado de asistencia mensual para Inspecci\xF3n",
    urgencia: "baja",
    modulo: "Workspace",
    link: "/workspace"
  });
  return tareas;
}

// server/db.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
var isConnected = false;
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes("usuario:password")) {
    console.log("[asap DB] MONGODB_URI no configurado o es plantilla de ejemplo. Operando con fallback persistente en memoria.");
    isConnected = false;
    return false;
  }
  try {
    if (mongoose.connection.readyState >= 1) {
      isConnected = true;
      return true;
    }
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4e3
    });
    isConnected = true;
    console.log("[asap DB] Conectado exitosamente a MongoDB Atlas.");
    return true;
  } catch (error) {
    console.warn("[asap DB] No se pudo conectar a MongoDB Atlas:", error.message);
    console.log("[asap DB] Activando fallback transparente en memoria para todas las operaciones.");
    isConnected = false;
    return false;
  }
}
function isMongoConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

// server/seed.ts
import bcrypt from "bcryptjs";
import dotenv2 from "dotenv";

// server/models/Usuario.ts
import mongoose2, { Schema } from "mongoose";
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
var Usuario_default = mongoose2.models.Usuario || mongoose2.model("Usuario", UsuarioSchema);

// server/models/Paralelo.ts
import mongoose3, { Schema as Schema2 } from "mongoose";
var ParaleloSchema = new Schema2(
  {
    nombre: { type: String, required: true },
    grado: { type: Number, required: true },
    jornada: { type: String, enum: ["Matutina", "Vespertina", "Nocturna"], default: "Matutina" },
    docenteId: { type: Schema2.Types.ObjectId, ref: "Usuario", required: true },
    materias: [{ type: String }],
    nivel: { type: String, default: "Educaci\xF3n B\xE1sica Superior" },
    especialidad: { type: String }
  },
  { timestamps: true }
);
var Paralelo_default = mongoose3.models.Paralelo || mongoose3.model("Paralelo", ParaleloSchema);

// server/models/Alumno.ts
import mongoose4, { Schema as Schema3 } from "mongoose";
var AlumnoSchema = new Schema3(
  {
    nombre: { type: String, required: true },
    cedula: { type: String, required: false },
    paraleloId: { type: Schema3.Types.ObjectId, ref: "Paralelo", required: true },
    activo: { type: Boolean, default: true },
    contactoRepresentante: { type: String },
    telefonoRepresentante: { type: String },
    observaciones: [{ type: String }]
  },
  { timestamps: true }
);
var Alumno_default = mongoose4.models.Alumno || mongoose4.model("Alumno", AlumnoSchema);

// server/models/Documento.ts
import mongoose5, { Schema as Schema4 } from "mongoose";
var DocumentoSchema = new Schema4(
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
var Documento_default = mongoose5.models.Documento || mongoose5.model("Documento", DocumentoSchema);

// server/data/mockData.ts
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

// server/seed.ts
dotenv2.config();
async function seedDatabase(force = false) {
  const connected = await connectDB();
  if (!connected) {
    console.log("[Seed] MongoDB no est\xE1 conectado. Saltando seed en base de datos f\xEDsica.");
    return;
  }
  try {
    const existingUser = await Usuario_default.findOne({ email: "andres.morales@uefdemocracia.edu.ec" });
    if (existingUser && !force) {
      let isPassValid = false;
      try {
        if (existingUser.password && existingUser.password.startsWith("$2")) {
          isPassValid = await bcrypt.compare("asap2024", existingUser.password);
        }
      } catch (e) {
      }
      if (!isPassValid) {
        console.log("[Seed] Actualizando contrase\xF1a de Andr\xE9s Morales a hash bcrypt de asap2024...");
        existingUser.password = await bcrypt.hash("asap2024", 10);
        await existingUser.save();
      }
      console.log("[Seed] La base de datos ya contiene al docente Andr\xE9s Morales. No se requiere seed completo.");
      return;
    }
    console.log("[Seed] Iniciando poblaci\xF3n inicial de datos de prueba...");
    const hashedPassword = await bcrypt.hash("asap2024", 10);
    const docente = await Usuario_default.findOneAndUpdate(
      { email: "andres.morales@uefdemocracia.edu.ec" },
      {
        nombre: "Lic. Andr\xE9s Morales",
        email: "andres.morales@uefdemocracia.edu.ec",
        password: hashedPassword,
        rol: "Docente",
        materias: ["Lengua y Literatura"],
        institucion: "U.E. Fisco-Misional Democracia",
        telefono: "+593 98 765 4321",
        avatar: "https://picsum.photos/seed/docente_andres/150/150"
      },
      { upsert: true, new: true }
    );
    console.log(`[Seed] Usuario ${docente.nombre} registrado con \xE9xito.`);
    for (const p of PARALELOS_INICIALES) {
      const paraleloDoc = await Paralelo_default.findOneAndUpdate(
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
        await Alumno_default.findOneAndUpdate(
          { cedula: est.cedula },
          {
            nombre: est.nombre,
            cedula: est.cedula,
            numeroLista: est.numeroLista,
            paraleloId: paraleloDoc._id.toString(),
            activo: est.activo,
            telefonoRepresentante: est.telefonoRepresentante || "+593 99 123 4567",
            faltasJustificadas: est.faltasJustificadas || 0,
            faltasInjustificadas: est.faltasInjustificadas || 0,
            atrasos: est.atrasos || 0
          },
          { upsert: true }
        );
      }
      console.log(`[Seed] Paralelo ${p.nombre} con ${p.estudiantes.length} alumnos procesado.`);
    }
    const docs = [
      {
        nombre: "Plan_Curricular_Anual_Lengua_8vo.pdf",
        categoria: "Planificaci\xF3n",
        descripcion: "PCA oficial aprobado por vicerrectorado periodo 2026-2027",
        tamano: "380 KB",
        tipo: "PDF",
        fechaSubida: "12/03/2026",
        docenteId: docente._id.toString()
      },
      {
        nombre: "Acta_Junta_Curso_1er_Quimestre.pdf",
        categoria: "Institucional",
        descripcion: "Acta formal con resoluciones de rendimiento",
        tamano: "210 KB",
        tipo: "PDF",
        fechaSubida: "28/03/2026",
        docenteId: docente._id.toString()
      },
      {
        nombre: "PRAI_Estudiantes_En_Riesgo.docx",
        categoria: "Estudiante",
        descripcion: "Planes de refuerzo acad\xE9mico individualizados",
        tamano: "145 KB",
        tipo: "DOCX",
        fechaSubida: "04/04/2026",
        docenteId: docente._id.toString()
      }
    ];
    for (const d of docs) {
      await Documento_default.findOneAndUpdate(
        { nombre: d.nombre },
        d,
        { upsert: true }
      );
    }
    console.log("[Seed] Documentos de prueba creados.");
    console.log("[Seed] \xA1Base de datos poblada exitosamente!");
  } catch (err) {
    console.error("[Seed] Error al poblar base de datos:", err);
  }
}
if (process.argv[1]?.endsWith("seed.ts")) {
  seedDatabase(true).then(() => {
    console.log("[Seed] Proceso terminado.");
    process.exit(0);
  });
}

// server/routes/api.ts
var NOMBRES_ESTUDIANTES_8VO2 = [
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
var NOMBRES_ESTUDIANTES_9NO2 = [
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
function crearEstudiantes2(nombres, paraleloId) {
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
var PARALELOS_INICIALES2 = [
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
    estudiantes: crearEstudiantes2(NOMBRES_ESTUDIANTES_8VO2, "8vo-a")
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
    estudiantes: crearEstudiantes2(NOMBRES_ESTUDIANTES_9NO2, "9no-b")
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
var PLANTILLAS_MINEDUC2 = [
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
var dbInitPromise = null;
async function ensureDbConnected() {
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
ensureDbConnected().catch(() => {
});
var paralelosState = JSON.parse(JSON.stringify(PARALELOS_INICIALES2));
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
  },
  {
    id: "kb-4",
    titulo: "Preparar material para el bloque 3",
    descripcion: "Dise\xF1o de diapositivas interactivas y fichas de lectura sobre l\xEDrica ecuatoriana.",
    paralelo: "8vo A",
    columna: "Por hacer",
    prioridad: "Baja",
    urgencia: "Baja",
    fecha: "2026-10-30",
    fechaLimite: "2026-11-05",
    observaciones: "Revisar antolog\xEDa de poetas guayaquile\xF1os y cuencanos.",
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
  },
  {
    id: "doc-2",
    nombre: "Acta_Junta_Curso_1er_Quimestre.pdf",
    categoria: "Institucional",
    descripcion: "Acta formal con resoluciones de rendimiento",
    tamano: "210 KB",
    tipo: "PDF",
    fechaSubida: "28/03/2026",
    contenidoBase64: "JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwgL0xlbmd0aCA1OSAvRmlsdGVyIC9GbGF0ZURlY29kZSA+PgpzdHJlYW0KeJwrSExPT1HIzFPSUUpMzs8tLslPzlDISSxJLQIyQzJSgYKVkmlqSgEAg3kNEwo=endstream"
  },
  {
    id: "doc-3",
    nombre: "PRAI_Estudiantes_En_Riesgo.docx",
    categoria: "Estudiante",
    descripcion: "Planes de refuerzo acad\xE9mico individualizados",
    tamano: "145 KB",
    tipo: "DOCX",
    fechaSubida: "04/04/2026",
    contenidoBase64: "UEsDBBQAAAAIAAAAAAAAAAAAAAAAAAAAAAAIAAAAd29yZC9kb2N1bWVudC54bWw="
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
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
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
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Correo y contrase\xF1a son requeridos" });
    }
    const cleanEmail = email.toLowerCase().trim();
    if (!isMongoConnected()) {
      await connectDB();
    }
    if (isMongoConnected()) {
      const dbUser = await Usuario_default.findOne({ email: cleanEmail });
      if (!dbUser) {
        return res.status(404).json({ success: false, error: "Usuario no encontrado" });
      }
      let isValid = false;
      if (dbUser.password && dbUser.password.startsWith("$2")) {
        isValid = await bcrypt2.compare(password, dbUser.password);
      } else if (dbUser.password) {
        isValid = password === dbUser.password;
        if (isValid) {
          dbUser.password = await bcrypt2.hash(password, 10);
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
        {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          rol: user.rol,
          institucion: user.institucion
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      return res.json({
        success: true,
        token,
        user,
        message: "Sesi\xF3n iniciada correctamente"
      });
    }
    if (cleanEmail === "andres.morales@uefdemocracia.edu.ec") {
      if (password !== "asap2024") {
        return res.status(401).json({ success: false, error: "Contrase\xF1a incorrecta" });
      }
      const token = jwt.sign(
        {
          id: "docente-1",
          email: DOCENTE_ACTUAL.email,
          nombre: DOCENTE_ACTUAL.nombre,
          rol: DOCENTE_ACTUAL.rol,
          institucion: DOCENTE_ACTUAL.institucion
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      return res.json({
        success: true,
        token,
        user: DOCENTE_ACTUAL,
        message: "Sesi\xF3n iniciada correctamente"
      });
    }
    return res.status(404).json({ success: false, error: "Usuario no encontrado" });
  } catch (error) {
    console.error("Error en /api/auth/login:", error);
    return res.status(500).json({ success: false, error: "Error interno en el servidor" });
  }
});
app.post("/api/auth/google", async (req, res) => {
  const { credential, email, nombre, avatar } = req.body;
  const targetEmail = (email || "andres.morales@uefdemocracia.edu.ec").toLowerCase().trim();
  let dbUser = null;
  if (isMongoConnected()) {
    try {
      dbUser = await Usuario_default.findOne({ email: targetEmail });
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
    avatar: avatar || dbUser?.avatar || "https://picsum.photos/seed/google_avatar/150/150"
  };
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      institucion: user.institucion,
      authProvider: "google"
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.json({
    success: true,
    token,
    user,
    message: "Sesi\xF3n iniciada con Google"
  });
});
app.get("/api/auth/me", async (req, res) => {
  const userPayload = getUserFromToken(req);
  if (userPayload) {
    if (isMongoConnected()) {
      try {
        const dbUser = await Usuario_default.findById(userPayload.id) || await Usuario_default.findOne({ email: userPayload.email });
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
      return res.status(400).json({ success: false, error: "Nombre, correo y contrase\xF1a son requeridos." });
    }
    const cleanEmail = email.toLowerCase().trim();
    let savedUserId = "docente-new";
    let mongoUser = null;
    if (!isMongoConnected()) {
      await connectDB();
    }
    if (!isMongoConnected()) {
      return res.status(503).json({
        success: false,
        error: "No se pudo conectar a MongoDB Atlas. Por favor verifica las credenciales y el estado de la base de datos."
      });
    }
    try {
      const existing = await Usuario_default.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(409).json({ success: false, error: "Ya existe una cuenta registrada con este correo electr\xF3nico." });
      }
      const hashedPassword = await bcrypt2.hash(password, 10);
      const createdUser = await Usuario_default.create({
        nombre: nombre.trim(),
        email: cleanEmail,
        password: hashedPassword,
        rol: rol || "Docente",
        institucion: institucion || "Unidad Educativa",
        materias: (cursos || []).map((c) => c.materia).filter(Boolean)
      });
      mongoUser = createdUser;
      savedUserId = createdUser._id.toString();
    } catch (err) {
      console.error("Error guardando usuario en MongoDB:", err);
      return res.status(500).json({ success: false, error: "Error al registrar usuario: " + (err.message || "Error de base de datos") });
    }
    const createdParalelos = [];
    if (Array.isArray(cursos)) {
      for (const curso of cursos) {
        const paraleloNombre = `${curso.grado || "Curso"} "${curso.paralelo || "A"}" - ${curso.materia || "General"}`;
        const estudiantesParaEsteCurso = estudiantesPorCurso && estudiantesPorCurso[curso.id] || [];
        let mongoParalelo = null;
        if (isMongoConnected() && mongoUser) {
          try {
            const gradoNum = parseInt((curso.grado || "").replace(/\D/g, "")) || 8;
            mongoParalelo = await Paralelo_default.create({
              nombre: paraleloNombre,
              grado: gradoNum,
              jornada: "Matutina",
              docenteId: mongoUser._id,
              materias: [curso.materia || "General"],
              nivel: curso.nivel || "Educaci\xF3n B\xE1sica Superior",
              especialidad: especialidadTecnica || ""
            });
            if (Array.isArray(estudiantesParaEsteCurso) && estudiantesParaEsteCurso.length > 0) {
              const alumnoDocs = estudiantesParaEsteCurso.map((est) => ({
                nombre: est.nombre,
                cedula: est.cedula || "",
                paraleloId: mongoParalelo._id,
                activo: true
              }));
              await Alumno_default.insertMany(alumnoDocs);
            }
          } catch (pErr) {
            console.warn("Error guardando paralelo/alumnos en MongoDB:", pErr);
          }
        }
        const newParaleloState = {
          id: mongoParalelo ? mongoParalelo._id.toString() : `p-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          nombre: `${curso.grado || "Curso"} "${curso.paralelo || "A"}"`,
          materia: curso.materia || "General",
          grado: curso.grado || "8vo EGB",
          jornada: "Matutina",
          totalEstudiantes: estudiantesParaEsteCurso.length || curso.estudiantesAprox || 30,
          asistenciaHoyRegistrada: false,
          porcentajeAsistenciaMes: 100,
          aula: "Bloque A \xB7 Aula 101",
          horario: "07:15 - 08:45",
          estudiantes: estudiantesParaEsteCurso.length > 0 ? estudiantesParaEsteCurso.map((e, idx) => ({
            id: `est-new-${idx + 1}`,
            nombre: e.nombre,
            cedula: e.cedula || "",
            numeroLista: e.lista || idx + 1,
            faltasJustificadas: 0,
            faltasInjustificadas: 0,
            atrasos: 0
          })) : Array.from({ length: curso.estudiantesAprox || 30 }).map((_, idx) => ({
            id: `est-ph-${idx + 1}`,
            nombre: `Estudiante ${idx + 1}`,
            cedula: `09${1e7 + idx}`,
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
      rol: rol || "Docente",
      institucion: institucion || "Unidad Educativa",
      materias: (cursos || []).map((c) => c.materia).filter(Boolean),
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
      { expiresIn: "7d" }
    );
    return res.status(201).json({
      success: true,
      message: "Docente y cursos registrados exitosamente",
      token,
      user: userResponse,
      cursosRegistrados: createdParalelos
    });
  } catch (err) {
    console.error("Error en /api/auth/register:", err);
    return res.status(500).json({ success: false, error: err.message || "Error al procesar el registro" });
  }
});
app.get("/api/dashboard", async (_req, res) => {
  const actividadesPendientes = actividadesState.filter((a) => a.estado === "Por calificar").length;
  const paralelosNombres = paralelosState.map((p) => p.nombre);
  const now = /* @__PURE__ */ new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  let claseActual = null;
  if (currentMinutes >= 435 && currentMinutes <= 525) {
    claseActual = {
      paralelo: '8vo EGB "A"',
      materia: "Lengua y Literatura",
      aula: "Bloque B \xB7 Aula 204",
      horario: "07:15 a 08:45",
      tema: "Estructura y conectores en el ensayo argumentativo"
    };
  } else if (currentMinutes > 525 && currentMinutes <= 600) {
    claseActual = {
      paralelo: '9no EGB "B"',
      materia: "Lengua y Literatura",
      aula: "Bloque A \xB7 Aula 102",
      horario: "08:45 a 10:00",
      tema: "M\xE9trica y recursos estil\xEDsticos en la poes\xEDa l\xEDrica"
    };
  }
  const smartTodo = await sugerirTareasTodo({
    actividadesSinCalificar: actividadesPendientes,
    planificacionesPorIniciar: 1,
    asistenciaPendienteHoy: paralelosState.some((p) => !p.asistenciaHoyRegistrada),
    paralelosNombres
  });
  res.json({
    success: true,
    docente: DOCENTE_ACTUAL,
    resumenHoy: {
      fecha: (/* @__PURE__ */ new Date()).toLocaleDateString("es-EC", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
      jornada: "Matutina (07:15 - 12:45)",
      claseActual,
      proximaClase: {
        paralelo: '9no EGB "B"',
        materia: "Lengua y Literatura",
        horario: "10:00 a 11:30",
        tema: "Taller de redacci\xF3n de microcuentos"
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
      { id: "1", accion: "Asistencia registrada", detalle: '8vo EGB "A" \u2014 28 presentes, 1 atraso, 1 falta justificada', tiempo: "Hace 45 min" },
      { id: "2", accion: "Nueva actividad creada con IA", detalle: "Deber 2: Micro-cr\xF3nica barrial asignada a 8vo A", tiempo: "Hace 3 horas" },
      { id: "3", accion: "Calificaciones actualizadas", detalle: "Taller de Figuras Literarias en 9no B cerrado con promedio 8.1", tiempo: "Ayer" },
      { id: "4", accion: "Planificaci\xF3n generada", detalle: "Bloque 2 validado seg\xFAn destrezas MINEDUC", tiempo: "Hace 2 d\xEDas" }
    ]
  });
});
app.get("/api/paralelos", async (req, res) => {
  if (isMongoConnected()) {
    try {
      const userPayload = getUserFromToken(req);
      const docenteId = userPayload?.id;
      const query = docenteId ? { docenteId } : {};
      const paralelos = await Paralelo_default.find(query);
      if (paralelos && paralelos.length > 0) {
        return res.json({
          success: true,
          paralelos: paralelos.map((p) => ({
            id: p._id.toString(),
            nombre: p.nombre,
            grado: p.grado,
            nivel: p.nivel || "Educaci\xF3n B\xE1sica Superior",
            jornada: p.jornada || "Matutina",
            materia: p.materia || p.materias && p.materias[0] || "General",
            horario: p.horario || "07:15 - 08:45",
            aula: p.aula || "Aula 101",
            totalEstudiantes: p.totalEstudiantes || 30,
            asistenciaHoyRegistrada: Boolean(p.asistenciaHoyRegistrada),
            porcentajeAsistenciaMes: 100
          }))
        });
      }
    } catch (err) {
      console.warn("Error obteniendo paralelos en MongoDB:", err);
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
  if (isMongoConnected()) {
    try {
      const userPayload = getUserFromToken(req);
      const docenteId = userPayload?.id;
      const query = docenteId ? { docenteId } : {};
      const paralelos = await Paralelo_default.find(query);
      if (paralelos && paralelos.length > 0) {
        return res.json({
          success: true,
          paralelos: paralelos.map((p) => ({
            id: p._id.toString(),
            nombre: p.nombre,
            grado: p.grado,
            jornada: p.jornada || "Matutina",
            materia: p.materia || p.materias && p.materias[0] || "General",
            totalEstudiantes: p.totalEstudiantes || 30,
            asistenciaHoyRegistrada: Boolean(p.asistenciaHoyRegistrada),
            porcentajeAsistenciaMes: 100,
            aula: p.aula || "Aula 101",
            horario: p.horario || "07:15 - 08:45"
          }))
        });
      }
    } catch (err) {
      console.warn("Error obteniendo asistencia de paralelos en MongoDB:", err);
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
app.get("/api/asistencia/:cursoId", (req, res) => {
  const paralelo = paralelosState.find((p) => p.id === req.params.cursoId);
  if (!paralelo) {
    return res.status(404).json({ success: false, error: "Paralelo no encontrado" });
  }
  const asistenciaHoy = paralelo.estudiantes.map((est, idx) => {
    let estado = "P";
    let justificada = false;
    let motivo = "";
    if (idx === 4) {
      estado = "F";
      justificada = true;
      motivo = "Cita m\xE9dica en IESS Guayaquil (Certificado presentado)";
    } else if (idx === 12) {
      estado = "A";
      motivo = "Llegada 10 min tarde por transporte";
    }
    const totalDias = 20;
    const totalFaltas = (est.faltasJustificadas || 0) + (est.faltasInjustificadas || 0);
    const porcentajeFaltas = Number((totalFaltas / totalDias * 100).toFixed(1));
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
    fecha: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    asistenciaHoy
  });
});
app.post("/api/asistencia/:cursoId", async (req, res) => {
  const { registros, observacionGeneral } = req.body;
  const index = paralelosState.findIndex((p) => p.id === req.params.cursoId);
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Paralelo no encontrado" });
  }
  paralelosState[index].asistenciaHoyRegistrada = true;
  if (Array.isArray(registros)) {
    registros.forEach((reg) => {
      const est = paralelosState[index].estudiantes.find((e) => e.id === reg.estudianteId);
      if (est) {
        if (reg.estado === "F") {
          if (reg.justificada) est.faltasJustificadas = (est.faltasJustificadas || 0) + 1;
          else est.faltasInjustificadas = (est.faltasInjustificadas || 0) + 1;
        } else if (reg.estado === "A") {
          est.atrasos = (est.atrasos || 0) + 1;
        }
      }
    });
  }
  if (isMongoConnected()) {
    try {
      const ParaleloModel = Paralelo_default;
      await ParaleloModel.findOneAndUpdate(
        { nombre: paralelosState[index].nombre },
        { asistenciaHoyRegistrada: true }
      );
    } catch (err) {
      console.warn("Error sincronizando asistencia en MongoDB:", err);
    }
  }
  res.json({
    success: true,
    message: "Asistencia del d\xEDa guardada satisfactoriamente en el sistema",
    paraleloId: req.params.cursoId,
    fecha: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.get("/api/calificaciones", async (req, res) => {
  if (isMongoConnected()) {
    try {
      const userPayload = getUserFromToken(req);
      const docenteId = userPayload?.id;
      const query = docenteId ? { docenteId } : {};
      const paralelos = await Paralelo_default.find(query);
      if (paralelos && paralelos.length > 0) {
        return res.json({
          success: true,
          paralelos: paralelos.map((p) => ({
            id: p._id.toString(),
            nombre: p.nombre,
            grado: p.grado,
            materia: p.materia || p.materias && p.materias[0] || "General"
          }))
        });
      }
    } catch (err) {
      console.warn("Error obteniendo calificaciones de MongoDB:", err);
    }
  }
  res.json({
    success: true,
    paralelos: paralelosState.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      grado: p.grado,
      materia: p.materia
    }))
  });
});
app.get("/api/calificaciones/:cursoId", async (req, res) => {
  const { cursoId } = req.params;
  if (isMongoConnected()) {
    try {
      let mongoParalelo = null;
      if (cursoId && cursoId.match(/^[0-9a-fA-F]{24}$/)) {
        mongoParalelo = await Paralelo_default.findById(cursoId);
      }
      if (!mongoParalelo) {
        mongoParalelo = await Paralelo_default.findOne({ nombre: cursoId });
      }
      if (mongoParalelo) {
        const alumnos = await Alumno_default.find({ paraleloId: mongoParalelo._id.toString() });
        const paraleloObj = {
          id: mongoParalelo._id.toString(),
          nombre: mongoParalelo.nombre,
          grado: mongoParalelo.grado,
          materia: mongoParalelo.materia || mongoParalelo.materias && mongoParalelo.materias[0] || "General",
          estudiantes: alumnos.map((a, idx) => ({
            id: a._id.toString(),
            nombre: a.nombre,
            numeroLista: a.numeroLista || idx + 1,
            cedula: a.cedula
          }))
        };
        const actividades2 = actividadesState.filter((a) => a.paraleloId === paraleloObj.id || a.paraleloId === "par-8vo-a");
        const matrix2 = calificacionesMatrix[paraleloObj.id] || calificacionesMatrix["par-8vo-a"] || {};
        const libroNotas2 = paraleloObj.estudiantes.map((est) => {
          const notasAlumno = matrix2[est.id] || {};
          const notasArray = actividades2.map((a) => notasAlumno[a.id] ?? 0);
          const suma = notasArray.reduce((acc, curr) => acc + curr, 0);
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
        const promediosTodos2 = libroNotas2.map((n) => n.promedio);
        const promedioGeneral2 = promediosTodos2.length > 0 ? Number((promediosTodos2.reduce((a, b) => a + b, 0) / promediosTodos2.length).toFixed(2)) : 7.5;
        const aprobados2 = promediosTodos2.filter((p) => p >= 7).length;
        const porcentajeAprobados2 = promediosTodos2.length > 0 ? aprobados2 / promediosTodos2.length * 100 : 85;
        return res.json({
          success: true,
          paralelo: paraleloObj,
          actividades: actividades2,
          libroNotas: libroNotas2,
          estadisticas: {
            promedioGeneral: promedioGeneral2,
            porcentajeAprobados: porcentajeAprobados2,
            totalEstudiantes: libroNotas2.length,
            enRiesgo: libroNotas2.filter((n) => n.promedio < 7)
          }
        });
      }
    } catch (err) {
      console.warn("Error consultando calificaciones de curso en MongoDB:", err);
    }
  }
  const paralelo = paralelosState.find((p) => p.id === req.params.cursoId) || paralelosState[0];
  if (!paralelo) {
    return res.status(404).json({ success: false, error: "Paralelo no encontrado" });
  }
  const actividades = actividadesState.filter((a) => a.paraleloId === paralelo.id);
  const matrix = calificacionesMatrix[paralelo.id] || {};
  const libroNotas = paralelo.estudiantes.map((est) => {
    const notasAlumno = matrix[est.id] || {};
    const notasArray = actividades.map((a) => notasAlumno[a.id] ?? 0);
    const suma = notasArray.reduce((acc, curr) => acc + curr, 0);
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
  const promediosTodos = libroNotas.map((n) => n.promedio);
  const promedioGeneral = promediosTodos.length > 0 ? Number((promediosTodos.reduce((a, b) => a + b, 0) / promediosTodos.length).toFixed(2)) : 7.5;
  const aprobados = promediosTodos.filter((p) => p >= 7).length;
  const porcentajeAprobados = promediosTodos.length > 0 ? aprobados / promediosTodos.length * 100 : 85;
  res.json({
    success: true,
    paralelo,
    actividades,
    libroNotas,
    estadisticas: {
      promedioGeneral,
      porcentajeAprobados,
      totalEstudiantes: libroNotas.length,
      enRiesgo: libroNotas.filter((n) => n.promedio < 7)
    }
  });
});
app.put("/api/calificaciones/celda", (req, res) => {
  const { paraleloId, estudianteId, actividadId, nota } = req.body;
  const parsedNota = Math.max(0, Math.min(10, Number(nota) || 0));
  if (!calificacionesMatrix[paraleloId]) calificacionesMatrix[paraleloId] = {};
  if (!calificacionesMatrix[paraleloId][estudianteId]) calificacionesMatrix[paraleloId][estudianteId] = {};
  calificacionesMatrix[paraleloId][estudianteId][actividadId] = Number(parsedNota.toFixed(2));
  res.json({
    success: true,
    nota: parsedNota,
    message: "Nota actualizada correctamente"
  });
});
app.post("/api/calificaciones/actividad", (req, res) => {
  const { paraleloId, titulo, tipo, fechaEntrega, ponderacion } = req.body;
  const nuevaActividad = {
    id: `act-${Date.now()}`,
    paraleloId,
    titulo: titulo || "Nueva Evaluaci\xF3n",
    tipo: tipo || "Individual",
    fechaEntrega: fechaEntrega || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    ponderacion: Number(ponderacion) || 10,
    entregadosCount: 0,
    totalCount: 30,
    estado: "Por calificar",
    bloque: 2
  };
  actividadesState.push(nuevaActividad);
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
app.post("/api/ai/analisis-rendimiento", async (req, res) => {
  const { paraleloId } = req.body;
  const paralelo = paralelosState.find((p) => p.id === paraleloId) || paralelosState[0];
  const actividades = actividadesState.filter((a) => a.paraleloId === paralelo.id);
  const matrix = calificacionesMatrix[paralelo.id] || {};
  const enRiesgo = [];
  let sumaGeneral = 0;
  let conteo = 0;
  paralelo.estudiantes.forEach((est) => {
    const notasAlumno = matrix[est.id] || {};
    const valores = Object.values(notasAlumno);
    const prom = valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : 7.2;
    sumaGeneral += prom;
    conteo++;
    if (prom < 7) {
      enRiesgo.push({ nombre: est.nombre, promedio: Number(prom.toFixed(2)) });
    }
  });
  const promedioGeneral = conteo > 0 ? sumaGeneral / conteo : 7.4;
  const porcentajeAprobados = conteo > 0 ? (conteo - enRiesgo.length) / conteo * 100 : 85;
  const analisis = await analizarRendimientoGrupo({
    paraleloNombre: paralelo.nombre,
    materia: paralelo.materia,
    promedioGeneral,
    porcentajeAprobados,
    estudiantesEnRiesgo: enRiesgo,
    actividadesCriticas: actividades.slice(0, 2).map((a) => ({ titulo: a.titulo, promedio: 6.8 }))
  });
  res.json({
    success: true,
    analisis
  });
});
app.post("/api/calificaciones/analisis-ia", (req, res) => {
  return app._router.handle({ ...req, url: "/api/ai/analisis-rendimiento" }, res, () => {
  });
});
app.post("/api/ai/informe", async (req, res) => {
  const { paraleloNombre, periodo } = req.body;
  const informe = await generarInformeInstitucional({
    docenteNombre: DOCENTE_ACTUAL.nombre,
    institucion: DOCENTE_ACTUAL.institucion,
    paraleloNombre: paraleloNombre || '8vo EGB "A"',
    materia: "Lengua y Literatura",
    periodo: periodo || "Primer Quimestre - Parcial 2",
    promedio: 8.24,
    porcentajeAsistencia: 94.6
  });
  res.json({ success: true, informe });
});
app.post("/api/workspace/informe-oficial", (req, res) => {
  return app._router.handle({ ...req, url: "/api/ai/informe" }, res, () => {
  });
});
app.get("/api/planificacion", (_req, res) => {
  res.json({
    success: true,
    planificaciones: planificacionesState
  });
});
app.post("/api/planificacion/generar-ia", async (req, res) => {
  const { materia, bloque, destreza, nivel, semanas } = req.body;
  const plan = await generarPlanificacionCurricular({
    materia: materia || "Lengua y Literatura",
    bloque: bloque || 2,
    destreza: destreza || "LL.4.2.1. Utilizar recursos de la comunicaci\xF3n oral en contextos de intercambio social",
    nivel: nivel || "8vo EGB Superior",
    semanas: Number(semanas) || 4
  });
  res.json({
    success: true,
    plan
  });
});
app.post("/api/planificacion", (req, res) => {
  const nuevoPlan = {
    id: `plan-${Date.now()}`,
    progreso: 0,
    estado: "Por iniciar",
    generadaIA: true,
    ...req.body
  };
  planificacionesState.push(nuevoPlan);
  res.status(201).json({
    success: true,
    plan: nuevoPlan
  });
});
app.get("/api/workspace", (_req, res) => {
  res.json({
    success: true,
    kanbanTasks,
    plantillas: PLANTILLAS_MINEDUC2,
    actividades: actividadesState,
    documentos: documentosState
  });
});
app.get("/api/workspace/kanban", (_req, res) => {
  res.json({ success: true, kanbanTasks });
});
app.post("/api/workspace/kanban", (req, res) => {
  const { titulo, descripcion, paralelo, columna, prioridad, urgencia, fechaLimite, observaciones } = req.body;
  const nuevaTarea = {
    id: `kb-${Date.now()}`,
    titulo: titulo || "Nueva tarea docente",
    descripcion: descripcion || "",
    paralelo: paralelo || "General",
    columna: columna || "Por hacer",
    prioridad: prioridad || urgencia || "Media",
    urgencia: urgencia || prioridad || "Media",
    fecha: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    fechaLimite: fechaLimite || "",
    observaciones: observaciones || "",
    adjuntos: []
  };
  kanbanTasks.unshift(nuevaTarea);
  res.status(201).json({ success: true, tarea: nuevaTarea });
});
app.put("/api/workspace/kanban/:id", (req, res) => {
  const { id } = req.params;
  const index = kanbanTasks.findIndex((t) => t.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Tarea no encontrada" });
  }
  kanbanTasks[index] = {
    ...kanbanTasks[index],
    ...req.body
  };
  res.json({ success: true, tarea: kanbanTasks[index] });
});
app.delete("/api/workspace/kanban/:id", (req, res) => {
  const { id } = req.params;
  kanbanTasks = kanbanTasks.filter((t) => t.id !== id);
  res.json({ success: true, message: "Tarea eliminada" });
});
app.get("/api/workspace/documentos", async (_req, res) => {
  if (isMongoConnected()) {
    try {
      const docs = await Documento_default.find().sort({ createdAt: -1 });
      if (docs && docs.length > 0) {
        return res.json({
          success: true,
          documentos: docs.map((d) => ({
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
      console.warn("Error obteniendo documentos de MongoDB:", err);
    }
  }
  res.json({ success: true, documentos: documentosState });
});
app.post("/api/workspace/documentos", async (req, res) => {
  const { nombre, categoria, descripcion, tamano, tipo, contenidoBase64 } = req.body;
  const nuevoDoc = {
    id: `doc-${Date.now()}`,
    nombre: nombre || "Documento_Docente.pdf",
    categoria: categoria || "Personal",
    descripcion: descripcion || "Documento administrativo o pedag\xF3gico",
    tamano: tamano || "120 KB",
    tipo: tipo || "PDF",
    fechaSubida: (/* @__PURE__ */ new Date()).toLocaleDateString("es-EC"),
    contenidoBase64: contenidoBase64 || ""
  };
  documentosState.unshift(nuevoDoc);
  if (isMongoConnected()) {
    try {
      await Documento_default.create({
        nombre: nuevoDoc.nombre,
        categoria: nuevoDoc.categoria,
        descripcion: nuevoDoc.descripcion,
        tamano: nuevoDoc.tamano,
        tipo: nuevoDoc.tipo,
        fechaSubida: nuevoDoc.fechaSubida,
        contenidoBase64: nuevoDoc.contenidoBase64
      });
    } catch (err) {
      console.warn("Error guardando documento en MongoDB:", err);
    }
  }
  res.status(201).json({ success: true, documento: nuevoDoc });
});
app.get("/api/workspace/documentos/:id/descargar", async (req, res) => {
  const { id } = req.params;
  let doc = documentosState.find((d) => d.id === id);
  if (!doc && isMongoConnected()) {
    try {
      doc = await Documento_default.findById(id);
    } catch (err) {
    }
  }
  if (!doc) {
    return res.status(404).json({ success: false, error: "Documento no encontrado" });
  }
  res.json({
    success: true,
    nombre: doc.nombre,
    tipo: doc.tipo,
    contenidoBase64: doc.contenidoBase64
  });
});
app.delete("/api/workspace/documentos/:id", async (req, res) => {
  const { id } = req.params;
  documentosState = documentosState.filter((d) => d.id !== id);
  if (isMongoConnected()) {
    try {
      await Documento_default.findByIdAndDelete(id);
    } catch (err) {
    }
  }
  res.json({ success: true, message: "Documento eliminado correctamente" });
});

// api/index.ts
var index_default = app;
export {
  index_default as default
};
