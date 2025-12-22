import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'training_history_cache';

// Initialize from localStorage if in browser
const initialValue = browser ? JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') : {};

export const historyStore = writable(initialValue);

if (browser) {
    historyStore.subscribe(value => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    });
}

/**
 * Merge new logs into the existing history for a specific type
 * @param {string} type 
 * @param {any[]} newLogs 
 */
export function syncLogs(type, newLogs) {
    historyStore.update(current => {
        const existing = current[type] || [];

        // Create a map for deduplication
        // Key: ISO Date (without ms) + location + session_type
        // Or just map by individual entries if they have unique characteristics
        const combined = [...newLogs, ...existing];

        const uniqueMap = new Map();
        combined.forEach(log => {
            // Normalize date for comparison
            const d = log.date?.value || log.date;
            const dateStr = d ? new Date(d).toISOString() : '';

            // Generate a unique ID for the entry
            // Since BigQuery might return duplicate looking rows if we aren't careful, 
            // we use as much info as possible.
            const uniqueId = `${dateStr}|${log.location}|${log.session_type}|${JSON.stringify(log.climbs)}`;

            if (!uniqueMap.has(uniqueId)) {
                uniqueMap.set(uniqueId, log);
            }
        });

        return {
            ...current,
            [type]: Array.from(uniqueMap.values()).sort((a, b) => {
                const dA = new Date(a.date?.value || a.date);
                const dB = new Date(b.date?.value || b.date);
                return dB.getTime() - dA.getTime();
            })
        };
    });
}

/**
 * Add a single log entry (used immediately after save)
 * @param {string} type 
 * @param {any} log 
 */
export function addLog(type, log) {
    syncLogs(type, [log]);
}
