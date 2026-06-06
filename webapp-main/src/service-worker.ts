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

// =============================================================================
// TIMER STATE (Service Worker managed for reliable background execution)
// =============================================================================
interface TimerState {
    phase: 'SETUP' | 'WORK' | 'REST' | 'FINISHED';
    runningState: 'RUNNING' | 'PAUSED';
    endTimestamp: number | null;
    remaining: number;
    currentSet: number;
    configSets: number;
    configWork: number;
    configRest: number;
    allowOvertime: boolean;
    overtimeTriggered: boolean;
    associatedExerciseId?: string | null;
    mode?: 'INTERVAL' | 'REST_ONLY';
}

const TIMER_CACHE_NAME = 'rest-timer-state-v1';
const TIMER_STATE_URL = 'http://localhost/timer-state';

async function saveSWTimerState(state: TimerState | null) {
    try {
        const cache = await caches.open(TIMER_CACHE_NAME);
        if (state) {
            await cache.put(TIMER_STATE_URL, new Response(JSON.stringify(state)));
        } else {
            await cache.delete(TIMER_STATE_URL);
        }
    } catch (err) {
        console.error('Failed to save timer state to cache:', err);
    }
}

async function restoreSWTimerState(): Promise<TimerState | null> {
    try {
        const cache = await caches.open(TIMER_CACHE_NAME);
        const response = await cache.match(TIMER_STATE_URL);
        if (response) {
            return await response.json();
        }
    } catch (err) {
        console.error('Failed to restore timer state from cache:', err);
    }
    return null;
}

let timerState: TimerState | null = null;
let timerIntervalId: ReturnType<typeof setInterval> | null = null;

async function ensureInitialized() {
    if (timerState === null) {
        const restored = await restoreSWTimerState();
        if (restored) {
            timerState = restored;
            if (timerState.runningState === 'RUNNING' && timerState.endTimestamp) {
                const now = Date.now();
                const diff = timerState.endTimestamp - now;
                timerState.remaining = Math.ceil(diff / 1000);
                startTimerInterval();
            } else {
                stopTimerInterval();
            }
        }
    }
}

function formatTime(s: number): string {
    const m = Math.floor(Math.abs(s) / 60);
    const sec = Math.abs(s) % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

function showTimerNotification(vibrate = false) {
    if (!timerState || timerState.phase === 'SETUP' || timerState.phase === 'FINISHED') return;

    if (!('showNotification' in sw.registration)) return;

    const status = timerState.mode === 'REST_ONLY' ? 'Rest' : (timerState.phase === 'WORK' ? 'Work' : 'Rest');
    const setInfo = `[Set ${timerState.currentSet}/${timerState.configSets}]`;
    const label = timerState.remaining < 0 ? 'Overtime' : 'Remaining';
    const text = `${label}: ${formatTime(timerState.remaining)}`;

    const actions = timerState.runningState === 'RUNNING'
        ? [{ action: 'pause', title: '⏸ Pause' }, { action: 'finish-session', title: '🏁 Finish' }]
        : [{ action: 'resume', title: '▶ Resume' }, { action: 'finish-session', title: '🏁 Finish' }];

    try {
        sw.registration.showNotification(`${status} Timer ${setInfo}`, {
            body: text,
            icon: '/favicon.png',
            vibrate: vibrate ? [200, 100, 200] : [],
            actions,
            tag: 'rest-timer',
            renotify: vibrate,
            silent: !vibrate
        } as NotificationOptions);
    } catch (err) {
        console.error('showNotification error:', err);
    }
}

function broadcastTimerState() {
    sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        clients.forEach(client => {
            client.postMessage({ type: 'TIMER_STATE_UPDATE', state: timerState });
        });
    });
}

function timerTick() {
    if (!timerState || timerState.runningState !== 'RUNNING') return;

    if (timerState.endTimestamp) {
        const now = Date.now();
        const diff = timerState.endTimestamp - now;
        timerState.remaining = Math.ceil(diff / 1000);

        // Check for phase completion
        if (timerState.remaining <= 0 && !timerState.overtimeTriggered) {
            timerState.overtimeTriggered = true;

            if (!timerState.allowOvertime) {
                // Move to next phase
                handlePhaseComplete();
                return;
            } else {
                // Show overtime alert
                showTimerNotification(true);
            }
        }

        // Update notification every second
        showTimerNotification(false);
        saveSWTimerState(timerState);
        broadcastTimerState();
    }
}

