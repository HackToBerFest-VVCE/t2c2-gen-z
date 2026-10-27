const CACHE_NAME = 'fieldpilot-cache-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Pre-cache assets safely without failing the entire installation if one network request hiccups
      const cachePromises = STATIC_ASSETS.map(async (asset) => {
        try {
          const response = await fetch(asset, { cache: 'reload' });
          if (response && response.ok) {
            await cache.put(asset, response);
          }
        } catch (err) {
          console.warn(`[FieldPilot SW] Failed to pre-cache ${asset}:`, err);
        }
      });
      await Promise.all(cachePromises);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Parse URL safely
  let requestUrl;
  try {
    requestUrl = new URL(event.request.url);
  } catch {
    return;
  }

  // Do not intercept API requests (let network or offline DB handlers manage them)
  if (requestUrl.pathname.startsWith('/api') || requestUrl.pathname.includes('/api/')) {
    return;
  }

  // Do not intercept cross-origin requests (e.g. external APIs, fonts, Ollama on localhost)
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          // Cache valid same-origin assets
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (networkResponse.type === 'basic' || networkResponse.type === 'default')
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback to cached index.html for SPA client-side routing
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }

          // Return empty 404 response rather than returning undefined which triggers net::ERR_FAILED
          return new Response(null, {
            status: 404,
            statusText: 'Offline Asset Not Cached'
          });
        });
    })
  );
});
