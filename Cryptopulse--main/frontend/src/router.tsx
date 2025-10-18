import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import SplashScreen from './components/SplashScreen';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Lazy load components for better performance with error handling
const Home = lazy(() => import('./components/WorldClassDashboard').catch(err => {
  console.error('Failed to load WorldClassDashboard:', err);
  return { default: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error loading Home page</h1>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reload Page
        </button>
      </div>
    </div>
  ) };
}));

const Dashboard = lazy(() => import('./components/Dashboard').catch(err => {
  console.error('Failed to load Dashboard:', err);
  return { default: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error loading Dashboard</h1>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reload Page
        </button>
      </div>
    </div>
  ) };
}));

const AuthScreen = lazy(() => import('./components/AuthScreen').catch(err => {
  console.error('Failed to load AuthScreen:', err);
  return { default: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error loading Auth Screen</h1>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reload Page
        </button>
      </div>
    </div>
  ) };
}));

const NotFound = lazy(() => import('./pages/NotFound').catch(err => {
  console.error('Failed to load NotFound:', err);
  return { default: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">404 - Page Not Found</h1>
        <button 
          onClick={() => window.location.href = '/'}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go Home
        </button>
      </div>
    </div>
  ) };
}));

const Privacy = lazy(() => import('./pages/Privacy').catch(err => {
  console.error('Failed to load Privacy:', err);
  return { default: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error loading Privacy page</h1>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reload Page
        </button>
      </div>
    </div>
  ) };
}));

const DisclaimerScreen = lazy(() => import('./components/DisclaimerScreen').catch(err => {
  console.error('Failed to load DisclaimerScreen:', err);
  return { default: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error loading Disclaimer</h1>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reload Page
        </button>
      </div>
    </div>
  ) };
}));

// Additional components for missing routes
const APIKeySetup = lazy(() => import('./components/APIKeySetup').catch(err => {
  console.error('Failed to load APIKeySetup:', err);
  return { default: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error loading API Key Setup</h1>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reload Page
        </button>
      </div>
    </div>
  ) };
}));

// Placeholder components for missing routes
const PlaceholderComponent = ({ title, description }: { title: string; description: string }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="w-16 h-16 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center">
        <TrendingUp className="w-8 h-8 text-purple-400" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-4">{title}</h1>
      <p className="text-slate-400 mb-6">{description}</p>
      <button
        onClick={() => window.history.back()}
        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
      >
        Go Back
      </button>
    </div>
  </div>
);

// Loading fallback component
const LoadingFallback: React.FC = () => {
  // Auto-redirect after 2 seconds to prevent infinite loading
  React.useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = '/disclaimer';
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white text-lg">Loading...</p>
        <p className="text-slate-400 text-sm mt-2">Redirecting in 2 seconds...</p>
      </div>
    </div>
  );
};

// Error fallback component for routes
const RouteErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary fallback={
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center max-w-md mx-auto p-6">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Oops! Something went wrong</h1>
        <p className="text-gray-300 mb-6">We encountered an error loading this page.</p>
        <button
          onClick={() => window.location.href = '/'}
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
          Go Home
        </button>
      </div>
    </div>
  }>
    {children}
  </ErrorBoundary>
);

