import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  ArrowLeft
} from 'lucide-react';

interface CursoRow {
  id: string;
  materia: string;
  grado: string;
  paralelo: string;
  estudiantesAprox: number;
  especialidad?: string;
}

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  // Paso 1
  const [nombre, setNombre] = useState('Lic. Andrés Morales');
  const [email, setEmail] = useState('andres.morales@educacion.gob.ec');
  const [password, setPassword] = useState('asap2026');
  const [passwordConfirm, setPasswordConfirm] = useState('asap2026');
  const [edad, setEdad] = useState('36');
  const [rol, setRol] = useState('Docente');

  // Paso 2
  const [institucion, setInstitucion] = useState('Colegio Fiscal Vicente Rocafuerte');
  const [provincia, setProvincia] = useState('Guayas');
  const [canton, setCanton] = useState('Guayaquil');
  const [niveles, setNiveles] = useState<string[]>(['Básica Superior', 'Bachillerato General Unificado']);
  const [especialidadTecnica, setEspecialidadTecnica] = useState('');

  // Paso 3
  const [cursos, setCursos] = useState<CursoRow[]>([
    { id: '1', materia: 'Lengua y Literatura', grado: '8vo EGB', paralelo: 'A', estudiantesAprox: 30 },
    { id: '2', materia: 'Lengua y Literatura', grado: '9no EGB', paralelo: 'B', estudiantesAprox: 30 }
  ]);

  // Paso 4
  const [archivoSubido, setArchivoSubido] = useState<string | null>(null);
  const [previewDatos, setPreviewDatos] = useState<any[]>([
    { lista: 1, nombre: 'Alvarado Mendoza Juan Diego', cedula: '0928374112' },
    { lista: 2, nombre: 'Andrade Suárez Valentina Sofía', cedula: '0937481920' },
    { lista: 3, nombre: 'Barahona Zambrano Carlos Andrés', cedula: '0948291039' },
    { lista: 4, nombre: 'Campoverde Silva Doménica Isabella', cedula: '0958192834' }
  ]);

  const [loading, setLoading] = useState(false);

  const handleNivelChange = (n: string) => {
    if (niveles.includes(n)) {
      setNiveles(niveles.filter((x) => x !== n));
    } else {
      setNiveles([...niveles, n]);
    }
  };

  const handleAddCurso = () => {
    setCursos([
      ...cursos,
      {
        id: String(Date.now()),
        materia: 'Lengua y Literatura',
        grado: '10mo EGB',
        paralelo: 'C',
        estudiantesAprox: 32
      }
    ]);
  };

  const handleRemoveCurso = (id: string) => {
    if (cursos.length <= 1) return;
    setCursos(cursos.filter((c) => c.id !== id));
  };

  const handleUpdateCurso = (id: string, field: keyof CursoRow, value: any) => {
    setCursos(cursos.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArchivoSubido(file.name);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    // Registrar usuario en backend si está disponible
    try {
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, institucion, cursos })
      });
    } catch (e) {
      console.warn('API fallback:', e);
    }

    await login(email, password);
    setLoading(false);
    navigate('/dashboard?onboarding=true');
  };

  const steps = [
    { num: 1, label: 'Datos Personales', icon: User },
    { num: 2, label: 'Institución', icon: Building },
    { num: 3, label: 'Cursos y Paralelos', icon: GraduationCap },
    { num: 4, label: 'Importar Estudiantes', icon: Upload }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#071727] py-12 px-4 sm:px-6 lg:px-8 text-slate-900 dark:text-white">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-3">
            <img
              src="/assets/aistudio/asap_0e7fa1e8.png"
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
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Lic. Andrés Morales R."
                />

                <Input
                  label="Correo institucional"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="andres.morales@educacion.gob.ec"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Contraseña"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                />

                <Input
                  label="Confirmar contraseña"
                  type="password"
                  required
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="••••••••••••"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Edad"
                  type="number"
                  value={edad}
                  onChange={(e) => setEdad(e.target.value)}
                  placeholder="36"
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
                    <option value="Docente">Docente (Activo en MVP)</option>
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
                onChange={(e) => setInstitucion(e.target.value)}
                placeholder="Colegio Fiscal Vicente Rocafuerte"
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
                  </select>
                </div>

                <Input
                  label="Cantón"
                  required
                  value={canton}
                  onChange={(e) => setCanton(e.target.value)}
                  placeholder="Guayaquil"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                  Niveles en los que imparte clases (selección múltiple):
                </label>
                <div className="space-y-2">
                  {[
                    'Inicial',
                    'Educación Básica (Elemental / Media)',
                    'Básica Superior',
                    'Bachillerato General Unificado (BGU)',
                    'Bachillerato Técnico'
                  ].map((niv) => (
                    <label key={niv} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={niveles.includes(niv)}
                        onChange={() => handleNivelChange(niv)}
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
                    placeholder="Desarrollo de Software y Redes"
                  />
                </div>
              )}
            </div>
          )}

          {/* PASO 3: CURSOS Y PARALELOS */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Paso 3 — Cursos y Paralelos
                  </h3>
                  <p className="text-xs text-slate-500">Registra al menos 1 curso donde impartes clases este año.</p>
                </div>
                <Button size="sm" variant="outline" onClick={handleAddCurso}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Agregar otro curso
                </Button>
              </div>

              <div className="space-y-3">
                {cursos.map((c, index) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#071727]/60 relative space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#176087] dark:text-[#9ED8ED]">
                        Curso #{index + 1}
                      </span>
                      {cursos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCurso(c.id)}
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                          title="Eliminar fila"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Materia</label>
                        <input
                          type="text"
                          value={c.materia}
                          onChange={(e) => handleUpdateCurso(c.id, 'materia', e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A2239]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Grado / Año</label>
                        <input
                          type="text"
                          value={c.grado}
                          onChange={(e) => handleUpdateCurso(c.id, 'grado', e.target.value)}
                          placeholder="8vo EGB"
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A2239]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Paralelo</label>
                        <input
                          type="text"
                          value={c.paralelo}
                          onChange={(e) => handleUpdateCurso(c.id, 'paralelo', e.target.value)}
                          placeholder="A"
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A2239]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Estudiantes aprox.</label>
                        <input
                          type="number"
                          value={c.estudiantesAprox}
                          onChange={(e) => handleUpdateCurso(c.id, 'estudiantesAprox', Number(e.target.value))}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0A2239]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PASO 4: IMPORTAR ESTUDIANTES */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                Paso 4 — Importar Lista de Estudiantes
              </h3>

              <div className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-2 hover:border-[#176087] transition-colors">
                <FileSpreadsheet className="w-10 h-10 text-[#176087] dark:text-[#9ED8ED] mx-auto" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Subir nómina de estudiantes
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Formatos aceptados: <strong>CSV, XLSX, PDF, DOCX</strong>. El archivo debe contener al menos: nombre completo y cédula (opcional).
                </p>
                <div className="pt-2">
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#176087] text-white hover:bg-[#124b6a] cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Seleccionar archivo local</span>
                    <input type="file" accept=".csv,.xlsx,.xls,.pdf,.docx" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
                {archivoSubido && (
                  <p className="text-xs text-emerald-600 font-bold mt-2">
                    ✓ Archivo cargado: {archivoSubido}
                  </p>
                )}
              </div>

              {/* Preview de datos detectados */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Vista previa de estudiantes detectados:
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                      <tr>
                        <th className="px-3 py-2 w-12">#</th>
                        <th className="px-3 py-2">Apellidos y Nombres</th>
                        <th className="px-3 py-2">Cédula</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {previewDatos.map((p) => (
                        <tr key={p.lista}>
                          <td className="px-3 py-2 font-mono text-slate-400">{p.lista}</td>
                          <td className="px-3 py-2 font-medium">{p.nombre}</td>
                          <td className="px-3 py-2 font-mono text-slate-500">{p.cedula}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Atrás
              </Button>
            ) : (
              <Link to="/login" className="text-xs text-slate-500 hover:underline">
                ¿Ya tienes cuenta? Iniciar sesión
              </Link>
            )}

            {currentStep < 4 ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setCurrentStep(currentStep + 1)}
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
                  Omitir por ahora
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
