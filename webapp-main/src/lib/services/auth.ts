/**
 * Authentication service
 * Uses client-side hash comparison for login
 * Stores plain password in localStorage for API calls
 */

const AUTH_KEY = 'training_tracker_auth';

// Expected password hash (SHA-256)
// Generate with: ./scripts/generate-password-hash.sh
const EXPECTED_PASSWORD_HASH = 'c2fb788c7deedbeaa296e424d4c2921b871a4f6cb4cf393c1c1105653ab399b4';

/**
 * Hash a password using SHA-256
 */
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify password by comparing hashes
 * Returns true if password is correct
 */
export async function verifyPassword(password: string): Promise<boolean> {
    const inputHash = await hashPassword(password);
    return inputHash === EXPECTED_PASSWORD_HASH;
}

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
