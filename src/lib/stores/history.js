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

/**
 * Remove a specific entry from the store
 * @param {string} type 
 * @param {string} exercise_id 
 * @param {any} criteria 
 */
export function removeLog(type, exercise_id, criteria) {
    historyStore.update(current => {
        const existing = current[type] || [];
        const filtered = existing.filter((/** @type {any} */ log) => {
            // 1. Match by String exercise_id
            if (exercise_id && String(log.exercise_id) === String(exercise_id)) return false;

            // 2. Fallback match by criteria
            if (criteria) {
                const normalizeDate = (d) => (d?.value || d || '').toString().replace('T', ' ').split(' ')[0];
                const logDateOnly = normalizeDate(log.date);
                const critDateOnly = normalizeDate(criteria.date);

                const nameMatch = (log.exercise === criteria.name ||
                    log.climbs?.route === criteria.name ||
                    log.climbs?.name === criteria.name);

                const weightMatch = (Number(log.weight || log.climbs?.weight) === Number(criteria.weight));

                let locationMatch = true;
                if (criteria.location) {
                    // Normalize log location
                    let logLoc = log.location || "N/A";
                    if (typeof logLoc === "object" && logLoc !== null) {
                        if (logLoc.area || logLoc.crag) {
                            logLoc = logLoc.area ? `${logLoc.area} > ${logLoc.crag}` : logLoc.crag || "";
                            if (log.location.wall) logLoc = `${logLoc} - ${log.location.wall}`;
                        }
                    }

                    // Normalize criteria location
                    let critLoc = criteria.location;
                    if (typeof critLoc === "object" && critLoc !== null) {
                        critLoc = critLoc.area ? `${critLoc.area} > ${critLoc.crag}` : critLoc.crag || "";
                        if (criteria.location.wall) critLoc = `${critLoc} - ${criteria.location.wall}`;
                    }

                    locationMatch = (logLoc === critLoc);
                }

                if (logDateOnly === critDateOnly && nameMatch && weightMatch && locationMatch) {
                    return false;
                }
            }
            return true;
        });
        return { ...current, [type]: filtered };
    });
}

/**
 * Remove an entire session from the store
 * @param {string} type 
 * @param {any} session 
 */
export function removeSession(type, session) {
    historyStore.update((current) => {
        const existing = current[type] || [];
        const filtered = existing.filter((/** @type {any} */ log) => {
            const logDate = (log.date?.value || log.date || "").split("T")[0];
            const sessDate = (session.date?.value || session.date || "").split(
                "T",
            )[0];

            if (logDate !== sessDate) return true;

            // Normalize session_type labels for comparison
            let logSess = log.session_type || log.climbing_type || "-";
            if (type === "fingerboard") logSess = "Fingerboard";
            if (type === "outdoor") logSess = "Outdoor";

            if (logSess !== session.session) return true;

            // Normalize location for comparison
            let logLoc = log.location || "N/A";
            if (typeof logLoc === "object" && logLoc !== null) {
                if (logLoc.area || logLoc.crag) {
                    logLoc = logLoc.area
                        ? `${logLoc.area} > ${logLoc.crag}`
                        : logLoc.crag || "";
                    if (log.location.wall)
                        logLoc = `${logLoc} - ${log.location.wall}`;
                } else {
                    logLoc = JSON.stringify(logLoc);
                }
            }

            // If all match, return false to filter out
            return logLoc !== session.location;
        });
        return { ...current, [type]: filtered };
    });
}
