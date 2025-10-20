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

**CRITICAL - App won't start without this:**
- `VITE_API_URL` - Your backend API URL (e.g., https://your-backend.onrender.com)
  - Alternative: `VITE_API_ENDPOINT` (if VITE_API_URL not set)

**Recommended:**
- `VITE_APP_NAME` - App name (default: CryptoPulse)
- `VITE_ENABLE_ANALYTICS` - Enable analytics (true/false, default: false)
- `VITE_ENABLE_ERROR_TRACKING` - Enable error tracking (true/false, default: true)

### Caching & Headers
- Long-term caching headers are defined for JS/CSS/fonts; images have 7-day cache.

### Local Test
```bash
cd Cryptopulse--main/frontend
pnpm install
pnpm run build:production
pnpm run preview -- --port 4173
```


