/**
 * Authentication service using Firebase Auth
 * Replaces the old "shared secret" hash system
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
export const user = writable<User | null>(null);
export const isAuthenticated = writable<boolean>(false);
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
 * Sign in with Google
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
 * Sign out
 */
export async function logout(): Promise<void> {
    try {
        await firebaseSignOut(auth);
    } catch (e) {
        console.error('Logout error:', e);
    }
}

/**
 * Helper to get current user ID (for security rules if needed)
 */
export function getCurrentUserId(): string | null {
    return auth.currentUser?.uid || null;
}
