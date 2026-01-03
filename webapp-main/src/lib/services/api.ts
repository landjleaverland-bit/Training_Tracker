/**
 * API service for backend communication
 * Handles requests to Cloud Function endpoints
 */

import { getApiKey } from './auth';

const API_BASE_URL = 'https://func-workout-api-825153765638.europe-west1.run.app';

/**
 * Make an authenticated API request
 */
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<{ ok: boolean; data?: T; error?: string }> {
    const apiKey = getApiKey();

    if (!apiKey) {
        return { ok: false, error: 'Not authenticated' };
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                ...options.headers
            }
        });

        if (!response.ok) {
            return { ok: false, error: `HTTP ${response.status}: ${response.statusText}` };
        }

        // Handle 204 No Content
        if (response.status === 204) {
            return { ok: true };
        }

        const data = await response.json();
        return { ok: true, data };
    } catch (err) {
        // Network error (offline, etc.)
        return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
    }
}

/**
 * Indoor Session data for API (without local-only fields)
 */
export interface IndoorSessionPayload {
    date: string;
    location: string;
    customLocation?: string;
    climbingType: string;
    trainingTypes: string[];
    difficulty?: string;
    categories?: string[];
    energySystems?: string[];
    techniqueFocuses?: string[];
    wallAngles?: string[];
    fingerLoad: number;
    shoulderLoad: number;
    forearmLoad: number;
    notes?: string;
    climbs: Array<{
        isSport: boolean;
        name: string;
        grade: string;
        attemptType: string;
        attemptsNum: number;
        notes: string;
    }>;
}

/**
 * Create a new indoor session on the server
 */
export async function createIndoorSession(
    session: IndoorSessionPayload
): Promise<{ ok: boolean; id?: string; error?: string }> {
    const result = await apiRequest<{ id: string }>('/indoor_sessions', {
        method: 'POST',
        body: JSON.stringify(session)
    });

    if (result.ok && result.data) {
        return { ok: true, id: result.data.id };
    }
    return { ok: false, error: result.error };
}

/**
 * Remote Indoor Session structure (what comes back from API)
 */
export interface RemoteIndoorSession extends IndoorSessionPayload {
    id: string;
}

/**
 * Update an indoor session
 */
export async function updateIndoorSession(
    id: string,
    session: IndoorSessionPayload
): Promise<{ ok: boolean; error?: string }> {
    return apiRequest(`/indoor_sessions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(session)
    });
}


/**
 * Get all indoor sessions from the server
 */
export async function getIndoorSessions(since?: string): Promise<{ ok: boolean; data?: RemoteIndoorSession[]; error?: string }> {
    const query = since ? `?since=${encodeURIComponent(since)}` : '';
    return apiRequest<RemoteIndoorSession[]>(`/indoor_sessions${query}`, { method: 'GET' });
}

/**
 * Delete an indoor session from the server
 */
export async function deleteIndoorSession(id: string): Promise<{ ok: boolean; error?: string }> {
    return apiRequest(`/indoor_sessions/${id}`, { method: 'DELETE' });
}

/**
 * Check if we're online
 */
export function isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Outdoor Session data for API (without local-only fields)
 */
export interface OutdoorSessionPayload {
    date: string;
    area: string;
    crag: string;
    sector?: string;
    climbingType: string;
    trainingTypes: string[];
    difficulty?: string;
    categories?: string[];
    energySystems?: string[];
    techniqueFocuses?: string[];
    fingerLoad: number;
    shoulderLoad: number;
    forearmLoad: number;
    notes?: string;
    climbs: Array<{
        isSport: boolean;
        name: string;
        grade: string;
        attemptType: string;
        attemptsNum: number;
        notes: string;
    }>;
}

/**
 * Remote Outdoor Session structure
 */
export interface RemoteOutdoorSession extends OutdoorSessionPayload {
    id: string;
}

/**
 * Create a new outdoor session on the server
 */
export async function createOutdoorSession(
    session: OutdoorSessionPayload
): Promise<{ ok: boolean; id?: string; error?: string }> {
    const result = await apiRequest<{ id: string }>('/outdoor_sessions', {
        method: 'POST',
        body: JSON.stringify(session)
    });

    if (result.ok && result.data) {
        return { ok: true, id: result.data.id };
    }
    return { ok: false, error: result.error };
}

/**
 * Update an outdoor session
 */
export async function updateOutdoorSession(
    id: string,
    session: OutdoorSessionPayload
): Promise<{ ok: boolean; error?: string }> {
    return apiRequest(`/outdoor_sessions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(session)
    });
}

/**
 * Get all outdoor sessions from the server
 */
export async function getOutdoorSessions(since?: string): Promise<{ ok: boolean; data?: RemoteOutdoorSession[]; error?: string }> {
    const query = since ? `?since=${encodeURIComponent(since)}` : '';
    return apiRequest<RemoteOutdoorSession[]>(`/outdoor_sessions${query}`, { method: 'GET' });
}

/**
 * Delete an outdoor session
 */
export async function deleteOutdoorSession(id: string): Promise<{ ok: boolean; error?: string }> {
    return apiRequest(`/outdoor_sessions/${id}`, { method: 'DELETE' });
}

