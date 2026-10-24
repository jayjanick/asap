# asap — Plataforma Educativa y Flujo Docente Inteligente

Prototipo integral y funcional de **asap** (*as soon as possible*), una plataforma web diseñada para el sistema público ecuatoriano que alivia la carga administrativa de los docentes mediante toma de asistencia ágil, libro de calificaciones inteligente, generador de planificaciones curriculares con IA (Gemini), workspace docente y una landing page institucional para directivos y autoridades.

### User Review & Critical Decisions

> [!IMPORTANT]
> **Decisiones confirmadas por el usuario:**
> - **Sistema de Diseño:** Adopción de **shadcn/ui** con paleta oficial: Baltic Blue (`#176087` primario y CTAs), Prussian Blue (`#0A2239` fondos oscuros, sidebar y dark mode), Frosted Blue (`#9ED8ED` acentos, badges y hover). Radio de bordes global a 12px (`--radius: 0.75rem`).
> - **Arquitectura Separada (No Next.js):** El proyecto se organiza con una arquitectura explícitamente desacoplada: Frontend SPA en **React (Vite) + Tailwind CSS + Framer Motion**, y Backend en **Node.js + Express** con integración a MongoDB/Mongoose y Google Gemini API en el servidor.
> - **Doble Despliegue Preparado:** El cliente cuenta con scripts listos para compilar estáticamente (`dist/`) y desplegar en GitHub Pages (`gh-pages`), mientras que el backend Express está preparado con endpoints REST y middlewares para alojamiento independiente (Render/Railway/Cloud Run). En el entorno interactivo de AI Studio, un servidor Express orquesta la API en `/api/*` y sirve el frontend reactivo en el puerto 3000 con soporte continuo.
> - **Landing Page Integrada:** Se implementa la landing page corporativa (`#inicio`, `#nosotros`, `#servicios` con carrusel, `#contacto` con EmailJS) como ruta pública de entrada institucional, con acceso directo al portal docente (`/login` y `/dashboard`).

---

### 1. Overview & Core Concept

- **Propósito:** Eliminar el exceso de papeleo y la fragmentación en la gestión educativa pública en Ecuador. Digitalizar el flujo diario del docente desde un único lugar con asistencia inmediata, notas interactivas y generación automatizada de planificaciones alineadas al currículo del Ministerio de Educación (MINEDUC).
- **Público Objetivo:** Docentes del sistema de educación pública ecuatoriana (Educación Básica, Básica Superior, Bachillerato General Unificado y Bachillerato Técnico), además de directores de plantel y coordinadores pedagógicos.
- **Valor Principal:** La inteligencia artificial no es un chatbot periférico; es un motor invisible embebido en los flujos diarios (sugerencias curriculares de destrezas, alertas predictivas de rendimiento académico, diagnóstico pedagógico y estructuración de informes oficiales).

---

### 2. User Experience & Visual Design

#### Flujos de Usuario Principales

1. **Landing Page Institucional (`/`):**
   - **Hero:** Wordmark oficial `asap`, propuesta de valor con tipografía DM Sans/Plus Jakarta Sans, métricas de impacto animadas (+17.000 docentes proyectados, 3 niveles educativos, IA nativa), CTAs hacia "Solicitar demo" y "Acceso a la plataforma".
   - **Nosotros:** Misión y visión en tarjetas con contraste Prussian Blue / Frosted Blue.
   - **Carrusel de Servicios:** 5 tarjetas interactivas (Planificación con IA, Asistencia digital, Libro de notas inteligente, Workspace docente, Informes automáticos) con controles touch-swipe y flechas.
   - **Contacto Institucional:** Formulario para directores/rectores con validación completa y envío EmailJS listo para credenciales de cliente.

2. **Autenticación y Onboarding:**
   - **Login (`/login`):** Pantalla limpia con logo `asap_0e7fa1e8.png`, login rápido de demostración con 1 clic ("Ingresar como Andrés Morales"), campos de correo/contraseña y botón Google OAuth.
   - **Registro en 4 pasos (`/register`):**
     1. *Datos personales:* Nombre, email, edad, rol Docente activo.
     2. *Institución:* Nombre del plantel, provincia, cantón y niveles impartidos.
     3. *Cursos y paralelos:* Formulario dinámico con materias, grados y paralelos (mínimo 1).
     4. *Importación de estudiantes:* Subida de archivos (CSV/XLSX/PDF) con vista previa de datos tabulares detectados o botón "Omitir por ahora".

