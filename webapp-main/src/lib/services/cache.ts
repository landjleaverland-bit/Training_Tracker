/**
 * Local cache service for session data
 * Uses localStorage with sync status tracking
 */

import type { Session, IndoorClimbSession, OutdoorClimbSession, FingerboardSession, CompetitionSession } from '$lib/types/session';

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
    } as Session;

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

/**
 * Helper to create an Outdoor Climb session
 */
export function createOutdoorClimbSession(data: {
    date: string;
    area: string;
    crag: string;
    sector?: string;
    climbingType: string;
    trainingType: string;
    difficulty?: string;
    category?: string;
    energySystem?: string;
    techniqueFocus?: string;
    fingerLoad: number;
    shoulderLoad: number;
    forearmLoad: number;
    climbs: OutdoorClimbSession['climbs'];
}): OutdoorClimbSession {
    return addSession({
        activityType: 'outdoor_climb',
        ...data
    }) as OutdoorClimbSession;
}


/**
 * Helper to create a Fingerboard session
 */
export function createFingerboardSession(data: {
    date: string;
    location: string;
    exercises: FingerboardSession['exercises'];
}): FingerboardSession {
    return addSession({
        activityType: 'fingerboarding',
        ...data
    }) as FingerboardSession;
}

/**
 * Helper to create a Competition session
 */
export function createCompetitionSession(data: {
    date: string;
    venue: string;
    customVenue?: string;
    type: 'Bouldering' | 'Lead' | 'Speed';
    fingerLoad?: number;
    shoulderLoad?: number;
    forearmLoad?: number;
    rounds: CompetitionSession['rounds'];
}): CompetitionSession {
    return addSession({
        activityType: 'competition',
        ...data
    }) as CompetitionSession;
}

/**
 * Get all Fingerboard sessions
 */
export function getFingerboardSessions(): FingerboardSession[] {
    return getSessionsByType('fingerboarding') as FingerboardSession[];
}

/**
 * Get all Competition sessions
 */
export function getCompetitionSessions(): CompetitionSession[] {
    return getSessionsByType('competition') as CompetitionSession[];
}
/**
 * Merge remote sessions into local cache
 * 
 * STRATEGY: "Local-First, Server-Augmented"
 * 1. We fetch all sessions from the server.
 * 2. We iterate through them and check if they exist locally by ID.
 * 3. If a session ID is NOT found locally, we add it. This handles:
 *    - Data created on other devices.
 *    - Data restored after clearing local storage (if fetched from server).
 * 4. If a session ID IS found locally, we SKIP it. We do NOT update it.
 *    - WHY: This protects local, unsynced changes. If a user edits a session offline,
 *      we don't want a stale remote version to overwrite their work before it syncs.
 *    - TRADE-OFF: If the session was updated on another device, this device won't see 
 *      the update until the local conflict is resolved (currently no complex resolution, 
 *      local simply wins).
 * 
 * @param remoteSessions List of sessions fetched from the backend
 */
export function mergeSessions(remoteSessions: Session[]): void {
    const localSessions = getAllSessions();
    const localIds = new Set(localSessions.map(s => s.id));
    let hasChanges = false;

    for (const remote of remoteSessions) {
        if (!localIds.has(remote.id)) {
            // It's a new session we don't have locally
            localSessions.push({
                ...remote,
                syncStatus: 'synced', // It came from remote, so it's synced
                syncedAt: now()
            } as Session);
            hasChanges = true;
        } else {
            // Collision detected. 
            // Current policy: Local wins. Ignore remote.
            // This implicitly handles the case where we just created a session, 
            // synced it (getting a new ID), but maybe the fetch happened before 
            // the ID swap completed? No, ID swap happens immediately after create.
            // 
            // Scenario: 
            // 1. App loads, has Session A (id: UUID-1).
            // 2. Sync runs -> POST to backend -> Backend returns ID: Firestore-1.
            // 3. updateSessionId(UUID-1, Firestore-1) runs. Local ID is now Firestore-1.
            // 4. Fetch runs. Returns Session A (id: Firestore-1).
            // 5. mergeSessions sees Firestore-1 exists locally. Skips.
            // Result: Correct.
        }
    }

    if (hasChanges) {
        saveAllSessions(localSessions);
    }
}

/**
 * Update a session's ID
 * 
 * CRITICAL for the Sync Workflow:
 * When we create a session locally, we assign a temporary UUID (e.g., "local-123").
 * When we sync this to the backend (Firestore), the backend assigns a permanent ID (e.g., "doc-abc").
 * We MUST update the local record to use the backend ID so that:
 * 1. Future updates target the correct document.
 * 2. We don't ingest the same session as a "new" session next time we fetch from remote.
 * 
 * @param oldId The temporary local UUID
 * @param newId The permanent backend ID
 */
export function updateSessionId(oldId: string, newId: string): boolean {
    const sessions = getAllSessions();
    const index = sessions.findIndex(s => s.id === oldId);

    if (index === -1) return false;

    // Check if new ID already exists (shouldn't happen, but safety first)
    if (sessions.some(s => s.id === newId)) {
        console.warn('Cannot update session ID: new ID already exists');
        return false;
    }

    sessions[index] = {
        ...sessions[index],
        id: newId
    };

    saveAllSessions(sessions);
    return true;
}