function handlePhaseComplete() {
    if (!timerState) return;

    if (timerState.mode === 'REST_ONLY') {
        if (timerState.currentSet >= timerState.configSets) {
            timerState.phase = 'FINISHED';
            timerState.runningState = 'PAUSED';
            timerState.endTimestamp = null;
            stopTimerInterval();
            if ('showNotification' in sw.registration) {
                try {
                    sw.registration.showNotification('Session Complete', {
                        body: 'Nicely Done!',
                        icon: '/favicon.png',
                        tag: 'rest-timer',
                        vibrate: [500, 100, 500]
                    } as NotificationOptions);
                } catch (err) {
                    console.error(err);
                }
            }
            broadcastTimerState();
        } else {
            const completedSet = timerState.currentSet;
            timerState.currentSet++;
            timerState.phase = 'REST';
            timerState.runningState = 'PAUSED';
            timerState.endTimestamp = null;
            timerState.remaining = timerState.configRest;
            stopTimerInterval();
            if ('showNotification' in sw.registration) {
                try {
                    sw.registration.showNotification('Rest Complete', {
                        body: `Set ${completedSet} rest complete.`,
                        icon: '/favicon.png',
                        tag: 'rest-timer',
                        vibrate: [300, 100, 300]
                    } as NotificationOptions);
                } catch (err) {
                    console.error(err);
                }
            }
            broadcastTimerState();
        }
        saveSWTimerState(timerState);
        return;
    }

    if (timerState.phase === 'WORK') {
        if (timerState.currentSet >= timerState.configSets) {
            // All done
            timerState.phase = 'FINISHED';
            timerState.runningState = 'PAUSED';
            timerState.endTimestamp = null;
            stopTimerInterval();
            if ('showNotification' in sw.registration) {
                try {
                    sw.registration.showNotification('Session Complete', {
                        body: 'Nicely Done!',
                        icon: '/favicon.png',
                        tag: 'rest-timer',
                        vibrate: [500, 100, 500]
                    } as NotificationOptions);
                } catch (err) {
                    console.error(err);
                }
            }
            broadcastTimerState();
        } else {
            timerState.phase = 'REST';
            startPhase(timerState.configRest);
        }
    } else if (timerState.phase === 'REST') {
        timerState.currentSet++;
        timerState.phase = 'WORK';
        startPhase(timerState.configWork);
    }
    saveSWTimerState(timerState);
}

function startPhase(duration: number) {
    if (!timerState) return;
    timerState.runningState = 'RUNNING';
    timerState.remaining = duration;
    timerState.endTimestamp = Date.now() + (duration * 1000);
    timerState.overtimeTriggered = false;
    showTimerNotification(true);
    saveSWTimerState(timerState);
    broadcastTimerState();
}

function startTimerInterval() {
    if (timerIntervalId) clearInterval(timerIntervalId);
    timerIntervalId = setInterval(timerTick, 1000);
}

function stopTimerInterval() {
    if (timerIntervalId) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
    }
}

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
            if (key !== CACHE && key !== TIMER_CACHE_NAME) await caches.delete(key);
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

sw.addEventListener('message', (event) => {
    if (!event.data) return;

    event.waitUntil((async () => {
        await ensureInitialized();

        if (event.data.type === 'START_TIMER') {
            timerState = event.data.state;
            startTimerInterval();
            showTimerNotification(true);
            await saveSWTimerState(timerState);
        } else if (event.data.type === 'STOP_TIMER') {
            stopTimerInterval();
            timerState = null;
            await saveSWTimerState(null);
            if ('showNotification' in sw.registration) {
                try {
                    const notifications = await sw.registration.getNotifications({ tag: 'rest-timer' });
                    notifications.forEach(n => n.close());
                } catch (err) {
                    console.error(err);
                }
            }
        } else if (event.data.type === 'PAUSE_TIMER') {
            if (timerState) {
                timerState.runningState = 'PAUSED';
                timerState.endTimestamp = null;
                if (event.data.state) timerState = event.data.state;
                stopTimerInterval();
                showTimerNotification(false);
                await saveSWTimerState(timerState);
                broadcastTimerState();
            }
        } else if (event.data.type === 'RESUME_TIMER') {
            if (timerState && event.data.state) {
                timerState = event.data.state;
                startTimerInterval();
                showTimerNotification(true);
                await saveSWTimerState(timerState);
                broadcastTimerState();
            }
        } else if (event.data.type === 'SKIP_PHASE') {
            handlePhaseComplete();
        } else if (event.data.type === 'EXTEND_TIMER') {
            if (timerState) {
                timerState = event.data.state;
                showTimerNotification(false);
                await saveSWTimerState(timerState);
                broadcastTimerState();
            }
        } else if (event.data.type === 'GET_TIMER_STATE') {
            broadcastTimerState();
        }
    })());
});

sw.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil((async () => {
        await ensureInitialized();

        const allClients = await sw.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        });

        // If notification action, handle internally first
        if (event.action === 'pause') {
            if (timerState) {
                timerState.runningState = 'PAUSED';
                timerState.endTimestamp = null;
                stopTimerInterval();
                showTimerNotification(false);
                await saveSWTimerState(timerState);
                broadcastTimerState();
            }
        } else if (event.action === 'resume') {
            if (timerState && timerState.remaining !== null) {
                timerState.runningState = 'RUNNING';
                timerState.endTimestamp = Date.now() + (timerState.remaining * 1000);
                startTimerInterval();
                showTimerNotification(true);
                await saveSWTimerState(timerState);
                broadcastTimerState();
            }
        } else if (event.action === 'finish-session') {
            stopTimerInterval();
            timerState = null;
            await saveSWTimerState(null);
            broadcastTimerState();
        }

        // Also focus client
        let client = allClients.find(c => c.visibilityState === 'visible');
        if (!client && allClients.length > 0) {
            client = allClients[0];
            if ('focus' in client) await client.focus();
        } else if (!client && sw.clients.openWindow) {
            const newClient = await sw.clients.openWindow('/');
            if (newClient) client = newClient;
        }

        // Notify client of action
        if (client) {
            client.postMessage({
                type: 'TIMER_ACTION',
                action: event.action
            });
        }
    })());
});
