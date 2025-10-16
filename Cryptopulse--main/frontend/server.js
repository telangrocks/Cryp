import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Get port from environment variable (Render requirement)
const PORT = process.env.PORT || 3000;

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.status(200).send('healthy');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
