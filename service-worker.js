const CACHE_NAME = 'denver-ebike-navigator-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  // Note: Main scripts like index.tsx are handled by the fetch handler, not precached
];

// Install event: opens a cache and adds the app shell files to it.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Failed to cache app shell during install:', error);
      })
  );
});

// Stale-while-revalidate strategy
const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then(networkResponse => {
    // Check if we received a valid response
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });

  // Return cached response immediately if available, and then update the cache
  return cachedResponse || fetchPromise;
};

// Fetch event: Apply caching strategies.
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Use stale-while-revalidate for navigation and local assets
  if (request.mode === 'navigate' || url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // For third-party assets (like fonts, Leaflet, Tailwind, Firebase),
  // use stale-while-revalidate to ensure offline availability.
  if (
    url.origin === 'https://cdn.tailwindcss.com' ||
    url.origin === 'https://unpkg.com' ||
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com' ||
    url.origin.includes('firebase') || url.origin.includes('gstatic.com')
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  
  // For all other requests, just fetch from the network.
  event.respondWith(fetch(request));
});


// Activate event: cleans up old caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Delete old cache
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});