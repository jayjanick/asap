import express, { Request, Response } from 'express';
import cors from 'cors';
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

export const app = express();

app.use(cors());
app.use(express.json());

// In-memory state store mirroring MongoDB state for instant and reliable execution
let paralelosState = JSON.parse(JSON.stringify(PARALELOS_INICIALES));
let actividadesState = JSON.parse(JSON.stringify(ACTIVIDADES_INICIALES));
let planificacionesState = JSON.parse(JSON.stringify(PLANIFICACIONES_MINEDUC));
let kanbanTasks = [
  { id: 'kb-1', titulo: 'Revisar borradores de crónica barrial', paralelo: '8vo A', columna: 'En progreso', prioridad: 'Alta', fecha: '2026-10-24' },
  { id: 'kb-2', titulo: 'Subir calificaciones Parcial 1 al sistema', paralelo: '9no B', columna: 'Por hacer', prioridad: 'Urgente', fecha: '2026-10-25' },
  { id: 'kb-3', titulo: 'Convocatoria a reunión de representantes', paralelo: '8vo A', columna: 'Completado', prioridad: 'Media', fecha: '2026-10-21' },
  { id: 'kb-4', titulo: 'Preparar material para el bloque 3', paralelo: '8vo A', columna: 'Por hacer', prioridad: 'Baja', fecha: '2026-10-30' }
];

// Matriz de notas por paralelo
// Map: [paraleloId][estudianteId][actividadId] = nota
let calificacionesMatrix: Record<string, Record<string, Record<string, number>>> = {};

function initCalificaciones() {
  paralelosState.forEach((p: any) => {
    calificacionesMatrix[p.id] = {};
    const acts = actividadesState.filter((a: any) => a.paraleloId === p.id);
    p.estudiantes.forEach((est: any) => {
      calificacionesMatrix[p.id][est.id] = {};
      acts.forEach((act: any, idx: number) => {
        // Base de notas consistente
        const seed = (est.numeroLista * 7 + idx * 13) % 10;
        let nota = 7.0 + (seed / 10) * 2.8;
        if (est.numeroLista === 5 || est.numeroLista === 13) nota = 5.5 + (seed % 3) * 0.4;
        calificacionesMatrix[p.id][est.id][act.id] = Number(nota.toFixed(2));
      });
    });
  });
}
initCalificaciones();

// ==========================================
// 1. HEALTH & METADATA
// ==========================================
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'asap',
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
  });
});

// ==========================================
// 2. AUTHENTICATION (JWT + Demo login)
// ==========================================
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  // En MVP permitimos ingreso con cualquier credencial o las de Andrés Morales
  const user = {
    ...DOCENTE_ACTUAL,
    email: email || DOCENTE_ACTUAL.email,
  };

  const token = 'asap-jwt-demo-token-' + Buffer.from(user.email).toString('base64');
  res.json({
    success: true,
    token,
    user,
    message: 'Sesión iniciada correctamente'
  });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { nombre, email, institucion, cursos } = req.body;
  res.status(201).json({
    success: true,
    message: 'Docente registrado exitosamente',
    user: {
      ...DOCENTE_ACTUAL,
      nombre: nombre || 'Docente Registrado',
      email: email || 'docente@asap.ec',
      institucion: institucion || 'Unidad Educativa Fiscal',
    },
    cursosRegistrados: cursos || []
  });
});

app.get('/api/auth/me', (_req: Request, res: Response) => {
  res.json({ success: true, user: DOCENTE_ACTUAL });
});

