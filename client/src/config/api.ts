/**
 * URL base para las peticiones a la API del backend.
 *
 * - Si estamos en GitHub Pages (jayjanick.github.io), debemos apuntar al backend de Vercel.
 * - Si estamos en desarrollo local, AI Studio preview (*.run.app) o el mismo host, usamos '' (rutas relativas)
 *   para comunicarnos directamente con el servidor Express integrado en el mismo origen.
 */
function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Si la app está ejecutándose en GitHub Pages, usar la URL del backend en Vercel
    if (hostname.includes('github.io')) {
      const externalUrl = import.meta.env.VITE_API_URL || 'https://asap-steel.vercel.app';
      return externalUrl.replace(/\/+$/, '');
    }
    // En AI Studio preview, localhost o cualquier servidor con backend integrado:
    // Retornar '' (ruta relativa) para evitar CORS y problemas con dominios externos.
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.run.app') ||
      hostname.endsWith('.google.com')
    ) {
      return '';
    }
  }

  // Fallback si no hay window o si se define explícitamente
  const envUrl = import.meta.env.VITE_API_URL || '';
  return envUrl.replace(/\/+$/, '');
}

export const API_URL = getApiUrl();
