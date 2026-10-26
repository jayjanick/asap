import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Badge, Input, InfoTooltip } from '../components/ui';
import { Modal } from '../components/ui/Dialogs';
import { HORARIO_DOCENTE_SEMANAL } from '../data/mockData';
import {
  User,
  Settings,
  Calendar,
  Mail,
  Video,
  Share2,
  CheckCircle2,
  Sun,
  Moon,
  Shield,
  Key,
  School,
  Bell,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Check,
  Save,
  Lock
} from 'lucide-react';

export const PerfilPage: React.FC = () => {
  const {
    user,
    darkMode,
    toggleDarkMode,
    institucionActiva,
    instituciones,
    setInstitucionActiva,
    logout
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'perfil' | 'horario' | 'integraciones' | 'notificaciones' | 'seguridad'>('perfil');

  // Horario Semanal Editable (P5.2)
  const [horario, setHorario] = useState(HORARIO_DOCENTE_SEMANAL);
  const [horarioGuardado, setHorarioGuardado] = useState(false);

  // Integraciones (P5.2)
  const [integraciones, setIntegraciones] = useState([
    {
      id: 'g-cal',
      nombre: 'Google Calendar',
      servicio: 'Google Workspace',
      conectado: false,
      apiKey: '',
      descripcion: 'Sincroniza tus bloques de clase y juntas de curso en tu calendario personal.',
      icono: 'GC'
    },
    {
      id: 'gmail-outlook',
      nombre: 'Gmail / Outlook Institucional',
      servicio: 'Correo Institucional',
      conectado: false,
      apiKey: '',
      descripcion: 'Envío de comunicados y citaciones automáticas a padres de familia.',
      icono: 'GM'
    },
    {
      id: 'zoom',
      nombre: 'Zoom Clases Virtuales',
      servicio: 'Videoconferencia',
      conectado: false,
      apiKey: '',
      descripcion: 'Acceso directo a la sala virtual para refuerzo pedagógico en línea.',
      icono: 'ZM'
    },
    {
      id: 'teams',
      nombre: 'Microsoft Teams Educativo',
      servicio: 'Microsoft 365 Educación',
      conectado: false,
      apiKey: '',
      descripcion: 'Canal colaborativo institucional para comisiones docentes.',
      icono: 'MS'
    }
  ]);

  const [selectedInteg, setSelectedInteg] = useState<any | null>(null);
  const [modalIntegKey, setModalIntegKey] = useState('');

  // Notificaciones (P5.2)
  const [notifAusentismo, setNotifAusentismo] = useState(true);
  const [notifNotasBajas, setNotifNotasBajas] = useState(true);
  const [notifCierreParcial, setNotifCierreParcial] = useState(true);
  const [notifAnticipacion, setNotifAnticipacion] = useState('24 horas');
  const [notifGuardadas, setNotifGuardadas] = useState(false);

  // Seguridad (P5.2)
  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  const [passConfirm, setPassConfirm] = useState('');
  const [passMsg, setPassMsg] = useState('');

  // Nueva Institución Modal (P5.2)
  const [showAddInstModal, setShowAddInstModal] = useState(false);
  const [nuevaInstNombre, setNuevaInstNombre] = useState('');
  const [nuevaInstAmie, setNuevaInstAmie] = useState('');
  const [nuevaInstDistrito, setNuevaInstDistrito] = useState('Distrito 09D04');

  const handleUpdateHorarioCell = (rowIndex: number, dia: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes', valor: string) => {
    const updated = [...horario];
    updated[rowIndex] = {
      ...updated[rowIndex],
      [dia]: valor
    };
    setHorario(updated);
  };

  const handleGuardarHorario = () => {
    setHorarioGuardado(true);
    setTimeout(() => setHorarioGuardado(false), 2500);
  };

  const handleOpenConfigInteg = (integ: any) => {
    setSelectedInteg(integ);
    setModalIntegKey(integ.apiKey);
  };

  const handleSaveInteg = () => {
    if (!selectedInteg) return;
    setIntegraciones((prev) =>
      prev.map((item) =>
        item.id === selectedInteg.id
          ? { ...item, apiKey: modalIntegKey, conectado: Boolean(modalIntegKey.trim()) }
          : item
      )
    );
    setSelectedInteg(null);
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

  return (
    <div className="space-y-6 text-left max-w-5xl">
      {/* 1. Header con InfoTooltip (P3.1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#176087] dark:text-[#9ED8ED]" />
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Configuración del Docente
          </h2>
          <InfoTooltip content="Administra tus instituciones educativas, horario semanal de clases, integraciones con Google y preferencias del sistema." />
        </div>

        {/* Pestañas de configuración */}
        <div className="flex items-center gap-1 p-1 bg-slate-200 dark:bg-slate-800 rounded-xl overflow-x-auto scrollbar-none self-start sm:self-auto">
          {[
            { id: 'perfil', label: 'Perfil & Planteles' },
            { id: 'horario', label: 'Horario Semanal' },
            { id: 'integraciones', label: 'Integraciones' },
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

      {/* PESTAÑA 1: PERFIL & INSTITUCIONES (P3.8 & P5.2) */}
      {activeTab === 'perfil' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 space-y-5 text-center">
            <div className="relative inline-block mx-auto">
              <div className="w-20 h-20 rounded-full bg-[#176087] text-white flex items-center justify-center font-bold text-2xl shadow-xl ring-4 ring-[#9ED8ED]/40 mx-auto">
                AM
              </div>
              <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0A2239]" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {user?.nombre || 'Lic. Andrés Morales'}
              </h3>
              <p className="text-xs text-[#176087] dark:text-[#9ED8ED] font-semibold mt-0.5">
                Docente de Lengua y Literatura
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
                <span className="text-slate-400">Distrito:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {institucionActiva?.distrito || '09D04 Guayaquil'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Alumnos:</span>
                <span className="font-mono font-bold text-[#176087] dark:text-[#9ED8ED]">60</span>
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

          {/* Gestión de Múltiples Instituciones (P3.8 & P5.2) */}
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
                        Código AMIE: <span className="font-mono">{inst.codigoAmie}</span> · {inst.distrito} · Jornada {inst.jornada}
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

            {/* TODO: habilitar cuando haya evaluaciones de estudiantes y autoridades (P5.1) */}
            {/* La sección de autoevaluación / desempeño docente permanece oculta */}
          </div>
        </div>
      )}

      {/* PESTAÑA 2: HORARIO SEMANAL EDITABLE (P5.2) */}
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
                Modifica tus bloques de clase por día. Este horario alimenta directamente el indicador &quot;En curso ahora&quot; del panel diario.
              </p>
            </div>

            <Button size="sm" variant="primary" onClick={handleGuardarHorario} className="text-xs">
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Horario</span>
            </Button>
          </div>

          {horarioGuardado && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Horario docente actualizado y sincronizado con el panel diario.
            </div>
          )}

          <div className="overflow-x-auto scrollbar-none border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#176087] text-white">
                <tr>
                  <th className="py-2.5 px-3 font-mono font-bold w-32 border-r border-[#134d6d]">Franja Horaria</th>
                  <th className="py-2.5 px-3 font-semibold border-r border-[#134d6d]">Lunes</th>
                  <th className="py-2.5 px-3 font-semibold border-r border-[#134d6d]">Martes</th>
                  <th className="py-2.5 px-3 font-semibold border-r border-[#134d6d]">Miércoles</th>
                  <th className="py-2.5 px-3 font-semibold border-r border-[#134d6d]">Jueves</th>
                  <th className="py-2.5 px-3 font-semibold">Viernes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {horario.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3 font-mono text-slate-500 font-bold bg-slate-50 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-800">
                      {row.hora}
                    </td>
                    {(['lunes', 'martes', 'miercoles', 'jueves', 'viernes'] as const).map((dia) => (
                      <td key={dia} className="py-1 px-1.5 border-r border-slate-100 dark:border-slate-800">
                        <input
                          type="text"
                          value={row[dia]}
                          onChange={(e) => handleUpdateHorarioCell(idx, dia, e.target.value)}
                          className="w-full text-xs px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-800 dark:text-white focus:outline-none focus:border-[#176087]"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* PESTAÑA 3: INTEGRACIONES EXTERNAS (P5.2) */}
      {activeTab === 'integraciones' && (
        <Card className="p-6 space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Integraciones con Servicios Externos
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Conecta Google Calendar, cuentas de correo y salas de clases virtuales para automatizar tu flujo docente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integraciones.map((integ) => (
              <div
                key={integ.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071727] flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#176087]/15 text-[#176087] dark:text-[#9ED8ED] flex items-center justify-center font-bold text-xs">
                        {integ.icono}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {integ.nombre}
                        </h4>
                        <span className="text-[10px] text-slate-400">{integ.servicio}</span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        integ.conectado
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                      }`}
                    >
                      {integ.conectado ? 'Conectado ✓' : 'Desconectado'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {integ.descripcion}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[170px]">
                    {integ.apiKey ? integ.apiKey : 'Sin credencial configurada'}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => handleOpenConfigInteg(integ)}>
                    Configurar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* PESTAÑA 4: NOTIFICACIONES Y ALERTAS (P5.2) */}
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

      {/* PESTAÑA 5: SEGURIDAD Y SESIONES (P5.2) */}
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

      {/* MODAL CONFIGURAR INTEGRACIÓN */}
      {selectedInteg && (
        <Modal
          isOpen={Boolean(selectedInteg)}
          onClose={() => setSelectedInteg(null)}
          title={`Configuración de ${selectedInteg.nombre}`}
        >
          <div className="space-y-4 py-2 text-xs text-left">
            <p className="text-slate-600 dark:text-slate-300">
              Ingresa el token, ID de cliente o enlace permanente para vincular este servicio con tu cuenta de docente.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                API Key / URL de integración
              </label>
              <input
                type="text"
                value={modalIntegKey}
                onChange={(e) => setModalIntegKey(e.target.value)}
                placeholder="Ej: AIzaSy... o https://zoom.us/..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
              />
            </div>

            <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800 text-[11px] text-sky-800 dark:text-sky-300">
              Las credenciales se almacenan localmente y se transmiten únicamente mediante canales cifrados.
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button size="sm" variant="outline" onClick={() => setSelectedInteg(null)}>
                Cancelar
              </Button>
              <Button size="sm" variant="primary" onClick={handleSaveInteg}>
                Guardar Conexión
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL AGREGAR INSTITUCIÓN */}
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Distrito Educativo
              </label>
              <input
                type="text"
                value={nuevaInstDistrito}
                onChange={(e) => setNuevaInstDistrito(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
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
                      distrito: nuevaInstDistrito.trim(),
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
