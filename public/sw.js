const VERSION = 'ats-v5';
const SHELL = [
  '/', '/index.html', '/offline.html', '/manifest.webmanifest', '/mark.svg',
  '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png', '/404.html', '/404.css',
  '/assets/hero-paper-trace.webp', '/assets/hero-paper-trace-small.webp', '/assets/async-trace-stitcher-social.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(SHELL);
    const response = await fetch('/index.html');
    const html = await response.text();
    const builtAssets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1]);
    await cache.addAll(builtAssets);
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(VERSION).then((cache) => cache.put('/index.html', copy));
      return response;
    }).catch(() => caches.match('/index.html', { ignoreVary: true }).then((cached) => cached || caches.match('/offline.html', { ignoreVary: true }))));
    return;
  }
  event.respondWith(caches.match(event.request, { ignoreVary: true }).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) caches.open(VERSION).then((cache) => cache.put(event.request, response.clone()));
    return response;
  })));
});
