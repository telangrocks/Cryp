# 🚀 CryptoPulse - Comprehensive Deployment Guide

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Setup](#environment-setup)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring & Health Checks](#monitoring--health-checks)

---

## Prerequisites

### Required Software

- **Node.js**: >= 18.0.0 (20.x recommended)
- **pnpm**: >= 8.0.0 (Install with: `npm install -g pnpm`)
- **Git**: Latest version

### System Requirements

- **RAM**: Minimum 2GB, Recommended 4GB
- **Disk Space**: Minimum 1GB free
- **OS**: Windows, macOS, or Linux

### Verify Installation

```bash
# Check Node.js version
node --version  # Should be >= v18.0.0

# Check pnpm version
pnpm --version  # Should be >= 8.0.0

# Check Git version
git --version
```

---

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/telangrocks/CryptoPulse-Trading-Bot.git
cd CryptoPulse-Trading-Bot
```

### 2. Clean Installation

**Important**: Always start with a clean installation to avoid symlink conflicts:

```bash
# Run cleanup script (Linux/macOS)
bash scripts/cleanup-deployment.sh

# OR PowerShell (Windows)
.\scripts\cleanup-deployment.ps1
```

### 3. Install Dependencies

```bash
cd Cryptopulse--main

# Install root dependencies
pnpm install

# Install frontend dependencies
cd frontend
pnpm install

# Return to root
cd ../..
```

### 4. Configure Environment

```bash
# Copy environment template
cp Cryptopulse--main/frontend/env.production.example Cryptopulse--main/frontend/.env.production

# Edit with your values
nano Cryptopulse--main/frontend/.env.production
```

**Critical Variables to Set:**
- `VITE_API_BASE_URL` - Your backend API URL
- `VITE_ENCRYPTION_KEY` - Generate with: `openssl rand -hex 32`

### 5. Build for Production

```bash
cd Cryptopulse--main/frontend
pnpm run build
```

---

## Environment Setup

### Environment Files

The project uses environment-specific configuration files:

- `env.example` - Template for development
- `env.production.example` - Template for production
- `.env.production` - Actual production values (DO NOT COMMIT)

### Required Environment Variables

```bash
# Application
NODE_ENV=production
PORT=10000
VITE_APP_NAME=CryptoPulse
VITE_APP_VERSION=2.0.0

# API Configuration
VITE_API_BASE_URL=https://your-api-url.com
VITE_API_TIMEOUT=30000
VITE_API_RETRY_ATTEMPTS=3

# Security (CRITICAL)
VITE_ENCRYPTION_KEY=<generate-with-openssl-rand-hex-32>

# Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_WEBSOCKET=true
VITE_ENABLE_SERVICE_WORKER=true

# Performance
VITE_ENABLE_COMPRESSION=true
VITE_CHUNK_SIZE_WARNING_LIMIT=1000
```

### Generating Secure Keys

```bash
# Generate encryption key
openssl rand -hex 32

# On Windows (without OpenSSL)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Local Development

### Development Server

```bash
cd Cryptopulse--main/frontend
pnpm run dev
```

Server will start at `http://localhost:5173`

### Development Commands

```bash
# Start dev server
pnpm run dev

# Run type checking
pnpm run typecheck

# Run linter
pnpm run lint

# Fix linting issues
pnpm run lint:fix

# Preview production build
pnpm run preview

# Run all validations
pnpm run validate
```

---

## Production Deployment

### Platform-Specific Deployment

#### Option 1: Render.com (Recommended)

1. **Connect Repository**
   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Build**
   - **Root Directory**: `Cryptopulse--main/frontend`
   - **Build Command**: 
     ```bash
     npm install -g pnpm@latest && rm -rf node_modules .pnpm-store && pnpm install --frozen-lockfile --prefer-offline && pnpm build
     ```
   - **Start Command**: `node server.cjs`
   - **Node Version**: 20

3. **Set Environment Variables**
   - Copy all variables from `env.production.example`
   - Set `VITE_ENCRYPTION_KEY` to a secure random value
   - Set `VITE_API_BASE_URL` to your backend URL

4. **Deploy**
   - Click "Create Web Service"
   - Wait for build to complete
   - Access your deployed app

#### Option 2: Vercel

```bash
cd Cryptopulse--main/frontend

# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel --prod
```

Configuration is in `vercel.json`

#### Option 3: Netlify

```bash
cd Cryptopulse--main/frontend

# Build
pnpm run build

# Deploy dist folder via Netlify UI or CLI
npx netlify-cli deploy --prod --dir=dist
```

### Manual Deployment (VPS/Server)

#### Using Deployment Scripts

**Linux/macOS:**
```bash
# Run complete deployment validation
bash deploy-production.sh
```

**Windows:**
```powershell
# Run complete deployment validation
.\deploy-production.ps1
```

These scripts will:
- ✅ Validate environment
- ✅ Check dependencies
- ✅ Create backup
- ✅ Install dependencies with pnpm
- ✅ Run security audit
- ✅ Run type checking
- ✅ Build production bundle
- ✅ Analyze bundle size
- ✅ Test preview server
- ✅ Generate deployment report

#### Manual Steps

```bash
# 1. SSH into your server
ssh user@your-server.com

# 2. Clone or pull latest code
git clone <repo> || git pull

# 3. Clean previous installation
rm -rf node_modules .pnpm-store dist

# 4. Install dependencies
pnpm install --frozen-lockfile

# 5. Build
pnpm run build

# 6. Start with PM2
pm2 start server.cjs --name cryptopulse-frontend
pm2 save
```

---

## Troubleshooting

### Issue: Tar Extraction Errors

**Error:**
```
tar: ./node_modules/.pnpm/...: Cannot open: File exists
```

**Solution:**
```bash
# 1. Clean everything
rm -rf node_modules .pnpm-store

# 2. Clean pnpm cache
pnpm store prune

# 3. Reinstall
pnpm install --frozen-lockfile
```

**Root Cause:** Someone archived node_modules. Never do this! Dependencies should always be installed fresh.

### Issue: Build Fails with Memory Error

**Error:**
```
FATAL ERROR: Reached heap limit
```

**Solution:**
```bash
# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm run build
```

### Issue: pnpm Not Found

**Solution:**
```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version
```

### Issue: Port Already in Use

**Solution:**
```bash
# Find process using port
lsof -i :10000  # Linux/macOS
netstat -ano | findstr :10000  # Windows

# Kill process
kill -9 <PID>  # Linux/macOS
taskkill /PID <PID> /F  # Windows
```

### Issue: Module Not Found Errors

**Solution:**
```bash
# Clear all caches
pnpm store prune
rm -rf node_modules .pnpm-store dist .cache

# Reinstall with clean slate
pnpm install --frozen-lockfile
```

### Common Build Warnings

#### Large Bundle Size

If you see warnings about large chunks:

```bash
# Analyze bundle
pnpm run build:analyze

# Open dist/stats.html to see what's large
# Consider code splitting or lazy loading
```

---

## Rollback Procedures

### Quick Rollback

If deployment fails, rollback to the last successful build:

```bash
# Restore last successful backup
cp -r .deployment-backups/last-successful dist

# Restart server
pm2 restart cryptopulse-frontend
```

### Git Rollback

```bash
# View recent commits
git log --oneline -10

# Rollback to specific commit
git checkout <commit-hash>

# Rebuild
pnpm install --frozen-lockfile
pnpm run build
```

### Database Rollback

If you need to rollback database changes:

```bash
# Restore database backup
# (Depends on your database system)
```

---

## Monitoring & Health Checks

### Health Check Endpoints

The production server exposes several health check endpoints:

#### `/health` - Basic Health Check
```bash
curl https://your-app.com/health

Response:
{
  "status": "ok",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "uptime": "3600s",
  "service": "cryptopulse-frontend",
  "version": "2.0.0",
  "environment": "production"
}
```

#### `/ready` - Readiness Check
```bash
curl https://your-app.com/ready

Response:
{
  "status": "ready",
  "message": "Service is ready to accept traffic"
}
```

#### `/alive` - Liveness Check
```bash
curl https://your-app.com/alive

Response:
{
  "status": "alive",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

#### `/status` - Detailed Status
```bash
curl https://your-app.com/status

Response:
{
  "status": "operational",
  "service": "cryptopulse-frontend",
  "version": "2.0.0",
  "environment": "production",
  "uptime": {
    "seconds": 3600,
    "formatted": "1h 0m 0s"
  },
  "memory": { ... },
  "nodeVersion": "v20.0.0"
}
```

### Setting Up Monitoring

#### Using Render.com
Health checks are automatically configured via `render.yaml`

#### Using Kubernetes
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: cryptopulse-frontend
spec:
  containers:
  - name: app
    image: cryptopulse-frontend
    livenessProbe:
      httpGet:
        path: /alive
        port: 10000
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /ready
        port: 10000
      initialDelaySeconds: 5
      periodSeconds: 5
```

#### Using Uptime Monitoring
- **Uptime Robot**: Monitor `/health` endpoint
- **Pingdom**: Monitor `/health` endpoint  
- **Better Uptime**: Monitor `/health` endpoint

Configure alerts for:
- HTTP 500 errors
- Response time > 2 seconds
- Downtime > 1 minute

---

## Performance Optimization

### Bundle Size Optimization

```bash
# Analyze bundle
pnpm run build:analyze

# Tips to reduce size:
# 1. Use code splitting
# 2. Lazy load routes
# 3. Remove unused dependencies
# 4. Use tree-shaking
# 5. Compress images
```

### Caching Strategy

The production server implements aggressive caching:

- **JavaScript/CSS**: 1 year (immutable)
- **Images**: 7 days
- **HTML**: 5 minutes (must-revalidate)

### Compression

- Gzip compression enabled via `compression` middleware
- Brotli compression recommended at CDN level

---

## Security Best Practices

### 1. Environment Variables
- ✅ Never commit `.env.production`
- ✅ Use strong encryption keys (32+ characters)
- ✅ Rotate keys regularly
- ✅ Use secrets management (AWS Secrets Manager, etc.)

### 2. Dependencies
- ✅ Run `pnpm audit` regularly
- ✅ Update dependencies monthly
- ✅ Use `--frozen-lockfile` in production

### 3. Server Configuration
- ✅ Security headers enabled (see `server.cjs`)
- ✅ HTTPS only in production
- ✅ Rate limiting recommended
- ✅ CORS configured properly

### 4. Monitoring
- ✅ Set up error tracking (Sentry)
- ✅ Monitor performance (DataDog, New Relic)
- ✅ Set up alerts
- ✅ Review logs daily

---

## Maintenance

### Regular Tasks

**Daily:**
- Check health endpoints
- Review error logs
- Monitor performance metrics

**Weekly:**
- Review security advisories
- Check for dependency updates
- Analyze user feedback

**Monthly:**
- Update dependencies
- Run security audit
- Review and rotate secrets
- Optimize performance
- Clean old backups

### Backup Schedule

Automated backups are created:
- Before each deployment
- Daily at 2 AM UTC
- Kept for 30 days

Manual backup:
```bash
# Create manual backup
cp -r dist .deployment-backups/manual-$(date +%Y%m%d-%H%M%S)
```

---

## Support & Resources

### Documentation
- [Main README](README.md)
- [Contributing Guide](Cryptopulse--main/CONTRIBUTING.md)
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)

