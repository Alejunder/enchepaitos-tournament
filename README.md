# Enchepaitos Tournament

Plataforma web para gestionar el torneo privado **Enchepaitos Tournament** (Football League 2026 / FL26).

- **Acceso:** lectura pública / escritura restringida por aprobación del admin.
- **Stack:** Next.js 15 (App Router, Server Actions, Server Components) · React 19 · TypeScript · Tailwind CSS v4 · Supabase (Postgres + Auth + Storage).

## Funcionalidades

- Autenticación con registro y aprobación por el admin.
- Torneos con portada, fecha/hora límite de inscripción y cuota.
- Fase de grupos (algoritmo de Berger) presentada jornada a jornada.
- Fase eliminatoria estilo Champions: play-in a partido único, octavos/cuartos/semis a ida y vuelta, final a partido único, con penaltis en caso de empate global.
- Premios dinámicos (Campeón, Bota de Oro, Saco de Goles, Puskas) y Cervezómetro.
- Billetera (€), cara a cara (H2H) y tarjeta compartible por WhatsApp.

## Variables de entorno

Copia `.env.example` a `.env.local` y rellena:

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | URL del proyecto (Project Settings → API → Project URL) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Clave pública (anon / publishable key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | Clave de servicio (solo servidor, nunca en el cliente) |
| `THESPORTSDB_KEY` | No | Clave de TheSportsDB para escudos (por defecto usa la pública `3`) |

## Base de datos

Las migraciones están en `supabase/migrations/` (aplicadas en orden). En producción usa el SQL Editor del panel de Supabase o la CLI para aplicarlas.

## Despliegue en Vercel

1. Sube el repositorio a GitHub y conéctalo en [vercel.com](https://vercel.com) (importa el repo, framework **Next.js**, sin configurar comandos: Vercel los detecta solo).
2. En **Settings → Environment Variables** añade las tres variables de arriba (marcadas como Production, Preview y Development según necesites).
3. Haz **Deploy**.

### Configuración de Supabase Auth para producción

Tras desplegar, en el panel de Supabase → **Authentication → URL Configuration**:

- **Site URL:** `https://<tu-proyecto>.vercel.app`
- **Redirect URLs:** añade `https://<tu-proyecto>.vercel.app/**`

Si no lo configuras, el registro/login fallará en producción.

## Desarrollo

```bash
npm install
cp .env.example .env.local   # rellena los valores
npm run dev
```

Scripts: `npm run dev` · `npm run build` · `npm run start` · `npm run lint` · `npm run typecheck`.

> Importante: no ejecutes `npm run build` mientras `npm run dev` esté corriendo (pisa la carpeta `.next` y corrompe el servidor de desarrollo).
