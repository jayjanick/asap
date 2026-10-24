# asap — Plan de Correcciones y Mejoras v1.1

Plan arquitectónico y de implementación para consolidar **asap** (*as soon as possible*) como la plataforma web educativa de referencia para docentes del sistema público ecuatoriano, implementando persistencia robusta, resolución de enrutamiento en hosting estático, flujos de autenticación e IA integrada, y pulido exhaustivo de interfaz bajo la identidad visual oficial.

---

## Decisiones Críticas y Preferencias del Usuario

> [!IMPORTANT]
> - **Persistencia**: Se conectará Mongoose a `process.env.MONGODB_URI` con inicialización de datos de prueba (`server/seed.ts`). Si la URI no está presente en el entorno, el servidor activará automáticamente un fallback reactivo en memoria que preservará intactas las credenciales y registros del docente Andrés Morales sin interrumpir la operación.
> - **Servicios Externos (Google OAuth, EmailJS, Google Calendar)**: Se construirá la arquitectura, dependencias e interfaces visuales completas con simulación interactiva de alta fidelidad, listas para operar inmediatamente una vez que el usuario agregue las credenciales reales en producción.
> - **Entorno y Framework**: Se eliminarán los restos de configuración de Next.js (`next.config.ts`, `/app`, dependencia `next`) para mantener exclusivamente el stack solicitado: **React (Vite) + Express + Tailwind CSS v4**.

---

