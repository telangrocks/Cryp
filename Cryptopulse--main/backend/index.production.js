// =============================================================================
// CryptoPulse Backend - Minimal Production Server
// =============================================================================
// Lightweight production backend optimized for Render free tier

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { fileURLToPath } from 'url';
import path from 'path';

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    service: 'cryptopulse-backend',
    version: '2.0.0'
  });
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
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
