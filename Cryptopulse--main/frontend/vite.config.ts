import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    }),
  ],

  // Logging
  logLevel: 'warn',

  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Environment variable security
  define: {
    __DEV__: process.env['NODE_ENV'] === 'development',
    __PROD__: process.env['NODE_ENV'] === 'production',
    global: 'globalThis',
  },

  // Environment variables configuration
  envPrefix: 'VITE_',

  // Build configuration
  build: {
    // Disable source maps in production for security
    sourcemap: false,

    // Optimize chunk splitting
    rollupOptions: {
      onwarn(warning: any, warn: any) {
        // Suppress mixed import warnings
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        if (warning.message.includes('dynamic import will not move module into another chunk')) return;
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        warn(warning);
      },
      output: {
        // More conservative chunking to prevent vendor bundle errors
        manualChunks: (id: string) => {
          // Group React and related libraries more carefully
          if (id.includes('node_modules')) {
            // Core React libraries in one chunk
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // Radix UI components
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            // Utility libraries
            if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('zod')) {
              return 'utils-vendor';
            }
            // TanStack Query
            if (id.includes('@tanstack')) {
              return 'query-vendor';
            }
            // Redux/Zustand
            if (id.includes('@reduxjs') || id.includes('redux') || id.includes('zustand')) {
              return 'state-vendor';
            }
            // Charts and visualization
            if (id.includes('recharts') || id.includes('chart')) {
              return 'chart-vendor';
            }
            // Everything else in vendor
            return 'vendor';
          }
          return undefined;
        },
        // Ensure consistent chunk naming with proper cache busting
        chunkFileNames: 'assets/[name]-[hash:8].js',
        entryFileNames: 'assets/[name]-[hash:8].js',
        assetFileNames: (assetInfo) => {
          // Use shorter hashes for better cache busting
          if (assetInfo.name && assetInfo.name.match(/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i)) {
            return 'assets/images/[name]-[hash:8].[ext]';
          }
          if (assetInfo.name && assetInfo.name.match(/\.(woff2?|eot|ttf|otf)$/i)) {
            return 'assets/fonts/[name]-[hash:8].[ext]';
          }
          return 'assets/[name]-[hash:8].[ext]';
        },
      },
    },

    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,

    // Minify options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      'recharts',
      'clsx',
      'tailwind-merge',
    ],
    esbuildOptions: {
      target: 'es2018',
    },
    // Add performance monitoring
    force: process.env['NODE_ENV'] === 'development',
  },

  // Application configuration
  base: '/',

  // Development server configuration
  server: {
    port: 3000,
    host: true,
    strictPort: true,

    // Enable HTTPS in development for testing CDN features
    https: process.env['NODE_ENV'] === 'development' && process.env['VITE_HTTPS'] === 'true',

    // CORS configuration for development
    cors: {
      origin: [process.env['VITE_BACKEND_URL'] || 'http://localhost:1337'],
      credentials: true,
    },

    // Security headers in development
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },

    // Proxy configuration for API calls with enhanced error handling
    proxy: {
      '/api': {
        target: process.env['VITE_BACKEND_URL'] || 'http://localhost:1337',
        changeOrigin: true,
        secure: false,
        timeout: 30000,
        configure: (proxy: any, _options: any) => {
          proxy.on('error', (err: any, req: any, res: any) => {
            console.error('Proxy error:', err.message);
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Proxy error occurred' }));
            }
          });
          proxy.on('proxyReq', (proxyReq: any, req: any, _res: any) => {
            if (process.env['NODE_ENV'] === 'development') {
              console.log('Sending Request to the Target:', req.method, req.url);
            }
          });
          proxy.on('proxyRes', (proxyRes: any, req: any, _res: any) => {
            if (process.env['NODE_ENV'] === 'development') {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            }
          });
          proxy.on('timeout', (req: any, res: any) => {
            console.error('Proxy timeout for:', req.url);
            if (!res.headersSent) {
              res.writeHead(504, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Request timeout' }));
            }
          });
        },
      },
    },
  },

  // Preview server configuration
  preview: {
    port: 4173,
    host: true,
    strictPort: true,

    // Security headers for preview
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
});