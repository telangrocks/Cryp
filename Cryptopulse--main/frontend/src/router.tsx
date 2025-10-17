import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import SplashScreen from './components/SplashScreen';

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

// Loading fallback component
const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-white text-lg">Loading...</p>
    </div>
  </div>
);

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
    element: <SplashScreen />,
    errorElement: <RouteErrorBoundary><NotFound /></RouteErrorBoundary>,
  },
  {
    path: '/home',
    element: (
      <RouteErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Home />
        </Suspense>
      </RouteErrorBoundary>
    ),
    errorElement: <RouteErrorBoundary><NotFound /></RouteErrorBoundary>,
  },
  {
    path: '/dashboard',
    element: (
      <RouteErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Dashboard />
        </Suspense>
      </RouteErrorBoundary>
    ),
    errorElement: <RouteErrorBoundary><NotFound /></RouteErrorBoundary>,
  },
  {
    path: '/auth',
    element: (
      <RouteErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <AuthScreen />
        </Suspense>
      </RouteErrorBoundary>
    ),
    errorElement: <RouteErrorBoundary><NotFound /></RouteErrorBoundary>,
  },
  {
    path: '/privacy',
    element: (
      <RouteErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Privacy />
        </Suspense>
      </RouteErrorBoundary>
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
