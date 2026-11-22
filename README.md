# DevOps IDP & Centro de Control Privado (Linear / Vercel Dark Style)

Portal para desarrolladores (Internal Developer Portal) y Centro de Control DevOps privado, diseñado con una estética minimalista oscura inspirada en **Linear** y **Vercel**, optimizado para desplegar en **Vercel** utilizando **Supabase** como backend central.

---

## 🛠 Stack Tecnológico

- **Framework:** [Next.js 14+](https://nextjs.org/) (App Router) con TypeScript estricto.
- **Estilos e UI:** Tailwind CSS, Lucide React (Dark Mode por defecto con estética zinc/slate y glassmorphism).
- **Backend & Auth:** [Supabase](https://supabase.com/) (`@supabase/ssr`, PostgreSQL, Auth Email/Password).
- **Storage:** Bucket privado `apks` en Supabase Storage para versiones de aplicaciones móviles.
- **Criptografía Zero-Knowledge:** Web Crypto API nativa (`crypto.subtle`) con derivación **PBKDF2** (250,000 iteraciones, SHA-256) y cifrado **AES-256-GCM**.
- **Utilidades:** `qrcode.react` para generación de códigos QR vectoriales instantáneos.
- **Automatización:** Vercel Cron Jobs con validación `Bearer CRON_SECRET`.

---

## 🚀 Módulos y Funcionalidades

### 1. Command Palette Global (`Ctrl + K` / `Cmd + K`)
- Búsqueda difusa en tiempo real de proyectos, entornos y repositorios.
- **Atajos directos de Supabase:** Salto instantáneo al Table Editor, SQL Editor o Usuarios de Auth de cualquier proyecto registrado.
- Navegación instantánea por teclado entre módulos.

### 2. Gestión de Proyectos Web y Mobile
- **CRUD Completo:** Clasificación por tipo (`web`, `mobile`, `fullstack`), estado (`development`, `production`, `maintenance`, `archived`), tech stack y notas de arquitectura.
- **Multi-Repositorios (1:N):** Vinculación de múltiples repositorios por proyecto con etiquetas (Frontend, Backend, Mobile, Infra) y rama principal.
- **Entornos Web:** Monitor de estado HTTP en vivo para URLs de Producción y Staging (cálculo de tiempo de respuesta en milisegundos y código de estado HTTP).
- **Releases Mobile (APKs):**
  - Registro de versiones (`version_name`, `build_number`, entorno `debug`/`release`, changelog).
  - Subida directa al bucket privado `apks` de Supabase Storage (generación de URLs firmadas temporales) o URLs de release externas (GitHub Releases).
  - **Modal QR Instantáneo:** Código QR descargable en pantalla para escanear directamente con la cámara del celular e instalar el APK.

### 3. Monitor y Motor Anti-Pausa de Supabase (Multi-Cuenta)
- Registro de proyectos Supabase de diferentes cuentas y clientes (`project_ref`, `supabase_url`, `anon_key`, `account_email`, `keep_alive_table`).
- **Deep Links Directos:**
  - `https://supabase.com/dashboard/project/{ref}/editor`
  - `https://supabase.com/dashboard/project/{ref}/sql`
  - `https://supabase.com/dashboard/project/{ref}/auth/users`
- **Ping All Now:** Ejecución concurrente (`Promise.allSettled`) contra PostgREST (`GET /rest/v1/{table}?select=*&limit=1`) registrando actividad I/O real en la base de datos para impedir la pausa por inactividad a los 7 días.
- **Cron Job Automatizado:** Endpoint `/api/cron/keep-alive` configurado en `vercel.json` (`0 12 */3 * *`), ejecutado cada 3 días en el plan Hobby de Vercel.

### 4. Bóveda de Credenciales de Clientes (Zero-Knowledge)
- **Seguridad Absoluta:** La contraseña maestra se mantiene **únicamente en memoria** (`React State`). Nunca se envía por red ni se almacena en base de datos o localStorage.
- Cifrado en cliente con `cryptoVault.ts` (PBKDF2 + AES-256-GCM con salt e IV únicos por registro).
- Almacenamiento de credenciales de servicios (Gmail, AWS, Vercel, Hosting), correos de recuperación y notas de respaldo 2FA cifradas.
- Botón de copiado seguro al portapapeles y acción de bloqueo inmediato para purgar la memoria.

---

## 📋 Guía de Puesta en Marcha

### 1. Configuración de Base de Datos en Supabase
1. Ingresa a tu proyecto central en [Supabase Dashboard](https://supabase.com/dashboard).
2. Ve al **SQL Editor** y ejecuta el archivo [`supabase/schema.sql`](file:///home/mesoft/GitHub/Personal_Portafolio/supabase/schema.sql).
3. Esto configurará:
   - Todas las tablas con claves primarias UUID y triggers automáticos de `updated_at`.
   - **Row Level Security (RLS)** estricto en todas las tablas (`auth.uid() = user_id`).
   - Bucket privado `apks` en Supabase Storage con políticas de acceso para usuarios autenticados.

### 2. Crear el Usuario Administrador
En Supabase Dashboard -> **Authentication** -> **Users** -> **Add User** (Create user):
- Asigna el correo y contraseña que usarás para acceder al IDP.

### 3. Variables de Entorno
Copia `.env.example` a `.env.local`:
```bash
cp .env.example .env.local
```

Completa los valores:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
CRON_SECRET=clave_secreta_para_proteger_el_cron_job_minimo_32_caracteres
ADMIN_EMAIL=admin@tuempresa.com
```

### 4. Ejecución en Desarrollo
```bash
npm install
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en el navegador.

### 5. Despliegue en Vercel
1. Empuja tu código a GitHub o GitLab.
2. Importa el repositorio en [Vercel](https://vercel.com).
3. Añade las variables de entorno en **Settings -> Environment Variables** (incluyendo `CRON_SECRET` y `SUPABASE_SERVICE_ROLE_KEY`).
4. Haz deploy. Vercel detectará automáticamente `vercel.json` y programará el Cron Job de keep-alive.
