# Corrección Crítica de Autenticación y Validación de Credenciales en asap

Plan de implementación detallado para corregir los 4 problemas críticos de autenticación en la plataforma, garantizando que usuarios no autenticados vean únicamente la Landing y Login, que el registro persista usuarios con contraseñas cifradas en MongoDB, y que el login valide estrictamente credenciales con bcrypt sin fallbacks permisivos.

## User Review & Critical Decisions

> [!IMPORTANT]
> Se han incorporado las decisiones confirmadas en la fase de clarificación:
> 1. **Limpieza de tokens residuales**: Al inicializar la app, se limpiarán tokens demo previos (`demo-jwt-token-asap`, `asap-demo-token`) para garantizar que la sesión inicie en estado no autenticado.
> 2. **Modo estricto con MongoDB**: Las operaciones de autenticación validarán contra MongoDB, devolviendo mensajes de error reales y códigos HTTP apropiados (401 Contraseña incorrecta, 404 Usuario no encontrado) si las credenciales fallan o la base de datos no está disponible.
> 3. **Usuario demo Andrés Morales**: Podrá autenticarse únicamente ingresando sus credenciales exactas (`andres.morales@uefdemocracia.edu.ec` / `asap2024`).

- **Decisión Confirmada 1**: Token inicial en `AuthContext` estrictamente `localStorage.getItem('asap_token') || null`.
- **Decisión Confirmada 2**: Usuario inicial en `AuthContext` `null`, cargado solo con sesión válida y verificado con `/api/auth/me`.
- **Decisión Confirmada 3**: Eliminación total de bloques `catch` que forzaban autenticación con datos mock en `login`, `loginWithGoogle` y `RegisterPage`.
- **Decisión Confirmada 4**: Hasheo con `bcryptjs` en `/api/auth/register` y comparación con `bcrypt.compare` en `/api/auth/login`.

---

## 1. Overview & Core Concept

- **Qué hace**: Restaura la seguridad y fidelidad del flujo de autenticación del sistema. Un usuario no autenticado solo tiene acceso a la Landing Page y al Login/Registro. El registro crea un usuario real en la colección `usuarios` de MongoDB con contraseña hasheada y cursos asignados. El login valida la contraseña contra el hash almacenado usando bcrypt.
- **Público objetivo**: Docentes ecuatorianos que ingresan con sus credenciales institucionales o crean su cuenta desde el formulario de registro de 4 pasos.
- **Valor clave**: Garantiza privacidad de datos pedagógicos y previene suplantación o accesos no autorizados accidentales con perfiles demo precargados.

---

## 2. User Experience & Visual Design

- **Flujo de Usuario no Autenticado**:
  1. El docente entra a la aplicación y observa la Landing Page institucional o la pantalla de Login.
  2. Si intenta navegar directamente a `/dashboard`, `/asistencia`, `/calificaciones` o `/planificacion`, la ruta protegida (`ProtectedRoute`) lo redirige automáticamente a `/login`.
  3. En la pantalla de Login:
     - Si ingresa credenciales erróneas, se muestra un mensaje de alerta visual en rojo: *"Contraseña incorrecta"* o *"Usuario no encontrado"*, sin loguear al usuario.
     - El botón de acceso rápido de Andrés Morales envía las credenciales exactas (`andres.morales@uefdemocracia.edu.ec` / `asap2024`) a la API. Si son válidas, ingresa al Dashboard.
  4. En el Registro:
     - Al completar los 4 pasos, se envía la petición a `/api/auth/register`.
     - Si la petición falla (e.g. correo duplicado o error de servidor), se detiene el flujo y se muestra el mensaje de error explícito en el banner del paso sin redirigir al Dashboard con datos mock.
     - Si es exitoso, inicia sesión con el nuevo usuario y redirige al Dashboard mostrando el nombre e institución del usuario recién creado.

- **Diseño Visual & Retroalimentación**:
  - Alertas de error en Login y Register con diseño limpio, borde suave y contraste accesible (`bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300`).
  - Estados de carga en botones (`isLoading`) deshabilitados mientras se espera la respuesta del servidor.

---

## 3. Key Product Decisions & Trade-Offs

- **Problema 1: Token inicial nulo**:
  - *Enfoque*: En `client/src/context/AuthContext.tsx`, inicializar `token` con `localStorage.getItem('asap_token') || null`. Si existe un token demo residual previo en el storage del navegador, se depura automáticamente.
- **Problema 2: Usuario inicial nulo**:
  - *Enfoque*: Cambiar el valor por defecto de `user` a `null`. Solo si existe un token válido se consulta `/api/auth/me`. En el backend, `/api/auth/me` dejará de devolver `DOCENTE_ACTUAL` como fallback y retornará `401 Unauthorized` si no hay token válido.
