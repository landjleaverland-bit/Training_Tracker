/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

const ASSETS = [
    ...build, // the app itself
    ...files  // everything in `static`
];

const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener('install', (event: ExtendableEvent) => {
    // Create a new cache and add all files to it
    async function addFilesToCache() {
        const cache = await caches.open(CACHE);
        await cache.addAll(ASSETS);
    }

    event.waitUntil(addFilesToCache());
    sw.skipWaiting();
});

sw.addEventListener('activate', (event: ExtendableEvent) => {
    // Remove previous caches
    async function deleteOldCaches() {
        for (const key of await caches.keys()) {
            if (key !== CACHE) await caches.delete(key);
        }
    }

    event.waitUntil(deleteOldCaches());
    sw.clients.claim();
});

sw.addEventListener('fetch', (event: FetchEvent) => {
    // ignore POST requests etc
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Ignore non-http protocols (like chrome-extension://)
    if (!url.protocol.startsWith('http')) return;

    // Skip Firebase/Firestore API calls - always go to network
    if (event.request.url.includes('firestore.googleapis.com') ||
        event.request.url.includes('firebase') ||
        event.request.url.includes('googleapis.com')) {
        return;
    }

    async function respond() {
        const url = new URL(event.request.url);
        const cache = await caches.open(CACHE);

        // Serve build assets from the cache
        if (ASSETS.includes(url.pathname)) {
            const response = await cache.match(event.request);
            if (response) return response;
        }

        // For everything else, try the network first, but
        // fall back to the cache if we're offline
        try {
            const response = await fetch(event.request);

            if (response.status === 200) {
                cache.put(event.request, response.clone());
            }

            return response;
        } catch {
            const cachedResponse = await cache.match(event.request);
            if (cachedResponse) return cachedResponse;

            // Fallback for navigation requests
            if (event.request.mode === 'navigate') {
                // Try multiple fallbacks for the SPA entry point
                const fallbackUrls = [
                    '/Training_Tracker/',
                    '/Training_Tracker/index.html',
                    '/'
                ];

                for (const fallback of fallbackUrls) {
                    const fallbackResponse = await cache.match(fallback);
                    if (fallbackResponse) return fallbackResponse;
                }
            }

            // Return a fallback response to prevent "Failed to convert value to 'Response'" error
            return new Response('Offline', { status: 404, statusText: 'Offline' });
        }
    }

    event.respondWith(respond());
});
