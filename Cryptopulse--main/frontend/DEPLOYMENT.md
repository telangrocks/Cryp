# 🚀 CryptoPulse Frontend - Production Deployment Guide

## ✅ 100% PRODUCTION-READY DOCKER SETUP

This guide provides step-by-step instructions for deploying the CryptoPulse frontend on Render.com using Docker.

---

## 📋 Prerequisites

- GitHub repository connected to Render
- Docker-enabled environment on Render
- Valid environment variables configured

---

## 🎯 Deployment Configuration

### **Service Type:** Web Service
### **Environment:** Docker
### **Dockerfile Path:** `Cryptopulse--main/frontend/Dockerfile`

---

## 🔧 Render.com Configuration

### **1. Basic Settings**

| Setting | Value |
|---------|-------|
| **Name** | `cryptopulse-frontend` |
| **Region** | Choose closest to your users |
| **Branch** | `main` |
| **Root Directory** | `Cryptopulse--main/frontend` |

### **2. Build & Deploy Settings**

| Setting | Value |
|---------|-------|
| **Environment** | `Docker` |
| **Dockerfile Path** | `Dockerfile` (relative to root directory) |
| **Docker Build Context Directory** | `Cryptopulse--main/frontend` |
| **Build Command** | *(Leave empty - Docker handles this)* |
| **Start Command** | *(Leave empty - Docker handles this)* |

### **3. Environment Variables**

Add these environment variables in Render dashboard:

```bash
# API Configuration
VITE_API_BASE_URL=https://cryptopulse-backend-j4ne.onrender.com

# Environment
NODE_ENV=production

# Application Settings
VITE_APP_NAME=CryptoPulse
VITE_APP_VERSION=2.0.0
```

### **4. Advanced Settings**

| Setting | Value |
|---------|-------|
| **Port** | `80` |
| **Health Check Path** | `/health` |
| **Auto-Deploy** | `Yes` |
| **Instance Type** | Free/Starter/Standard (your choice) |

---

## 🏗️ Dockerfile Architecture

### **Multi-Stage Build Process:**

```
Stage 1: Base (node:20-alpine)
    ↓
Stage 2: Dependencies (pnpm install)
    ↓
Stage 3: Build (pnpm run build)
    ↓
Stage 4: Production (nginx:alpine)
```

### **Key Features:**

✅ **pnpm Package Manager** - Fast, reliable dependency management
✅ **Multi-stage Build** - Optimized image size (~50MB)
✅ **Security Hardened** - Non-root user, proper permissions
✅ **Health Checks** - `/health` endpoint for monitoring
✅ **Nginx Optimizations** - Gzip, caching, security headers
✅ **React Router Support** - SPA routing configured
✅ **Production Ready** - All optimizations applied

---

## 📊 Expected Build Process

```bash
==> Building Docker image
==> [1/4] FROM node:20-alpine AS base
==> [2/4] FROM dependencies - Installing pnpm
==> [3/4] FROM build - Running pnpm run build
==> [4/4] FROM production - Nginx setup
==> Build successful 🎉
==> Deploying...
==> Health check passed ✓
==> Service is live at https://[your-service].onrender.com
```

---

## 🔍 Verification Steps

### **1. Check Build Logs**

Ensure these steps complete successfully:
- ✅ pnpm installation
- ✅ Dependencies installation
- ✅ Build process
- ✅ Nginx configuration

### **2. Verify Health Endpoint**

```bash
curl https://[your-service].onrender.com/health
# Expected: "healthy"
```

### **3. Test Application**

```bash
curl https://[your-service].onrender.com/
# Expected: React application HTML
```

### **4. Check Response Headers**

```bash
curl -I https://[your-service].onrender.com/
# Should include security headers:
# - X-Frame-Options
# - X-Content-Type-Options
# - X-XSS-Protection
# - Content-Security-Policy
```

---

## 🐛 Troubleshooting

### **Issue: Build Fails at pnpm install**

**Solution:** Ensure the Dockerfile path is correct and pnpm version is compatible.

```bash
# Verify in Render logs:
==> RUN npm install -g pnpm@10.18.0
==> RUN pnpm install --production=false
```

### **Issue: Health Check Fails**

**Solution:** Verify the health check path is set to `/health` in Render settings.

### **Issue: 404 Errors on Routes**

**Solution:** nginx.conf is configured for SPA routing. Ensure it's properly copied:

```bash
# Verify in build logs:
==> COPY nginx.conf /etc/nginx/nginx.conf
```

### **Issue: Permission Errors**

**Solution:** Dockerfile creates non-root user with proper permissions. Check logs for:

```bash
==> RUN chown -R nginx:nginx /usr/share/nginx/html
```

---

## 📈 Performance Optimizations

### **Applied Optimizations:**

- ✅ **Gzip Compression** - Reduces bandwidth by ~70%
- ✅ **Static Asset Caching** - 1 year cache for JS/CSS/images
- ✅ **HTTP/2 Ready** - Modern protocol support
- ✅ **Minimal Image Size** - Alpine Linux base (~50MB)
- ✅ **Worker Processes** - Auto-scaled based on CPU cores
- ✅ **Connection Pooling** - Efficient connection management

---

## 🔒 Security Features

### **Applied Security Measures:**

- ✅ **Non-root User** - Runs as user `nginx` (UID 1001)
- ✅ **Security Headers** - CSP, X-Frame-Options, etc.
- ✅ **Server Tokens Off** - Hides Nginx version
- ✅ **Limited Permissions** - Minimal file access
- ✅ **Proper Signal Handling** - dumb-init for clean shutdowns
- ✅ **TLS Ready** - Configure via Render SSL settings

---

## 🎯 Production Checklist

Before going live, ensure:

- [ ] Environment variables configured
- [ ] Health check endpoint responding
- [ ] API connection working
- [ ] SSL/TLS certificate configured
- [ ] Custom domain configured (optional)
- [ ] Monitoring/alerts set up
- [ ] Auto-deploy enabled
- [ ] Backup/rollback strategy in place

---

## 📞 Support

For issues or questions:
- Check Render logs first
- Review this deployment guide
- Consult CryptoPulse documentation
- Contact: Shrikant Telang

---

## 📝 Version History

- **v2.0.0** - Production-ready Docker setup with pnpm
- **v1.0.0** - Initial release

---

## 🎉 Success!

Once deployed successfully, your frontend will be available at:

**URL:** `https://[your-service-name].onrender.com`

**Status:** Monitor in Render dashboard

**Logs:** Real-time logs available in Render console

---

**Made with ❤️ by CryptoPulse Team**

