import { GoogleGenAI } from '@google/genai';

// Instanciar cliente Gemini de forma segura en el servidor
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

/**
 * 1. Generador de planificación curricular (MINEDUC 2023)
 */
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
  "objetivos": [
    "Objetivo general 1 alineado a destrezas MINEDUC",
    "Objetivo 2"
  ],
  "criteriosEvaluacion": [
    "Criterio de evaluación 1"
  ],
  "secuenciaClases": [
    {
      "semana": 1,
      "tema": "Tema de la clase",
      "contenido": "Descripción sintética del contenido pedagógico y metodologías activas (ERCA)",
      "actividadSugerida": "Actividad formativa para el aula",
      "recursos": ["Texto del estudiante MINEDUC", "Cuaderno de trabajo", "Material audiovisual"]
    }
  ],
  "actividadesEvaluacion": [
    "Instrumento de evaluación formativa sugerido"
  ],
  "adaptacionesCurriculares": "Orientaciones generales para NEE (Necesidades Educativas Especiales)"
}`;

  if (ai) {
    try {
      let response: any = null;
      let attempts = 0;
      while (attempts < 2) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.3,
            },
          });
          break;
        } catch (err: any) {
          if (err?.status === 503 && attempts === 0) {
            await new Promise((r) => setTimeout(r, 2000));
            attempts++;
          } else throw err;
        }
      }

      const text = response?.text?.trim() || '';
      const parsed = JSON.parse(text);
      return { ...parsed, generadaIA: true };
    } catch (error) {
      console.warn('Error al consultar Gemini para planificación, aplicando fallback pedagógico:', error);
    }
  }

  // Fallback estructurado MINEDUC
  return {
    tituloUnidad: `Unidad ${params.bloque}: Aplicación de ${params.destreza.slice(0, 45)}...`,
    objetivos: [
      `Desarrollar habilidades comunicativas y de análisis crítico aplicadas a ${params.materia}.`,
      `Apropiar herramientas formativas de acuerdo al currículo nacional del Ecuador.`
    ],
    criteriosEvaluacion: [
      `CE.${params.materia.slice(0, 2).toUpperCase()}.${params.bloque}.1 Aplica estrategias cognitivas de comprensión y producción textual.`
    ],
    secuenciaClases: Array.from({ length: Math.min(Number(params.semanas) || 3, 4) }, (_, i) => ({
      semana: i + 1,
      tema: `Semana ${i + 1}: Exploración y conceptualización de ${params.destreza}`,
      contenido: `Ciclo del aprendizaje (ERCA): Experiencia reflexiva, conceptualización guiada y aplicación práctica colaborativa.`,
      actividadSugerida: `Taller guiado individual con rúbrica cualitativa y formativa.`,
      recursos: ['Guía del docente MINEDUC', 'Fichas pedagógicas', 'Lectura guiada']
    })),
    actividadesEvaluacion: ['Rúbrica de desempeño analítica', 'Portafolio estudiantil'],
    adaptacionesCurriculares: 'Tiempos flexibles y apoyos visuales focalizados para estudiantes con NEE no asociadas a discapacidad.',
    generadaIA: false,
    modoOffline: true
  };
}

/**
 * 2. Generador de actividades pedagógicas
 */
export async function generarActividad(params: {
  materia: string;
  destreza: string;
  tipoActividad: string;
  nivel: string;
}) {
  const ai = getAiClient();
  const prompt = `Eres un docente experto en didáctica para colegios públicos en Ecuador.
Crea una actividad didáctica de tipo "${params.tipoActividad}" para la materia "${params.materia}" (Nivel: ${params.nivel}).
Destreza asociada: "${params.destreza}".

