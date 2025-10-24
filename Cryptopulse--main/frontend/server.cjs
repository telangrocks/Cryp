/* 
 * CryptoPulse Frontend Production Server
 * Enhanced Express server with health checks, security headers, and monitoring
 */
const path = require('path');
const express = require('express');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 10000;
const distDir = path.join(__dirname, 'dist');
const startTime = Date.now();

// Disable X-Powered-By header for security
app.disable('x-powered-by');

// Enable gzip compression
app.use(compression());

// Add security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// ============================================================================
// HEALTH CHECK & MONITORING ENDPOINTS
// ============================================================================

// Health check endpoint (required by Render and most deployment platforms)
app.get('/health', (req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: `${uptime}s`,
    service: 'cryptopulse-frontend',
    version: process.env.VITE_APP_VERSION || '2.0.0',
    environment: process.env.NODE_ENV || 'production',
  });
});

// Readiness check (for Kubernetes and advanced health checks)
app.get('/ready', (req, res) => {
  // Check if dist directory exists and has index.html
  const fs = require('fs');
  const indexPath = path.join(distDir, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.status(200).json({
      status: 'ready',
      message: 'Service is ready to accept traffic',
    });
  } else {
    res.status(503).json({
      status: 'not_ready',
      message: 'Build artifacts not found',
    });
  }
});

// Liveness check (for Kubernetes)
app.get('/alive', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

// Status endpoint with detailed metrics
app.get('/status', (req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  res.status(200).json({
    status: 'operational',
    service: 'cryptopulse-frontend',
    version: process.env.VITE_APP_VERSION || '2.0.0',
    environment: process.env.NODE_ENV || 'production',
    uptime: {
      seconds: uptime,
      formatted: formatUptime(uptime),
    },
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
  });
});

// ============================================================================
// STATIC FILE SERVING
// ============================================================================

// Serve static files with optimized cache headers
app.use(
  express.static(distDir, {
    setHeaders: (res, filePath) => {
      // Immutable assets (JS, CSS, fonts with hash in filename)
      if (/\.(js|css|woff2?|ttf)$/.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } 
      // Images (longer cache)
      else if (/\.(png|jpg|jpeg|gif|svg|ico|webp)$/.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=604800');
      } 
      // HTML and other files (short cache)
      else {
        res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
      }
      
      // Security headers for all static files
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  })
);

// ============================================================================
// SPA ROUTING
// ============================================================================

// Catch-all route for SPA (must be last)
app.get('*', (req, res) => {
  // Don't serve index.html for API calls or health checks
  if (req.path.startsWith('/api') || 
      req.path.startsWith('/health') || 
      req.path.startsWith('/ready') ||
      req.path.startsWith('/alive') ||
      req.path.startsWith('/status')) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  res.sendFile(path.join(distDir, 'index.html'));
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const server = app.listen(PORT, () => {
  console.log(`✅ CryptoPulse Frontend Server`);
  console.log(`📡 Listening on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Status endpoint: http://localhost:${PORT}/status`);
  console.log(`⚡ Ready to serve traffic`);
});

// Graceful shutdown
const shutdown = () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  
  return parts.join(' ');
}
