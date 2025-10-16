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
  additional?: Record<string, any>;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private errorQueue: ErrorDetails[] = [];
  private maxQueueSize = 50;

  private constructor() {
    this.setupGlobalHandlers();
  }

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  private setupGlobalHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error: ErrorDetails = {
        timestamp: new Date().toISOString(),
        type: 'UnhandledPromiseRejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        additional: {
          promise: 'Promise rejection',
        },
      };

      this.logError(error);

      // Prevent default browser console error
      event.preventDefault();
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      const error: ErrorDetails = {
        timestamp: new Date().toISOString(),
        type: 'GlobalError',
        message: event.message,
        stack: event.error?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        additional: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      };

      this.logError(error);
    });

    // Override console.error for structured logging
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      // Call original console.error
      originalConsoleError.apply(console, args);

      // Log structured error
      try {
        const errorMessage = args
          .map((arg) =>
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          )
          .join(' ');

        const error: ErrorDetails = {
          timestamp: new Date().toISOString(),
          type: 'ConsoleError',
          message: errorMessage,
          url: window.location.href,
          userAgent: navigator.userAgent,
        };

        this.logError(error, false); // Don't double-log to console
      } catch (loggingError) {
        originalConsoleError('Error in custom error logger:', loggingError);
      }
    };
  }

  private logError(error: ErrorDetails, logToConsole = true): void {
    // Add to queue
    this.errorQueue.push(error);

    // Maintain queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // Log to console with structure
    if (logToConsole) {
      console.error('🔴 [Structured Error]:', error);
    }

    // TODO: Send to error tracking service
    // this.sendToErrorTracking(error);
  }

  public getErrors(): ErrorDetails[] {
    return [...this.errorQueue];
  }

  public clearErrors(): void {
    this.errorQueue = [];
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
  ErrorLogger.getInstance();
  console.log('✅ [ErrorLogger] Global error handlers initialized');
};

export const getErrorLogger = (): ErrorLogger => {
  return ErrorLogger.getInstance();
};
