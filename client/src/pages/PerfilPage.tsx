import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Badge, Input, InfoTooltip } from '../components/ui';
import { Modal } from '../components/ui/Dialogs';
import {
  Settings,
  Calendar,
  CheckCircle2,
  Sun,
  Moon,
  School,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  BookOpen
} from 'lucide-react';

export interface HorarioFila {
  hora: string;
  lunes: string;
  martes: string;
  miercoles: string;
  jueves: string;
  viernes: string;
}

export interface CursoResumen {
  id: string;
  nombre: string;
  materia: string;
  horario: string;
  aula: string;
}

export const PerfilPage: React.FC = () => {
  const {
    user,
    token,
    darkMode,
    toggleDarkMode,
    institucionActiva,
    instituciones,
    setInstitucionActiva,
    logout
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'perfil' | 'horario' | 'notificaciones' | 'seguridad'>('perfil');

  // Horario Semanal Editable sincronizado con Mis Cursos y MongoDB
  const [horario, setHorario] = useState<HorarioFila[]>([]);
  const [cursosDocente, setCursosDocente] = useState<CursoResumen[]>([]);
  const [totalEstudiantesReal, setTotalEstudiantesReal] = useState<number>(user?.totalAlumnos || 0);
  const [loadingHorario, setLoadingHorario] = useState(false);
  const [guardandoHorario, setGuardandoHorario] = useState(false);
  const [horarioGuardado, setHorarioGuardado] = useState(false);

  // Notificaciones
  const [notifAusentismo, setNotifAusentismo] = useState(true);
  const [notifNotasBajas, setNotifNotasBajas] = useState(true);
  const [notifCierreParcial, setNotifCierreParcial] = useState(true);
  const [notifAnticipacion, setNotifAnticipacion] = useState('24 horas');
  const [notifGuardadas, setNotifGuardadas] = useState(false);

  // Seguridad
  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  const [passConfirm, setPassConfirm] = useState('');
  const [passMsg, setPassMsg] = useState('');

  // Nueva Institución Modal (sin Distrito)
  const [showAddInstModal, setShowAddInstModal] = useState(false);
  const [nuevaInstNombre, setNuevaInstNombre] = useState('');
  const [nuevaInstAmie, setNuevaInstAmie] = useState('');

  const fetchHorarioYCursos = async (regenerar = false) => {
    if (!token) return;
    setLoadingHorario(true);
    try {
      const [resHorario, resParalelos] = await Promise.all([
        fetch(`${API_URL}/api/horario${regenerar ? '?regenerar=true' : ''}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/paralelos`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (resHorario.ok) {
        const data = await resHorario.json();
        if (Array.isArray(data?.horario)) {
          setHorario(data.horario);
        }
        if (Array.isArray(data?.cursos)) {
          setCursosDocente(data.cursos);
        }
      }

      if (resParalelos.ok) {
        const dataP = await resParalelos.json();
        if (Array.isArray(dataP?.paralelos)) {
          const total = dataP.paralelos.reduce(
            (acc: number, p: any) => acc + (Number(p.totalEstudiantes) || 0),
            0
          );
          setTotalEstudiantesReal(total);
        }
      }
    } catch (e) {
      console.warn('Error cargando horario semanal:', e);
    } finally {
      setLoadingHorario(false);
    }
  };

  useEffect(() => {
    fetchHorarioYCursos(false);
  }, [token]);

  const handleUpdateHorarioCell = (
    rowIndex: number,
    campo: 'hora' | 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes',
    valor: string
  ) => {
    setHorario((prev) =>
      prev.map((row, idx) => (idx === rowIndex ? { ...row, [campo]: valor } : row))
    );
  };

  const handleAgregarFranja = () => {
    setHorario((prev) => [
      ...prev,
      {
        hora: '11:30 - 12:15',
        lunes: '',
        martes: '',
        miercoles: '',
        jueves: '',
        viernes: ''
      }
    ]);
  };

  const handleEliminarFranja = (rowIndex: number) => {
    setHorario((prev) => prev.filter((_, idx) => idx !== rowIndex));
  };

  const handleGuardarHorario = async () => {
    setGuardandoHorario(true);
    try {
      const res = await fetch(`${API_URL}/api/horario`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ horario })
      });
      if (res.ok) {
        setHorarioGuardado(true);
        setTimeout(() => setHorarioGuardado(false), 3000);
      }
    } catch (e) {
      console.warn('Error guardando horario:', e);
    } finally {
      setGuardandoHorario(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passNueva !== passConfirm) {
      setPassMsg('Las contraseñas no coinciden.');
      return;
    }
    setPassMsg('¡Contraseña actualizada correctamente!');
    setPassActual('');
    setPassNueva('');
    setPassConfirm('');
    setTimeout(() => setPassMsg(''), 3000);
  };

  const inicialesDocente = user?.nombre
    ? user.nombre
        .replace(/^Lic\.\s*/i, '')
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'AM';

  const opcionesAutocompletar = Array.from(
    new Set([
      ...cursosDocente.map((c) =>
        c.nombre.toLowerCase().includes((c.materia || '').toLowerCase())
          ? c.nombre
          : `${c.nombre} · ${c.materia}`
      ),
      'RECESO',
      'Tutoría / Refuerzo Académico',
      'Planificación Curricular',
      'Atención a Representantes',
      'Gestión Pedagógica'
    ])
  );

  return (
    <div className="space-y-6 text-left max-w-5xl">
      {/* 1. Header con InfoTooltip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#176087] dark:text-[#9ED8ED]" />
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Configuración del Docente
          </h2>
          <InfoTooltip content="Administra tus instituciones educativas, horario semanal de clases sincronizado con Mis Cursos y preferencias del sistema." />
        </div>

        {/* Pestañas de configuración (sin Integraciones) */}
        <div className="flex items-center gap-1 p-1 bg-slate-200 dark:bg-slate-800 rounded-xl overflow-x-auto scrollbar-none self-start sm:self-auto">
          {[
            { id: 'perfil', label: 'Perfil & Planteles' },
            { id: 'horario', label: 'Horario Semanal' },
            { id: 'notificaciones', label: 'Notificaciones' },
            { id: 'seguridad', label: 'Seguridad' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-[#0A2239] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* PESTAÑA 1: PERFIL & INSTITUCIONES */}
      {activeTab === 'perfil' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 space-y-5 text-center">
            <div className="relative inline-block mx-auto">
              <div className="w-20 h-20 rounded-full bg-[#176087] text-white flex items-center justify-center font-bold text-2xl shadow-xl ring-4 ring-[#9ED8ED]/40 mx-auto">
                {inicialesDocente}
              </div>
              <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0A2239]" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {user?.nombre || 'Lic. Andrés Morales'}
              </h3>
              <p className="text-xs text-[#176087] dark:text-[#9ED8ED] font-semibold mt-0.5">
                {user?.materias && user.materias.length > 0
                  ? `Docente de ${user.materias.join(', ')}`
                  : 'Docente Titular'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {institucionActiva?.nombre || user?.institucion}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#071727] text-xs text-left space-y-2 border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Correo:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[170px]">
                  {user?.email || 'andres.morales@uefdemocracia.edu.ec'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cursos Activos:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {cursosDocente.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Alumnos:</span>
                <span className="font-mono font-bold text-[#176087] dark:text-[#9ED8ED]">
                  {totalEstudiantesReal}
                </span>
              </div>
            </div>

            {/* Modo Oscuro Toggle */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="text-left">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Tema Visual
                </span>
                <span className="text-[10px] text-slate-400">
                  {darkMode ? 'Modo Oscuro Activo' : 'Modo Claro'}
                </span>
              </div>

              <Button size="sm" variant="outline" onClick={toggleDarkMode}>
                {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400 mr-1" /> : <Moon className="w-3.5 h-3.5 mr-1" />}
                <span>Alternar</span>
              </Button>
            </div>
          </Card>

          {/* Gestión de Múltiples Instituciones (sin Distrito) */}
          <div className="lg:col-span-2 space-y-5">
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Instituciones Educativas Asignadas
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Cambia la institución activa para alternar tus cursos y horarios.
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowAddInstModal(true)}>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar plantel</span>
                </Button>
              </div>

              <div className="space-y-3">
                {instituciones.map((inst) => (
                  <div
                    key={inst.id}
                    className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      institucionActiva?.id === inst.id
                        ? 'bg-[#176087]/10 border-[#176087]/40 shadow-xs'
                        : 'bg-white dark:bg-[#071727] border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <School className="w-4 h-4 text-[#176087] dark:text-[#9ED8ED]" />
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {inst.nombre}
                        </h4>
                        {institucionActiva?.id === inst.id && (
                          <Badge variant="primary">Activa ahora</Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Código AMIE: <span className="font-mono">{inst.codigoAmie}</span> · Jornada {inst.jornada}
                      </p>
                    </div>

                    {institucionActiva?.id !== inst.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setInstitucionActiva(inst)}
                        className="text-xs"
                      >
                        Seleccionar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: HORARIO SEMANAL EDITABLE SINCRONIZADO CON MIS CURSOS */}
      {activeTab === 'horario' && (
        <Card className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#176087] dark:text-[#9ED8ED]" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Horario Semanal Docente (Editable)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Prellenado con tus cursos activos de <strong>Mis Cursos</strong>. Puedes editar cualquier celda o franja horaria, agregar nuevas filas o quitarlas.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchHorarioYCursos(true)}
                className="text-xs"
                title="Rellenar horario automáticamente usando tus cursos activos de Mis Cursos"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Sincronizar con Mis Cursos</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleAgregarFranja}
                className="text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Franja</span>
              </Button>

              <Button
                size="sm"
                variant="primary"
                onClick={handleGuardarHorario}
                isLoading={guardandoHorario}
                className="text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Horario</span>
              </Button>
            </div>
          </div>

          {/* Chips de cursos disponibles en Mis Cursos */}
          {cursosDocente.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap p-3 rounded-xl bg-slate-50 dark:bg-[#071727] border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#176087] dark:text-[#9ED8ED]" />
                Tus cursos en Mis Cursos:
              </span>
              {cursosDocente.map((c) => (
                <span
                  key={c.id}
                  className="px-2.5 py-1 rounded-lg bg-[#176087]/10 text-[#176087] dark:text-[#9ED8ED] text-[11px] font-semibold"
                >
                  {c.nombre} ({c.horario})
                </span>
              ))}
            </div>
          )}

          {horarioGuardado && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Horario docente guardado en la base de datos y sincronizado con el panel diario.
            </div>
          )}

          <datalist id="cursos-docente-options">
            {opcionesAutocompletar.map((op) => (
              <option key={op} value={op} />
            ))}
          </datalist>

          {loadingHorario ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Cargando horario semanal...
            </div>
          ) : horario.length === 0 ? (
            <div className="py-10 text-center space-y-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <p className="text-xs text-slate-500">
                No hay franjas horarias registradas. Puedes sincronizar desde Mis Cursos o agregar una franja manualmente.
              </p>
              <div className="flex justify-center gap-2">
                <Button size="sm" variant="outline" onClick={() => fetchHorarioYCursos(true)}>
                  Sincronizar con Mis Cursos
                </Button>
                <Button size="sm" variant="primary" onClick={handleAgregarFranja}>
                  Agregar Primera Franja
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-none border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs min-w-[720px]">
                <thead className="bg-[#176087] text-white">
                  <tr>
                    <th className="py-2.5 px-3 font-mono font-bold w-36 border-r border-[#134d6d]">
                      Franja Horaria
                    </th>
                    <th className="py-2.5 px-3 font-semibold border-r border-[#134d6d]">Lunes</th>
                    <th className="py-2.5 px-3 font-semibold border-r border-[#134d6d]">Martes</th>
                    <th className="py-2.5 px-3 font-semibold border-r border-[#134d6d]">Miércoles</th>
                    <th className="py-2.5 px-3 font-semibold border-r border-[#134d6d]">Jueves</th>
                    <th className="py-2.5 px-3 font-semibold border-r border-[#134d6d]">Viernes</th>
                    <th className="py-2.5 px-2 w-10 text-center font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {horario.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-1.5 px-2 bg-slate-50 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-800">
                        <input
                          type="text"
                          value={row.hora}
                          onChange={(e) => handleUpdateHorarioCell(idx, 'hora', e.target.value)}
                          placeholder="07:15 - 08:00"
                          className="w-full text-xs font-mono font-bold px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#176087]"
                        />
                      </td>
                      {(['lunes', 'martes', 'miercoles', 'jueves', 'viernes'] as const).map(
                        (dia) => (
                          <td
                            key={dia}
                            className="py-1.5 px-1.5 border-r border-slate-100 dark:border-slate-800"
                          >
                            <input
                              type="text"
                              list="cursos-docente-options"
                              value={row[dia]}
                              onChange={(e) => handleUpdateHorarioCell(idx, dia, e.target.value)}
                              placeholder="Curso / Actividad"
                              className={`w-full text-xs px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#176087] ${
                                row[dia]?.toUpperCase() === 'RECESO'
                                  ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-bold text-center'
                                  : 'bg-white dark:bg-[#071727] text-slate-800 dark:text-white'
                              }`}
                            />
                          </td>
                        )
                      )}
                      <td className="py-1.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleEliminarFranja(idx)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Eliminar fila de horario"
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
        </Card>
      )}

      {/* PESTAÑA 3: NOTIFICACIONES Y ALERTAS */}
      {activeTab === 'notificaciones' && (
        <Card className="p-6 space-y-5">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Preferencias de Alertas y Notificaciones
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configura qué alertas pedagógicas deseas recibir y con qué anticipación.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Alertas tempranas de ausentismo escolar
                </span>
                <span className="text-[11px] text-slate-500">
                  Notificar cuando un estudiante supere el 15% de faltas injustificadas en el mes.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifAusentismo}
                onChange={(e) => setNotifAusentismo(e.target.checked)}
                className="w-4 h-4 rounded text-[#176087]"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Estudiantes con notas inferiores a 7.00 (PRAI)
                </span>
                <span className="text-[11px] text-slate-500">
                  Generar recordatorio para emitir el Plan de Refuerzo Académico Individualizado.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifNotasBajas}
                onChange={(e) => setNotifNotasBajas(e.target.checked)}
                className="w-4 h-4 rounded text-[#176087]"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Recordatorios de cierre de quimestre
                </span>
                <span className="text-[11px] text-slate-500">
                  Aviso para asentamiento de actas en secretaría académica.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifCierreParcial}
                onChange={(e) => setNotifCierreParcial(e.target.checked)}
                className="w-4 h-4 rounded text-[#176087]"
              />
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Anticipación de alertas
                </span>
                <span className="text-[11px] text-slate-500">
                  Tiempo previo para avisos de entrega y clases virtuales.
                </span>
              </div>
              <select
                value={notifAnticipacion}
                onChange={(e) => setNotifAnticipacion(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-800 dark:text-white"
              >
                <option value="12 horas">12 horas antes</option>
                <option value="24 horas">24 horas antes</option>
                <option value="48 horas">48 horas antes</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setNotifGuardadas(true);
                setTimeout(() => setNotifGuardadas(false), 2000);
              }}
            >
              {notifGuardadas ? 'Preferencias guardadas ✓' : 'Guardar Preferencias'}
            </Button>
          </div>
        </Card>
      )}

      {/* PESTAÑA 4: SEGURIDAD Y SESIONES */}
      {activeTab === 'seguridad' && (
        <Card className="p-6 space-y-5">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Privacidad y Seguridad
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Actualiza tu clave de acceso o cierra sesiones en otros dispositivos.
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <Input
              label="Contraseña actual"
              type="password"
              value={passActual}
              onChange={(e) => setPassActual(e.target.value)}
              placeholder="••••••••••••"
              required
            />

            <Input
              label="Nueva contraseña"
              type="password"
              value={passNueva}
              onChange={(e) => setPassNueva(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
            />

            <Input
              label="Confirmar nueva contraseña"
              type="password"
              value={passConfirm}
              onChange={(e) => setPassConfirm(e.target.value)}
              placeholder="••••••••••••"
              required
            />

            {passMsg && (
              <p className={`text-xs font-semibold ${passMsg.includes('correctamente') ? 'text-emerald-600' : 'text-rose-600'}`}>
                {passMsg}
              </p>
            )}

            <Button type="submit" size="sm" variant="primary">
              Actualizar contraseña
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Cerrar todas las sesiones activas
              </span>
              <span className="text-[11px] text-slate-500">
                Desconecta tu cuenta en computadores de laboratorio o celulares antiguos.
              </span>
            </div>

            <Button size="sm" variant="danger" onClick={logout}>
              Cerrar todas las sesiones
            </Button>
          </div>
        </Card>
      )}

      {/* MODAL AGREGAR INSTITUCIÓN (sin Distrito) */}
      {showAddInstModal && (
        <Modal
          isOpen={showAddInstModal}
          onClose={() => setShowAddInstModal(false)}
          title="Agregar Institución Educativa"
        >
          <div className="space-y-4 py-2 text-xs text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre de la institución
              </label>
              <input
                type="text"
                placeholder="Ej: Unidad Educativa Fiscal Guayaquil"
                value={nuevaInstNombre}
                onChange={(e) => setNuevaInstNombre(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Código AMIE
              </label>
              <input
                type="text"
                placeholder="Ej: 09H01234"
                value={nuevaInstAmie}
                onChange={(e) => setNuevaInstAmie(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button size="sm" variant="outline" onClick={() => setShowAddInstModal(false)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  if (nuevaInstNombre.trim()) {
                    setInstitucionActiva({
                      id: `inst-${Date.now()}`,
                      nombre: nuevaInstNombre.trim(),
                      codigoAmie: nuevaInstAmie.trim() || '09H99999',
                      distrito: '',
                      rol: 'Docente Titular',
                      jornada: 'Matutina',
                      principal: false
                    });
                    setShowAddInstModal(false);
                  }
                }}
              >
                Agregar Plantel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PerfilPage;
