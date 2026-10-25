import { app, ensureDbConnected } from './routes/api';

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  ensureDbConnected().catch(() => {}).finally(() => {
    app.listen(PORT, () => {
      console.log(`[asap backend] Servidor Express corriendo en http://localhost:${PORT}`);
    });
  });
}

export default app;
