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
import VendorErrorBoundary from './components/VendorErrorBoundary';
import { Toaster } from './components/ui/toaster';
import { AppStateProvider } from './contexts/AppStateContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
// Hooks
import { useDocumentHead } from './hooks/useDocumentHead';
// Utils
import { queryClient } from './lib/queryClient';
import { AppRoutes } from './routes';

// Simplified error reporting
const reportError = (error: Error, errorInfo?: any) => {
  if (__PROD__) {
    console.error('Production error:', error, errorInfo);
    // Simple error reporting without complex dependencies
    try {
      const errorData = {
        error: { message: error.message, stack: error.stack, name: error.name },
        errorInfo,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      };
      // Only report if error URL is configured
      const errorUrl = import.meta.env.VITE_ERROR_URL;
      if (errorUrl) {
        fetch(errorUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorData),
        }).catch(() => {});
      }
    } catch (e) {
      // Silent fail for error reporting
    }
  }
};
// Main App Component - Simplified
const AppContent = React.memo(() => {
  const { loading } = useAuth();
  useDocumentHead({ title: 'CryptoPulse - AI Trading Platform' });
  
  // Remove HTML loading screen when auth loading completes
  React.useEffect(() => {
    if (!loading) {
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
      document.body.classList.add('app-loaded');
      const loadingEl = document.querySelector('.app-loading');
      if (loadingEl) {
        loadingEl.remove();
      }
    }, 5000);
    
    return () => clearTimeout(fallbackTimeout);
  }, []);
  
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
// Main App Component with Providers - Simplified
const App = React.memo(() => {
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
// Simplified Error Boundary Wrapper
const AppWithErrorBoundary = React.memo(() => {
  const handleError = React.useCallback((error: Error, errorInfo: any) => {
    reportError(error, errorInfo);
  }, []);
  
  const handleReset = React.useCallback(() => {
    try {
      queryClient.clear();
      // Clear any problematic localStorage items
      const problematicKeys = ['errorState', 'corruptedData'];
      problematicKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
        }
      });
    } catch (_resetError) {
      // Error reset handled gracefully
    }
  }, []);
  
  return (
    <VendorErrorBoundary>
      <ErrorBoundary
        fallbackRender={({ error, resetErrorBoundary }) => (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                  <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                      {error?.message}
                      {error?.stack}
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
    </VendorErrorBoundary>
  );
});
AppWithErrorBoundary.displayName = 'AppWithErrorBoundary';
export default AppWithErrorBoundary;
