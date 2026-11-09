/* Nurse Score PWA Service Worker - v1.4 */
const CACHE_PREFIX = 'nurse-score-';
const CACHE_VERSION = 'v1.4';
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;

const APP_SHELL = [
    './',
    './index.html',
    './manifest.webmanifest',
    './icon.png',
    './icon-192.png',
    './shabnam.ttf',
    './shabnam_bold.ttf'
];

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(APP_SHELL);
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames
                .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
                .map((name) => caches.delete(name))
        );
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const requestUrl = new URL(request.url);
    if (requestUrl.origin !== self.location.origin) return;

    // Always try the network first for page navigation so users receive the latest release.
    if (request.mode === 'navigate') {
        event.respondWith((async () => {
            try {
                const response = await fetch(request);
                if (response && response.ok) {
                    const cache = await caches.open(CACHE_NAME);
                    await cache.put(request, response.clone());
                }
                return response;
            } catch (error) {
                return (await caches.match(request))
                    || (await caches.match(new URL('./index.html', self.registration.scope).href))
                    || Response.error();
            }
        })());
        return;
    }

    // Use the local app shell for fonts and icons, and cache newly fetched same-origin assets.
    event.respondWith((async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;

        try {
            const response = await fetch(request);
            if (response && response.ok) {
                const cache = await caches.open(CACHE_NAME);
                await cache.put(request, response.clone());
            }
            return response;
        } catch (error) {
            return Response.error();
        }
    })());
});
