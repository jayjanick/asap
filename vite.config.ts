import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { app as expressApp } from './server/routes/api';

export default defineConfig({
  base: '/asap/',
  plugins: [
    react(),
    {
      name: 'express-api-middleware',
      configureServer(server) {
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