/**
 * Fingerboard Session data for API
 */
export interface FingerboardSessionPayload {
    date: string;
    location: string;
    exercises: Array<{
        id: string;
        name: string;
        gripType: string;
        sets: number;
        details: Array<{
            weight: number;
            reps: number;
        }>;
        notes: string;
    }>;
}

export interface RemoteFingerboardSession extends FingerboardSessionPayload {
    id: string;
    createdAt?: string;
    updatedAt?: string;
}

export async function createFingerboardSession(
    session: FingerboardSessionPayload
): Promise<{ ok: boolean; id?: string; error?: string }> {
    const result = await apiRequest<{ id: string }>('/fingerboard_sessions', {
        method: 'POST',
        body: JSON.stringify(session)
    });

    if (result.ok && result.data) {
        return { ok: true, id: result.data.id };
    }
    return { ok: false, error: result.error };
}

/**
 * Update a fingerboard session
 */
export async function updateFingerboardSession(
    id: string,
    session: FingerboardSessionPayload
): Promise<{ ok: boolean; error?: string }> {
    return apiRequest(`/fingerboard_sessions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(session)
    });
}

export async function getFingerboardSessions(since?: string): Promise<{ ok: boolean; data?: RemoteFingerboardSession[]; error?: string }> {
    const query = since ? `?since=${encodeURIComponent(since)}` : '';
    return apiRequest<RemoteFingerboardSession[]>(`/fingerboard_sessions${query}`, { method: 'GET' });
}

/**
 * Delete a fingerboard session
 */
export async function deleteFingerboardSession(id: string): Promise<{ ok: boolean; error?: string }> {
    return apiRequest(`/fingerboard_sessions/${id}`, { method: 'DELETE' });
}

/**
 * Competition Session data for API
 */
export interface CompetitionSessionPayload {
    date: string;
    venue: string;
    customVenue?: string;
    type: string;
    fingerLoad?: number;
    shoulderLoad?: number;

    forearmLoad?: number;
    notes?: string;
    rounds: Array<{
        name: string;
        position?: number | null;
        climbs?: Array<{
            name: string;
            status: string;
            attemptCount: number;
            notes: string;
        }>;
    }>;
}

export interface RemoteCompetitionSession extends CompetitionSessionPayload {
    id: string;
    createdAt?: string;
    updatedAt?: string;
}

export async function createCompetitionSession(
    session: CompetitionSessionPayload
): Promise<{ ok: boolean; id?: string; error?: string }> {
    const result = await apiRequest<{ id: string }>('/competition_sessions', {
        method: 'POST',
        body: JSON.stringify(session)
    });

    if (result.ok && result.data) {
        return { ok: true, id: result.data.id };
    }
    return { ok: false, error: result.error };
}

/**
 * Update a competition session
 */
export async function updateCompetitionSession(
    id: string,
    session: CompetitionSessionPayload
): Promise<{ ok: boolean; error?: string }> {
    return apiRequest(`/competition_sessions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(session)
    });
}

export async function getCompetitionSessions(since?: string): Promise<{ ok: boolean; data?: RemoteCompetitionSession[]; error?: string }> {
    const query = since ? `?since=${encodeURIComponent(since)}` : '';
    return apiRequest<RemoteCompetitionSession[]>(`/competition_sessions${query}`, { method: 'GET' });
}

/**
 * Delete a competition session
 */
export async function deleteCompetitionSession(id: string): Promise<{ ok: boolean; error?: string }> {
    return apiRequest(`/competition_sessions/${id}`, { method: 'DELETE' });
}
/**
 * Gym Session data for API
 */
export interface GymSessionPayload {
    date: string;
    name: string;
    bodyweight?: number;
    exercises: Array<{
        id: string;
        name: string;
        notes?: string;
        linkedTo?: string;
        sets: Array<{
            weight: number;
            reps: number;
            isWarmup: boolean;
            isFailure: boolean;
            isDropSet: boolean;
            completed: boolean;
        }>;
    }>;
}

export interface RemoteGymSession extends GymSessionPayload {
    id: string;
    createdAt?: string;
    updatedAt?: string;
}

// Create
export async function createGymSession(
    session: GymSessionPayload
): Promise<{ ok: boolean; id?: string; error?: string }> {
    const result = await apiRequest<{ id: string }>('/gym_sessions', {
        method: 'POST',
        body: JSON.stringify(session)
    });

    if (result.ok && result.data) {
        return { ok: true, id: result.data.id };
    }
    return { ok: false, error: result.error };
}

// Update
export async function updateGymSession(
    id: string,
    session: GymSessionPayload
): Promise<{ ok: boolean; error?: string }> {
    return apiRequest(`/gym_sessions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(session)
    });
}

// Get
export async function getGymSessions(since?: string): Promise<{ ok: boolean; data?: RemoteGymSession[]; error?: string }> {
    const query = since ? `?since=${encodeURIComponent(since)}` : '';
    return apiRequest<RemoteGymSession[]>(`/gym_sessions${query}`, { method: 'GET' });
}

// Delete
export async function deleteGymSession(id: string): Promise<{ ok: boolean; error?: string }> {
    return apiRequest(`/gym_sessions/${id}`, { method: 'DELETE' });
}
