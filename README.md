# Civic Current

A 3D civic-themed city-building game that runs in the browser. Shape a city
tile by tile, balance its systems against unfolding events, and grow it across
distinct themed eras.

Built with React 19, Three.js, and TypeScript on Vite, with optional accounts
(Clerk), cloud saves and entitlements (Vercel KV), and one-time purchases
(Stripe). The app **degrades gracefully** — with no keys configured it runs in
anonymous, local-save-only mode.

## Tech stack

| Area      | Tech                                              |
| --------- | ------------------------------------------------- |
| UI        | React 19, Tailwind CSS v4, `lucide-react` icons   |
| 3D        | Three.js (custom scene, meshes, particle systems) |
| State     | Zustand                                           |
| Build     | Vite 8, TypeScript                                |
| Auth      | Clerk (anonymous play supported)                  |
| Backend   | Vercel serverless functions (`api/`)              |
| Storage   | Vercel KV (entitlements + cloud saves)            |
| Payments  | Stripe Checkout (premium unlock + content packs)  |
| Tests     | Vitest                                            |

## Project layout

```
api/                Vercel serverless functions (checkout, webhook, cloud-save, entitlements)
src/
  engine/           Simulation + map generation (the game's core loop)
  three/            Three.js scene, building models, tile mesh, particles
  content/          Content registry + packs (base, post-carbon, throwback-era, tomorrows-city)
  config/           Buildings, events, terrain config
  store/            Zustand game store
  components/        UI panels, HUD, shop, account menu
  auth/             Clerk provider + authenticated API client
  billing/          Stripe checkout flows
  cloud-save/       Cloud save service
```

## Getting started

```bash
npm install
npm run dev          # Vite dev server (frontend only)
```

The frontend runs without any environment variables (anonymous, local-save
mode). To exercise the API routes (`api/`) locally, run them with the Vercel
CLI, which serves the serverless functions:

```bash
vercel dev
```

### Environment variables

Copy the template and fill in what you need — every integration is optional:

```bash
cp .env.example .env.local
```

- **No Clerk key** → anonymous mode, local-save only, no purchases
- **No Stripe key** → `/api/checkout` returns 500; the upgrade modal surfaces the error
- **No KV creds** → entitlements don't persist; cloud save falls back to local

See [`.env.example`](.env.example) for the full list and where each value comes from.

## Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the Vite dev server            |
| `npm run build`   | Type-check (`tsc -b`) and build       |
| `npm run preview` | Preview the production build locally |
| `npm run lint`    | Run ESLint                           |
| `npx vitest`      | Run the test suite                   |

## Deployment

See [README-DEPLOYMENT.md](README-DEPLOYMENT.md) for the full guide to
deploying on Vercel with Clerk, Stripe, and Vercel KV.
