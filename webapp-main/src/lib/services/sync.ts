/**
 * Sync service for synchronizing local data with the cloud
 * Handles batch sync of pending sessions
 */

import { getPendingSessions, markAsSynced, markAsSyncError } from './cache';
import { createIndoorSession, isOnline } from './api';
import type { Session, IndoorClimbSession } from '$lib/types/session';

export interface SyncResult {
    success: number;
    failed: number;
    errors: string[];
}

/**
 * Sync all pending sessions to the cloud
 */
export async function syncAllPending(): Promise<SyncResult> {
    const result: SyncResult = {
        success: 0,
        failed: 0,
        errors: []
    };

    if (!isOnline()) {
        result.errors.push('No network connection');
        return result;
    }

    const pendingSessions = getPendingSessions();

    for (const session of pendingSessions) {
        try {
            const syncResult = await syncSession(session);
            if (syncResult.ok) {
                markAsSynced(session.id);
                result.success++;
            } else {
                markAsSyncError(session.id);
                result.failed++;
                result.errors.push(`Session ${session.id}: ${syncResult.error || 'Unknown error'}`);
            }
        } catch (e) {
            markAsSyncError(session.id);
            result.failed++;
            result.errors.push(`Session ${session.id}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
    }

    return result;
}

/**
 * Sync a single session based on its type
 */
async function syncSession(session: Session): Promise<{ ok: boolean; error?: string }> {
    switch (session.activityType) {
        case 'indoor_climb':
            return syncIndoorClimbSession(session as IndoorClimbSession);
        // Add other activity types here as they're implemented
        default:
            return { ok: false, error: `Unknown activity type: ${session.activityType}` };
    }
}

/**
 * Sync an indoor climb session
 */
async function syncIndoorClimbSession(session: IndoorClimbSession): Promise<{ ok: boolean; error?: string }> {
    const payload = {
        date: session.date,
        location: session.location,
        customLocation: session.customLocation,
        climbingType: session.climbingType,
        trainingType: session.trainingType,
        difficulty: session.difficulty,
        category: session.category,
        energySystem: session.energySystem,
        techniqueFocus: session.techniqueFocus,
        wallAngle: session.wallAngle,
        fingerLoad: session.fingerLoad,
        shoulderLoad: session.shoulderLoad,
        forearmLoad: session.forearmLoad,
        climbs: session.climbs
    };

    return createIndoorSession(payload);
}

/**
 * Get count of pending sessions
 */
export function getPendingCount(): number {
    return getPendingSessions().length;
}