3. **Panel Diario (`/dashboard`):**
   - Tarjeta "Hoy" con jornada matutina/vespertina, hora y fecha ecuatoriana en tiempo real, clase en curso destacada y horario del día.
   - 5 métricas rápidas: Total estudiantes (60 activos), Tareas por calificar (5), Clases planificadas esta semana (12), % Asistencia mensual (94.2%), Informes generados (3).
   - "Por hacer" inteligente con priorización automática generada por Gemini y opción de añadir tareas manuales.
   - Accesos rápidos: Tomar asistencia ahora, Nueva actividad, Planificar con IA, Calificaciones.

4. **Módulo de Asistencia (`/asistencia` y `/asistencia/:cursoId`):**
   - Lista de paralelos (8vo A y 9no B de Lengua y Literatura) con estado de hoy e indicador porcentual del mes.
   - Toma interactiva: tabla con lista de 30 alumnos, botones toggle `Presente (P)` / `Atraso (A)` / `Falta (F)`.
   - Al marcar `F`, despliegue instantáneo de sub-toggle `¿Justificada?` (Sí / No) y campo de motivo. Botón rápido "Marcar todos como presentes" y botón para guardar.
   - Pestaña de historial mensual con matriz de colores (verde, amarillo, rojo, gris claro) y estadísticas individuales.

5. **Módulo de Planificación Curricular (`/planificacion` y `/planificacion/calendario`):**
   - Vista general de bloques curriculares con anillos de progreso (En curso, Completado, Por iniciar).
   - **Drawer de IA:** Selector de materia, grado, bloque MINEDUC 2023, destreza y número de semanas. Consulta al backend Gemini y genera objetivos, secuencia semanal, actividades y recursos en formato editable.
   - Vista de calendario interactivo mensual/semanal con chips por materia y modal de detalle por clase.

6. **Libro de Calificaciones (`/calificaciones` y `/calificaciones/:cursoId`):**
   - Tabla spreadsheet: filas con estudiantes, columnas con tareas/evaluaciones y ponderaciones.
   - Edición inline celda a celda con guardado y cálculo automático de promedio ponderado. Código cromático: Verde (≥7.0), Amarillo (5.0–6.9), Rojo (<5.0).
   - Panel de diagnóstico pedagógico con IA: análisis de rendimiento grupal e identificación de estudiantes que requieren refuerzo.
   - Exportación de libreta de calificaciones a PDF (`jsPDF` + `jspdf-autotable`) y CSV.

7. **Workspace Docente (`/workspace`):**
   - Planner Kanban (Por hacer, En progreso, Completado) con drag & drop y filtros.
   - Gestión de entregas de actividades y generador de tareas con IA según destreza.
   - Banco de plantillas oficiales MINEDUC (Planificación de unidad didáctica, acta de padres, plan de refuerzo académico) con vista previa y botón "Usar plantilla".
   - Repositorio "Mis Documentos" con categorización y subida de archivos.

8. **Configuración e Integraciones (`/perfil`):**
   - Conexiones simuladas y listas para API: Google Calendar, Gmail, Google Classroom, Zoom y Microsoft Teams.
   - Selector de Modo Oscuro (Prussian Blue) / Modo Claro (Frosted & White).

#### Identidad Visual y Sistema de Tokens

| Token Semántico | Valor Hex / Tailwind | Aplicación |
| :--- | :--- | :--- |
| **Primary / Accent** | `#176087` (Baltic Blue) | Botones CTA, enlaces activos, bordes de foco, highlights |
| **Background Dark / Sidebar** | `#0A2239` (Prussian Blue) | Sidebar lateral, fondo oscuro en modales y dark mode |
| **Muted / Card Accent** | `#9ED8ED` (Frosted Blue) | Hover en tarjetas, badges suaves, fondos de cabecera |
| **Border Radius** | `12px` (`0.75rem`) | Tarjetas, modales, drawers, contenedores |
| **Typography** | `Plus Jakarta Sans` / `DM Sans` | Display y texto de interfaz legible y moderno |
| **Monospace / Tabular** | `JetBrains Mono` / `tabular-nums`| Celdas de notas, porcentajes y horas de clase |