## 1. Resumen y Arquitectura del Sistema

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Cliente React (Vite)                            │
│  Base: /asap/  ·  Tailwind CSS v4  ·  Motion  ·  shadcn/ui aesthetic    │
├───────────────────────┬───────────────────────┬────────────────────────┤
│     Landing Page      │   Autenticación       │    Espacio Docente     │
│ · Hero con animación  │ · Login demo / Google │ · Dashboard & Horario  │
│ · Carrusel con Peek   │ · Registro 4 pasos    │ · Asistencia & Historial│
│ · Formulario EmailJS  │ · JWT en localStorage │ · Calificaciones & XLSX│
│ · Dark mode global    │ · Revalidación /me    │ · Kanban DND & Editor  │
└───────────────────────┴───────────────────────┴────────────────────────┘
                                    │
                       Llamadas API (/api/*)
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Servidor Node.js + Express                      │
│     API RESTful  ·  Controladores  ·  Integración @google/genai        │
├────────────────────────────────────────────────────────────────────────┤
│  /api/auth       → Login demo, Google OAuth token verify, /me          │
│  /api/asistencia → Registro diario, historial y cálculo de faltas      │
│  /api/calificaciones → Matriz de notas, exportación, análisis IA      │
│  /api/workspace  → Tareas Kanban, documentos en base64, plantillas     │
│  /api/ai         → Análisis de grupo y generación de informes oficiales│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Capa de Persistencia                            │
│           Mongoose / MongoDB Atlas  (con Fallback en Memoria)          │
│  · Colecciones: Usuario, Paralelo, Alumno, Asistencia, Calificacion,  │
│    Actividad, Planificacion, InformeGenerado, Documento                │
│  · Seed automático: Andrés Morales (8vo A y 9no B, 30 alumnos c/u)     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Plan Detallado por Prioridades

### Prioridad 0 — Infraestructura y Persistencia

1. **P0.1: Conexión Mongoose y Persistencia Dual**:
   - Configurar conexión en `server/db.ts` utilizando `process.env.MONGODB_URI`.
   - Implementar un adaptador que ejecute queries sobre MongoDB si hay conexión activa, o sobre un almacén de memoria tipado que implementa la misma interfaz si `MONGODB_URI` no está definida.
   - Crear script `server/seed.ts` que inserte al docente Andrés Morales, paralelos 8vo A y 9no B, y sus 60 estudiantes si la colección está vacía.
   - Declarar `MONGODB_URI` en `.env.example`.
2. **P0.2: Enrutamiento y 404 en GitHub Pages**:
   - Actualizar `public/404.html` para capturar la URL requerida, almacenarla en `sessionStorage` preservando el segmento `/asap/`, y redirigir al punto de entrada.
   - Asegurar que `.nojekyll` esté presente en `public/` para que Vite lo copie directamente al directorio `dist/`.
3. **P0.3: Estabilización del Workspace**:
   - Refactorizar las pestañas internas de `/workspace` (Tareas Kanban, Mis Documentos, Plantillas MINEDUC, Horario) a estado de componente (`useState`) evitando alteraciones en el `pathname` que provoquen 404 en hosting estático.
4. **Limpieza de Next.js**:
   - Remover `next.config.ts`, el directorio `app/` no utilizado, y desinstalar la dependencia `next` de `package.json`.

---

### Prioridad 1 — Autenticación y Sesión

1. **P1.1: Google OAuth Funcional**:
   - Integrar `@react-oauth/google` con botón accesible "Continuar con Google".
   - Si `GOOGLE_CLIENT_ID` está presente, inicializar el proveedor; si no, ejecutar simulación interactiva con un modal que autentica al usuario de prueba con credenciales de Google simuladas.
2. **P1.2: Persistencia de Sesión y Revalidación**:
   - Guardar token JWT y datos de perfil en `localStorage`.
   - Endpoint `GET /api/auth/me` con middleware de verificación Bearer token.
   - Al cargar la aplicación, revalidar el token antes de decidir redirecciones.
3. **P1.3: Logout Completo**:
   - Botón de cierre de sesión en sidebar y menú desplegable del docente que limpia `localStorage`, reinicia el estado de autenticación y navega a `/login`.

---

### Prioridad 2 — Corrección de Bugs Funcionales

1. **P2.1: Persistencia de Asistencia**:
   - Conectar `TomarAsistenciaPage` para enviar `POST /api/asistencia` con la fecha y estado individual (`P`, `A`, `F`, `justificada`).
   - `AsistenciaPage` consumirá `GET /api/asistencia` para mostrar el porcentaje de asistencia real y el estado actualizado de la jornada.
2. **P2.2: Exportación de Calificaciones y Reportes**:
   - Generación de CSV con delimitación correcta, campos escapados entre comillas y `charset=utf-8` con BOM para correcta apertura en Excel.
   - Integración de exportación nativa a **XLSX** mediante la librería `xlsx`.
   - Modal de "Generar informe" conectado al servicio de Gemini (`gemini-3.8-flash`), renderizando vista previa y descarga directa en **PDF** con `jspdf` y `jspdf-autotable`.
3. **P2.3: Editor y Descarga de Plantillas**:
   - Modal con editor de texto enriquecido pre-cargado con las plantillas MINEDUC (Plan de Refuerzo Académico, Citación a Representante, Acta de Calificaciones).
   - Opciones: "Guardar en Mis Documentos", "Descargar PDF" y "Descargar DOCX" (mediante `docx`).
4. **P2.4: Gestión y Descarga de "Mis Documentos"**:
   - Carga de archivos con lectura a Base64 y guardado de metadatos en backend.
   - Botón de descarga funcional que recrea el Blob a partir de los datos almacenados.
5. **P2.5: Notificaciones con Navegación Real**:
   - Asignar rutas reales (`/asistencia`, `/calificaciones`, `/workspace`) a cada notificación y ejecutar `useNavigate()` al hacer clic.
6. **P2.6: Modo Oscuro Integral**:
   - Configuración explícita de `darkMode: 'class'` y sincronización bidireccional entre la landing, el panel de control y `localStorage`.

---

### Prioridad 3 — Experiencia de Usuario y Diseño Visual

1. **P3.1: Eliminación de Subtítulos Largos**:
   - Reemplazar descripciones redundantes por un ícono interactivo `<Info size={14} className="text-slate-400 hover:text-slate-600 cursor-pointer" />` con tooltip flotante.
2. **P3.2: Métricas Reales en Dashboard**:
   - Cálculo dinámico de "En curso ahora" comparando la hora del sistema con el horario docente.
   - Reemplazar tarjetas por "Clases esta semana" y "Actividades por calificar".
   - Lista "Por hacer" con selector de urgencia (Alta / Media / Baja), fecha límite y campo de observaciones.
3. **P3.3: Rediseño de Toma de Asistencia**:
   - Encabezado simplificado con `<h1>Asistencia</h1>` y bloque de detalles (Materia destacada, Curso/Paralelo, Estudiantes, Jornada).
   - Resumen con términos completos: "Presentes", "Atrasos", "Faltas".
   - Columna adicional en el historial con el `% de ausentismo` individual.
4. **P3.4: Estilo de Tablas de Calificaciones**:
   - Cabecera con fondo Baltic Blue (`#176087`) y texto blanco contrastante.
   - Nuevas columnas inicializadas con placeholder `"-"`.
   - Contenedor con barra de desplazamiento oculta (`scrollbar-none`).
5. **P3.5: Sección de Análisis del Grupo Integrada**:
   - Reemplazar el botón manual por un panel siempre visible que se alimenta automáticamente de `/api/ai/analisis-rendimiento`, mostrando skeleton mientras procesa.
6. **P3.6: Menú Desplegable de Perfil en Header**:
   - Dropdown interactivo en el avatar: "Editar perfil", "Soporte / Ayuda", "Modo Oscuro / Claro" y "Cerrar sesión".
7. **P3.7: Refinamiento del Sidebar**:
   - Ancho colapsado simétrico y ajustado al ícono; logo en versión isotipo al colapsar; acceso a "Soporte" e ícono de cierre (X) en vista móvil.
8. **P3.8: Selector Multi-Institución**:
   - Selector en la barra superior para alternar entre "U.E. Fisco-Misional Democracia" y colegios adicionales, filtrando paralelos activos.
9. **P3.9: Kanban con Drag & Drop Moderno**:
   - Implementación con `@dnd-kit/core` y `@dnd-kit/sortable`.
   - Panel lateral desplegable al hacer clic en tarjetas para editar urgencia, fecha límite, notas y adjuntos.
10. **P3.10: Clasificación de Documentos**:
    - Modal de subida con selector de categorías: Personal, Planificación, Estudiante, Plantilla, Institucional.

---

### Prioridad 4 — Landing Page y Animaciones

1. **P4.1: Animaciones Fluidas con Motion**:
   - Animación de entrada en Hero (`opacity` y `translateY`).
   - Revelación gradual de secciones mediante `whileInView`.
   - Transición de transparencia a efecto blur en el Navbar al hacer scroll.
2. **P4.2: Carrusel de Servicios con Efecto Peek**:
   - Configuración de Embla Carousel con una card central visible y laterales parcialmente asomadas.
   - Controles de navegación flotantes sobre el carrusel.
3. **P4.3: Menú Móvil Responsive**:
   - Menú de navegación centrado en escritorio y panel hamburguesa animado en móviles.
4. **P4.4: Enlace de Logo e Íconos**:
   - Carga de imágenes mediante rutas relativas resueltas por el empaquetador para compatibilidad total con `/asap/`.

---

### Prioridad 5 — Configuración y Perfil

1. **P5.1: Desempeño Docente**:
   - Ocultar la sección manteniendo el código documentado para futuras evaluaciones ministeriales.
2. **P5.2: Secciones Ampliadas en `/perfil`**:
   - **Horario Semanal**: Matriz editable de 7 franjas horarias por día.
   - **Integraciones**: Tarjetas de Google Calendar, Gmail, Teams y Zoom con modal de configuración y simulación de vinculación.
   - **Notificaciones**: Preferencias de alertas tempranas de ausentismo y notas.
   - **Instituciones**: Gestión de centros educativos asociados.
   - **Seguridad**: Cambio de contraseña y gestión de sesiones activas.

---

## 3. Plan de Pruebas y Verificación

1. **Pruebas de Backend**:
   - Ejecución de `npm test` para asegurar que los endpoints de autenticación, asistencia, calificaciones, planificación y workspace retornen 200 con esquemas válidos.
2. **Pruebas de Frontend y Build**:
   - Ejecución de `compile_applet` (`vite build`) verificando ausencia de errores de TypeScript y empaquetado adecuado del directorio `dist/`.
   - Comprobación de que `public/404.html` y `.nojekyll` se transfieran a la raíz del artefacto para GitHub Pages.
3. **Validación de Flujos**:
   - Prueba del flujo completo de toma y guardado de asistencia.
   - Prueba de edición de notas, cálculo automático de promedios y exportaciones CSV/XLSX/PDF.
   - Prueba de apertura de plantillas, edición en el editor enriquecido y descarga.
   - Verificación del arrastre en el tablero Kanban y actualización de estado.
