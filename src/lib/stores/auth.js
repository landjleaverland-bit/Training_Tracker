import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'training_tracker_api_key';

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
 * Log in with a key
 * @param {string} key 
 */
export function login(key) {
    apiKey.set(key);
}

/**
 * Log out and clear storage
 */
export function logout() {
    apiKey.set(null);
}
