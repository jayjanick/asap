# Panel de Administración y Monitoreo — ASAP

Implementación quirúrgica de un módulo de administración independiente para supervisar docentes registrados, estado operativo de la base de datos y variables de entorno, registro de errores en tiempo real y control de sesiones JWT activas respaldadas en MongoDB (compatible con entornos serverless como Vercel), manteniendo intacto el flujo actual del docente.

### User Review & Critical Decisions

> [!IMPORTANT]
> Se han actualizado las decisiones arquitectónicas del plan conforme a tus correcciones:

- **Eliminación en Cascada Completa (`DELETE /api/admin/usuarios/:id`)**: Al eliminar un usuario, se borrarán en cascada todos sus documentos asociados en MongoDB: primero se obtienen sus paralelos (`docenteId`) para eliminar `Alumno`, `Asistencia`, `Calificacion` y `Actividad` asociados por `paraleloId`; luego se eliminan `Paralelo`, `Planificacion`, `Documento` y `KanbanTask` por `docenteId`. **Regla especial para `KanbanTask`**: únicamente cuando el usuario a eliminar sea Andrés Morales (`email === 'andres.morales@uefdemocracia.edu.ec'`), el filtro de eliminación de `KanbanTask` incluirá también el identificador legacy `'docente-1'` (`{ docenteId: { $in: [id, 'docente-1'] } }`) para limpiar tareas con `docenteId` hardcodeado. Finalmente, se revocan sus sesiones en `Sesion` y se elimina el documento en `Usuario`.
- **Persistencia de Sesiones en MongoDB (`Sesion` / colección `sesiones`)**: Para garantizar persistencia entre invocaciones serverless en Vercel (donde la memoria efímera se reinicia entre peticiones), se añade un esquema ligero `SesionSchema` con los campos `tokenId`, `userId`, `email`, `createdAt`, `expiresAt` y `revocado` (`boolean`, por defecto `false`). El middleware `requireAdmin` verificará en MongoDB que la sesión asociada al JWT tenga `revocado === false`. Revocar un token ejecutará `updateOne({ tokenId }, { $set: { revocado: true } })`.
- **Credenciales del Administrador (`seed-admin`)**: El aprovisionamiento inicial leerá exclusivamente las credenciales desde las variables de entorno (`ADMIN_EMAIL` y `ADMIN_PASSWORD`). Una vez creado el primer usuario con rol `Admin`, el endpoint quedará deshabilitado automáticamente devolviendo `403 Forbidden`.
- **Tipografías vía Google Fonts**: Las fuentes `Plus Jakarta Sans` y `DM Sans` se cargarán exclusivamente mediante etiquetas `<link>` de Google Fonts en el archivo HTML raíz, sin instalar paquetes ni dependencias adicionales en `npm`.

---

### 1. Overview & Core Concept

