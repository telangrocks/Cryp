import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// Context providers
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
// Components
import SplashScreen from './components/SplashScreen';
import { Toaster } from './components/ui/toaster';
// Hooks
import { useDocumentHead } from './hooks/useDocumentHead';
// Utils
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
  
  return <AppRoutes />;
});
AppContent.displayName = 'AppContent';
// Main App Component with Providers - Simplified
const App = React.memo(() => {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <h1>🚀 CryptoPulse</h1>
          <h2 style={{ color: '#fbbf24', marginBottom: '1rem' }}>Something went wrong</h2>
          <p style={{ marginBottom: '2rem', opacity: 0.9 }}>
            We're working to fix this issue. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            🔄 Refresh Page
          </button>
        </div>
      )}
      onError={(error, errorInfo) => {
        reportError(error, errorInfo);
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
});
App.displayName = 'App';
export default App;
