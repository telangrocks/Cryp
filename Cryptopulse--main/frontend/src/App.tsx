import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { BrowserRouter as Router } from 'react-router-dom';

// Context providers
import { AccessibilityProvider } from './components/AccessibilityProvider';
// Components
import ErrorFallback from './components/ErrorFallback';
import GlobalLoadingIndicator from './components/GlobalLoadingIndicator';
import SplashScreen from './components/SplashScreen';
// import EnhancedErrorBoundary from './components/EnhancedErrorBoundary';
import { Toaster } from './components/ui/toaster';
import { AppStateProvider } from './contexts/AppStateContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
// Routes
// Hooks
import { useDocumentHead } from './hooks/useDocumentHead';
// Utils
import { queryClient } from './lib/queryClient';
import { AppRoutes } from './routes';
// Production monitoring and error reporting
interface ErrorInfo {
  componentStack?: string | null;
  errorBoundary?: string;
  errorBoundaryStack?: string;
}
// Production error reporting service
const postJson = (url: string, data: unknown) => {
  try {
    if (!url) return;
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
      return;
    }
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).catch(() => {});
  } catch (_) {}
};

const reportError = (error: Error, errorInfo?: ErrorInfo) => {
  if (__PROD__) {
    // Production error reporting - integrate with your preferred service
    // Examples: Sentry, LogRocket, Bugsnag, etc.
    // Example Sentry integration:
    // Sentry.captureException(error, {
    //   contexts: {
    //     react: {
    //       componentStack: errorInfo?.componentStack,
    //     },
    //   },
    //   tags: {
    //     section: errorInfo?.errorBoundary || 'unknown',
    //   },
    // });
    // Example LogRocket integration:
    // LogRocket.captureException(error);
    const errorUrl = import.meta.env.VITE_ERROR_URL || '';
    postJson(errorUrl, {
      error: { message: error.message, stack: error.stack, name: error.name },
      errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('userId') || 'anonymous',
    });
  } else {
    // No error reporting in development
  }
};
// Performance monitoring
const reportPerformance = (metric: string, value: number, metadata?: Record<string, unknown>) => {
  if (__PROD__) {
    // Send performance metrics to your analytics service
    // Example: Google Analytics, Mixpanel, etc.
    // Example Google Analytics integration:
    // gtag('event', 'timing_complete', {
    //   name: metric,
    //   value: Math.round(value),
    //   custom_map: metadata,
    // });
    const analyticsUrl = import.meta.env.VITE_ANALYTICS_URL || '';
    postJson(analyticsUrl, {
      metric,
      value,
      metadata,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    });
  } else {
    // No analytics in development
  }
};
// Main App Component - Production Optimized
const AppContent = React.memo(() => {
  const { loading } = useAuth();
  useDocumentHead({ title: 'CryptoPulse - AI Trading Platform' });
  
  // Remove HTML loading screen when auth loading completes
  React.useEffect(() => {
    if (!loading) {
      // Auth loading completed, remove HTML loading screen
      document.body.classList.add('app-loaded');
      const loadingEl = document.querySelector('.app-loading');
      if (loadingEl) {
        loadingEl.remove();
      }
    }
  }, [loading]);
  
  // Fallback timeout to ensure loading screen is removed
  React.useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      // Force remove loading screen after 5 seconds regardless of auth state
      document.body.classList.add('app-loaded');
      const loadingEl = document.querySelector('.app-loading');
      if (loadingEl) {
        loadingEl.remove();
      }
    }, 5000);
    
    return () => clearTimeout(fallbackTimeout);
  }, []);
  
  // Performance monitoring for component render
  React.useEffect(() => {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      reportPerformance('app-content-render', endTime - startTime, {
        loading,
        timestamp: new Date().toISOString(),
      });
    };
  }, [loading]);
  
  if (loading) {
    return <SplashScreen />;
  }
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
});
AppContent.displayName = 'AppContent';
// Main App Component with Providers - Production Optimized
const App = React.memo(() => {
  // Performance monitoring for app initialization
  React.useEffect(() => {
    const startTime = performance.now();
    // Report app initialization time
    const reportInitTime = () => {
      const endTime = performance.now();
      reportPerformance('app-initialization', endTime - startTime, {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        connection: (navigator as any).connection?.effectiveType || 'unknown',
      });
    };
    // Report after initial render
    const timeoutId = setTimeout(reportInitTime, 100);
    return () => clearTimeout(timeoutId);
  }, []);
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <ErrorFallback
          error={error}
          resetErrorBoundary={resetErrorBoundary}
        />
      )}
      onError={(error, errorInfo) => {
        reportError(error, errorInfo);
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <AppStateProvider>
              <AccessibilityProvider>
                <GlobalLoadingIndicator />
                <AppContent />
                <Toaster />
                {/* React Query DevTools - only in development */}
                {__DEV__ && <ReactQueryDevtools initialIsOpen={false} />}
              </AccessibilityProvider>
            </AppStateProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
});
App.displayName = 'App';
// Production Error Boundary Wrapper
const AppWithErrorBoundary = React.memo(() => {
  const handleError = React.useCallback((error: Error, errorInfo: any) => {
    // Enhanced production error reporting
    reportError(error, errorInfo);
    // Additional error context for better debugging
    const errorContext = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      userId: localStorage.getItem('userId') || 'anonymous',
      sessionId: sessionStorage.getItem('sessionId') || 'unknown',
      memoryUsage: (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit,
      } : null,
    };
    // Report error with enhanced context
    if (__PROD__) {
      fetch('/api/errors/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
          errorInfo,
          context: errorContext,
        }),
      }).catch(() => {
        // Silent fail for error reporting
      });
    }
  }, []);
  const handleReset = React.useCallback(() => {
    // Enhanced reset logic for production
    try {
      // Clear any cached data that might be causing issues
      queryClient.clear();
      // Clear any problematic localStorage items
      const problematicKeys = ['errorState', 'corruptedData'];
      problematicKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
        }
      });
      // Report successful reset
      if (__PROD__) {
        reportPerformance('error-boundary-reset', 0, {
          timestamp: new Date().toISOString(),
          url: window.location.href,
        });
      }
      if (__DEV__) {
        // Development mode logging
      }
    } catch (_resetError) {
      // Error reset handled gracefully
    }
  }, []);
  // Performance monitoring for error boundary
  React.useEffect(() => {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      reportPerformance('error-boundary-setup', endTime - startTime, {
        timestamp: new Date().toISOString(),
      });
    };
  }, []);
  return (
    <ErrorBoundary
      fallbackRender={({
        error: _error,
        resetErrorBoundary: _resetErrorBoundary,
      }: {
        error: Error;
        resetErrorBoundary: () => void
      }) => (
        <div className="min-h-screen flex items-center justify-center bg-gray-50
                        dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg
                          rounded-lg p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12
                              rounded-full bg-red-100 dark:bg-red-900">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none"
                  stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                Application Error
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Something went wrong. Please try refreshing the page.
              </p>
              <div className="mt-6">
                <button
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm
                             font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700
                             focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </button>
              </div>
              {__DEV__ && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 text-xs text-gray-500 dark:text-gray-500 overflow-auto">
                    {_error?.message}
                    {_error?.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )}
      onError={handleError}
      onReset={handleReset}
      resetKeys={[window.location.pathname]}
    >
      <App />
    </ErrorBoundary>
  );
});
AppWithErrorBoundary.displayName = 'AppWithErrorBoundary';
export default AppWithErrorBoundary;
