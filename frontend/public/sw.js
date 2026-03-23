/**
 * Service Worker for clipX PWA
 * Provides offline caching and background sync
 */

const CACHE_NAME = 'clipx-v1';
const STATIC_ASSETS = [
    '/',
    '/offline',
    '/favicon.ico',
];

// Install — cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(
                names
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            )
        )
    );
    self.clients.claim();
});

// Fetch — network-first with cache fallback
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests and API calls
    if (request.method !== 'GET') return;
    if (url.pathname.startsWith('/api') || url.pathname.startsWith('/graphql')) return;

    // For navigation requests (HTML pages), use network-first
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache successful responses
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() => {
                    // Offline fallback
                    return caches.match(request).then((cached) => {
                        return cached || caches.match('/offline');
                    });
                })
        );
        return;
    }

    // For static assets, use cache-first
    if (
        url.pathname.match(/\.(js|css|png|jpg|jpeg|webp|svg|ico|woff2?)$/)
    ) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                });
            })
        );
    }
});
