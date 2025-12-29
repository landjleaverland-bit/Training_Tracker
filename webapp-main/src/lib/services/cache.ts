/**
 * Local cache service for session data
 * Uses localStorage with sync status tracking
 */

import type { Session, IndoorClimbSession } from '$lib/types/session';

const CACHE_KEY = 'training_tracker_sessions';

// Generate a unique ID
function generateId(): string {
    return crypto.randomUUID();
}

// Get current ISO timestamp
function now(): string {
    return new Date().toISOString();
}

/**
 * Get all sessions from local cache
 */
export function getAllSessions(): Session[] {
    if (typeof localStorage === 'undefined') return [];

    const data = localStorage.getItem(CACHE_KEY);
    if (!data) return [];

    try {
        return JSON.parse(data) as Session[];
    } catch {
        console.error('Failed to parse cached sessions');
        return [];
    }
}

/**
 * Save all sessions to local cache
 */
function saveAllSessions(sessions: Session[]): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(CACHE_KEY, JSON.stringify(sessions));
}

/**
 * Add a new session to the cache
 * Automatically sets sync status to 'pending'
 */
export function addSession(session: Omit<Session, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Session {
    const newSession: Session = {
        ...session,
        id: generateId(),
        createdAt: now(),
        updatedAt: now(),
        syncStatus: 'pending'
    } as Session;

    const sessions = getAllSessions();
    sessions.push(newSession);
    saveAllSessions(sessions);

    return newSession;
}

/**
 * Update a session in the cache
 * Sets syncStatus back to 'pending' if data changed
 */
export function updateSession(id: string, updates: Partial<Session>): Session | null {
    const sessions = getAllSessions();
    const index = sessions.findIndex(s => s.id === id);

    if (index === -1) return null;

    sessions[index] = {
        ...sessions[index],
        ...updates,
        updatedAt: now(),
        syncStatus: 'pending'  // Mark as needing sync
    };

    saveAllSessions(sessions);
    return sessions[index];
}

/**
 * Delete a session from the cache
 */
export function deleteSession(id: string): boolean {
    const sessions = getAllSessions();
    const filtered = sessions.filter(s => s.id !== id);

    if (filtered.length === sessions.length) return false;

    saveAllSessions(filtered);
    return true;
}

/**
 * Get sessions that need to be synced (pending or error)
 */
export function getPendingSessions(): Session[] {
    return getAllSessions().filter(s => s.syncStatus === 'pending' || s.syncStatus === 'error');
}

/**
 * Mark a session as synced
 */
export function markAsSynced(id: string): void {
    const sessions = getAllSessions();
    const index = sessions.findIndex(s => s.id === id);

    if (index !== -1) {
        sessions[index].syncStatus = 'synced';
        sessions[index].syncedAt = now();
        saveAllSessions(sessions);
    }
}

/**
 * Mark a session as having sync error
 */
export function markAsSyncError(id: string): void {
    const sessions = getAllSessions();
    const index = sessions.findIndex(s => s.id === id);

    if (index !== -1) {
        sessions[index].syncStatus = 'error';
        saveAllSessions(sessions);
    }
}

/**
 * Get sessions by activity type
 */
export function getSessionsByType(activityType: string): Session[] {
    return getAllSessions().filter(s => s.activityType === activityType);
}

/**
 * Helper to create an Indoor Climb session
 */
export function createIndoorClimbSession(data: {
    date: string;
    location: string;
    customLocation?: string;
    climbingType: string;
    trainingType: string;
    difficulty?: string;
    category?: string;
    energySystem?: string;
    techniqueFocus?: string;
    wallAngle?: string;
    fingerLoad: number;
    shoulderLoad: number;
    forearmLoad: number;
    climbs: IndoorClimbSession['climbs'];
}): IndoorClimbSession {
    return addSession({
        activityType: 'indoor_climb',
        ...data
    }) as IndoorClimbSession;
}
