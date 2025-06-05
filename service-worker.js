const CACHE_NAME = 'immersio-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/src/main.ts',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