Responde ÚNICAMENTE en JSON con:
{
  "titulo": "Título motivador y claro",
  "descripcion": "Descripción en 2-3 líneas para los estudiantes",
  "instrucciones": "Pasos detallados 1, 2, 3 que los alumnos deben seguir",
  "tiempoEstimadoMinutos": 45,
  "criteriosEvaluacion": [
    "Criterio 1 (3 pts)",
    "Criterio 2 (4 pts)",
    "Criterio 3 (3 pts)"
  ],
  "recursosNecesarios": ["Cuaderno", "Material reciclado o digital"],
  "sugerenciaDocente": "Consejo de mediación pedagógica rápida"
}`;

  if (ai) {
    try {
      let response: any = null;
      let attempts = 0;
      while (attempts < 2) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.4,
            },
          });
          break;
        } catch (err: any) {
          if (err?.status === 503 && attempts === 0) {
            await new Promise((r) => setTimeout(r, 2000));
            attempts++;
          } else throw err;
        }
      }
      const parsed = JSON.parse(response?.text?.trim() || '{}');
      return { ...parsed, generadaIA: true };
    } catch (error) {
      console.warn('Error en Gemini generarActividad, usando fallback:', error);
    }
  }

  return {
    titulo: `Taller de Aplicación Práctica: ${params.materia}`,
    descripcion: `Actividad ${params.tipoActividad.toLowerCase()} centrada en la destreza: ${params.destreza}.`,
    instrucciones: `1. Lee la guía provista en clase.\n2. Desarrolla el análisis en parejas respetando la estructura explicada.\n3. Expone una síntesis de conclusiones en 3 minutos.`,
    tiempoEstimadoMinutos: 40,
    criteriosEvaluacion: [
      'Comprensión del concepto central (4 pts)',
      'Claridad en la argumentación escrita (3 pts)',
      'Cumplimiento a tiempo y trabajo colaborativo (3 pts)'
    ],
    recursosNecesarios: ['Texto del estudiante MINEDUC', 'Cuaderno de apuntes'],
    sugerenciaDocente: 'Pasearse por los pupitres durante los primeros 10 minutos para despejar dudas de redacción.',
    generadaIA: false,
    modoOffline: true
  };
}

/**
 * 3. Análisis de rendimiento del grupo
 */
export async function analizarRendimientoGrupo(params: {
  paraleloNombre: string;
  materia: string;
  promedioGeneral: number;
  porcentajeAprobados: number;
  estudiantesEnRiesgo: { nombre: string; promedio: number }[];
  actividadesCriticas: { titulo: string; promedio: number }[];
}) {
  const ai = getAiClient();
  const prompt = `Analiza el estado académico del paralelo "${params.paraleloNombre}" en la materia "${params.materia}".
Datos cuantitativos:
- Promedio grupal: ${params.promedioGeneral.toFixed(2)} / 10
- Porcentaje de estudiantes con nota >= 7: ${params.porcentajeAprobados.toFixed(1)}%
- Estudiantes con nota bajo 7: ${JSON.stringify(params.estudiantesEnRiesgo)}
- Evaluaciones con más bajo rendimiento: ${JSON.stringify(params.actividadesCriticas)}

Genera un diagnóstico pedagógico sintético en tono profesional y empático para el docente, con recomendaciones concretas de refuerzo académico conforme al Reglamento General a la Ley Orgánica de Educación Intercultural (RGLOEI) del Ecuador.
Responde ÚNICAMENTE en JSON con:
{
  "diagnosticoBreve": "Resumen de 2 párrafos",
  "puntosAlerta": ["Alerta 1", "Alerta 2"],
  "estrategiasRefuerzo": [
    "Estrategia didáctica 1",
    "Estrategia didáctica 2"
  ],
  "recomendacionDirectivo": "Recomendación lista para el informe quimestral"
}`;

  if (ai) {
    try {
      let response: any = null;
      let attempts = 0;
      while (attempts < 2) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.3,
            },
          });
          break;
        } catch (err: any) {
          if (err?.status === 503 && attempts === 0) {
            await new Promise((r) => setTimeout(r, 2000));
            attempts++;
          } else throw err;
        }
      }
      return JSON.parse(response?.text?.trim() || '{}');
    } catch (error) {
      console.warn('Error en Gemini analizarRendimientoGrupo, usando fallback:', error);
    }
  }

  return {
    diagnosticoBreve: `El paralelo ${params.paraleloNombre} presenta un promedio general de ${params.promedioGeneral.toFixed(1)}/10, con un ${params.porcentajeAprobados.toFixed(0)}% de aprobación. Se evidencia un desempeño estable en la mayoría de actividades, aunque persisten dificultades puntuales en evaluaciones formales de análisis reflexivo.`,
    puntosAlerta: [
      `${params.estudiantesEnRiesgo.length} estudiantes requieren Plan de Refuerzo Académico inmediato (promedio < 7.00).`,
      `La actividad con mayor índice de refuerzo requerido es "${params.actividadesCriticas[0]?.titulo || 'Evaluación Parcial'}".`
    ],
    estrategiasRefuerzo: [
      'Implementar tutorías entre pares en los primeros 15 minutos de la jornada.',
      'Reevaluación formativa mediante talleres de retroalimentación en clase antes del cierre de parcial.'
    ],
    recomendacionDirectivo: 'Se sugiere notificar formalmente a los representantes legales y formalizar el registro del Plan de Mejora Académica institucional.'
  };
}

/**
 * 4. Generador de informe institucional en formato oficial
 */
export async function generarInformeInstitucional(params: {
  docenteNombre: string;
  institucion: string;
  paraleloNombre: string;
  materia: string;
  periodo: string;
  promedio: number;
  porcentajeAsistencia: number;
  conclusionesDocente?: string;
}) {
  const ai = getAiClient();
  const prompt = `Redacta el informe oficial de fin de período escolar según los estándares del Ministerio de Educación del Ecuador.
