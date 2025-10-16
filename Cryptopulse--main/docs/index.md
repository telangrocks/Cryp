# CryptoPulse Documentation (Render)

## Service Structure
- Backend (Web Service): `Cryptopulse--main/backend`
- Frontend (Static Site): `Cryptopulse--main/frontend`
- Cloud (Web Service, optional): `Cryptopulse--main/cloud`

## Environment Variables & Deployment Flow
- Configure all secrets and env vars in Render.
- Backend build/start:
  - Build: `pnpm install && pnpm run build:production`
  - Start: `pnpm run start:production`
- Frontend build/publish:
  - Build: `pnpm install && pnpm run build:production`
  - Publish directory: `dist`

See `README.md` and `frontend/ENV.md` for variable references.

## Render Error Monitoring & Auto-Fix Workflow
1. Frontend error listener captures runtime/console errors and POSTs to backend `/api/dev-log`.
2. Backend appends logs to `.dev-logs/YYYY-MM-DD.json` with metadata (timestamp, url, userAgent).
3. A scheduled workflow (GitHub Actions) periodically:
   - Parses recent logs
   - Runs lint/format/fix routines (e.g., `pnpm -r lint:fix`, `pnpm -r format:all` if configured)
   - Optionally applies known fixes
   - Auto-commits with message: `Auto-fix from dev logs <timestamp>`
4. Results are visible in Git history; maintainers can intervene by pausing the workflow and pushing manual fixes.

## Observability
- Backend health: `/health`, `/health/quick`, `/health/detailed`
- Logs: Render dashboard; dev error logs in `.dev-logs/` on the backend host

## Notes
- Docker artifacts removed; project runs on Render Node.js runtimes.
- Kubernetes manifests in `k8s/` are kept for reference only.
