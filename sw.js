
const CACHE_NAME = 'kelvin-fitness-forever-v2';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './index.tsx',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png'
];

// Install event: cache the application shell.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Activate event: clean up old caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event: serve content using a stale-while-revalidate strategy.
self.addEventListener('fetch', event => {
  // Ignore non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        // Fetch the latest version from the network in the background.
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // If we receive a valid response, update the cache.
          // We check for status 200 on basic responses, and allow caching of opaque/cors responses from CDNs
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type !== 'basic')) {
             cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(err => {
            console.error('Fetch failed; user is likely offline.', err);
        });

        // Return the cached response immediately if available, otherwise wait for the network response.
        return response || fetchPromise;
      });
    })
  );
});