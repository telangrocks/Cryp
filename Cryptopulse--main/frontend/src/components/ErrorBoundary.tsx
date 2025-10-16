import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log detailed error information
    console.error('🔴 [ErrorBoundary] Caught error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });

    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // if (window.trackError) {
    //   window.trackError({ error, errorInfo });
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDevelopment = import.meta.env.DEV;

      return (
        <div
          style={{
            padding: '20px',
            margin: '20px',
            border: '2px solid #ff4444',
            borderRadius: '8px',
            backgroundColor: '#ffe6e6',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <h2 style={{ color: '#cc0000', marginTop: 0 }}>
            ⚠️ Something went wrong
          </h2>
          <p style={{ marginBottom: '15px' }}>
            We're sorry, but something unexpected happened. Please try refreshing the page.
          </p>

          {isDevelopment && (
            <details style={{ marginBottom: '15px' }}>
              <summary
                style={{
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  padding: '10px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                }}
              >
                🔍 Error Details (Development Only)
              </summary>
              <div style={{ marginTop: '10px', fontSize: '14px' }}>
                <p>
                  <strong>Error:</strong> {this.state.error?.name}
                </p>
                <p>
                  <strong>Message:</strong> {this.state.error?.message}
                </p>
                {this.state.error?.stack && (
                  <>
                    <p>
                      <strong>Stack Trace:</strong>
                    </p>
                    <pre
                      style={{
                        fontSize: '12px',
                        backgroundColor: '#f5f5f5',
                        padding: '10px',
                        overflow: 'auto',
                        maxHeight: '200px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                      }}
                    >
                      {this.state.error.stack}
                    </pre>
                  </>
                )}
                {this.state.errorInfo?.componentStack && (
                  <>
                    <p>
                      <strong>Component Stack:</strong>
                    </p>
                    <pre
                      style={{
                        fontSize: '12px',
                        backgroundColor: '#f5f5f5',
                        padding: '10px',
                        overflow: 'auto',
                        maxHeight: '200px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                      }}
                    >
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </>
                )}
              </div>
            </details>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              🔄 Reload Page
            </button>
            <button
              onClick={this.handleReset}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              ↩️ Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;