- **What It Does**: Proporciona una consola administrativa aislada donde el administrador del sistema puede auditar cuentas de docentes, inspeccionar sus paralelos y métricas académicas, eliminar cuentas con limpieza total en cascada de sus datos asociados, verificar la salud de MongoDB y las variables de entorno configuradas, revisar los últimos 100 errores capturados y revocar sesiones JWT de forma persistente.
- **Target Audience / Persona**: Administradores técnicos e institucionales responsables de la operación, soporte, limpieza de datos y seguridad de la plataforma ASAP.
- **Key Value**: Visibilidad operativa y control de acceso persistente compatible con despliegues serverless en Vercel, sin interferir con la sesión, el contexto de autenticación ni la interfaz de trabajo de los docentes.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Acceso Independiente**: El administrador ingresa por la vista pública de acceso administrativo, se valida que su cuenta posea estrictamente el rol `Admin`, se registra la sesión en la colección `sesiones` de MongoDB (`revocado: false`), y se almacena su credencial en `asap_admin_token` (separada de `asap_token` del docente).
  2. **Resumen Operativo (Dashboard)**: Visualización inmediata de cuatro indicadores clave (Total de Usuarios, Estado de MongoDB, Sesiones Activas No Revocadas y Errores Recientes), acompañada de una tabla compacta con los últimos 5 incidentes capturados.
  3. **Gestión de Docentes y Borrado en Cascada (Usuarios)**: Tabla con buscador instantáneo que muestra nombre, correo, rol, institución, fecha de registro y cantidad de paralelos. Incluye un modal de detalle con las estadísticas y paralelos del docente, y un modal de confirmación que informa claramente del borrado en cascada (paralelos, alumnos, asistencias, calificaciones, actividades, planificaciones, documentos y tareas Kanban) antes de ejecutar la eliminación.
  4. **Diagnóstico del Sistema**: Panel en vivo que reporta el estado de conexión de Mongoose (`readyState`), el tiempo de actividad (`uptime`), la marca de tiempo del servidor y una matriz de verificación de variables de entorno presentes (sin exponer secretos).
  5. **Auditoría de Errores y Seguridad**: Consulta de los últimos 100 errores HTTP con filtro por ruta o código de estado, y listado de sesiones JWT activas (`revocado: false`) desde MongoDB con botón para revocar cualquier sesión mediante `updateOne({ revocado: true })`.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Consola de operaciones empresariales y telemetría limpia, priorizando alta densidad informativa, contraste nítido y ausencia de adornos innecesarios.
  - *Color Palette & Mood*: Lienzo principal en gris neutro frío (`#F8FAFC`), barra lateral fija en pizarra profundo (`#0F172A`), superficies de datos en blanco puro (`#FFFFFF`) con bordes sutiles de `1px` (`#E2E8F0`), y semántica estricta de estado: Esmeralda (`#16A34A`) para servicios conectados, Ámbar (`#D97706`) para advertencias y Carmesí (`#DC2626`) para errores HTTP o acciones destructivas/revocación.
  - *Typography & Hierarchy*: Encabezados y navegación en `Plus Jakarta Sans` (`600`/`700`) y cuerpo de lectura densa en `DM Sans` (`13px`–`15px`) cargadas vía Google Fonts en el HTML principal; cifras, marcas de tiempo, tiempos de actividad y códigos HTTP en tipografía monoespaciada con numerales tabulares (`font-mono tabular-nums`).
  - *Component Styling & Layout*: Barra lateral izquierda fija (`250px`) totalmente independiente del layout docente, barra superior contextual con ruta activa y botón de cierre de sesión, y tablas de datos de alta densidad con filas compactas (`40px`).

- **Interactive Feedback & Motion**:
  - Estados de carga con esqueletos estructurales (`Skeleton`) alineados a las tablas y tarjetas.
  - Estados vacíos claros cuando no existen errores registrados o sesiones activas.
  - Confirmaciones modales en interfaz (sin `window.alert`) antes de eliminar un usuario en cascada o revocar una sesión activa.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Respaldo de Sesiones en MongoDB (`SesionSchema`) + Caché en Memoria**
  - *Chosen Approach*: Crear la colección ligera `sesiones` (`tokenId`, `userId`, `email`, `createdAt`, `expiresAt`, `revocado: boolean`) sincronizada con `activeSessions`. En cada verificación de `requireAdmin` (y validación de sesión), se comprueba en MongoDB que `revocado === false` y que `expiresAt > new Date()`. Revocar actualiza `revocado: true` mediante `updateOne`.
  - *Why*: En entornos serverless como Vercel, las variables en memoria se pierden entre ejecuciones de funciones Lambda; persistir el estado `revocado` en MongoDB garantiza que las sesiones sigan siendo visibles y revocables de forma fiable en producción.
  - *Alternatives Considered*: Mantener sesiones solo en un `Set`/`Map` en memoria; descartado porque pierde todas las sesiones al reciclarse la instancia serverless en Vercel.

