import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Badge, InfoTooltip, Skeleton, EmptyState } from '../components/ui';
import { Modal, Drawer } from '../components/ui/Dialogs';
import {
  BookOpen,
  Plus,
  Users,
  Edit2,
  Archive,
  RotateCcw,
  Upload,
  Trash2,
  Clock,
  MapPin,
  UserCheck,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

export interface CursoItem {
  id: string;
  nombre: string;
  grado: number | string;
  paralelo: string;
  materia: string;
  nivel: string;
  jornada: 'Matutina' | 'Vespertina' | 'Nocturna';
  horario: string;
  aula: string;
  activo: boolean;
  totalEstudiantes: number;
  asistenciaHoyRegistrada?: boolean;
}

export interface AlumnoCursoItem {
  id: string;
  nombre: string;
  cedula: string;
  numeroLista: number;
  telefonoRepresentante?: string;
}

export const MisCursosPage: React.FC = () => {
  const { token } = useAuth();
  const [cursos, setCursos] = useState<CursoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  // Modal Crear / Editar Curso
  const [showCursoModal, setShowCursoModal] = useState(false);
  const [editingCurso, setEditingCurso] = useState<CursoItem | null>(null);
  const [formGrado, setFormGrado] = useState('8vo EGB');
  const [formParalelo, setFormParalelo] = useState('A');
  const [formMateria, setFormMateria] = useState('');
  const [formNivel, setFormNivel] = useState('Educación Básica Superior');
  const [formJornada, setFormJornada] = useState<'Matutina' | 'Vespertina' | 'Nocturna'>('Matutina');
  const [formHorario, setFormHorario] = useState('07:15 - 08:45');
  const [formAula, setFormAula] = useState('Aula 101');
  const [formEstudiantesIniciales, setFormEstudiantesIniciales] = useState<
    Array<{ nombre: string; cedula: string }>
  >([]);
  const [archivoInicialNombre, setArchivoInicialNombre] = useState('');
  const [guardandoCurso, setGuardandoCurso] = useState(false);

  // Modal Confirmación Desactivar Curso
  const [cursoPorDesactivar, setCursoPorDesactivar] = useState<CursoItem | null>(null);
  const [procesandoEstado, setProcesandoEstado] = useState(false);

  // Drawer Gestión de Nómina de Estudiantes
  const [cursoNomina, setCursoNomina] = useState<CursoItem | null>(null);
  const [alumnos, setAlumnos] = useState<AlumnoCursoItem[]>([]);
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);
  const [nuevoAlumnoNombre, setNuevoAlumnoNombre] = useState('');
  const [nuevoAlumnoCedula, setNuevoAlumnoCedula] = useState('');
  const [agregandoAlumno, setAgregandoAlumno] = useState(false);
  const [importandoArchivo, setImportandoArchivo] = useState(false);
  const [pendingDuplicateStudents, setPendingDuplicateStudents] = useState<{
    incomingList: Array<{ nombre: string; cedula: string }>;
    duplicates: Array<{ nombre: string; cedula: string }>;
    isManual: boolean;
  } | null>(null);

  const showToast = (tipo: 'ok' | 'err', texto: string) => {
    setFeedbackMsg({ tipo, texto });
    setTimeout(() => {
      setFeedbackMsg((prev) => (prev?.texto === texto ? null : prev));
    }, 3500);
  };

  const fetchCursos = async (incluirInactivos = mostrarInactivos) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/paralelos?incluirInactivos=${incluirInactivos ? 'true' : 'false'}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (res.ok) {
        const data = await res.json();
        setCursos(Array.isArray(data?.paralelos) ? data.paralelos : []);
      }
    } catch (e) {
      console.warn('Error cargando cursos:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCursos(mostrarInactivos);
  }, [token, mostrarInactivos]);

  // Parseador reutilizable para archivos Excel (.xlsx, .xls) y CSV/TXT
  const parseStudentsFromFile = async (
    file: File
  ): Promise<Array<{ nombre: string; cedula: string }>> => {
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      const parsed: Array<{ nombre: string; cedula: string }> = [];
      rows.forEach((cols, index) => {
        if (!cols || cols.length === 0) return;
        const firstCell = String(cols[0] || '').toLowerCase();
        if (
          index === 0 &&
          (firstCell.includes('nombre') ||
            firstCell.includes('estudiante') ||
            firstCell.includes('cedula') ||
            firstCell.includes('cédula') ||
            firstCell.includes('lista') ||
            firstCell.includes('nro'))
        ) {
          return;
        }
        let nombreEst = '';
        let cedulaEst = '';
        if (cols.length >= 2) {
          const c0 = String(cols[0] || '').trim();
          const c1 = String(cols[1] || '').trim();
          const c2 = cols[2] !== undefined ? String(cols[2] || '').trim() : '';
          if (/^\d{1,3}$/.test(c0) && c1) {
            nombreEst = c1;
            cedulaEst = c2;
          } else if (/^\d{8,13}$/.test(c0)) {
            cedulaEst = c0;
            nombreEst = c1;
          } else {
            nombreEst = c0;
            cedulaEst = c1;
          }
        } else {
          nombreEst = String(cols[0] || '').trim();
        }
        if (nombreEst) {
          parsed.push({ nombre: nombreEst, cedula: cedulaEst });
        }
      });
      return parsed;
    } else {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const parsed: Array<{ nombre: string; cedula: string }> = [];
      lines.forEach((line, index) => {
        const lower = line.toLowerCase();
        if (
          index === 0 &&
          (lower.includes('nombre') || lower.includes('estudiante') || lower.includes('cedula'))
        ) {
          return;
        }
        const parts = line.split(/[;,|\t]/).map((p) => p.trim());
        let nombreEst = '';
        let cedulaEst = '';
        if (parts.length >= 2) {
          if (/^\d{1,3}$/.test(parts[0]) && parts[1]) {
            nombreEst = parts[1];
            cedulaEst = parts[2] || '';
          } else if (/^\d{8,13}$/.test(parts[0])) {
            cedulaEst = parts[0];
            nombreEst = parts[1];
          } else {
            nombreEst = parts[0];
            cedulaEst = parts[1];
          }
        } else {
          nombreEst = parts[0];
        }
        if (nombreEst) {
          parsed.push({ nombre: nombreEst, cedula: cedulaEst });
        }
      });
      return parsed;
    }
  };

  const handleOpenCrearModal = () => {
    setEditingCurso(null);
    setFormGrado('8vo EGB');
    setFormParalelo('A');
    setFormMateria('');
    setFormNivel('Educación Básica Superior');
    setFormJornada('Matutina');
    setFormHorario('07:15 - 08:45');
    setFormAula('Aula 101');
    setFormEstudiantesIniciales([]);
    setArchivoInicialNombre('');
    setShowCursoModal(true);
  };

  const handleOpenEditarModal = (curso: CursoItem) => {
    setEditingCurso(curso);
    const matchGrado = curso.nombre.split('"')[0]?.trim() || `${curso.grado} EGB`;
    setFormGrado(matchGrado);
    setFormParalelo(curso.paralelo || 'A');
    setFormMateria(curso.materia || '');
    setFormNivel(curso.nivel || 'Educación Básica Superior');
    setFormJornada(curso.jornada || 'Matutina');
    setFormHorario(curso.horario || '07:15 - 08:45');
    setFormAula(curso.aula || 'Aula 101');
    setFormEstudiantesIniciales([]);
    setArchivoInicialNombre('');
    setShowCursoModal(true);
  };

  const handleFileInicialUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseStudentsFromFile(file);
      setFormEstudiantesIniciales(parsed);
      setArchivoInicialNombre(file.name);
    } catch {
      showToast('err', 'No se pudo procesar el archivo seleccionado.');
    }
  };

  const handleSubmitCurso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMateria.trim() || !formGrado.trim() || !formParalelo.trim()) return;

    setGuardandoCurso(true);
    const nombreCurso = `${formGrado.trim()} "${formParalelo.trim()}" - ${formMateria.trim()}`;

    try {
      if (editingCurso) {
        const res = await fetch(`${API_URL}/api/paralelos/${editingCurso.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            nombre: nombreCurso,
            grado: formGrado.trim(),
            paralelo: formParalelo.trim(),
            materia: formMateria.trim(),
            nivel: formNivel,
            jornada: formJornada,
            horario: formHorario.trim(),
            aula: formAula.trim()
          })
        });
        const data = await res.json();
        if (res.ok && data?.success && data?.paralelo) {
          setCursos((prev) => prev.map((c) => (c.id === editingCurso.id ? data.paralelo : c)));
          setShowCursoModal(false);
          showToast('ok', 'Curso actualizado correctamente.');
        } else {
          showToast('err', data?.error || 'Error al actualizar el curso.');
        }
      } else {
        const res = await fetch(`${API_URL}/api/paralelos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            nombre: nombreCurso,
            grado: formGrado.trim(),
            paralelo: formParalelo.trim(),
            materia: formMateria.trim(),
            nivel: formNivel,
            jornada: formJornada,
            horario: formHorario.trim(),
            aula: formAula.trim(),
            estudiantes: formEstudiantesIniciales
          })
        });
        const data = await res.json();
        if (res.ok && data?.success && data?.paralelo) {
          setCursos((prev) => [data.paralelo, ...prev]);
          setShowCursoModal(false);
          showToast('ok', 'Nuevo curso creado satisfactoriamente.');
        } else {
          showToast('err', data?.error || 'Error al crear el curso.');
        }
      }
    } catch {
      showToast('err', 'Error de conexión con el servidor.');
    } finally {
      setGuardandoCurso(false);
    }
  };

  const handleConfirmarDesactivar = async () => {
    if (!cursoPorDesactivar) return;
    setProcesandoEstado(true);
    try {
      const res = await fetch(`${API_URL}/api/paralelos/${cursoPorDesactivar.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        if (mostrarInactivos) {
          setCursos((prev) =>
            prev.map((c) => (c.id === cursoPorDesactivar.id ? { ...c, activo: false } : c))
          );
        } else {
          setCursos((prev) => prev.filter((c) => c.id !== cursoPorDesactivar.id));
        }
        showToast(
          'ok',
          'Curso desactivado. Se ocultó de las vistas activas conservando su historial.'
        );
      } else {
        showToast('err', data?.error || 'No se pudo desactivar el curso.');
      }
    } catch {
      showToast('err', 'Error al desactivar el curso.');
    } finally {
      setProcesandoEstado(false);
      setCursoPorDesactivar(null);
    }
  };

  const handleReactivarCurso = async (curso: CursoItem) => {
    try {
      const res = await fetch(`${API_URL}/api/paralelos/${curso.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ activo: true })
      });
      const data = await res.json();
      if (res.ok && data?.success && data?.paralelo) {
        setCursos((prev) => prev.map((c) => (c.id === curso.id ? data.paralelo : c)));
        showToast('ok', 'Curso reactivado y disponible nuevamente en Asistencia y Calificaciones.');
      }
    } catch {
      showToast('err', 'No se pudo reactivar el curso.');
    }
  };

  // Gestión de Nómina de Estudiantes
  const handleAbrirNomina = async (curso: CursoItem) => {
    setCursoNomina(curso);
    setLoadingAlumnos(true);
    setAlumnos([]);
    try {
      const res = await fetch(`${API_URL}/api/paralelos/${curso.id}/alumnos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const lista = Array.isArray(data?.alumnos) ? data.alumnos : [];
        setAlumnos(lista);
        syncCursoCount(curso.id, lista.length);
      }
    } catch {
      showToast('err', 'Error cargando nómina de estudiantes.');
    } finally {
      setLoadingAlumnos(false);
    }
  };

  const syncCursoCount = (cursoId: string, newCount: number) => {
    setCursos((prev) =>
      prev.map((c) => (c.id === cursoId ? { ...c, totalEstudiantes: newCount } : c))
    );
    setCursoNomina((prev) => (prev && prev.id === cursoId ? { ...prev, totalEstudiantes: newCount } : prev));
  };

  const detectDuplicates = (incomingList: Array<{ nombre: string; cedula: string }>) => {
    return incomingList.filter((item) => {
      const normName = item.nombre.trim().toLowerCase().replace(/\s+/g, ' ');
      const normCed = item.cedula.trim();
      return alumnos.some((ex) => {
        const exName = ex.nombre.trim().toLowerCase().replace(/\s+/g, ' ');
        const exCed = (ex.cedula || '').trim();
        return exName === normName || (normCed && exCed && exCed === normCed);
      });
    });
  };

  const enviarAlumnosAlServidor = async (
    incomingList: Array<{ nombre: string; cedula: string }>,
    actualizarDuplicados: boolean,
    isManual: boolean
  ) => {
    if (!cursoNomina) return;
    if (isManual) setAgregandoAlumno(true);
    else setImportandoArchivo(true);

    try {
      const res = await fetch(`${API_URL}/api/paralelos/${cursoNomina.id}/alumnos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          estudiantes: incomingList,
          actualizarDuplicados
        })
      });
      const data = await res.json();
      if (res.ok && data?.success && Array.isArray(data.alumnos)) {
        setAlumnos(data.alumnos);
        syncCursoCount(cursoNomina.id, data.alumnos.length);
        if (isManual) {
          setNuevoAlumnoNombre('');
          setNuevoAlumnoCedula('');
        }
        const partes: string[] = [];
        if (data.insertadosCount > 0) partes.push(`${data.insertadosCount} nuevos agregados`);
        if (data.actualizadosCount > 0) partes.push(`${data.actualizadosCount} actualizados`);
        if (data.omitidosCount > 0) partes.push(`${data.omitidosCount} repetidos omitidos`);
        showToast('ok', partes.length > 0 ? `Nómina actualizada (${partes.join(', ')}).` : 'Nómina actualizada.');
      } else {
        showToast('err', data?.error || 'Error procesando estudiantes.');
      }
    } catch {
      showToast('err', 'Error de conexión al guardar estudiantes.');
    } finally {
      setAgregandoAlumno(false);
      setImportandoArchivo(false);
      setPendingDuplicateStudents(null);
    }
  };

  const handleAgregarAlumnoManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cursoNomina || !nuevoAlumnoNombre.trim()) return;
    const incoming = [{ nombre: nuevoAlumnoNombre.trim(), cedula: nuevoAlumnoCedula.trim() }];
    const duplicates = detectDuplicates(incoming);
    if (duplicates.length > 0) {
      setPendingDuplicateStudents({ incomingList: incoming, duplicates, isManual: true });
      return;
    }
    await enviarAlumnosAlServidor(incoming, false, true);
  };

  const handleImportarAlumnosEnDrawer = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !cursoNomina) return;
    try {
      const parsed = await parseStudentsFromFile(file);
      e.target.value = '';
      if (parsed.length === 0) {
        showToast('err', 'No se encontraron nombres válidos en el archivo.');
        return;
      }
      const duplicates = detectDuplicates(parsed);
      if (duplicates.length > 0) {
        setPendingDuplicateStudents({ incomingList: parsed, duplicates, isManual: false });
        return;
      }
      await enviarAlumnosAlServidor(parsed, false, false);
    } catch {
      showToast('err', 'No se pudo procesar el archivo Excel/CSV.');
      e.target.value = '';
    }
  };

  const handleEliminarAlumno = async (alumnoId: string) => {
    if (!cursoNomina) return;
    try {
      const res = await fetch(
        `${API_URL}/api/paralelos/${cursoNomina.id}/alumnos/${alumnoId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await res.json();
      if (res.ok && data?.success && Array.isArray(data.alumnos)) {
        setAlumnos(data.alumnos);
        syncCursoCount(cursoNomina.id, data.alumnos.length);
        showToast('ok', 'Estudiante retirado de la nómina activa.');
      }
    } catch {
      showToast('err', 'No se pudo retirar al estudiante.');
    }
  };

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#176087] dark:text-[#9ED8ED]" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Mis Cursos y Paralelos
            </h2>
            <InfoTooltip content="Administra tus cursos asignados, importa o edita la nómina de estudiantes por paralelo y gestiona tu carga académica de forma privada." />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Los cursos activos aquí aparecen automáticamente en Toma de Asistencia, Calificaciones y Workspace.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMostrarInactivos((prev) => !prev)}
            className="text-xs"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{mostrarInactivos ? 'Ocultar desactivados' : 'Ver desactivados'}</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCrearModal}
            className="text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Curso / Paralelo</span>
          </Button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
            feedbackMsg.tipo === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          {feedbackMsg.tipo === 'ok' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedbackMsg.texto}</span>
        </div>
      )}

      {/* Grid de Cursos */}
      {cursos.length === 0 ? (
        <EmptyState
          mensaje="Aún no tienes cursos activos registrados"
          submensaje="Crea tu primer paralelo e importa o agrega tu lista de estudiantes para empezar a registrar asistencia y calificaciones."
          accionTexto="Crear mi primer curso"
          onAccion={handleOpenCrearModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cursos.map((curso) => {
            const isInactivo = curso.activo === false;

            return (
              <Card
                key={curso.id}
                className={`p-6 flex flex-col justify-between transition-all space-y-5 border-slate-200 dark:border-slate-800 ${
                  isInactivo
                    ? 'opacity-65 bg-slate-100/70 dark:bg-slate-900/40 border-dashed'
                    : 'hover:shadow-xl'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant={isInactivo ? 'outline' : 'primary'}>
                          {curso.materia} · {curso.nivel}
                        </Badge>
                        {isInactivo && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Desactivado (Historial conservado)
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                        {curso.nombre}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditarModal(curso)}
                        className="p-2 rounded-lg text-slate-500 hover:text-[#176087] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Editar datos del curso"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {isInactivo ? (
                        <button
                          type="button"
                          onClick={() => handleReactivarCurso(curso)}
                          className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                          title="Reactivar curso"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCursoPorDesactivar(curso)}
                          className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Desactivar curso sin borrar su historial"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Horario, Aula y Jornada */}
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {curso.horario || '07:15 - 08:45'}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {curso.aula || 'Aula 101'}
                    </span>
                    <span>·</span>
                    <span>Jornada {curso.jornada || 'Matutina'}</span>
                  </div>
                </div>

                {/* Resumen de Nómina */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#071727] border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 block">
                      Nómina de Estudiantes
                    </span>
                    <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                      {curso.totalEstudiantes || 0} estudiantes activos
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAbrirNomina(curso)}
                    className="text-xs"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Gestionar Alumnos</span>
                  </Button>
                </div>

                {/* Atajos Rápidos */}
                {!isInactivo && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
                    <Link to={`/asistencia/${curso.id}`} className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full text-xs border border-slate-200 dark:border-slate-800">
                        <UserCheck className="w-3.5 h-3.5 text-[#176087] dark:text-[#9ED8ED]" />
                        <span>Ir a Asistencia</span>
                      </Button>
                    </Link>
                    <Link to={`/calificaciones/${curso.id}`} className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full text-xs border border-slate-200 dark:border-slate-800">
                        <GraduationCap className="w-3.5 h-3.5 text-[#176087] dark:text-[#9ED8ED]" />
                        <span>Ir a Calificaciones</span>
                      </Button>
                    </Link>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* MODAL CREAR / EDITAR CURSO */}
      {showCursoModal && (
        <Modal
          isOpen={showCursoModal}
          onClose={() => setShowCursoModal(false)}
          title={editingCurso ? 'Editar Curso / Paralelo' : 'Crear Nuevo Curso / Paralelo'}
          subtitle="Los datos de este curso son privados y exclusivos de tu cuenta docente."
        >
          <form onSubmit={handleSubmitCurso} className="space-y-4 py-1 text-xs text-left">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Grado / Año Escolar *
                </label>
                <input
                  type="text"
                  placeholder="Ej: 8vo EGB, 10mo EGB, 2do BGU"
                  value={formGrado}
                  onChange={(e) => setFormGrado(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Paralelo *
                </label>
                <input
                  type="text"
                  placeholder="Ej: A, B, C"
                  maxLength={5}
                  value={formParalelo}
                  onChange={(e) => setFormParalelo(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Materia / Asignatura *
              </label>
              <input
                type="text"
                placeholder="Ej: Lengua y Literatura, Matemáticas, Ciencias Naturales"
                value={formMateria}
                onChange={(e) => setFormMateria(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nivel Educativo
                </label>
                <select
                  value={formNivel}
                  onChange={(e) => setFormNivel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
                >
                  <option value="Educación Básica Elemental">Educación Básica Elemental</option>
                  <option value="Educación Básica Media">Educación Básica Media</option>
                  <option value="Educación Básica Superior">Educación Básica Superior</option>
                  <option value="Bachillerato General Unificado">Bachillerato General Unificado</option>
                  <option value="Bachillerato Técnico">Bachillerato Técnico</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jornada
                </label>
                <select
                  value={formJornada}
                  onChange={(e) => setFormJornada(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
                >
                  <option value="Matutina">Matutina</option>
                  <option value="Vespertina">Vespertina</option>
                  <option value="Nocturna">Nocturna</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Horario de referencia
                </label>
                <input
                  type="text"
                  placeholder="Ej: 07:15 - 08:45"
                  value={formHorario}
                  onChange={(e) => setFormHorario(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Aula / Bloque
                </label>
                <input
                  type="text"
                  placeholder="Ej: Aula 102 · Bloque B"
                  value={formAula}
                  onChange={(e) => setFormAula(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Carga opcional de estudiantes al crear el curso */}
            {!editingCurso && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#071727] border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Importar nómina inicial (Opcional)
                  </span>
                  {formEstudiantesIniciales.length > 0 && (
                    <span className="text-[11px] font-bold text-emerald-600">
                      {formEstudiantesIniciales.length} alumnos detectados
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Puedes subir un archivo Excel (<code>.xlsx</code>, <code>.xls</code>) o CSV (<code>.csv</code>) ahora o agregar alumnos manualmente después.
                </p>
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer hover:bg-slate-100">
                  <Upload className="w-3.5 h-3.5 text-[#176087]" />
                  <span>{archivoInicialNombre || 'Seleccionar archivo Excel / CSV'}</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv,.txt"
                    onChange={handleFileInicialUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCursoModal(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={guardandoCurso}>
                {editingCurso ? 'Guardar Cambios' : 'Crear Curso'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL CONFIRMAR DESACTIVACIÓN LÓGICA */}
      {cursoPorDesactivar && (
        <Modal
          isOpen={Boolean(cursoPorDesactivar)}
          onClose={() => setCursoPorDesactivar(null)}
          title="Desactivar Curso / Paralelo"
        >
          <div className="space-y-4 text-xs text-left py-1">
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              ¿Estás seguro de que deseas desactivar el curso{' '}
              <strong className="text-slate-900 dark:text-white">
                {cursoPorDesactivar.nombre}
              </strong>
              ?
            </p>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-bold">Protección de historial académico:</p>
              <p>
                El curso se ocultará de las vistas activas (Asistencia, Calificaciones y Panel Diario), pero <strong>no se borrarán</strong> sus estudiantes, asistencias ni calificaciones históricas. Podrás reactivarlo cuando lo necesites.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCursoPorDesactivar(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                isLoading={procesandoEstado}
                onClick={handleConfirmarDesactivar}
              >
                Desactivar Curso
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* DRAWER GESTIÓN DE NÓMINA DE ESTUDIANTES */}
      {cursoNomina && (
        <Drawer
          isOpen={Boolean(cursoNomina)}
          onClose={() => setCursoNomina(null)}
          title={`Nómina: ${cursoNomina.nombre}`}
          subtitle={`${cursoNomina.materia} · ${alumnos.length} estudiantes activos`}
        >
          <div className="space-y-5 text-xs text-left">
            {/* 1. Formulario para agregar estudiante manualmente */}
            <form
              onSubmit={handleAgregarAlumnoManual}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#071727] border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Agregar estudiante manualmente
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Apellidos y Nombres *"
                  value={nuevoAlumnoNombre}
                  onChange={(e) => setNuevoAlumnoNombre(e.target.value)}
                  className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A2239] text-slate-900 dark:text-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Cédula (opcional)"
                  value={nuevoAlumnoCedula}
                  onChange={(e) => setNuevoAlumnoCedula(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A2239] text-slate-900 dark:text-white font-mono"
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <label className="inline-flex items-center gap-1.5 text-[#176087] dark:text-[#9ED8ED] font-bold cursor-pointer hover:underline">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{importandoArchivo ? 'Importando...' : 'Importar desde Excel / CSV'}</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv,.txt"
                    onChange={handleImportarAlumnosEnDrawer}
                    disabled={importandoArchivo}
                    className="hidden"
                  />
                </label>

                <Button type="submit" variant="primary" size="sm" isLoading={agregandoAlumno}>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Alumno</span>
                </Button>
              </div>
            </form>

            {/* 2. Lista de estudiantes del paralelo */}
            {loadingAlumnos ? (
              <Skeleton className="h-64 w-full" />
            ) : alumnos.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                Este curso aún no tiene estudiantes registrados. Agrégalos manualmente arriba o importa un archivo Excel/CSV.
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#176087] text-white">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center font-mono">Nº</th>
                      <th className="py-2.5 px-3 font-semibold">Apellidos y Nombres</th>
                      <th className="py-2.5 px-3 font-semibold">Cédula</th>
                      <th className="py-2.5 px-3 w-14 text-center font-semibold">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#0A2239]">
                    {alumnos.map((al, idx) => (
                      <tr
                        key={al.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400">
                          {al.numeroLista || idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                          {al.nombre}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">
                          {al.cedula || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleEliminarAlumno(al.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Retirar estudiante del paralelo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Drawer>
      )}

      {/* MODAL CONFIRMAR ACTUALIZACIÓN U OMISIÓN DE ESTUDIANTES REPETIDOS */}
      {pendingDuplicateStudents && (
        <Modal
          isOpen={Boolean(pendingDuplicateStudents)}
          onClose={() => setPendingDuplicateStudents(null)}
          title="Estudiantes ya registrados en este curso"
          subtitle="Se detectaron coincidencias con la nómina actual del paralelo."
        >
          <div className="space-y-4 text-xs text-left py-1">
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Se encontraron{' '}
              <strong className="text-slate-900 dark:text-white">
                {pendingDuplicateStudents.duplicates.length} estudiante(s)
              </strong>{' '}
              que ya forman parte de este curso. ¿Deseas actualizar sus datos (como cédula o nombre) o prefieres omitir los repetidos y agregar únicamente los nuevos?
            </p>

            <div className="max-h-36 overflow-y-auto p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-1">
              <span className="font-bold text-amber-800 dark:text-amber-300 block mb-1">
                Coincidencias detectadas:
              </span>
              {pendingDuplicateStudents.duplicates.slice(0, 10).map((dup, i) => (
                <div key={i} className="text-amber-900 dark:text-amber-200 flex justify-between">
                  <span className="font-medium truncate">{dup.nombre}</span>
                  <span className="font-mono text-[11px] opacity-80">{dup.cedula || 'Sin cédula'}</span>
                </div>
              ))}
              {pendingDuplicateStudents.duplicates.length > 10 && (
                <p className="text-[11px] text-amber-700 dark:text-amber-400 italic pt-1">
                  ...y {pendingDuplicateStudents.duplicates.length - 10} estudiante(s) más.
                </p>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPendingDuplicateStudents(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                isLoading={agregandoAlumno || importandoArchivo}
                onClick={() =>
                  enviarAlumnosAlServidor(
                    pendingDuplicateStudents.incomingList,
                    false,
                    pendingDuplicateStudents.isManual
                  )
                }
              >
                Omitir repetidos
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                isLoading={agregandoAlumno || importandoArchivo}
                onClick={() =>
                  enviarAlumnosAlServidor(
                    pendingDuplicateStudents.incomingList,
                    true,
                    pendingDuplicateStudents.isManual
                  )
                }
              >
                Actualizar datos de repetidos
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MisCursosPage;
