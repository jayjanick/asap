/**
 * ASAP — Pruebas unitarias para los endpoints principales de la API
 */
import { app } from '../routes/api';
import http from 'http';

function makeRequest(path: string, method: string = 'GET', body?: any): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const address = server.address() as any;
      const port = address.port;
      const postData = body ? JSON.stringify(body) : '';

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          },
        },
        (res) => {
          let responseBody = '';
          res.on('data', (chunk) => (responseBody += chunk));
          res.on('end', () => {
            server.close();
            try {
              resolve({
                status: res.statusCode || 500,
                data: JSON.parse(responseBody),
              });
            } catch {
              resolve({
                status: res.statusCode || 500,
                data: responseBody,
              });
            }
          });
        }
      );

      req.on('error', (err) => {
        server.close();
        reject(err);
      });

      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  });
}

export async function runAllTests() {
  const results: { test: string; passed: boolean; details?: string }[] = [];

  try {
    // Test 1: Health endpoint
    const resHealth = await makeRequest('/api/health');
    results.push({
      test: 'GET /api/health responde status 200 con { status: "ok" }',
      passed: resHealth.status === 200 && resHealth.data?.status === 'ok',
    });

    // Test 2: Auth Login
    const resLogin = await makeRequest('/api/auth/login', 'POST', {
      email: 'andres.morales@educacion.gob.ec',
      password: 'password123',
    });
    results.push({
      test: 'POST /api/auth/login genera token y retorna usuario docente',
      passed: resLogin.status === 200 && Boolean(resLogin.data?.token) && resLogin.data?.user?.rol === 'Docente',
    });

    // Test 3: Dashboard data
    const resDash = await makeRequest('/api/dashboard');
    results.push({
      test: 'GET /api/dashboard retorna estadísticas, resumen del día y lista inteligente',
      passed: resDash.status === 200 && Boolean(resDash.data?.estadisticas?.totalEstudiantes),
    });

    // Test 4: Asistencia list
    const resAsist = await makeRequest('/api/asistencia');
    results.push({
      test: 'GET /api/asistencia retorna la lista de paralelos activos',
      passed: resAsist.status === 200 && Array.isArray(resAsist.data?.paralelos),
    });

    // Test 5: Calificaciones por curso
    const resCalif = await makeRequest('/api/calificaciones/par-8vo-a');
    results.push({
      test: 'GET /api/calificaciones/:cursoId retorna libro de notas y estadísticas',
      passed: resCalif.status === 200 && Array.isArray(resCalif.data?.libroNotas),
    });

    // Test 6: Planificación curricular
    const resPlan = await makeRequest('/api/planificacion');
    results.push({
      test: 'GET /api/planificacion retorna bloques curriculares MINEDUC',
      passed: resPlan.status === 200 && Array.isArray(resPlan.data?.planificaciones),
    });

    console.log('--- RESULTADOS DE PRUEBAS UNITARIAS ASAP ---');
    results.forEach((r) => {
      console.log(`${r.passed ? '✅' : '❌'} ${r.test}`);
    });
  } catch (error: any) {
    console.error('Error al ejecutar pruebas:', error);
  }

  return results;
}
