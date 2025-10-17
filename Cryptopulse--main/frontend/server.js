import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Configuration
const PORT = process.env.PORT || 10000;
const isDevelopment = process.env.NODE_ENV !== 'production';

// Optimize static file serving with proper caching headers
app.use(express.static(path.join(__dirname, 'dist'), {
  // Enable ETags for better caching
  etag: true,
  // Set cache control for static assets
  setHeaders: (res, path) => {
    // Cache JS/CSS files for 1 year (they have hashes)
    if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // Cache SVG files for 1 year with proper content-type
    else if (path.match(/\.svg$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    }
    // Cache HTML for shorter time (5 minutes) for better updates
    else if (path.match(/\.html$/)) {
      res.setHeader('Cache-Control', 'public, max-age=300');
    }
  }
}));

// Health check endpoint - CRITICAL for Render (MUST be before catch-all route)
app.get('/health', (req, res) => {
  const healthcheck = {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
    },
    environment: process.env.NODE_ENV || 'development'
  };
  
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.status(200).json(healthcheck);
});

// Handle React Router - send all requests to index.html
app.get('*', (req, res) => {
  // Set appropriate cache headers for HTML
  if (req.path === '/' || req.path === '/index.html') {
    res.setHeader('Cache-Control', 'public, max-age=180'); // 3 minutes for root
  } else {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
});

// Graceful shutdown handler - CRITICAL
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} signal received: starting graceful shutdown`);
  
  server.close((err) => {
    if (err) {
      console.error('❌ Error during server shutdown:', err);
      process.exit(1);
    }
    
    console.log('✅ HTTP server closed successfully');
    console.log('🔌 All connections closed');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Uncaught exception handler
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Memory monitoring (every 30 seconds)
setInterval(() => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  
  console.log(`💾 Memory Usage: ${heapUsedMB}MB / 512MB`);
  
  // Warning if approaching limit
  if (heapUsedMB > 400) {
    console.warn('⚠️  WARNING: Memory usage high!');
  }
}, 30000);

export default server;
