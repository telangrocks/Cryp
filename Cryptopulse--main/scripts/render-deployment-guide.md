# 🚀 CryptoPulse Render Deployment Guide

## 📋 **Pre-Deployment Checklist**

### ✅ **Required Information**
- [ ] Render account access
- [ ] GitHub repository connected to Render
- [ ] Domain names (if using custom domains)
- [ ] SSL certificates (Render provides free ones)

### ✅ **Environment Variables Ready**
- [ ] Database credentials
- [ ] API keys for exchanges
- [ ] JWT secrets
- [ ] Encryption keys

## 🏗️ **Service Architecture on Render**

### **1. Backend Service (Web Service)**
- **Type**: Web Service
- **Runtime**: Node.js 20
- **Build Command**: `cd backend && npm install && npm run build:production`
- **Start Command**: `cd backend && npm run start:production`
- **Port**: 1337

### **2. Frontend Service (Static Site)**
- **Type**: Static Site
- **Build Command**: `cd frontend && npm install && npm run build:production`
- **Publish Directory**: `frontend/dist`
- **Node Version**: 20

### **3. Cloud Services (Web Service)**
- **Type**: Web Service
- **Runtime**: Node.js 20
- **Build Command**: `cd cloud && npm install`
- **Start Command**: `cd cloud && npm start`
- **Port**: 3001

### **4. Database Services**
- **PostgreSQL**: Render PostgreSQL (add-on)
- **Redis**: Render Redis (add-on)
- **MongoDB**: External service (MongoDB Atlas recommended)

## 🔧 **Deployment Steps**

### **Step 1: Backend Service Setup**

1. **Create New Web Service**
   - Connect your GitHub repository
   - Select the repository branch (main)
   - **Root Directory**: `backend`
   - **Runtime**: Node.js
   - **Build Command**: `npm install && npm run build:production`
   - **Start Command**: `npm run start:production`

2. **Environment Variables** (Add these in Render dashboard):
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

3. **Advanced Settings**:
   - **Auto-Deploy**: Yes
   - **Health Check Path**: `/health`
   - **Instance Type**: Starter ($7/month) or Standard ($25/month)

### **Step 2: Frontend Service Setup**

1. **Create New Static Site**
   - Connect your GitHub repository
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build:production`
   - **Publish Directory**: `dist`

2. **Environment Variables**:
   ```bash
   NODE_ENV=production
   VITE_API_BASE_URL=https://your-backend-service.onrender.com
   VITE_APP_NAME=CryptoPulse
   VITE_APP_VERSION=2.0.0
   VITE_ENCRYPTION_KEY=<your-frontend-encryption-key>
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

3. **Advanced Settings**:
   - **Auto-Deploy**: Yes
   - **Custom Domain**: (Optional) your-domain.com

### **Step 3: Cloud Services Setup**

1. **Create New Web Service**
   - **Root Directory**: `cloud`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

2. **Environment Variables**:
   ```bash
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=<render-postgres-url>
   REDIS_URL=<render-redis-url>
   LOG_LEVEL=info
   ENABLE_MONITORING=true
   ```

### **Step 4: Database Setup**

1. **PostgreSQL Database**
   - Add PostgreSQL add-on to your backend service
   - Note the connection URL

2. **Redis Cache**
   - Add Redis add-on to your backend service
   - Note the connection URL

3. **MongoDB**
   - Use MongoDB Atlas (free tier available)
   - Create cluster and get connection string

## 🔍 **Post-Deployment Verification**

### **Health Checks**
1. **Backend**: `https://your-backend.onrender.com/health`
2. **Frontend**: `https://your-frontend.onrender.com`
3. **Cloud**: `https://your-cloud.onrender.com/health`

### **API Endpoints**
1. **Authentication**: `POST /api/auth/login`
2. **Trading**: `GET /api/trading/strategies`
3. **Portfolio**: `GET /api/portfolio/overview`

## 🚨 **Common Issues & Solutions**

### **Issue 1: Build Failures**
- **Cause**: Missing environment variables
- **Solution**: Ensure all required env vars are set

### **Issue 2: Database Connection**
- **Cause**: Incorrect DATABASE_URL
- **Solution**: Use Render's PostgreSQL add-on URL

### **Issue 3: Frontend API Calls**
- **Cause**: Wrong VITE_API_BASE_URL
- **Solution**: Use your backend service URL

### **Issue 4: CORS Errors**
- **Cause**: Backend not configured for frontend domain
- **Solution**: Update CORS settings in backend

## 📊 **Performance Optimization**

### **Render-Specific Optimizations**
1. **Use Render's CDN** for static assets
2. **Enable Gzip compression**
3. **Set proper cache headers**
4. **Use Render's Redis** for caching

### **Monitoring Setup**
1. **Render's built-in monitoring**
2. **Custom health checks**
3. **Uptime monitoring**
4. **Performance metrics**

## 🔐 **Security Best Practices**

1. **Environment Variables**: Never commit secrets
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure proper CORS policies
4. **Rate Limiting**: Implement API rate limiting
5. **Input Validation**: Validate all inputs

## 📞 **Support & Troubleshooting**

### **Render Documentation**
- [Render Web Services](https://render.com/docs/web-services)
- [Render Static Sites](https://render.com/docs/static-sites)
- [Render Databases](https://render.com/docs/databases)

### **Common Commands**
```bash
# Check service logs
render logs --service your-service-name

# Restart service
render restart --service your-service-name

# Check service status
render status --service your-service-name
```

## 🎯 **Final URLs**

After successful deployment, you'll have:
- **Frontend**: `https://your-frontend.onrender.com`
- **Backend API**: `https://your-backend.onrender.com`
- **Cloud Services**: `https://your-cloud.onrender.com`

## ✅ **Success Criteria**

- [ ] All services deploy successfully
- [ ] Health checks pass
- [ ] Frontend loads without errors
- [ ] API endpoints respond correctly
- [ ] Database connections work
- [ ] Authentication flow works
- [ ] Trading features functional

---

**Next Step**: Follow this guide step-by-step in your Render dashboard to deploy your world-class CryptoPulse platform! 🚀
