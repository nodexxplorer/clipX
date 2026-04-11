/**
 * Service Worker for clipX PWA
 * Provides offline caching, background sync queue, and offline progress tracking
 */

const CACHE_NAME = 'clipx-v2';
const STATIC_ASSETS = [
    '/',
    '/offline',
    '/favicon.ico',
    '/manifest.json',
];

// Assets to precache on install
const PRECACHE_URLS = [
    '/icons/icon-192.png',
    '/icons/icon-512.png',
];

// ── Install — cache static assets ────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([...STATIC_ASSETS, ...PRECACHE_URLS].map(url => {
                return new Request(url, { cache: 'reload' });
            })).catch(() => {
                // Some assets might not exist yet — that's OK
                return cache.addAll(STATIC_ASSETS);
            });
        })
    );
    self.skipWaiting();
});

// ── Activate — clean old caches ──────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(
                names
                    .filter((name) => name !== CACHE_NAME && name.startsWith('clipx-'))
                    .map((name) => caches.delete(name))
            )
        )
    );
    self.clients.claim();
});

// ── Fetch — network-first with cache fallback ────────────────
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
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(request).then((cached) => {
                        return cached || caches.match('/offline');
                    });
                })
        );
        return;
    }

    // For static assets, use cache-first with network update
    if (url.pathname.match(/\.(js|css|png|jpg|jpeg|webp|svg|ico|woff2?)$/)) {
        event.respondWith(
            caches.match(request).then((cached) => {
                // Return cached immediately, but also update cache in background
                const networkFetch = fetch(request).then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                }).catch(() => {});

                return cached || networkFetch;
            })
        );
        return;
    }

    // For images (movie posters etc), cache-first
    if (url.pathname.match(/\.(jpg|jpeg|png|webp|gif|avif)$/) || url.hostname.includes('image.tmdb.org')) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                }).catch(() => new Response('', { status: 404 }));
            })
        );
    }
});

// ── Background Sync — replay queued mutations when back online ──
// The frontend queues failed GraphQL mutations in IndexedDB
// When the browser comes back online, this replays them

self.addEventListener('sync', (event) => {
    if (event.tag === 'clipx-sync-progress') {
        event.waitUntil(replayProgressQueue());
    }
});

async function replayProgressQueue() {
    try {
        // Open IndexedDB to read queued mutations
        const db = await openSyncDB();
        const tx = db.transaction('sync_queue', 'readwrite');
        const store = tx.objectStore('sync_queue');
        const items = await idbGetAll(store);

        for (const item of items) {
            try {
                const response = await fetch('/graphql', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'include',
                    body: JSON.stringify(item.payload),
                });
                if (response.ok) {
                    // Remove from queue on success
                    const deleteTx = db.transaction('sync_queue', 'readwrite');
                    deleteTx.objectStore('sync_queue').delete(item.id);
                }
            } catch {
                // Still offline — will retry on next sync event
                break;
            }
        }
    } catch {
        // IndexedDB not available — skip
    }
}

function openSyncDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('clipx_sync', 1);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('sync_queue')) {
                db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function idbGetAll(store) {
    return new Promise((resolve) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
    });
}

// ── Message handler — accept cache commands from the main app ──
self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data?.type === 'CACHE_URLS') {
        const urls = event.data.urls || [];
        caches.open(CACHE_NAME).then(cache => {
            cache.addAll(urls).catch(() => {});
        });
    }
});
