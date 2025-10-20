// =============================================================================
// CryptoPulse Backend - Minimal Production Server
// =============================================================================
// Lightweight production backend optimized for Render free tier

import express from 'express';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { fileURLToPath } from 'url';
import path from 'path';

// Import comprehensive health monitor
import healthMonitor from './lib/healthMonitor.js';
// Import database functions
import { initDatabases, query } from './lib/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();

// Production environment variables
const PORT = process.env.PORT || 10000;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'production';

// CRITICAL: Root endpoint - MUST be ABSOLUTELY FIRST, before ANY middleware
app.get('/', (req, res) => {
  console.log('🔥🔥🔥 ROOT ENDPOINT HIT - REDIRECTING TO /health:', req.method, req.path);
  res.redirect('/health');
});

// Handle HEAD requests to root path
app.head('/', (req, res) => {
  console.log('🔥🔥🔥 ROOT HEAD ENDPOINT HIT - REDIRECTING TO /health:', req.method, req.path);
  res.redirect('/health');
});

// Favicon endpoint - also early to avoid middleware interference
app.get('/favicon.ico', (req, res) => {
  res.status(204).send(); // No content for favicon
});

// Test endpoint to verify deployment
app.get('/test', (req, res) => {
  res.json({ message: 'Deployment test successful', timestamp: new Date().toISOString() });
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://cryptopulse-frontend.onrender.com',
  credentials: true
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Basic logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// -----------------------------------------------------------------------------
// DEV LOG ENDPOINTS (production-safe)
// -----------------------------------------------------------------------------
app.post('/api/dev-log', (req, res) => {
  try {
    const { level = 'error', message = '', stack, name, url, userAgent, timestamp, extra } = req.body || {};
    const safe = (v) => typeof v === 'string' ? v : JSON.stringify(v || '');
    const entry = {
      level: ['error', 'warn', 'info'].includes(level) ? level : 'error',
      message: safe(message).slice(0, 2000),
      stack: stack ? safe(stack).slice(0, 8000) : undefined,
      name: name ? safe(name).slice(0, 256) : undefined,
      url: url ? safe(url).slice(0, 1024) : undefined,
      userAgent: userAgent ? safe(userAgent).slice(0, 512) : undefined,
      timestamp: timestamp || new Date().toISOString(),
      extra: extra || undefined,
      receivedAt: new Date().toISOString(),
      ip: req.ip,
    };

    const logsDir = path.join(__dirname, '..', '.dev-logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const day = new Date().toISOString().slice(0, 10);
    const filePath = path.join(logsDir, `${day}.json`);

    let existing = [];
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        existing = JSON.parse(raw);
        if (!Array.isArray(existing)) existing = [];
      } catch {
        existing = [];
      }
    }

    existing.push(entry);
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));

    res.status(204).send();
  } catch (e) {
    res.status(204).send();
  }
});

// Export recent dev logs (for CI fetch)
app.get('/api/dev-log/export', (req, res) => {
  try {
    const days = Math.max(1, Math.min(7, parseInt(req.query.days || '1', 10)));
    const logsDir = path.join(__dirname, '..', '.dev-logs');
    const today = new Date();
    const result = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(today.getTime() - i * 24 * 3600 * 1000);
      const name = d.toISOString().slice(0, 10) + '.json';
      const filePath = path.join(logsDir, name);
      if (fs.existsSync(filePath)) {
        try {
          const arr = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          if (Array.isArray(arr)) result.push(...arr);
        } catch {}
      }
    }
    res.status(200).json({ success: true, logs: result, count: result.length });
  } catch {
    res.status(200).json({ success: true, logs: [], count: 0 });
  }
});

// Comprehensive health check endpoint
app.get('/health', async (req, res) => {
  try {
    const healthStatus = await healthMonitor.performHealthCheck();
    
    // Determine HTTP status based on overall health
    const httpStatus = healthStatus.overall.status === 'healthy' ? 200 : 503;
    
    res.status(httpStatus).json({
      status: healthStatus.overall.status,
      timestamp: healthStatus.timestamp,
      environment: healthStatus.environment,
      service: 'cryptopulse-backend',
      version: healthStatus.version,
      uptime: healthStatus.overall.uptime,
      checkDuration: `${healthStatus.overall.checkDuration}ms`,
      summary: {
        totalServices: healthStatus.overall.totalServices,
        healthyServices: healthStatus.overall.healthyServices,
        requiredServicesHealthy: healthStatus.overall.requiredServicesHealthy,
        totalRequiredServices: healthStatus.overall.totalRequiredServices
      },
      services: healthStatus.services
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      service: 'cryptopulse-backend',
      version: '2.0.0',
      error: 'Health check failed',
      message: error.message
    });
  }
});