---

### 3. Key Product Decisions & Trade-Offs

- **Decisión 1: Arquitectura Desacoplada (Client Vite + Server Express)**
  - *Enfoque Elegido:* Se estructura el repositorio con una clara separación `client/` y `server/`. El frontend se ejecuta como SPA en React con React Router y Tailwind CSS, y el backend Express provee la API RESTful bajo `/api`.
  - *Por qué:* Cumple con la directiva estricta del usuario ("Keep the separate Express server as originally specified... The React frontend will be built with Vite and deployed to GitHub Pages... Do not use Next.js").
  - *Compatibilidad con el entorno AI Studio:* Para garantizar que el visor interactivo de AI Studio funcione en vivo en el puerto 3000, el backend de Express sirve tanto las rutas de API como la aplicación React mediante el middleware de Vite o compilación estática directa en un único comando dev, permitiendo probar la app en vivo y al mismo tiempo exportar el cliente para GitHub Pages y el servidor para Render.

- **Decisión 2: Modelos Mongoose Fieles al ERD y Fallback de Persistencia**
  - *Enfoque Elegido:* Se implementan los 10 esquemas Mongoose en `server/models/` reflejando fielmente el archivo ERD (`Usuario`, `Paralelo`, `Alumno`, `Asistencia` con subdocumentos `registros[]`, `Planificacion`, `Clase`, `Actividad`, `Entrega`, `Calificacion`, `InformeGenerado`).
  - *Por qué:* El backend conecta a MongoDB Atlas si `MONGODB_URI` está provisto, y cuenta con un mock store transparente en memoria con los datos del docente Andrés Morales para garantizar que el prototipo sea 100% interactivo de inmediato sin requerir conexión remota obligatoria.

- **Decisión 3: Integración de Google Gemini en el Servidor (`server/services/gemini.js`)**
  - *Enfoque Elegido:* Uso del SDK `@google/genai` exclusivamente en el backend Node.js (`gemini-3.8-flash` para tareas rápidas y `gemini-3.1-flash-lite` o `gemini-4-argon` para análisis profundo), consumiendo `process.env.GEMINI_API_KEY`.
  - *Por qué:* Respeto absoluto a la seguridad: la clave nunca se expone en el navegador. Las respuestas se estructuran con esquemas JSON controlados y cuentan con resiliencia y datos pedagógicos de respaldo si la API no está configurada o se encuentra offline.

- **Decisión 4: Placeholder de WhatsApp Business API**
  - *Enfoque Elegido:* Se crea el archivo `server/services/whatsapp.js` comentado detalladamente con la arquitectura de la API de WhatsApp Business Cloud (Meta) para envíos a representantes, marcado como fase futura sin romper el MVP.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ASAP ECOSYSTEM ARCHITECTURE                     │