// Create router configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ThemeProvider>
        <AuthProvider>
          <RouteErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <DisclaimerScreen />
            </Suspense>
          </RouteErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    ),
    errorElement: <RouteErrorBoundary><NotFound /></RouteErrorBoundary>,
  },
  {
    path: '/disclaimer',
    element: (
      <ThemeProvider>
        <AuthProvider>
          <RouteErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <DisclaimerScreen />
            </Suspense>
          </RouteErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    ),
    errorElement: <RouteErrorBoundary><NotFound /></RouteErrorBoundary>,
  },
  {
    path: '/auth',
    element: (
      <ThemeProvider>
        <AuthProvider>
          <RouteErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <AuthScreen />
            </Suspense>
          </RouteErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    ),
    errorElement: <RouteErrorBoundary><NotFound /></RouteErrorBoundary>,
  },
  {
    path: '/dashboard',
    element: (
      <ThemeProvider>
        <AuthProvider>
          <RouteErrorBoundary>
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <Dashboard />
              </Suspense>
            </ProtectedRoute>
          </RouteErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    ),
    errorElement: <RouteErrorBoundary><NotFound /></RouteErrorBoundary>,
  },
  {
    path: '/home',
    element: (
      <ThemeProvider>
        <AuthProvider>
          <RouteErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <Home />
            </Suspense>
          </RouteErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    ),
    errorElement: <RouteErrorBoundary><NotFound /></RouteErrorBoundary>,
  },
  {
    path: '/privacy',
    element: (
      <ThemeProvider>
        <AuthProvider>
          <RouteErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <Privacy />
            </Suspense>
          </RouteErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    ),
    errorElement: <RouteErrorBoundary><NotFound /></RouteErrorBoundary>,
  },
  // API Keys Setup
  {
    path: '/api-keys',
    element: (
      <ThemeProvider>
        <AuthProvider>
          <RouteErrorBoundary>
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <APIKeySetup />
              </Suspense>
            </ProtectedRoute>
          </RouteErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    ),
    errorElement: <RouteErrorBoundary><NotFound /></RouteErrorBoundary>,
  },
  // Crypto Pairs Selection
  {
    path: '/crypto-pairs',
    element: (
      <ThemeProvider>
        <AuthProvider>
          <RouteErrorBoundary>
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <PlaceholderComponent 
                  title="Crypto Pairs" 
                  description="Select your preferred cryptocurrency trading pairs. This feature is coming soon!" 
                />
              </Suspense>
            </ProtectedRoute>
          </RouteErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    ),
    errorElement: <RouteErrorBoundary><NotFound /></RouteErrorBoundary>,
  },
  // Bot Setup
  {
    path: '/bot-setup',
    element: (
      <ThemeProvider>
        <AuthProvider>
          <RouteErrorBoundary>
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <PlaceholderComponent 
                  title="Bot Setup" 
                  description="Configure your trading bot parameters and strategies. This feature is coming soon!" 
                />
              </Suspense>
            </ProtectedRoute>
          </RouteErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    ),
    errorElement: <RouteErrorBoundary><NotFound /></RouteErrorBoundary>,
  },
  // Trade Execution
  {
    path: '/trade-execution',
    element: (
      <ThemeProvider>
        <AuthProvider>
          <RouteErrorBoundary>
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <PlaceholderComponent 
                  title="Trade Execution" 
                  description="Execute your trading strategies with AI-powered insights. This feature is coming soon!" 
                />
              </Suspense>
            </ProtectedRoute>
          </RouteErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    ),
    errorElement: <RouteErrorBoundary><NotFound /></RouteErrorBoundary>,
  },
  // AI Automation
  {
    path: '/ai-automation',
    element: (
      <ThemeProvider>
        <AuthProvider>
          <RouteErrorBoundary>
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <PlaceholderComponent 
                  title="AI Automation" 
                  description="Set up intelligent trading automation powered by advanced AI algorithms. This feature is coming soon!" 
                />
              </Suspense>
            </ProtectedRoute>
          </RouteErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    ),
    errorElement: <RouteErrorBoundary><NotFound /></RouteErrorBoundary>,
  },
  // Alerts Settings
  {
    path: '/alerts-settings',
    element: (
      <ThemeProvider>
        <AuthProvider>
          <RouteErrorBoundary>
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <PlaceholderComponent 
                  title="Alerts Settings" 
                  description="Configure trading alerts and notifications. This feature is coming soon!" 
                />
              </Suspense>
            </ProtectedRoute>
          </RouteErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    ),
    errorElement: <RouteErrorBoundary><NotFound /></RouteErrorBoundary>,
  },
  // Backtesting
  {
    path: '/backtesting',
    element: (
      <ThemeProvider>
        <AuthProvider>
          <RouteErrorBoundary>
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <PlaceholderComponent 
                  title="Backtesting" 
                  description="Test your trading strategies against historical data. This feature is coming soon!" 
                />
              </Suspense>
            </ProtectedRoute>
          </RouteErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    ),
    errorElement: <RouteErrorBoundary><NotFound /></RouteErrorBoundary>,
  },
  // Monitoring
  {
    path: '/monitoring',
    element: (
      <ThemeProvider>
        <AuthProvider>
          <RouteErrorBoundary>
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <PlaceholderComponent 
                  title="Live Monitoring" 
                  description="Monitor your trading bots and performance in real-time. This feature is coming soon!" 
                />
              </Suspense>
            </ProtectedRoute>
          </RouteErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    ),
    errorElement: <RouteErrorBoundary><NotFound /></RouteErrorBoundary>,
  },
  // Performance Analytics
  {
    path: '/performance',
    element: (
      <ThemeProvider>
        <AuthProvider>
          <RouteErrorBoundary>
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <PlaceholderComponent 
                  title="Performance Analytics" 
                  description="Analyze your trading performance with detailed analytics and insights. This feature is coming soon!" 
                />
              </Suspense>
            </ProtectedRoute>
          </RouteErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    ),
    errorElement: <RouteErrorBoundary><NotFound /></RouteErrorBoundary>,
  },
  {
    path: '/404',
    element: (
      <RouteErrorBoundary>
        <NotFound />
      </RouteErrorBoundary>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/404" replace />,
  },
]);

// Export router component
const AppRouter: React.FC = () => {
  console.log('🛣️ AppRouter rendering...');
  try {
    return <RouterProvider router={router} />;
  } catch (error) {
    console.error('[Router] Fatal error:', error);
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Router Error</h1>
          <p className="text-gray-300 mb-6">Failed to initialize router. Please refresh the page.</p>
          <button
            onClick={() => window.location.reload()}
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
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
};

export default AppRouter;


