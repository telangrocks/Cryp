# Contributing to CryptoPulse (Render-based)

## How to Work on This Project
- Use Node.js 20+ and pnpm.
- Install dependencies from repo root: pnpm install
- Run locally:
  - Backend: pnpm --filter backend dev (http://localhost:1337)
  - Frontend: pnpm --filter frontend dev (http://localhost:5173)
  - Cloud (optional): pnpm --filter cloud dev

## Render Deployment Workflow
- Backend (Web Service)
  - Root: Cryptopulse--main/backend
  - Build: pnpm install && pnpm run build:production
  - Start: pnpm run start:production
- Frontend (Static Site)
  - Root: Cryptopulse--main/frontend
  - Build: pnpm install && pnpm run build:production
  - Publish: dist
- Cloud (Web Service)
  - Root: Cryptopulse--main/cloud
  - Build: pnpm install
  - Start: pnpm start

Configure environment variables in Render per README.md and frontend/ENV.md.

## Node.js Dev Standards
- Lint: pnpm lint:all (root) or per package
- Typecheck: pnpm typecheck:all
- Tests: pnpm test:all
- Format: pnpm format:all

## Commit Standards
- Conventional Commits: feat:, fix:, chore:, docs:, refactor:, etc.
- Keep commits scoped and descriptive.

## Automated Log Correction Rules
- Frontend captures runtime/console errors and posts to backend: POST /api/dev-log
- Backend stores logs under .dev-logs/YYYY-MM-DD.json (git-ignored)
- A scheduled workflow parses recent logs, runs lint:fix and predefined routines, then auto-commits with message like: Auto-fix from dev logs <timestamp>
- Manual intervention: pause the workflow in GitHub Actions if needed, fix locally, push changes. Logs remain under .dev-logs/ on the backend host.

## Security & Secrets
- Never commit .env* files or secrets
- Use Render Environment settings for secrets
