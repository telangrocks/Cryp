import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

// Simplified error handling
const handleError = (error: Error) => {
  console.error('Application error:', error);
  if (import.meta.env.PROD) {
    // Simple error reporting
    try {
      const errorUrl = import.meta.env.VITE_ERROR_URL;
      if (errorUrl) {
        fetch(errorUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: { message: error.message, stack: error.stack, name: error.name },
            timestamp: new Date().toISOString(),
            url: window.location.href,
          }),
        }).catch(() => {});
      }
    } catch (e) {
      // Silent fail
    }
  }
};
// Simplified error UI creator
function createErrorUI(error: Error): void {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;
  
  const errorContainer = document.createElement('div');
  errorContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem;
    text-align: center;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f8fafc;
    color: #1e293b;
  `;

  const errorCard = document.createElement('div');
  errorCard.style.cssText = `
    max-width: 600px;
    width: 100%;
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    border: 1px solid #e5e7eb;
  `;

  const title = document.createElement('h1');
  title.style.cssText = `
    color: #dc2626;
    margin-bottom: 1rem;
    font-size: 1.5rem;
    font-weight: 600;
  `;
  title.textContent = 'Something went wrong';

  const message = document.createElement('p');
  message.style.cssText = `
    margin-bottom: 2rem;
    color: #6b7280;
    font-size: 1rem;
  `;
  message.textContent = 'We apologize for the inconvenience. Please try refreshing the page.';

  const reloadButton = document.createElement('button');
  reloadButton.textContent = 'Reload Application';
  reloadButton.style.cssText = `
    background: #3b82f6;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
  `;
  reloadButton.onclick = () => window.location.reload();

  errorCard.appendChild(title);
  errorCard.appendChild(message);
  errorCard.appendChild(reloadButton);
  errorContainer.appendChild(errorCard);
  rootElement.appendChild(errorContainer);
}
// Initialize the app with simplified error handling
function initializeApp(): void {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    const error = new Error('Root element not found. Please check the HTML structure.');
    handleError(error);
    createErrorUI(error);
    return;
  }
  
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (error) {
    const appError = error instanceof Error ? error : new Error(String(error));
    handleError(appError);
    createErrorUI(appError);
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
