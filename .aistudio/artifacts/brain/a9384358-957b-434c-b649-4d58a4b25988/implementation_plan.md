# Plan de Arquitectura: Configuración WebSocket Vite y Migración Integral a MongoDB Dinámico

El objetivo de esta iniciativa es eliminar definitivamente los errores de conexión WebSocket originados por el cliente HMR de Vite en entornos de despliegue/iframe, y suprimir toda información estática o datos quemados en código (*mock/in-memory states*), garantizando que el flujo de datos opere exclusivamente a través de la URI de MongoDB y las APIs REST autenticadas.

## Decisiones Críticas y Preferencias del Usuario

> [!IMPORTANT]
> A partir de las aclaraciones confirmadas por el usuario:
> 1. **WebSocket HMR de Vite**: Se configurará `vite.config.ts` con cliente HMR seguro (`protocol: 'wss'`, `clientPort: 443`) y tolerancia a desconexión sin bloquear ni saturar la consola del navegador.
> 2. **Alcance de Persistencia MongoDB**: Se migrarán **todos los módulos restantes** (Dashboard inteligente, Planificaciones Curriculares con IA, Alumnos y Estadísticas por docente) hacia colecciones dinámicas de MongoDB, manteniendo el fallback en memoria únicamente como salvaguarda en caso de caída transitoria de red.

- **Decisión Confirmada 1**: Configurar Vite HMR con protocolo seguro `wss` y puerto cliente `443` en entornos con proxy reverso/HTTPS.
- **Decisión Confirmada 2**: Reemplazar la data estática (`DOCENTE_ACTUAL`, `planificacionesState`, conteos fijos de 60 estudiantes o 94.8% de asistencia) por queries y agregaciones dinámicas en MongoDB filtradas por el `docenteId` del JWT.

---

## 1. Visión General y Objetivos

### ¿Qué soluciona esta implementación?
1. **Estabilidad en Frontend**: Resuelve la causa raíz del error `WebSocket connection to 'wss://.../@vite/client' failed` que satura los logs del navegador cuando Vite intenta comunicarse con un socket local no expuesto a través del proxy HTTPS.
2. **Autonomía y Veracidad de Datos**: Cada docente registrado verá únicamente sus propios paralelos, alumnos, tareas kanban, documentos, planificaciones curriculares y métricas de rendimiento reales calculadas desde la base de datos de MongoDB Atlas.

### Beneficiarios
- **Docentes de Educación Básica y Bachillerato**: Interfaz personalizada donde los cursos, nóminas y planificaciones son suyos y persisten indefinidamente entre sesiones.
- **Administradores y Evaluadores de la Plataforma**: Logs limpios sin excepciones de red WebSocket ni sobreescrituras accidentales de usuarios.

---

## 2. Experiencia de Usuario y Flujo de Datos

### Flujo de Datos Dinámico (Fin a Fin)
1. **Autenticación**: El usuario ingresa credenciales o usa Google OAuth. El backend genera un JWT con el `docenteId` correspondiente.
2. **Dashboard Dinámico (`/api/dashboard`)**:
   - Obtiene el usuario autenticado desde `Usuario.findById(docenteId)`.
   - Consulta los paralelos del docente en `Paralelo.find({ docenteId })`.
   - Cuenta en tiempo real los alumnos activos asociados a dichos paralelos en `Alumno.countDocuments({ paraleloId: { $in: misParalelosIds } })`.
   - Calcula el promedio de asistencia mensual real a partir de `Asistencia.find({ paraleloId: { $in: misParalelosIds } })`.
   - Genera los bloques de *"Por Hacer Inteligente"* utilizando los nombres reales de los cursos del docente.
3. **Planificaciones Curriculares (`/api/planificacion`)**:
   - `GET /api/planificacion`: Lee de la colección `Planificacion` filtrando por `{ docenteId }` ordenado por fecha de creación.
   - `POST /api/planificacion`: Inserta el nuevo plan curricular generado manual o con Gemini en MongoDB vinculado al `docenteId`.
4. **Vite WebSocket / HMR**:
   - La aplicación cliente carga de forma fluida sin errores en la consola roja de las herramientas de desarrollador.

