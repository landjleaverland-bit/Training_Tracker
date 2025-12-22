import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'training_tracker_api_key';
// SHA-256 Hash for the password "training"
// You can generate a new hash by running: echo -n "yourpassword" | sha256sum
const CORRECT_HASH = 'c2fb788c7deedbeaa296e424d4c2921b871a4f6cb4cf393c1c1105653ab399b4';

// Initialize from localStorage if in browser
const initialValue = browser ? localStorage.getItem(STORAGE_KEY) : null;

export const apiKey = writable(initialValue);

// Subscribe to changes and update localStorage
if (browser) {
    apiKey.subscribe(value => {
        if (value) {
            localStorage.setItem(STORAGE_KEY, value);
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    });
}

/**
 * Hash a string using SHA-256
 * @param {string} message 
 * @returns {Promise<string>}
 */
export async function hashPassword(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Attempt to log in with a plain text password
 * @param {string} password 
 * @returns {Promise<boolean>} success
 */
export async function login(password) {
    const hash = await hashPassword(password);
    if (hash === CORRECT_HASH) {
        apiKey.set(password); // Store the actual password to pass to BigQuery
        return true;
    }
    return false;
}

/**
 * Log out and clear storage
 */
export function logout() {
    apiKey.set(null);
}
