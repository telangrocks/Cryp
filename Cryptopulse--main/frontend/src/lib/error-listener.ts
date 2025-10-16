type DevLogPayload = {
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  name?: string;
  url: string;
  userAgent?: string;
  timestamp: string;
  extra?: Record<string, unknown>;
};

function safeString(value: unknown, maxLen = 2000): string {
  try {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    return str.slice(0, maxLen);
  } catch {
    return String(value).slice(0, maxLen);
  }
}

async function postDevLog(payload: DevLogPayload): Promise<void> {
  try {
    const base = (import.meta as any).env?.VITE_API_BASE_URL || '';
    const endpoint = `${base}/api/dev-log`.replace(/\/+api/, '/api');
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
      // ignore CORS errors silently
    }).catch(() => {});
  } catch {
    // ignore
  }
}

function buildPayload(level: 'error' | 'warn' | 'info', err: unknown, extra?: Record<string, unknown>): DevLogPayload {
  const asError = err instanceof Error ? err : new Error(safeString(err, 512));
  return {
    level,
    message: safeString(asError.message, 1000),
    stack: asError.stack ? safeString(asError.stack, 5000) : undefined,
    name: asError.name,
    url: typeof window !== 'undefined' ? window.location.href : 'n/a',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 256) : undefined,
    timestamp: new Date().toISOString(),
    extra,
  };
}

export function initializeErrorListener(): void {
  if (typeof window === 'undefined') return;

  // Global error
  window.addEventListener('error', (event) => {
    const payload = buildPayload('error', event.error || event.message, { source: 'window.error' });
    postDevLog(payload);
  });

  // Unhandled promise rejection
  window.addEventListener('unhandledrejection', (event) => {
    const reason = (event as any).reason ?? 'unhandledrejection';
    const payload = buildPayload('error', reason, { source: 'window.unhandledrejection' });
    postDevLog(payload);
  });

  // Patch console.error to also report
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    try {
      const payload = buildPayload('error', args[0], { source: 'console.error', args: args.slice(1) });
      postDevLog(payload);
    } catch {
      // ignore
    }
    originalConsoleError.apply(console, args as any);
  };
}

// Auto-initialize in production
try {
  if ((import.meta as any).env?.PROD) {
    initializeErrorListener();
  }
} catch {
  // ignore
}


