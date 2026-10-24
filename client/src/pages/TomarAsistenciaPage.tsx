import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PARALELOS_INICIALES, Estudiante } from '../data/mockData';
import { Card, Button, Badge } from '../components/ui';
import { StudentProfileModal } from '../components/student/StudentProfileModal';
import {
  UserCheck,
  CheckCircle2,
  Calendar,
  ArrowLeft,
  Save,
  Check,
  History,
  AlertTriangle,
  User,
  Info
} from 'lucide-react';

interface RegistroEstado {
  estudianteId: string;
  estado: 'P' | 'A' | 'F';
  justificada: boolean;
  motivo: string;
}

export const TomarAsistenciaPage: React.FC = () => {
  const { cursoId } = useParams<{ cursoId: string }>();
  const [activeTab, setActiveTab] = useState<'toma' | 'historial'>('toma');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Estudiante | null>(null);

  const paralelo = PARALELOS_INICIALES.find((p) => p.id === cursoId) || PARALELOS_INICIALES[0];

  // Estado de registros de asistencia para la fecha seleccionada
  const [registros, setRegistros] = useState<Record<string, RegistroEstado>>({});

  useEffect(() => {
    // Inicializar registros
    const init: Record<string, RegistroEstado> = {};
    paralelo.estudiantes.forEach((est, idx) => {
      let estado: 'P' | 'A' | 'F' = 'P';
      let justificada = false;
      let motivo = '';

      if (idx === 4) {
        estado = 'F';
        justificada = true;
        motivo = 'Cita médica en IESS Guayaquil (Certificado presentado)';
      } else if (idx === 12) {
        estado = 'A';
        motivo = 'Llegada tarde por tráfico';
      }

      init[est.id] = {
        estudianteId: est.id,
        estado,
        justificada,
        motivo
      };
    });
    setRegistros(init);
  }, [paralelo]);

  const handleEstadoChange = (estId: string, estado: 'P' | 'A' | 'F') => {
    setRegistros((prev) => ({
      ...prev,
      [estId]: {
        ...prev[estId],
        estado,
        // Si no es falta, resetear justificada
        justificada: estado === 'F' ? prev[estId]?.justificada : false,
        motivo: estado === 'F' ? prev[estId]?.motivo : ''
      }
    }));
  };

  const handleJustificadaChange = (estId: string, justificada: boolean) => {
    setRegistros((prev) => ({
      ...prev,
      [estId]: {
        ...prev[estId],
        justificada,
        motivo: justificada ? prev[estId]?.motivo || 'Justificación en trámite' : ''
      }
    }));
  };

  const handleMotivoChange = (estId: string, motivo: string) => {
    setRegistros((prev) => ({
      ...prev,
      [estId]: {
        ...prev[estId],
        motivo
      }
    }));
  };

  const handleMarcarTodosPresentes = () => {
    const updated = { ...registros };
    Object.keys(updated).forEach((id) => {
      updated[id] = {
        ...updated[id],
        estado: 'P',
        justificada: false,
        motivo: ''
      };
    });
    setRegistros(updated);
  };

  const handleGuardar = async () => {
    try {
      await fetch(`/api/asistencia/${paralelo.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha,
          registros: Object.values(registros)
        })
      });
    } catch (e) {
      console.warn('API local offline, guardado en memoria:', e);
    }

    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 3000);
  };

  // Cálculo de resumen rápido
  const total = paralelo.estudiantes.length;
  const presentes = Object.values(registros).filter((r) => r.estado === 'P').length;
  const atrasos = Object.values(registros).filter((r) => r.estado === 'A').length;
  const faltas = Object.values(registros).filter((r) => r.estado === 'F').length;

  return (
    <div className="space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <Link to="/asistencia">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {paralelo.nombre} · Toma de Asistencia
              </h2>
              <Badge variant="primary">{paralelo.materia}</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {paralelo.aula} · Jornada {paralelo.jornada} · {total} estudiantes
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-200 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('toma')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'toma'
                ? 'bg-white dark:bg-[#0A2239] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Toma de Hoy
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'historial'
                ? 'bg-white dark:bg-[#0A2239] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Historial Mensual
          </button>
        </div>
      </div>

      {/* PESTAÑA 1: TOMA DE HOY */}
      {activeTab === 'toma' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-[#0A2239] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs gap-4">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Fecha de registro
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#176087] dark:text-[#9ED8ED]" />
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#071727] text-slate-900 dark:text-white focus:outline-none focus:border-[#176087]"
                  />
                </div>
              </div>

              {/* Counter badges */}
              <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-slate-800 text-xs">
                <span className="px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                  {presentes} P
                </span>
                <span className="px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold font-mono">
                  {atrasos} A
                </span>
                <span className="px-2 py-1 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-bold font-mono">
                  {faltas} F
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarcarTodosPresentes}
                title="Poner todos en Presente para agilizar"
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Marcar todos presentes
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleGuardar}
                className={guardadoExitoso ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                {guardadoExitoso ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-white" />
                    ¡Guardado!
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 mr-1" />
                    Guardar asistencia
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Tabla de Estudiantes */}
          <Card className="p-0 overflow-hidden border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0A2239] text-white uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-3.5 py-3 w-12 text-center">#</th>
                    <th className="px-4 py-3">Estudiante (Clic para ver perfil)</th>
                    <th className="px-4 py-3 w-56 text-center">Estado de Asistencia</th>
                    <th className="px-4 py-3">Observación / Motivo de Falta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {paralelo.estudiantes.map((est) => {
                    const reg = registros[est.id] || {
                      estudianteId: est.id,
                      estado: 'P',
                      justificada: false,
                      motivo: ''
                    };
                    const isFalta = reg.estado === 'F';

                    return (
                      <tr
                        key={est.id}
                        className={`hover:bg-slate-50 dark:hover:bg-[#071727]/60 transition-colors ${
                          isFalta ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                        }`}
                      >
                        <td className="px-3.5 py-3 font-mono text-center text-slate-400">
                          {est.numeroLista}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedStudent(est)}
                            className="font-semibold text-slate-900 dark:text-white hover:text-[#176087] dark:hover:text-[#9ED8ED] transition-colors cursor-pointer text-left block"
                          >
                            {est.nombre}
                          </button>
                          <span className="text-[10px] text-slate-400 font-mono">
                            C.I. {est.cedula}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            {/* Toggle P */}
                            <button
                              type="button"
                              onClick={() => handleEstadoChange(est.id, 'P')}
                              className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                                reg.estado === 'P'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                              }`}
                            >
                              P
                            </button>

                            {/* Toggle A */}
                            <button
                              type="button"
                              onClick={() => handleEstadoChange(est.id, 'A')}
                              className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                                reg.estado === 'A'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                              }`}
                            >
                              A
                            </button>

                            {/* Toggle F */}
                            <button
                              type="button"
                              onClick={() => handleEstadoChange(est.id, 'F')}
                              className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                                reg.estado === 'F'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                              }`}
                            >
                              F
                            </button>
                          </div>
                        </td>

                        {/* Columna de Observación y Sub-toggle de justificada */}
                        <td className="px-4 py-3">
                          {isFalta ? (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                              {/* Sub-toggle ¿Justificada? */}
                              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-md text-[11px] font-semibold shrink-0">
                                <span className="text-slate-500 text-[10px] mr-1">¿Justificada?</span>
                                <button
                                  type="button"
                                  onClick={() => handleJustificadaChange(est.id, true)}
                                  className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
                                    reg.justificada ? 'bg-indigo-600 text-white' : 'text-slate-500'
                                  }`}
                                >
                                  Sí
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleJustificadaChange(est.id, false)}
                                  className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
                                    !reg.justificada ? 'bg-slate-700 text-white' : 'text-slate-500'
                                  }`}
                                >
                                  No
                                </button>
                              </div>

                              {/* Input motivo si es justificada */}
                              {reg.justificada && (
                                <input
                                  type="text"
                                  value={reg.motivo}
                                  onChange={(e) => handleMotivoChange(est.id, e.target.value)}
                                  placeholder="Motivo (ej: Cita IESS, calamidad doméstica...)"
                                  className="w-full text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-800 dark:text-white"
                                />
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              {reg.estado === 'A' ? 'Atraso registrado en puerta' : 'Asistencia regular'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* PESTAÑA 2: HISTORIAL MENSUAL */}
      {activeTab === 'historial' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-[#176087]" />
                Matriz de Asistencia del Mes de Octubre
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Convención: Verde (P = Presente), Amarillo (A = Atraso), Rojo (F = Falta injustificada), Gris (FJ = Falta justificada).
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Promedio mensual del curso</span>
              <span className="text-xl font-bold font-mono text-[#176087] dark:text-[#9ED8ED]">
                {paralelo.porcentajeAsistenciaMes}%
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left">
              <thead className="bg-[#0A2239] text-white">
                <tr>
                  <th className="px-2 py-2 w-8">#</th>
                  <th className="px-3 py-2 min-w-[180px]">Estudiante</th>
                  {Array.from({ length: 15 }, (_, i) => (
                    <th key={i} className="px-1.5 py-2 text-center font-mono w-7">
                      {i + 1}
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center font-semibold">Total Faltas</th>
                  <th className="px-2 py-2 text-center font-semibold">% Mes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paralelo.estudiantes.map((est) => {
                  return (
                    <tr key={est.id} className="hover:bg-slate-50 dark:hover:bg-[#071727]/60">
                      <td className="px-2 py-1.5 font-mono text-slate-400">{est.numeroLista}</td>
                      <td className="px-3 py-1.5 font-medium truncate max-w-[200px]">{est.nombre}</td>
                      {Array.from({ length: 15 }, (_, i) => {
                        // Simulación consistente de asistencia
                        const isSunday = (i + 1) % 7 === 0 || (i + 1) % 7 === 6;
                        if (isSunday) {
                          return <td key={i} className="px-1.5 py-1.5 text-center bg-slate-100 dark:bg-slate-800 text-slate-400">-</td>;
                        }

                        const hasFalta = (est.numeroLista * 3 + i) % 23 === 0;
                        const hasJust = hasFalta && est.numeroLista % 2 === 0;
                        const hasAtraso = (est.numeroLista + i) % 19 === 0;

                        if (hasFalta) {
                          return (
                            <td key={i} className="px-1.5 py-1.5 text-center">
                              <span className={`inline-block w-5 h-5 rounded text-[10px] font-bold leading-5 ${
                                hasJust ? 'bg-slate-200 text-slate-700' : 'bg-rose-500 text-white'
                              }`}>
                                {hasJust ? 'FJ' : 'F'}
                              </span>
                            </td>
                          );
                        }

                        if (hasAtraso) {
                          return (
                            <td key={i} className="px-1.5 py-1.5 text-center">
                              <span className="inline-block w-5 h-5 rounded bg-amber-400 text-white text-[10px] font-bold leading-5">
                                A
                              </span>
                            </td>
                          );
                        }

                        return (
                          <td key={i} className="px-1.5 py-1.5 text-center">
                            <span className="inline-block w-5 h-5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-bold leading-5">
                              P
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-2 py-1.5 text-center font-mono font-bold text-rose-600">
                        {est.faltasInjustificadas + est.faltasJustificadas}
                      </td>
                      <td className="px-2 py-1.5 text-center font-mono font-bold text-[#176087] dark:text-[#9ED8ED]">
                        {est.asistenciaMes}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal de Detalle del Estudiante */}
      <StudentProfileModal
        estudiante={selectedStudent}
        paraleloNombre={paralelo.nombre}
        isOpen={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  );
};

export default TomarAsistenciaPage;
