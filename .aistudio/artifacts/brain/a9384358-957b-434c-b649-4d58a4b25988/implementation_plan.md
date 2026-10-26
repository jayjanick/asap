# Serverless Consolidation Plan for Vercel Deployment

Consolidate all server logic, routes, MongoDB connection, and mock data into a single self-contained `api/index.ts` file to eliminate `ERR_MODULE_NOT_FOUND` on Vercel serverless functions, and update `vercel.json`.

## User Review & Critical Decisions

> [!IMPORTANT]
> - **Consolidation**: Moving all code from `server/routes/api.ts` and `server/data/mockData.ts` into `api/index.ts` so Vercel executes a single zero-dependency-import serverless entry point.
> - **Configuration**: Simplifying `vercel.json` to remove `includeFiles`.

- **Confirmed Decision**: Follow the exact user instructions for structuring `api/index.ts` and `vercel.json`.

## 1. Overview & Core Concept

- **What It Does**: Resolves Vercel's runtime limitation where serverless functions cannot resolve relative imports outside `api/`.
- **Key Value**: Guarantees 100% stable API responses (`/api/auth/login`, `/api/asistencia`, `/api/calificaciones`, etc.) when deployed on Vercel.

## 2. User Experience & Visual Design

- No UI changes. Authentication, dashboard, attendance, and grading flows remain identical.

## 3. Key Product Decisions & Trade-Offs

- **Decision**: Single-file serverless architecture (`api/index.ts`).
  - *Chosen Approach*: Inline all mock constants, helper functions, Mongoose models/connection logic, and Express route handlers into `api/index.ts`.
  - *Why*: Vercel bundles `api/index.ts` (using esbuild during build or native node resolution) and executing a single file guarantees zero module resolution errors.

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                      Vercel Edge                       │
└───────────────────────────┬────────────────────────────┘
                            │ /api/*
                            ▼
┌────────────────────────────────────────────────────────┐
│                   api/index.ts                         │
│  - Mongoose Connection & Models                        │
│  - Mock Data Constants (DOCENTE_ACTUAL, Paralelos, etc) │
│  - Express App & CORS Configuration                    │
│  - Auth, Asistencia, Calificaciones, AI Endpoints      │
└────────────────────────────────────────────────────────┘
```
