import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Production-optimized Vite configuration
export default defineConfig({
  plugins: [react()],

  // Production logging
  logLevel: 'error',

  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Environment variable security
  define: {
    __DEV__: false,
    __PROD__: true,
    global: 'globalThis',
  },

  // Environment variables configuration
  envPrefix: 'VITE_',

  // Production build configuration
  build: {
    // Ultra-optimized production build
    minify: 'terser',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    target: ['es2018', 'chrome70', 'firefox65', 'safari12', 'edge79'],
    
    // Terser configuration for better compression
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
      format: {
        comments: false,
      },
    },

    // ESBuild configuration for better compatibility
    esbuild: {
      target: 'es2018',
      supported: {
        'destructuring': true,
        'dynamic-import': true,
      },
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true,
    },

    // Conservative chunking strategy to prevent vendor errors
    rollupOptions: {
      onwarn(warning: any, warn: any) {
        // Suppress warnings that don't affect functionality
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        if (warning.message.includes('dynamic import will not move module into another chunk')) return;
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
        warn(warning);
      },
      output: {
        // Conservative chunking to prevent vendor bundle errors
        manualChunks: (id: string) => {
          if (id.includes('node_modules')) {
            // Core React libraries - most stable
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // UI components - second most stable
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            // State management
            if (id.includes('@reduxjs') || id.includes('redux') || id.includes('zustand')) {
              return 'state-vendor';
            }
            // Data fetching
            if (id.includes('@tanstack')) {
              return 'query-vendor';
            }
            // Charts and visualization
            if (id.includes('recharts') || id.includes('chart')) {
              return 'chart-vendor';
            }
            // Utility libraries
            if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('zod') || id.includes('date-fns')) {
              return 'utils-vendor';
            }
            // Everything else - catch all
            return 'vendor';
          }
          return undefined;
        },
        // Consistent chunk naming for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Ensure proper module format
        format: 'es',
        // Better tree shaking
        exports: 'named',
      },
    },

    // Additional build optimizations
    reportCompressedSize: false,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
  },

  // Optimize dependencies for production
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
      '@tanstack/react-query',
      '@reduxjs/toolkit',
      'zustand',
    ],
    esbuildOptions: {
      target: 'es2018',
    },
    // Force optimization in production
    force: true,
  },

  // Production server configuration
  base: '/',

  // Preview server configuration for testing builds
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
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;",
    },
  },
});