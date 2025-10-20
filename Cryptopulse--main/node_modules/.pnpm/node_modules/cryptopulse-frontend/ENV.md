# 🔐 CryptoPulse Frontend - Environment Variables Guide

## 📋 Complete Environment Variables Reference

This document lists all environment variables needed for the CryptoPulse frontend deployment.

---

## ✅ REQUIRED Variables

These variables **MUST** be set for the application to work:

### **API Configuration**

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_BASE_URL` | `https://cryptopulse-backend-j4ne.onrender.com` | Backend API URL |
| `VITE_ENCRYPTION_KEY` | `32+ char random string` | Used by frontend security utils |
| `NODE_ENV` | `production` | Node environment |

### **Application Info**

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_APP_NAME` | `CryptoPulse` | Application display name |
| `VITE_APP_VERSION` | `2.0.0` | Application version |

---

## 🎯 OPTIONAL Variables (Recommended for Production)

### **Build Configuration**

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_BUILD_TARGET` | `production` | Build optimization target |
| `VITE_ENABLE_SOURCEMAPS` | `false` | Disable sourcemaps for security |

### **Feature Flags**

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_DEBUG_MODE` | `false` | Debug mode (development only) |
| `VITE_ENABLE_ANALYTICS` | `false` | Enable analytics tracking |
| `VITE_ENABLE_WEBSOCKET` | `true` | Enable WebSocket connections |

### **Security**

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_TIMEOUT` | `30000` | API timeout (milliseconds) |
| `VITE_API_MAX_RETRIES` | `3` | Max API retry attempts |

### **Trading Configuration**

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_DEFAULT_TRADING_PAIR` | `BTC/USDT` | Default trading pair |
| `VITE_DEFAULT_EXCHANGE` | `binance` | Default exchange |

### **UI/UX**

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_DEFAULT_THEME` | `system` | Theme (light/dark/system) |
| `VITE_DEFAULT_CURRENCY` | `USD` | Display currency |
| `VITE_CHART_REFRESH_INTERVAL` | `5` | Chart refresh (seconds) |

### **Performance**

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_ENABLE_SERVICE_WORKER` | `true` | Enable PWA features |
| `VITE_ENABLE_LAZY_LOADING` | `true` | Enable route lazy loading |

---

## 📝 Copy-Paste Format for Render.com

### **Minimal Configuration (Required Only)**

```bash
VITE_API_BASE_URL=https://cryptopulse-backend-j4ne.onrender.com
NODE_ENV=production
VITE_APP_NAME=CryptoPulse
VITE_APP_VERSION=2.0.0
VITE_ENCRYPTION_KEY=ThisIsAReallyLongEncryptionKeyThatIsAtLeast32Chars123
```

### **Recommended Production Configuration**

```bash
# API Configuration
VITE_API_BASE_URL=https://cryptopulse-backend-j4ne.onrender.com
NODE_ENV=production

# Application Info
VITE_APP_NAME=CryptoPulse
VITE_APP_VERSION=2.0.0
# Security
VITE_ENCRYPTION_KEY=ThisIsAReallyLongEncryptionKeyThatIsAtLeast32Chars123

# Build Configuration
VITE_BUILD_TARGET=production
VITE_ENABLE_SOURCEMAPS=false

# Feature Flags
VITE_DEBUG_MODE=false
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_WEBSOCKET=true

# Security
VITE_API_TIMEOUT=30000
VITE_API_MAX_RETRIES=3

# Trading Defaults
VITE_DEFAULT_TRADING_PAIR=BTC/USDT
VITE_DEFAULT_EXCHANGE=binance

# UI/UX
VITE_DEFAULT_THEME=system
VITE_DEFAULT_CURRENCY=USD
VITE_CHART_REFRESH_INTERVAL=5

# Performance
VITE_ENABLE_SERVICE_WORKER=true
VITE_ENABLE_LAZY_LOADING=true
```

---

## 🚀 How to Add Variables in Render.com

1. **Go to your Frontend Service** in Render Dashboard
2. **Click "Environment"** in the left sidebar
3. **Click "Add Environment Variable"**
4. **Copy each variable** from above (one at a time):
   - **Key**: The variable name (e.g., `VITE_API_BASE_URL`)
   - **Value**: The variable value (e.g., `https://cryptopulse-backend...`)
5. **Click "Save Changes"**
6. **Redeploy** if auto-deploy is disabled

---

## 💻 Local Development Setup

For local development, create a `.env.local` file:

```bash
# API Configuration (use local backend)
VITE_API_BASE_URL=http://localhost:1337
NODE_ENV=development

# Application Info
VITE_APP_NAME=CryptoPulse (Dev)
VITE_APP_VERSION=2.0.0-dev

# Enable debugging
VITE_DEBUG_MODE=true
VITE_ENABLE_SOURCEMAPS=true

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_WEBSOCKET=true

# Other configurations same as production
```

---

## ⚠️ Important Notes

### **Security Best Practices**

- ✅ **Never commit** `.env.local` or `.env` files to Git
- ✅ **Use Render's secrets** for sensitive values
- ✅ **Disable sourcemaps** in production (`VITE_ENABLE_SOURCEMAPS=false`)
- ✅ **Set debug mode to false** in production

### **Variable Naming Convention**

- All frontend variables **must start with** `VITE_` to be accessible in the app
- System variables like `NODE_ENV` don't need the `VITE_` prefix
- Use **UPPERCASE** with **underscores** for separation

### **Updating Variables**

- Changes to environment variables require **redeployment**
- For Render: Variables update automatically on next deploy
- For local dev: Restart dev server after changing `.env.local`

---

## 🔍 Troubleshooting

### **Variables Not Working**

1. ✅ Check variable names start with `VITE_`
2. ✅ Verify no quotes around values in Render UI
3. ✅ Confirm variables are saved in Render
4. ✅ Trigger a new deployment

### **API Connection Issues**

1. ✅ Verify `VITE_API_BASE_URL` is correct
2. ✅ Check backend service is running
3. ✅ Test backend URL directly in browser
4. ✅ Check browser console for errors

### **Build Failures**

1. ✅ Ensure all REQUIRED variables are set
2. ✅ Check for typos in variable names
3. ✅ Verify NODE_ENV is set to `production`

---

## 📚 Additional Resources

- **Vite Environment Variables**: https://vitejs.dev/guide/env-and-mode.html
- **Render Environment Variables**: https://render.com/docs/environment-variables
- **Frontend Deployment Guide**: See `DEPLOYMENT.md`

---

**Last Updated**: 2025-10-13  
**Version**: 2.0.0

