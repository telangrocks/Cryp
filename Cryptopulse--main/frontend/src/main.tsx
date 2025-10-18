import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('🚀 Starting ultra-minimal CryptoPulse app...');

// Get root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('❌ Root element not found!');
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

// Create root and render app
try {
  console.log('📱 Creating React root...');
  const root = ReactDOM.createRoot(rootElement);
  
  console.log('🎨 Rendering App component...');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  console.log('✅ Ultra-minimal app rendered successfully!');
  
} catch (error) {
  console.error('❌ Fatal error during app initialization:', error);
  
  // Emergency fallback UI
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


