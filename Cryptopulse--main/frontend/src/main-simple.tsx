import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { SimpleErrorBoundary } from './components/SimpleErrorBoundary';

// Simple error handler
const handleError = (error: Error) => {
  console.error('Application error:', error);
};

// Initialize the app with simple error handling
function initializeApp(): void {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }
  
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <SimpleErrorBoundary>
          <App />
        </SimpleErrorBoundary>
      </StrictMode>,
    );
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
}

// Set up global error handlers
window.addEventListener('error', (event) => {
  handleError(event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  handleError(new Error(event.reason));
});

// Start the application
initializeApp();

