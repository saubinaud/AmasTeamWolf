# Plan: Migrar de Logto OAuth a Auth Propio (DNI + Contraseña)

## Contexto

Logto (auth.nodumstudio.com) es inestable — se cae, requiere migraciones manuales de BD, y es excesivo para el caso de uso. Las familias de AMAS se identifican por **DNI del apoderado**, no necesitan OAuth ni SSO. Este plan reemplaza Logto con un sistema propio: login por DNI + contraseña, JWT simple, sin dependencias externas.

---

## Fase 1: Backend — Nuevos endpoints de auth (sin tocar frontend)

**Impacto:** Zero. Solo agrega endpoints nuevos. Todo lo existente sigue funcionando.

### 1.1 Migración de BD
- Agregar columna `password_hash VARCHAR(100)` a tabla `alumnos`
- Crear tabla `verification_codes` (id, alumno_id, code, expires_at, used)
- Crear índice en `dni_apoderado`

### 1.2 Crear `api/src/middleware/auth.js`
- Middleware JWT: lee `Authorization: Bearer <token>`, verifica con `JWT_SECRET`
- Attach `req.user = { alumno_id, dni_apoderado }` al request
- Patrón copiado de `api/src/middleware/spaceAuth.js` (ya existe como referencia)

### 1.3 Crear `api/src/routes/auth.js`
4 endpoints:

| Endpoint | Body | Función |
|----------|------|---------|
| `POST /api/auth/login` | `{ dni, password }` | Login → JWT + perfil |
| `POST /api/auth/solicitar-codigo` | `{ dni }` | Envía código 6 dígitos al correo registrado |
| `POST /api/auth/verificar-codigo` | `{ dni, code }` | Valida el código |
| `POST /api/auth/crear-password` | `{ dni, code, password }` | Guarda hash + auto-login |
| `GET /api/auth/me` | (JWT header) | Retorna perfil del usuario autenticado |

**Flujo primer acceso:**
1. Apoderado ingresa su DNI → `solicitar-codigo` → recibe código por email
2. Ingresa código → `verificar-codigo` → confirmado
3. Crea su contraseña → `crear-password` → logueado automáticamente

**Flujo login normal:**
1. DNI + contraseña → `login` → JWT + perfil

**Reglas:**
- JWT con expiración de 12 horas (igual que sesión actual)
- bcrypt 10 rounds para hash de contraseña
- Código de verificación expira en 15 minutos
- Rate limiting: 5 intentos por DNI cada 15 min
- Si `password_hash IS NULL` → responde `{ needsPassword: true }`

### 1.4 Modificar `api/src/index.js`
- Agregar `const authRoutes = require('./routes/auth')`
- Agregar `app.use('/api/auth', authRoutes)`

### 1.5 Dependencias backend
- `bcryptjs` (ya está instalado por space-auth)
- `jsonwebtoken` (ya está instalado por space-auth)
- Nueva env var: `JWT_SECRET` en el container

### Deploy Fase 1
- SQL migration en BD
- Docker rebuild + restart con nueva env var `JWT_SECRET`
- Test endpoints con curl

---

## Fase 2: Frontend — Reemplazar Logto con auth propio

**Impacto:** Cambio total del flujo de login. Es el "switch".

### 2.1 Modificar `src/main.tsx`
- Eliminar `LogtoProvider` wrapper
- Eliminar imports de `@logto/react`
- Resultado: `<AuthProvider><App /></AuthProvider>` directo

### 2.2 Reescribir `src/contexts/AuthContext.tsx`
- Eliminar todo uso de `useLogto`
- JWT en localStorage (`amasToken`)
- Nuevas funciones: `login()`, `requestCode()`, `verifyCode()`, `setPassword()`, `logout()`
- `isAuthenticated = !!token && user !== null`
- En mount: verificar token con `GET /api/auth/me`

### 2.3 Reescribir `src/components/InicioSesionPage.tsx`
Formulario inline con estados:

**Estado `login`:** DNI + Contraseña → botón "Entrar"
- Si respuesta `needsPassword: true` → cambiar a estado `request-code`

