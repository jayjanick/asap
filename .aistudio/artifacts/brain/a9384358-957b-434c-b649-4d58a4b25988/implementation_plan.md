# MongoDB Persistence & Schema Integration Plan

Replace in-memory state arrays (`paralelosState`, `calificacionesMatrix`, `kanbanTasks`, `actividadesState`) in `api/index.ts` with real MongoDB queries using new Mongoose schemas, maintaining memory arrays strictly as fallbacks when `!isMongoConnected()`.

## User Review & Critical Decisions

> [!IMPORTANT]
> - **New Mongoose Schemas**: `Asistencia`, `Calificacion`, `Actividad`, and `KanbanTask`.
> - **Endpoints to Update**:
>   1. `POST /api/asistencia/:cursoId`
>   2. `GET /api/asistencia/:cursoId`
>   3. `PUT /api/calificaciones/celda`
>   4. `GET /api/calificaciones/:cursoId`
>   5. `POST /api/calificaciones/actividad`
>   6. `GET /api/workspace/kanban` (and related POST, PUT, DELETE methods)
> - **Fallback Strategy**: If `!isMongoConnected()`, fall back seamlessly to the existing in-memory arrays.

## 1. Overview & Core Concept

- **What It Does**: Persists attendance, grades, activities, and Kanban tasks directly in MongoDB Atlas collections when connected, ensuring true multi-session persistence across serverless/server deployments.
- **Key Value**: Eliminates reliance on volatile in-memory state when MongoDB is available.

## 2. Technical Architecture & Data Strategy

- **New Mongoose Schemas**:
  - `AsistenciaSchema`: `{ paraleloId: String, fecha: String, registros: [{ estudianteId: String, estado: String, justificada: Boolean, motivo: String }] }`
  - `CalificacionSchema`: `{ paraleloId: String, estudianteId: String, actividadId: String, nota: Number }`
  - `ActividadSchema`: `{ paraleloId: String, titulo: String, tipo: String, fechaEntrega: String, ponderacion: Number, entregadosCount: Number, totalCount: Number, estado: String, bloque: Number, descripcion: String }`
  - `KanbanTaskSchema`: `{ titulo: String, descripcion: String, paralelo: String, columna: String, prioridad: String, urgencia: String, fecha: String, fechaLimite: String, observaciones: String, adjuntos: [String] }`
- **Controller Logic**: Each of the 6 endpoints checks `isMongoConnected()`. If true, queries/mutates MongoDB. Otherwise, falls back to the in-memory array.
