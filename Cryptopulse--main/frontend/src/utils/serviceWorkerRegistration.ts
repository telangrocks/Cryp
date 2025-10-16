/**
 * Service Worker Registration with Enhanced Error Handling
 */

export const registerServiceWorker = async (): Promise<void> => {
  // Only register in production
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service Workers not supported in this browser');
    return;
  }

  if (import.meta.env.DEV) {
    console.log('[SW] Skipping service worker registration in development');
    return;
  }

  try {
    // Wait for page load
    await new Promise<void>((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', () => resolve());
      }
    });

    console.log('[SW] Registering service worker...');

    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });

    console.log('✅ [SW] Service Worker registered successfully:', {
      scope: registration.scope,
      state: registration.active?.state,
    });

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('[SW] Update found, installing new version...');

      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          console.log('[SW] State changed to:', newWorker.state);

          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('✅ [SW] New version installed, will activate on next page load');
            
            // Optionally notify user about update
            // showUpdateNotification();
          }

          if (newWorker.state === 'activated') {
            console.log('✅ [SW] New version activated');
          }
        });
      }
    });

    // Check for updates periodically (every hour)
    setInterval(() => {
      registration.update().catch((err) => {
        console.warn('[SW] Update check failed:', err);
      });
    }, 60 * 60 * 1000);

  } catch (error) {
    console.error('❌ [SW] Service Worker registration failed:', error);
  }
};

export const unregisterServiceWorker = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    for (const registration of registrations) {
      await registration.unregister();
      console.log('[SW] Service Worker unregistered');
    }
  } catch (error) {
    console.error('[SW] Error unregistering service worker:', error);
  }
};
