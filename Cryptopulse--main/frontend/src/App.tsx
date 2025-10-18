import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// Components
import { Toaster } from './components/ui/toaster';
// Utils
import AppRouter from './router';

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
  console.log('🎯 AppContent rendering...');
  return <AppRouter />;
});
AppContent.displayName = 'AppContent';
// Main App Component with Providers - Simplified
const App = React.memo(() => {
  console.log('🎨 App component rendering...');
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="text-center max-w-md mx-auto p-6">
            <h1 className="text-3xl font-bold text-red-500 mb-4">Application Error</h1>
            <p className="text-gray-300 mb-6">Something went wrong. Please try refreshing the page.</p>
            <button
              onClick={resetErrorBoundary}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              🔄 Refresh Page
            </button>
          </div>
        </div>
      )}
      onError={(error, errorInfo) => {
        reportError(error, errorInfo);
      }}
    >
      <AppContent />
      <Toaster />
    </ErrorBoundary>
  );
});
App.displayName = 'App';
export default App;


