import { app } from './routes/api';

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[asap backend] Servidor Express corriendo en http://localhost:${PORT}`);
  });
}

export default app;
