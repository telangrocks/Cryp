import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import React from 'react';

// Simple App component that works without complex dependencies
const SimpleApp = () => {
  const [apiStatus, setApiStatus] = React.useState<string>('Checking...');
  
  React.useEffect(() => {
    // Test backend connectivity
    const testBackend = async () => {
      try {
        const response = await fetch('https://cryptopulse-backend-j4ne.onrender.com/health');
        if (response.ok) {
          const data = await response.json();
          setApiStatus(`✅ Backend healthy: ${data.status}`);
        } else {
          setApiStatus(`❌ Backend error: ${response.status}`);
        }
      } catch (error) {
        setApiStatus(`❌ Backend unreachable: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    
    testBackend();
  }, []);

  return (
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
      <div style={{
        maxWidth: '600px',
        width: '100%',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '1rem',
        padding: '2rem',
        textAlign: 'center',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
          🚀 CryptoPulse
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.9 }}>
          AI-Powered Cryptocurrency Trading Platform
        </p>
        
        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Backend Status</h3>
          <p style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{apiStatus}</p>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h4 style={{ marginBottom: '0.5rem' }}>📊 Trading</h4>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Real-time market data and AI-powered trading strategies</p>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h4 style={{ marginBottom: '0.5rem' }}>🤖 AI Assistant</h4>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Intelligent market analysis and trading recommendations</p>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h4 style={{ marginBottom: '0.5rem' }}>💳 Payments</h4>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Secure payment processing with Cashfree integration</p>
          </div>
        </div>
        
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
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          🔄 Refresh Status
        </button>
        
        <p style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.7 }}>
          Version 2.0.0 | Frontend deployed successfully on Render
        </p>
      </div>
    </div>
  );
};

// Initialize the app
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <SimpleApp />
  </StrictMode>
);

