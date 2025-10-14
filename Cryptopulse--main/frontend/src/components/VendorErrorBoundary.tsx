import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

interface VendorErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const VendorErrorFallback: React.FC<VendorErrorFallbackProps> = ({ 
  error, 
  resetErrorBoundary 
}) => {
  const isVendorError = error.message.includes('vendor') || 
                       error.stack?.includes('vendor') ||
                       error.name.includes('ChunkLoadError') ||
                       error.message.includes('Loading chunk');

  const handleReload = () => {
    // Clear cache and reload for vendor errors
    if (isVendorError && 'caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    window.location.reload();
  };

  const handleReset = () => {
    if (isVendorError) {
      handleReload();
    } else {
      resetErrorBoundary();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
            <svg 
              className="h-6 w-6 text-red-600 dark:text-red-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
          
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            {isVendorError ? 'Application Update Required' : 'Application Error'}
          </h3>
          
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isVendorError 
              ? 'A new version of the application is available. Please reload to get the latest updates.'
              : 'Something went wrong. Please try again.'
            }
          </p>

          {isVendorError && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 This usually happens when the app has been updated. Reloading will fix the issue.
              </p>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <button
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              onClick={handleReset}
            >
              {isVendorError ? '🔄 Reload Application' : '🔄 Try Again'}
            </button>
            
            {!isVendorError && (
              <button
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                onClick={handleReload}
              >
                🔄 Force Reload
              </button>
            )}
          </div>

          {__DEV__ && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400">
                Error Details (Development)
              </summary>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-500 overflow-auto bg-gray-100 dark:bg-gray-700 p-2 rounded">
                <div><strong>Type:</strong> {isVendorError ? 'Vendor Bundle Error' : 'Application Error'}</div>
                <div><strong>Message:</strong> {error.message}</div>
                <div><strong>Stack:</strong></div>
                <pre className="whitespace-pre-wrap">{error.stack}</pre>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

interface VendorErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<VendorErrorFallbackProps>;
}

const VendorErrorBoundary: React.FC<VendorErrorBoundaryProps> = ({ 
  children, 
  fallback: Fallback = VendorErrorFallback 
}) => {
  const handleError = (error: Error, errorInfo: any) => {
    // Enhanced error reporting for vendor errors
    const isVendorError = error.message.includes('vendor') || 
                         error.stack?.includes('vendor') ||
                         error.name.includes('ChunkLoadError') ||
                         error.message.includes('Loading chunk');

    if (__PROD__) {
      // Report vendor errors differently
      const errorData = {
        type: isVendorError ? 'vendor-bundle-error' : 'application-error',
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        errorInfo,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        isVendorError,
        cacheStatus: 'caches' in window ? 'available' : 'unavailable',
      };

      // Send to error reporting service
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(errorData)], { type: 'application/json' });
        navigator.sendBeacon('/api/errors/vendor', blob);
      } else {
        fetch('/api/errors/vendor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorData),
        }).catch(() => {
          // Silent fail for error reporting
        });
      }
    }

    // Log to console in development
    if (__DEV__) {
      console.error('Vendor Error Boundary caught an error:', error, errorInfo);
      if (isVendorError) {
        console.warn('This appears to be a vendor bundle error. Try reloading the page.');
      }
    }
  };

  const handleReset = () => {
    // Clear any problematic cache entries
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('vendor') || name.includes('chunk')) {
            caches.delete(name);
          }
        });
      });
    }
  };

  return (
    <ErrorBoundary
      FallbackComponent={Fallback}
      onError={handleError}
      onReset={handleReset}
      resetKeys={[window.location.pathname, window.location.search]}
    >
      {children}
    </ErrorBoundary>
  );
};

export default VendorErrorBoundary;