- **Decision 2: Borrado en Cascada Integral por `docenteId` y `paraleloId` (con soporte legacy para Andrés Morales)**
  - *Chosen Approach*: Cuando el administrador elimina un docente en `DELETE /api/admin/usuarios/:id`, el backend obtiene primero el documento del usuario para verificar su email, localiza todos sus paralelos (`docenteId`), extrae sus IDs (`paraleloIds`), y ejecuta eliminaciones sobre `Alumno`, `Asistencia`, `Calificacion` y `Actividad` (`{ paraleloId: { $in: paraleloIds } }`), seguidas de `Paralelo`, `Planificacion` y `Documento` (`{ docenteId: id }`). Para `KanbanTask`, si `usuario.email === 'andres.morales@uefdemocracia.edu.ec'`, filtra por `{ docenteId: { $in: [id, 'docente-1'] } }`; para cualquier otro usuario filtra exclusivamente por `{ docenteId: id }`. Luego marca sus sesiones como `revocado: true` y elimina el documento `Usuario`.
  - *Why*: Evita documentos huérfanos en la base de datos y limpia tareas Kanban legacy de Andrés Morales sin afectar las tareas de otros docentes.
  - *Alternatives Considered*: Aplicar `'docente-1'` a todos los usuarios; descartado porque borraría las tareas legacy de Andrés Morales al eliminar a un docente distinto.

- **Decision 3: Aislamiento Total de Autenticación (`asap_admin_token` vs `asap_token`)**
  - *Chosen Approach*: Almacenar el token administrativo en una clave dedicada de `localStorage` y proteger las vistas mediante `AdminProtectedRoute` verificando `rol === 'Admin'`, sin modificar `AuthContext.tsx`.
  - *Why*: Permite operar el panel administrativo y el portal docente de forma completamente independiente sin efectos secundarios en las vistas actuales.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND — CONSOLA ADMIN (SPA)                        │
