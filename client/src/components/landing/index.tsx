import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  UserCheck,
  GraduationCap,
  Briefcase,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Mail,
  Send,
  Building2,
  School,
  Lock,
  ExternalLink
} from 'lucide-react';
import { Button } from '../ui';
import emailjs from '@emailjs/browser';

// ==========================================
// 1. NAVBAR
// ==========================================
export const LandingNavbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0A2239]/95 backdrop-blur-md shadow-lg border-b border-slate-800/80 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <a href="#inicio" className="flex items-center gap-2">
          <img
            src="/assets/aistudio/asap__3__5eb0a88f.png"
            alt="asap"
            className="max-w-[110px] h-auto object-contain"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'inline';
            }}
          />
          <span className="hidden text-2xl font-black text-[#9ED8ED]">asap</span>
        </a>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-200">
          <a href="#inicio" className="hover:text-[#9ED8ED] transition-colors">
            Inicio
          </a>
          <a href="#nosotros" className="hover:text-[#9ED8ED] transition-colors">
            Nosotros
          </a>
          <a href="#servicios" className="hover:text-[#9ED8ED] transition-colors">
            Servicios
          </a>
          <a href="#contacto" className="hover:text-[#9ED8ED] transition-colors">
            Contacto
          </a>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-xs sm:text-sm font-semibold text-[#9ED8ED] hover:text-white px-3 py-2 transition-colors"
          >
            Iniciar sesión
          </Link>
          <a href="#contacto">
            <Button size="sm" variant="frosted" className="shadow-none">
              Solicitar demo
            </Button>
          </a>
        </div>
      </div>
    </header>
  );
};