- **Problema 3: Eliminación de fallbacks de autenticación**:
  - *Enfoque*: En `AuthContext.tsx`, `login` y `loginWithGoogle` retornarán `false` en caso de error HTTP o fallo de red, sin asignar un usuario fallback. En `LoginPage.tsx` y `RegisterPage.tsx`, se verifica el resultado booleano y se muestra el error real al usuario.
- **Problema 4: Cifrado y validación con bcrypt**:
  - *Enfoque*: En `server/routes/api.ts`, usar `bcrypt.compare(password, dbUser.password)` en `/api/auth/login`. En `/api/auth/register`, ejecutar `bcrypt.hash(password, 10)` antes de guardar en `Usuario.create`.

---

## 4. Technical Architecture & Data Strategy

```
┌───────────────────────────────────────────────────────────────┐
│                      Arquitectura de Autenticación             │
└───────────────────────────────────────────────────────────────┘

  [ Cliente React / Browser ]
           │
           ├─ (Sin token / token inválido) ──> Redirige a /login o /register
           │
           ├─ POST /api/auth/login { email, password }
           │      │
           │      ▼
  [ Express API: /api/auth/login ]
           │
           ├─ Buscar en MongoDB: Usuario.findOne({ email })
           │      │
           │      ├─ No encontrado ──> 404 { error: 'Usuario no encontrado' }
           │      │
           │      └─ Encontrado ───> bcrypt.compare(password, dbUser.password)
           │                               │
           │                               ├─ Falso ──> 401 { error: 'Contraseña incorrecta' }
           │                               │
           │                               └─ Válido ─> Generar JWT firmado (7 días)
           │                                            Devolver { token, user }
           │
  [ Cliente React: AuthContext ]
           │
           ├─ Guarda 'asap_token' y 'asap_user' en localStorage
           ├─ Actualiza estado reactivo user y token
           └─ Redirige a /dashboard
```

### Componentes y Rutas a Modificar

1. **`client/src/context/AuthContext.tsx`**:
   - `useState<string | null>` para `token` inicializado en `localStorage.getItem('asap_token') || null`. Limpieza de tokens demo residuales.
   - `useState<UserProfile | null>` para `user` inicializado en `null` (o parseado de `asap_user` si y solo si `asap_token` existe y no es demo).
   - `login`: si la respuesta no es `res.ok`, no guardar nada y retornar `false`.
   - `loginWithGoogle`: sin fallback a mock; retorna `false` si falla.
   - En `useEffect` inicial: `/api/auth/me` con bearer token. Si falla o responde 401, limpiar sesión.

2. **`client/src/pages/LoginPage.tsx`**:
   - Capturar el resultado booleano de `await login(email, password)`.
   - Mostrar mensaje de error si devuelve `false`.

3. **`client/src/pages/RegisterPage.tsx`**:
   - Eliminar el bloque catch con auto-login simulado.
   - Si la API falla, reportar el error en `stepError` y no permitir el avance.

4. **`server/routes/api.ts`**:
   - Importar `bcrypt from 'bcryptjs'`.
   - En `POST /api/auth/login`:
     - Buscar usuario en MongoDB por correo (minúsculas).
     - Si no existe, responder 404.
     - Validar contraseña con `await bcrypt.compare(password, dbUser.password)` (con soporte retrocompatible para el seed inicial).
     - Si es inválida, responder 401 `{ success: false, error: 'Contraseña incorrecta' }`.
   - En `POST /api/auth/register`:
     - Hashear la contraseña: `const hashedPassword = await bcrypt.hash(password, 10);`.
     - Guardar `hashedPassword` en el documento de `Usuario`.
   - En `GET /api/auth/me`:
     - Eliminar el fallback que devolvía `DOCENTE_ACTUAL` a usuarios sin token.

---

## Plan de Verificación

1. **Prueba de usuario no autenticado**:
   - Cargar la app sin credenciales en localStorage. Verificar que el navbar y la ruta raíz `/` muestren la Landing Page.
   - Intentar entrar a `/dashboard`. Verificar redirección inmediata a `/login`.
2. **Prueba de login con credenciales erróneas**:
   - Ingresar correo de Andrés Morales con contraseña equivocada. Verificar respuesta 401 y mensaje de "Contraseña incorrecta".
3. **Prueba de login demo exacto**:
   - Ingresar con `andres.morales@uefdemocracia.edu.ec` y `asap2024`. Verificar inicio de sesión exitoso y acceso al dashboard.
4. **Prueba de registro y hash**:
   - Registrar un nuevo docente con credenciales nuevas. Verificar que se cree con contraseña hasheada, que ingrese al dashboard con sus datos propios y no los de Andrés Morales.
