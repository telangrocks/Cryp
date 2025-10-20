import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoadingSpinner from './components/LoadingSpinner';
import Privacy from './pages/Privacy';
import { appConfig } from './config/environment';

// Main Dashboard Component
const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Simulate data loading
    const loadData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setData({ message: 'Welcome to CryptoPulse!' });
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load data:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <LoadingSpinner 
        fullScreen 
        message="Loading CryptoPulse Dashboard..." 
        size="large"
      />
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '40px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        color: 'white'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          marginBottom: '20px',
          textAlign: 'center',
          background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          CryptoPulse
        </h1>
        
        <p style={{
          fontSize: '1.2rem',
          textAlign: 'center',
          marginBottom: '40px',
          opacity: 0.9
        }}>
          AI-Powered Trading Bot | Professional Cryptocurrency Trading Platform
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{ marginBottom: '15px', color: '#4ecdc4' }}>Real-time Analysis</h3>
            <p style={{ opacity: 0.8 }}>Advanced AI algorithms analyze market trends in real-time</p>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{ marginBottom: '15px', color: '#ff6b6b' }}>Automated Trading</h3>
            <p style={{ opacity: 0.8 }}>Execute trades automatically based on market conditions</p>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{ marginBottom: '15px', color: '#45b7d1' }}>Risk Management</h3>
            <p style={{ opacity: 0.8 }}>Comprehensive risk controls and portfolio protection</p>
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
            {data?.message || 'Welcome to CryptoPulse!'}
          </p>
          <p style={{ opacity: 0.8 }}>
            Environment: {appConfig.environment} | API: {appConfig.apiUrl.substring(0, 20)}...
          </p>
        </div>
      </div>
    </div>
  );
};

// Disclaimer Component
const Disclaimer: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: 'white'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '40px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '30px',
          textAlign: 'center',
          color: '#ff6b6b'
        }}>
          Important Disclaimer
        </h1>
        
        <div style={{ fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '30px' }}>
          <p style={{ marginBottom: '20px' }}>
            <strong>Risk Warning:</strong> Cryptocurrency trading involves substantial risk of loss and is not suitable for all investors. 
            The high degree of leverage can work against you as well as for you.
          </p>
          
          <p style={{ marginBottom: '20px' }}>
            <strong>No Financial Advice:</strong> This application is for educational and informational purposes only. 
            It does not constitute financial advice, investment advice, or any other type of advice.
          </p>
          
          <p style={{ marginBottom: '20px' }}>
            <strong>Past Performance:</strong> Past performance is not indicative of future results. 
            Any historical data or performance metrics should not be relied upon as a guarantee of future performance.
          </p>
          
          <p style={{ marginBottom: '20px' }}>
            <strong>Regulatory Compliance:</strong> Please ensure that cryptocurrency trading is legal in your jurisdiction 
            and that you comply with all applicable laws and regulations.
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '15px 30px',
              backgroundColor: '#4ecdc4',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            I Understand - Continue
          </button>
          
          <button
            onClick={() => window.history.back()}
            style={{
              padding: '15px 30px',
              backgroundColor: 'transparent',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

// 404 Not Found Component
const NotFound: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '40px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h1 style={{
          fontSize: '4rem',
          fontWeight: 'bold',
          marginBottom: '20px',
          color: '#ff6b6b'
        }}>
          404
        </h1>
        
        <h2 style={{
          fontSize: '2rem',
          marginBottom: '20px'
        }}>
          Page Not Found
        </h2>
        
        <p style={{
          fontSize: '1.2rem',
          marginBottom: '30px',
          opacity: 0.8
        }}>
          The page you're looking for doesn't exist.
        </p>
        
        <button
          onClick={() => window.location.href = '/'}
          style={{
            padding: '15px 30px',
            backgroundColor: '#4ecdc4',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          Go Home
        </button>
      </div>
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Simulate app initialization
    const initApp = async () => {
      try {
        // Check if we need to show disclaimer
        const hasSeenDisclaimer = localStorage.getItem('cryptopulse-disclaimer-seen');
        
        if (!hasSeenDisclaimer && window.location.pathname === '/') {
          // Redirect to disclaimer on first visit
          window.location.href = '/disclaimer';
          return;
        }
        
        // Mark disclaimer as seen
        if (window.location.pathname === '/disclaimer') {
          localStorage.setItem('cryptopulse-disclaimer-seen', 'true');
        }
        
        // Simulate initialization delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsInitializing(false);
        
      } catch (error) {
        console.error('App initialization error:', error);
        setIsInitializing(false);
      }
    };

    initApp();
  }, []);

  if (isInitializing) {
    return (
      <LoadingSpinner 
        fullScreen 
        message="Initializing CryptoPulse..." 
        size="large"
      />
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
