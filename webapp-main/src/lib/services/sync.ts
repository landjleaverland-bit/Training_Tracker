/**
 * Sync service for synchronizing local data with the cloud
 * Handles batch sync of pending sessions
 */

import { getPendingSessions, markAsSynced, markAsSyncError, updateSessionId } from './cache';
import {
    createIndoorSession,
    createOutdoorSession,
    createFingerboardSession,
    createCompetitionSession,
    isOnline
} from './api';
import type {
    Session,
    IndoorClimbSession,
    OutdoorClimbSession,
    FingerboardSession,
    CompetitionSession
} from '$lib/types/session';

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
                // If server returned a new ID, update local session to match
                if (syncResult.id && syncResult.id !== session.id) {
                    const updated = updateSessionId(session.id, syncResult.id);
                    if (updated) {
                        markAsSynced(syncResult.id);
                    } else {
                        // This shouldn't happen, but fallback to syncing the old ID if update failed
                        markAsSynced(session.id);
                    }
                } else {
                    markAsSynced(session.id);
                }
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
async function syncSession(session: Session): Promise<{ ok: boolean; id?: string; error?: string }> {
    switch (session.activityType) {
        case 'indoor_climb':
            return syncIndoorClimbSession(session as IndoorClimbSession);
        case 'outdoor_climb':
            return syncOutdoorSession(session as OutdoorClimbSession);
        case 'fingerboarding':
            return syncFingerboardSession(session as FingerboardSession);
        case 'competition':
            return syncCompetitionSession(session as CompetitionSession);
        default:
            return { ok: false, error: `Unknown activity type: ${(session as any).activityType}` };
    }
}

/**
 * Sync an indoor climb session
 */
async function syncIndoorClimbSession(session: IndoorClimbSession): Promise<{ ok: boolean; id?: string; error?: string }> {
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
 * Sync an outdoor climb session
 */
async function syncOutdoorSession(session: OutdoorClimbSession): Promise<{ ok: boolean; id?: string; error?: string }> {
    const payload = {
        date: session.date,
        area: session.area,
        crag: session.crag,
        sector: session.sector,
        climbingType: session.climbingType,
        trainingType: session.trainingType,
        difficulty: session.difficulty,
        category: session.category,
        energySystem: session.energySystem,
        techniqueFocus: session.techniqueFocus,
        fingerLoad: session.fingerLoad,
        shoulderLoad: session.shoulderLoad,
        forearmLoad: session.forearmLoad,
        climbs: session.climbs
    };

    return createOutdoorSession(payload);
}

/**
 * Sync a fingerboard session
 */
async function syncFingerboardSession(session: FingerboardSession): Promise<{ ok: boolean; id?: string; error?: string }> {
    const payload = {
        date: session.date,
        location: session.location,
        exercises: session.exercises
    };

    return createFingerboardSession(payload);
}

/**
 * Sync a competition session
 */
async function syncCompetitionSession(session: CompetitionSession): Promise<{ ok: boolean; id?: string; error?: string }> {
    const payload = {
        date: session.date,
        venue: session.venue,
        customVenue: session.customVenue,
        type: session.type,
        fingerLoad: session.fingerLoad,
        shoulderLoad: session.shoulderLoad,
        forearmLoad: session.forearmLoad,
        rounds: session.rounds
    };

    return createCompetitionSession(payload);
}

/**
 * Get count of pending sessions
 */
export function getPendingCount(): number {
    return getPendingSessions().length;
}
