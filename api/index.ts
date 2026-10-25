// Entry point Serverless Function para Vercel
// Usa dynamic imports e inicialización diferida para evitar arrastrar Mongoose o conexiones durante el build

let cachedHandler: any = null;
let initPromise: Promise<any> | null = null;

async function getHandler() {
  if (cachedHandler) {
    return cachedHandler;
  }

  if (!initPromise) {
    initPromise = (async () => {
      // Import dinámico de la app Express y modelos
      const { app, ensureDbConnected } = await import('../server/routes/api');

      // Inicializar MongoDB Atlas solo cuando Vercel invoque la función, no durante el build
      try {
        await ensureDbConnected();
      } catch (err) {
        console.warn('[Vercel Serverless] Error en conexión inicial a MongoDB:', err);
      }

      cachedHandler = app;
      return app;
    })();
  }

  return initPromise;
}

export default async function handler(req: any, res: any) {
  try {
    const app = await getHandler();
    return app(req, res);
  } catch (error: any) {
    console.error('[Vercel Serverless] Error en handler:', error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Internal Server Error', message: error?.message || 'Error en backend serverless' }));
    }
  }
}