// ==========================================
// 3. DASHBOARD (Panel Diario)
// ==========================================
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
      claseActual: {
        paralelo: '8vo EGB "A"',
        materia: 'Lengua y Literatura',
        aula: 'Bloque B · Aula 204',
        horario: '07:15 a 08:45',
        tema: 'Estructura y conectores en el ensayo argumentativo'
      },
      proximaClase: {
        paralelo: '9no EGB "B"',
        materia: 'Lengua y Literatura',
        horario: '10:00 a 11:30',
        tema: 'Métrica y recursos estilísticos'
      }
    },
    estadisticas: {
      totalEstudiantes: 60,
      actividadesPorCalificar: actividadesPendientes,
      clasesPlanificadasSemana: 12,
      asistenciaPromedioMes: 94.2,
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

  // Generar datos de asistencia de hoy si existen o inicializar en P
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
    } else if (idx === 19 && !paralelo.asistenciaHoyRegistrada) {
      estado = 'P';
    }

    return {
      estudianteId: est.id,
      nombre: est.nombre,
      numeroLista: est.numeroLista,
      cedula: est.cedula,
      estado,
      justificada,
      motivo
    };
  });

  res.json({
    success: true,
    paralelo,
    fecha: new Date().toISOString().slice(0, 10),
    asistenciaHoy
  });
});

app.post('/api/asistencia/:cursoId', (req: Request, res: Response) => {
  const { registros, observacionGeneral } = req.body;
  const index = paralelosState.findIndex((p: any) => p.id === req.params.cursoId);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Paralelo no encontrado' });
  }

  paralelosState[index].asistenciaHoyRegistrada = true;
  
  // Actualizar estadísticas individuales
  if (Array.isArray(registros)) {
    registros.forEach((reg: any) => {
      const est = paralelosState[index].estudiantes.find((e: any) => e.id === reg.estudianteId);
      if (est) {
        if (reg.estado === 'F') {
          if (reg.justificada) est.faltasJustificadas++;
          else est.faltasInjustificadas++;
        } else if (reg.estado === 'A') {
          est.atrasos++;
        }
      }
    });
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
  const paralelo = paralelosState.find((p: any) => p.id === req.params.cursoId);
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
    estado: 'En curso',
    bloque: 2
  };

  actividadesState.push(nuevaActividad);

  // Inicializar nota en 0 para todos
  if (calificacionesMatrix[paraleloId]) {
    Object.keys(calificacionesMatrix[paraleloId]).forEach((estId) => {
      calificacionesMatrix[paraleloId][estId][nuevaActividad.id] = 7.0;
    });
  }

  res.status(201).json({
    success: true,
    actividad: nuevaActividad
  });
});

app.post('/api/calificaciones/analisis-ia', async (req: Request, res: Response) => {
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
// 7. WORKSPACE & INFORMES
// ==========================================
app.get('/api/workspace', (_req: Request, res: Response) => {
  res.json({
    success: true,
    kanbanTasks,
    plantillas: PLANTILLAS_MINEDUC,
    actividades: actividadesState
  });
});

app.post('/api/workspace/actividad-ia', async (req: Request, res: Response) => {
  const { materia, destreza, tipoActividad, nivel } = req.body;
  const actividad = await generarActividad({
    materia: materia || 'Lengua y Literatura',
    destreza: destreza || 'LL.4.1.1. Cultura escrita y sociedad',
    tipoActividad: tipoActividad || 'Individual',
    nivel: nivel || '8vo EGB'
  });

  res.json({ success: true, actividad });
});

app.post('/api/workspace/tarea', (req: Request, res: Response) => {
  const { titulo, paralelo, prioridad } = req.body;
  const nuevaTarea = {
    id: `kb-${Date.now()}`,
    titulo: titulo || 'Nueva tarea docente',
    paralelo: paralelo || 'General',
    columna: 'Por hacer',
    prioridad: prioridad || 'Media',
    fecha: new Date().toISOString().slice(0, 10)
  };
  kanbanTasks.push(nuevaTarea);
  res.status(201).json({ success: true, tarea: nuevaTarea });
});

app.post('/api/workspace/informe-oficial', async (req: Request, res: Response) => {
  const { paraleloNombre, periodo } = req.body;
  const informe = await generarInformeInstitucional({
    docenteNombre: DOCENTE_ACTUAL.nombre,
    institucion: DOCENTE_ACTUAL.institucion,
    paraleloNombre: paraleloNombre || '8vo EGB "A"',
    materia: 'Lengua y Literatura',
    periodo: periodo || 'Primer Quimestre',
    promedio: 8.24,
    porcentajeAsistencia: 94.6
  });

  res.json({ success: true, informe });
});

export default app;
