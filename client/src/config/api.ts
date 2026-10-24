/**
 * Configuración centralizada de endpoints de API para ASAP.
 * 
 * - En AI Studio y desarrollo local: VITE_API_URL es '/api' (o vacío), por lo que se usan
 *   rutas relativas y el servidor Express local atiende todo directamente sin necesidad de hosting externo.
 * - En despliegue estático (GitHub Pages): VITE_API_URL puede apuntar a la URL de tu backend
 *   desplegado gratuitamente en Koyeb o Render (ejemplo: https://mi-backend.koyeb.app/api).
 */

const RAW_API_URL = import.meta.env.VITE_API_URL || '/api';

export const API_BASE_URL = RAW_API_URL.replace(/\/$/, '');

export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Si API_BASE_URL termina en '/api' y el endpoint empieza por '/api', evitar duplicar '/api/api/...'
  if (API_BASE_URL.endsWith('/api') && cleanEndpoint.startsWith('/api')) {
    return `${API_BASE_URL.slice(0, -4)}${cleanEndpoint}`;
  }
  
  // Si API_BASE_URL es una URL externa (https://...) que no tiene /api y el endpoint empieza con /api:
  if (API_BASE_URL.startsWith('http') && !API_BASE_URL.endsWith('/api') && cleanEndpoint.startsWith('/api')) {
    return `${API_BASE_URL}${cleanEndpoint}`;
  }

  return `${API_BASE_URL}${cleanEndpoint}`;
}
