const VERSION = '3.0.1';
const CACHE_NAME = `kalpana-cache-v${VERSION}`;
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './shield.js?v=3.0.1',
  './icon-192.png',
  './icon-512.png',
  './icon-1024.png'
];

// Install event: Cache the essentials
self.addEventListener('install', (event) => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Kalpanā: Caching Core Essentials...');
      // We use map to cache individually so one missing file doesn't break the whole app
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => cache.add(url))
      );
    })
  );
});

// Activate event: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        return self.clients.claim(); 
    })
  );
});

// Fetch event: Network-first for dynamic updates, fallback to cache
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/__/auth/')) return;

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
