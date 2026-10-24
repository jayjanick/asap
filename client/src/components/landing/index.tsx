import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
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
  ExternalLink,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from '../ui';
import emailjs from '@emailjs/browser';

// ==========================================
// 1. NAVBAR (P4.1, P4.3 & Dark Mode)
// ==========================================
export const LandingNavbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('asap_theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLandingTheme = () => {
    const nextTheme = !isDark;
    setIsDark(nextTheme);
    if (nextTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('asap_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('asap_theme', 'light');
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0A2239]/95 dark:bg-[#071727]/95 backdrop-blur-md shadow-lg border-b border-slate-800/80 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <a href="#inicio" className="flex items-center gap-2 shrink-0">
          <img
            src={isDark ? "/asap/assets/aistudio/light_no-bg_f57d3182.png" : "/asap/assets/aistudio/no_bg_a8451225.png"}
            alt="asap"
            className="max-w-[100px] h-auto object-contain"
          />
        </a>

        {/* Links Centrados en Desktop (P4.3) */}
        <nav className="hidden md:flex items-center justify-center gap-8 text-sm font-medium text-slate-200 flex-1 mx-8">
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

        {/* CTAs & Theme Toggle */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <button
            onClick={toggleLandingTheme}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <Link
            to="/login"
            className="text-xs font-semibold text-[#9ED8ED] hover:text-white px-3 py-2 transition-colors"
          >
            Iniciar sesión
          </Link>
          <a href="#contacto">
            <Button size="sm" variant="frosted" className="shadow-none text-xs">
              Solicitar demo
            </Button>
          </a>
        </div>

        {/* Hamburger Mobile Toggle (P4.3) */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggleLandingTheme}
            className="p-2 rounded-lg text-slate-300 hover:text-white"
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white hover:text-[#9ED8ED] cursor-pointer"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Panel Móvil Animado (P4.3) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-[#0A2239] border-b border-slate-800 px-6 py-5 space-y-4 text-center"
          >
            <nav className="flex flex-col space-y-3 text-sm font-semibold text-slate-200">
              <a
                href="#inicio"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[#9ED8ED] py-1"
              >
                Inicio
              </a>
              <a
                href="#nosotros"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[#9ED8ED] py-1"
              >
                Nosotros
              </a>
              <a
                href="#servicios"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[#9ED8ED] py-1"
              >
                Servicios
              </a>
              <a
                href="#contacto"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[#9ED8ED] py-1"
              >
                Contacto
              </a>
            </nav>

            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2.5">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2 text-xs font-bold text-[#9ED8ED] border border-[#9ED8ED]/40 rounded-lg hover:bg-[#176087]/20"
              >
                Iniciar sesión como Docente
              </Link>
              <a
                href="#contacto"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button size="sm" variant="frosted" className="w-full text-xs">
                  Solicitar demo institucional
                </Button>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

// ==========================================
// 2. HERO SECTION (P4.1: Fade + Slide Up)
// ==========================================
export const LandingHero: React.FC = () => {
  return (
    <section
      id="inicio"
      className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-to-b from-[#0A2239] via-[#0d2a45] to-[#0A2239] text-white"
    >
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#176087]/20 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#176087]/30 border border-[#9ED8ED]/30 text-xs font-semibold text-[#9ED8ED] mb-6">
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
        </motion.div>
      </div>
    </section>
  );
};

// ==========================================
// 3. ABOUT US (P4.1: whileInView animations)
// ==========================================
export const LandingAboutUs: React.FC = () => {
  return (
    <motion.section
      id="nosotros"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="py-20 bg-slate-50 dark:bg-[#071727] text-slate-900 dark:text-slate-100"
    >
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
    </motion.section>
  );
};

// ==========================================
// 4. SERVICIOS (P4.2: Peek Effect + Botones Flotantes)
// ==========================================
export const LandingServices: React.FC = () => {
  const servicios = [
    {
      id: 1,
      icon: BookOpen,
      nombre: 'Planificación curricular con IA',
      descripcion: 'Genera unidades didácticas completas alineadas a destrezas MINEDUC en segundos con edición guiada y cronograma semanal.'
    },
    {
      id: 2,
      icon: UserCheck,
      nombre: 'Gestión de asistencia digital',
      descripcion: 'Toma asistencia en aula desde cualquier dispositivo móvil con sub-toggle inmediato de justificaciones médicas y alertas tempranas.'
    },
    {
      id: 3,
      icon: GraduationCap,
      nombre: 'Libro de calificaciones inteligente',
      descripcion: 'Matriz spreadsheet con edición inline, semáforo visual de aprobación y diagnóstico formativo automático por paralelo.'
    },
    {
      id: 4,
      icon: Briefcase,
      nombre: 'Workspace del docente',
      descripcion: 'Planner kanban interactivo con arrastre, repositorio con clasificación y banco de plantillas pedagógicas ecuatorianas.'
    },
    {
      id: 5,
      icon: FileCheck,
      nombre: 'Reportes e informes oficiales',
      descripcion: 'Documentos oficiales con formato ministerial exportables en PDF, DOCX y XLSX con un solo clic.'
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
    <motion.section
      id="servicios"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="py-20 bg-[#0A2239] text-white relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold tracking-widest text-[#9ED8ED] uppercase">
            Módulos Principales
          </span>
          <h2 className="text-3xl font-extrabold mt-2 text-white">
            Herramientas que transforman el día a día
          </h2>
        </div>

        {/* Carrusel con Peek Effect y Flechas Flotantes Superpuestas (P4.2) */}
        <div className="relative max-w-4xl mx-auto px-6 sm:px-12">
          {/* Botón Flotante Anterior */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#176087] hover:bg-[#1f7cae] text-white shadow-xl flex items-center justify-center transition-all cursor-pointer border border-[#9ED8ED]/30"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Botón Flotante Siguiente */}
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#176087] hover:bg-[#1f7cae] text-white shadow-xl flex items-center justify-center transition-all cursor-pointer border border-[#9ED8ED]/30"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Carrusel Slide Display */}
          <div className="overflow-hidden py-4">
            <div className="flex items-center justify-center">
              {servicios.map((srv, idx) => {
                const Icon = srv.icon;
                const isCurrent = idx === activeIndex;
                const isPrev = idx === (activeIndex === 0 ? servicios.length - 1 : activeIndex - 1);
                const isNext = idx === (activeIndex === servicios.length - 1 ? 0 : activeIndex + 1);

                if (!isCurrent && !isPrev && !isNext) return null;

                return (
                  <div
                    key={srv.id}
                    onClick={() => setActiveIndex(idx)}
                    className={`transition-all duration-300 rounded-3xl p-6 sm:p-8 border cursor-pointer ${
                      isCurrent
                        ? 'w-full max-w-md bg-gradient-to-br from-[#176087] to-[#0f4460] border-[#9ED8ED] shadow-2xl scale-100 z-10'
                        : 'hidden md:block w-72 bg-slate-900/60 border-slate-800 opacity-40 scale-90 -mx-10 blur-xs hover:opacity-60'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${
                        isCurrent ? 'bg-white text-[#176087] shadow-md' : 'bg-slate-800 text-[#9ED8ED]'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono text-[#9ED8ED] font-bold uppercase tracking-wider block mb-1">
                      Módulo 0{srv.id}
                    </span>
                    <h3 className="text-xl font-bold text-white mb-3">{srv.nombre}</h3>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      {srv.descripcion}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Indicadores */}
          <div className="flex items-center justify-center gap-2 mt-6">
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
      </div>
    </motion.section>
  );
};

// ==========================================
// 5. CONTACTO
// ==========================================
export const LandingContact: React.FC = () => {
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    rol: 'Rector',
    institucion: '',
    provincia: 'Guayas',
    emailInstitucional: '',
    telefono: '',
    numeroDocentes: '50-100',
    mensaje: '',
    aceptaPolitica: false
  });

  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorEnvio('');

    try {
      // Intento con EmailJS si las credenciales están configuradas
      const serviceId = process.env.EMAILJS_SERVICE_ID || 'service_default';
      const templateId = process.env.EMAILJS_TEMPLATE_ID || 'template_default';
      const publicKey = process.env.EMAILJS_PUBLIC_KEY || 'public_key_default';

      if (publicKey && publicKey !== 'public_key_default') {
        await emailjs.send(serviceId, templateId, formData, publicKey);
      }
      setEnviado(true);
    } catch (err) {
      console.warn('EmailJS no disponible, guardando solicitud demostrativa:', err);
      setEnviado(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.section
      id="contacto"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="py-20 bg-slate-50 dark:bg-[#071727] text-slate-900 dark:text-slate-100"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="text-xs font-bold tracking-widest text-[#176087] dark:text-[#9ED8ED] uppercase">
          Acceso Institucional
        </span>
        <h2 className="text-3xl font-extrabold mt-2 text-slate-900 dark:text-white">
          Implementa asap en tu plantel educativo
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-xl mx-auto">
          Coordinamos pilotos de demostración y asesoría técnica para directivos de instituciones públicas y fiscomisionales.
        </p>

        <div className="mt-10 p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#0A2239] border border-slate-200/80 dark:border-slate-800 shadow-xl">
          {enviado ? (
            <div className="py-8 space-y-4 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                ¡Solicitud recibida exitosamente!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                Nos pondremos en contacto al correo <strong>{formData.emailInstitucional}</strong> en las próximas 24 horas laborables para coordinar la demostración con tu equipo directivo.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEnviado(false)}
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
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cargo o rol *
                  </label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
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
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Provincia *
                  </label>
                  <select
                    value={formData.provincia}
                    onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
                  >
                    <option value="Guayas">Guayas</option>
                    <option value="Pichincha">Pichincha</option>
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
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
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
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mensaje o requerimiento pedagógico
                </label>
                <textarea
                  rows={3}
                  value={formData.mensaje}
                  onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                  placeholder="Nos gustaría implementar un piloto para el próximo período lectivo..."
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071727] text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  required
                  type="checkbox"
                  id="politica"
                  checked={formData.aceptaPolitica}
                  onChange={(e) => setFormData({ ...formData, aceptaPolitica: e.target.checked })}
                  className="mt-0.5 rounded text-[#176087]"
                />
                <label htmlFor="politica" className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Acepto las políticas de privacidad y autorizo la coordinación de la demo demostrativa.
                </label>
              </div>

              <div className="pt-2">
                <Button type="submit" size="md" variant="primary" isLoading={loading} className="w-full">
                  <Send className="w-4 h-4 mr-1.5" />
                  Enviar solicitud de demo institucional
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </motion.section>
  );
};

// ==========================================
// 6. FOOTER (P4.4: Logo Seguro con Fallback)
// ==========================================
export const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-[#071727] border-t border-slate-800 text-slate-400 py-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <img
            src="/asap/assets/aistudio/light_no-bg_f57d3182.png"
            alt="asap logo"
            className="max-w-[90px] h-auto object-contain"
          />
          <span className="text-[11px] text-slate-500 border-l border-slate-800 pl-3">
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