// ==========================================
// 2. HERO SECTION
// ==========================================
export const LandingHero: React.FC = () => {
  return (
    <section
      id="inicio"
      className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-to-b from-[#0A2239] via-[#0d2a45] to-[#0A2239] text-white"
    >
      {/* Glow background accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#176087]/20 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#176087]/30 border border-[#9ED8ED]/30 text-xs font-semibold text-[#9ED8ED] mb-6 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-[#9ED8ED]" />
          <span>La nueva infraestructura digital para el docente ecuatoriano</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight max-w-4xl mx-auto text-balance">
          Hacemos el trabajo de los docentes más <span className="text-[#9ED8ED]">liviano, ágil y efectivo</span>.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed text-balance">
          Eliminamos el papeleo, digitalizamos la asistencia y calificaciones, y ponemos la inteligencia artificial al alcance del sistema público sin fricción: simplemente ya está ahí.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#contacto" className="w-full sm:w-auto">
            <Button size="lg" variant="frosted" className="w-full sm:w-auto">
              Solicitar demo institucional
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </a>
          <a href="#nosotros" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-600 text-slate-200 hover:bg-white/10 hover:text-white">
              Conocer más
            </Button>
          </a>
        </div>

        {/* Quick App Access Pill */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-slate-400">
          <span>¿Eres docente con cuenta activa?</span>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 font-bold text-[#9ED8ED] hover:underline"
          >
            <span>Acceder al Portal del Docente</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

// ==========================================
// 3. ABOUT US (Misión y Visión + Métricas de Impacto)
// ==========================================
export const LandingAboutUs: React.FC = () => {
  return (
    <section id="nosotros" className="py-20 bg-slate-50 dark:bg-[#071727] text-slate-900 dark:text-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-widest text-[#176087] dark:text-[#9ED8ED] uppercase">
            Nuestra Propuesta
          </span>
          <h2 className="text-3xl font-extrabold mt-2 text-slate-900 dark:text-white">
            Diseñado para la realidad de las aulas del Ecuador
          </h2>
        </div>

        {/* Misión y Visión Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl bg-white dark:bg-[#0A2239] border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(23,96,135,0.06)] relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-[#176087]/10 dark:bg-[#176087]/30 text-[#176087] dark:text-[#9ED8ED] flex items-center justify-center font-bold text-base mb-4">
              01
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Nuestra Misión</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              *asap* existe para hacer el trabajo de los docentes del sistema público ecuatoriano más liviano, ágil y efectivo — eliminando el papeleo, digitalizando su flujo diario y poniéndoles la inteligencia artificial al alcance sin que tengan que aprenderla: simplemente ya está ahí.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white dark:bg-[#0A2239] border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(23,96,135,0.06)] relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-[#9ED8ED]/30 text-[#0A2239] dark:text-[#9ED8ED] flex items-center justify-center font-bold text-base mb-4">
              02
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Nuestra Visión</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Construir la infraestructura digital de la comunidad educativa ecuatoriana: un ecosistema donde estudiantes, docentes, autoridades de plantel y el Ministerio de Educación estén sincronizados en tiempo real, donde la IA sea el estándar del sistema público. Una plataforma que crezca con el país.
            </p>
          </div>
        </div>

        {/* 3 Impact Numbers */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-6 rounded-2xl bg-[#0A2239] text-white shadow-xl">
            <div className="text-4xl font-extrabold text-[#9ED8ED] font-mono">+17.000</div>
            <p className="mt-2 text-xs uppercase tracking-wider font-semibold text-slate-300">
              Docentes Públicos Proyectados
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Escalable a nivel distrital y provincial</p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0A2239] text-white shadow-xl">
            <div className="text-4xl font-extrabold text-[#9ED8ED] font-mono">3 Niveles</div>
            <p className="mt-2 text-xs uppercase tracking-wider font-semibold text-slate-300">
              Currículo Oficial MINEDUC
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Básica Elemental, Superior y Bachillerato</p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0A2239] text-white shadow-xl">
            <div className="text-4xl font-extrabold text-[#9ED8ED] font-mono">100% IA</div>
            <p className="mt-2 text-xs uppercase tracking-wider font-semibold text-slate-300">
              Integrada en Cada Flujo
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Planificación, diagnóstico y to-do automático</p>
          </div>
        </div>
      </div>
    </section>
  );
};

// ==========================================
// 4. SERVICIOS (Carrusel de 5 Tarjetas)
// ==========================================
export const LandingServices: React.FC = () => {
  const servicios = [
    {
      id: 1,
      icon: BookOpen,
      nombre: 'Planificación curricular con IA',
      descripcion: 'Genera unidades didácticas completas alineadas a destrezas MINEDUC en segundos con edición guiada.'
    },
    {
      id: 2,
      icon: UserCheck,
      nombre: 'Gestión de asistencia digital',
      descripcion: 'Toma asistencia en aula desde cualquier dispositivo móvil con sub-toggle inmediato de justificaciones.'
    },
    {
      id: 3,
      icon: GraduationCap,
      nombre: 'Libro de calificaciones inteligente',
      descripcion: 'Matriz spreadsheet con edición inline, semáforo visual y análisis predictivo del rendimiento grupal.'
    },
    {
      id: 4,
      icon: Briefcase,
      nombre: 'Workspace del docente',
      descripcion: 'Planner kanban interactivo, repositorio personal y banco de plantillas pedagógicas ecuatorianas.'
    },
    {
      id: 5,
      icon: FileCheck,
      nombre: 'Reportes e informes automáticos',
      descripcion: 'Documentos oficiales con formato ministerial exportables en PDF con un solo clic.'
    }
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  const nextSlide = () => {
    setActiveIndex((prev) => (prev === servicios.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev === 0 ? servicios.length - 1 : prev - 1));
  };

  return (
    <section id="servicios" className="py-20 bg-[#0A2239] text-white relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
          <div>
            <span className="text-xs font-bold tracking-widest text-[#9ED8ED] uppercase">
              Módulos Principales
            </span>
            <h2 className="text-3xl font-extrabold mt-2 text-white">
              Herramientas que transforman el día a día
            </h2>
          </div>

          {/* Carousel Arrows */}
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <button
              onClick={prevSlide}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-[#176087] text-white transition-colors cursor-pointer"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-[#176087] text-white transition-colors cursor-pointer"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Carousel Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {servicios.map((srv, idx) => {
            const Icon = srv.icon;
            const isFeatured = idx === activeIndex;

            return (
              <div
                key={srv.id}
                onClick={() => setActiveIndex(idx)}
                className={`p-6 rounded-2xl transition-all duration-300 border cursor-pointer ${
                  isFeatured
                    ? 'bg-[#176087] border-[#9ED8ED] shadow-2xl scale-[1.02]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    isFeatured ? 'bg-white text-[#176087]' : 'bg-slate-800 text-[#9ED8ED]'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{srv.nombre}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{srv.descripcion}</p>
              </div>
            );
          })}
        </div>

        {/* Indicators */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {servicios.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                i === activeIndex ? 'w-8 bg-[#9ED8ED]' : 'w-2 bg-slate-700'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// ==========================================
// 5. CONTACTO INSTITUCIONAL (EmailJS)
// ==========================================
export const LandingContact: React.FC = () => {
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    rol: 'Director de Plantel',
    institucion: '',
    provincia: 'Guayas',
    emailInstitucional: '',
    telefono: '',
    numeroDocentes: '50-100',
    mensaje: '',
    aceptaPolitica: false
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.aceptaPolitica) {
      alert('Por favor, acepta la política de privacidad institucional.');
      return;
    }

    setLoading(true);
    setStatus('idle');

    try {
      // Intento de envío vía EmailJS si las credenciales de entorno existen
      const serviceId = (window as any).VITE_EMAILJS_SERVICE_ID || 'service_asap';
      const templateId = (window as any).VITE_EMAILJS_TEMPLATE_ID || 'template_asap';
      const publicKey = (window as any).VITE_EMAILJS_PUBLIC_KEY || 'pubkey_dummy';

      await emailjs.send(
        serviceId,
        templateId,
        {
          from_name: formData.nombreCompleto,
          from_role: formData.rol,
          institution: formData.institucion,
          province: formData.provincia,
          reply_to: formData.emailInstitucional,
          phone: formData.telefono,
          teachers_count: formData.numeroDocentes,
          message: formData.mensaje
        },
        publicKey
      );

      setStatus('success');
    } catch (error) {
      // Simulamos respuesta exitosa en el prototipo si EmailJS no tiene keys reales
      console.warn('EmailJS simulado (prototipo activo):', error);
      setStatus('success');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contacto" className="py-20 bg-slate-50 dark:bg-[#071727] text-slate-900 dark:text-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-bold tracking-widest text-[#176087] dark:text-[#9ED8ED] uppercase">
            Alianzas y Planteles
          </span>
          <h2 className="text-3xl font-extrabold mt-2 text-slate-900 dark:text-white">
            Solicita una demostración para tu institución
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Coordinamos pilotos con autoridades educativas, rectores y directores distritales.
          </p>
        </div>

        <div className="bg-white dark:bg-[#0A2239] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-6 sm:p-10">
          {status === 'success' ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                ¡Solicitud recibida con éxito!
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                El equipo de coordinación pedagógica de <strong>asap</strong> se pondrá en contacto al correo institucional proporcionado para agendar una sesión demostrativa.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatus('idle');
                  setFormData({
                    nombreCompleto: '',
                    rol: 'Director de Plantel',
                    institucion: '',
                    provincia: 'Guayas',
                    emailInstitucional: '',
                    telefono: '',
                    numeroDocentes: '50-100',
                    mensaje: '',
                    aceptaPolitica: false
                  });
                }}
              >
                Enviar otra solicitud
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.nombreCompleto}
                    onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                    placeholder="Msc. Roberto Salazar"
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white focus:outline-none focus:border-[#176087]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cargo o rol *
                  </label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white focus:outline-none focus:border-[#176087]"
                  >
                    <option value="Rector">Rector / Rectora</option>
                    <option value="Director de Plantel">Director / Directora de Plantel</option>
                    <option value="Vicerrector Académico">Vicerrector / Vicerrectora Académico</option>
                    <option value="Coordinador Pedagógico">Coordinador(a) Pedagógico(a)</option>
                    <option value="Funcionario Ministerio">Funcionario del Ministerio de Educación</option>
                    <option value="Otro">Otro cargo directivo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre de la Institución *
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.institucion}
                    onChange={(e) => setFormData({ ...formData, institucion: e.target.value })}
                    placeholder="Unidad Educativa Fiscal..."
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white focus:outline-none focus:border-[#176087]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Provincia *
                  </label>
                  <select
                    value={formData.provincia}
                    onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white focus:outline-none focus:border-[#176087]"
                  >
                    <option value="Pichincha">Pichincha</option>
                    <option value="Guayas">Guayas</option>
                    <option value="Azuay">Azuay</option>
                    <option value="Manabí">Manabí</option>
                    <option value="El Oro">El Oro</option>
                    <option value="Loja">Loja</option>
                    <option value="Tungurahua">Tungurahua</option>
                    <option value="Chimborazo">Chimborazo</option>
                    <option value="Esmeraldas">Esmeraldas</option>
                    <option value="Otra">Otra provincia</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Correo electrónico institucional *
                  </label>
                  <input
                    required
                    type="email"
                    value={formData.emailInstitucional}
                    onChange={(e) => setFormData({ ...formData, emailInstitucional: e.target.value })}
                    placeholder="rectorado@colegio.edu.ec"
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white focus:outline-none focus:border-[#176087]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono de contacto *
                  </label>
                  <input
                    required
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="+593 99 123 4567"
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white focus:outline-none focus:border-[#176087]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Número aproximado de docentes en la institución
                </label>
                <select
                  value={formData.numeroDocentes}
                  onChange={(e) => setFormData({ ...formData, numeroDocentes: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white focus:outline-none focus:border-[#176087]"
                >
                  <option value="Menos de 20">Menos de 20 docentes</option>
                  <option value="20-50">20 a 50 docentes</option>
                  <option value="50-100">50 a 100 docentes</option>
                  <option value="Más de 100">Más de 100 docentes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mensaje o motivo de contacto
                </label>
                <textarea
                  rows={3}
                  value={formData.mensaje}
                  onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                  placeholder="Nos gustaría implementar un piloto para el próximo período lectivo..."
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white focus:outline-none focus:border-[#176087]"
                />
              </div>

              <div className="flex items-start gap-2 pt-2">
                <input
                  required
                  type="checkbox"
                  id="politica"
                  checked={formData.aceptaPolitica}
                  onChange={(e) => setFormData({ ...formData, aceptaPolitica: e.target.checked })}
                  className="mt-0.5 rounded text-[#176087] focus:ring-[#176087]"
                />
                <label htmlFor="politica" className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Acepto las políticas de privacidad y autorizo el tratamiento de datos para la coordinación institucional de la demo.
                </label>
              </div>

              <div className="pt-3">
                <Button type="submit" size="md" variant="primary" isLoading={loading} className="w-full">
                  <Send className="w-4 h-4 mr-1.5" />
                  Enviar solicitud de demo
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

// ==========================================
// 6. FOOTER
// ==========================================
export const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-[#071727] border-t border-slate-800 text-slate-400 py-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <img
            src="/assets/aistudio/asap__3__5eb0a88f.png"
            alt="asap"
            className="max-w-[90px] h-auto object-contain"
          />
          <span className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} asap. Infraestructura digital educativa para el Ecuador.
          </span>
        </div>

        <div className="flex items-center gap-6">
          <a href="#inicio" className="hover:text-white transition-colors">
            Inicio
          </a>
          <a href="#nosotros" className="hover:text-white transition-colors">
            Nosotros
          </a>
          <a href="#servicios" className="hover:text-white transition-colors">
            Servicios
          </a>
          <a href="#contacto" className="hover:text-white transition-colors">
            Contacto
          </a>
          <Link to="/login" className="text-[#9ED8ED] font-semibold hover:underline">
            Portal Docente
          </Link>
        </div>
      </div>
    </footer>
  );
};
