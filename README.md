# asap — Infraestructura Digital y Plataforma Educativa

> **Misión:** *asap* existe para hacer el trabajo de los docentes del sistema público ecuatoriano más liviano, ágil y efectivo — eliminando el papeleo, digitalizando su flujo diario y poniéndoles la inteligencia artificial al alcance sin que tengan que aprenderla: simplemente ya está ahí.

---

## 🚀 Arquitectura del Proyecto

El repositorio sigue una arquitectura desacoplada para despliegue independiente:

```
asap/
├── client/              → Aplicación React (Vite)
│   └── src/
│       ├── components/  → Primitivas shadcn/ui, layout y landing page
│       ├── context/     → Estado de autenticación y tema dark/light
│       ├── data/        → Mock data completo (Lic. Andrés Morales, 8vo A y 9no B)
│       └── pages/       → Landing, Login, Register, Dashboard, Asistencia,
│                          Planificación, Calificaciones, Workspace, Perfil
└── server/              → API REST con Node.js y Express
    ├── controllers/     → Controladores de negocio
    ├── models/          → 10 esquemas Mongoose fieles al diagrama ERD
    ├── routes/          → Rutas RESTful (/api/*)
    ├── services/        → gemini.ts (Google GenAI) y whatsapp.ts (placeholder)
    └── tests/           → Pruebas unitarias automatizadas
```

---

## 📦 Instrucciones de Despliegue

### 1. Despliegue del Frontend en GitHub Pages
La aplicación cliente está construida como una SPA estática con Vite:
1. Asegurarse de tener configurado el nombre del repositorio en `vite.config.ts` si se aloja en subruta (`base: '/nombre-repo/'`).
2. Ejecutar el script automatizado:
   ```bash
   npm run deploy
   ```
3. En GitHub: ve a **Settings** → **Pages** → en **Source** selecciona **Deploy from a branch** → Branch: `gh-pages` / Folder: `/(root)`.
4. El archivo `.nojekyll` y `404.html` incluidos garantizan que las rutas de React Router carguen sin error 404 al recargar el navegador.

### 2. Despliegue del Backend en Render / Railway / Cloud Run
El servidor Express en `server/server.ts` está listo para ser alojado como Web Service:
1. Crear un **New Web Service** en Render conectado a este repositorio.
2. Configuración:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm run server`
3. Variables de entorno recomendadas en Render:
   - `PORT=5000`
   - `GEMINI_API_KEY=tu_clave_de_gemini`
   - `MONGODB_URI=mongodb+srv://...` (opcional; el backend cuenta con mock store en memoria de respaldo)
   - `JWT_SECRET=tu_secreto_jwt`

### 3. Ejecución Local / Desarrollo
```bash
npm run dev
```
Abre automáticamente el servidor en `http://localhost:3000` donde el middleware de Express maneja los endpoints de `/api/*` y Vite sirve la interfaz de usuario en tiempo real.

### 4. Pruebas Unitarias
```bash
npm test
```
Ejecuta las pruebas automatizadas sobre los endpoints de salud, autenticación, asistencia, calificaciones y planificación con IA.
