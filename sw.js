const CACHE_NAME = 'urc-ccc-cache-v1';

// Add all the files your app needs to run offline
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/calculator.html',
    '/cost_estimate_scope.html',
    '/labor_resources.html',
    '/contingency_scorecard.html',
    '/admin.html',
    '/history.html',
    '/src/auth.js',
    '/src/nav.js',
    '/src/parser.js',
    '/prices.json',
    '/data/labor_rates.json',
    '/data/concreting_materials.json',
    '/data/timber_formworks.json',
    '/data/roofing.json',
    '/data/steel_truss.json',
    '/data/painting_works.json',
    '/data/electrical.json',
    '/data/masonry.json',
    '/data/fencing.json',
    '/data/ceiling.json',
    '/data/plumbing.json',
    '/data/rebars.json',
    '/data/concrete_mix.json',
    '/data/equipment.json',
    '/data/pipes.json',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    'https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js'
];

// Install Event: Cache all critical assets — one failure won't sink the rest
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Caching offline assets...');
            return Promise.all(
                ASSETS_TO_CACHE.map(url =>
                    cache.add(url).catch(err => console.warn('Skipped caching:', url, err))
                )
            );
        })
    );
    self.skipWaiting();
});

// Activate Event: Clean up old caches if we update the version
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch Event: Network-First Strategy (Falls back to cache if offline)
self.addEventListener('fetch', event => {
    // Only intercept GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request).then(networkResponse => {
            // If online, return fresh data and update the cache silently
            return caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
            });
        }).catch(() => {
            // If completely offline, return the cached version
            return caches.match(event.request);
        })
    );
});