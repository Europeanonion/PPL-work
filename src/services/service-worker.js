/// <reference lib="webworker" />

const CACHE_NAME = 'workout-app-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/src/css/style.css',
    '/src/js/app.js',
    '/src/js/db.js',
    '/src/js/utils.js',
    '/src/js/workout.js',
    '/src/data/push1.json',
    '/src/data/push2.json',
    '/src/data/push3.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS_TO_CACHE))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
