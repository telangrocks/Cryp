## Vercel Deployment - Frontend (Vite + React)

### Project Settings
- Framework Preset: Vite
- Root Directory: `Cryptopulse--main/frontend`
- Build Command: `pnpm install && pnpm run build:production`
- Output Directory: `dist`
- Install Command: `pnpm install --frozen-lockfile`

### SPA Routing
- `vercel.json` includes a catch-all route to `index.html` to support React Router.

### Required Environment Variables
Set in Vercel Project Settings > Environment Variables (Production/Preview):
- `VITE_API_BASE_URL` (e.g., your backend base URL)
- `VITE_APP_NAME` (e.g., CryptoPulse)
- `VITE_APP_VERSION` (e.g., 2.0.0)
- Optional feature flags:
  - `VITE_ENABLE_ANALYTICS` (true/false)
  - `VITE_ENABLE_SERVICE_WORKER` (true/false)
  - `VITE_DEBUG_MODE` (true/false)

### Caching & Headers
- Long-term caching headers are defined for JS/CSS/fonts; images have 7-day cache.

### Local Test
```bash
cd Cryptopulse--main/frontend
pnpm install
pnpm run build:production
pnpm run preview -- --port 4173
```


