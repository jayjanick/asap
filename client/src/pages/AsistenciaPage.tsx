import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config/api';
import { PARALELOS_INICIALES, ParaleloInfo } from '../data/mockData';
import { Card, Button, Badge, InfoTooltip } from '../components/ui';
import {
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  MapPin,
  Users
} from 'lucide-react';

export const AsistenciaPage: React.FC = () => {
  const [paralelos, setParalelos] = useState<ParaleloInfo[]>(PARALELOS_INICIALES);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    // Cargar estado actualizado desde backend
    fetch(`${API_URL}/api/asistencia`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.paralelos) {
          setParalelos(data.paralelos);
        }
      })
      .catch((err) => console.warn('Usando estado local de asistencia:', err));
  }, []);

  return (
    <div className="space-y-6 text-left">
      {/* Header con InfoTooltip en lugar de subtítulos excesivos (P3.1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-[#176087] dark:text-[#9ED8ED]" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Asistencia
            </h2>
            <InfoTooltip content="Control diario de asistencia y registro de ausentismo conforme a la normativa MINEDUC y RGLOEI." />
          </div>
        </div>
      </div>

      {/* Paralelos Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paralelos.map((p) => (
          <Card key={p.id} className="p-6 flex flex-col justify-between hover:shadow-xl transition-all space-y-5 border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="primary" className="mb-2">
                    {p.materia} · {p.nivel}
                  </Badge>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {p.nombre}
                  </h3>
                </div>

                {/* Indicador de asistencia tomada hoy */}
                {p.asistenciaHoyRegistrada ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Registrada Hoy
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Pendiente Hoy
                  </span>
                )}
              </div>

              {/* Horario y jornada */}
              <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{p.horario}</span>
                </div>
                <span>·</span>
                <span>Jornada {p.jornada}</span>
              </div>
            </div>

            {/* Estadísticas del mes */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#071727] border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">Estudiantes Activos</span>
                <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-200">
                  {p.totalEstudiantes || 30} alumnos
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Asistencia del Mes</span>
                <span className="text-lg font-bold font-mono text-[#176087] dark:text-[#9ED8ED]">
                  {p.porcentajeAsistenciaMes || 94.5}%
                </span>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400">
                Año Lectivo 2026 - 2027
              </span>
              <Link to={`/asistencia/${p.id}`}>
                <Button variant={p.asistenciaHoyRegistrada ? 'outline' : 'primary'} size="sm">
                  {p.asistenciaHoyRegistrada ? 'Ver / Modificar Asistencia' : 'Tomar Asistencia Ahora'}
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AsistenciaPage;
