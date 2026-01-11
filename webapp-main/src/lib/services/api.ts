/**
 * @file api.ts
 * @brief Main API service for interacting with Firebase Firestore.
 *
 * REFACTORED: Now utilizes `createCrudService` from `./crud.ts` and centralized types from `$lib/types/session`.
 */

import {
    createCrudService,
    getUserDocRef,
    sanitizePayload,
    handleFirestoreError
} from './crud';
import { getCurrentUserId } from './auth';
import { setDoc, getDoc, Timestamp } from 'firebase/firestore';
import type {
    IndoorClimbSession,
    IndoorSessionPayload,
    OutdoorClimbSession,
    OutdoorSessionPayload,
    FingerboardSession,
    FingerboardSessionPayload,
    CompetitionSession,
    CompetitionSessionPayload,
    GymSession,
    GymSessionPayload
} from '$lib/types/session';

// ------------------------------------------------------------------
// Indoor Sessions
// ------------------------------------------------------------------

const indoorService = createCrudService<IndoorSessionPayload, IndoorClimbSession>({
    collectionName: 'Indoor_Climbs',
    activityType: 'indoor_climb',
    getIdentifier: (s) => s.customLocation || s.location
});

export const createIndoorSession = indoorService.create;
export const updateIndoorSession = indoorService.update;
export const getIndoorSessions = indoorService.get;
export const deleteIndoorSession = indoorService.delete;


// ------------------------------------------------------------------
// Outdoor Sessions
// ------------------------------------------------------------------

const outdoorService = createCrudService<OutdoorSessionPayload, OutdoorClimbSession>({
    collectionName: 'Outdoor_Climbs',
    activityType: 'outdoor_climb',
    getIdentifier: (s) => `${s.area}_${s.crag}`
});

export const createOutdoorSession = outdoorService.create;
export const updateOutdoorSession = outdoorService.update;
export const getOutdoorSessions = outdoorService.get;
export const deleteOutdoorSession = outdoorService.delete;


// ------------------------------------------------------------------
// Fingerboard Sessions
// ------------------------------------------------------------------

const fingerboardService = createCrudService<FingerboardSessionPayload, FingerboardSession>({
    collectionName: 'Fingerboarding',
    activityType: 'fingerboarding',
    getIdentifier: () => 'Fingerboarding'
});

export const createFingerboardSession = fingerboardService.create;
export const updateFingerboardSession = fingerboardService.update;
export const getFingerboardSessions = fingerboardService.get;
export const deleteFingerboardSession = fingerboardService.delete;


// ------------------------------------------------------------------
// Competition Sessions
// ------------------------------------------------------------------

const competitionService = createCrudService<CompetitionSessionPayload, CompetitionSession>({
    collectionName: 'Competitions',
    activityType: 'competition',
    getIdentifier: (s) => s.customVenue || s.venue
});

export const createCompetitionSession = competitionService.create;
export const updateCompetitionSession = competitionService.update;
export const getCompetitionSessions = competitionService.get;
export const deleteCompetitionSession = competitionService.delete;


// ------------------------------------------------------------------
// Gym Sessions
// ------------------------------------------------------------------

const gymService = createCrudService<GymSessionPayload, GymSession>({
    collectionName: 'Gym_Sessions',
    activityType: 'gym_session',
    getIdentifier: (s) => s.name
});

export const createGymSession = gymService.create;
export const updateGymSession = gymService.update;
export const getGymSessions = gymService.get;
export const deleteGymSession = gymService.delete;


// ------------------------------------------------------------------
// Utilities
// ------------------------------------------------------------------

export function isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
}


// ------------------------------------------------------------------
// Timer Preferences (Kept separate as it uses a different ID strategy)
// ------------------------------------------------------------------

export interface TimerPreferencesPayload {
    workDuration: number;
    restDuration: number;
    allowOvertime: boolean;
}

export interface RemoteTimerPreferences extends TimerPreferencesPayload {
    id: string; // exerciseId
    updatedAt: string;
}

export async function saveTimerPreferences(exerciseId: string, preferences: TimerPreferencesPayload): Promise<{ ok: boolean; error?: string }> {
    try {
        const uid = getCurrentUserId();
        if (!uid) return { ok: false, error: 'User not authenticated' };

        const docRef = getUserDocRef('Timer_Preferences', exerciseId);
        await setDoc(docRef, {
            ...sanitizePayload(preferences),
            updatedAt: Timestamp.now()
        }, { merge: true });

        return { ok: true };
    } catch (e) {
        return handleFirestoreError(e);
    }
}

export async function getTimerPreferences(exerciseId: string): Promise<{ ok: boolean; data?: RemoteTimerPreferences; error?: string }> {
    try {
        const uid = getCurrentUserId();
        if (!uid) return { ok: false, error: 'User not authenticated' };

        const docRef = getUserDocRef('Timer_Preferences', exerciseId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                ok: true,
                data: {
                    id: docSnap.id,
                    workDuration: data.workDuration,
                    restDuration: data.restDuration,
                    allowOvertime: data.allowOvertime,
                    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
                }
            };
        }
        return { ok: true, data: undefined };
    } catch (e) {
        return handleFirestoreError(e);
    }
}
