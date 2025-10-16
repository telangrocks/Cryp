import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { setupErrorLogging } from './utils/errorLogger';
import { registerServiceWorker } from './utils/serviceWorkerRegistration';
import './index.css';

// Initialize error logging FIRST
setupErrorLogging();

// Register service worker
registerServiceWorker();

// Render app with error boundary
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
