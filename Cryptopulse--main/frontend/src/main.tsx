import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/responsive.css';

// Error boundary for initialization errors
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App initialization error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          padding: '20px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}>
          <h1 style={{ color: '#ff6b6b', marginBottom: '16px', fontSize: '2rem' }}>
            CryptoPulse
          </h1>
          <p style={{ color: '#ccc', marginBottom: '24px' }}>
            Application Failed to Start: {this.state.error?.message || 'Unknown error'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4ecdc4',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Initialize the application
function initializeApp() {
  console.log('🚀 Initializing CryptoPulse application...');
  
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('❌ Root element not found');
    document.body.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100vh;
        padding: 20px;
        font-family: system-ui, -apple-system, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      ">
        <h1 style="color: #ff6b6b; margin-bottom: 16px; font-size: 2rem;">
          CryptoPulse
        </h1>
        <p style="color: #ccc; margin-bottom: 24px;">
          Root element not found - this is a critical error
        </p>
        <button
          onclick="window.location.reload()"
          style="
            padding: 12px 24px;
            background-color: #4ecdc4;
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
    throw new Error('Root element not found');
  }

  try {
    console.log('📱 Creating React root...');
    const root = createRoot(rootElement);
    
    console.log('🎨 Rendering App component...');
    root.render(
      <React.StrictMode>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </React.StrictMode>
    );
    
    console.log('✅ CryptoPulse app rendered successfully!');
    
    // Remove any loading indicators
    document.body.classList.add('app-loaded');
    const loadingElement = document.querySelector('.app-loading');
    if (loadingElement) {
      loadingElement.remove();
    }
    
  } catch (error) {
    console.error('❌ Fatal error during app initialization:', error);
    rootElement.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100vh;
        padding: 20px;
        font-family: system-ui, -apple-system, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      ">
        <h1 style="color: #ff6b6b; margin-bottom: 16px; font-size: 2rem;">
          CryptoPulse
        </h1>
        <p style="color: #ccc; margin-bottom: 24px;">
          Application Failed to Start: ${error instanceof Error ? error.message : 'Unknown error'}
        </p>
        <button
          onclick="window.location.reload()"
          style="
            padding: 12px 24px;
            background-color: #4ecdc4;
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
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
