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
    trainingType: string;
    difficulty?: string;
    category?: string;
    energySystem?: string;
    techniqueFocus?: string;
    wallAngle?: string;
    fingerLoad: number;
    shoulderLoad: number;
    forearmLoad: number;
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
 * Get all indoor sessions from the server
 */
export async function getIndoorSessions(): Promise<{ ok: boolean; data?: RemoteIndoorSession[]; error?: string }> {
    return apiRequest<RemoteIndoorSession[]>('/indoor_sessions', { method: 'GET' });
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
    trainingType: string;
    difficulty?: string;
    category?: string;
    energySystem?: string;
    techniqueFocus?: string;
    fingerLoad: number;
    shoulderLoad: number;
    forearmLoad: number;
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
 * Get all outdoor sessions from the server
 */
export async function getOutdoorSessions(): Promise<{ ok: boolean; data?: RemoteOutdoorSession[]; error?: string }> {
    return apiRequest<RemoteOutdoorSession[]>('/outdoor_sessions', { method: 'GET' });
}