├───────────────────────────────────┬────────────────────────────────────┤
│         CLIENT (React + Vite)     │       SERVER (Node.js + Express)   │
│                                   │                                    │
│  ┌─────────────────────────────┐  │  ┌──────────────────────────────┐  │
│  │   Public Corporate Landing  │  │  │  Express REST API Gateway    │  │
│  │   /#inicio, #nosotros,      │  │  │  /api/auth (JWT + bcrypt)    │  │
│  │   #servicios, #contacto     │  │  │  /api/dashboard              │  │
│  └──────────────┬──────────────┘  │  │  /api/asistencia             │  │
│                 │                 │  │  /api/planificacion          │  │
│  ┌──────────────▼──────────────┐  │  │  /api/calificaciones         │  │
│  │   Docente Application       │  │  │  /api/workspace              │  │
│  │   ├── /login & /register    │──┼─►│  /api/ai (Gemini Service)    │  │
│  │   ├── /dashboard            │  │  └──────────────┬───────────────┘  │
│  │   ├── /asistencia           │  │                 │                  │
│  │   ├── /planificacion        │  │  ┌──────────────▼───────────────┐  │
│  │   ├── /calificaciones       │  │  │  Gemini AI Engine            │  │
│  │   ├── /workspace            │  │  │  - Planificaciones MINEDUC   │  │
│  │   └── /perfil               │  │  │  - Análisis de rendimiento   │  │
│  └──────────────┬──────────────┘  │  │  - Actividades & Diagnósticos│  │
│                 │                 │  └──────────────┬───────────────┘  │
│  ┌──────────────▼──────────────┐  │                 │                  │
│  │   shadcn/ui + Tailwind CSS  │  │  ┌──────────────▼───────────────┐  │
│  │   Framer Motion Transitions │  │  │  Mongoose Schemas (ERD)      │  │
│  │   Recharts Visualizations   │  │  │  Usuario, Paralelo, Alumno,  │  │
│  │   jsPDF Client Exporter     │  │  │  Asistencia, Calificación... │  │
│  └─────────────────────────────┘  │  └──────────────────────────────┘  │
└───────────────────────────────────┴────────────────────────────────────┘
```

#### Mapeo de Entidades y Modelos

1. **Usuario:** `_id`, `nombre`, `email`, `password` (hasheado), `rol` ('Docente'), `materias` (['Lengua y Literatura']), `institucion` ('Colegio Fiscal Vicente Rocafuerte').
2. **Paralelo:** `_id`, `nombre` ('8vo EGB A', '9no EGB B'), `grado` (8, 9), `jornada` ('Matutina'), `docenteId`, `materias`.
3. **Alumno:** `_id`, `nombre`, `cedula`, `paraleloId`, `activo` (true).
4. **Asistencia:** `_id`, `paraleloId`, `fecha`, `materia`, `registros`: `[{ alumnoId, estado: 'P'|'A'|'F', justificada: Boolean, motivo: String }]`.
5. **Planificacion:** `_id`, `docenteId`, `materia`, `bloque`, `destreza`, `objetivos` (Array), `generadaIA` (Boolean).
6. **Clase:** `_id`, `planificacionId`, `fecha`, `tema`, `contenido`.
7. **Actividad:** `_id`, `paraleloId`, `claseId`, `titulo`, `tipo` ('Individual'|'Grupal'), `fechaEntrega`, `ponderacion` (10 pts).
8. **Entrega:** `_id`, `actividadId`, `alumnoId`, `fechaEntrega`, `contenido`, `estado` ('Entregado'|'Pendiente'|'Tarde').
9. **Calificacion:** `_id`, `entregaId`, `alumnoId`, `paraleloId`, `nota` (0–10), `tipo`, `periodo` ('1er Quimestre / Parcial 1').
10. **InformeGenerado:** `_id`, `docenteId`, `tipo`, `contenido`, `fechaGenerado`.

#### Mapeo de Estados y Manejadores Interactivos

- **Toma de Asistencia:** Cada clic en `P`, `A` o `F` actualiza el estado local en tiempo real con recálculo de métricas de presentismo. La selección de `F` conmuta la bandera `justificada` e inserta la justificación.
- **Libro de Calificaciones:** Celdas editables con validación de rango numérico (0.00 a 10.00). Al presionar `Enter` o perder el foco, se guarda y se actualiza instantáneamente el promedio del estudiante y el panel de análisis pedagógico asistido por Gemini.
- **Drawer de Planificación con IA:** Envío reactivo con indicador de carga pulido, parseo de respuesta estructurada y opción para que el docente edite los objetivos y secuencia de clases antes de agregarlos al calendario.
- **Generación de Reportes PDF:** Procesamiento en el cliente con `jsPDF` y `jspdf-autotable`, produciendo documentos membretados con formato oficial ecuatoriano listos para impresión o descarga.
- **Landing Page con EmailJS:** Validación de correo institucional, teléfono ecuatoriano y recuento de docentes con feedback visual de envío exitoso y fallback sin errores.