---

## 3. Decisiones Técnicas y Arquitectura

### 1. Vite HMR WebSocket
- **Causa Raíz**: En entornos en la nube o iframes seguros (`https://ais-dev-....run.app`), Vite inyecta su cliente HMR que por defecto intenta abrir un WebSocket a `wss://<host>:3000/` o `ws://localhost:3000`. Dado que la conexión externa llega por HTTPS al puerto 443 a través de un proxy que no redirige ese subcanal de socket, la conexión falla repetidamente.
- **Solución Implementada**:
  - En `vite.config.ts`, configurar `server.hmr` con `protocol: 'wss'`, `clientPort: 443`, y `timeout: 5000` si está en entorno de producción o proxy, además de evitar overlays intrusivos con `overlay: false`. Si el entorno no soporta HMR bidireccional, se agrega un wrapper seguro para silenciar errores no críticos de HMR sin afectar la carga de la aplicación.

### 2. Esquema Mongoose para Planificaciones (`PlanificacionSchema`)
- Se creará el modelo `Planificacion` en `api/index.ts`:
  ```ts
  {
    docenteId: { type: String, required: true },
    paraleloId: { type: String },
    titulo: { type: String, required: true },
    materia: { type: String, required: true },
    nivel: { type: String, default: '8vo EGB' },
    bloque: { type: Number, default: 2 },
    destreza: { type: String, default: '' },
    semanas: { type: Number, default: 4 },
    progreso: { type: Number, default: 0 },
    estado: { type: String, default: 'Por iniciar' },
    generadaIA: { type: Boolean, default: false },
    unidades: [{ semana: Number, tema: String, objetivo: String, actividades: [String], evaluacion: String }],
    adaptacionesNEE: [{ grado: String, adaptacion: String }]
  }
  ```

### 3. Métricas Reales en Dashboard
- Sustituir los valores quemados (`totalEstudiantes: 60`, `asistenciaPromedioMes: 94.8`, docente Morales predeterminado) por consultas agregadas que cuenten alumnos y registros de asistencia reales de los paralelos del docente activo.

---

## 4. Diagrama de Arquitectura y Persistencia

```
┌─────────────────────────────────────────────────────────────┐
│                   Cliente Web (React + Vite)                │
│   - Sin errores WebSocket (HMR clientPort 443 / wss)        │
│   - JWT Bearer Header en todas las peticiones               │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Express API Gateway (api/index.ts)          │
│   - connectDB() con pool persistente                        │
│   - getUserFromToken(req) -> docenteId (String)             │
└──────┬───────────────────────┬───────────────────────┬──────┘
       │                       │                       │
       ▼                       ▼                       ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  Colección   │       │  Colección   │       │  Colección   │
│  Paralelos   │       │   Alumnos    │       │ Planificación│
│ (docenteId)  │       │(paraleloId)  │       │ (docenteId)  │
└──────────────┘       └──────────────┘       └──────────────┘
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│            MongoDB Atlas Cluster (MONGODB_URI)              │
│       Persistencia completa sin arrays estáticos            │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Plan de Ejecución Paso a Paso

1. **Ajuste en `vite.config.ts`**:
   - Configurar `server.hmr` con puerto y protocolo apropiados (`protocol: 'wss'`, `clientPort: 443`, `overlay: false`) para erradicar el error de WebSocket en navegación segura.
2. **Nuevo Schema `Planificacion`**:
   - Declarar `PlanificacionSchema` y compilar el modelo `Planificacion` en `api/index.ts`.
3. **Migración de Endpoints de Planificación**:
   - `GET /api/planificacion`: Consultar MongoDB filtrando por el `docenteId` del token.
   - `POST /api/planificacion`: Guardar el plan generado en MongoDB con `docenteId`.
4. **Cálculo Dinámico de Métricas en `GET /api/dashboard`**:
   - Reemplazar datos fijos de `DOCENTE_ACTUAL`, conteo de alumnos y porcentajes por agregaciones reales en base a los paralelos del usuario.
5. **Verificación y Testing**:
   - Ejecutar `npm run build` y `npm test`.
   - Validar con `lint_applet` y `compile_applet`.
