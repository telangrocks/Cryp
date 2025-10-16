# CryptoPulse Trading Bot (Render Deployment)

## Overview
CryptoPulse is a monorepo with three services:
- Backend (Node.js + Express) at `Cryptopulse--main/backend`
- Frontend (React + Vite + TypeScript) at `Cryptopulse--main/frontend`
- Cloud (Node.js microservices) at `Cryptopulse--main/cloud`

This repository is configured for deployment on Render using Node.js runtimes (no Docker). All Docker-specific files and compose configs have been removed.

## Repository Structure
```
Cryptopulse--main/
  backend/            # Node.js API server
  frontend/           # React + Vite app
  cloud/              # Node.js microservices
  monitoring/         # Prometheus/Grafana config (optional)
  k8s/                # Kubernetes manifests (optional, not used by Render)
  scripts/            # Ops and deployment helper scripts
  render.yaml         # Render configuration (optional)
```

## Node & Package Manager
- Node: >= 20
- Package manager: pnpm (repo-managed via `packageManager` in root `package.json`)

## Local Development
From repository root (`Cryptopulse--main`):

```bash
# Install dependencies (monorepo)
pnpm install

# Start backend (http://localhost:1337)
pnpm --filter backend dev

# Start frontend (http://localhost:5173)
pnpm --filter frontend dev

# Start cloud service (optional)
pnpm --filter cloud dev
```

Common scripts:
```bash
# Lint & Typecheck (all)
pnpm lint:all && pnpm typecheck:all

# Tests
pnpm test:all

# Build (all)
pnpm build:all
```

## Render Deployment
Provision three services in Render, each pointing to this repo. Suggested settings:

### 1) Backend (Web Service)
- Root Directory: `Cryptopulse--main/backend`
- Runtime: Node 20
- Build Command: `pnpm install && pnpm run build:production`
- Start Command: `pnpm run start:production`
- Port: `1337`

Environment variables (example):
```bash
NODE_ENV=production
PORT=1337
DATABASE_URL=<render-postgres-url>
REDIS_URL=<render-redis-url>
MONGODB_URL=<mongodb-atlas-url>
JWT_SECRET=<your-jwt-secret>
ENCRYPTION_KEY=<your-encryption-key>
CSRF_SECRET=<your-csrf-secret>
SESSION_SECRET=<your-session-secret>
LOG_LEVEL=info
ENABLE_MONITORING=true
ENABLE_TRACING=true
CLUSTER_MODE=true
```

Health check: `/health`

### 2) Frontend (Static Site)
- Root Directory: `Cryptopulse--main/frontend`
- Build Command: `pnpm install && pnpm run build:production`
- Publish Directory: `dist`
- Node Version: 20

Environment variables (example):
```bash
NODE_ENV=production
VITE_API_BASE_URL=https://<your-backend>.onrender.com
VITE_APP_NAME=CryptoPulse
VITE_APP_VERSION=2.0.0
VITE_ENCRYPTION_KEY=<32+ char random string>
VITE_BUILD_TARGET=production
VITE_ENABLE_SOURCEMAPS=false
VITE_DEBUG_MODE=false
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_WEBSOCKET=true
VITE_API_TIMEOUT=30000
VITE_API_MAX_RETRIES=3
VITE_DEFAULT_TRADING_PAIR=BTC/USDT
VITE_DEFAULT_EXCHANGE=binance
VITE_DEFAULT_THEME=system
VITE_DEFAULT_CURRENCY=USD
VITE_CHART_REFRESH_INTERVAL=5
VITE_ENABLE_SERVICE_WORKER=true
VITE_ENABLE_LAZY_LOADING=true
```

### 3) Cloud (Web Service, optional)
- Root Directory: `Cryptopulse--main/cloud`
- Runtime: Node 20
- Build Command: `pnpm install`
- Start Command: `pnpm start`
- Port: `3001`

Environment variables (example):
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=<render-postgres-url>
REDIS_URL=<render-redis-url>
LOG_LEVEL=info
ENABLE_MONITORING=true
```

## Environment Guides
- Frontend variables reference: `Cryptopulse--main/frontend/ENV.md`
- Render deployment guide (detailed): `Cryptopulse--main/scripts/render-deployment-guide.md`

## Monitoring (Optional)
The `monitoring/` directory contains configuration you can adapt for external Prometheus/Grafana setups. Render provides built-in logs and metrics.

## Notes
- Docker-related files and instructions have been removed.
- Kubernetes manifests in `k8s/` are kept for reference only (not used on Render).

## License
MIT
