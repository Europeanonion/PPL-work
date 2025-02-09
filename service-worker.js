const CACHE_NAME = 'workout-app-cache-v1';
const DYNAMIC_CACHE = 'workout-dynamic-v1';
const STATIC_ASSETS = [
    '/',
    '/src/index.html',
    '/src/css/style.css',
    '/src/js/app.js',
    '/src/js/db.js',
    '/src/js/workout.js',
    '/src/data/program.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return Promise.all(
                    STATIC_ASSETS.map(url => {
                        return fetch(url)
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error(`Failed to fetch ${url}`);
                                }
                                return cache.put(url, response);
                            })
                            .catch(error => {
                                console.error(`Failed to cache ${url}:`, error);
                            });
                    })
                );
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME && key !== DYNAMIC_CACHE)
                    .map(key => caches.delete(key))
            );
        })
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Handle JSON files with network-first strategy
    if (url.pathname.endsWith('.json')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clonedResponse = response.clone();
                    caches.open(DYNAMIC_CACHE)
                        .then(cache => cache.put(event.request, clonedResponse));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Handle other requests with cache-first strategy
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            return cachedResponse || fetch(event.request).then(response => {
                return caches.open(DYNAMIC_CACHE).then(cache => {
                    cache.put(event.request.url, response.clone());
                    return response;
                });
            });
        })
    );
});
