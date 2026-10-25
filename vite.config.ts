import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: process.env.VERCEL ? '/' : (process.env.VITE_BASE || '/asap/'),
  plugins: [
    react(),
    {
      name: 'express-api-middleware',
      async configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/' || req.url === '') {
            const target = process.env.VERCEL ? '/' : '/asap/';
            if (req.url !== target) {
              res.writeHead(302, { Location: target });
              res.end();
              return;
            }
          }
          next();
        });
        const { app: expressApp, ensureDbConnected } = await import('./server/routes/api');
        ensureDbConnected().catch(() => {});
        server.middlewares.use(expressApp);
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
  },
  build: {
    outDir: 'dist',
  },
});
