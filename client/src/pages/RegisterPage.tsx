import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card, Badge } from '../components/ui';
import {
  User,
  Building,
  GraduationCap,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  Users
} from 'lucide-react';

export interface CursoRow {
  id: string;
  nivel: string;
  materia: string;
  grado: string;
  paralelo: string;
  estudiantesAprox: number;
  institucion?: string;
}

export interface EstudianteRow {
  lista: number;
  nombre: string;
  cedula?: string;
}

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, darkMode } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState('');

  // Paso 1: Datos Personales (sin valores por defecto)
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [edad, setEdad] = useState('');
  const [rol, setRol] = useState('Docente');

  // Paso 2: Institución Educativa (sin valores por defecto)
  const [institucion, setInstitucion] = useState('');
  const [provincia, setProvincia] = useState('Guayas');
  const [canton, setCanton] = useState('');
  const [niveles, setNiveles] = useState<string[]>([]);
  const [especialidadTecnica, setEspecialidadTecnica] = useState('');

  // Paso 3: Cursos y Paralelos (debe crear al menos 1 curso por sí mism@)
  const [cursos, setCursos] = useState<CursoRow[]>([]);

  // Paso 4: Estudiantes Agrupados por Curso
  const [estudiantesPorCurso, setEstudiantesPorCurso] = useState<Record<string, EstudianteRow[]>>({});
  const [selectedCursoId, setSelectedCursoId] = useState<string>('');
  const [archivoSubido, setArchivoSubido] = useState<Record<string, string>>({});
  const [nuevoNombreEstudiante, setNuevoNombreEstudiante] = useState('');
  const [nuevaCedulaEstudiante, setNuevaCedulaEstudiante] = useState('');

  const [loading, setLoading] = useState(false);

  const handleNivelChange = (n: string) => {
    if (niveles.includes(n)) {
      setNiveles(niveles.filter((x) => x !== n));
    } else {
      setNiveles([...niveles, n]);
    }
  };

  const handleAddCurso = () => {
    const defaultNivel = niveles.length > 0 ? niveles[0] : 'Educación Básica Superior';
    const newId = String(Date.now());
    const newCurso: CursoRow = {
      id: newId,
      nivel: defaultNivel,
      materia: '',
      grado: '',
      paralelo: 'A',
      estudiantesAprox: 30,
      institucion: institucion
    };
    setCursos([...cursos, newCurso]);
    if (!selectedCursoId) {
      setSelectedCursoId(newId);
    }
  };

  const handleRemoveCurso = (id: string) => {
    const updatedCursos = cursos.filter((c) => c.id !== id);
    setCursos(updatedCursos);
    const updatedEst = { ...estudiantesPorCurso };
    delete updatedEst[id];
    setEstudiantesPorCurso(updatedEst);
    if (selectedCursoId === id && updatedCursos.length > 0) {
      setSelectedCursoId(updatedCursos[0].id);
    }
  };

  const handleUpdateCurso = (id: string, field: keyof CursoRow, value: any) => {
    setCursos(cursos.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  // Cargar estudiantes desde archivo CSV / TXT / XLSX para un curso específico
  const handleFileUploadForCurso = async (e: React.ChangeEvent<HTMLInputElement>, cursoId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setArchivoSubido((prev) => ({ ...prev, [cursoId]: file.name }));

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      try {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
        const parsedList: EstudianteRow[] = [];

        rows.forEach((row) => {
          if (Array.isArray(row) && row.length >= 1) {
            const possibleName = String(row[0] || '').trim();
            if (
              possibleName &&
              !possibleName.toLowerCase().includes('nombre') &&
              !possibleName.toLowerCase().includes('estudiante') &&
              !possibleName.toLowerCase().includes('nombres y apellidos')
            ) {
              const possibleCedula = row[1] ? String(row[1]).trim() : '';
              parsedList.push({
                lista: parsedList.length + 1,
                nombre: possibleName,
                cedula: possibleCedula
              });
            }
          }
        });

        if (parsedList.length > 0) {
          setEstudiantesPorCurso((prev) => ({
            ...prev,
            [cursoId]: parsedList
          }));
        }
      } catch (err) {
        console.error('Error al procesar archivo Excel:', err);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (text) {
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
          const parsedList: EstudianteRow[] = [];

          lines.forEach((line) => {
            const parts = line.split(/[,;\t]/);
            if (parts.length >= 1) {
              const possibleName = parts[0].trim();
              if (
                possibleName &&
                !possibleName.toLowerCase().includes('nombre') &&
                !possibleName.toLowerCase().includes('estudiante')
              ) {
                const possibleCedula = parts[1] ? parts[1].trim() : '';
                parsedList.push({
                  lista: parsedList.length + 1,
                  nombre: possibleName,
                  cedula: possibleCedula
                });
              }
            }
          });

          if (parsedList.length > 0) {
            setEstudiantesPorCurso((prev) => ({
              ...prev,
              [cursoId]: parsedList
            }));
          }
        }
      };
      reader.readAsText(file); // solo para CSV y TXT
    }
  };

  const handleAddManualEstudiante = (cursoId: string) => {
    if (!nuevoNombreEstudiante.trim()) return;
    const currentList = estudiantesPorCurso[cursoId] || [];
    const newStudent: EstudianteRow = {
      lista: currentList.length + 1,
      nombre: nuevoNombreEstudiante.trim(),
      cedula: nuevaCedulaEstudiante.trim()
    };
    setEstudiantesPorCurso({
      ...estudiantesPorCurso,
      [cursoId]: [...currentList, newStudent]
    });
    setNuevoNombreEstudiante('');
    setNuevaCedulaEstudiante('');
  };

  const handleRemoveEstudiante = (cursoId: string, index: number) => {
    const currentList = estudiantesPorCurso[cursoId] || [];
    const updatedList = currentList.filter((_, i) => i !== index).map((e, idx) => ({ ...e, lista: idx + 1 }));
    setEstudiantesPorCurso({
      ...estudiantesPorCurso,
      [cursoId]: updatedList
    });
  };

  // Validaciones estrictas por paso
  const validateAndNextStep = () => {
    setStepError('');

    if (currentStep === 1) {
      if (!nombre.trim()) {
        setStepError('Por favor ingrese su nombre completo.');
        return;
      }
      const emailRegex = /\S+@\S+\.\S+/;
      if (!email.trim() || !emailRegex.test(email)) {
        setStepError('Por favor ingrese un correo electrónico válido (ejemplo: docente@correo.com).');
        return;
      }
      if (!password || password.length < 6) {
        setStepError('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (password !== passwordConfirm) {
        setStepError('La confirmación de la contraseña no coincide con la contraseña definida.');
        return;
      }
    }

    if (currentStep === 2) {
      if (!institucion.trim()) {
        setStepError('Por favor ingrese el nombre de su institución educativa.');
        return;
      }
      if (!canton.trim()) {
        setStepError('Por favor ingrese el cantón.');
        return;
      }
      if (niveles.length === 0) {
        setStepError('Debe seleccionar al menos un nivel educativo en el que imparte clases.');
        return;
      }
    }

    if (currentStep === 3) {
      if (cursos.length === 0) {
        setStepError('Es requisito obligatorio registrar al menos 1 curso por usted mismo/a.');
        return;
      }
      for (let i = 0; i < cursos.length; i++) {
        const c = cursos[i];
        if (!c.materia.trim()) {
          setStepError(`Por favor ingrese la materia para el Curso #${i + 1}.`);
          return;
        }
        if (!c.grado.trim()) {
          setStepError(`Por favor ingrese el Grado/Año para el Curso #${i + 1}.`);
          return;
        }
        if (!c.paralelo.trim()) {
          setStepError(`Por favor ingrese el paralelo para el Curso #${i + 1}.`);
          return;
        }
      }
      // Set initial selected course for Step 4
      if (cursos.length > 0 && !selectedCursoId) {
        setSelectedCursoId(cursos[0].id);
      }
    }

    setCurrentStep(currentStep + 1);
  };

  const handleFinish = async () => {
    setStepError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        })
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || data?.message || 'Error al completar el registro.');
      }

      const loginOk = await login(email, password);
      setLoading(false);
      if (loginOk) {
        navigate('/dashboard?onboarding=true');
      } else {
        setStepError('Registro exitoso. Por favor ingresa con tus credenciales desde la pantalla de Iniciar Sesión.');
      }
    } catch (e: any) {
      console.error('Error durante el registro:', e);
      setStepError(e.message || 'Error de conexión al registrar el usuario.');
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: 'Datos Personales', icon: User },
    { num: 2, label: 'Institución', icon: Building },
    { num: 3, label: 'Cursos y Paralelos', icon: GraduationCap },
    { num: 4, label: 'Importar Estudiantes', icon: Upload }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#071727] py-10 px-4 sm:px-6 lg:px-8 text-slate-900 dark:text-white">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-3">
            <img
              src={darkMode ? "/asap/assets/aistudio/light_no-bg_f57d3182.png" : "/asap/assets/aistudio/no_bg_a8451225.png"}
              alt="asap"
              className="max-w-[130px] h-auto mx-auto object-contain"
            />
          </Link>
          <h2 className="text-2xl font-bold tracking-tight">Registro de Docente</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configura tu cuenta institucional en 4 sencillos pasos
          </p>
        </div>

        {/* Stepper Indicator */}
        <div className="flex items-center justify-between mb-8 px-4 sm:px-8">
          {steps.map((st, idx) => {
            const Icon = st.icon;
            const isCompleted = currentStep > st.num;
            const isCurrent = currentStep === st.num;

            return (
              <div key={st.num} className="flex-1 flex items-center">
                <div className="flex flex-col items-center mx-auto text-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-[#176087] text-white ring-4 ring-[#9ED8ED]/40'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span
                    className={`text-[10px] mt-1.5 font-semibold hidden sm:block ${
                      isCurrent ? 'text-[#176087] dark:text-[#9ED8ED]' : 'text-slate-400'
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-all ${
                      currentStep > st.num ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Banner de Error en el Paso */}
        {stepError && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{stepError}</span>
          </div>
        )}

        {/* Step Card */}
        <Card className="p-6 sm:p-8 shadow-xl text-left">
          {/* PASO 1: DATOS PERSONALES */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                Paso 1 — Datos Personales
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nombre completo"
                  required
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value);
                    if (stepError) setStepError('');
                  }}
                  placeholder="Ej: Lic. Andrés Morales R."
                />

                <Input
                  label="Correo electrónico"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (stepError) setStepError('');
                  }}
                  placeholder="Ej: andres.morales@ejemplo.com"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Contraseña"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (stepError) setStepError('');
                  }}
                  placeholder="Ingresa tu contraseña (mín. 6 caracteres)"
                />

                <Input
                  label="Confirmar contraseña"
                  type="password"
                  required
                  value={passwordConfirm}
                  onChange={(e) => {
                    setPasswordConfirm(e.target.value);
                    if (stepError) setStepError('');
                  }}
                  placeholder="Repite tu contraseña exactamente"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Edad"
                  type="number"
                  value={edad}
                  onChange={(e) => setEdad(e.target.value)}
                  placeholder="Ej: 36"
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Rol en la institución
                  </label>
                  <select
                    value={rol}
                    onChange={(e) => setRol(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white focus:outline-none focus:border-[#176087]"
                  >
                    <option value="Docente">Docente (Activo)</option>
                    <option value="Director" disabled title="Próximamente">
                      Director / Rector (Próximamente)
                    </option>
                    <option value="Coordinador" disabled title="Próximamente">
                      Coordinador DECE (Próximamente)
                    </option>
                    <option value="Estudiante" disabled title="Próximamente">
                      Estudiante (Próximamente)
                    </option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: INSTITUCIÓN */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                Paso 2 — Institución Educativa
              </h3>

              <Input
                label="Nombre de la Institución Educativa"
                required
                value={institucion}
                onChange={(e) => {
                  setInstitucion(e.target.value);
                  if (stepError) setStepError('');
                }}
                placeholder="Ej: Colegio Fiscal Vicente Rocafuerte"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Provincia
                  </label>
                  <select
                    value={provincia}
                    onChange={(e) => setProvincia(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white focus:outline-none focus:border-[#176087]"
                  >
                    <option value="Guayas">Guayas</option>
                    <option value="Pichincha">Pichincha</option>
                    <option value="Azuay">Azuay</option>
                    <option value="Manabí">Manabí</option>
                    <option value="El Oro">El Oro</option>
                    <option value="Loja">Loja</option>
                    <option value="Tungurahua">Tungurahua</option>
                    <option value="Imbabura">Imbabura</option>
                    <option value="Chimborazo">Chimborazo</option>
                    <option value="Santo Domingo">Santo Domingo</option>
                    <option value="Los Ríos">Los Ríos</option>
                    <option value="Esmeraldas">Esmeraldas</option>
                    <option value="Cotopaxi">Cotopaxi</option>
                  </select>
                </div>

                <Input
                  label="Cantón"
                  required
                  value={canton}
                  onChange={(e) => {
                    setCanton(e.target.value);
                    if (stepError) setStepError('');
                  }}
                  placeholder="Ej: Guayaquil, Quito, Cuenca..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                  Niveles en los que imparte clases (selecciona los que correspondan):
                </label>
                <div className="space-y-2.5">
                  {[
                    'Inicial / Preescolar',
                    'Educación Básica (Elemental / Media)',
                    'Educación Básica Superior',
                    'Bachillerato General Unificado (BGU)',
                    'Bachillerato Técnico'
                  ].map((niv) => (
                    <label key={niv} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-[#176087]">
                      <input
                        type="checkbox"
                        checked={niveles.includes(niv)}
                        onChange={() => {
                          handleNivelChange(niv);
                          if (stepError) setStepError('');
                        }}
                        className="rounded text-[#176087] focus:ring-[#176087]"
                      />
                      <span>{niv}</span>
                    </label>
                  ))}
                </div>
              </div>

              {niveles.includes('Bachillerato Técnico') && (
                <div className="pt-2">
                  <Input
                    label="Especialidad Técnica (ej: Informática, Contabilidad, Mecánica)"
                    value={especialidadTecnica}
                    onChange={(e) => setEspecialidadTecnica(e.target.value)}
                    placeholder="Ej: Desarrollo de Software, Contabilidad..."
                  />
                </div>
              )}
            </div>
          )}

          {/* PASO 3: CURSOS Y PARALELOS */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Paso 3 — Cursos y Paralelos
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Agrega los cursos que vas a dictar. Debes registrar al menos 1 curso por ti mism@.
                  </p>
                </div>
                <Button size="sm" variant="primary" onClick={handleAddCurso}>
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar curso
                </Button>
              </div>

              {cursos.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl space-y-3">
                  <GraduationCap className="w-12 h-12 text-[#176087] dark:text-[#9ED8ED] mx-auto opacity-70" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Aún no has agregado ningún curso
                  </p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Haz clic en el botón superior <strong>"Agregar curso"</strong> para empezar a registrar tus asignaturas y paralelos.
                  </p>
                  <Button size="sm" variant="outline" onClick={handleAddCurso}>
                    <Plus className="w-4 h-4 mr-1" />
                    Crear mi primer curso
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cursos.map((c, index) => (
                    <div
                      key={c.id}
                      className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#071727]/60 relative space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2">
                        <span className="text-xs font-bold text-[#176087] dark:text-[#9ED8ED] flex items-center gap-1.5">
                          <Badge variant="primary">Curso #{index + 1}</Badge>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCurso(c.id)}
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                          title="Eliminar curso"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            Nivel Educativo
                          </label>
                          <select
                            value={c.nivel}
                            onChange={(e) => handleUpdateCurso(c.id, 'nivel', e.target.value)}
                            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A2239] text-slate-900 dark:text-white"
                          >
                            {niveles.length > 0 ? (
                              niveles.map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))
                            ) : (
                              <option value="Educación Básica Superior">Educación Básica Superior</option>
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            Materia / Asignatura <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={c.materia}
                            onChange={(e) => handleUpdateCurso(c.id, 'materia', e.target.value)}
                            placeholder="Ej: Lengua y Literatura, Matemáticas..."
                            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A2239] text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            Grado / Año <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={c.grado}
                            onChange={(e) => handleUpdateCurso(c.id, 'grado', e.target.value)}
                            placeholder="Ej: 8vo EGB, 1er BGU..."
                            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A2239] text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            Paralelo <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={c.paralelo}
                            onChange={(e) => handleUpdateCurso(c.id, 'paralelo', e.target.value)}
                            placeholder="Ej: A, B, C..."
                            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A2239] text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            Estudiantes Aprox.
                          </label>
                          <input
                            type="number"
                            value={c.estudiantesAprox}
                            onChange={(e) => handleUpdateCurso(c.id, 'estudiantesAprox', Number(e.target.value))}
                            placeholder="30"
                            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A2239] text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PASO 4: IMPORTAR ESTUDIANTES */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                  Paso 4 — Importar Nómina de Estudiantes por Curso
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Carga la lista de alumnos para cada uno de los cursos que registraste.
                </p>
              </div>

              {cursos.length === 0 ? (
                <p className="text-xs text-amber-600">No registraste ningún curso en el paso anterior. Puedes continuar y agregarlos luego.</p>
              ) : (
                <div className="space-y-4">
                  {/* Selector de Curso Activo */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Selecciona el curso para gestionar sus estudiantes:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {cursos.map((c) => {
                        const isSel = selectedCursoId === c.id;
                        const count = (estudiantesPorCurso[c.id] || []).length;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setSelectedCursoId(c.id)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                              isSel
                                ? 'bg-[#176087] text-white border-[#176087] shadow-sm'
                                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#176087]'
                            }`}
                          >
                            <span>
                              {c.grado || 'Grado'} {c.paralelo || ''} — {c.materia || 'Materia'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] ${
                                isSel ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {count} alumnos
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedCursoId && (
                    <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 bg-slate-50/50 dark:bg-[#071727]/30">
                      {/* Subida de archivo CSV / TXT */}
                      <div className="p-5 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center space-y-2 hover:border-[#176087] transition-colors bg-white dark:bg-[#0A2239]">
                        <FileSpreadsheet className="w-8 h-8 text-[#176087] dark:text-[#9ED8ED] mx-auto" />
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Subir nómina para {cursos.find((c) => c.id === selectedCursoId)?.grado} "{cursos.find((c) => c.id === selectedCursoId)?.paralelo}"
                        </h4>
                        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                          Sube un archivo de texto o CSV. Cada línea debe contener el nombre completo del estudiante (opcionalmente separado por coma con la cédula).
                        </p>
                        <div className="pt-1">
                          <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#176087] text-white hover:bg-[#124b6a] cursor-pointer shadow-sm">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Cargar archivo (CSV / TXT)</span>
                            <input
                              type="file"
                              accept=".csv,.txt,.xlsx,.xls"
                              onChange={(e) => handleFileUploadForCurso(e, selectedCursoId)}
                              className="hidden"
                            />
                          </label>
                        </div>
                        {archivoSubido[selectedCursoId] && (
                          <p className="text-[11px] text-emerald-600 font-bold mt-1">
                            ✓ Archivo procesado: {archivoSubido[selectedCursoId]}
                          </p>
                        )}
                      </div>

                      {/* Ingreso manual de estudiante */}
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          O agrega estudiantes manualmente:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Apellidos y Nombres"
                            value={nuevoNombreEstudiante}
                            onChange={(e) => setNuevoNombreEstudiante(e.target.value)}
                            className="text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A2239] text-slate-900 dark:text-white"
                          />
                          <input
                            type="text"
                            placeholder="Cédula (Opcional)"
                            value={nuevaCedulaEstudiante}
                            onChange={(e) => setNuevaCedulaEstudiante(e.target.value)}
                            className="text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A2239] text-slate-900 dark:text-white"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => handleAddManualEstudiante(selectedCursoId)}
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Agregar
                          </Button>
                        </div>
                      </div>

                      {/* Lista de estudiantes en el curso */}
                      <div className="pt-2">
                        <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                          <span>Lista de estudiantes ({estudiantesPorCurso[selectedCursoId]?.length || 0}):</span>
                        </h5>

                        {(!estudiantesPorCurso[selectedCursoId] || estudiantesPorCurso[selectedCursoId].length === 0) ? (
                          <p className="text-xs text-slate-400 italic bg-white dark:bg-[#0A2239] p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                            No hay estudiantes registrados en este curso aún.
                          </p>
                        ) : (
                          <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A2239]">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold sticky top-0">
                                <tr>
                                  <th className="px-3 py-2 w-10">#</th>
                                  <th className="px-3 py-2">Apellidos y Nombres</th>
                                  <th className="px-3 py-2">Cédula</th>
                                  <th className="px-3 py-2 w-10 text-right"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {estudiantesPorCurso[selectedCursoId].map((p, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-3 py-2 font-mono text-slate-400">{p.lista}</td>
                                    <td className="px-3 py-2 font-medium">{p.nombre}</td>
                                    <td className="px-3 py-2 font-mono text-slate-500">{p.cedula || 'N/A'}</td>
                                    <td className="px-3 py-2 text-right">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveEstudiante(selectedCursoId, idx)}
                                        className="text-slate-400 hover:text-rose-500"
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
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setStepError('');
                  setCurrentStep(currentStep - 1);
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Atrás
              </Button>
            ) : (
              <Link to="/login" className="text-xs text-[#176087] dark:text-[#9ED8ED] hover:underline font-medium">
                ¿Ya tienes una cuenta? Iniciar sesión
              </Link>
            )}

            {currentStep < 4 ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={validateAndNextStep}
              >
                Siguiente
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFinish}
                  isLoading={loading}
                >
                  Omitir nomina por ahora
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleFinish}
                  isLoading={loading}
                >
                  Confirmar e Ingresar
                  <CheckCircle2 className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
