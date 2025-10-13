import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import { generateErrorId } from './lib/utils';
// Production error handling configuration
const postJson = (url: string, data: unknown) => {
  try {
    if (!url) return; // disabled
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
      return;
    }
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).catch(() => {});
  } catch (_) {}
};

const ERROR_HANDLER_CONFIG = {
  timeout: 10000, // 10 seconds timeout
  onError: (error: Error) => {
    if (import.meta.env.PROD) {
      // Production error reporting - integrate with your preferred service
      // Examples: Sentry, LogRocket, Bugsnag, etc.
      // Example Sentry integration:
      // Sentry.captureException(error, {
      //   tags: {
      //     section: 'app-initialization',
      //   },
      //   extra: {
      //     timestamp: new Date().toISOString(),
      //     userAgent: navigator.userAgent,
      //     url: window.location.href,
      //   },
      // });
      // Fallback: Send to your own error tracking endpoint
      const errorUrl = (import.meta as any).env.VITE_ERROR_URL || '';
      postJson(errorUrl, {
        error: { message: error.message, stack: error.stack, name: error.name },
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: localStorage.getItem('userId') || 'anonymous',
      });
    } else {
    }
  },
  onTimeout: () => {
    if (import.meta.env.PROD) {
      // Production timeout handling
      // Report timeout to analytics
      const analyticsUrl = (import.meta as any).env.VITE_ANALYTICS_URL || '';
      postJson(analyticsUrl, {
        type: 'app-initialization-timeout',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    } else {
    }
  },
};
// Production error UI creator with enhanced security and UX
function createErrorUI(error: Error): void {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;
  // Sanitize error message to prevent XSS
  const sanitizeMessage = (message: string): string => {
    return message
      .replace(/[<>]/g, '')
      .substring(0, 500) // Limit length
      .replace(/\n/g, '<br>');
  };
  // Check if we're in production to determine error detail level
  const isProduction = import.meta.env.PROD;
  const showErrorDetails = !isProduction;
  // Create error UI safely without innerHTML
  const errorContainer = document.createElement('div');
  errorContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem;
    text-align: center;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f8fafc;
    color: #1e293b;
    line-height: 1.6;
  `;

  const errorCard = document.createElement('div');
  errorCard.style.cssText = `
    max-width: 600px;
    width: 100%;
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    padding: 2rem;
    border: 1px solid #e5e7eb;
  `;

  const iconContainer = document.createElement('div');
  iconContainer.style.cssText = `
    width: 4rem;
    height: 4rem;
    background: #fef2f2;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
  `;

  const icon = document.createElement('div');
  icon.innerHTML = `<svg style="width: 2rem; height: 2rem; color: #dc2626;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>`;

  const title = document.createElement('h1');
  title.style.cssText = `
    color: #dc2626;
    margin-bottom: 1rem;
    font-size: 1.5rem;
    font-weight: 600;
  `;
  title.textContent = isProduction ? 'Something went wrong' : 'Application Error';

  const message = document.createElement('p');
  message.style.cssText = `
    margin-bottom: 2rem;
    color: #6b7280;
    font-size: 1rem;
  `;
  message.textContent = isProduction
    ? 'We apologize for the inconvenience. Please try refreshing the page or contact support if the problem persists.'
    : sanitizeMessage(error.message);

  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = 'display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;';

  const reloadButton = document.createElement('button');
  reloadButton.textContent = 'Reload Application';
  reloadButton.style.cssText = `
    background: #3b82f6;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: background-color 0.2s;
  `;
  reloadButton.onclick = () => window.location.reload();

  const homeButton = document.createElement('button');
  homeButton.textContent = 'Go Home';
  homeButton.style.cssText = `
    background: #6b7280;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: background-color 0.2s;
  `;
  homeButton.onclick = () => window.location.href = '/';

  buttonContainer.appendChild(reloadButton);
  buttonContainer.appendChild(homeButton);

  errorCard.appendChild(iconContainer);
  iconContainer.appendChild(icon);
  errorCard.appendChild(title);
  errorCard.appendChild(message);
  errorCard.appendChild(buttonContainer);

  if (showErrorDetails) {
    const details = document.createElement('details');
    details.style.cssText = 'margin-top: 2rem; text-align: left;';

    const summary = document.createElement('summary');
    summary.style.cssText = `
      cursor: pointer;
      color: #6b7280;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    `;
    summary.textContent = 'Error Details (Development)';

    const pre = document.createElement('pre');
    pre.style.cssText = `
      background: #f3f4f6;
      padding: 1rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      color: #374151;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-word;
    `;
    pre.textContent = sanitizeMessage(error.stack || error.message);

    details.appendChild(summary);
    details.appendChild(pre);
    errorCard.appendChild(details);
  }

  const errorId = document.createElement('div');
  errorId.style.cssText = `
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
    font-size: 0.75rem;
    color: #9ca3af;
  `;
  errorId.textContent = `Error ID: ${generateErrorId()}`;

  errorCard.appendChild(errorId);
  errorContainer.appendChild(errorCard);
  
  rootElement.appendChild(errorContainer);
}
// Performance monitoring utilities
const performanceMonitor = {
  startTime: performance.now(),
  mark: (name: string) => {
    performance.mark(name);
  },
  measure: (name: string, startMark: string, endMark?: string) => {
    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }
      const measure = performance.getEntriesByName(name)[0];
      if (measure) {
        // Report performance metrics
        if (import.meta.env.PROD) {
          const analyticsUrl = (import.meta as any).env.VITE_ANALYTICS_URL || '';
          postJson(analyticsUrl, {
            metric: name,
            value: measure.duration,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
          });
        } else {
          // Performance metrics logged in development
        }
      }
    } catch (error) {
    }
  },
  getTotalTime: () => {
    return performance.now() - performanceMonitor.startTime;
  },
};
// Initialize the app with proper production error handling and performance monitoring
function initializeApp(): void {
  // Mark initialization start
  performanceMonitor.mark('app-init-start');
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    const error = new Error('Root element not found. Please check the HTML structure.');
    ERROR_HANDLER_CONFIG.onError(error);
    createErrorUI(error);
    return;
  }
  try {
    // Mark React root creation
    performanceMonitor.mark('react-root-create-start');
    const root = createRoot(rootElement);
    performanceMonitor.mark('react-root-create-end');
    performanceMonitor.measure('react-root-creation', 'react-root-create-start', 'react-root-create-end');
    // Mark React render start
    performanceMonitor.mark('react-render-start');
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    // Mark React render end
    performanceMonitor.mark('react-render-end');
    performanceMonitor.measure('react-render', 'react-render-start', 'react-render-end');
    
    // Mark total initialization time
    performanceMonitor.mark('app-init-end');
    performanceMonitor.measure('app-total-init', 'app-init-start', 'app-init-end');
    // Report total initialization time
    const totalTime = performanceMonitor.getTotalTime();
    if (import.meta.env.PROD) {
      const analyticsUrl = (import.meta as any).env.VITE_ANALYTICS_URL || '';
      postJson(analyticsUrl, {
        totalInitTime: totalTime,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        connection: (navigator as any).connection?.effectiveType || 'unknown',
        memoryUsage: (performance as any).memory ? {
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize,
          limit: (performance as any).memory.jsHeapSizeLimit,
        } : null,
      });
    }
    // App rendered successfully - performance metrics reported to analytics
    // Set up timeout monitoring
    const timeoutId = setTimeout(() => {
      ERROR_HANDLER_CONFIG.onTimeout();
    }, ERROR_HANDLER_CONFIG.timeout);
    // Clear timeout if app loads successfully
    const clearTimeoutOnLoad = () => {
      clearTimeout(timeoutId);
      window.removeEventListener('load', clearTimeoutOnLoad);
    };
    window.addEventListener('load', clearTimeoutOnLoad);
  } catch (error) {
    const appError = error instanceof Error ? error : new Error(String(error));
    ERROR_HANDLER_CONFIG.onError(appError);
    createErrorUI(appError);
  }
}
// Set up global error handlers for unhandled errors
window.addEventListener('error', (event) => {
  ERROR_HANDLER_CONFIG.onError(event.error);
});
window.addEventListener('unhandledrejection', (event) => {
  ERROR_HANDLER_CONFIG.onError(new Error(event.reason));
});
// Start the application
initializeApp();