│               (Google Fonts: Plus Jakarta Sans + DM Sans)                    │
│                                                                              │
│  ┌────────────────────┐      ┌────────────────────────────────────────────┐  │
│  │  AdminLoginPage    │─────▶│ localStorage: asap_admin_token (rol=Admin) │  │
│  └────────────────────┘      └─────────────────────┬──────────────────────┘  │
│                                                    │                         │
│                                                    ▼                         │
│                              ┌────────────────────────────────────────────┐  │
│                              │   AdminProtectedRoute + AdminLayout        │  │
│                              └─────────────────────┬──────────────────────┘  │
│                                                    │                         │
│        ┌───────────────────┬───────────────────┬───┴───────────────┬──────┐  │
│        ▼                   ▼                   ▼                   ▼      ▼  │
│  ┌───────────┐       ┌───────────┐       ┌───────────┐       ┌────────┐ ┌──┐ │
│  │ Dashboard │       │ Usuarios  │       │  Sistema  │       │  Logs  │ │Se│ │
│  │   View    │       │   View    │       │   View    │       │  View  │ │gu│ │
│  └─────┬─────┘       └─────┬─────┘       └─────┬─────┘       └────┬───┘ └─┬┘ │
└────────┼───────────────────┼───────────────────┼──────────────────┼───────┼──┘
         │                   │                   │                  │       │
         └───────────────────┴─────────┬─────────┴──────────────────┴───────┘
                                       │ Bearer <asap_admin_token>
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                   BACKEND — EXPRESS / VERCEL SERVERLESS API                  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ Middleware requireAdmin (verifica JWT + rol==='Admin' + revocado===false)│  │
│  └───────────┬───────────────────────┬────────────────────────┬───────────┘  │
│              │                       │                        │              │
│              ▼                       ▼                        ▼              │
│  ┌──────────────────────┐ ┌─────────────────────┐ ┌───────────────────────┐  │
│  │  MongoDB Collections │ │  MongoDB Sesiones   │ │ Diagnóstico & Logs    │  │
│  │  • Usuario (+Admin)  │ │  • tokenId, userId  │ │ • connection.readySt. │  │
│  │  • Cascada: Paralelo │ │  • email, createdAt │ │ • Variables presentes │  │
│  │    Alumno,Asistencia │ │  • expiresAt        │ │ • Uptime y Timestamp  │  │
│  │    Calif.,Plan,Doc,KB│ │  • revocado: false  │ │ • adminLogs[100]      │  │
│  └──────────────────────┘ └─────────────────────┘ └───────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - **Usuario (`UsuarioSchema`)**: Se amplía el `enum` del campo `rol` a `['Docente', 'Director', 'Coordinador', 'Admin']`.
  - **Sesión (`SesionSchema` / colección `sesiones`)**:
    - `tokenId`: `String` (único, indexado, incluido en el payload del JWT al iniciar sesión).
    - `userId`: `String` (ID del usuario en MongoDB).
    - `email`: `String`.
    - `createdAt`: `Date` (por defecto `Date.now`).
    - `expiresAt`: `Date` (`+7 días` acorde a la expiración del JWT).
    - `revocado`: `Boolean` (por defecto `false`).
  - **Eliminación en Cascada (`DELETE /api/admin/usuarios/:id`)**:
    1. Obtiene el documento del usuario (`const userToDelete = await Usuario.findById(id)`).
    2. Busca todos los paralelos donde `docenteId` coincida con el `id` del usuario (`String` u `ObjectId`).
    3. Recopila sus identificadores (`paraleloIds` como `ObjectId` y `String`).
    4. Ejecuta `deleteMany` en `Alumno`, `Asistencia`, `Calificacion` y `Actividad` filtrando por `paraleloId: { $in: paraleloIds }`.
    5. Ejecuta `deleteMany` en `Paralelo`, `Planificacion` y `Documento` filtrando por `docenteId: id`.
    6. Ejecuta `deleteMany` en `KanbanTask` filtrando por `{ docenteId: { $in: [id, 'docente-1'] } }` si `userToDelete.email === 'andres.morales@uefdemocracia.edu.ec'`, o por `{ docenteId: id }` en caso contrario.
    7. Ejecuta `Sesion.updateMany({ userId: id }, { $set: { revocado: true } })`.
    8. Ejecuta `Usuario.findByIdAndDelete(id)` y retorna el resumen de documentos eliminados.
  - **Registro de Errores (`adminLogs`)**: Lista acotada a los últimos 100 errores capturados por el middleware global de Express con `{ id, timestamp, method, route, message, statusCode }`.

- **Interactive Component & State Mapping**:
  - **Autenticación y Guardián**: `AdminLoginPage` invoca `POST /api/auth/login` (que crea el registro en `Sesion` con `revocado: false`), comprueba `user.rol === 'Admin'` y persiste `asap_admin_token`. `AdminProtectedRoute` verifica el token antes de montar `AdminLayout`.
  - **Inspección y Borrado en Cascada de Usuarios**: `AdminUsuariosPage` carga `GET /api/admin/usuarios`, muestra el detalle completo mediante `GET /api/admin/usuarios/:id` y ejecuta `DELETE /api/admin/usuarios/:id` tras confirmación modal, limpiando todos los datos del docente en MongoDB (incluyendo `docente-1` en `KanbanTask` si se trata de Andrés Morales).
  - **Monitoreo y Revocación Persistente**: `AdminSistemaPage` consulta `GET /api/admin/sistema`; `AdminLogsPage` consulta `GET /api/admin/logs`; `AdminSeguridadPage` lista las sesiones activas (`revocado: false`) desde `GET /api/admin/sesiones` y revoca tokens mediante `DELETE /api/admin/sesiones/:tokenId` (`Sesion.updateOne({ tokenId }, { $set: { revocado: true } })`).
