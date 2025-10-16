// Enhanced Service Worker v1.0.1
const SW_VERSION = '1.0.1';
const CACHE_NAME = `cryptopulse-cache-v${SW_VERSION}`;

console.log(`[SW] Loaded version: ${SW_VERSION}`);

// Install event
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing version ${SW_VERSION}`);
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating version ${SW_VERSION}`);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log(`[SW] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Enhanced fetch event handler with proper error handling
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  event.respondWith(
    handleRequest(request).catch((error) => {
      console.error(`[SW] Error handling request for ${request.url}:`, error);
      return new Response('Service Worker Error', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
          'Content-Type': 'text/plain',
        }),
      });
    })
  );
});

async function handleRequest(request) {
  const url = new URL(request.url);

  try {
    // Special handling for favicon
    if (url.pathname.includes('favicon.ico')) {
      return handleFavicon(request);
    }

    // Create abort controller with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort('Request timeout after 10 seconds');
    }, 10000);

    try {
      // Attempt network fetch with abort signal
      const fetchOptions = {
        signal: controller.signal,
        credentials: 'same-origin',
        mode: 'cors',
      };

      const networkResponse = await fetch(request.clone(), fetchOptions);
      clearTimeout(timeoutId);

      // Cache successful responses
      if (networkResponse.ok && networkResponse.status === 200) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone()).catch((err) => {
          console.warn(`[SW] Failed to cache ${request.url}:`, err);
        });
      }

      return networkResponse;

    } catch (fetchError) {
      clearTimeout(timeoutId);

      // Handle AbortError gracefully
      if (fetchError.name === 'AbortError') {
        console.warn(
          `[SW] Request aborted: ${request.url}`,
          fetchError.message || 'User navigation or timeout'
        );
      } else {
        console.warn(`[SW] Network fetch failed for ${request.url}:`, fetchError);
      }

      // Try to serve from cache
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        console.log(`[SW] Serving from cache: ${request.url}`);
        return cachedResponse;
      }

      // If no cache, rethrow error
      throw fetchError;
    }
  } catch (error) {
    console.error(`[SW] Error in handleRequest for ${request.url}:`, error);
    throw error;
  }
}

async function handleFavicon(request) {
  try {
    // Try cache first for favicon
    const cachedFavicon = await caches.match(request);
    if (cachedFavicon) {
      return cachedFavicon;
    }

    // Try network with short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort('Favicon timeout'), 3000);

    try {
      const response = await fetch(request, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        // Cache favicon
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
        return response;
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.warn(`[SW] Favicon fetch failed, returning 204:`, fetchError.message);
    }

    // Return empty response if favicon fails
    return new Response(null, {
      status: 204,
      statusText: 'No Content',
      headers: new Headers({
        'Content-Type': 'image/x-icon',
      }),
    });
  } catch (error) {
    console.error(`[SW] Error handling favicon:`, error);
    return new Response(null, { status: 204 });
  }
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});