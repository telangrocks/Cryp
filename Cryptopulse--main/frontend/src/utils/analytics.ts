interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

class Analytics {
  private static instance: Analytics;
  private enabled: boolean = false;

  private constructor() {
    this.enabled = import.meta.env.PROD && 
                   import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
  }

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  trackPageView(path: string): void {
    if (!this.enabled) return;

    console.log('[Analytics] Page view:', path);
    // TODO: Implement your analytics provider (GA4, Mixpanel, etc.)
    // Example for GA4:
    // gtag('event', 'page_view', { page_path: path });
  }

  trackEvent(event: AnalyticsEvent): void {
    if (!this.enabled) return;

    console.log('[Analytics] Event:', event);
    // TODO: Implement your analytics provider
    // Example for GA4:
    // gtag('event', event.action, {
    //   event_category: event.category,
    //   event_label: event.label,
    //   value: event.value,
    // });
  }

  trackError(error: Error, context?: Record<string, any>): void {
    if (!this.enabled) return;

    console.log('[Analytics] Error:', error, context);
    // TODO: Send to error tracking service (Sentry, LogRocket)
  }
}

export const analytics = Analytics.getInstance();
export default analytics;
