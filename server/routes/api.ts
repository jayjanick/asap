import express, { Request, Response } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import {
  DOCENTE_ACTUAL,
  PARALELOS_INICIALES,
  ACTIVIDADES_INICIALES,
  PLANIFICACIONES_MINEDUC,
  PLANTILLAS_MINEDUC
} from '../../client/src/data/mockData';
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

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Conexión asíncrona a MongoDB Atlas con fallback en memoria
connectDB().then((connected) => {
  if (connected) {
    seedDatabase(false);
  }
});

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
  const { email, password } = req.body;

  let user = { ...DOCENTE_ACTUAL };
  if (email) {
    user.email = email;
  }

  // Si Mongo está conectado, consultar usuario
  if (isMongoConnected() && email) {
    try {
      const dbUser = await Usuario.findOne({ email: email.toLowerCase() });
      if (dbUser) {
        user = {
          ...user,
          nombre: dbUser.nombre,
          email: dbUser.email,
          rol: dbUser.rol,
          institucion: dbUser.institucion,
          materias: dbUser.materias
        };
      }
    } catch (err) {
      console.warn('Error leyendo usuario en MongoDB:', err);
    }
  }

  const token = jwt.sign(
    {
      id: user.id || 'docente-1',
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      institucion: user.institucion
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    token,
    user,
    message: 'Sesión iniciada correctamente'
  });
});

app.post('/api/auth/google', async (req: Request, res: Response) => {
  const { credential, email, nombre, avatar } = req.body;

  // Manejo de Google OAuth real o simulación
  const user = {
    ...DOCENTE_ACTUAL,
    nombre: nombre || 'Lic. Andrés Morales',
    email: email || 'andres.morales@uefdemocracia.edu.ec',
    avatar: avatar || 'https://picsum.photos/seed/google_avatar/150/150'
  };

  const token = jwt.sign(
    {
      id: user.id || 'docente-1',
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

app.get('/api/auth/me', (req: Request, res: Response) => {
  const userPayload = getUserFromToken(req);
  if (userPayload) {
    return res.json({
      success: true,
      user: {
        ...DOCENTE_ACTUAL,
        ...userPayload
      }
    });
  }
  // Fallback demo
  res.json({ success: true, user: DOCENTE_ACTUAL });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { nombre, email, institucion, cursos } = req.body;
  const user = {
    ...DOCENTE_ACTUAL,
    nombre: nombre || 'Docente Registrado',
    email: email || 'docente@asap.ec',
    institucion: institucion || 'Unidad Educativa Fiscal',
  };

  const token = jwt.sign(
    {
      id: 'docente-new',
      email: user.email,
      nombre: user.nombre,
      rol: 'Docente',
      institucion: user.institucion
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    success: true,
    message: 'Docente registrado exitosamente',
    token,
    user,
    cursosRegistrados: cursos || []
  });
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
// 4. ASISTENCIA
// ==========================================
app.get('/api/asistencia', (_req: Request, res: Response) => {
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
app.get('/api/calificaciones/:cursoId', (req: Request, res: Response) => {
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
        return res.json({ success: true, documentos: docs });
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
