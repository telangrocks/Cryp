// Enhanced Service Worker v1.0.2
const SW_VERSION = '1.0.2';
const CACHE_NAME = `cryptopulse-cache-v${SW_VERSION}`;
const CACHE_SIZE_LIMIT = 50; // Max cached items to prevent memory issues

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

console.log(`[SW] Loaded version: ${SW_VERSION}`);

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing Service Worker v${SW_VERSION}`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('[SW] Install failed:', err))
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating Service Worker v${SW_VERSION}`);
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - network first, then cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip chrome extensions
  if (request.url.startsWith('chrome-extension://')) return;
  
  // Skip source maps in production
  if (request.url.endsWith('.map')) return;
  
  event.respondWith(
    fetch(request)
      .then(response => {
        // Only cache successful responses
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request)
          .then(response => {
            if (response) {
              console.log('[SW] Serving from cache:', request.url);
              return response;
            }
            
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Limit cache size
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    await cache.delete(keys[0]);
    await limitCacheSize(cacheName, maxSize);
  }
}

// Message handler
self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data.action === 'clearCache') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache cleared');
    });
  }
});