// Quick health check endpoint (cached status)
app.get('/health/quick', (req, res) => {
  const healthStatus = healthMonitor.getHealthStatus();
  
  res.status(200).json({
    status: healthStatus.overall.status,
    timestamp: healthStatus.timestamp,
    environment: healthStatus.environment,
    service: 'cryptopulse-backend',
    version: healthStatus.version,
    uptime: healthStatus.overall.uptime,
    summary: {
      totalServices: healthStatus.overall.totalServices,
      healthyServices: healthStatus.overall.healthyServices,
      requiredServicesHealthy: healthStatus.overall.requiredServicesHealthy,
      totalRequiredServices: healthStatus.overall.totalRequiredServices
    }
  });
});


// Detailed health check endpoint with system metrics
app.get('/health/detailed', async (req, res) => {
  try {
    const healthStatus = await healthMonitor.performHealthCheck();
    
    // Add system metrics
    const systemMetrics = {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid
    };
    
    const httpStatus = healthStatus.overall.status === 'healthy' ? 200 : 503;
    
    res.status(httpStatus).json({
      status: healthStatus.overall.status,
      timestamp: healthStatus.timestamp,
      environment: healthStatus.environment,
      service: 'cryptopulse-backend',
      version: healthStatus.version,
      uptime: healthStatus.overall.uptime,
      checkDuration: `${healthStatus.overall.checkDuration}ms`,
      system: systemMetrics,
      summary: {
        totalServices: healthStatus.overall.totalServices,
        healthyServices: healthStatus.overall.healthyServices,
        requiredServicesHealthy: healthStatus.overall.requiredServicesHealthy,
        totalRequiredServices: healthStatus.overall.totalRequiredServices
      },
      services: healthStatus.services,
      environmentVariables: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
        host: process.env.HOST,
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'not configured',
        redisUrl: process.env.REDIS_URL ? 'configured' : 'not configured',
        mongodbUrl: process.env.MONGODB_URL ? 'configured' : 'not configured'
      }
    });
  } catch (error) {
    console.error('Detailed health check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      service: 'cryptopulse-backend',
      version: '2.0.0',
      error: 'Detailed health check failed',
      message: error.message
    });
  }
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'operational',
    service: 'cryptopulse-backend',
    version: '2.0.0',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      healthQuick: '/health/quick',
      healthDetailed: '/health/detailed',
      status: '/api/status',
      auth: '/api/auth/*'
    }
  });
});

// Basic authentication endpoints (simplified)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  // Mock authentication for now
  res.status(200).json({
    success: true,
    message: 'Authentication endpoint is operational',
    token: 'mock-token-' + Date.now()
  });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }
  
  res.status(201).json({
    success: true,
    message: 'Registration endpoint is operational',
    user: { email, name }
  });
});

// Catch-all route for undefined endpoints
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Initialize databases and start server
const startServer = async () => {
  try {
    // Initialize databases
    console.log('🔧 Initializing databases...');
    await initDatabases();
    console.log('✅ Databases initialized successfully');
    
    // Start health monitor after database initialization
    console.log('🔧 Starting health monitor...');
    await healthMonitor.start();
    console.log('✅ Health monitor started successfully');
    
    // Start server
    const server = app.listen(PORT, HOST, () => {
      console.log(`🚀 CryptoPulse Backend started from index.production.js`);
      console.log(`📡 Server running on ${HOST}:${PORT}`);
      console.log(`📊 Environment: ${NODE_ENV}`);
      console.log(`🔒 Security features enabled`);
      console.log(`📈 Health check: http://${HOST}:${PORT}/health`);
      console.log(`🔧 Port configuration: process.env.PORT=${process.env.PORT || 'not set'}, using PORT=${PORT}`);
      console.log(`✅ ROOT ROUTE SHOULD REDIRECT TO /health`);
    });
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
const server = await startServer();

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    console.error(`🔧 Please check if another process is using port ${PORT}`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
});

// Production optimizations
server.maxConnections = 50;
server.keepAliveTimeout = 30000;
server.headersTimeout = 35000;

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`${signal} received, shutting down gracefully`);
  
  try {
    // Cleanup health monitor connections
    await healthMonitor.cleanup();
    console.log('Health monitor cleaned up');
    
    // Close server
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
    
    // Force exit after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
    
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
