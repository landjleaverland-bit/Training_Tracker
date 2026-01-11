/**
 * @file auth.ts
 * @brief Authentication service using Firebase Auth.
 *
 * Replaces the old "shared secret" hash system with Firebase Authentication.
 * Handles Google Sign-In, Sign-Out, and specific user state management via Svelte stores.
 */

import { auth } from './firebase';
import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    type User
} from 'firebase/auth';
import { writable } from 'svelte/store';

// Svelte store for user state
/** Svelte writable store holding the current Firebase User object or null. */
export const user = writable<User | null>(null);
/** Svelte writable store indicating if the user is authenticated (boolean). */
export const isAuthenticated = writable<boolean>(false);
/** Svelte writable store indicating if the initial auth check is currently loading. */
export const isAuthLoading = writable<boolean>(true);

// Initialize auth state listener
if (typeof window !== 'undefined') {
    onAuthStateChanged(auth, (u) => {
        user.set(u);
        isAuthenticated.set(!!u);
        isAuthLoading.set(false);
    });
}

/**
 * @brief Sign in with Google using a popup.
 *
 * Configures the GoogleAuthProvider to prompt for account selection.
 *
 * @returns {Promise<{ ok: boolean; error?: string }>} Result object containing success status or error message.
 */
export async function loginWithGoogle(): Promise<{ ok: boolean; error?: string }> {
    try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        await signInWithPopup(auth, provider);
        return { ok: true };
    } catch (e) {
        return {
            ok: false,
            error: e instanceof Error ? e.message : 'Unknown auth error'
        };
    }
}

/**
 * @brief Sign out the current user.
 *
 * Logs out from Firebase Auth.
 * @returns {Promise<void>}
 */
export async function logout(): Promise<void> {
    try {
        await firebaseSignOut(auth);
    } catch (e) {
        console.error('Logout error:', e);
    }
}

/**
 * @brief Helper to get current user ID synchronously.
 *
 * Used primarily for internal logic where the store might not be convenient,
 * or to get the UID for API calls.
 *
 * @returns {string | null} The current user's UID or null if not signed in.
 */
export function getCurrentUserId(): string | null {
    return auth.currentUser?.uid || null;
}
