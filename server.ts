import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { app as apiApp, ensureDbConnected } from './server/routes/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Montar rutas de backend de la API primero
  app.use(apiApp);

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  } else {
    // En desarrollo, montar middlewares de Vite
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  ensureDbConnected().catch((err) => {
    console.warn('[asap DB] Inicialización en segundo plano:', err);
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[asap] Servidor corriendo en http://0.0.0.0:${PORT}`);
  });
}

startServer();
