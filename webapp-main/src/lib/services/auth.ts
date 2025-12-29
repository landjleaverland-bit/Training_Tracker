/**
 * Authentication service
 * Stores password in localStorage, sends over HTTPS
 * Server performs SHA-256 hashing and validation
 */

const AUTH_KEY = 'training_tracker_auth';

/**
 * Store password after successful login
 */
export function login(password: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(AUTH_KEY, password);
}

/**
 * Check if user is authenticated (has stored password)
 */
export function isAuthenticated(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(AUTH_KEY) !== null;
}

/**
 * Get stored password for API requests
 */
export function getApiKey(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(AUTH_KEY);
}

/**
 * Clear stored password (logout)
 */
export function logout(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(AUTH_KEY);
}

/**
 * Verify password against backend
 * Returns true if valid, false if invalid
 */
export async function verifyPassword(password: string, apiUrl: string): Promise<boolean> {
    try {
        const response = await fetch(`${apiUrl}/verify`, {
            method: 'GET',
            headers: {
                'x-api-key': password
            }
        });
        return response.ok;
    } catch {
        // Network error - can't verify, assume invalid
        return false;
    }
}
