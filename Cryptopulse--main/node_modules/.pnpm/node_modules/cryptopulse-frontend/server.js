import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import helmet from 'helmet';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Configuration
const PORT = process.env.PORT || 10000;
const isDevelopment = process.env.NODE_ENV !== 'production';

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Adjust based on your needs
  crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// Parse JSON bodies
app.use(express.json());

// Serve static files with proper caching and security
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: isDevelopment ? 0 : '1y',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Don't cache index.html
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    // Don't expose source maps in production
    else if (filePath.endsWith('.map') && !isDevelopment) {
      res.status(404).end();
      return;
    }
    // Cache static assets for 1 year (they have hashes)
    else if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot|svg)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      if (filePath.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
      }
    }
  }
}));

// Health check endpoint - CRITICAL for Render (MUST be before catch-all route)
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
    },
    version: process.env.npm_package_version || '2.0.0'
  };
  
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.status(200).json(healthStatus);
});

// CRITICAL: SPA fallback - ALL other routes serve index.html
// This allows React Router to handle client-side routing
app.get('*', (req, res) => {
  // Skip if requesting static assets (they should be handled by static middleware)
  if (req.path.includes('.')) {
    return res.status(404).send('File not found');
  }
  
  // Set appropriate cache headers for HTML
  if (req.path === '/' || req.path === '/index.html') {
    res.setHeader('Cache-Control', 'public, max-age=180'); // 3 minutes for root
  } else {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: isDevelopment ? err.message : 'Something went wrong'
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('🚀 CryptoPulse Server Started');
  console.log('═══════════════════════════════════════════════════');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
  console.log(`⏱️  Started: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════');
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

// Memory monitoring (every 2 minutes)
setInterval(() => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  
  console.log(`💾 Memory Usage: ${heapUsedMB}MB / ${heapTotalMB}MB`);
  
  if (heapUsedMB > 400) {
    console.warn('⚠️  WARNING: High memory usage detected!');
  }
}, 120000);

export default server;
