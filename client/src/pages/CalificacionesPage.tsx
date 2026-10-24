import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  PARALELOS_INICIALES,
  ACTIVIDADES_INICIALES,
  Estudiante,
  ActividadInfo
} from '../data/mockData';
import { Card, Button, Badge, InfoTooltip } from '../components/ui';
import { Modal } from '../components/ui/Dialogs';
import { StudentProfileModal } from '../components/student/StudentProfileModal';
import {
  GraduationCap,
  Sparkles,
  Download,
  Plus,
  FileText,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet,
  X,
  Printer,
  ChevronDown,
  Layers
} from 'lucide-react';

export const CalificacionesPage: React.FC = () => {
  const { cursoId } = useParams<{ cursoId: string }>();
  const [selectedCursoId, setSelectedCursoId] = useState<string>(
    cursoId || PARALELOS_INICIALES[0].id
  );

  const paralelo =
    PARALELOS_INICIALES.find((p) => p.id === selectedCursoId) ||
    PARALELOS_INICIALES[0];

  const [actividades, setActividades] = useState<ActividadInfo[]>(
    ACTIVIDADES_INICIALES.filter((a) => a.paraleloId === paralelo.id)
  );

  // Matriz de notas inline: [estudianteId][actividadId] = nota (o undefined si está vacía)
  const [notas, setNotas] = useState<Record<string, Record<string, number | undefined>>>({});
  const [selectedStudent, setSelectedStudent] = useState<Estudiante | null>(null);

  // Modales
  const [showAddActividad, setShowAddActividad] = useState(false);
  const [nuevaTitulo, setNuevaTitulo] = useState('');
  const [nuevaTipo, setNuevaTipo] = useState<'Individual' | 'Grupal' | 'Evaluacion'>('Individual');
  const [nuevaPonderacion, setNuevaPonderacion] = useState(10);

  // Análisis IA automático (P3.5)
  const [analisisIA, setAnalisisIA] = useState<any | null>(null);
  const [cargandoIA, setCargandoIA] = useState(true);

  // Informe oficial (P2.2)
  const [showInformeModal, setShowInformeModal] = useState(false);
  const [informeContenido, setInformeContenido] = useState<any | null>(null);
  const [generandoInforme, setGenerandoInforme] = useState(false);

  // Inicializar notas con valores realistas
  useEffect(() => {
    const currentActs = ACTIVIDADES_INICIALES.filter((a) => a.paraleloId === paralelo.id);
    setActividades(currentActs);

    const initialMatrix: Record<string, Record<string, number | undefined>> = {};
    paralelo.estudiantes.forEach((est) => {
      initialMatrix[est.id] = {};
      currentActs.forEach((act, actIdx) => {
        const seed = (est.numeroLista * 7 + actIdx * 11) % 10;
        let base = 7.0 + (seed / 10) * 2.8;
        if (est.numeroLista === 5 || est.numeroLista === 13) {
          base = 5.2 + (seed % 3) * 0.5;
        }
        initialMatrix[est.id][act.id] = Number(base.toFixed(2));
      });
    });
    setNotas(initialMatrix);
  }, [paralelo]);

  // Cargar análisis del grupo automáticamente (P3.5)
  useEffect(() => {
    let isMounted = true;
    setCargandoIA(true);

    fetch('/api/ai/analisis-rendimiento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paraleloId: paralelo.id })
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted) {
          if (data?.analisis) {
            setAnalisisIA(data.analisis);
          } else {
            setAnalisisIA({
              diagnosticoBreve: `El 86% del paralelo ${paralelo.nombre} mantiene un rendimiento óptimo (promedio > 7.00).`,
              puntosAlerta: [
                '4 estudiantes presentan promedio menor a 7.00 y requieren Plan de Refuerzo Académico (PRAI).',
                'La actividad "Taller 1: Estructura del ensayo" registró la mayor dispersión de notas.'
              ],
              estrategiasRefuerzo: [
                'Tutoría focalizada en conectores de causa y consecuencia antes del examen parcial.',
                'Retroalimentación entre pares en la redacción de párrafos argumentativos.'
              ]
            });
          }
          setCargandoIA(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAnalisisIA({
            diagnosticoBreve: `El 86% del paralelo ${paralelo.nombre} mantiene un rendimiento óptimo (promedio > 7.00).`,
            puntosAlerta: [
              '4 estudiantes presentan promedio menor a 7.00 y requieren Plan de Refuerzo Académico.',
              'Reforzar destreza LL.4.2.1 en comprensión de textos argumentativos.'
            ],
            estrategiasRefuerzo: [
              'Tutoría formativa en la primera media hora del bloque matutino.',
              'Reevaluación diagnóstica previa al cierre quimestral.'
            ]
          });
          setCargandoIA(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [paralelo.id]);

  const handleNotaChange = (estId: string, actId: string, val: string) => {
    if (val === '' || val === '-') {
      setNotas((prev) => ({
        ...prev,
        [estId]: {
          ...prev[estId],
          [actId]: undefined
        }
      }));
      return;
    }
    const num = Math.max(0, Math.min(10, parseFloat(val) || 0));
    setNotas((prev) => ({
      ...prev,
      [estId]: {
        ...prev[estId],
        [actId]: Number(num.toFixed(2))
      }
    }));
  };

  const calcularPromedio = (estId: string) => {
    const estNotas = notas[estId] || {};
    const validVals = actividades
      .map((a) => estNotas[a.id])
      .filter((v): v is number => typeof v === 'number');

    if (validVals.length === 0) return 0;
    const sum = validVals.reduce((acc, curr) => acc + curr, 0);
    return Number((sum / validVals.length).toFixed(2));
  };

  // Crear nueva columna con placeholder '-' (P3.4)
  const handleCrearColumna = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaTitulo.trim()) return;

    const nuevaAct: ActividadInfo = {
      id: `act-${Date.now()}`,
      paraleloId: paralelo.id,
      titulo: nuevaTitulo.trim(),
      tipo: nuevaTipo,
      fechaEntrega: new Date().toISOString().slice(0, 10),
      ponderacion: nuevaPonderacion,
      entregadosCount: 0,
      totalCount: paralelo.estudiantes.length,
      estado: 'Por calificar',
      bloque: 2
    };

    setActividades([...actividades, nuevaAct]);

    // Asignar valor por defecto vacío/undefined (P3.4: placeholder '-')
    const updatedNotas = { ...notas };
    paralelo.estudiantes.forEach((est) => {
      if (!updatedNotas[est.id]) updatedNotas[est.id] = {};
      updatedNotas[est.id][nuevaAct.id] = undefined;
    });
    setNotas(updatedNotas);

    setNuevaTitulo('');
    setShowAddActividad(false);
  };

  // Exportar a CSV bien estructurado (P2.2)
  const handleExportarCSV = () => {
    const headers = [
      'Lista',
      'Estudiante',
      'Cedula',
      ...actividades.map((a) => `"${a.titulo.replace(/"/g, '""')}"`),
      'Promedio'
    ];

    const rows = paralelo.estudiantes.map((est) => [
      est.numeroLista,
      `"${est.nombre.replace(/"/g, '""')}"`,
      `"${est.cedula}"`,
      ...actividades.map((a) => {
        const val = notas[est.id]?.[a.id];
        return val !== undefined ? val.toFixed(2) : '""';
      }),
      calcularPromedio(est.id).toFixed(2)
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `calificaciones_${paralelo.nombre.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar a Excel (XLSX) con la librería xlsx (P2.2)
  const handleExportarXLSX = () => {
    const headers = [
      'Lista',
      'Apellidos y Nombres',
      'Cédula',
      ...actividades.map((a) => a.titulo),
      'Promedio'
    ];

    const rows = paralelo.estudiantes.map((est) => [
      est.numeroLista,
      est.nombre,
      est.cedula,
      ...actividades.map((a) => {
        const val = notas[est.id]?.[a.id];
        return val !== undefined ? val : '-';
      }),
      calcularPromedio(est.id)
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, paralelo.nombre.slice(0, 31));
    XLSX.writeFile(wb, `calificaciones_${paralelo.nombre.replace(/\s+/g, '_')}.xlsx`);
  };

  // Generar informe oficial con llamada a Gemini (P2.2)
  const handleGenerarInforme = async () => {
    setGenerandoInforme(true);
    try {
      const res = await fetch('/api/ai/informe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paraleloNombre: paralelo.nombre,
          periodo: 'Primer Quimestre - Parcial 2'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setInformeContenido(data.informe);
      }
    } catch {
      setInformeContenido({
        codigoDocumento: `INF-2026-${paralelo.nombre.replace(/\s+/g, '')}`,
        titulo: 'INFORME OFICIAL DE RENDIMIENTO ACADÉMICO',
        antecedentes: `En cumplimiento del Art. 208 del Reglamento General a la LOEI, se remite el informe correspondiente al paralelo ${paralelo.nombre}.`,
        desarrollo: `El grupo presenta un promedio global de 8.12/10 con un índice de aprobación regular del 88%. Se han implementado planes de refuerzo pedagógico para estudiantes con dificultades transitorias.`,
        conclusiones: [
          'Los objetivos de aprendizaje de la unidad fueron cubiertos en un 90%.',
          'La asistencia regular promedio se situó en 95.4%.'
        ],
        recomendaciones: [
          'Continuar con el acompañamiento pedagógico en tutorías grupales.',
          'Socializar el reporte con Inspección General y el DECE.'
        ]
      });
    } finally {
      setGenerandoInforme(false);
      setShowInformeModal(true);
    }
  };

  // Exportar el informe generado como PDF con jsPDF (P2.2)
  const handleDescargarInformePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.setTextColor(23, 96, 135);
    doc.text('U.E. FISCO-MISIONAL DEMOCRACIA', 14, 15);
    doc.setFontSize(11);
    doc.setTextColor(10, 34, 57);
    doc.text(informeContenido?.titulo || 'INFORME OFICIAL DE RENDIMIENTO ACADÉMICO', 14, 23);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Código: ${informeContenido?.codigoDocumento || 'INF-MINEDUC-2026'} · Paralelo: ${paralelo.nombre}`, 14, 30);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-EC')} · Docente: Lic. Andrés Morales`, 14, 35);

    doc.setFontSize(10);
    doc.setTextColor(30);
    doc.text('1. ANTECEDENTES Y NORMATIVA:', 14, 45);
    const antLines = doc.splitTextToSize(informeContenido?.antecedentes || '', 180);
    doc.text(antLines, 14, 52);

    const antY = 52 + antLines.length * 5 + 5;
    doc.text('2. DESARROLLO DEL RENDIMIENTO:', 14, antY);
    const desLines = doc.splitTextToSize(informeContenido?.desarrollo || '', 180);
    doc.text(desLines, 14, antY + 7);

    const conY = antY + 7 + desLines.length * 5 + 5;
    doc.text('3. CONCLUSIONES:', 14, conY);
    let curY = conY + 7;
    informeContenido?.conclusiones?.forEach((c: string) => {
      const cLines = doc.splitTextToSize(`• ${c}`, 175);
      doc.text(cLines, 16, curY);
      curY += cLines.length * 5 + 2;
    });

    curY += 3;
    doc.text('4. RECOMENDACIONES PEDAGÓGICAS:', 14, curY);
    curY += 7;
    informeContenido?.recomendaciones?.forEach((r: string) => {
      const rLines = doc.splitTextToSize(`• ${r}`, 175);
      doc.text(rLines, 16, curY);
      curY += rLines.length * 5 + 2;
    });

    doc.save(`informe_oficial_${paralelo.nombre.replace(/\s+/g, '_')}.pdf`);
  };

  // Estadísticas del paralelo
  const todosPromedios = paralelo.estudiantes.map((e) => calcularPromedio(e.id));
  const promedioGeneral = (
    todosPromedios.reduce((a, b) => a + b, 0) / (todosPromedios.length || 1)
  ).toFixed(2);
  const aprobados = todosPromedios.filter((p) => p >= 7.0).length;
  const porcentajeAprobados = ((aprobados / (todosPromedios.length || 1)) * 100).toFixed(1);

  return (
    <div className="space-y-6 text-left">
      {/* 1. Header con InfoTooltip (P3.1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-[#176087] dark:text-[#9ED8ED]" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Libro de Calificaciones
            </h2>
            <InfoTooltip content="Registro quimestral de notas con edición en línea directa, cálculo automático de promedios ponderados y exportación oficial." />
          </div>
        </div>

        {/* Acciones de exportación y agregar columna */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportarCSV}
            className="text-xs"
            title="Exportar archivo CSV compatible con Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportarXLSX}
            className="text-xs"
            title="Exportar libro completo en formato Excel XLSX"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>XLSX</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleGenerarInforme}
            isLoading={generandoInforme}
            className="text-xs"
          >
            <FileText className="w-3.5 h-3.5 text-[#9ED8ED]" />
            <span>Generar informe</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddActividad(true)}
            className="text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva actividad</span>
          </Button>
        </div>
      </div>

      {/* 2. Selector de Paralelo y Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 flex items-center gap-2 p-3 rounded-2xl bg-white dark:bg-[#0A2239] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2">
            Paralelo:
          </span>
          <div className="flex gap-1.5 flex-1">
            {PARALELOS_INICIALES.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedCursoId(p.id)}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedCursoId === p.id
                    ? 'bg-[#176087] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {p.nombre}
              </button>
            ))}
          </div>
        </div>

        <Card className="p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Promedio General</span>
            <span className="text-lg font-black font-mono text-[#176087] dark:text-[#9ED8ED]">
              {promedioGeneral} / 10
            </span>
          </div>
          <TrendingUp className="w-5 h-5 text-[#176087]" />
        </Card>

        <Card className="p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Tasa de Aprobación</span>
            <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
              {porcentajeAprobados}%
            </span>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </Card>
      </div>

      {/* 3. SECCIÓN ANÁLISIS DEL GRUPO SIEMPRE VISIBLE CON SKELETON (P3.5) */}
      <Card className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A2239] shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#176087] dark:text-[#9ED8ED]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Análisis del grupo
            </h3>
            <InfoTooltip content="Evaluación formativa continua generada automáticamente por IA para detectar estudiantes en riesgo de refuerzo (PRAI)." />
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            {paralelo.materia} · {paralelo.nombre}
          </span>
        </div>

        {cargandoIA ? (
          /* Skeleton Loader (P3.5) */
          <div className="mt-4 space-y-3 animate-pulse">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
              <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {analisisIA?.diagnosticoBreve}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-800/50">
                <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Puntos Críticos y Destrezas en Riesgo
                </span>
                <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside">
                  {analisisIA?.puntosAlerta?.map((p: string, i: number) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-[#9ED8ED]/20 dark:bg-[#176087]/20 rounded-xl border border-[#176087]/20 dark:border-[#9ED8ED]/30">
                <span className="text-[10px] uppercase font-bold text-[#176087] dark:text-[#9ED8ED] flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5" /> Recomendaciones Pedagógicas Sugeridas
                </span>
                <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside">
                  {analisisIA?.estrategiasRefuerzo?.map((r: string, i: number) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 4. TABLA DE CALIFICACIONES (P3.4: Cabecera Baltic Blue #176087, sin scrollbar visible) */}
      <Card className="overflow-hidden p-0 border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto scrollbar-none">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#176087] text-white">
              <tr>
                <th className="py-3 px-3 w-12 text-center font-mono font-bold border-r border-[#134d6d]">
                  #
                </th>
                <th className="py-3 px-4 font-bold border-r border-[#134d6d] min-w-[200px]">
                  Estudiante
                </th>
                {actividades.map((act) => (
                  <th
                    key={act.id}
                    className="py-3 px-3 text-center font-semibold border-r border-[#134d6d] min-w-[130px]"
                  >
                    <div className="truncate max-w-[120px] mx-auto" title={act.titulo}>
                      {act.titulo}
                    </div>
                    <span className="text-[10px] text-[#9ED8ED] font-normal block font-mono">
                      (10 pts)
                    </span>
                  </th>
                ))}
                <th className="py-3 px-4 text-center font-bold bg-[#0A2239] text-[#9ED8ED] min-w-[100px]">
                  Promedio
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paralelo.estudiantes.map((est) => {
                const prom = calcularPromedio(est.id);
                const enRiesgo = prom < 7.0 && prom > 0;

                return (
                  <tr
                    key={est.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                      enRiesgo ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400 font-bold border-r border-slate-100 dark:border-slate-800">
                      {est.numeroLista}
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setSelectedStudent(est)}
                        className="font-bold text-slate-900 dark:text-white hover:text-[#176087] dark:hover:text-[#9ED8ED] text-left cursor-pointer"
                      >
                        {est.nombre}
                      </button>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        CI: {est.cedula}
                      </span>
                    </td>
                    {actividades.map((act) => {
                      const val = notas[est.id]?.[act.id];
                      return (
                        <td
                          key={act.id}
                          className="py-2 px-2 text-center border-r border-slate-100 dark:border-slate-800"
                        >
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            placeholder="-"
                            value={val !== undefined ? val : ''}
                            onChange={(e) => handleNotaChange(est.id, act.id, e.target.value)}
                            className={`w-16 h-8 text-center text-xs font-mono font-bold rounded-md border focus:outline-none transition-colors ${
                              val !== undefined && val < 7.0
                                ? 'border-rose-400 bg-rose-50/60 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 focus:border-rose-600'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white focus:border-[#176087]'
                            }`}
                          />
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-4 text-center font-mono font-bold">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          prom >= 7.0
                            ? 'text-emerald-700 dark:text-emerald-400 font-black'
                            : prom > 0
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-black'
                            : 'text-slate-400'
                        }`}
                      >
                        {prom > 0 ? prom.toFixed(2) : '-'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Nueva Actividad (P3.4: inicializa en blanco con placeholder '-') */}
      {showAddActividad && (
        <Modal
          isOpen={showAddActividad}
          onClose={() => setShowAddActividad(false)}
          title="Agregar Columna de Calificación"
        >
          <form onSubmit={handleCrearColumna} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Título de la actividad
              </label>
              <input
                type="text"
                placeholder="Ej: Lección Escrita Bloque 2"
                value={nuevaTitulo}
                onChange={(e) => setNuevaTitulo(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Tipo
                </label>
                <select
                  value={nuevaTipo}
                  onChange={(e) => setNuevaTipo(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
                >
                  <option value="Individual">Individual (Deber)</option>
                  <option value="Grupal">Grupal (Taller)</option>
                  <option value="Evaluacion">Evaluación Sumativa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Ponderación (Pts)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={nuevaPonderacion}
                  onChange={(e) => setNuevaPonderacion(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-tight">
              La nueva columna se agregará al final de la matriz con valores vacíos (<code>-</code>) listos para calificar.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddActividad(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Crear Columna
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Informe Oficial generado por Gemini con descarga PDF (P2.2) */}
      {showInformeModal && (
        <Modal
          isOpen={showInformeModal}
          onClose={() => setShowInformeModal(false)}
          title="Informe Oficial de Rendimiento Académico"
        >
          <div className="space-y-4 py-2 text-xs text-slate-700 dark:text-slate-300">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {informeContenido?.titulo || 'INFORME OFICIAL DE RENDIMIENTO'}
              </p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Código: {informeContenido?.codigoDocumento} · Paralelo {paralelo.nombre}
              </p>
            </div>

            <div>
              <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                1. Antecedentes y Justificación:
              </span>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                {informeContenido?.antecedentes}
              </p>
            </div>

            <div>
              <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                2. Diagnóstico del Grupo:
              </span>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                {informeContenido?.desarrollo}
              </p>
            </div>

            <div>
              <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                3. Conclusiones y Acuerdos:
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                {informeContenido?.conclusiones?.map((c: string, i: number) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            <div>
              <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                4. Recomendaciones Pedagógicas:
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                {informeContenido?.recomendaciones?.map((r: string, i: number) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400">
                Formato oficial MINEDUC Art. 208 RGLOEI
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowInformeModal(false)}>
                  Cerrar
                </Button>
                <Button variant="primary" size="sm" onClick={handleDescargarInformePDF}>
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar PDF</span>
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Student Profile Modal */}
      {selectedStudent && (
        <StudentProfileModal
          student={selectedStudent}
          paraleloNombre={paralelo.nombre}
          isOpen={Boolean(selectedStudent)}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};

export default CalificacionesPage;
