/**
 * Service Worker Registration with Enhanced Error Handling
 */

export const registerServiceWorker = async (): Promise<void> => {
  // Only register in production
  if (!('serviceWorker' in navigator)) {
    
    return;
  }

  if (import.meta.env.DEV) {
    
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

    

    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });

    

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      

      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          

          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            
            
            // Optionally notify user about update
            // showUpdateNotification();
          }

          if (newWorker.state === 'activated') {
            
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
      
    }
  } catch (error) {
    console.error('[SW] Error unregistering service worker:', error);
  }
};


