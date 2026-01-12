/* eslint-disable no-restricted-globals */
// Web Worker for handling timer interval
// Runs in a separate thread to avoid main-thread throttling in background tabs

let intervalId: any = null;

self.addEventListener('message', (event) => {
    const { action, interval } = event.data;

    if (action === 'START') {
        if (intervalId) clearInterval(intervalId);
        // Default to 100ms or use provided interval
        const delay = interval || 100;
        intervalId = setInterval(() => {
            self.postMessage({ type: 'TICK' });
        }, delay);
    }
    else if (action === 'STOP') {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }
});

export { }; // Make it a module