**Estado `request-code`:** Muestra "Primera vez? Te enviamos un código" + DNI
- Llama `solicitar-codigo` → muestra hint del email enmascarado

**Estado `verify-code`:** Input de 6 dígitos
- Llama `verificar-codigo`

**Estado `set-password`:** Contraseña + Confirmar → "Crear Contraseña"
- Llama `crear-password` → auto-login → redirect a perfil

**Diseño:** Mantener estilo actual (zinc-950, gradientes naranja, wolf emoji). Formulario inline, sin redirecciones.

### 2.4 Modificar `src/components/AuthGuard.tsx`
- Eliminar `useLogto` import
- Usar solo `useAuth()` del nuevo contexto

### 2.5 Modificar `src/components/HeaderMain.tsx`
- Eliminar `useLogto` import y `signIn`
- Botón "Acceso" → `onNavigate('inicio-sesion')` (en vez de `signIn(callbackUrl)`)
- Aplica a desktop (línea ~196) y mobile (línea ~337)

### 2.6 Simplificar `src/App.tsx`
- Eliminar import de `LogtoCallback`
- Ruta `/callback` → redirect a home (backwards compat)
- Eliminar `VincularCuentaPage` del routing (ya no necesaria)

### 2.7 Eliminar/simplificar componentes obsoletos
- `src/components/LogtoCallback.tsx` → redirect simple a home
- `src/components/VincularCuentaPage.tsx` → redirect a perfil
- `src/components/AccountLinkingStep.tsx` → ya no necesario
- `src/components/CallbackPage.tsx` → eliminar

### 2.8 Limpiar dependencias
- Eliminar `@logto/react` y `@logto/next` de `package.json`

### Deploy Fase 2
- Push a main → GitHub Actions → GitHub Pages
- Test completo en amasteamwolf.com

---

## Fase 3: Envío de códigos por email + Limpieza

### 3.1 Email de códigos de verificación
- Usar Notifuse (ya configurado) con un template nuevo para código de verificación
- Template: "Tu código de acceso AMAS Team Wolf: {codigo}"
- Fallback: si Notifuse falla, loguear código en consola para enviar manual por WhatsApp

### 3.2 Limpieza de BD
- Limpiar `verification_codes` expirados (cron o al crear nuevos)
- Columna `auth_id` se queda (sin romper nada) — se puede eliminar más adelante

### 3.3 Limpieza de servidor
- El container de Logto (`auth02`) se puede apagar para liberar RAM
- `docker compose down` en `/etc/easypanel/projects/programas-extras/auth02/code/`

---

## Archivos a modificar/crear

| Archivo | Acción | Fase |
|---------|--------|------|
| `api/src/routes/auth.js` | **CREAR** | 1 |
| `api/src/middleware/auth.js` | **CREAR** | 1 |
| `api/src/index.js` | Agregar 2 líneas | 1 |
| BD: tabla `alumnos` | ALTER ADD password_hash | 1 |
| BD: tabla `verification_codes` | CREATE TABLE | 1 |
| `src/main.tsx` | Eliminar LogtoProvider | 2 |
| `src/contexts/AuthContext.tsx` | **REESCRIBIR** | 2 |
| `src/components/InicioSesionPage.tsx` | **REESCRIBIR** | 2 |
| `src/components/AuthGuard.tsx` | Eliminar useLogto | 2 |
| `src/components/HeaderMain.tsx` | Eliminar signIn, usar onNavigate | 2 |
| `src/App.tsx` | Eliminar callback/vincular routes | 2 |
| `src/components/LogtoCallback.tsx` | Simplificar a redirect | 2 |
| `package.json` | Eliminar @logto/* | 2 |

## Verificación

1. **Fase 1:** `curl -X POST https://amas-api.../api/auth/login -d '{"dni":"12345678","password":"test"}' ` → debe responder `needsPassword: true`
2. **Fase 2:** Abrir amasteamwolf.com → click "Acceso" → ver formulario DNI + contraseña inline → flujo de crear contraseña → login exitoso → ver perfil
3. **Rollback:** Si Fase 2 falla, revertir commit de frontend en GitHub. Backend Phase 1 es aditivo y no necesita rollback.