### Useful Commands

```bash
# Check pnpm configuration
pnpm config list

# Clear all caches
pnpm store prune

# Rebuild from scratch
pnpm run clean && pnpm install && pnpm build

# Check for outdated packages
pnpm outdated

# Update all packages
pnpm update --latest

# Verify build output
ls -lh dist/
```

### Getting Help

- **Issues**: [GitHub Issues](https://github.com/telangrocks/CryptoPulse-Trading-Bot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/telangrocks/CryptoPulse-Trading-Bot/discussions)

---

## Appendix

### File Structure

```
Cryptopulse--main/
├── frontend/
│   ├── dist/              # Production build output
│   ├── src/               # Source code
│   ├── public/            # Static assets
│   ├── server.cjs         # Production server
│   ├── vite.config.ts     # Build configuration
│   ├── package.json       # Dependencies & scripts
│   └── env.production.example  # Environment template
├── scripts/
│   ├── cleanup-deployment.sh   # Cleanup script (Unix)
│   └── cleanup-deployment.ps1  # Cleanup script (Windows)
├── deploy-production.sh   # Deployment script (Unix)
├── deploy-production.ps1  # Deployment script (Windows)
└── render.yaml            # Render.com configuration
```

### Useful Links

- [Vite Documentation](https://vitejs.dev/)
- [pnpm Documentation](https://pnpm.io/)
- [React Documentation](https://react.dev/)
- [Render.com Docs](https://render.com/docs)

---

**Last Updated**: January 2025  
**Version**: 2.0.0

---

## Checklist: First-Time Deployment

- [ ] Install Node.js >= 18
- [ ] Install pnpm globally
- [ ] Clone repository
- [ ] Run cleanup script
- [ ] Install dependencies with `pnpm install --frozen-lockfile`
- [ ] Copy `env.production.example` to `.env.production`
- [ ] Generate secure `VITE_ENCRYPTION_KEY`
- [ ] Configure `VITE_API_BASE_URL`
- [ ] Run `pnpm run validate`
- [ ] Run `pnpm run build`
- [ ] Test with `pnpm run preview`
- [ ] Deploy to platform
- [ ] Verify health checks
- [ ] Set up monitoring
- [ ] Configure alerts
- [ ] Schedule regular backups

✅ **Deployment Complete!**

