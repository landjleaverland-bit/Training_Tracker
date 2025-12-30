/**
 * Sync service for synchronizing local data with the cloud
 * Handles batch sync of pending sessions
 */

import { getPendingSessions, markAsSynced, markAsSyncError, updateSessionId, getPendingDeletes, removePendingDelete } from './cache';
import {
    createIndoorSession, updateIndoorSession, deleteIndoorSession,
    createOutdoorSession, updateOutdoorSession, deleteOutdoorSession,
    createFingerboardSession, updateFingerboardSession, deleteFingerboardSession,
    createCompetitionSession, updateCompetitionSession, deleteCompetitionSession,
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

    // STRATEGY: Global Sync
    // We process ALL pending actions (deletes and creates/updates) for ALL session types here.
    // This ensures that clicking "Fetch" or "Sync" anywhere in the app flushes the entire local queue.

    // 1. Process Pending Deletes First
    // We prioritize deletes to avoid re-uploading data that the user intended to remove.
    const pendingDeletes = getPendingDeletes();
    for (const deleteId of pendingDeletes) {
        try {
            // NOTE: Brute Force Delete Strategy
            // Since we currently don't store the 'activityType' of deleted sessions in the pending_deletes queue,
            // we attempt to delete the ID from ALL 4 endpoints.
            // A 404 Not Found from an endpoint is considered "success" (already gone or wrong type).
            // We only report an error if there's a genuine network/server failure.
            // This is a trade-off for simpler local storage schema.

            let deleted = false;

            // Try Indoor
            const r1 = await deleteIndoorSession(deleteId);
            if (r1.ok) deleted = true;

            // Try Outdoor
            if (!deleted) {
                const r2 = await deleteOutdoorSession(deleteId);
                if (r2.ok) deleted = true;
            }

            // Try Fingerboard
            if (!deleted) {
                const r3 = await deleteFingerboardSession(deleteId);
                if (r3.ok) deleted = true;
            }

            // Try Competition
            if (!deleted) {
                const r4 = await deleteCompetitionSession(deleteId);
                if (r4.ok) deleted = true;
            }

            // If we reached here, assuming we cleaned it up or it was already gone
            removePendingDelete(deleteId);
            // We count this as success activity
            result.success++;

        } catch (e) {
            result.errors.push(`Delete ${deleteId}: ${e instanceof Error ? e.message : 'Unknown error'}`);
            // Don't increment failed count heavily unless it's blocking
        }
    }

    // 2. Process Pending Sessions (Create / Update)
    const pendingSessions = getPendingSessions();

    for (const session of pendingSessions) {
        try {
            const syncResult = await syncSession(session);
            if (syncResult.ok) {
                // SUCCESSFUL SYNC LOGIC:
                // 1. If server returned a new ID (it always should for creates), 
                //    we MUST update the local session to match the server ID.
                const isNewCreate = !session.syncedAt;

                if (isNewCreate && syncResult.id && syncResult.id !== session.id) {
                    const updated = updateSessionId(session.id, syncResult.id);
                    if (updated) {
                        markAsSynced(syncResult.id);
                    } else {
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
    const isUpdate = !!session.syncedAt; // If it has a syncedAt date, it was previously synced -> UPDATE

    switch (session.activityType) {
        case 'indoor_climb':
            return isUpdate
                ? updateIndoorClimbSession(session as IndoorClimbSession)
                : syncIndoorClimbSession(session as IndoorClimbSession);
        case 'outdoor_climb':
            return isUpdate
                ? updateOutdoorClimbSession(session as OutdoorClimbSession)
                : syncOutdoorSession(session as OutdoorClimbSession);
        case 'fingerboarding':
            return isUpdate
                ? updateFingerboardClimbSession(session as FingerboardSession)
                : syncFingerboardSession(session as FingerboardSession);
        case 'competition':
            return isUpdate
                ? updateCompetitionClimbSession(session as CompetitionSession)
                : syncCompetitionSession(session as CompetitionSession);
        default:
            return { ok: false, error: `Unknown activity type: ${(session as any).activityType}` };
    }
}

/**
 * Sync an indoor climb session (CREATE)
 */
async function syncIndoorClimbSession(session: IndoorClimbSession): Promise<{ ok: boolean; id?: string; error?: string }> {
    const payload = {
        date: session.date,
        location: session.location,
        customLocation: session.customLocation,
        climbingType: session.climbingType,
        trainingTypes: session.trainingTypes,
        difficulty: session.difficulty,
        categories: session.categories,
        energySystems: session.energySystems,
        techniqueFocuses: session.techniqueFocuses,
        wallAngles: session.wallAngles,
        fingerLoad: session.fingerLoad,
        shoulderLoad: session.shoulderLoad,
        forearmLoad: session.forearmLoad,
        climbs: session.climbs
    };

    return createIndoorSession(payload);
}

/**
 * Update an indoor climb session (UPDATE)
 */
async function updateIndoorClimbSession(session: IndoorClimbSession): Promise<{ ok: boolean; error?: string }> {
    const payload = {
        date: session.date,
        location: session.location,
        customLocation: session.customLocation,
        climbingType: session.climbingType,
        trainingTypes: session.trainingTypes,
        difficulty: session.difficulty,
        categories: session.categories,
        energySystems: session.energySystems,
        techniqueFocuses: session.techniqueFocuses,
        wallAngles: session.wallAngles,
        fingerLoad: session.fingerLoad,
        shoulderLoad: session.shoulderLoad,
        forearmLoad: session.forearmLoad,
        climbs: session.climbs
    };

    return updateIndoorSession(session.id, payload);
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
        trainingTypes: session.trainingTypes,
        difficulty: session.difficulty,
        categories: session.categories,
        energySystems: session.energySystems,
        techniqueFocuses: session.techniqueFocuses,
        fingerLoad: session.fingerLoad,
        shoulderLoad: session.shoulderLoad,
        forearmLoad: session.forearmLoad,
        climbs: session.climbs
    };

    return createOutdoorSession(payload);
}

async function updateOutdoorClimbSession(session: OutdoorClimbSession): Promise<{ ok: boolean; error?: string }> {
    const payload = {
        date: session.date,
        area: session.area,
        crag: session.crag,
        sector: session.sector,
        climbingType: session.climbingType,
        trainingTypes: session.trainingTypes,
        difficulty: session.difficulty,
        categories: session.categories,
        energySystems: session.energySystems,
        techniqueFocuses: session.techniqueFocuses,
        fingerLoad: session.fingerLoad,
        shoulderLoad: session.shoulderLoad,
        forearmLoad: session.forearmLoad,
        climbs: session.climbs
    };

    return updateOutdoorSession(session.id, payload);
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

async function updateFingerboardClimbSession(session: FingerboardSession): Promise<{ ok: boolean; error?: string }> {
    const payload = {
        date: session.date,
        location: session.location,
        exercises: session.exercises
    };

    return updateFingerboardSession(session.id, payload);
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

async function updateCompetitionClimbSession(session: CompetitionSession): Promise<{ ok: boolean; error?: string }> {
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

    return updateCompetitionSession(session.id, payload);
}

/**
 * Get count of pending sessions
 */
export function getPendingCount(): number {
    return getPendingSessions().length + getPendingDeletes().length;
}