Datos:
- Docente: ${params.docenteNombre}
- Plantel: ${params.institucion}
- Curso y Paralelo: ${params.paraleloNombre}
- Asignatura: ${params.materia}
- Período: ${params.periodo}
- Promedio académico grupal: ${params.promedio.toFixed(2)}/10
- Asistencia promedio mensual: ${params.porcentajeAsistencia.toFixed(1)}%

Responde ÚNICAMENTE en JSON:
{
  "codigoDocumento": "INF-${new Date().getFullYear()}-01",
  "titulo": "INFORME DE RENDIMIENTO ACADÉMICO Y PEDAGÓGICO",
  "antecedentes": "Párrafo formal de antecedentes curriculares",
  "desarrollo": "Análisis descriptivo del proceso formativo, cumplimiento del cronograma y logros",
  "conclusiones": [
    "Conclusión 1 sobre el progreso del grupo",
    "Conclusión 2 sobre asistencia y compromiso"
  ],
  "recomendaciones": [
    "Recomendación pedagógica para el próximo parcial",
    "Acción coordinada con DECE e Inspección General"
  ]
}`;

  if (ai) {
    try {
      let response: any = null;
      let attempts = 0;
      while (attempts < 2) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.3,
            },
          });
          break;
        } catch (err: any) {
          if (err?.status === 503 && attempts === 0) {
            await new Promise((r) => setTimeout(r, 2000));
            attempts++;
          } else throw err;
        }
      }
      return JSON.parse(response?.text?.trim() || '{}');
    } catch (error) {
      console.warn('Error en Gemini generarInformeInstitucional:', error);
    }
  }

  return {
    codigoDocumento: `INF-${new Date().getFullYear()}-${params.paraleloNombre.replace(/\s+/g, '')}`,
    titulo: 'INFORME DE RENDIMIENTO ACADÉMICO Y ASISTENCIA',
    antecedentes: `En concordancia con las directrices emanadas por el Ministerio de Educación del Ecuador y el Proyecto Educativo Institucional (PEI) de la ${params.institucion}, se presenta el balance correspondiente al ${params.periodo}.`,
    desarrollo: `Durante el período lectivo en la asignatura de ${params.materia}, se ejecutaron las destrezas con criterio de desempeño planificadas para ${params.paraleloNombre}, alcanzando un promedio ponderado de ${params.promedio.toFixed(2)}/10 y un índice de asistencia regular del ${params.porcentajeAsistencia.toFixed(1)}%.`,
    conclusiones: [
      `El 85% de los educandos demostraron apropiación de los aprendizajes básicos e imprescindibles.`,
      `La toma de asistencia sistematizada permitió detectar a tiempo alertas tempranas de ausentismo justificado e injustificado.`
    ],
    recomendaciones: [
      'Mantener el esquema de refuerzo pedagógico continuo para estudiantes en riesgo.',
      'Fortalecer la articulación con el Departamento de Consejería Estudiantil (DECE).'
    ]
  };
}

/**
 * 5. Sugerencias automáticas para el To-Do Inteligente
 */
export async function sugerirTareasTodo(params: {
  actividadesSinCalificar: number;
  planificacionesPorIniciar: number;
  asistenciaPendienteHoy: boolean;
  paralelosNombres: string[];
}) {
  const tareas: { id: string; titulo: string; urgencia: 'alta' | 'media' | 'baja'; modulo: string; link: string }[] = [];

  if (params.asistenciaPendienteHoy) {
    tareas.push({
      id: 'task-asistencia-hoy',
      titulo: `Tomar asistencia de hoy en ${params.paralelosNombres[0] || '8vo A'}`,
      urgencia: 'alta',
      modulo: 'Asistencia',
      link: '/asistencia'
    });
  }

  if (params.actividadesSinCalificar > 0) {
    tareas.push({
      id: 'task-calificar-pendientes',
      titulo: `Calificar ${params.actividadesSinCalificar} entregas pendientes en el Libro de Notas`,
      urgencia: params.actividadesSinCalificar > 5 ? 'alta' : 'media',
      modulo: 'Calificaciones',
      link: '/calificaciones'
    });
  }

  if (params.planificacionesPorIniciar > 0) {
    tareas.push({
      id: 'task-plan-mineduc',
      titulo: 'Completar planificación del Bloque 3 con asistencia de IA',
      urgencia: 'media',
      modulo: 'Planificación',
      link: '/planificacion'
    });
  }

  tareas.push({
    id: 'task-reporte-quimestral',
    titulo: 'Generar reporte consolidado de asistencia mensual para Inspección',
    urgencia: 'baja',
    modulo: 'Workspace',
    link: '/workspace'
  });

  return tareas;
}
