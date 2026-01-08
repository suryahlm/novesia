// Novesia Service Worker
const CACHE_NAME = 'novesia-v1'
const urlsToCache = [
    '/',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
]

// Install event - cache essential files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName)
                    }
                })
            )
        }).then(() => self.clients.claim())
    )
})

// Fetch event - network first, fall back to cache
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return

    // Skip API requests
    if (event.request.url.includes('/api/')) return

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone response to cache
                if (response.status === 200) {
                    const responseClone = response.clone()
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone)
                    })
                }
                return response
            })
            .catch(() => {
                // Fallback to cache
                return caches.match(event.request)
            })
    )
})
