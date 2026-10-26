/**
 * ASAP — Pruebas unitarias para los endpoints principales de la API v1.1
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

    // Test 2: Auth Login con credenciales válidas
    const resLogin = await makeRequest('/api/auth/login', 'POST', {
      email: 'andres.morales@uefdemocracia.edu.ec',
      password: 'asap2024',
    });
    results.push({
      test: 'POST /api/auth/login genera JWT y retorna usuario docente Andrés Morales',
      passed: resLogin.status === 200 && Boolean(resLogin.data?.token) && resLogin.data?.user?.rol === 'Docente',
    });

    // Test 2b: Auth Login rechaza contraseña incorrecta (401)
    const resBadPass = await makeRequest('/api/auth/login', 'POST', {
      email: 'andres.morales@uefdemocracia.edu.ec',
      password: 'clave_incorrecta_123',
    });
    results.push({
      test: 'POST /api/auth/login rechaza contraseña incorrecta con status 401',
      passed: resBadPass.status === 401 && resBadPass.data?.error === 'Contraseña incorrecta',
    });

    // Test 2c: Auth Login rechaza usuario no registrado (404)
    const resNoUser = await makeRequest('/api/auth/login', 'POST', {
      email: 'usuario.inexistente@noexiste.ec',
      password: 'algunapassword',
    });
    results.push({
      test: 'POST /api/auth/login rechaza usuario no registrado con status 404',
      passed: resNoUser.status === 404 && resNoUser.data?.error === 'Usuario no encontrado',
    });

    // Test 2d: GET /api/auth/me sin token retorna 401
    const resNoAuth = await makeRequest('/api/auth/me');
    results.push({
      test: 'GET /api/auth/me sin token retorna status 401',
      passed: resNoAuth.status === 401,
    });

    // Test 3: Dashboard data
    const resDash = await makeRequest('/api/dashboard');
    results.push({
      test: 'GET /api/dashboard retorna horario del día, clases de la semana y por hacer',
      passed: resDash.status === 200 && Boolean(resDash.data?.estadisticas?.clasesPlanificadasSemana),
    });

    // Test 4: Asistencia list
    const resAsist = await makeRequest('/api/asistencia');
    results.push({
      test: 'GET /api/asistencia retorna la lista de paralelos activos',
      passed: resAsist.status === 200 && Array.isArray(resAsist.data?.paralelos),
    });

    // Test 5: Guardar Asistencia
    const resGuardarAsist = await makeRequest('/api/asistencia/par-8vo-a', 'POST', {
      fecha: new Date().toISOString().slice(0, 10),
      registros: [{ estudianteId: 'est-8a-01', estado: 'P' }]
    });
    results.push({
      test: 'POST /api/asistencia/:cursoId persiste la asistencia del día',
      passed: resGuardarAsist.status === 200 && resGuardarAsist.data?.success === true,
    });

    // Test 6: Calificaciones por curso
    const resCalif = await makeRequest('/api/calificaciones/par-8vo-a');
    results.push({
      test: 'GET /api/calificaciones/:cursoId retorna matriz de notas y estadísticas',
      passed: resCalif.status === 200 && Array.isArray(resCalif.data?.libroNotas),
    });

    // Test 7: Análisis del grupo con IA
    const resAnalisisIA = await makeRequest('/api/ai/analisis-rendimiento', 'POST', {
      paraleloId: 'par-8vo-a'
    });
    results.push({
      test: 'POST /api/ai/analisis-rendimiento genera diagnóstico formativo para el paralelo',
      passed: resAnalisisIA.status === 200 && Boolean(resAnalisisIA.data?.analisis),
    });

    // Test 8: Workspace Kanban
    const resKanban = await makeRequest('/api/workspace/kanban');
    results.push({
      test: 'GET /api/workspace/kanban retorna tareas del tablero',
      passed: resKanban.status === 200 && Array.isArray(resKanban.data?.kanbanTasks),
    });

    // Test 9: Mis Documentos
    const resDocs = await makeRequest('/api/workspace/documentos');
    results.push({
      test: 'GET /api/workspace/documentos retorna documentos con categorización',
      passed: resDocs.status === 200 && Array.isArray(resDocs.data?.documentos),
    });

    console.log('--- RESULTADOS DE PRUEBAS UNITARIAS ASAP v1.1 ---');
    results.forEach((r) => {
      console.log(`${r.passed ? '✅' : '❌'} ${r.test}`);
    });
    
    const allPassed = results.every(r => r.passed);
    console.log(`\nResumen: ${results.filter(r => r.passed).length}/${results.length} pruebas pasadas.`);
    process.exit(allPassed ? 0 : 1);
  } catch (error: any) {
    console.error('Error al ejecutar pruebas:', error);
    process.exit(1);
  }

  return results;
}

