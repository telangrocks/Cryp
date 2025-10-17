/**
 * Enhanced Error Logging Utility
 * Captures and logs errors with structured data
 */

interface ErrorDetails {
  timestamp: string;
  type: string;
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  componentStack?: string;
  additional?: Record<string, any>;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private errorQueue: ErrorDetails[] = [];
  private maxQueueSize = 100;

  private constructor() {
    this.setupGlobalHandlers();
  }

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  private extractErrorMessage(error: any): string {
    if (error instanceof Error) {
      return error.message || error.toString();
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object') {
      return JSON.stringify(error);
    }
    return String(error);
  }

  private setupGlobalHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error: ErrorDetails = {
        timestamp: new Date().toISOString(),
        type: 'UnhandledPromiseRejection',
        message: this.extractErrorMessage(event.reason),
        stack: event.reason?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        additional: {
          reason: event.reason,
        },
      };

      this.logError(error);
      console.error('🔴 [Unhandled Promise Rejection]:', error);

      // Prevent default to avoid duplicate console errors
      event.preventDefault();
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      const error: ErrorDetails = {
        timestamp: new Date().toISOString(),
        type: 'GlobalError',
        message: event.message || this.extractErrorMessage(event.error),
        stack: event.error?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        additional: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error,
        },
      };

      this.logError(error);
      console.error('🔴 [Global Error]:', error);
    });

    // Override console.error for structured logging
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      // Call original console.error first
      originalConsoleError.apply(console, args);

      try {
        // Extract meaningful error message
        let errorMessage = '';
        let errorStack = '';

        args.forEach((arg, index) => {
          if (arg instanceof Error) {
            errorMessage = arg.message || arg.toString();
            errorStack = arg.stack || '';
          } else if (typeof arg === 'object') {
            try {
              errorMessage += JSON.stringify(arg, null, 2) + ' ';
            } catch {
              errorMessage += String(arg) + ' ';
            }
          } else {
            errorMessage += String(arg) + ' ';
          }
        });

        const error: ErrorDetails = {
          timestamp: new Date().toISOString(),
          type: 'ConsoleError',
          message: errorMessage.trim(),
          stack: errorStack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          additional: {
            args: args,
          },
        };

        this.logError(error, false);
      } catch (loggingError) {
        originalConsoleError('Error in custom error logger:', loggingError);
      }
    };

    console.log('✅ [ErrorLogger] Global error handlers initialized');
  }

  private logError(error: ErrorDetails, logToConsole = true): void {
    // Add to queue
    this.errorQueue.push(error);

    // Maintain queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // Log structured error
    if (logToConsole) {
      console.group('🔴 [Structured Error]');
      console.error('Type:', error.type);
      console.error('Message:', error.message);
      if (error.stack) {
        console.error('Stack:', error.stack);
      }
      console.error('URL:', error.url);
      console.error('Timestamp:', error.timestamp);
      if (error.additional) {
        console.error('Additional:', error.additional);
      }
      console.groupEnd();
    }

    // TODO: Send to error tracking service
    // this.sendToErrorTracking(error);
  }

  public getErrors(): ErrorDetails[] {
    return [...this.errorQueue];
  }

  public clearErrors(): void {
    this.errorQueue = [];
    console.log('[ErrorLogger] Error queue cleared');
  }

  public getLatestError(): ErrorDetails | null {
    return this.errorQueue[this.errorQueue.length - 1] || null;
  }

  // Export errors for debugging
  public exportErrors(): string {
    return JSON.stringify(this.errorQueue, null, 2);
  }

  // Placeholder for error tracking integration
  private sendToErrorTracking(error: ErrorDetails): void {
    // TODO: Implement Sentry, LogRocket, or custom error tracking
    // Example:
    // if (window.Sentry) {
    //   window.Sentry.captureException(error);
    // }
  }
}

export const setupErrorLogging = (): void => {
  const logger = ErrorLogger.getInstance();
  console.log('✅ [ErrorLogger] Initialized successfully');
  
  // Make logger available globally for debugging
  if (typeof window !== 'undefined') {
    (window as any).__errorLogger = logger;
    console.log('💡 Debug tip: Access error logger via window.__errorLogger');
  }
};

export const getErrorLogger = (): ErrorLogger => {
  return ErrorLogger.getInstance();
};
