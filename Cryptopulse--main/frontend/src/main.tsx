import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import AppRouter from './router';
import ErrorBoundary from './components/ErrorBoundary';
import { setupErrorLogging } from './utils/errorLogger';
import { registerServiceWorker } from './utils/serviceWorkerRegistration';
import './index.css';

// Initialize error logging BEFORE anything else
setupErrorLogging();

// Get root element with validation
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('❌ Root element not found!');
  document.body.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      padding: 20px;
      font-family: system-ui, -apple-system, sans-serif;
    ">
      <h1 style="color: #e53e3e; margin-bottom: 16px;">
        Application Error: Root element not found
      </h1>
    </div>
  `;
  throw new Error('Root element not found');
}

// Create root and render app
try {
  const root = ReactDOM.createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
      <HelmetProvider>
        <ErrorBoundary>
          <AppRouter />
        </ErrorBoundary>
      </HelmetProvider>
    </React.StrictMode>
  );

  

  // Register service worker after render
  registerServiceWorker();
  
} catch (error) {
  console.error('❌ Fatal error during application initialization:', error);
  
  // Emergency fallback UI
  rootElement.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      padding: 20px;
      font-family: system-ui, -apple-system, sans-serif;
    ">
      <h1 style="color: #e53e3e; margin-bottom: 16px;">
        Application Failed to Start
      </h1>
      <p style="color: #666; margin-bottom: 24px;">
        ${error instanceof Error ? error.message : 'Unknown error'}
      </p>
      <button
        onclick="window.location.reload()"
        style="
          padding: 12px 24px;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
        "
      >
        Reload Page
      </button>
    </div>
  `;
}


